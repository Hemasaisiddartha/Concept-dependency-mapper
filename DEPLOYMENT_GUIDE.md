# Smart AI Concept Dependency Mapper — Production Deployment Guide

This guide details how to prepare, deploy, and maintain the **Smart AI Concept Dependency Mapper** backend and frontend in a production environment with HTTPS and persistent database synchronization.

---

## 1. Production Architecture Overview

```
 [Android Mobile App]       [Production Web Client]
 (com.aiconceptmapper.app)   (https://mapper.yourdomain.com)
            │                               │
            └───────────────┬───────────────┘
                            │ HTTPS / REST API
                            V
                  [Nginx Reverse Proxy]
                  (SSL via Let's Encrypt)
                            │
                            V (Port 8000)
            [FastAPI ASGI Production Server]
               (Gunicorn + 4 Uvicorn Workers)
                   │                    │
                   V                    V
          [SQLite 3 Volume]    [Firebase Realtime DB]
      (concept_mapper.db)     (ai-concept-mapper-55d53)
```

---

## 2. Production Environment Configuration (`.env`)

Create or configure `.env` on your production server:

```ini
# Production Server Bindings
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=production

# Database Configuration (Absolute path to persistent volume)
DATABASE_URL=sqlite:////var/data/concept_mapper.db

# Gmail SMTP Configuration (For Real 6-Digit Email OTP Delivery)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USE_TLS=true
SMTP_USER=your_educational_domain@gmail.com
SMTP_PASSWORD=your_16_char_google_app_password
SMTP_FROM_EMAIL=your_educational_domain@gmail.com

# Firebase Cloud Synchronization
FIREBASE_RTDB_URL=https://ai-concept-mapper-55d53-default-rtdb.firebaseio.com
```

---

## 3. Option A: Deployment to Cloud PaaS (Render / Railway / Fly.io)

### Deploying on Render:
1. Fork or push the repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com), click **New + $\rightarrow$ Web Service**.
3. Select your repository.
4. Set the following settings:
   * **Root Directory**: `backend`
   * **Runtime**: `Python 3`
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`
5. Add a **Persistent Disk** mounted at `/var/data` to preserve `concept_mapper.db` across restarts.
6. Set the Environment Variables under the **Environment** tab.
7. Click **Create Web Service**. Render will assign a public HTTPS URL (e.g. `https://concept-mapper-api.onrender.com`).

---

## 4. Option B: Deployment to Linux VPS (Ubuntu 22.04 / 24.04 LTS)

### Step 1: Install System Dependencies
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-pip python3-venv nginx certbot python3-certbot-nginx git
```

### Step 2: Clone Repository & Setup Virtualenv
```bash
cd /opt
sudo git clone <YOUR_REPOSITORY_URL> concept-mapper
cd concept-mapper/backend

sudo python3 -m venv venv
sudo ./venv/bin/pip install --upgrade pip
sudo ./venv/bin/pip install -r requirements.txt
sudo ./venv/bin/pip install gunicorn
```

### Step 3: Configure Systemd Service
Create service file `/etc/systemd/system/concept-mapper.service`:

```ini
[Unit]
Description=Smart AI Concept Dependency Mapper FastAPI Service
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/opt/concept-mapper/backend
EnvironmentFile=/opt/concept-mapper/backend/.env
ExecStart=/opt/concept-mapper/backend/venv/bin/gunicorn main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 127.0.0.1:8000 \
    --access-logfile /var/log/concept-mapper.access.log \
    --error-logfile /var/log/concept-mapper.error.log

Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable concept-mapper
sudo systemctl start concept-mapper
sudo systemctl status concept-mapper
```

### Step 4: Configure Nginx Reverse Proxy with HTTPS
Create `/etc/nginx/sites-available/concept-mapper`:

```nginx
server {
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site and obtain free SSL certificate:
```bash
sudo ln -s /etc/nginx/sites-available/concept-mapper /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Automatically configure HTTPS with Let's Encrypt:
sudo certbot --nginx -d api.yourdomain.com
```

---

## 5. Connecting the Mobile App to the Production Backend

Once your backend is deployed with HTTPS (e.g. `https://api.yourdomain.com/api`):

1. **Option A: User In-App Configuration**:
   - Open the mobile application on your Android phone.
   - Tap **⚙️** in the top header or go to **Profile $\rightarrow$ Configure Server**.
   - Enter `https://api.yourdomain.com/api`.
   - Tap **Save & Connect**. The mobile app immediately syncs with the live production database.

2. **Option B: Pre-configured Production Build**:
   - Update `DEFAULT_HOST` or `currentBaseUrl` in `mobile/src/services/api.js`:
     ```javascript
     const PRODUCTION_URL = 'https://api.yourdomain.com/api';
     ```
   - Re-run the EAS build: `eas build -p android --profile production`.
