"""Sends realistic API requests to populate Jaeger traces and Prometheus metrics.

Usage:
    python scripts/generate_traffic.py                    # defaults: 5 minutes, 3 concurrent users
    python scripts/generate_traffic.py --duration 300     # 5 minutes
    python scripts/generate_traffic.py --users 5          # 5 concurrent virtual users
    python scripts/generate_traffic.py --once             # single pass, no loop
"""

from __future__ import annotations

import argparse
import asyncio
import random
import sys
import time
import uuid

import httpx

BASE_URL = "http://localhost:8000"

TEST_USERS = {
    "recruiter": {"email": "traffic-recruiter@test.com", "password": "test123"},
    "candidate1": {"email": "traffic-candidate@test.com", "password": "test123"},
}

SEARCH_QUERIES = ["developer", "engineer", "analyst", "designer", "manager", "python", "react", "flutter", "devops", "cybersecurity"]
CITIES = ["Ciudad de Mexico", "Guadalajara", "Monterrey", "Queretaro", "Puebla"]
EMPLOYMENT_TYPES = ["full-time", "part-time", "contract", "internship"]
LOCATIONS_SEARCH = ["Mexico", "Guadalajara", "Monterrey", "Puebla", "Queretaro", "Leon", "Tijuana"]

NEW_CANDIDATE_EMAILS = [f"traffic_user_{random.randint(10000,99999)}@test.com" for _ in range(20)]

JOB_TITLES = [
    "Senior Python Developer", "Frontend Engineer Angular", "Cloud Architect AWS",
    "Machine Learning Engineer", "Technical Writer", "Scrum Master",
    "Full Stack Developer", "Mobile Developer iOS", "Site Reliability Engineer",
    "Business Intelligence Analyst", "Cybersecurity Specialist", "DevOps Engineer",
    "React Native Developer", "Backend Engineer Go", "Data Engineer Spark",
    "UX Researcher", "Solutions Architect", "Database Administrator",
    "Platform Engineer", "AI/ML Ops Engineer",
]
DEPARTMENTS = ["Engineering", "Product", "Design", "Data", "Security", "Operations"]
SKILLS = ["Python", "TypeScript", "React", "Node.js", "AWS", "Docker", "Kubernetes", "PostgreSQL", "Go", "Rust", "Java", "C++", "GCP", "Azure", "Terraform", "CI/CD"]

RESUME_DATA = {
    "personal_details": {
        "first_name": "Traffic",
        "last_name": "User",
        "email": "traffic@test.com",
        "phone": "5551234567",
        "country_code": "+52",
        "address": "Ciudad de Mexico, Mexico",
        "avatar_url": "",
    },
    "bio": "Experienced software engineer with 5+ years of experience in full-stack development.",
    "experience": [
        {
            "id": "exp-1",
            "company": "Tech Corp",
            "position": "Senior Developer",
            "location": "Ciudad de Mexico",
            "start_date": "2020-01",
            "end_date": "",
            "is_current": True,
            "highlights": ["Led migration to microservices", "Reduced API latency by 40%"],
        }
    ],
    "education": [
        {
            "id": "edu-1",
            "institution": "UNAM",
            "degree": "BSc",
            "field_of_study": "Computer Science",
            "start_date": "2015",
            "end_date": "2019",
            "gpa": 9.2,
            "description": "",
        }
    ],
    "skills": ["Python", "TypeScript", "React", "PostgreSQL", "Docker"],
}


class Metrics:
    def __init__(self):
        self.total = 0
        self.success = 0
        self.errors = 0
        self.latencies: list[float] = []

    def record(self, ok: bool, elapsed: float):
        self.total += 1
        if ok:
            self.success += 1
        else:
            self.errors += 1
        self.latencies.append(elapsed)

    def summary(self) -> str:
        avg = sum(self.latencies) / len(self.latencies) if self.latencies else 0
        p95 = sorted(self.latencies)[int(len(self.latencies) * 0.95)] if len(self.latencies) > 1 else 0
        return (
            f"Requests: {self.total} | Success: {self.success} | "
            f"Errors: {self.errors} | Avg: {avg*1000:.0f}ms | P95: {p95*1000:.0f}ms"
        )


metrics = Metrics()


