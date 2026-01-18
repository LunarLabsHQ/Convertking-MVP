# Deploy ConvertKing Frontend to Vercel

## 🚀 Quick Deployment Guide

Your backend is already running at: **http://159.89.170.181:5000**

This guide will help you deploy the frontend to Vercel and connect it to your DigitalOcean backend.

---

## Method 1: Deploy via Vercel CLI (Recommended)

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Navigate to Client Directory

```bash
cd "C:\Users\shash\OneDrive\Desktop\Convertking MVP\client"
```

### Step 3: Login to Vercel

```bash
vercel login
```

Follow the prompts to login with your Vercel account.

### Step 4: Deploy

```bash
vercel
```

When prompted:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account
- **Link to existing project?** → No
- **Project name?** → `convertking` (or your preferred name)
- **In which directory is your code located?** → `./` (current directory)
- **Want to override settings?** → Yes
- **Build Command:** → `npm run build`
- **Output Directory:** → `dist`
- **Development Command:** → `npm run dev`

### Step 5: Add Environment Variable

After deployment, add your backend URL:

```bash
vercel env add VITE_API_URL
```

When prompted:
- **Value:** `http://159.89.170.181:5000`
- **Environment:** Select `Production`, `Preview`, and `Development`

### Step 6: Redeploy with Environment Variable

```bash
vercel --prod
```

Your app is now live! 🎉

---

## Method 2: Deploy via Vercel Dashboard

### Step 1: Push Code to GitHub

If not already done, push your code to GitHub:

```bash
cd "C:\Users\shash\OneDrive\Desktop\Convertking MVP"
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### Step 2: Import Project to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset:** Vite
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### Step 3: Add Environment Variables

Before deploying, add environment variable:

1. In project settings, go to **"Environment Variables"**
2. Add new variable:
   - **Name:** `VITE_API_URL`
   - **Value:** `http://159.89.170.181:5000`
   - **Environment:** Production, Preview, Development

### Step 4: Deploy

Click **"Deploy"** and wait for the build to complete!

---

## ⚠️ Important: Update Backend CORS

Your backend needs to allow requests from your Vercel domain.

### Step 1: Get Your Vercel URL

After deployment, note your Vercel URL (e.g., `https://convertking-abc123.vercel.app`)

### Step 2: Update Backend CORS Settings

SSH into your DigitalOcean droplet:

```bash
ssh root@159.89.170.181
```

Edit the server file:

```bash
cd /var/www/convertking/server
nano server-hono.js
```

Find the CORS configuration (around line 24-27) and update it:

```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'https://convertking-abc123.vercel.app', // Add your Vercel URL here
  'https://*.vercel.app', // Allow all Vercel preview deployments
  process.env.FRONTEND_URL,
].filter(Boolean)
```

Save the file (Ctrl+X, then Y, then Enter) and restart the server:

```bash
pm2 restart convertking-server
```

---

## 🔒 Optional: Use HTTPS for Backend (Recommended)

Your backend currently uses HTTP. For production, you should use HTTPS.

### Quick Setup with Nginx + Let's Encrypt

1. **Add a domain to your backend** (e.g., `api.convertking.com`)
2. **Point domain to** `159.89.170.181`
3. **Install Nginx** (if not already installed):

```bash
sudo apt install -y nginx
```

4. **Create Nginx config:**

```bash
sudo nano /etc/nginx/sites-available/convertking
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name api.convertking.com;  # Replace with your domain

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

5. **Enable the site:**

```bash
sudo ln -s /etc/nginx/sites-available/convertking /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

6. **Install SSL certificate:**

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.convertking.com
```

7. **Update Vercel environment variable:**

Go to Vercel dashboard → Your project → Settings → Environment Variables

Update `VITE_API_URL` to `https://api.convertking.com`

Then redeploy your frontend.

---

## ✅ Verification

After deployment, test your app:

1. **Visit your Vercel URL**
2. **Upload a file** and convert it
3. **Check browser console** (F12) for any errors
4. **Verify backend connection** - you should see API requests in the Network tab

---

## 🐛 Troubleshooting

### Error: "Failed to fetch" or CORS error

- Make sure you updated the backend CORS settings with your Vercel URL
- Restart the backend server: `pm2 restart convertking-server`

### Error: "Network request failed"

- Check if your backend is running: `curl http://159.89.170.181:5000/api/health`
- Check backend logs: `pm2 logs convertking-server`

### Build fails on Vercel

- Make sure `client` is selected as the root directory
- Check that `package.json` has the correct build script
- Check Vercel build logs for specific errors

### Environment variable not working

- Make sure the variable name is exactly `VITE_API_URL` (case-sensitive)
- Redeploy after adding environment variables
- Variables starting with `VITE_` are required for Vite to expose them to the client

---

## 📱 Custom Domain (Optional)

To use your own domain (e.g., `convertking.com`):

1. Go to Vercel dashboard → Your project → Settings → Domains
2. Add your domain
3. Update your domain's DNS records as instructed by Vercel
4. SSL certificate will be automatically provisioned

---

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to GitHub:

1. Make changes to your code
2. Commit and push:
   ```bash
   git add .
   git commit -m "Update frontend"
   git push origin main
   ```
3. Vercel automatically builds and deploys!

---

## 📊 Monitoring

- **Vercel Analytics:** Enable in project settings for performance insights
- **Backend Logs:** `pm2 logs convertking-server` on your DigitalOcean droplet
- **Backend Status:** `pm2 status` to check server health

---

## 💰 Cost

- **Vercel Hobby (Free):**
  - 100 GB bandwidth/month
  - Unlimited projects
  - Automatic HTTPS
  - Perfect for this use case!

- **DigitalOcean Droplet:**
  - Already running at $6-12/month
  - Handles all heavy file conversions

---

## 🎯 Next Steps

1. ✅ Deploy frontend to Vercel
2. ✅ Update backend CORS
3. 🔒 Add HTTPS to backend (optional but recommended)
4. 🌐 Add custom domain (optional)
5. 📈 Enable analytics (optional)

---

**Need help?** Check the Vercel deployment logs or backend logs with `pm2 logs convertking-server`

Your ConvertKing app is ready to serve users worldwide! 🌍
