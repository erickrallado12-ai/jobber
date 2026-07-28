from __future__ import annotations

import hashlib
import logging

from openai import AsyncOpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.openai_api_key)
    return _client


def _content_hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()[:16]


async def generate_embedding(text: str) -> list[float]:
    client = _get_client()
    response = await client.embeddings.create(
        model=settings.openai_embedding_model,
        input=text,
    )
    return response.data[0].embedding


def _build_embedding_text(entity_type: str, data: dict) -> str:
    """Build a text representation for embedding from entity data.

    Only includes fields with high semantic signal for matching.
    Hard filters (location, employment_type) and noise (name) are excluded.
    """
    if entity_type == "job":
        skills = data.get("skills", [])
        if isinstance(skills, list):
            skills_str = " ".join(skills)
        else:
            skills_str = str(skills)
        responsibilities = data.get("responsibilities", [])
        if isinstance(responsibilities, list):
            resp_str = " ".join(responsibilities)
        else:
            resp_str = str(responsibilities)
        parts = [
            data.get("title", ""),
            data.get("description", ""),
            data.get("requirements", ""),
            resp_str,
            skills_str,
        ]
    else:
        pd = data.get("personal_details", {})
        parts = [
            pd.get("job_title", ""),
            data.get("bio", ""),
            " ".join(data.get("skills", [])),
            " ".join(
                f"{exp.get('position', '')} at {exp.get('company', '')} {' '.join(exp.get('highlights', []))}"
                for exp in data.get("experience", [])
            ),
            " ".join(
                f"{edu.get('degree', '')} in {edu.get('field_of_study', '')} from {edu.get('institution', '')}"
                for edu in data.get("education", [])
            ),
        ]
    return " | ".join(p for p in parts if p)
