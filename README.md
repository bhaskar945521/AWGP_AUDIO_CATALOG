# 🎵 AWGP Audio Catalog

<div align="center">
  <img src="awgp.jpg" alt="AWGP Audio Catalog" width="180"/>

  <h3>All World Gayatri Pariwar — Audio Recording Management System</h3>
  <p>A full-stack web application to upload, manage, and catalog AWGP spiritual audio recordings.</p>

  ![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
  ![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
  ![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
  ![Express](https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white)
  ![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)
  ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [Running the App](#️-running-the-app)
- [API Routes](#-api-routes)
- [Default Admin Login](#-default-admin-login)

---

## ✨ Features

- 🔐 **User Authentication** — Register / Login with JWT tokens
- 🎵 **Audio Upload & Management** — Upload audio files with category & album tagging
- 🗂️ **Categories & Albums** — Organize audios into categories and albums
- 🖼️ **Gallery** — Image gallery management
- 🔍 **Search** — Search audios by title, category, album
- 🎙️ **Voice Search** — Search using voice input
- ❤️ **Favorites** — Mark & manage favorite audios
- 👤 **Admin Panel** — Full content & user management
- 🎛️ **Audio Player** — Built-in audio player with controls
- 📱 **Responsive Design** — Works on all screen sizes
- ⚙️ **Settings** — Site-wide settings management

---

## 🛠 Tech Stack

| Layer        | Technology                              |
|--------------|-----------------------------------------|
| **Frontend** | React 18, Vite 5, Tailwind CSS 3        |
| **Backend**  | Node.js, Express 5                      |
| **Database** | MongoDB with Mongoose                   |
| **Auth**     | JWT (JSON Web Tokens) + bcryptjs        |
| **Upload**   | Multer + FFmpeg (audio processing)      |
| **HTTP**     | Axios                                   |

---

## 📁 Project Structure

```
AWGP_AUDIO_CATALOG/
│
├── 📂 backend/                    # Node.js + Express API Server
│   ├── 📂 middleware/
│   │   ├── auth.js                # JWT authentication middleware
│   │   └── roleCheck.js           # Admin role check middleware
│   ├── 📂 models/
│   │   ├── User.js                # User schema
│   │   ├── Audio.js               # Audio schema
│   │   ├── Category.js            # Category schema
│   │   ├── Album.js               # Album schema
│   │   ├── GalleryImage.js        # Gallery image schema
│   │   └── Settings.js            # Site settings schema
│   ├── 📂 routes/
│   │   ├── auth.js                # /api/auth
│   │   ├── audios.js              # /api/audios
│   │   ├── categories.js          # /api/categories
│   │   ├── albums.js              # /api/albums
│   │   ├── users.js               # /api/users
│   │   ├── gallery.js             # /api/gallery
│   │   ├── search.js              # /api/search
│   │   └── settings.js            # /api/settings
│   ├── 📂 utils/
│   │   └── localStorage.js        # Upload directory helper
│   ├── 📂 uploads/                # Audio/image files (git-ignored)
│   ├── server.js                  # Main server entry point
│   ├── .env.example               # Environment variable template
│   └── package.json
│
├── 📂 frontend/                   # React + Vite Frontend
│   ├── 📂 public/                 # Static assets
│   ├── 📂 src/
│   │   ├── 📂 components/
│   │   │   ├── Admin.jsx           # Admin panel
│   │   │   ├── Dashboard.jsx       # Home dashboard
│   │   │   ├── Albums.jsx          # Albums listing
│   │   │   ├── AlbumDetails.jsx    # Single album view
│   │   │   ├── AlbumsManagement.jsx # Admin - manage albums
│   │   │   ├── AudioCard.jsx       # Audio item card
│   │   │   ├── AudioPlayer.jsx     # Global audio player
│   │   │   ├── CategoryCard.jsx    # Category card
│   │   │   ├── Favorites.jsx       # Favorites page
│   │   │   ├── Header.jsx          # Top navigation
│   │   │   ├── Footer.jsx          # Footer
│   │   │   ├── Layout.jsx          # Main layout wrapper
│   │   │   ├── Library.jsx         # Audio library
│   │   │   ├── Login.jsx           # Login/Register page
│   │   │   ├── Sidebar.jsx         # Side navigation
│   │   │   ├── UploadAudioModal.jsx # Audio upload modal
│   │   │   ├── UsersManagement.jsx # Admin - manage users
│   │   │   └── VoiceSearch.jsx     # Voice search component
│   │   ├── 📂 context/
│   │   │   ├── AuthContext.jsx     # Authentication context
│   │   │   └── AudioContext.jsx    # Audio player context
│   │   ├── App.jsx                 # Root component & routes
│   │   ├── api.js                  # Axios API config
│   │   └── main.jsx                # React entry point
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── .env.example                # Environment variable template
│   └── package.json
│
├── 📂 scripts/                    # Backup & restore scripts
│   ├── backup-windows.ps1
│   ├── backup-linux.sh
│   ├── restore-windows.ps1
│   └── restore-linux.sh
│
├── .gitignore
├── package.json                   # Root monorepo config
└── README.md
```

---

## 📦 Prerequisites

Install these before getting started:

| Tool | Version | Download |
|------|---------|----------|
| **Node.js** | v18 or higher | [nodejs.org](https://nodejs.org/) |
| **MongoDB** | v6+ (local) or Atlas | [mongodb.com](https://www.mongodb.com/try/download/community) |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |
| **npm** | v9+ (comes with Node.js) | — |

---

## 🚀 Installation & Setup

### Step 1 — Clone the Repository

```bash
git clone https://github.com/bhaskar945521/AWGP_AUDIO_CATALOG.git
cd AWGP_AUDIO_CATALOG
```

### Step 2 — Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
npm install --prefix backend

# Install frontend dependencies
npm install --prefix frontend
```

### Step 3 — Setup Environment Variables

**Windows:**
```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

**Mac / Linux:**
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Now open `backend/.env` and fill in your values:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string_here
JWT_SECRET=your_own_strong_secret_key_here
```

Frontend `.env` (usually no change needed for local):
```env
VITE_API_BASE_URL=http://localhost:5000
```

### Step 4 — Start MongoDB

**Local MongoDB:**
```bash
mongod
```

**Or** use a [MongoDB Atlas](https://www.mongodb.com/atlas) cloud connection string in `MONGODB_URI`.

---

## 🔧 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Express server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `your_mongodb_connection_string` |
| `JWT_SECRET`   | Secret key for JWT (must be strong & private!) | — |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:5000` |

---

## ▶️ Running the App

### Run Both Together (Recommended)

```bash
# From root directory
npm run dev
```

| Service | URL |
|---------|-----|
| 🌐 Frontend | http://localhost:5173 |
| 🔌 Backend API | http://localhost:5000 |
| 💓 Health Check | http://localhost:5000/api/health |

### Run Individually

```bash
# Backend only
npm run dev --prefix backend

# Frontend only
npm run dev --prefix frontend
```

---

## 🌐 API Routes

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login & get JWT token |

### Audios
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/audios` | Get all audios |
| `POST` | `/api/audios/upload` | Upload new audio (admin) |
| `GET` | `/api/audios/:id` | Get audio by ID |
| `PUT` | `/api/audios/:id` | Update audio (admin) |
| `DELETE` | `/api/audios/:id` | Delete audio (admin) |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/categories` | Get all categories |
| `POST` | `/api/categories` | Create category (admin) |
| `DELETE` | `/api/categories/:id` | Delete category (admin) |

### Albums
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/albums` | Get all albums |
| `POST` | `/api/albums` | Create album (admin) |
| `PUT` | `/api/albums/:id` | Update album (admin) |
| `DELETE` | `/api/albums/:id` | Delete album (admin) |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/search` | Search audios |
| `GET` | `/api/gallery` | Get gallery images |
| `GET` | `/api/users` | Get all users (admin) |
| `GET` | `/api/health` | Server health check |

---

## 🔑 Default Admin Login

A default admin account is **auto-created on first run**.

> ⚠️ **For security reasons, credentials are not shared here.**  
> Contact the project maintainer to get the default login credentials.  
> **Change the password immediately** after first login!

---

## 🔄 Updating the Code on GitHub

After making any changes:

```bash
git add .
git commit -m "describe what you changed"
git push
```

---

## 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">
  <p>Made with ❤️ for <strong>All World Gayatri Pariwar</strong></p>
  <p>Developed by <strong>Bhaskar</strong></p>
</div>
