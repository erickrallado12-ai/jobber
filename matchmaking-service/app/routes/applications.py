from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, model_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.db import Application, ApplicationStatus, Job

router = APIRouter(prefix="/api/v1/applications", tags=["applications"])


class ApplicationListItem(BaseModel):
    id: uuid.UUID
    job_id: uuid.UUID
    candidate_name: str
    candidate_email: str
    job_title: str
    job_location: str
    job_employment_type: str = ""
    job_salary_min: int | None = None
    job_salary_max: int | None = None
    job_salary_currency: str = "USD"
    job_skills: list[str] = []
    job_is_remote: bool = False
    job_department: str = ""
    ai_score: float = 0.0
    ai_summary: str = ""
    ai_strengths: list[str] = []
    ai_gaps: list[str] = []
    status: ApplicationStatus
    applied_at: Any = None
    resume_data: dict = {}

    model_config = {"from_attributes": True}

    @model_validator(mode="after")
    def _serialize_applied_at(self):
        if self.applied_at is not None and hasattr(self.applied_at, "isoformat"):
            self.applied_at = self.applied_at.isoformat()
        return self


class ApplicationStats(BaseModel):
    total: int
    pending: int
    reviewing: int
    shortlisted: int
    interviewing: int
    offered: int
    rejected: int
    withdrawn: int


async def _get_recruiter_job_ids(user, db: AsyncSession) -> list[uuid.UUID]:
    result = await db.execute(
        select(Job.id).where(Job.recruiter_id == user.recruiter_id)
    )
    return [row[0] for row in result.all()]


@router.get("/stats", response_model=ApplicationStats)
async def get_application_stats(
    db: AsyncSession = Depends(get_db),
    user=Depends(__import__("app.routes.auth", fromlist=["get_current_user"]).get_current_user),
):
    if user.role != "recruiter" or not user.recruiter_id:
        return ApplicationStats(total=0, pending=0, reviewing=0, shortlisted=0, interviewing=0, offered=0, rejected=0, withdrawn=0)

    job_ids = await _get_recruiter_job_ids(user, db)
    if not job_ids:
        return ApplicationStats(total=0, pending=0, reviewing=0, shortlisted=0, interviewing=0, offered=0, rejected=0, withdrawn=0)

    result = await db.execute(
        select(Application).where(Application.job_id.in_(job_ids))
    )
    apps = list(result.scalars().all())

    counts: dict[str, int] = {}
    for status in ApplicationStatus:
        counts[status.value] = 0
    for app in apps:
        counts[app.status.value] = counts.get(app.status.value, 0) + 1

    return ApplicationStats(
        total=len(apps),
        pending=counts.get("pending", 0),
        reviewing=counts.get("reviewing", 0),
        shortlisted=counts.get("shortlisted", 0),
        interviewing=counts.get("interviewing", 0),
        offered=counts.get("offered", 0),
        rejected=counts.get("rejected", 0),
        withdrawn=counts.get("withdrawn", 0),
    )