async def _request(client: httpx.AsyncClient, method: str, path: str, **kwargs) -> httpx.Response | None:
    start = time.perf_counter()
    try:
        resp = await getattr(client, method)(path, **kwargs)
        elapsed = time.perf_counter() - start
        ok = 200 <= resp.status_code < 400
        if not ok:
            print(f"    {method.upper()} {path} -> {resp.status_code}")
        metrics.record(ok, elapsed)
        return resp
    except Exception as e:
        elapsed = time.perf_counter() - start
        print(f"    {method.upper()} {path} -> ERROR: {e}")
        metrics.record(False, elapsed)
        return None




async def browse_public_jobs(client: httpx.AsyncClient):
    await _request(client, "get", "/api/v1/jobs")
    await asyncio.sleep(random.uniform(0.3, 1.0))

    q = random.choice(SEARCH_QUERIES)
    await _request(client, "get", "/api/v1/jobs", params={"q": q})
    await asyncio.sleep(random.uniform(0.3, 1.0))

    city = random.choice(CITIES)
    await _request(client, "get", "/api/v1/jobs", params={"city": city})
    await asyncio.sleep(random.uniform(0.3, 1.0))

    emp = random.choice(EMPLOYMENT_TYPES)
    await _request(client, "get", "/api/v1/jobs", params={"employment_type": emp})


async def browse_job_detail(client: httpx.AsyncClient, job_ids: list[str]):
    if not job_ids:
        return
    job_id = random.choice(job_ids)
    resp = await _request(client, "get", f"/api/v1/jobs/{job_id}")
    return resp


async def search_locations(client: httpx.AsyncClient):
    q = random.choice(LOCATIONS_SEARCH)
    await _request(client, "get", "/api/v1/locations", params={"q": q, "limit": 10})




async def login(client: httpx.AsyncClient, email: str, password: str) -> str | None:
    resp = await _request(client, "post", "/api/v1/auth/login", json={"email": email, "password": password})
    if resp and resp.status_code == 200:
        return resp.json().get("token")
    return None


async def register_candidate(client: httpx.AsyncClient, email: str) -> str | None:
    resp = await _request(
        client, "post", "/api/v1/auth/register",
        json={
            "email": email,
            "password": "traffic123",
            "first_name": "Traffic",
            "last_name": f"User{random.randint(100,999)}",
            "role": "candidate",
            "phone": f"555{random.randint(1000000,9999999)}",
        },
    )
    if resp and resp.status_code == 201:
        return resp.json().get("token")
    return None


async def get_me(client: httpx.AsyncClient, token: str | None = None):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    await _request(client, "get", "/api/v1/auth/me", headers=headers)




async def candidate_browse_and_apply(client: httpx.AsyncClient, token: str, job_ids: list[str]):
    headers = {"Authorization": f"Bearer {token}"}

    resp = await _request(client, "get", "/api/v1/jobs")
    if not resp or resp.status_code != 200:
        return

    jobs = resp.json()
    if not jobs:
        return

    job = random.choice(jobs)
    job_id = job["id"]
    await _request(client, "get", f"/api/v1/jobs/{job_id}")
    await asyncio.sleep(random.uniform(0.5, 2.0))

    resp = await _request(
        client, "post", f"/api/v1/users/{get_user_id_from_token(token)}/apply",
        json={"job_id": job_id, "resume_data": RESUME_DATA},
        headers=headers,
    )

    await _request(client, "get", f"/api/v1/users/{get_user_id_from_token(token)}/applications", headers=headers)

    await _request(client, "get", "/api/v1/applications", headers=headers)


def get_user_id_from_token(token: str) -> str:
    import base64
    try:
        payload = token.split(".")[1]
        payload += "=" * (4 - len(payload) % 4)
        data = __import__("json").loads(base64.urlsafe_b64decode(payload))
        return data.get("sub", "")
    except Exception:
        return ""




