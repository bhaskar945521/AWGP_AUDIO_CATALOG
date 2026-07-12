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
  - **Smart Relevance Search** — results sorted by score (Exact > Starts-With > Contains > Speaker > Tags)
  - Hindi/English bilingual synonym support + Voice search
- 🗂️ **Category & Album Management**:
  - Create/edit/delete categories (with cover images)
  - Create/edit/delete albums with cover images
  - Add audio tracks to albums
- ❤️ **Favorites System** (User-Specific):
  - Completely per-user favorites — each account has its own playlist
  - Works for all roles: Admin, OnlyUser, Public User
  - Add/remove via heart button on any card, player, or details page
  - My Favorites page shows only the logged-in user's saved tracks
- 👍 **Like / Dislike System** (Per-User, Mutually Exclusive):
  - Each user's like/dislike is independent
  - Liking removes any existing dislike and vice versa (mutual exclusion)
  - Real-time counts shown on audio detail page
- 💬 **Feedback / Comment System**:
  - Any logged-in user can submit feedback with optional star rating (1–5)
  - Includes a **Short Feedback Summary** field (max 100 chars) for the public marquee
  - Track-specific and general feedback support
  - Admin / authorized OnlyUsers can view and delete all feedback
- 📣 **Public Feedback Marquee Ticker** (NEW):
  - Scrolling ticker bar displayed at the top of every page — visible to all visitors
  - Shows: 🎵 Track Title · (Speaker) | Username: "Short feedback"
  - **Pause on hover**, **click to navigate** directly to that audio's detail page
  - Only admin-approved reviews appear in the marquee
- 🛡️ **Admin Feedback Approval System** (NEW):
  - Admin reviews each feedback submission before it goes public
  - Toggle "Approve for Ticker" on/off per feedback
  - Edit the short summary text inline before approving
  - Unapproved feedback stays private; approved ones appear in the live marquee
- 📊 **Analytics Dashboard** (Admin & Permission-Based):
  - Total favorites, likes, dislikes, feedback, sessions, listening minutes, unique listeners
  - Top 5 most liked tracks
  - Recent feedback entries
  - **User Activity Table**: per-user breakdown — sessions, total time, last seen
- 📱 **Responsive Design**:
  - Mobile-friendly with bottom navigation bar and mobile player strip
- 📷 **Gallery Management**:
  - Upload/delete gallery images
- 🎨 **Customizable Settings**:
  - Customize site title, logo, colors via admin panel
- 🎵 **Listening Session Tracking**:
  - Automatically records when a user starts/stops listening
  - Session duration stored in database for analytics

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

### Favorites (User-Specific)
| Method | Endpoint                      | Description                          |
|--------|-------------------------------|--------------------------------------|
| GET    | `/api/user/favorites`         | Get logged-in user's favorites       |
| POST   | `/api/audio/:id/favorite`     | Add to favorites (user-specific)     |
| DELETE | `/api/audio/:id/favorite`     | Remove from favorites (user-specific)|

### Likes / Dislikes (Per-User, Mutually Exclusive)
| Method | Endpoint                      | Description                          |
|--------|-------------------------------|--------------------------------------|
| POST   | `/api/audio/:id/like`         | Like track (auto-removes dislike)    |
| POST   | `/api/audio/:id/dislike`      | Dislike track (auto-removes like)    |
| GET    | `/api/audio/:id/reactions`    | Get like/dislike counts + user state |

### Listening Sessions
| Method | Endpoint                            | Description                     |
|--------|-------------------------------------|---------------------------------|
| POST   | `/api/listening/start`              | Start a listening session       |
| PATCH  | `/api/listening/:sessionId/end`     | End session & record duration   |
| GET    | `/api/user/history`                 | Get user's listening history (last 7 days only) |
| DELETE | `/api/user/history`                 | Clear user's entire listening history |

### Feedback
| Method | Endpoint                        | Description                                        |
|--------|---------------------------------|----------------------------------------------------|
| POST   | `/api/feedback`                 | Submit general feedback (with optional `shortFeedback`) |
| POST   | `/api/audio/:id/feedback`       | Submit track-specific feedback                     |
| GET    | `/api/feedback`                 | Get all feedback (requires `feedback_view`)        |
| GET    | `/api/feedback/approved`        | **Public** — Get all admin-approved feedbacks for marquee |
| PATCH  | `/api/feedback/:id/approve`     | Approve/unapprove + edit short summary (admin only)|
| DELETE | `/api/feedback/:id`             | Delete feedback (requires `feedback_delete`)       |

