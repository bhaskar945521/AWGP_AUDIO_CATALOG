# 🎵 AWGP Audio Catalog

<div align="center">
  <img src="awgp.jpg" alt="AWGP Audio Catalog" width="200"/>
  
  <p><strong>A full-stack web application for managing and cataloging AWGP (All World Gayatri Pariwar) audio recordings.</strong></p>

  ![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)
  ![React](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react)
  ![MongoDB](https://img.shields.io/badge/MongoDB-6+-green?style=flat-square&logo=mongodb)
  ![Express](https://img.shields.io/badge/Express-5-black?style=flat-square&logo=express)
</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Running the App](#-running-the-app)
- [Project Structure](#-project-structure)
- [Environment Variables](#-environment-variables)
- [API Overview](#-api-overview)

---

## ✨ Features

- 🔐 User Authentication (Register / Login with JWT)
- 🎵 Upload & manage audio files
- 🗂️ Categorized audio catalog
- 🔍 Search & filter functionality
- 👤 Admin panel for content management
- 📱 Responsive design (mobile-friendly)

---

## 🛠 Tech Stack

| Layer      | Technology                        |
|------------|----------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS     |
| Backend    | Node.js, Express 5               |
| Database   | MongoDB (with Mongoose)          |
| Auth       | JWT (JSON Web Tokens)            |
| File Upload| Multer, FFmpeg                   |

---

## 📦 Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** v18 or higher → [Download](https://nodejs.org/)
- **MongoDB** (local or cloud) → [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/atlas)
- **Git** → [Download](https://git-scm.com/)
- **npm** v9+ (comes with Node.js)

---

## 🚀 Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/bhaskar945521/AWGP_AUDIO_CATALOG.git
cd AWGP_AUDIO_CATALOG
```

### Step 2: Install All Dependencies (Root + Frontend + Backend)

```bash
npm install
npm install --prefix frontend
npm install --prefix backend
```

### Step 3: Configure Environment Variables

#### Backend `.env`
```bash
# Navigate to backend folder and copy the example file
cp backend/.env.example backend/.env
```
Then open `backend/.env` and update the values:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/awgp-audio-catalog
JWT_SECRET=your-very-secret-key-change-this
```

#### Frontend `.env`
```bash
# Navigate to frontend folder and copy the example file
cp frontend/.env.example frontend/.env
```
Then open `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

> **Windows users:** Use `copy` instead of `cp`:
> ```
> copy backend\.env.example backend\.env
> copy frontend\.env.example frontend\.env
> ```

### Step 4: Start MongoDB

Make sure MongoDB is running on your machine:

```bash
# If using local MongoDB:
mongod
```

Or use a MongoDB Atlas connection string in `backend/.env`.

---

## ▶️ Running the App

### Run Frontend + Backend Together (Recommended)

```bash
# From the root directory:
npm run dev
```

This starts:
- **Frontend** at → `http://localhost:5173`
- **Backend** at → `http://localhost:5000`

### Run Individually

```bash
# Backend only
npm run dev --prefix backend

# Frontend only
npm run dev --prefix frontend
```

---

## 📁 Project Structure

```
AWGP_AUDIO_CATALOG/
├── 📂 backend/              # Node.js + Express API
│   ├── 📂 middleware/       # Auth & other middleware
│   ├── 📂 models/          # Mongoose models (User, Audio, etc.)
│   ├── 📂 routes/          # API route handlers
│   ├── 📂 utils/           # Helper utilities
│   ├── 📂 uploads/         # Uploaded audio files (not tracked by git)
│   ├── server.js           # Entry point
│   ├── .env.example        # Environment variable template
│   └── package.json
│
├── 📂 frontend/             # React + Vite app
│   ├── 📂 src/
│   │   ├── 📂 components/  # Reusable UI components
│   │   ├── 📂 pages/       # Page components
│   │   ├── 📂 context/     # React Context (auth, etc.)
│   │   └── App.jsx         # Root component
│   ├── index.html
│   ├── .env.example        # Environment variable template
│   └── package.json
│
├── .gitignore
├── package.json            # Root monorepo config
└── README.md
```

---

## 🔧 Environment Variables

### Backend (`backend/.env`)

| Variable       | Description                          | Default                                       |
|----------------|--------------------------------------|-----------------------------------------------|
| `PORT`         | Port for the Express server          | `5000`                                        |
| `MONGODB_URI`  | MongoDB connection string            | `mongodb://localhost:27017/awgp-audio-catalog`|
| `JWT_SECRET`   | Secret key for JWT signing           | *(must be changed in production)*            |

### Frontend (`frontend/.env`)

| Variable              | Description               | Default                   |
|-----------------------|---------------------------|---------------------------|
| `VITE_API_BASE_URL`   | URL of the backend API    | `http://localhost:5000`   |

---

## 🌐 API Overview

| Method | Endpoint                | Description              |
|--------|-------------------------|--------------------------|
| POST   | `/api/auth/register`    | Register a new user      |
| POST   | `/api/auth/login`       | Login & get JWT token    |
| GET    | `/api/audio`            | Get all audio files      |
| POST   | `/api/audio/upload`     | Upload new audio (admin) |
| GET    | `/api/audio/:id`        | Get audio by ID          |
| DELETE | `/api/audio/:id`        | Delete audio (admin)     |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/YourFeature`
3. Commit your changes: `git commit -m 'Add YourFeature'`
4. Push to the branch: `git push origin feature/YourFeature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">
  Made with ❤️ for All World Gayatri Pariwar
</div>