@router.get("", response_model=list[ApplicationListItem])
async def list_all_applications(
    status: str | None = None,
    search: str | None = None,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    user=Depends(__import__("app.routes.auth", fromlist=["get_current_user"]).get_current_user),
):
    if user.role == "recruiter" and user.recruiter_id:
        job_ids = await _get_recruiter_job_ids(user, db)
        if not job_ids:
            return []
        stmt = (
            select(Application)
            .options(selectinload(Application.user), selectinload(Application.job))
            .where(Application.job_id.in_(job_ids))
            .order_by(Application.applied_at.desc())
        )
    else:
        stmt = (
            select(Application)
            .options(selectinload(Application.user), selectinload(Application.job))
            .where(Application.user_id == user.id)
            .order_by(Application.applied_at.desc())
        )

    if status and status != "all":
        stmt = stmt.where(Application.status == status)

    result = await db.execute(stmt)
    applications = list(result.scalars().all())

    items: list[dict] = []
    for app in applications:
        app_user = app.user
        job = app.job

        candidate_name = f"{app_user.first_name} {app_user.last_name}".strip() if app_user else "Unknown"
        candidate_email = app_user.email if app_user else ""
        job_title = job.title if job else "Unknown"
        job_location = job.location if job else ""

        if search:
            search_lower = search.lower()
            if (
                search_lower not in candidate_name.lower()
                and search_lower not in candidate_email.lower()
                and search_lower not in job_title.lower()
            ):
                continue

        items.append({
            "id": app.id,
            "job_id": app.job_id,
            "candidate_name": candidate_name,
            "candidate_email": candidate_email,
            "job_title": job_title,
            "job_location": job_location,
            "job_employment_type": job.employment_type if job else "",
            "job_salary_min": job.salary_min if job else None,
            "job_salary_max": job.salary_max if job else None,
            "job_salary_currency": job.salary_currency if job else "USD",
            "job_skills": job.skills if job else [],
            "job_is_remote": job.is_remote if job else False,
            "job_department": job.department if job else "",
            "ai_score": app.ai_score,
            "ai_summary": app.ai_summary or "",
            "ai_strengths": app.ai_strengths or [],
            "ai_gaps": app.ai_gaps or [],
            "status": app.status,
            "applied_at": app.applied_at,
            "resume_data": app.resume_snapshot or {},
        })

    return items[:limit]


@router.get("/{application_id}", response_model=ApplicationListItem)
async def get_application(
    application_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(__import__("app.routes.auth", fromlist=["get_current_user"]).get_current_user),
):
    result = await db.execute(
        select(Application)
        .options(selectinload(Application.user), selectinload(Application.job))
        .where(Application.id == application_id)
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if user.role == "recruiter":
        if not user.recruiter_id:
            raise HTTPException(403, "No recruiter profile")
        job = app.job
        if not job or job.recruiter_id != user.recruiter_id:
            raise HTTPException(403, "Access denied")
    else:
        if app.user_id != user.id:
            raise HTTPException(403, "Access denied")

    app_user = app.user
    job = app.job
    return {
        "id": app.id,
        "job_id": app.job_id,
        "candidate_name": f"{app_user.first_name} {app_user.last_name}".strip() if app_user else "Unknown",
        "candidate_email": app_user.email if app_user else "",
        "job_title": job.title if job else "Unknown",
        "job_location": job.location if job else "",
        "job_employment_type": job.employment_type if job else "",
        "job_salary_min": job.salary_min if job else None,
        "job_salary_max": job.salary_max if job else None,
        "job_salary_currency": job.salary_currency if job else "USD",
        "job_skills": job.skills if job else [],
        "job_is_remote": job.is_remote if job else False,
        "job_department": job.department if job else "",
        "ai_score": app.ai_score,
        "ai_summary": app.ai_summary or "",
        "ai_strengths": app.ai_strengths or [],
        "ai_gaps": app.ai_gaps or [],
        "status": app.status,
        "applied_at": app.applied_at,
        "resume_data": app.resume_snapshot or {},
    }


class UpdateApplicationStatus(BaseModel):
    status: ApplicationStatus


@router.patch("/{application_id}")
async def update_application_status(
    application_id: str,
    body: UpdateApplicationStatus,
    db: AsyncSession = Depends(get_db),
    user=Depends(__import__("app.routes.auth", fromlist=["get_current_user"]).get_current_user),
):
    if user.role != "recruiter" or not user.recruiter_id:
        raise HTTPException(403, "Recruiter access required")

    result = await db.execute(
        select(Application)
        .options(selectinload(Application.job))
        .where(Application.id == application_id)
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    job = app.job
    if not job or job.recruiter_id != user.recruiter_id:
        raise HTTPException(403, "Access denied")

    app.status = body.status
    await db.commit()
    return {"id": str(app.id), "status": app.status.value}
