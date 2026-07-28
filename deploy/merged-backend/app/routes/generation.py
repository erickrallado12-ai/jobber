from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel
from openai import AsyncOpenAI

from app.core.config import settings

router = APIRouter(prefix="/api/v1/jobs", tags=["generation"])

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.openai_api_key)
    return _client


SYSTEM_PROMPT = """\
You are an expert HR copywriter. Given a job title and optionally a partial \
draft, write a polished job description for a public job posting.

Structure:
1. **Overview** — 2-3 sentences about the role and its impact.
2. **Responsibilities** — 5-8 bullet points (use the • character).
3. **Requirements** — 4-6 bullet points covering must-have skills, experience, \
and education.
4. **Why Join Us** — 2 sentences about the opportunity and culture.

Guidelines:
- Professional but engaging tone.
- Be specific to the job title; avoid generic filler.
- 300-500 words total.
- Return ONLY the description text, no markdown fences or labels.\
"""


class GenerateRequest(BaseModel):
    title: str
    existing_description: str = ""


class GenerateResponse(BaseModel):
    description: str


@router.post("/generate-description", response_model=GenerateResponse)
async def generate_description(payload: GenerateRequest):
    client = _get_client()

    user_msg = f"Job Title: {payload.title}"
    if payload.existing_description.strip():
        user_msg += f"\n\nDraft / notes:\n{payload.existing_description}"

    completion = await client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.7,
        max_tokens=1024,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ],
    )

    text = (completion.choices[0].message.content or "").strip()
    return GenerateResponse(description=text)
