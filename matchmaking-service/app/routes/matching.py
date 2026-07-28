from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.db import Application, Job
from app.services.matching import find_similar_candidates, score_candidate

router = APIRouter(prefix="/api/v1/match", tags=["matching"])


class ScoreResult(BaseModel):
    application_id: uuid.UUID
    score: float
    summary: str
    strengths: list[str] = []
    gaps: list[str] = []


class CandidateMatch(BaseModel):
    user_id: str
    similarity: float
    score: float = 0.0
    summary: str = ""


class MatchResponse(BaseModel):
    job_id: uuid.UUID
    candidates: list[CandidateMatch]




@router.post("/score/{application_id}", response_model=ScoreResult)
async def score_application(
    application_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    app_result = await db.execute(
        select(Application).where(Application.id == application_id)
    )
    application = app_result.scalar_one_or_none()
    if not application:
        raise HTTPException(404, "Application not found")

    job_result = await db.execute(select(Job).where(Job.id == application.job_id))
    job = job_result.scalar_one_or_none()
    if not job:
        raise HTTPException(404, "Job not found")

    result = await score_candidate(job, application)

    application.ai_score = result.get("score", 0)
    application.ai_summary = result.get("summary", "")
    await db.commit()

    return ScoreResult(
        application_id=application.id,
        score=result.get("score", 0),
        summary=result.get("summary", ""),
        strengths=result.get("strengths", []),
        gaps=result.get("gaps", []),
    )




@router.get("/candidates/{job_id}", response_model=MatchResponse)
async def get_top_candidates(
    job_id: uuid.UUID,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
):
    candidates = await find_similar_candidates(db, job_id, limit)
    return MatchResponse(job_id=job_id, candidates=[
        CandidateMatch(**c) for c in candidates
    ])
