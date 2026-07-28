from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.core.grpc_client import grpc_client

router = APIRouter(prefix="/api/v1/resume", tags=["resume"])

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
    """Receive a PDF/DOCX, forward it to the Ingestion Service via gRPC, and
    return the structured CV as JSON."""

    if not file.filename:
        raise HTTPException(status_code=422, detail="Filename is required.")

    ext = _extract_extension(file.filename)
    content = await file.read()

    if not content:
        raise HTTPException(status_code=422, detail="Uploaded file is empty.")

    try:
        response = await grpc_client.process_resume(
            file_content=content, file_extension=ext
        )
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Ingestion service error: {exc}",
        )

    return {
        "personal_details": {
            "first_name": response.personal_details.first_name,
            "last_name": response.personal_details.last_name,
            "email": response.personal_details.email,
            "phone": response.personal_details.phone,
            "country_code": response.personal_details.country_code,
            "address": response.personal_details.address,
            "avatar_url": response.personal_details.avatar_url,
        },
        "bio": response.bio,
        "experience": [
            {
                "id": exp.id,
                "company": exp.company,
                "position": exp.position,
                "location": exp.location,
                "start_date": exp.start_date,
                "end_date": exp.end_date,
                "is_current": exp.is_current,
                "highlights": list(exp.highlights),
            }
            for exp in response.experience
        ],
        "education": [
            {
                "id": edu.id,
                "institution": edu.institution,
                "degree": edu.degree,
                "field_of_study": edu.field_of_study,
                "start_date": edu.start_date,
                "end_date": edu.end_date,
                "gpa": edu.gpa,
                "description": edu.description,
            }
            for edu in response.education
        ],
        "skills": list(response.skills),
    }
