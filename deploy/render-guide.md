# Render Free Tier Deployment Guide

Deploy Jobber on [Render](https://render.com) free tier — zero cost, zero DevOps.

## Architecture on Render

```
┌──────────────────────────────────────────────────────────────┐
│  Render Free Tier                                            │
│                                                              │
│  ┌──────────────────────┐    ┌────────────────────────────┐  │
│  │  Frontend            │    │  Backend (Merged)          │  │
│  │  Static Site         │───▶│  API Gateway + Matchmaking │  │
│  │  (Next.js)           │    │  + Ingestion + Docling     │  │
│  │  FREE FOREVER        │    │  Free Web Service          │  │
│  └──────────────────────┘    └─────────────┬──────────────┘  │
│                                            │                 │
│                                    ┌───────▼───────┐         │
│                                    │  PostgreSQL   │         │
│                                    │  Free (30d)   │         │
│                                    └───────────────┘         │
└──────────────────────────────────────────────────────────────┘
```

**Key changes from Docker Compose:**
- All 4 Python services (API Gateway, Matchmaking, Ingestion, Docling) are merged into **one FastAPI app** in `deploy/merged-backend/`
- gRPC calls replaced with **direct Python function calls** (no inter-service networking needed)
- PyMuPDF used directly for PDF extraction (no Docling gRPC)
- Frontend is a **Static Site** (free forever, no spin-down)

## Limitations

| Feature | Limitation |
|---------|-----------|
| **PostgreSQL** | Expires after **30 days** (free tier). Upgrade to paid ($7/mo) to keep data. |
| **Backend spin-down** | Spins down after **15 min idle**. First request after idle takes ~30-60s cold start. |
| **Instance hours** | 750 hours/month **shared** across all free services. |
| **No gRPC** | Free services can't receive private network traffic. Solved by merging services. |
| **No WebSockets** | Free tier doesn't support persistent connections. |

## Prerequisites

1. A [Render account](https://render.com) (free)
2. A [GitHub repository](https://github.com) with your Jobber code
3. An [OpenAI API key](https://platform.openai.com)

## Step-by-Step Deployment

### 1. Push to GitHub

Make sure your repo contains:
```
/
├── deploy/
│   ├── merged-backend/     # ← The merged Python backend
│   │   ├── requirements.txt
│   │   └── app/
│   │       ├── main.py
│   │       ├── core/
│   │       ├── routes/
│   │       ├── models/
│   │       ├── services/
│   │       └── data/
│   ├── render.yaml         # ← Render Blueprint
│   └── render-guide.md     # ← This file
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── next.config.ts
│   └── Dockerfile
└── ...
```

### 2. Create Render Blueprint

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Blueprint**
3. Connect your GitHub repository
4. Render will detect `render.yaml` and show 3 services:
   - `jobber-frontend` (Static Site)
   - `jobber-api` (Web Service)
   - `jobber-db` (PostgreSQL)

### 3. Configure Environment Variables

#### Backend (`jobber-api`)

Set these in the Render dashboard under **Environment**:

| Variable | Value |
|----------|-------|
| `GATEWAY_OPENAI_API_KEY` | Your OpenAI API key |
| `GATEWAY_CORS_ORIGINS` | `["https://jobber-frontend.onrender.com"]` |
| `GATEWAY_DATABASE_URL` | *(auto-filled from `jobber-db`)* |
| `GATEWAY_JWT_SECRET` | *(auto-generated)* |

> **Note:** The `render.yaml` uses `GATEWAY_` env prefix, so all settings
> (database_url, openai_api_key, jwt_secret, cors_origins) use this prefix.

#### Frontend (`jobber-frontend`)

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://jobber-api.onrender.com` |

### 4. Deploy

Click **Create New Resources** in the Blueprint setup. Render will:

1. Create the PostgreSQL database
2. Build and deploy the backend
3. Build and deploy the frontend

**First deployment takes ~5-10 minutes** (building Python deps, Node.js, etc.)

### 5. Initialize Database

After the backend deploys, you need to create the database tables:

1. Go to `jobber-api` → **Shell**
2. Run:
```python
import asyncio
from app.core.database import engine
from app.models.db import Base

async def init():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created!")

asyncio.run(init())
```

Or add an init endpoint temporarily and hit it once.

### 6. Create Test Users

Use the API to create test accounts:

```bash
# Create recruiter
curl -X POST https://jobber-api.onrender.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"recruiter@test.com","password":"test123","first_name":"Test","last_name":"Recruiter","role":"recruiter","company":"Test Corp"}'

# Create candidate
curl -X POST https://jobber-api.onrender.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"candidate@test.com","password":"test123","first_name":"Test","last_name":"Candidate","role":"candidate"}'
```

## Cold Start Optimization

The backend spins down after 15 min idle. To minimize cold start impact:

1. **Free tier Uptime Robot** (optional): Ping `https://jobber-api.onrender.com/health` every 5 minutes to keep it awake
2. **Health endpoint**: `/health` returns `{"status": "ok"}` — lightweight, fast

## Troubleshooting

### Backend won't start
- Check **Logs** tab in Render dashboard
- Common issue: missing `GATEWAY_OPENAI_API_KEY`
- Ensure `deploy/merged-backend/` exists in your repo

### Frontend can't reach API
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check CORS: `GATEWAY_CORS_ORIGINS` must include the frontend URL
- Note: `NEXT_PUBLIC_*` env vars are baked in at build time

### Database connection errors
- Render PostgreSQL uses `sslmode=require`
- The connection string from `fromDatabase` includes SSL
- If using custom URL: `postgresql+asyncpg://user:pass@host:5432/db?sslmode=require`

### PDF upload fails
- PyMuPDF works for text-based PDFs
- Scanned/image PDFs won't extract text (by design — would need OCR)
- Large files may timeout on free tier (30s limit)

## Upgrading

When you outgrow free tier:

1. **Backend**: Upgrade to **Starter** ($7/mo) — no spin-down, more RAM
2. **PostgreSQL**: Upgrade to **Starter** ($7/mo) — persistent, 1GB storage
3. **Frontend**: Keep Static Site (free forever)

Total cost: **$14/month** for a production-ready deployment.

## File Structure

```
deploy/merged-backend/
├── requirements.txt          # All Python deps (FastAPI, SQLAlchemy, OpenAI, PyMuPDF, etc.)
└── app/
    ├── __init__.py
    ├── main.py               # FastAPI app with all routers
    ├── core/
    │   ├── __init__.py
    │   ├── config.py          # Settings (GATEWAY_ env prefix)
    │   └── database.py        # SQLAlchemy async engine
    ├── models/
    │   ├── __init__.py
    │   └── db.py              # All SQLAlchemy models (User, Job, Application, Embedding, etc.)
    ├── routes/
    │   ├── __init__.py
    │   ├── auth.py            # Register, login, Google auth, JWT
    │   ├── users.py           # User CRUD, apply to job
    │   ├── jobs.py            # Job CRUD, list applicants
    │   ├── applications.py    # Application management, stats
    │   ├── matching.py        # pgvector similarity, GPT scoring
    │   ├── generation.py      # AI job description generation
    │   ├── resume.py          # PDF upload → PyMuPDF → OpenAI normalization
    │   └── locations.py       # Mexico locations autocomplete
    ├── services/
    │   ├── __init__.py
    │   ├── embedding.py       # OpenAI embeddings (1536-dim)
    │   ├── matching.py        # Cosine similarity + GPT scoring
    │   └── resume.py          # PyMuPDF extraction + OpenAI normalization
    └── data/
        ├── __init__.py
        ├── locations.py       # In-memory location search
        └── mexico.json        # 32 states, 2,457 municipalities
```