### Analytics
| Method | Endpoint                | Description              |
|--------|-------------------------|--------------------------|
| GET    | `/api/analytics`        | Get analytics (requires `analytics_view`) |

### Search
| Method | Endpoint                | Description                                      |
|--------|-------------------------|--------------------------------------------------|
| GET    | `/api/search?q=keyword` | Smart bilingual search with relevance scoring    |
| GET    | `/api/audios?search=kw` | Audios list with inline smart relevance sorting  |

---

## 🔐 Permissions System

### Available Permissions
| Group               | Permissions                                                      |
|---------------------|------------------------------------------------------------------|
| Audio Library       | `audio_view`, `audio_upload`, `audio_edit`, `audio_delete`       |
| Category Management | `category_view`, `category_create`, `category_edit`, `category_delete` |
| Album Management    | `album_view`, `album_create`, `album_edit`, `album_delete`       |
| Feedback Management | `feedback_view`, `feedback_delete`                               |
| Feedback Approval   | Admin Only — approve/reject public marquee reviews               |
| Analytics Dashboard | `analytics_view`                                                 |
| User Management     | Admin Only                                                       |
| Website Settings    | Admin Only                                                       |

---

## 📝 Changelog

### v2.3 — Enhanced UI/UX, Album Hero Makeover & My Favorites (2026-07-11)

#### 🎵 Album Details Hero Section Makeover
- **Eye-catching gradient background** with album cover texture overlay
- Added decorative radial blur elements for visual depth
- **3D perspective effect** on the album cover image
- Beautiful gradient Play All button with hover lift effect
- Stylish Back to Albums button with saffron hover
- Track count badge with gradient styling
- Removed the "Album" text label as requested

#### ❤️ "Favorites" → "My Favorites"
- Updated Sidebar navigation link from "Favorites" to "My Favorites"
- Updated Favorites page header to "My Favorites"
- Removed global favorites count from Dashboard (no longer relevant with user-specific system)

#### 🎧 Enhanced Audio Card & Album Rows
- **Beautiful hover effects** on Like/Dislike/Favorite/Comment buttons:
  - Slight scale-up animation on hover
  - Background color change (saffron for like, red for dislike)
  - Better spacing between buttons
- Improved button interaction with `e.currentTarget` to avoid child element styling issues
- Album track rows now have enhanced hover effects (border color, shadow, slight lift)

#### 📜 Listening History Page — Even More Prominent
- Warm gradient background for the header section
- Larger icon + bolder "Listening History" title
- Improved Clear History button with hover effects
- More prominent track count badge with saffron accent
- Better-looking "Last Listened" tags on each audio card
- Still shows only last 7 days of history

#### 📱 Mobile-First Responsiveness
- All new UI elements fully responsive
- Album cover properly scaled on mobile screens
- Buttons and spacing optimized for touch devices

---

### v2.2 — Listening History, Enhanced Feedback Marquee & Public Counts (2026-07-11)

#### 📜 Listening History Page
- New `ListeningHistory.jsx` component added (accessible via Sidebar and Mobile Bottom Navigation)
- Shows only last 7 days of listening history (filtered on backend)
- Unique tracks with last listened time and total time listened
- Clear History button with confirmation dialog
- Backend endpoints: GET /user/history (last 7 days), DELETE /user/history (clear all)
- Listening session tracking now works from all pages (moved to AudioContext)

#### 👍 Like/Dislike Counts Visible to Everyone
- Guests can now see like/dislike counts (interactive only for logged-in users)
- Updated GET /audio/:id/reactions endpoint to work without authentication
- Counts shown on AudioCard, AlbumDetails, and Details page
- Interactive buttons only for authenticated users (guests see counts as text)

#### 🎵 Album Page Quick Actions
- Added Like/Dislike/Favorite/Comment buttons on each audio row in AlbumDetails
- Buttons visible only for logged-in users
- Hover effect on audio rows for better UX
- Fetch reactions for all album tracks on page load

#### 📣 Enhanced Feedback Marquee
- Improved styling with gradient background and better visual hierarchy
- Shows: 🎵 Track (Speaker) • Username — "Short feedback"
- Changed label from "REVIEWS" to "USER LOVE" with heart icon
- New smooth animation and better spacing
- Still only shows admin-approved feedback

#### 🔧 Admin Login Fix
- Updated backend/server.js to always use User.setPassword() for admin password, ensuring correct hashing
- Default admin credentials: shantikunjadmin / Shantikunj2026
#### 🛡️ Admin Safety Check
- Cannot delete admin accounts (backend restriction + frontend disabled button)
- Cannot change last admin's role to non-admin
- Always ensure at least one admin exists

