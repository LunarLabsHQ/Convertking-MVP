# Deploy ConvertKing Server to DigitalOcean

## 🚀 Quick Deployment Guide

Your droplet IP: **159.89.170.181**

### Step 1: Connect to Your Droplet

From your local machine (Windows PowerShell or CMD):

```bash
ssh root@159.89.170.181
```

When prompted, enter your droplet password or use your SSH key.

### Step 2: Run Setup Script

Once connected to your droplet, run these commands:

```bash
# Download and run the setup script
curl -o setup.sh https://raw.githubusercontent.com/YOUR_REPO/main/server/setup-digitalocean.sh
chmod +x setup.sh
./setup.sh
```

**OR** manually copy the setup commands:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install FFmpeg and build tools
sudo apt install -y ffmpeg build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# Install PM2
sudo npm install -g pm2

# Create app directory
sudo mkdir -p /var/www/convertking
sudo chown -R $USER:$USER /var/www/convertking

# Configure firewall
sudo ufw allow OpenSSH
sudo ufw allow 5000/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Verify installations
node -v && npm -v && ffmpeg -version
```

### Step 3: Upload Your Server Code

**From your local machine** (open a NEW terminal/PowerShell window):

```powershell
# Navigate to your project
cd "C:\Users\shash\OneDrive\Desktop\Convertking MVP"

# Upload server folder
scp -r server root@159.89.170.181:/var/www/convertking/
```

**Alternative: Using Git (Recommended)**

On your droplet:
```bash
cd /var/www/convertking
git clone YOUR_GITHUB_REPO_URL .
# OR if already cloned:
git pull
```

### Step 4: Install Dependencies and Start Server

Back in your **droplet terminal**:

```bash
cd /var/www/convertking/server
npm install
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Copy and run the command that `pm2 startup` outputs (starts with `sudo env PATH=...`)

### Step 5: Test Your Server

Open your browser and visit:
```
http://159.89.170.181:5000/api/health
```

You should see: `{"status":"ok","message":"ConvertKing API is running"}`

## ✅ Your Server is Now Live!

**API Base URL**: `http://159.89.170.181:5000`

## 📝 Useful Commands

**Check server status:**
```bash
pm2 status
pm2 logs convertking-server
pm2 monit
```

**Restart server:**
```bash
pm2 restart convertking-server
```

**Stop server:**
```bash
pm2 stop convertking-server
```

**Update server code:**
```bash
# From local machine
scp -r server root@159.89.170.181:/var/www/convertking/

# On droplet
cd /var/www/convertking/server
npm install
pm2 restart convertking-server
```

## 🔒 Next Steps (Recommended)

### 1. Add a Domain Name (Optional)

1. Point your domain to `159.89.170.181`
2. Update client to use domain instead of IP

### 2. Install Nginx (Recommended)

```bash
sudo apt install -y nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/convertking
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name 159.89.170.181;  # or your domain

    client_max_body_size 500M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/convertking /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3. Add SSL Certificate (Free with Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

Follow the prompts. Your site will now be available at `https://your-domain.com`

## 🆘 Troubleshooting

### Can't connect via SSH
```bash
# Make sure you're using the correct credentials
ssh root@159.89.170.181
```

### Server won't start
```bash
pm2 logs convertking-server
# Check for errors
```

### Port 5000 not accessible
```bash
# Check firewall
sudo ufw status
sudo ufw allow 5000/tcp

# Check if server is running
pm2 status
```

### FFmpeg not working
```bash
which ffmpeg
# If not found:
sudo apt install -y ffmpeg
```

### npm install fails
```bash
# Install build tools
sudo apt install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```

## 💰 DigitalOcean Pricing

Recommended droplet sizes:
- **Basic ($6/month)**: 1 GB RAM, 1 CPU - Good for testing
- **Basic ($12/month)**: 2 GB RAM, 1 CPU - Recommended for production
- **General Purpose ($21/month)**: 2 GB RAM, 2 CPU - Better performance

## 🔄 Auto-Deployment with GitHub Actions (Advanced)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to DigitalOcean

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to DigitalOcean
        uses: appleboy/ssh-action@master
        with:
          host: 159.89.170.181
          username: root
          key: ${{ secrets.DO_SSH_KEY }}
          script: |
            cd /var/www/convertking
            git pull
            cd server
            npm install
            pm2 restart convertking-server
```

---

**Need help?** Check server logs with `pm2 logs convertking-server`
