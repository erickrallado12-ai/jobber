# Deploy Jobber

## Quick Start: Render (Recommended for Portfolio)

**Zero cost, zero DevOps.** Deploy in 5 minutes:

1. Push code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com) → **New +** → **Blueprint**
3. Connect your repo (Render detects `render.yaml` automatically)
4. Set `GATEWAY_OPENAI_API_KEY` in the backend env vars
5. Click **Create New Resources**

See [render-guide.md](./render-guide.md) for detailed instructions.

---

# Oracle Cloud Free Tier (Full Control)

Self-hosted with Docker, SSL, monitoring — more setup but no limitations.

## Step 1: Create Oracle Cloud Account

1. Go to https://cloud.oracle.com/free
2. Sign up for the **Always Free** tier (requires credit card for verification, but you won't be charged)
3. You get: 4 ARM cores, 24GB RAM, 200GB storage — more than enough

## Step 2: Create a VM Instance

1. Login to Oracle Cloud Console
2. Go to **Compute** → **Instances** → **Create Instance**
3. Settings:
   - **Name:** `jobber-server`
   - **Image:** Ubuntu 22.04 (or Canonical Ubuntu 24.04)
   - **Shape:** VM.Standard.A1.Flex (ARM)
   - **OCPU:** 4
   - **Memory:** 24 GB
   - **Boot Volume:** 200 GB
4. Under **Add SSH keys**:
   - Click **"Download public key"** (or paste your own)
   - If you don't have a key pair, generate one on your machine:
     ```bash
     ssh-keygen -t ed25519 -C "jobber-deploy"
     ```
   - Paste the contents of `~/.ssh/jobber-deploy.pub`
5. Click **Create** and wait 2-3 minutes for the instance to start
6. Note the **Public IP** from the instance details page

## Step 3: Connect to Your Server

```bash
# From your local machine (Windows Git Bash, Mac, or Linux)
ssh -i ~/.ssh/jobber-deploy ubuntu@YOUR_PUBLIC_IP
```

## Step 4: Push Your Code to GitHub

On your **local machine**:

```bash
cd "path/to/Default Project"

# Create .gitignore if you don't have one
cat > .gitignore << 'EOF'
.env
__pycache__/
*.pyc
node_modules/
.next/
*.egg-info/
.env.local
EOF

# Initialize and push
git init
git add .
git commit -m "Initial commit"
git branch -M main
```

Create a repo on GitHub, then:
```bash
git remote add origin https://github.com/YOUR_USERNAME/jobber.git
git push -u origin main
```

## Step 5: Deploy

SSH into your server, then:

```bash
# Clone your repo
git clone https://github.com/YOUR_USERNAME/jobber.git ~/jobber
cd ~/jobber

# Edit the environment file
nano deploy/.env.production
```

Change these values:
```
DOMAIN=YOUR_PUBLIC_IP
OPENAI_API_KEY=sk-proj-YOUR_ACTUAL_KEY
POSTGRES_PASSWORD=a-strong-random-password
JWT_SECRET=another-strong-random-string-at-least-64-chars
GRAFANA_PASSWORD=your-grafana-password
```

Then run the setup script:

```bash
chmod +x deploy/setup.sh
bash deploy/setup.sh
```

This installs Docker, configures the firewall, sets up SSL, and builds all services.

## Step 6: Start Everything

```bash
cd ~/jobber/deploy
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Wait 2-3 minutes for all services to start, then visit:
- **Frontend:** `https://YOUR_IP`
- **API:** `https://YOUR_IP/api/v1/jobs`
- **Jaeger:** `http://YOUR_IP:16686`

## Common Commands

```bash
# View logs
docker compose -f docker-compose.prod.yml logs -f

# Restart a specific service
docker compose -f docker-compose.prod.yml restart api-gateway

# Stop everything
docker compose -f docker-compose.prod.yml down

# Rebuild after code changes
git pull
docker compose -f docker-compose.prod.yml up -d --build

# Check service status
docker compose -f docker-compose.prod.yml ps
```

## Troubleshooting

**Services won't start:**
```bash
docker compose -f docker-compose.prod.yml logs api-gateway
docker compose -f docker-compose.prod.yml logs matchmaking-service
```

**Out of memory (24GB should be fine):**
```bash
docker stats  # Check memory usage per container
```

**SSL certificate issues:**
If using a raw IP (no domain), the browser will show a security warning. This is normal for IPs. For a real domain, update `DOMAIN` in `.env.production` and re-run `setup.sh`.

**Reset everything:**
```bash
docker compose -f docker-compose.prod.yml down -v  # Deletes data!
docker compose -f docker-compose.prod.yml up -d --build
```
