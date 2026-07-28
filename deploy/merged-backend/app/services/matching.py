from __future__ import annotations

import json
import logging

from openai import AsyncOpenAI
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.db import Application, Embedding, EmbeddingEntity, Job

logger = logging.getLogger(__name__)

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.openai_api_key)
    return _client


SCORING_PROMPT = """\
You are an expert talent acquisition AI. Given a job description and a candidate's \
resume, score the candidate from 0 to 100 based on how well they match the job.

Scoring criteria:
- Skills match (30%): How well the candidate's skills align with requirements
- Experience relevance (30%): How relevant their work experience is
- Education fit (15%): Whether their education background fits
- Seniority match (15%): Whether their seniority level matches the role
- Location/other fit (10%): Any other relevant factors

Return ONLY valid JSON with this structure:
{
    "score": <number 0-100>,
    "summary": "<2-3 sentence recommendation>",
    "strengths": ["<strength1>", "<strength2>"],
    "gaps": ["<gap1>", "<gap2>"]
}
"""


async def score_candidate(job: Job, application: Application) -> dict:
    client = _get_client()

    job_text = f"Job: {job.title}\n\nDescription:\n{job.description}\n\nRequirements:\n{job.requirements}"
    candidate_text = json.dumps(application.resume_snapshot, indent=2)

    completion = await client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.0,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SCORING_PROMPT},
            {
                "role": "user",
                "content": f"--- JOB ---\n{job_text}\n\n--- CANDIDATE ---\n{candidate_text}",
            },
        ],
    )

    raw = completion.choices[0].message.content or "{}"
    return json.loads(raw)


async def find_similar_candidates(
    db: AsyncSession,
    job_id,
    limit: int = 20,
) -> list[dict]:
    job_emb_result = await db.execute(
        select(Embedding).where(
            Embedding.entity_type == EmbeddingEntity.job,
            Embedding.entity_id == job_id,
        )
    )
    job_embedding = job_emb_result.scalar_one_or_none()
    if not job_embedding:
        return []

    query_embedding = job_embedding.embedding

    results = await db.execute(
        text("""
            SELECT
                e.entity_id,
                1 - (e.embedding <=> CAST(:qvec AS vector)) AS similarity
            FROM embeddings e
            WHERE e.entity_type = 'user'
            ORDER BY e.embedding <=> CAST(:qvec AS vector)
            LIMIT :lim
        """),
        {"qvec": str(query_embedding), "lim": limit},
    )

    return [
        {"user_id": str(row.entity_id), "similarity": float(row.similarity)}
        for row in results
    ]
