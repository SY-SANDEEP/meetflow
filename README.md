# MeetFlow 📅

**Full-Stack Scheduling & Meeting Management Platform**

A production-ready scheduling platform built with React, Node/Express, MongoDB, and JWT authentication — featuring user and admin dashboards, Google Calendar integration, and email notifications.

---

## Tech Stack

| Layer     | Technology                                   |
|-----------|----------------------------------------------|
| Frontend  | React 18, React Router 6, Tailwind CSS       |
| Backend   | Node.js, Express.js (MVC + REST API)         |
| Database  | MongoDB with Mongoose ODM                    |
| Auth      | JWT (JSON Web Tokens) + bcryptjs             |
| Email     | Nodemailer (Gmail SMTP)                      |
| Calendar  | Google Calendar API (OAuth2)                 |

---

## Features

### Authentication
- Sign Up / Sign In with JWT
- Role-based access (User / Admin)
- Password change
- Profile management
- Google Calendar OAuth2 integration

### User Features
- 📅 Browse available meeting slots
- ✅ Book meetings with title, description & agenda
- 🔄 Reschedule meetings to another slot
- ❌ Cancel meetings with optional reason
- 📧 Email confirmations for every action
- 🗓️ Auto-sync booked meetings to Google Calendar
- 📊 Personal dashboard with meeting stats

### Admin Features
- ⊞ Admin overview dashboard with analytics
- 📅 Create / Edit / Delete time slots
- 🤝 View and manage all platform meetings
- 👥 Manage users (activate/deactivate, promote/demote)
- 📈 Monthly trend charts, slot and meeting stats
- 🔒 Prevent booking of fully-booked/past slots

### Meeting System
- Prevents double-booking (per user per slot)
- Fully booked slots show as unavailable
- Past slots are locked from booking
- Status lifecycle: `confirmed → completed / cancelled / rescheduled`

---

## Project Structure

```
meetflow/
├── backend/
│   ├── config/         db.js
│   ├── controllers/    authController, slotController, meetingController, adminController
│   ├── middleware/     auth.js (protect, adminOnly, generateToken)
│   ├── models/         User, Slot, Meeting
│   ├── routes/         authRoutes, slotRoutes, meetingRoutes, adminRoutes
│   ├── utils/          email.js, googleCalendar.js
│   ├── seed.js
│   └── server.js
└── frontend/
    └── src/
        ├── components/
        │   ├── auth/       Login, Register, ProtectedRoute
        │   ├── shared/     Layout, UI (Modal, StatCard, Spinner…)
        │   ├── dashboard/  UserDashboard, Profile
        │   ├── meetings/   SlotsBrowser, MyMeetings
        │   └── admin/      AdminDashboard, AdminSlots, AdminMeetings, AdminUsers
        ├── context/    AuthContext
        └── utils/      api.js (axios instance)
```

---

## Quick Start

### 1 — Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Gmail account with App Password

### 2 — Clone & Install

```bash
git clone <repo>
cd meetflow

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 3 — Configure Environment

```bash
cd backend
cp .env.example .env
# Fill in your values:
#   MONGODB_URI, JWT_SECRET
#   EMAIL_USER, EMAIL_PASS
#   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (optional)
```

#### Gmail App Password setup
1. Enable 2FA on your Google account
2. Go to **Google Account → Security → App Passwords**
3. Generate an app password for "Mail"
4. Use it as `EMAIL_PASS` in `.env`

#### Google Calendar setup (optional)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → Enable **Google Calendar API**
3. Create OAuth2 credentials → add `http://localhost:5000/api/auth/google/callback` as redirect URI
4. Copy Client ID & Secret to `.env`

### 4 — Seed Demo Data

```bash
cd backend
node seed.js
```

This creates:
- Admin: `admin@meetflow.com` / `admin123`
- Users: `alice@example.com`, `bob@example.com` / `password123`
- ~40 slots over the next 2 weeks
- 8 sample meetings

### 5 — Run

```bash
# Terminal 1 — Backend (port 5000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend && npm start
```

Open [http://localhost:3000](http://localhost:3000)

---

## API Reference

### Auth
| Method | Endpoint                  | Auth     | Description              |
|--------|---------------------------|----------|--------------------------|
| POST   | /api/auth/register        | —        | Register new user        |
| POST   | /api/auth/login           | —        | Login                    |
| GET    | /api/auth/me              | User     | Get current user         |
| PUT    | /api/auth/profile         | User     | Update profile           |
| PUT    | /api/auth/change-password | User     | Change password          |
| GET    | /api/auth/google          | User     | Get Google OAuth URL     |
| GET    | /api/auth/google/callback | User     | Google OAuth callback    |

### Slots
| Method | Endpoint              | Auth    | Description            |
|--------|-----------------------|---------|------------------------|
| GET    | /api/slots            | User    | List available slots   |
| GET    | /api/slots/:id        | User    | Get single slot        |
| GET    | /api/slots/admin/all  | Admin   | All slots (admin)      |
| POST   | /api/slots            | Admin   | Create slot            |
| PUT    | /api/slots/:id        | Admin   | Update slot            |
| DELETE | /api/slots/:id        | Admin   | Delete slot            |

### Meetings
| Method | Endpoint                      | Auth    | Description              |
|--------|-------------------------------|---------|--------------------------|
| POST   | /api/meetings                 | User    | Book a meeting           |
| GET    | /api/meetings/my              | User    | Get user's meetings      |
| GET    | /api/meetings/stats           | User    | Dashboard stats          |
| GET    | /api/meetings/:id             | User    | Get single meeting       |
| PUT    | /api/meetings/:id/cancel      | User    | Cancel meeting           |
| PUT    | /api/meetings/:id/reschedule  | User    | Reschedule meeting       |
| GET    | /api/meetings/admin/all       | Admin   | All meetings             |
| PUT    | /api/meetings/:id/status      | Admin   | Update meeting status    |

### Admin
| Method | Endpoint                     | Auth  | Description            |
|--------|------------------------------|-------|------------------------|
| GET    | /api/admin/users             | Admin | List all users         |
| PUT    | /api/admin/users/:id/toggle  | Admin | Toggle user active     |
| PUT    | /api/admin/users/:id/role    | Admin | Change user role       |
| GET    | /api/admin/analytics         | Admin | Platform analytics     |

---

## Email Notifications

Automated emails are sent for:
- ✅ **Booking Confirmation** — when a meeting is booked
- ❌ **Cancellation Notice** — when a meeting is cancelled
- 🔄 **Reschedule Notice** — when a meeting is rescheduled
- ⏰ **Reminder** — 24h before the meeting (triggered manually or via cron)

---

## Security
- JWT tokens expire in 7 days
- Passwords hashed with bcryptjs (12 rounds)
- Rate limiting: 100 req/15min globally, 20 req/15min for auth
- Admin-only endpoints protected by role middleware
- Users can only manage their own meetings
