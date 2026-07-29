from fastapi import APIRouter, Query

from app.data.keywords import search_keywords

router = APIRouter(prefix="/api/v1/keywords", tags=["keywords"])


@router.get("")
def list_keywords(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(10, ge=1, le=50),
):
    return search_keywords(q, limit=limit)