async def recruiter_create_job(client: httpx.AsyncClient, token: str) -> str | None:
    headers = {"Authorization": f"Bearer {token}"}
    title = random.choice(JOB_TITLES)
    payload = {
        "title": title,
        "description": f"We are looking for a talented {title} to join our team in {random.choice(CITIES)}.",
        "requirements": "Bachelor's degree in CS or related field. 3+ years of experience.",
        "location": f"{random.choice(CITIES)}, Mexico",
        "department": random.choice(DEPARTMENTS),
        "employment_type": random.choice(EMPLOYMENT_TYPES),
        "salary_min": random.choice([30000, 40000, 50000, 60000, 80000, 100000]),
        "salary_max": random.choice([60000, 80000, 100000, 120000, 150000]),
        "salary_currency": "MXN",
        "skills": random.sample(SKILLS, k=random.randint(2, 5)),
        "benefits": ["Health insurance", "Remote work", "Flexible hours"],
        "responsibilities": ["Design and implement features", "Code review", "Mentor junior developers"],
        "is_remote": random.choice([True, False]),
        "team_size": random.randint(3, 15),
    }
    resp = await _request(client, "post", "/api/v1/jobs", json=payload, headers=headers)
    if resp and resp.status_code == 201:
        return resp.json().get("id")
    return None


async def recruiter_manage_jobs(client: httpx.AsyncClient, token: str, job_ids: list[str]):
    headers = {"Authorization": f"Bearer {token}"}

    resp = await _request(client, "get", "/api/v1/jobs", params={"mine": "true"}, headers=headers)

    if job_ids:
        job_id = random.choice(job_ids)
        await _request(client, "get", f"/api/v1/jobs/{job_id}", headers=headers)

    if job_ids:
        job_id = random.choice(job_ids)
        await _request(client, "get", f"/api/v1/jobs/{job_id}/applicants", headers=headers)


async def recruiter_review_applications(client: httpx.AsyncClient, token: str):
    headers = {"Authorization": f"Bearer {token}"}

    resp = await _request(client, "get", "/api/v1/applications", headers=headers)

    await _request(client, "get", "/api/v1/applications/stats", headers=headers)

    if resp and resp.status_code == 200:
        apps = resp.json()
        if apps:
            app = random.choice(apps)
            await _request(client, "get", f"/api/v1/applications/{app['id']}", headers=headers)

            new_status = random.choice(["reviewing", "shortlisted", "interviewing"])
            await _request(
                client, "patch", f"/api/v1/applications/{app['id']}",
                json={"status": new_status}, headers=headers,
            )




async def _browse_and_find_job(client: httpx.AsyncClient, token: str | None) -> str | None:
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    resp = await _request(client, "get", "/api/v1/jobs")
    if not resp or resp.status_code != 200:
        return None
    jobs = resp.json()
    if not jobs:
        return None
    return random.choice(jobs)["id"]


async def virtual_user_browsing(client: httpx.AsyncClient, vuid: int, deadline: float):
    while time.perf_counter() < deadline:
        await browse_public_jobs(client)
        await asyncio.sleep(random.uniform(1.0, 3.0))

        await search_locations(client)
        await asyncio.sleep(random.uniform(0.5, 2.0))

        for _ in range(random.randint(1, 3)):
            resp = await _request(client, "get", "/api/v1/jobs")
            if resp and resp.status_code == 200:
                jobs = resp.json()
                if jobs:
                    job = random.choice(jobs)
                    await _request(client, "get", f"/api/v1/jobs/{job['id']}")
                    await asyncio.sleep(random.uniform(1.0, 3.0))

        if random.random() < 0.3:
            email = f"v{vuid}_{uuid.uuid4().hex[:8]}@trafficgen.io"
            token = await register_candidate(client, email)
            if token:
                await get_me(client, token)
                user_id = get_user_id_from_token(token)
                headers = {"Authorization": f"Bearer {token}"}

                for _ in range(random.randint(1, 2)):
                    resp = await _request(client, "get", "/api/v1/jobs")
                    if resp and resp.status_code == 200:
                        jobs = resp.json()
                        if jobs:
                            job = random.choice(jobs)
                            await _request(client, "get", f"/api/v1/jobs/{job['id']}")
                            await asyncio.sleep(random.uniform(0.5, 1.5))
                            await _request(
                                client, "post", f"/api/v1/users/{user_id}/apply",
                                json={"job_id": job["id"], "resume_data": RESUME_DATA},
                                headers=headers,
                            )
                            await asyncio.sleep(random.uniform(1.0, 2.0))

                await _request(client, "get", "/api/v1/applications", headers=headers)
                await asyncio.sleep(random.uniform(1.0, 3.0))


