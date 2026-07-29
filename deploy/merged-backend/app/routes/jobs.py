from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, model_validator
from sqlalchemy import cast, or_, select, String
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.db import (
    Application,
    ApplicationStatus,
    Embedding,
    EmbeddingEntity,
    Job,
    JobStatus,
    Recruiter,
)
from app.routes.auth import get_current_user, get_optional_user
from app.services.embedding import _build_embedding_text, _content_hash, generate_embedding

router = APIRouter(prefix="/api/v1/jobs", tags=["jobs"])




class JobCreate(BaseModel):
    recruiter_id: uuid.UUID | None = None
    title: str
    description: str
    requirements: str = ""
    location: str = ""
    department: str = ""
    employment_type: str = "full-time"
    salary_min: int | None = None
    salary_max: int | None = None
    salary_currency: str = "USD"
    skills: list[str] = []
    benefits: list[str] = []
    responsibilities: list[str] = []
    is_remote: bool = False
    team_size: int | None = None
    max_applicants: int | None = None


class JobUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    requirements: str | None = None
    location: str | None = None
    status: str | None = None
    department: str | None = None
    employment_type: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    salary_currency: str | None = None
    skills: list[str] | None = None
    benefits: list[str] | None = None
    responsibilities: list[str] | None = None
    is_remote: bool | None = None
    team_size: int | None = None
    max_applicants: int | None = None


class JobOut(BaseModel):
    id: uuid.UUID
    recruiter_id: uuid.UUID
    title: str
    description: str
    requirements: str
    location: str
    status: JobStatus
    created_at: Any = None
    department: str = ""
    employment_type: str = "full-time"
    salary_min: int | None = None
    salary_max: int | None = None
    salary_currency: str = "USD"
    skills: list[str] = []
    benefits: list[str] = []
    responsibilities: list[str] = []
    is_remote: bool = False
    team_size: int | None = None
    max_applicants: int | None = None

    model_config = {"from_attributes": True}

    @model_validator(mode="after")
    def _serialize_created_at(self):
        if self.created_at is not None and hasattr(self.created_at, "isoformat"):
            self.created_at = self.created_at.isoformat()
        return self


class JobApplicantOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    candidate_name: str
    candidate_email: str
    ai_score: float
    ai_summary: str
    status: ApplicationStatus
    applied_at: Any = None
    resume_snapshot: dict = {}

    model_config = {"from_attributes": True}

    @model_validator(mode="after")
    def _serialize_applied_at(self):
        if self.applied_at is not None and hasattr(self.applied_at, "isoformat"):
            self.applied_at = self.applied_at.isoformat()
        return self




def _require_recruiter(user):
    if user.role != "recruiter":
        raise HTTPException(403, "Recruiter access required")
    if not user.recruiter_id:
        raise HTTPException(400, "No recruiter profile linked to this account")
    return user.recruiter_id




@router.post("", response_model=JobOut, status_code=201)
async def create_job(
    payload: JobCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    recruiter_id = _require_recruiter(user)

    job = Job(
        recruiter_id=recruiter_id,
        title=payload.title,
        description=payload.description,
        requirements=payload.requirements,
        location=payload.location,
        department=payload.department,
        employment_type=payload.employment_type,
        salary_min=payload.salary_min,
        salary_max=payload.salary_max,
        salary_currency=payload.salary_currency,
        skills=payload.skills,
        benefits=payload.benefits,
        responsibilities=payload.responsibilities,
        is_remote=payload.is_remote,
        team_size=payload.team_size,
        max_applicants=payload.max_applicants,
    )
    db.add(job)
    await db.flush()

    emb_text = _build_embedding_text("job", payload.model_dump())
    emb = await generate_embedding(emb_text)
    db.add(
        Embedding(
            entity_type=EmbeddingEntity.job,
            entity_id=job.id,
            embedding=emb,
            content_hash=_content_hash(emb_text),
        )
    )
    await db.commit()
    await db.refresh(job)
    return job


@router.get("", response_model=list[JobOut])
async def list_jobs(
    status: str | None = None,
    q: str | None = None,
    city: str | None = None,
    employment_type: str | None = None,
    is_remote: bool | None = None,
    mine: bool = False,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_optional_user),
):
    stmt = select(Job).order_by(Job.created_at.desc()).limit(limit)

    if mine and user and user.role == "recruiter" and user.recruiter_id:
        stmt = stmt.where(Job.recruiter_id == user.recruiter_id)

    if status:
        stmt = stmt.where(Job.status == status)
    if q:
        words = q.strip().split()
        for word in words:
            pattern = f"%{word}%"
            stmt = stmt.where(
                or_(
                    Job.title.ilike(pattern),
                    Job.description.ilike(pattern),
                    Job.requirements.ilike(pattern),
                    cast(Job.skills, String).ilike(pattern),
                )
            )
    if city:
        stmt = stmt.where(Job.location.ilike(f"%{city}%"))
    if employment_type:
        stmt = stmt.where(Job.employment_type == employment_type)
    if is_remote is not None:
        stmt = stmt.where(Job.is_remote == is_remote)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/{job_id}", response_model=JobOut)
