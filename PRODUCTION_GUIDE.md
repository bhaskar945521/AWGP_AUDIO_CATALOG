# AWGP Audio Catalog - Production Deployment & Troubleshooting Guide

---

## 🚨 **IMPORTANT ROOT CAUSE ANALYSIS**
Based on your symptoms ("first load works, after refresh/restart images/audio disappear"):

### **MOST LIKELY ISSUE**: EPHEMERAL STORAGE
If you're hosting on:
- **Render**
- **Heroku**
- **Railway**
- **Vercel (Serverless)**
- **Netlify (Functions)**
- **Any PaaS with "ephemeral" filesystem**

then **uploaded files disappear every time the server restarts or redeploys!** This is by design of those platforms!

### **SOLUTION FOR EPHEMERAL STORAGE**:
You need **persistent storage**:
1. **Option 1 (Recommended)**: Add a persistent disk to your hosting (e.g., Render Disks, Heroku Postgres with files, etc.)
2. **Option 2**: Use S3/GCS/Azure Blob Storage for media files
3. **Option 3**: Host on a VPS (DigitalOcean, AWS EC2, etc.) with persistent storage

---

## ✅ **Production Setup Checklist**

1. **Environment Variables (.env in backend/)**
   ```env
   PORT=5000
   MONGODB_URI=mongodb+srv://<username>:<password>@... (use production MongoDB!)
   JWT_SECRET=your-very-secure-secret-key-here
   NODE_ENV=production
   ```

2. **Verify Frontend VITE_API_BASE_URL**
   - If frontend is hosted separately (Netlify/Vercel): Set to your backend URL, e.g., `https://your-backend.onrender.com`
   - If frontend is served by same backend: Leave empty (`''`)

3. **Verify Uploads Folder Permissions**
   ```bash
   # On Linux/macOS
   chmod -R 755 backend/uploads
   chown -R your-server-user:your-server-group backend/uploads
   ```

4. **Check Health Endpoint**
   Visit `https://your-backend.com/api/health` to verify:
   - `uploadsExists` is true
   - `uploadsDir` is correct path
   - `frontendDistExists` is true (if serving frontend from backend)

---

## 🔍 **Troubleshooting Flow**

### **Step 1: Check Server Logs**
Look for these log messages:
- `[Server] Uploads directory: /path/to/uploads` → Verify correct path
- `[Uploads] Request: GET /uploads/...` → Verify requests are reaching server
- `[Uploads] File not found: /path/to/file` → If you see this, file is missing!

### **Step 2: Check Browser Network Tab**
1. Open DevTools (F12) → Network
2. Refresh page
3. Look for failed requests (red):
   - Status 404? → File missing or path wrong
   - Status 403? → Permissions issue
   - CORS error? → Check CORS origins in server.js

### **Step 3: Test Direct File Access**
Try accessing a file directly in browser:
`https://your-backend.com/uploads/categories/your-image.jpg`

### **Step 4: Check if Files Exist on Server**
SSH/connect to your server and run:
```bash
cd path/to/backend
ls -la uploads/
ls -la uploads/categories/
ls -la uploads/audios/
```
→ If folders are empty, ephemeral storage is your problem!

---

## 🔧 **Permanent Fixes Implemented in Code**

1. **Enhanced Server.js**
   - Added `/api/health` diagnostics endpoint
   - Added detailed uploads request logging
   - Robust SPA catch-all that never interferes with /uploads
   - Explicit STORAGE_FOLDERS initialization

2. **Enhanced API.js (Frontend)**
   - More robust `resolveUrl()` function for production URLs
   - Better handling of relative vs absolute paths

3. **Always-create-all-folders** via localStorage.js
   - `ensureDir()` creates all needed subfolders on app start

---

## 📞 **Still having issues?**

1. Collect these and check:
   - Server logs (especially `[Server]` and `[Uploads]` lines)
   - Browser Network tab screenshot
   - `/api/health` response JSON
   - ls -la of backend/uploads folder

2. Common Mistakes:
   - Forgetting to set NODE_ENV=production
   - Frontend and backend on different domains without proper BASE_URL
   - Hosting on platform with ephemeral storage
   - File permissions too strict
   - MongoDB not connected properly
