from __future__ import annotations

import logging
import uuid

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, model_validator
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.db import Application, ApplicationStatus, Embedding, EmbeddingEntity, Job, User
from app.services.embedding import _build_embedding_text, _content_hash, generate_embedding
from app.services.matching import score_candidate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/users", tags=["users"])


class UserCreate(BaseModel):
    email: str
    first_name: str
    last_name: str
    phone: str = ""


class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    first_name: str
    last_name: str
    phone: str
    model_config = {"from_attributes": True}


class ApplicationIn(BaseModel):
    job_id: uuid.UUID
    resume_data: dict = {}


class ApplicationOut(BaseModel):
    id: uuid.UUID
    job_id: uuid.UUID
    user_id: uuid.UUID
    ai_score: float
    ai_summary: str
    ai_strengths: list[str] = []
    ai_gaps: list[str] = []
    applied_at: Any = None
    status: ApplicationStatus = ApplicationStatus.pending
    model_config = {"from_attributes": True}

    @model_validator(mode="after")
    def _serialize_applied_at(self):
        if self.applied_at is not None and hasattr(self.applied_at, "isoformat"):
            self.applied_at = self.applied_at.isoformat()
        return self


@router.post("", response_model=UserOut, status_code=201)
async def create_user(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    existing = result.scalar_one_or_none()
    if existing:
        changed = False
        for field in ("first_name", "last_name", "phone"):
            val = getattr(payload, field)
            if val and getattr(existing, field) != val:
                setattr(existing, field, val)
                changed = True
        if changed:
            await db.commit()
            await db.refresh(existing)
        return existing

    user = User(**payload.model_dump())
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/{user_id}", response_model=UserOut)
async def get_user(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    return user


@router.post("/{user_id}/apply", response_model=ApplicationOut, status_code=201)
async def apply_to_job(
    user_id: uuid.UUID,
    payload: ApplicationIn,
    db: AsyncSession = Depends(get_db),
):
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")

    job_result = await db.execute(select(Job).where(Job.id == payload.job_id))
    job = job_result.scalar_one_or_none()
    if not job:
        raise HTTPException(404, "Job not found")

    dup = await db.execute(
        select(Application).where(
            Application.job_id == payload.job_id,
            Application.user_id == user_id,
        )
    )
    if dup.scalar_one_or_none():
        raise HTTPException(409, "Already applied to this job")

    application = Application(
        job_id=payload.job_id,
        user_id=user_id,
        resume_snapshot=payload.resume_data,
    )
    db.add(application)
    await db.flush()

    text_emb = _build_embedding_text("user", payload.resume_data)
    emb = await generate_embedding(text_emb)
    new_hash = _content_hash(text_emb)
    existing_emb = await db.execute(
        select(Embedding).where(
            Embedding.entity_type == EmbeddingEntity.user,
            Embedding.entity_id == user_id,
        )
    )
    existing = existing_emb.scalar_one_or_none()
    if existing:
        existing.embedding = emb
        existing.content_hash = new_hash
    else:
        db.add(
            Embedding(
                entity_type=EmbeddingEntity.user,
                entity_id=user_id,
                embedding=emb,
                content_hash=new_hash,
            )
        )
    await db.flush()

    try:
        job_emb_result = await db.execute(
            select(Embedding).where(
                Embedding.entity_type == EmbeddingEntity.job,
                Embedding.entity_id == payload.job_id,
            )
        )
        job_embedding = job_emb_result.scalar_one_or_none()
        if job_embedding:
            sim_result = await db.execute(
                text("""
                    SELECT 1 - (embedding <=> CAST(:qvec AS vector)) AS similarity
                    FROM embeddings
                    WHERE entity_type = 'user' AND entity_id = :user_id
                """),
                {"qvec": str(job_embedding.embedding), "user_id": str(user_id)},
            )
            row = sim_result.first()
            if row:
                application.ai_score = float(row.similarity)

        score_result = await score_candidate(job, application)
        gpt_score = score_result.get("score", application.ai_score)
        application.ai_score = gpt_score / 100.0 if gpt_score > 1 else gpt_score
        application.ai_summary = score_result.get("summary", "")
        application.ai_strengths = score_result.get("strengths", [])
        application.ai_gaps = score_result.get("gaps", [])
    except Exception:
        logger.exception("Auto-scoring failed for application, continuing without score")

    await db.commit()
    await db.refresh(application)
    return application


@router.get("/{user_id}/applications", response_model=list[ApplicationOut])
async def list_applications(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Application).where(Application.user_id == user_id)
    )
    return list(result.scalars().all())
