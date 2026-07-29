from __future__ import annotations

import json
import logging
import tempfile
import os

from openai import AsyncOpenAI
from pydantic import BaseModel, EmailStr, Field

from app.core.config import settings

logger = logging.getLogger(__name__)

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.openai_api_key)
    return _client




def extract_text_pymupdf(file_content: bytes, file_extension: str) -> str:
    tmp_path = None
    try:
        import pymupdf

        with tempfile.NamedTemporaryFile(
            suffix=f".{file_extension}", delete=False, dir="/tmp"
        ) as tmp:
            tmp.write(file_content)
            tmp_path = tmp.name

        doc = pymupdf.open(tmp_path)
        text = "".join(page.get_text() for page in doc)
        doc.close()

        stripped = text.strip()
        if len(stripped) < 20:
            logger.info("PyMuPDF extracted too little text (%d chars)", len(stripped))
            return ""
        logger.info("PyMuPDF extracted %d chars of text", len(stripped))
        return stripped
    except Exception as e:
        logger.warning("PyMuPDF extraction failed: %s", e)
        return ""
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)




class PersonalDetailsModel(BaseModel):
    first_name: str = Field(description="First name")
    last_name: str = Field(description="Last name")
    email: EmailStr = Field(description="Email address")
    phone: str = Field(description="Phone number with country code")
    country_code: str = Field(default="", description="ISO 3166-1 alpha-2 country code")
    address: str = Field(default="", description="Full address")
    avatar_url: str = Field(default="", description="URL to avatar photo")


class ExperienceModel(BaseModel):
    id: str = Field(description="Unique identifier")
    company: str = Field(description="Company name")
    position: str = Field(description="Job title / position")
    location: str = Field(default="", description="Job location")
    start_date: str = Field(description="Start date (YYYY-MM or YYYY-MM-DD)")
    end_date: str = Field(default="", description="End date, empty if current")
    is_current: bool = Field(default=False, description="Whether this is the current position")
    highlights: list[str] = Field(default_factory=list, description="Key achievements")


class EducationModel(BaseModel):
    id: str = Field(description="Unique identifier")
    institution: str = Field(description="Institution name")
    degree: str = Field(description="Degree type")
    field_of_study: str = Field(default="", description="Field of study")
    start_date: str = Field(description="Start date (YYYY-MM)")
    end_date: str = Field(default="", description="End date (YYYY-MM)")
    gpa: float = Field(default=0.0, description="GPA if available")
    description: str = Field(default="", description="Additional notes")


class ResumeModel(BaseModel):
    personal_details: PersonalDetailsModel
    bio: str = Field(default="", description="Professional summary")
    experience: list[ExperienceModel] = Field(default_factory=list)
    education: list[EducationModel] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list, description="List of skills")


SYSTEM_PROMPT = (
    "Parse this CV text into the JSON schema provided. "
    "Dates → YYYY-MM. Current job → is_current=true, end_date=\"\". "
    "Generate a 2-3 sentence professional bio. "
    "Extract all skills. Empty string for missing fields. "
    "Return ONLY valid JSON.")


def _make_strict(schema: dict) -> dict:
    if isinstance(schema, dict):
        if schema.get("type") == "object":
            schema["additionalProperties"] = False
            props = schema.get("properties", {})
            schema["required"] = list(props.keys())
        for v in schema.values():
            if isinstance(v, dict):
                _make_strict(v)
            elif isinstance(v, list):
                for item in v:
                    if isinstance(item, dict):
                        _make_strict(item)
    return schema


async def normalize_resume(raw_text: str) -> ResumeModel:
    client = _get_client()
    schema = ResumeModel.model_json_schema()

    user_message = (
        "Parse this CV text into the JSON schema provided. "
        "Return ONLY valid JSON.\n\n"
        f"Schema:\n{json.dumps(schema)}\n\n"
        f"CV Text:\n{raw_text}"
    )

    completion = await client.chat.completions.create(
        model=settings.openai_model,
        temperature=0.0,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
    )

    raw_json = completion.choices[0].message.content or "{}"
    logger.info("LLM response length: %d chars", len(raw_json))

    return ResumeModel.model_validate_json(raw_json)