---

### v2.1 — Smart Search, Marquee & Feedback Approval (2026-07-10)

#### 🔍 Smart Relevance-Based Search
- Completely redesigned search engine in `search.js` and `audios.js`
- Results ranked by **relevance score** (higher = better match):
  | Match Type          | Score |
  |---------------------|-------|
  | Exact title match   | 150   |
  | Title starts-with   | 100   |
  | Title contains      | 80    |
  | Synonym title match | 50    |
  | Speaker exact match | 60    |
  | Tag match           | 30    |
- Results sorted descending by score before pagination
- Bilingual Hindi ↔ English synonym lookup preserved

#### 📣 Public Feedback Marquee Ticker
- New `FeedbackMarquee.jsx` component mounted globally in `Layout.jsx` below the header
- Visible to **all users** — logged in or not
- Scrolling ticker shows: 🎵 **Track Title** *(Speaker)* | **Username:** *"Short feedback"*
- Fetches from public endpoint `GET /api/feedback/approved` (no auth required)
- **Seamless infinite loop** — items rendered twice for smooth CSS `translateX(-50%)` animation
- **Hover to pause** the scroll; **click any item** to navigate directly to that audio's detail page
- Responsive — adapts text widths on mobile screens
- CSS animation: `@keyframes marquee-scroll` in `index.css`

#### 🛡️ Admin Feedback Approval System
- New `approved` (Boolean, default `false`) and `shortFeedback` (String, max 150 chars) fields added to `Feedback` model
- `PATCH /api/feedback/:id/approve` — admin-only endpoint to toggle approval & edit the short summary
- `GET /api/feedback/approved` — public endpoint returning all approved feedbacks (populated with audio title, speaker, user name)
- `FeedbackManagement.jsx` updated with:
  - **"Approve for Ticker"** toggle button per feedback entry
  - Inline editable **short summary** text field (auto-saves on blur)
- `Details.jsx` updated with a **Short Feedback** input field in the review form (max 100 chars)

#### ❤️ Favorites Bug Fix (Legacy Global Flag)
- Fixed: Favoriting from Dashboard or AlbumDetails was incorrectly writing to the global `isFavorite` field on the `Audio` document
- Fixed: `Dashboard.jsx` and `AlbumDetails.jsx` now call `toggleFavoriteTrack(id)` from `AudioContext` — fully user-specific

---

### v2.0 — Production Enhancement (2026-07-10)

#### 🔐 Authentication
- **Inline Admin Login**: Press `Ctrl + Shift + A` on the public login page → Admin form swaps **inline** (no redirect, no reload)
- Press `Escape` or click "Back to Public Login" to return
- Admin Dashboard is completely hidden from public — accessible only via keyboard shortcut
- **Developer Credit**: "Developed By Bhaskar" added to login card footer

#### ❤️ Favorites — Fully User-Specific (All Roles)
- Replaced legacy global `isFavorite` flag on Audio model with user-specific `Favorite` collection
- Every role (Admin, OnlyUser, Public User) gets their own independent favorites list
- Unified `toggleFavoriteTrack` in `AudioContext` — always calls `/api/audio/:id/favorite` (POST/DELETE)
- Updated: `AudioContext.jsx`, `Details.jsx`, `Favorites.jsx`, `Library.jsx`, `AudioCard.jsx`, `Layout.jsx`

#### 👍 Like / Dislike — Per-User, Mutually Exclusive
- New `Like` and `Dislike` MongoDB collections — fully per-user
- Liking auto-removes any existing dislike, and vice versa
- Real-time count and user reaction state shown on Details page
- Routes: `POST /api/audio/:id/like`, `POST /api/audio/:id/dislike`, `GET /api/audio/:id/reactions`

#### 💬 Feedback / Comments
- Any authenticated user can submit feedback with optional star rating (1–5)
- Track-specific (`POST /api/audio/:id/feedback`) and general (`POST /api/feedback`) endpoints
- Admin & OnlyUsers with `feedback_view` can view all feedback
- Admin & OnlyUsers with `feedback_delete` can delete feedback
- `FeedbackManagement.jsx` UI in Admin panel

#### 🔐 Dynamic Permission System (OnlyUser)
- `permissions` field added to User model
- `permissionCheck` middleware enforces permissions on all protected routes
- Permissions included in JWT token and fetched fresh from `/api/auth/me` on login
- Admin panel → Users Management: assign permissions via checkboxes per user
- Available permission groups: Audio, Category, Album, Feedback, Analytics

