set -e

echo "============================================"
echo "  Jobber Platform — Server Setup"
echo "============================================"

echo "[1/6] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo "Docker installed. You may need to log out and back in for group changes."
else
    echo "Docker already installed."
fi

if ! command -v docker compose &> /dev/null; then
    echo "Installing Docker Compose plugin..."
    sudo apt-get install -y docker-compose-plugin
else
    echo "Docker Compose already installed."
fi

echo "[2/6] Configuring firewall..."
if command -v ufw &> /dev/null; then
    sudo ufw allow 22/tcp   # SSH
    sudo ufw allow 80/tcp   # HTTP
    sudo ufw allow 443/tcp  # HTTPS
    sudo ufw --force enable
    echo "Firewall configured."
else
    echo "ufw not found, skipping firewall setup."
fi

echo "[3/6] Setting up project..."
DEPLOY_DIR="$HOME/jobber"
if [ -d "$DEPLOY_DIR" ]; then
    cd "$DEPLOY_DIR"
    git pull
    echo "Repository updated."
else
    echo "Repository not found at $DEPLOY_DIR."
    echo "Please clone your repo first:"
    echo "  git clone YOUR_REPO_URL $DEPLOY_DIR"
    echo "Then run this script again."
    exit 1
fi

echo "[4/6] Setting up environment..."
if [ ! -f "$DEPLOY_DIR/deploy/.env.production" ]; then
    echo "ERROR: deploy/.env.production not found!"
    exit 1
fi

if grep -q "YOUR_IP_HERE" "$DEPLOY_DIR/deploy/.env.production"; then
    PUBLIC_IP=$(curl -s ifconfig.me)
    sed -i "s/YOUR_IP_HERE/$PUBLIC_IP/" "$DEPLOY_DIR/deploy/.env.production"
    echo "Auto-detected public IP: $PUBLIC_IP"
fi

if grep -q "CHANGE_ME" "$DEPLOY_DIR/deploy/.env.production"; then
    echo ""
    echo "WARNING: You still have default passwords in .env.production!"
    echo "Edit $DEPLOY_DIR/deploy/.env.production and change:"
    echo "  - POSTGRES_PASSWORD"
    echo "  - JWT_SECRET"
    echo "  - OPENAI_API_KEY"
    echo "  - GRAFANA_PASSWORD"
    echo ""
    read -p "Press Enter after updating the .env file (or Ctrl+C to abort)..."
fi

echo "[5/6] Setting up SSL..."
DOMAIN=$(grep "^DOMAIN=" "$DEPLOY_DIR/deploy/.env.production" | cut -d= -f2)

cat > /tmp/nginx-http.conf <<'NGINX_EOF'
worker_processes auto;
events { worker_connections 1024; }
http {
    server {
        listen 80;
        location /.well-known/acme-challenge/ { root /var/www/certbot; }
        location / { return 200 "Setting up SSL..."; }
    }
}
NGINX_EOF

docker run -d --name temp-nginx \
    -p 80:80 \
    -v /tmp/nginx-http.conf:/etc/nginx/nginx.conf:ro \
    -v certbot-www:/var/www/certbot \
    nginx:alpine 2>/dev/null || true

docker run --rm \
    -v certbot-conf:/etc/letsencrypt \
    -v certbot-www:/var/www/certbot \
    certbot/certbot certonly \
    --webroot -w /var/www/certbot \
    --email admin@$DOMAIN \
    --agree-tos \
    -d $DOMAIN \
    --non-interactive 2>/dev/null || {
    echo "Certbot failed. Generating self-signed cert for testing..."
    mkdir -p /tmp/self-signed
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /tmp/self-signed/privkey.pem \
        -out /tmp/self-signed/fullchain.pem \
        -subj "/CN=$DOMAIN" 2>/dev/null
    
    docker volume create certbot-conf
    docker run --rm -v certbot-conf:/etc/letsencrypt \
        -v /tmp/self-signed:/certs \
        alpine sh -c "mkdir -p /etc/letsencrypt/live/$DOMAIN && cp /certs/* /etc/letsencrypt/live/$DOMAIN/"
}

docker stop temp-nginx 2>/dev/null || true
docker rm temp-nginx 2>/dev/null || true

echo "[6/6] Configuring Nginx..."
sed -i "s/server_name _/server_name $DOMAIN/g" "$DEPLOY_DIR/deploy/nginx.conf"
sed -i "s/jobber.fly.dev/$DOMAIN/g" "$DEPLOY_DIR/deploy/nginx.conf"

echo ""
echo "============================================"
echo "  Setup complete!"
echo "============================================"
echo ""
echo "To start the platform:"
echo "  cd $DEPLOY_DIR/deploy"
echo "  docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build"
echo ""
echo "To view logs:"
echo "  docker compose -f docker-compose.prod.yml logs -f"
echo ""
echo "Services will be available at:"
echo "  https://$DOMAIN          (Frontend)"
echo "  https://$DOMAIN/api/     (API)"
echo "  https://$DOMAIN:16686    (Jaeger)"
echo ""
