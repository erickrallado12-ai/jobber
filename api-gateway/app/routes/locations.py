from __future__ import annotations

from fastapi import APIRouter, Query

from app.data.locations import search_locations

router = APIRouter(prefix="/api/v1/locations", tags=["locations"])


@router.get("")
def list_locations(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(20, ge=1, le=50),
):
    results = search_locations(q, limit=limit)
    return [
        {
            "clave": loc.clave,
            "nombre": loc.nombre,
            "state_clave": loc.state_clave,
            "state_nombre": loc.state_nombre,
        }
        for loc in results
    ]
