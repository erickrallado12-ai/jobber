from __future__ import annotations

import json
import logging

from openai import AsyncOpenAI

from app.core.config import settings
from app.models.resume import ResumeModel

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "Parse this CV text into the JSON schema provided. "
    "Dates → YYYY-MM. Current job → is_current=true, end_date=\"\". "
    "Generate a 2-3 sentence professional bio. "
    "Extract all skills. Empty string for missing fields. "
    "Return ONLY valid JSON."
)

_client: AsyncOpenAI | None = None


def _make_strict(schema: dict) -> dict:
    """Recursively enforce OpenAI structured output requirements:
    - additionalProperties: false on all objects
    - required includes every key in properties
    """
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


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.openai_api_key)
    return _client


async def normalize_resume(raw_text: str) -> ResumeModel:
    """Normalize raw CV text into a structured ResumeModel."""
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
