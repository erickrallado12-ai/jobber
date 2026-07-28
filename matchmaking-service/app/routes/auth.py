from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models.db import Recruiter, User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

JWT_SECRET = settings.jwt_secret
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 72


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def _check_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def _create_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")


async def get_current_user(
    authorization: str = Header(None),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Not authenticated")
    token = authorization.split(" ", 1)[1]
    payload = _decode_token(token)
    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(401, "User not found")
    return user


async def get_optional_user(
    authorization: str = Header(None),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        token = authorization.split(" ", 1)[1]
        payload = _decode_token(token)
        user_id = payload.get("sub")
        result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
        return result.scalar_one_or_none()
    except HTTPException:
        return None




class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone: str = ""
    role: str = "candidate"
    company: str = ""


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleLoginRequest(BaseModel):
    id_token: str
    role: str = "candidate"


class AuthResponse(BaseModel):
    token: str
    user: dict


def _user_response(user: User) -> dict:
    return {
        "id": str(user.id),
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone": user.phone,
        "role": user.role,
        "company": user.company,
        "recruiter_id": str(user.recruiter_id) if user.recruiter_id else None,
    }




@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(409, "Email already registered")

    if payload.role not in ("candidate", "recruiter"):
        raise HTTPException(400, "Role must be 'candidate' or 'recruiter'")

    user = User(
        email=payload.email,
        first_name=payload.first_name,
        last_name=payload.last_name,
        phone=payload.phone,
        password_hash=_hash_password(payload.password),
        role=payload.role,
        company=payload.company,
    )

    if payload.role == "recruiter" and payload.company:
        recruiter = Recruiter(
            email=payload.email,
            first_name=payload.first_name,
            last_name=payload.last_name,
            company=payload.company,
        )
        db.add(recruiter)
        await db.flush()
        user.recruiter_id = recruiter.id

    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = _create_token(str(user.id), user.role)
    return AuthResponse(token=token, user=_user_response(user))


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    if not user or not user.password_hash:
        raise HTTPException(401, "Invalid email or password")

    if not _check_password(payload.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password")

    token = _create_token(str(user.id), user.role)
    return AuthResponse(token=token, user=_user_response(user))


@router.post("/google", response_model=AuthResponse)
async def google_auth(payload: GoogleLoginRequest, db: AsyncSession = Depends(get_db)):
    import httpx
    import jwt as pyjwt

    try:
        unverified = pyjwt.decode(payload.id_token, options={"verify_signature": False})
    except Exception:
        raise HTTPException(401, "Invalid Google token: cannot decode")

    project_id = unverified.get("firebase", {}).get("projects", "jobber-aabc8")

    async with httpx.AsyncClient() as client:
        keys_resp = await client.get(
            "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
        )
    if keys_resp.status_code != 200:
        raise HTTPException(502, "Failed to fetch Google public keys")

    certs = keys_resp.json()

    header = pyjwt.get_unverified_header(payload.id_token)
    kid = header.get("kid")
    if kid not in certs:
        raise HTTPException(401, "Invalid Google token: unknown key")

    from cryptography.x509 import load_pem_x509_certificate
    from cryptography.hazmat.primitives.serialization import Encoding

    cert = load_pem_x509_certificate(certs[kid].encode())
    public_key = cert.public_key()

    try:
        google_data = pyjwt.decode(
            payload.id_token,
            public_key,
            algorithms=["RS256"],
            audience=unverified.get("aud"),
        )
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(401, "Google token expired")
    except pyjwt.InvalidTokenError as e:
        raise HTTPException(401, f"Invalid Google token: {e}")

    google_id = google_data.get("sub")
    email = google_data.get("email")
    given_name = google_data.get("given_name", "")
    family_name = google_data.get("family_name", "")
    full_name = google_data.get("name", "")

    if not given_name and full_name:
        parts = full_name.strip().split(None, 1)
        given_name = parts[0] if parts else ""
        family_name = parts[1] if len(parts) > 1 else ""

    if not email or not google_id:
        raise HTTPException(401, "Invalid Google token data")

    result = await db.execute(select(User).where(User.google_id == google_id))
    user = result.scalar_one_or_none()

    if not user:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user:
            user.google_id = google_id
            if not user.first_name or user.first_name in ("Google", "User"):
                user.first_name = given_name or user.first_name
            if not user.last_name or user.last_name in ("Google", "User"):
                user.last_name = family_name or user.last_name
        else:
            role = payload.role if payload.role in ("candidate", "recruiter") else "candidate"
            user = User(
                email=email,
                first_name=given_name or "Candidate",
                last_name=family_name or "",
                google_id=google_id,
                role=role,
            )
            db.add(user)

    await db.commit()
    await db.refresh(user)

    token = _create_token(str(user.id), user.role)
    return AuthResponse(token=token, user=_user_response(user))


@router.get("/me")
async def get_me(user: User = Depends(get_current_user)):
    return _user_response(user)
