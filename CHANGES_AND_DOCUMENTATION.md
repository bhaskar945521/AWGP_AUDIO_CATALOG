# 📚 AWGP Audio Catalog - Complete Documentation & Change Log

<div align="center">
  <p><strong>Full-stack MERN application for managing, browsing, and interacting with spiritual audio content.</strong></p>
</div>

---

## 🛠️ Tech Stack

| Layer          | Technologies                                                                 |
|----------------|-----------------------------------------------------------------------------|
| **Frontend**   | React 18, Vite, React Router, React Hot Toast, Font Awesome                 |
| **Backend**    | Node.js 18+, Express 5, Mongoose 8, bcrypt, jsonwebtoken (JWT), Multer      |
| **Database**   | MongoDB 6+                                                                 |
| **File Handling** | FFmpeg (audio conversion to MP3), Multer (file uploads)                    |
| **Auth**       | JSON Web Tokens (JWT), bcrypt for password hashing                          |
| **Build Tools**| npm, Vite                                                                   |
| **Version Control** | Git                                                                       |

---

## 📋 Table of Contents
1. [Project Overview](#-project-overview)
2. [User Roles & Authentication](#-user-roles--authentication)
3. [Public User Features](#-public-user-features)
4. [Like/Dislike System](#-likedislike-system)
5. [Favorites System](#-favorites-system)
6. [Feedback System](#-feedback-system)
7. [Listening Session Tracking & History](#-listening-session-tracking--history)
8. [Permission-Based Management](#-permission-based-management)
9. [Analytics Dashboard](#-analytics-dashboard)
10. [Admin Features](#-admin-features)
11. [API Endpoints](#-api-endpoints)
12. [Frontend Components](#-frontend-components)
13. [Backend Architecture](#-backend-architecture)
14. [Changelog](#-changelog)

---

## 🌟 Project Overview

AWGP Audio Catalog is a full-stack web application for:
- Uploading and managing spiritual audio recordings
- Organizing audio into categories and albums
- User engagement (favorites, likes/dislikes, feedback)
- Listening session tracking and history
- Admin/permission-based content management
- Bilingual (Hindi/English) smart search and voice search
- Public feedback marquee with admin approval

---

## 🔐 User Roles & Authentication

### User Roles

1. **PublicUser**
   - Can register/login via public login form
   - Can browse audios/categories/albums
   - Can use favorites, like/dislike, submit feedback
   - Has a listening history
2. **OnlyUser**
   - Account created by Admin
   - Permissions assigned by Admin (granular control over features)
3. **Admin**
   - Full access to everything
   - Default credentials:
     - Username: `shantikunjadmin`
     - Password: `Shantikunj2026`
   - Login via hidden shortcut: `CTRL + SHIFT + A` on landing page

### Authentication Endpoints (Backend)

- **Public Auth Routes** (`/api/public`)
  - `POST /api/public/register` - Register new PublicUser
  - `POST /api/public/login` - Login as PublicUser
  - `POST /api/public/logout` - Logout
- **Admin/User Auth Routes** (`/api/auth`)
  - `POST /api/auth/login` - Admin/OnlyUser login
  - `GET /api/auth/me` - Get current user (with permissions)
- **User Management Routes** (`/api/users`)
  - `GET /api/users` - Get all users (Admin only)
  - `POST /api/users` - Create new OnlyUser (Admin only)
  - `PUT /api/users/:id` - Update user (Admin only)
  - `DELETE /api/users/:id` - Delete user (Admin only)

---

## 👤 Public User Features

### Registration & Login
- Public can register using `fullName`, `username`, `email`, `password`
- Passwords are hashed using bcrypt before storage
- Logged-in users get a JWT stored in `localStorage`

### Browsing Content
- Browse all audios, categories, albums
- Search via text (bilingual smart search) or voice search
- View audio details (play, info, engagement metrics)

### Engagement
- Add/remove favorites
- Like/dislike tracks
- Submit feedback (track-specific or general)

---

## 👍 Like/Dislike System

### Key Features
- **Per-user, mutually exclusive**: Liking a track removes dislike, and vice versa
- **Counts visible to everyone**: Guests see counts, only logged-in users can interact
- **Real-time updates**: Counts update immediately after interaction
- **Stored in database**: `Like` and `Dislike` collections track user interactions

### Backend Routes (in `/api/engagement`)
| Method | Route                      | Description                                  |
|--------|----------------------------|----------------------------------------------|
| POST   | `/audio/:id/like`          | Like a track (auto-removes dislike)          |
| POST   | `/audio/:id/dislike`       | Dislike a track (auto-removes like)          |
| GET    | `/audio/:id/reactions`     | Get like/dislike counts + user's state (no auth needed) |

### Frontend Implementation
- Managed via `AudioContext.jsx`
- Components that use it: `AudioCard.jsx`, `AlbumDetails.jsx`, `Details.jsx`, `ListeningHistory.jsx`
- Guest users see counts as text; logged-in users see interactive buttons

---

## ❤️ Favorites System

### Key Features
- **Completely user-specific**: Each user has their own independent favorites
- **Cross-role support**: Works for PublicUser, OnlyUser, Admin
- **Access from anywhere**: Heart button on cards, player, details page
- **Dedicated page**: `/favorites` shows only user's saved tracks

### Backend Routes (in `/api/engagement`)
| Method | Route                      | Description                                  |
|--------|----------------------------|----------------------------------------------|
| GET    | `/user/favorites`          | Get user's favorites                         |
| POST   | `/audio/:id/favorite`      | Add track to favorites                       |
| DELETE | `/audio/:id/favorite`      | Remove track from favorites                  |

### Frontend Implementation
- Managed via `AudioContext.jsx` (`toggleFavoriteTrack` function)
- Components: `Favorites.jsx`, `AudioCard.jsx`, `Details.jsx`, `AlbumDetails.jsx`, `ListeningHistory.jsx`
- Heart button is colored if track is in favorites, outlined otherwise

---

## 💬 Feedback System

### Key Features
- **Logged-in users only**: Only authenticated users can submit feedback
- **Track-specific or general**: Feedback can be linked to a track or general
- **Short summary for marquee**: Optional `shortFeedback` field (max 100 chars) for public display
- **Admin approval required**: Only approved feedback shows up in public marquee
- **Feedback management**: Admins can view, approve, delete feedback

### Backend Routes (in `/api/engagement`)
| Method | Route                          | Description                                  |
|--------|--------------------------------|----------------------------------------------|
| POST   | `/feedback`                    | Submit general feedback                      |
| POST   | `/audio/:id/feedback`          | Submit track-specific feedback               |
| GET    | `/feedback`                    | Get all feedback (requires `feedback_view`)  |
| GET    | `/feedback/approved`           | Get approved feedback (public, no auth)      |
| PATCH  | `/feedback/:id/approve`        | Approve/unapprove feedback (Admin only)      |
| DELETE | `/feedback/:id`                | Delete feedback (requires `feedback_delete`) |

### Public Feedback Marquee
- **Component**: `FeedbackMarquee.jsx` (mounted globally in Layout)
- **Visible to everyone**: Logged-in and guest users
- **Styling**: Gradient background, smooth scrolling animation
- **Interaction**: Hover to pause, click to navigate to track
- **Approval only**: Only admin-approved feedback appears
- **Fields shown**: Track title, speaker, username, short feedback

---

## 🎧 Listening Session Tracking & History

### Key Features
- **Automatic tracking**: Tracks start/end of audio playback
- **Cross-page support**: Works from all pages (Dashboard, Library, AlbumDetails, etc.)
- **Last 7 days only**: History only shows sessions from past week
- **Clear history**: Users can clear their entire history
- **Unique tracks**: History shows unique tracks with last listened time and total time listened

### Backend Routes (in `/api/engagement`)
| Method | Route                          | Description                                  |
|--------|--------------------------------|----------------------------------------------|
| POST   | `/listening/start`             | Start a new listening session                |
| PATCH  | `/listening/:sessionId/end`    | End a session and save duration              |
| GET    | `/user/history`                | Get user's history (last 7 days only)        |
| DELETE | `/user/history`                | Clear user's entire listening history        |

### Frontend Implementation
- **Tracking**: Moved to `AudioContext.jsx` so it works from all pages
- **History Page**: `/history` route shows user's history
- **Navigation**: Links in Sidebar (desktop) and Mobile Bottom Navigation
- **Component**: `ListeningHistory.jsx` with clear history button and confirmation dialog

---

## 🔑 Permission-Based Management

### Available Permissions
| Group               | Permissions                                                      |
|---------------------|------------------------------------------------------------------|
| **Audio Library**   | `audio_view`, `audio_upload`, `audio_edit`, `audio_delete`       |
| **Category Management** | `category_view`, `category_create`, `category_edit`, `category_delete` |
| **Album Management**| `album_view`, `album_create`, `album_edit`, `album_delete`       |
| **Feedback Management** | `feedback_view`, `feedback_delete`                             |
| **Analytics Dashboard** | `analytics_view`                                               |
| **User Management** | Admin Only                                                       |
| **Website Settings**| Admin Only                                                       |

### Implementation
- **Backend**: Middleware `permissionCheck.js` enforces permissions on protected routes
- **Frontend**: `AuthContext.jsx` has `hasPermission` and `hasAnyPermission` helpers
- **Admin Panel**: Admin can assign permissions via checkboxes in `UsersManagement.jsx`
- **JWT Storage**: Permissions stored in JWT and `localStorage`, refreshed from `/api/auth/me` on login

---

## 📊 Analytics Dashboard

### Key Features
- **Permission-based**: Only accessible to users with `analytics_view` permission
- **Comprehensive metrics**:
  - Total likes, dislikes, favorites, feedback, listening sessions
  - Total listening minutes
  - Unique listeners
  - Top 5 most liked tracks (with rank badges)
  - Recent feedback
  - User activity table (user, role, sessions, total time, last seen)

### Backend Route
| Method | Route                  | Description                                  |
|--------|------------------------|----------------------------------------------|
| GET    | `/analytics`           | Get analytics data (requires `analytics_view`) |

### Frontend Component
- `AnalyticsDashboard.jsx` in Admin panel
- Styled cards for metrics, tables for recent feedback and user activity

---

## 👑 Admin Features

- **Full content management**: CRUD for audios, categories, albums
- **User management**: Create/Edit/Delete OnlyUsers, assign permissions
- **Feedback management**: View, approve, delete feedback
- **Analytics**: View comprehensive analytics dashboard
- **Settings**: Customize site title, logo, colors
- **Gallery management**: Upload/delete gallery images
- **Hidden login**: `CTRL + SHIFT + A` on landing page

---

## 🌐 API Endpoints

### Authentication
| Method | Route                          | Description                                  |
|--------|--------------------------------|----------------------------------------------|
| POST   | `/api/public/register`         | Register new PublicUser                      |
| POST   | `/api/public/login`            | Login as PublicUser                          |
| POST   | `/api/public/logout`           | Logout PublicUser                            |
| POST   | `/api/auth/login`              | Admin/OnlyUser login                         |
| GET    | `/api/auth/me`                 | Get current user (with permissions)          |

### Users
| Method | Route                          | Description                                  |
|--------|--------------------------------|----------------------------------------------|
| GET    | `/api/users`                   | Get all users (Admin only)                   |
| POST   | `/api/users`                   | Create new user (Admin only)                 |
| PUT    | `/api/users/:id`               | Update user (Admin only)                     |
| DELETE | `/api/users/:id`               | Delete user (Admin only)                     |

### Audios
| Method | Route                          | Description                                  |
|--------|--------------------------------|----------------------------------------------|
| GET    | `/api/audios`                  | Get all audios                               |
| POST   | `/api/audios`                  | Upload audio (requires `audio_upload`)       |
| PUT    | `/api/audios/:id`              | Update audio (requires `audio_edit`)         |
| DELETE | `/api/audios/:id`              | Delete audio (requires `audio_delete`)       |

### Categories
| Method | Route                          | Description                                  |
|--------|--------------------------------|----------------------------------------------|
| GET    | `/api/categories`              | Get all categories                           |
| POST   | `/api/categories`              | Create category (requires `category_create`) |
| PATCH  | `/api/categories/:id`          | Update category (requires `category_edit`)   |
| DELETE | `/api/categories/:id`          | Delete category (requires `category_delete`) |

### Albums
| Method | Route                          | Description                                  |
|--------|--------------------------------|----------------------------------------------|
| GET    | `/api/albums`                  | Get all albums                               |
| POST   | `/api/albums`                  | Create album (requires `album_create`)       |
| PUT    | `/api/albums/:id`              | Update album (requires `album_edit`)         |
| DELETE | `/api/albums/:id`              | Delete album (requires `album_delete`)       |

### Engagement
| Method | Route                          | Description                                  |
|--------|--------------------------------|----------------------------------------------|
| GET    | `/api/user/favorites`          | Get user's favorites                         |
| POST   | `/api/audio/:id/favorite`      | Add track to favorites                       |
| DELETE | `/api/audio/:id/favorite`      | Remove track from favorites                  |
| POST   | `/api/audio/:id/like`          | Like track (auto-removes dislike)            |
| POST   | `/api/audio/:id/dislike`       | Dislike track (auto-removes like)            |
| GET    | `/api/audio/:id/reactions`     | Get like/dislike counts + user state         |
| POST   | `/api/listening/start`         | Start listening session                      |
| PATCH  | `/api/listening/:sessionId/end`| End listening session                        |
| GET    | `/api/user/history`            | Get user's history (last 7 days)             |
| DELETE | `/api/user/history`            | Clear user's history                         |
| POST   | `/api/feedback`                | Submit general feedback                      |
| POST   | `/api/audio/:id/feedback`      | Submit track-specific feedback               |
| GET    | `/api/feedback`                | Get all feedback (requires `feedback_view`)  |
| GET    | `/api/feedback/approved`       | Get approved feedback (public)               |
| PATCH  | `/api/feedback/:id/approve`    | Approve/unapprove feedback (Admin only)      |
| DELETE | `/api/feedback/:id`            | Delete feedback (requires `feedback_delete`) |
| GET    | `/api/analytics`               | Get analytics (requires `analytics_view`)    |

### Search
| Method | Route                          | Description                                  |
|--------|--------------------------------|----------------------------------------------|
| GET    | `/api/search?q=keyword`        | Smart bilingual relevance search             |
| GET    | `/api/audios?search=keyword`   | Audios list with relevance sorting           |

---

## 🧩 Frontend Components

| Component                | Purpose                                                                 |
|--------------------------|-------------------------------------------------------------------------|
| **Layout.jsx**           | Root layout with header, sidebar, mobile nav, feedback marquee         |
| **App.jsx**              | Route definitions                                                       |
| **AuthContext.jsx**      | Authentication state, permissions helpers                              |
| **AudioContext.jsx**     | Audio player state, favorites, reactions, session tracking             |
| **AudioCard.jsx**        | Reusable audio card with engagement buttons                             |
| **Favorites.jsx**        | User's favorites page                                                  |
| **ListeningHistory.jsx** | User's listening history page (last 7 days, clear button)              |
| **Details.jsx**          | Audio detail page with player, feedback form                           |
| **AlbumDetails.jsx**     | Album page with track list and quick actions                           |
| **FeedbackMarquee.jsx**  | Public feedback ticker (only approved)                                 |
| **FeedbackManagement.jsx**| Admin feedback management                                               |
| **UsersManagement.jsx**  | Admin user management (create/edit/assign permissions)                 |
| **AnalyticsDashboard.jsx**| Admin analytics dashboard                                               |

---

## 🏗️ Backend Architecture

### Project Structure
```
backend/
├── middleware/           # Auth, permissionCheck, etc.
├── models/              # Mongoose models (User, Audio, Favorite, Like, Dislike, Feedback, ListeningHistory, etc.)
├── routes/              # API route handlers
├── utils/               # Helpers (search, file handling, etc.)
├── uploads/             # Uploaded audio and image files (not tracked in Git)
├── server.js            # Entry point
└── package.json
```

### Database Models
- **User**: Stores user info, role, permissions
- **Audio**: Audio track details
- **Category**: Audio categories
- **Album**: Audio albums
- **Favorite**: User's favorite tracks
- **Like**: User's liked tracks
- **Dislike**: User's disliked tracks
- **Feedback**: User feedback (track-specific or general)
- **ListeningHistory**: Listening sessions

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

### v2.2 — Listening History, Enhanced Feedback Marquee & Public Counts 
1. **Listening History Page**
   - New `ListeningHistory.jsx` component
   - `/history` route with sidebar/mobile links
   - Last 7 days only, unique tracks, last listened time, total time
   - Clear History button with confirmation dialog
2. **Like/Dislike Counts for Everyone**
   - Guests see counts, logged-in users can interact
   - Updated `/audio/:id/reactions` endpoint to work without auth
   - Counts on AudioCard, AlbumDetails, Details page
3. **Album Quick Actions**
   - Like/Dislike/Favorite/Comment buttons on each album track row
   - Visible only to logged-in users, hover effect on rows
4. **Enhanced Feedback Marquee**
   - Better styling with gradient background, new label ("USER LOVE")
   - Improved visual hierarchy, smoother animation
5. **Admin Login Fix**
   - Always use `User.setPassword()` for admin password in `server.js`
   - Default credentials: `shantikunjadmin` / `Shantikunj2026`
6. **Admin Safety Check**
   - Cannot delete admin accounts (backend restriction + frontend disabled button)
   - Cannot change last admin's role to non-admin
   - Always ensure at least one admin exists

### v2.1 — implementation of new features
-  Dynamic permissions system
- Like/Dislike system
- Feedback system
- Enhanced analytics
- Listening session tracking
- Smart relevance-based bilingual search
- Public feedback marquee
- Admin feedback approval system
- Favorites bug fixes

### v2.0 — Production Enhancement 
- album management,database realtionship


### v1.0 — Initial Release 
- Basic audio, category, 
- Admin panel

---

<div align="center">
  Made with ❤️ for All World Gayatri Pariwar
</div>
