from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services.resume import extract_text_pymupdf, normalize_resume

router = APIRouter(prefix="/api/v1/resume", tags=["resume"])

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {"pdf", "docx"}


def _extract_extension(filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported file type '.{ext}'. Allowed: {ALLOWED_EXTENSIONS}",
        )
    return ext


@router.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    """Receive a PDF/DOCX, extract text with PyMuPDF, normalize with OpenAI,
    and return the structured CV as JSON."""

    if not file.filename:
        raise HTTPException(status_code=422, detail="Filename is required.")

    ext = _extract_extension(file.filename)
    content = await file.read()

    if not content:
        raise HTTPException(status_code=422, detail="Uploaded file is empty.")

    try:
        raw_text = extract_text_pymupdf(content, ext)
    except Exception as exc:
        logger.error("PDF extraction failed: %s", exc)
        raise HTTPException(
            status_code=502,
            detail=f"PDF extraction error: {exc}",
        )

    if not raw_text:
        raise HTTPException(
            status_code=422,
            detail="Could not extract text from the PDF. The file may be a scanned image.",
        )

    try:
        resume_model = await normalize_resume(raw_text)
    except Exception as exc:
        logger.error("LLM normalization failed: %s", exc)
        raise HTTPException(
            status_code=502,
            detail=f"LLM normalization error: {exc}",
        )

    pd = resume_model.personal_details
    return {
        "personal_details": {
            "first_name": pd.first_name,
            "last_name": pd.last_name,
            "email": pd.email,
            "phone": pd.phone,
            "country_code": pd.country_code,
            "address": pd.address,
            "avatar_url": pd.avatar_url,
        },
        "bio": resume_model.bio,
        "experience": [
            {
                "id": exp.id or str(uuid.uuid4()),
                "company": exp.company,
                "position": exp.position,
                "location": exp.location,
                "start_date": exp.start_date,
                "end_date": exp.end_date,
                "is_current": exp.is_current,
                "highlights": list(exp.highlights),
            }
            for exp in resume_model.experience
        ],
        "education": [
            {
                "id": edu.id or str(uuid.uuid4()),
                "institution": edu.institution,
                "degree": edu.degree,
                "field_of_study": edu.field_of_study,
                "start_date": edu.start_date,
                "end_date": edu.end_date,
                "gpa": edu.gpa,
                "description": edu.description,
            }
            for edu in resume_model.education
        ],
        "skills": list(resume_model.skills),
    }
