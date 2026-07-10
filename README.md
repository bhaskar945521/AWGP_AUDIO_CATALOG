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
- [Permissions System](#-permissions-system)
- [Changelog](#-changelog)

---

## ✨ Features

- 🔐 **User Authentication**:
  - Public User Registration/Login with JWT
  - Admin Login via CTRL+SHIFT+A (Hidden on Landing Page)
  - Multiple User Roles: Admin, User, OnlyUser, PublicUser
- 🔐 **Dynamic Permissions System**:
  - Granular permissions for audio, categories, albums, feedback, analytics
  - Admin has full access
  - OnlyUser gets assigned specific permissions
- 🎵 **Audio Library Management**:
  - Upload & manage audio files (with auto-conversion to MP3)
  - Search & filter functionality (Hindi/English bilingual support)
  - Voice search (Hindi/English)
- 🗂️ **Category & Album Management**:
  - Create/edit/delete categories (with cover images)
  - Create/edit/delete albums with cover images
  - Add audio tracks to albums
- ❤️ **Favorites System**:
  - Add/remove favorites per user
  - My Favorites page
- 👍 **Like/Dislike System**:
  - Like/dislike audio tracks
  - One like/dislike per user
- 💬 **Feedback System**:
  - Public users can submit feedback (with optional rating)
  - Users can edit/delete their own feedback
  - Admin/authorized users can view/delete feedback
- 📊 **Analytics Dashboard**:
  - Total users, active users, total audio, albums, categories
  - Likes, dislikes, favorites, feedback stats
  - Most played audio, most liked, most favorited, most active user
- 📱 **Responsive design**:
  - Mobile-friendly with specific breakpoints
- 📷 **Gallery Management**:
  - Upload/delete gallery images
- 🔍 **Search System**:
  - Bilingual (Hindi ↔ English) synonym search
  - Voice search support
- 🎨 **Customizable Settings**:
  - Customize site title, logo, colors via admin panel

---

## 🛠 Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS      |
| Backend    | Node.js, Express 5                |
| Database   | MongoDB (with Mongoose)           |
| Auth       | JWT (JSON Web Tokens)             |
| File Upload| Multer, FFmpeg                    |

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
git clone https://github.com/bhaskar945521/AWGP_AUDIO_CATLOG.git
cd AWGP_AUDIO_CATLOG
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
ADMIN_USERNAME=admin  # Optional, defaults to shantikunjadmin
ADMIN_PASSWORD=pass   # Optional, defaults to Shantikunj2026
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
AWGP_AUDIO_CATLOG/
├── 📂 backend/              # Node.js + Express API
│   ├── 📂 middleware/       # Auth, role, permission middleware
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
│   │   ├── 📂 context/     # React Context (auth, audio)
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
| `ADMIN_USERNAME` | Default admin username              | `shantikunjadmin`                             |
| `ADMIN_PASSWORD` | Default admin password              | `Shantikunj2026`                             |

### Frontend (`frontend/.env`)

| Variable              | Description               | Default                   |
|-----------------------|---------------------------|---------------------------|
| `VITE_API_BASE_URL`   | URL of the backend API    | `http://localhost:5000`   |

---

## 🌐 API Overview

### Authentication
| Method | Endpoint                | Description              |
|--------|-------------------------|--------------------------|
| POST   | `/api/register`         | Register a new public user |
| POST   | `/api/login`            | Login as public user     |
| POST   | `/api/logout`           | Logout user              |
| POST   | `/api/auth/login`       | Admin login              |
| GET    | `/api/auth/me`          | Get current user         |

### Users
| Method | Endpoint                | Description              |
|--------|-------------------------|--------------------------|
| GET    | `/api/users`            | Get all users (admin)    |
| POST   | `/api/users`            | Create new user (admin)  |
| PUT    | `/api/users/:id`        | Update user (admin)      |
| DELETE | `/api/users/:id`        | Delete user (admin)      |

### Audios
| Method | Endpoint                | Description              |
|--------|-------------------------|--------------------------|
| GET    | `/api/audios`           | Get all audios           |
| POST   | `/api/audios`           | Upload audio (requires `audio_upload`) |
| PUT    | `/api/audios/:id`       | Update audio (requires `audio_edit`) |
| DELETE | `/api/audios/:id`       | Delete audio (requires `audio_delete`) |

### Categories
| Method | Endpoint                | Description              |
|--------|-------------------------|--------------------------|
| GET    | `/api/categories`       | Get all categories       |
| POST   | `/api/categories`       | Create category (requires `category_create`) |
| PATCH  | `/api/categories/:id`   | Update category (requires `category_edit`) |
| DELETE | `/api/categories/:id`   | Delete category (requires `category_delete`) |

### Albums
| Method | Endpoint                | Description              |
|--------|-------------------------|--------------------------|
| GET    | `/api/albums`           | Get all albums           |
| POST   | `/api/albums`           | Create album (requires `album_create`) |
| PUT    | `/api/albums/:id`       | Update album (requires `album_edit`) |
| DELETE | `/api/albums/:id`       | Delete album (requires `album_delete`) |

### Favorites
| Method | Endpoint                | Description              |
|--------|-------------------------|--------------------------|
| GET    | `/api/user/favorites`   | Get user's favorites     |
| PATCH  | `/api/audios/:id/favorite` | Toggle favorite |

### Likes/Dislikes
| Method | Endpoint                | Description              |
|--------|-------------------------|--------------------------|
| POST   | `/api/audios/:id/like`  | Like audio (removes dislike) |
| POST   | `/api/audios/:id/dislike` | Dislike audio (removes like) |

### Feedback
| Method | Endpoint                | Description              |
|--------|-------------------------|--------------------------|
| POST   | `/api/feedback`         | Submit feedback          |
| GET    | `/api/feedback`         | Get feedback (requires `feedback_view`) |
| DELETE | `/api/feedback/:id`     | Delete feedback (requires `feedback_delete`) |

### Analytics
| Method | Endpoint                | Description              |
|--------|-------------------------|--------------------------|
| GET    | `/api/analytics`        | Get analytics (requires `analytics_view`) |

### Search
| Method | Endpoint                | Description              |
|--------|-------------------------|--------------------------|
| GET    | `/api/search`           | Bilingual search         |

---

## 🔐 Permissions System

### Available Permissions
| Group               | Permissions                          |
|---------------------|--------------------------------------|
| Audio Library       | `audio_view`, `audio_upload`, `audio_edit`, `audio_delete` |
| Category Management | `category_view`, `category_create`, `category_edit`, `category_delete` |
| Album Management    | `album_view`, `album_create`, `album_edit`, `album_delete` |
| Feedback Management | `feedback_view`, `feedback_delete`  |
| Analytics Dashboard | `analytics_view`                     |
| User Management     | Admin Only                          |
| Website Settings    | Admin Only                          |

---

## 📝 Changelog

### Latest Changes (2026-07-10)

1. **Dynamic Permissions System**
   - Added `permissions` field to User model
   - Created new `permissionCheck` middleware
   - Updated all backend routes to enforce permissions
   - Added UI in UsersManagement for assigning permissions via checkboxes
   - Updated frontend components to show/hide features based on permissions

2. **Updated Auth System**
   - Added permissions to JWT tokens
   - Added `/api/auth/me` endpoint for fetching current user
   - Updated login/register responses to include permissions
   - Added `hasPermission` and `hasAnyPermission` functions in AuthContext

3. **Improved Admin Panel**
   - Tabs shown/hidden based on user permissions
   - Upload button only visible if user has `audio_upload` permission
   - UsersManagement with full name, email, and permissions

4. **AudioCard Improvements**
   - Show edit/delete/add-to-album buttons only if user has permissions
   - Uses api module instead of direct axios

5. **Category Dropdown Improvements**
   - Max height of ~7 categories, smooth vertical scrolling
   - Custom scrollbar styling

6. **Favorites, Like/Dislike, Feedback**
   - All existing features maintained and working correctly

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/YourFeature`
3. Commit your changes: `git commit -m 'Add YourFeature'`
4. Push to the branch: `git push origin feature/YourFeature`
5. Open a Pull Request

---

<div align="center">
  Made with ❤️ for All World Gayatri Pariwar
</div>