#### 📊 Analytics Dashboard — Enhanced
- Added **User Activity Table**: per-user breakdown of app usage
  - User name, role, session count, total listening time (`2h 14m` format), last seen date
  - Sorted by most time listened (top 20 users)
- Existing stats: Total favorites, likes, dislikes, feedback, sessions, minutes, unique listeners
- Top 5 most liked tracks with rank badges
- Recent 5 feedback entries with ratings
- Access controlled via `analytics_view` permission

#### 🎵 Listening Session Tracking
- Auto-records when user plays audio on Details page
- Session start (`POST /api/listening/start`) and end (`PATCH /api/listening/:id/end`) tracked
- Duration in seconds stored in `ListeningHistory` collection
- Powers analytics: total minutes, unique listeners, per-user time

#### ⚙️ Auth System Improvements
- Added `/api/auth/me` endpoint to return current user with latest permissions
- Permissions stored in both JWT and `localStorage`
- `hasPermission(perm)` and `hasAnyPermission(perms)` helpers in `AuthContext`
- Admin always bypasses permission checks

---

### v1.0 — Initial Release (2026-07-08)

1. **Dynamic Permissions System**
   - Added `permissions` field to User model
   - Created `permissionCheck` middleware
   - Admin panel: assign permissions via checkboxes

2. **Audio Library Management**
   - Upload, edit, delete audio files
   - Category and album linking
   - Voice search (Hindi/English bilingual)

3. **Category & Album Management**
   - Full CRUD with cover images
   - Nested audio track management

4. **Admin Panel**
   - Role-based tab visibility
   - UsersManagement with full name, email, permissions
   - Upload modal with FFmpeg MP3 conversion

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/YourFeature`
3. Commit your changes: `git commit -m 'Add YourFeature'`
4. Push to the branch: `git push origin feature/YourFeature`
5. Open a Pull Request

---

## 📚 Recent Updates

- Added **per‑user listening history** endpoints (`GET /api/user/history`, `DELETE /api/user/history`) and UI page `ListeningHistory.jsx` accessible via the **History** link in Header & Sidebar.
- Integrated **responsive design** across all new UI components (Header, Sidebar, History page, mobile bottom navigation) with media queries ensuring 100 % mobile & desktop compatibility.
- Updated navigation to include **History** link for both admin and regular users.
- Added CSS media queries and glass‑morphism styling for mobile‑first experience.

<div align="center">
  Made with ❤️ for All World Gayatri Pariwar
</div>

## 🕑 Listening History Feature Details

- **Backend Endpoints**:
  - `GET /api/user/history` – Retrieves the logged‑in user's listening history (last 7 days).
  - `DELETE /api/user/history` – Clears the user's entire listening history.
- **Frontend**:
  - New route `/history` rendered by `ListeningHistory.jsx`.
  - Accessible via **History** link added to both Header and Sidebar (desktop) and bottom navigation (mobile).
  - Shows unique tracks with last listened time, total listening duration and a **Clear History** button.
- **Responsive Design**:
  - Media queries ensure the History page layout adapts to mobile screens.
  - Glass‑morphism styling matches the rest of the UI.
- **Tech Stack** remains unchanged (React, Vite, Tailwind CSS, Node/Express, MongoDB).

## ➕ Additional UI Components & Features

- **Add to Album Modal** (`AddToAlbumModal.jsx`):
  - Allows users to add selected audio tracks to an existing album.
  - Supports searching within user's albums and creating a new album on the fly.
  - Integrated with the per‑user permissions system (`album_edit`).

- **User Profile Page** (`UserProfile.jsx`):
  - Displays user's basic information, role, and assigned permissions.
  - Provides a quick link to edit profile details (name, email) if permitted.
  - Shows recent activity summary (favorite count, like/dislike totals).

- **Audio Player Strip** (`AudioPlayer.jsx`):
  - Persistent mini‑player fixed at the bottom on mobile devices.
  - Shows current track title, play/pause, next/previous, and progress bar.
  - Syncs with the global `AudioContext` for seamless session tracking.

- **Footer** (`Footer.jsx`):
  - Contains copyright notice, quick navigation links, and a link to the source repository.
  - Styled with the same glass‑morphism effect as the Header.

- **Upload Audio Modal** (`UploadAudioModal.jsx`):
  - Rich modal for uploading new audio files with drag‑and‑drop support.
  - Performs server‑side FFmpeg conversion to MP3 and metadata extraction.
  - Validates file size, type, and required fields before submission.

These components were introduced in versions **v2.3** and **v2.2** and are fully reflected in the UI across desktop and mobile layouts.