async def virtual_user_candidate(client: httpx.AsyncClient, credentials: dict, deadline: float):
    token = await login(client, credentials["email"], credentials["password"])
    if not token:
        return
    await get_me(client, token)
    user_id = get_user_id_from_token(token)
    headers = {"Authorization": f"Bearer {token}"}

    attempt = 0
    while time.perf_counter() < deadline:
        attempt += 1

        await browse_public_jobs(client)
        await asyncio.sleep(random.uniform(1.0, 3.0))

        if attempt % 3 == 0:
            await search_locations(client)

        resp = await _request(client, "get", "/api/v1/jobs")
        if resp and resp.status_code == 200:
            jobs = resp.json()
            if jobs:
                job = random.choice(jobs)
                await _request(client, "get", f"/api/v1/jobs/{job['id']}")
                await asyncio.sleep(random.uniform(1.0, 3.0))

                if random.random() < 0.5:
                    await _request(
                        client, "post", f"/api/v1/users/{user_id}/apply",
                        json={"job_id": job["id"], "resume_data": RESUME_DATA},
                        headers=headers,
                    )
                    await asyncio.sleep(random.uniform(1.0, 2.0))

        await _request(client, "get", "/api/v1/applications", headers=headers)
        await asyncio.sleep(random.uniform(2.0, 5.0))


async def virtual_user_recruiter(client: httpx.AsyncClient, deadline: float):
    token = await login(client, TEST_USERS["recruiter"]["email"], TEST_USERS["recruiter"]["password"])
    if not token:
        return
    await get_me(client, token)

    created_jobs: list[str] = []
    attempt = 0
    while time.perf_counter() < deadline:
        attempt += 1

        if random.random() < 0.25 or not created_jobs:
            new_id = await recruiter_create_job(client, token)
            if new_id:
                created_jobs.append(new_id)
            await asyncio.sleep(random.uniform(1.0, 3.0))

        await recruiter_manage_jobs(client, token, created_jobs)
        await asyncio.sleep(random.uniform(2.0, 4.0))

        await recruiter_review_applications(client, token)
        await asyncio.sleep(random.uniform(2.0, 5.0))




async def run(duration: int, num_users: int):
    deadline = time.perf_counter() + duration
    print(f"Generating traffic for {duration}s with {num_users} virtual users...")
    print(f"API Gateway: {BASE_URL}")
    print("-" * 60)

    async with httpx.AsyncClient(base_url=BASE_URL, timeout=30) as client:
        for _ in range(10):
            try:
                r = await client.get("/api/v1/jobs")
                if r.status_code in (200, 422):
                    break
            except httpx.ConnectError:
                pass
            await asyncio.sleep(2)
        else:
            print("ERROR: API Gateway is not reachable. Aborting.")
            sys.exit(1)

        print("API is ready. Starting traffic generation...\n")

        personas = []

        personas.append(virtual_user_recruiter(client, deadline))

        remaining = num_users - 1
        candidates = max(1, remaining // 2)
        browsers = remaining - candidates

        for i in range(candidates):
            cred_key = "candidate1"
            personas.append(virtual_user_candidate(client, TEST_USERS[cred_key], deadline))

        for i in range(browsers):
            personas.append(virtual_user_browsing(client, i, deadline))

        async def print_periodically():
            while time.perf_counter() < deadline:
                await asyncio.sleep(15)
                print(f"  [{metrics.summary()}]")

        tasks = personas + [print_periodically()]
        await asyncio.gather(*tasks)

    print("\n" + "=" * 60)
    print(f"Done. {metrics.summary()}")


def main():
    parser = argparse.ArgumentParser(description="Generate traffic for the jobber platform")
    parser.add_argument("--duration", type=int, default=300, help="Duration in seconds (default: 300)")
    parser.add_argument("--users", type=int, default=3, help="Number of concurrent virtual users (default: 3)")
    parser.add_argument("--once", action="store_true", help="Single pass, no loop")
    args = parser.parse_args()

    if args.once:
        args.duration = 999999

    asyncio.run(run(args.duration, args.users))


if __name__ == "__main__":
    main()
