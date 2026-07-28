from __future__ import annotations

from pydantic import BaseModel
import httpx
from fastapi import APIRouter, HTTPException, Request

from app.core.config import settings

router = APIRouter(prefix="/api/v1", tags=["matchmaking"])

_client: httpx.AsyncClient | None = None


def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(
            base_url=settings.matchmaking_service_url, timeout=60
        )
    return _client


async def _proxy(method: str, path: str, request: Request = None, **kwargs) -> dict | list:
    client = _get_client()
    headers: dict = {}
    if request:
        auth = request.headers.get("Authorization")
        if auth:
            headers["Authorization"] = auth
    resp = await getattr(client, method)(path, headers=headers, **kwargs)
    if resp.status_code >= 400:
        try:
            detail = resp.json().get("detail", resp.text)
        except Exception:
            detail = resp.text or f"Upstream error {resp.status_code}"
        raise HTTPException(resp.status_code, detail)
    if resp.status_code == 204:
        return None
    return resp.json()




@router.get("/jobs")
async def list_jobs(
    request: Request,
    status: str | None = None,
    q: str | None = None,
    city: str | None = None,
    employment_type: str | None = None,
    is_remote: bool | None = None,
    mine: bool = False,
    limit: int = 50,
):
    params: dict = {"limit": limit}
    if status:
        params["status"] = status
    if q:
        params["q"] = q
    if city:
        params["city"] = city
    if employment_type:
        params["employment_type"] = employment_type
    if is_remote is not None:
        params["is_remote"] = str(is_remote).lower()
    if mine:
        params["mine"] = "true"
    return await _proxy("get", "/api/v1/jobs", request=request, params=params)


@router.post("/jobs", status_code=201)
async def create_job(request: Request):
    body = await request.json()
    return await _proxy("post", "/api/v1/jobs", request=request, json=body)


@router.get("/jobs/{job_id}")
async def get_job(job_id: str, request: Request):
    return await _proxy("get", f"/api/v1/jobs/{job_id}", request=request)


@router.patch("/jobs/{job_id}")
async def update_job(job_id: str, request: Request):
    body = await request.json()
    return await _proxy("patch", f"/api/v1/jobs/{job_id}", request=request, json=body)


@router.delete("/jobs/{job_id}", status_code=204)
async def delete_job(job_id: str, request: Request):
    return await _proxy("delete", f"/api/v1/jobs/{job_id}", request=request)


class GenerateDescriptionRequest(BaseModel):
    title: str
    existing_description: str = ""


@router.post("/jobs/generate-description")
async def generate_description(payload: GenerateDescriptionRequest, request: Request):
    return await _proxy("post", "/api/v1/jobs/generate-description", request=request, json=payload.model_dump())


@router.get("/jobs/{job_id}/applicants")
async def list_job_applicants(job_id: str, request: Request):
    return await _proxy("get", f"/api/v1/jobs/{job_id}/applicants", request=request)




@router.post("/users", status_code=201)
async def create_user(request: Request):
    body = await request.json()
    return await _proxy("post", "/api/v1/users", json=body)


@router.get("/users/{user_id}")
async def get_user(user_id: str):
    return await _proxy("get", f"/api/v1/users/{user_id}")




@router.get("/applications")
async def list_all_applications(
    request: Request,
    status: str | None = None,
    search: str | None = None,
    limit: int = 100,
):
    params: dict = {"limit": limit}
    if status:
        params["status"] = status
    if search:
        params["search"] = search
    return await _proxy("get", "/api/v1/applications", request=request, params=params)


@router.get("/applications/stats")
async def get_application_stats(request: Request):
    return await _proxy("get", "/api/v1/applications/stats", request=request)


@router.get("/applications/{application_id}")
async def get_application(application_id: str, request: Request):
    return await _proxy("get", f"/api/v1/applications/{application_id}", request=request)


@router.patch("/applications/{application_id}")
async def update_application_status(application_id: str, request: Request):
    body = await request.json()
    return await _proxy("patch", f"/api/v1/applications/{application_id}", request=request, json=body)


@router.post("/users/{user_id}/apply", status_code=201)
async def apply_to_job(user_id: str, request: Request):
    body = await request.json()
    return await _proxy("post", f"/api/v1/users/{user_id}/apply", json=body)


@router.get("/users/{user_id}/applications")
async def list_applications(user_id: str):
    return await _proxy("get", f"/api/v1/users/{user_id}/applications")




@router.post("/match/score/{application_id}")
async def score_application(application_id: str):
    return await _proxy("post", f"/api/v1/match/score/{application_id}")


@router.get("/match/candidates/{job_id}")
async def get_candidates(job_id: str, limit: int = 10):
    return await _proxy("get", f"/api/v1/match/candidates/{job_id}", params={"limit": limit})




@router.post("/auth/register", status_code=201)
async def auth_register(request: Request):
    body = await request.json()
    return await _proxy("post", "/api/v1/auth/register", json=body)


@router.post("/auth/login")
async def auth_login(request: Request):
    body = await request.json()
    return await _proxy("post", "/api/v1/auth/login", json=body)


@router.post("/auth/google")
async def auth_google(request: Request):
    body = await request.json()
    return await _proxy("post", "/api/v1/auth/google", json=body)


@router.get("/auth/me")
async def auth_me(request: Request):
    auth_header = request.headers.get("Authorization")
    headers = {}
    if auth_header:
        headers["Authorization"] = auth_header
    client = _get_client()
    resp = await client.get("/api/v1/auth/me", headers=headers)
    if resp.status_code >= 400:
        raise HTTPException(resp.status_code, resp.text)
    return resp.json()