async def get_job(job_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(404, "Job not found")
    return job


@router.patch("/{job_id}", response_model=JobOut)
async def update_job(
    job_id: uuid.UUID,
    payload: JobUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    recruiter_id = _require_recruiter(user)

    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(404, "Job not found")
    if job.recruiter_id != recruiter_id:
        raise HTTPException(403, "You can only edit your own jobs")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(job, field, value)

    if update_data:
        emb_fields = ["title", "description", "requirements", "responsibilities", "skills"]
        if any(f in update_data for f in emb_fields):
            emb_data = {
                "title": job.title,
                "description": job.description,
                "requirements": job.requirements,
                "responsibilities": job.responsibilities or [],
                "skills": job.skills or [],
            }
            emb_text = _build_embedding_text("job", emb_data)
            emb = await generate_embedding(emb_text)
            existing = await db.execute(
                select(Embedding).where(
                    Embedding.entity_type == EmbeddingEntity.job,
                    Embedding.entity_id == job.id,
                )
            )
            existing_emb = existing.scalar_one_or_none()
            if existing_emb:
                existing_emb.embedding = emb
                existing_emb.content_hash = _content_hash(emb_text)
            else:
                db.add(
                    Embedding(
                        entity_type=EmbeddingEntity.job,
                        entity_id=job.id,
                        embedding=emb,
                        content_hash=_content_hash(emb_text),
                    )
                )

    await db.commit()
    await db.refresh(job)
    return job


@router.delete("/{job_id}", status_code=204)
async def delete_job(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    recruiter_id = _require_recruiter(user)

    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(404, "Job not found")
    if job.recruiter_id != recruiter_id:
        raise HTTPException(403, "You can only delete your own jobs")

    await db.execute(
        select(Embedding).where(
            Embedding.entity_type == EmbeddingEntity.job,
            Embedding.entity_id == job.id,
        )
    )
    await db.delete(job)
    await db.commit()


@router.get("/{job_id}/applicants", response_model=list[JobApplicantOut])
async def list_job_applicants(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    recruiter_id = _require_recruiter(user)

    job_result = await db.execute(select(Job).where(Job.id == job_id))
    job = job_result.scalar_one_or_none()
    if not job:
        raise HTTPException(404, "Job not found")
    if job.recruiter_id != recruiter_id:
        raise HTTPException(403, "You can only view applicants for your own jobs")

    stmt = (
        select(Application)
        .options(selectinload(Application.user))
        .where(Application.job_id == job_id)
        .order_by(Application.applied_at.desc())
    )
    result = await db.execute(stmt)
    applications = list(result.scalars().all())

    items = []
    for app in applications:
        app_user = app.user
        items.append(
            JobApplicantOut(
                id=app.id,
                user_id=app.user_id,
                candidate_name=f"{app_user.first_name} {app_user.last_name}".strip() if app_user else "Unknown",
                candidate_email=app_user.email if app_user else "",
                ai_score=app.ai_score,
                ai_summary=app.ai_summary,
                status=app.status,
                applied_at=app.applied_at,
                resume_snapshot=app.resume_snapshot or {},
            )
        )
    return items
