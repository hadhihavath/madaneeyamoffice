# 🚀 Hostinger Deployment Guide
### CEEM MADANEEYAM OFFICE Management System

This guide outlines the exact, step-by-step instructions to deploy the CEEM Madaneeyam Office web application onto **Hostinger**.

---

## 📋 Recommended Hostinger Plan: **Hostinger KVM VPS**
Next.js 14 applications with App Router, server-side geofencing, Prisma ORM, and background workers run best on a **Hostinger VPS** (e.g., KVM 1 or KVM 2 running Ubuntu 22.04 or 24.04). 

---

# 🛠️ Method 1: Hostinger VPS Deployment (Best & Most Reliable)

### Step 1: Connect to your Hostinger VPS via SSH
Open your terminal (PowerShell, Command Prompt, or Mac/Linux Terminal) and connect using your VPS IP and root password provided in the Hostinger hPanel:
```bash
ssh root@YOUR_VPS_IP
```

---

### Step 2: Update the Server & Install Node.js 20 LTS + Git
Run the following commands one by one:
```bash
# 1. Update system packages
apt update && apt upgrade -y

# 2. Install Git, Curl, and build tools
apt install -y curl git nginx ufw

# 3. Install Node.js 20 LTS (NodeSource repository)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 4. Verify Node.js and NPM versions
node -v   # Should output v20.x.x
npm -v    # Should output 10.x.x

# 5. Install PM2 globally (production process manager)
npm install -g pm2
```

---

### Step 3: Clone the GitHub Repository
Navigate to `/var/www` and clone your project repository:
```bash
cd /var/www
git clone https://github.com/hadhihavath/madaneeyamoffice.git
cd madaneeyamoffice
```

---

### Step 4: Configure Production Environment Variables (`.env`)
Create the production `.env` file on the server:
```bash
nano .env
```
Paste your production environment variables:
```env
# Database Connection (Supabase PostgreSQL pooler string)
DATABASE_URL="postgresql://postgres.tsowjdcvaovlhpuhmndz:gVRw27_j*FNvsT5@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"

# Cryptographically Secure 256-bit JWT Secret
JWT_SECRET="02d56b55f88130046e9c97cc7d7def2b6968b28fef1b1e5d9e0946f09f976256"

# Keep demo mode strictly disabled in production
ENABLE_DEMO_MODE="false"
NEXT_PUBLIC_ENABLE_DEMO_MODE="false"

# Production flags
NODE_ENV="production"
PORT=3000
```
*Press `CTRL + O`, then `Enter` to save, and `CTRL + X` to exit `nano`.*

---

### Step 5: Install Dependencies & Build Application
```bash
# 1. Install all dependencies
npm install

# 2. Generate Prisma client & sync schema
npx prisma generate
npx prisma db push

# 3. Build the Next.js production bundle
npm run build
```

---

### Step 6: Start the Application with PM2
Use the included `ecosystem.config.js` to run the app in the background with auto-restart on crashes or system reboots:
```bash
# Start the app with PM2
pm2 start ecosystem.config.js

# Save PM2 state so it restarts automatically on server reboot
pm2 save
pm2 startup
# (Run any command that pm2 startup outputs in your terminal)
```

Verify the app is running:
```bash
pm2 status
```

---

### Step 7: Configure Nginx as Reverse Proxy
Set up Nginx to route domain traffic (port 80/443) to your Next.js app on port 3000:

1. Create a new Nginx site configuration:
```bash
nano /etc/nginx/sites-available/madaneeyamoffice
```

2. Paste the following configuration (replace `yourdomain.com` with your actual domain name):
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

3. Enable the site and restart Nginx:
```bash
ln -s /etc/nginx/sites-available/madaneeyamoffice /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

---

### Step 8: Install Free SSL Certificate (HTTPS)
Use Certbot to get an automatic, auto-renewing Let's Encrypt SSL certificate:
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```
*Certbot will automatically update your Nginx configuration to force HTTPS.*

---

### Step 9: Configure Server Firewall (UFW)
Secure your VPS by only opening SSH, HTTP, and HTTPS:
```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

---

## 🔄 How to Deploy Updates in the Future
Whenever you push changes to GitHub, update your live server in 3 quick commands:
```bash
cd /var/www/madaneeyamoffice
git pull origin main
npm install
npm run build
pm2 reload all
```

---

# 🌐 Method 2: Hostinger Cloud / Web Hosting (hPanel Node.js Selector)

If you are using Hostinger Shared or Cloud Hosting (cPanel/hPanel) with the **Node.js** feature:

1. Log in to **Hostinger hPanel**.
2. Go to **Websites** ➔ **Manage** ➔ Search for **Node.js**.
3. Click **Create Application**:
   - **Node.js version**: Choose `20.x`
   - **Application root**: `madaneeyamoffice`
   - **Application startup file**: `server.js` (or `.next/standalone/server.js`)
   - **Environment Variables**:
     - `DATABASE_URL`: *(Your Supabase connection string)*
     - `JWT_SECRET`: `02d56b55f88130046e9c97cc7d7def2b6968b28fef1b1e5d9e0946f09f976256`
     - `ENABLE_DEMO_MODE`: `false`
     - `NEXT_PUBLIC_ENABLE_DEMO_MODE`: `false`
     - `NODE_ENV`: `production`
4. Connect via Git or upload the project files using FTP / File Manager.
5. In the Hostinger Terminal or SSH:
   ```bash
   npm install
   npx prisma generate
   npm run build
   ```
6. Click **Restart Application** in hPanel.
