# Deployment Guide for AWGP Audio Hub

This document is a detailed installation and deployment guide for running AWGP Audio Hub on another machine or local server.

It is written specifically for setup on a fresh system, including dependencies, environment variables, database connection, Cloudinary configuration, and startup steps.

---

## 1. Project Overview

AWGP Audio Hub is a full-stack application with:
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB
- Media storage: Cloudinary

The project is organized as:
- frontend/ for the React app
- backend/ for the Express API
- root package.json for running both together

---

## 2. System Requirements

Make sure the target system has:
- Node.js 18 or higher
- npm 9 or higher
- MongoDB running locally or a MongoDB Atlas connection string
- A Cloudinary account for media storage
- Internet access for npm install and Cloudinary access

Verify installation:

```bash
node -v
npm -v
```

If Node.js is not installed, install it first before continuing.

---

## 3. Clone or Copy the Project

If you are setting this up on a new machine, clone the repository:

```bash
git clone <repository-url>
cd AWGP_AUDIO_CATLOG
```

If you already have the project folder on the server, go directly into it:

```bash
cd /path/to/AWGP_AUDIO_CATLOG
```

---

## 4. Install Dependencies

Run these commands from the project root:

```bash
npm install
```

Then install backend dependencies:

```bash
cd backend
npm install
cd ..
```

Then install frontend dependencies:

```bash
cd frontend
npm install
cd ..
```

This is required because the project has separate package.json files for backend and frontend.

---

## 5. Database Setup

### Option A: Local MongoDB
If MongoDB is installed locally, start it first:

```bash
mongod
```

Then use this in the backend environment:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/awgp_audio_catalog
```

### Option B: MongoDB Atlas
If you want to use a cloud database instead of a local one:

1. Create a MongoDB Atlas account.
2. Create a cluster.
3. Get the connection string.
4. Use it in the backend environment:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/awgp_audio_catalog?retryWrites=true&w=majority
```

The app will create the needed data on first use, but the database must be reachable.

---

## 6. Cloudinary Setup

Cloudinary is used for storing uploaded media such as:
- audio files
- audio thumbnails
- category cover images
- gallery images

### Steps
1. Create an account at https://cloudinary.com/
2. Open the Cloudinary dashboard.
3. Copy these values:
   - Cloud Name
   - API Key
   - API Secret
4. Add them to the backend environment file.

Example:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Without valid Cloudinary credentials, media uploads may fail.

---

## 7. Environment Configuration

Create the backend environment file:

```bash
cd backend
notepad .env
```

Paste the following content and replace the placeholder values:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/awgp_audio_catalog
JWT_SECRET=awgp_audio_catalog_super_secret_jwt_key_2026
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

If you are on Linux or macOS, use `nano` or `vim` instead of `notepad`.

> Important: Keep the `.env` file private and never commit it to Git.

---

## 8. Run the Application Locally

From the project root, start the full app:

```bash
npm run dev
```

This should run:
- Backend: http://localhost:5000
- Frontend: http://localhost:5173

If you prefer to run them separately:

### Backend terminal

```bash
cd backend
npm run dev
```

### Frontend terminal

```bash
cd frontend
npm run dev
```

Once both are running, open the frontend URL in the browser.

---

## 9. Build for Production

If you want to test a production build locally:

### Frontend build

```bash
cd frontend
npm run build
```

The build output will be created in:
- frontend/dist/

### Backend production start

```bash
cd backend
node server.js
```

For a stable server setup, use a process manager such as PM2.

---

## 10. Production Deployment Options

If you want to host this on a public server later, these are the common options:

### Option A: Deploy on a VPS / Ubuntu Server
Recommended stack:
- Ubuntu server
- Node.js installed
- Nginx as reverse proxy
- PM2 to keep the backend running
- MongoDB Atlas for database
- Cloudinary for media storage

#### Install Node.js on Ubuntu

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -bash -
sudo apt-get install -y nodejs
```

#### Install Nginx

```bash
sudo apt-get update
sudo apt-get install -y nginx
```

#### Install PM2

```bash
sudo npm install -g pm2
```

#### Upload project files
Copy the project folder to the server using SCP, Git, or your deployment tool.

#### Install dependencies on server

```bash
cd /path/to/AWGP_AUDIO_CATLOG
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

#### Create environment file

```bash
cd backend
nano .env
```

Fill in the required environment values.

#### Start backend with PM2

```bash
cd backend
pm2 start server.js --name awgp-backend
pm2 save
pm2 startup
```

#### Build frontend

```bash
cd frontend
npm run build
```

#### Configure Nginx
Create a config file such as:

```bash
sudo nano /etc/nginx/sites-available/awgp
```

Example config:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        root /path/to/AWGP_AUDIO_CATLOG/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/awgp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### Option B: Deploy on Render / Railway / Vercel + Render
This project can also be deployed in a split setup:
- Frontend: Vercel or Netlify
- Backend: Render or Railway
- MongoDB: Atlas
- Cloudinary: external service

#### Frontend
- Connect the frontend folder to Vercel or Netlify
- Set build command:

```bash
npm run build
```

- Publish directory:

```bash
frontend/dist
```

#### Backend
- Deploy the backend folder to Render or Railway
- Set environment variables:
  - PORT
  - MONGODB_URI
  - JWT_SECRET
  - CLOUDINARY_CLOUD_NAME
  - CLOUDINARY_API_KEY
  - CLOUDINARY_API_SECRET

> Note: Because the frontend uses client-side routes, the hosting platform must support SPA fallback to index.html.

---

## 11. Recommended Production Checklist

Before going live, verify:
- MongoDB connection is working
- Cloudinary credentials are valid
- JWT secret is set securely
- Backend starts successfully without errors
- Frontend production build succeeds
- Admin login works
- Audio upload works
- Image upload and gallery work
- Route refresh works in production

---

## 12. Common Issues

### Port already in use
Change the backend port in .env:

```env
PORT=5001
```

### MongoDB connection error
Check:
- username/password
- cluster URL
- network access
- database name

### Cloudinary upload fails
Check:
- cloud name
- API key
- API secret
- account permissions

### Frontend blank page after deployment
Ensure SPA fallback is enabled and the server returns index.html for non-API routes.

---

## 13. Useful Commands

```bash
# Start development
npm run dev

# Build frontend
cd frontend && npm run build

# Start backend
cd backend && node server.js

# Check PM2 processes
pm2 list

# Restart backend
pm2 restart awgp-backend
```

---

## 14. Final Notes

For a production-grade deployment, the most reliable setup is:
- MongoDB Atlas for database
- Cloudinary for media assets
- PM2 + Nginx on a VPS

This setup is simple, scalable, and suitable for hosting AWGP Audio Hub publicly.
