<p align="center">
  <img src="public/favicon.svg" width="80" alt="TransitPass Logo" />
</p>

<h1 align="center">🚌 TransitPass — Digital Bus Pass Management System</h1>

<p align="center">
  <strong>A production-grade, full-stack web application that digitizes the traditional bus pass issuance, management, and verification process for city transit authorities.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-Express%205-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" />
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Features In Detail](#-features-in-detail)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)
- [Security Implementation](#-security-implementation)
- [Setup & Installation](#-setup--installation)
- [Default Credentials](#-default-credentials)
- [Screenshots & UI Flow](#-screenshots--ui-flow)
- [Design System](#-design-system)

---

## 🎯 Overview

TransitPass replaces the traditional paper-based bus pass system with a modern digital platform. It serves **three distinct user roles**:

| Role | Purpose | Access Level |
|------|---------|-------------|
| **Citizen (User)** | Register, apply for passes, track status, download digital pass | Self-service portal |
| **Administrator** | Review applications, approve/reject, monitor analytics | Full system oversight |
| **Conductor** | Verify passenger passes in real-time during transit | Read-only verification |

### Problem Statement
Traditional bus pass systems suffer from:
- Long queues at transport offices
- Paper passes susceptible to fraud and damage
- No real-time verification for conductors
- Manual record-keeping with no analytics

### Solution
TransitPass provides:
- **Instant digital applications** — apply from anywhere
- **Unique encoded Pass IDs** — fraud-resistant identification (e.g., `TP-ST2604A3F21B`)
- **Real-time conductor verification** — instant status check
- **Admin analytics dashboard** — data-driven decision making

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │               React.js SPA (Vite Build)                   │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ │  │
│  │  │  Login/  │ │ Apply    │ │  Admin   │ │  Conductor   │ │  │
│  │  │ Register │ │ Pass     │ │Dashboard │ │  Verify      │ │  │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬────────┘ │  │
│  │       └─────────────┴────────────┴─────────────┘          │  │
│  │                     db.js Service Layer                    │  │
│  │              (API calls + Token Management)                │  │
│  └──────────────────────────┬────────────────────────────────┘  │
│                             │ HTTP (REST + JWT Bearer Token)     │
├─────────────────────────────┼───────────────────────────────────┤
│                        SERVER (Node.js)                         │
│  ┌──────────────────────────┴────────────────────────────────┐  │
│  │                Express.js REST API                        │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ │  │
│  │  │  Helmet  │ │  CORS    │ │ Rate     │ │  JWT Auth    │ │  │
│  │  │(Security)│ │ (Policy) │ │ Limiter  │ │ (Middleware)  │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘ │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────────────┐  │  │
│  │  │ bcrypt   │ │ express- │ │       SQLite3            │  │  │
│  │  │(Hashing) │ │validator │ │    (transit.db)           │  │  │
│  │  └──────────┘ └──────────┘ └──────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Communication Flow
1. **Frontend → Backend**: RESTful API calls via `fetch()` with JWT Bearer tokens
2. **Backend → Database**: SQLite3 with parameterized queries (SQL injection safe)
3. **Authentication**: JWT tokens stored in `localStorage`, validated server-side
4. **Conductor Sessions**: Stored in `sessionStorage` (cleared on tab close)

---

## 🚀 Technology Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React.js** | 19.2.5 | Component-based UI framework |
| **React Router DOM** | 7.14.1 | Client-side routing with role-based guards |
| **Recharts** | 3.8.1 | Interactive data visualization (Bar, Pie charts) |
| **Lucide React** | 1.8.0 | Premium SVG icon library (25+ icons used) |
| **Vite** | 8.0.9 | Build tool & HMR dev server |
| **Vanilla CSS3** | — | Custom design system, glassmorphism, animations |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | — | Server runtime |
| **Express** | 5.2.1 | HTTP server & routing |
| **SQLite3** | 6.0.1 | File-based relational database |
| **bcrypt** | 6.0.0 | Password hashing (10 salt rounds) |
| **jsonwebtoken** | 9.0.3 | JWT token generation & verification |
| **helmet** | 8.1.0 | HTTP security headers |
| **express-rate-limit** | 8.3.2 | Brute-force protection |
| **express-validator** | 7.3.2 | Input validation & sanitization |
| **dotenv** | 17.4.2 | Environment variable management |
| **cors** | 2.8.6 | Cross-Origin Resource Sharing |

---

## ✨ Features In Detail

### 1. 🧑‍💼 Citizen Portal

#### Registration & Login
- Email-based registration with server-side validation
- Passwords hashed with **bcrypt** (10 salt rounds) before storage
- JWT tokens issued on login (8-hour expiry)
- Dual authentication: checks both `users` and `admins` tables
- Case-insensitive admin username matching
- Session persistence via `localStorage`

#### Pass Application Form
- **Pass Categories**: Student (Concession), General, Senior Citizen, Ladies Special, Employee
- **Duration Options**: 1 Month or 3 Months (with 10% savings badge)
- **Smart Features**:
  - Real-time expiry date preview based on selected start date and duration
  - Auto-draft saving to `sessionStorage` (restores if user navigates away)
  - Future-date-only validation (cannot select past dates)
  - Unique Pass ID generation with encoded metadata:
    ```
    Format: TP-{CATEGORY}{YEAR}{MONTH}{RANDOM_HEX}
    Example: TP-ST260487A3F2 (Student Pass, 2026, April, unique hex)
    ```

#### My Pass Dashboard
- View all submitted passes with real-time status
- Status badges: `pending`, `approved`, `active`, `expired`, `upcoming`, `rejected`
- Pass details: Holder name, Pass ID, validity dates
- Download button for approved passes (triggers browser print dialog for PDF generation)

### 2. 🛡️ Admin Command Center

#### Live Analytics Dashboard
- **4 Stat Cards**: Total Citizens, Total Applications, Approved Count, Active Today
- **Bar Chart**: Applications breakdown by category (Student, General, Senior, etc.)
- **Pie Chart**: Overall approval rate (Approved vs Pending vs Declined)
- Auto-refreshes after each action

#### Application Management
- **Desktop View**: Full data table with applicant name, email, category, status
- **Mobile View**: Responsive card layout (table transforms into stacked cards)
- One-click **Approve** ✅ or **Reject** ❌ actions
- Instant UI update after status change

#### User Directory
- View all registered citizens (name, email)
- Admin-only access with JWT role verification

### 3. 🚌 Conductor Verification Portal

#### Secure Login
- Dedicated entry point separate from citizen/admin login
- ID + PIN based authentication (e.g., `COND001` / `1234`)
- Hardcoded conductor credentials (prototype):

| Conductor ID | PIN | Name | Route |
|-------------|-----|------|-------|
| COND001 | 1234 | Ravi Kumar | Route 5C |
| COND002 | 5678 | Suresh Babu | Route 12A |
| COND003 | 9999 | Priya Devi | Route 8B |

#### Real-Time Pass Verification
- Enter any Pass ID (e.g., `TP-GN2604A3B2C1`) to check status
- Returns one of 4 statuses with color-coded result cards:
  - 🟢 **ACTIVE** — Pass is valid and within date range
  - 🔴 **EXPIRED** — Pass has crossed its expiry date
  - 🔵 **UPCOMING** — Pass hasn't started yet
  - 🟡 **NOT FOUND** — No matching pass in system
- Displays holder name and pass details
- Case-insensitive Pass ID matching

#### Shift History
- Maintains a verification log for the current session (up to 20 entries)
- Stores: timestamp, Pass ID, holder name, result
- Persisted in `sessionStorage` (survives page reload, clears on tab close)

---

## 🗄️ Database Schema

The system uses **SQLite3** with 3 primary tables:

### `users` Table
```sql
CREATE TABLE users (
  id       TEXT PRIMARY KEY,     -- Format: 'user_{timestamp}'
  name     TEXT,                 -- Full name of the citizen
  email    TEXT UNIQUE,          -- Email address (unique constraint)
  password TEXT                  -- bcrypt hashed password
);
```

### `admins` Table
```sql
CREATE TABLE admins (
  id       TEXT PRIMARY KEY,     -- Format: 'admin_{n}'
  username TEXT UNIQUE,          -- Admin login username
  password TEXT,                 -- bcrypt hashed password
  name     TEXT                  -- Display name
);
```

### `passes` Table
```sql
CREATE TABLE passes (
  id         TEXT PRIMARY KEY,   -- Format: 'pass_{timestamp}'
  passId     TEXT,               -- Encoded Pass ID (e.g., TP-ST2604A3F2)
  userId     TEXT,               -- Foreign key → users.id
  userName   TEXT,               -- Denormalized user name
  userEmail  TEXT,               -- Denormalized user email
  fullName   TEXT,               -- Name entered on application form
  email      TEXT,               -- Email entered on application form
  phone      TEXT,               -- Mobile number
  passType   TEXT,               -- Category (Student, General, etc.)
  startDate  TEXT,               -- ISO date string (YYYY-MM-DD)
  expiryDate TEXT,               -- ISO date string (YYYY-MM-DD)
  duration   INTEGER,            -- 1 or 3 (months)
  status     TEXT,               -- pending | approved | rejected
  createdAt  TEXT                -- ISO timestamp
);
```

### Status Computation Logic
```
IF status = 'pending' or 'rejected' → return stored status (admin decision preserved)
ELSE IF today < startDate          → 'upcoming'
ELSE IF today > expiryDate         → 'expired'
ELSE                               → 'active'
```

---

## 📡 API Reference

Base URL: `http://localhost:5000/api`

### Authentication Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/login` | ❌ | Login (checks users + admins tables) |
| `POST` | `/register` | ❌ | Register new citizen account |

#### `POST /login`
```json
// Request
{ "email": "admin", "password": "password@123" }

// Response (200 OK)
{
  "user": { "id": "admin_1", "username": "admin", "name": "System Admin", "role": "admin" },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### `POST /register`
```json
// Request
{ "name": "John Doe", "email": "john@example.com", "password": "mypass123" }

// Validation Rules:
//   name: min 2 chars, trimmed, HTML-escaped
//   email: valid email, normalized
//   password: min 6 chars

// Response (200 OK)
{
  "user": { "id": "user_1714000000000", "name": "John Doe", "email": "john@example.com", "role": "user" },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Pass Management Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `POST` | `/passes` | ✅ JWT | User | Submit new pass application |
| `GET` | `/passes` | ✅ JWT | Admin | Get all passes (admin only) |
| `GET` | `/passes/user/:userId` | ✅ JWT | User/Admin | Get passes for specific user |
| `GET` | `/passes/verify/:passId` | ❌ | Any | Verify a pass by Pass ID |
| `PATCH` | `/passes/:id` | ✅ JWT | Admin | Update pass status |

#### `POST /passes`
```json
// Request (Headers: Authorization: Bearer <token>)
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "passType": "General Pass",
  "startDate": "2026-05-01",
  "duration": 1,
  "passId": "TP-GN260587A3F2",
  "expiryDate": "2026-05-31"
}

// Response (200 OK)
{ "id": "pass_1714000000000", "passId": "TP-GN260587A3F2", "status": "pending", "createdAt": "2026-04-24T..." }
```

#### `PATCH /passes/:id`
```json
// Request (Admin only)
{ "status": "approved" }  // or "rejected"

// Response (200 OK)
{ "success": true }
```

### User Management

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/users` | ✅ JWT | Admin | List all registered citizens |

---

## 📂 Project Structure

```
BUSPASS REGISTRATION/
│
├── 📄 server.js                  # Express backend, API routes, SQLite DB init
├── 📄 .env                       # Environment variables (JWT secret, DB path, CORS)
├── 📄 package.json               # Dependencies & npm scripts
├── 📄 vite.config.js             # Vite build configuration
├── 📄 index.html                 # HTML entry point with PWA meta tags
├── 📄 transit.db                 # SQLite database file (auto-generated)
├── 📄 eslint.config.js           # ESLint configuration
├── 📄 check_admin.cjs            # Utility script to verify admin account
├── 📄 migrate_passwords.js       # Password migration utility (plaintext → bcrypt)
│
├── 📁 public/
│   ├── favicon.svg               # App favicon (SVG format)
│   ├── hero.png                  # Landing page hero image (1MB)
│   ├── icons.svg                 # Additional icon set
│   └── manifest.json             # PWA manifest (standalone mode, dark theme)
│
├── 📁 src/
│   ├── 📄 main.jsx               # React entry point (StrictMode + createRoot)
│   ├── 📄 App.jsx                # ALL React components & routing (865 lines)
│   │   ├── Spinner               # Reusable loading spinner
│   │   ├── Toast                 # Auto-dismissing notification system
│   │   ├── ProtectedRoute        # Role-based route guard (HOC)
│   │   ├── Navbar                # Responsive navigation (role-aware)
│   │   ├── LoginPage             # Email/username + password authentication
│   │   ├── RegisterPage          # New citizen registration
│   │   ├── UserHomePage          # Public landing page (hero, features, CTA)
│   │   ├── ApplyPassPage         # Pass application form with draft saving
│   │   ├── MyPassPage            # View submitted passes with status tracking
│   │   ├── AdminDashboard        # Analytics + application management
│   │   ├── ConductorLoginPage    # ID + PIN conductor login
│   │   ├── ConductorDashboard    # Pass verification + shift history
│   │   ├── NotFoundPage          # Custom 404 page
│   │   └── App                   # Root component with routing tree
│   │
│   ├── 📄 App.css                # Complete design system (1050+ lines)
│   │   ├── CSS Variables          # Design tokens (colors, fonts, shadows)
│   │   ├── Base Styles            # Reset, typography, buttons
│   │   ├── Navbar Styles          # Fixed header, glassmorphism
│   │   ├── Auth Styles            # Login/register card, glowing borders
│   │   ├── Form Styles            # Inputs, selects, toggle groups
│   │   ├── Dashboard Styles       # Stat grid, tables, charts
│   │   ├── Pass Card Styles       # Status badges, progress bars
│   │   ├── Conductor Styles       # Verification input, result cards
│   │   ├── Landing Page Styles    # Hero section, feature cards, CTA
│   │   ├── Mobile Responsive      # Breakpoints at 480px, 640px, 768px, 1024px
│   │   └── Animations             # fadeIn, float, spin keyframes
│   │
│   ├── 📄 index.css              # Global styles (scrollbar, glass utilities)
│   │
│   └── 📁 services/
│       └── 📄 db.js              # Frontend API service layer
│           ├── registerUser()     # POST /register
│           ├── loginUser()        # POST /login
│           ├── conductorLogin()   # Local auth (hardcoded credentials)
│           ├── submitPass()       # POST /passes (with ID gen + expiry calc)
│           ├── getUserPasses()    # GET /passes/user/:id
│           ├── getAllPasses()     # GET /passes (admin)
│           ├── getAllUsers()      # GET /users (admin)
│           ├── verifyPass()      # GET /passes/verify/:passId
│           ├── updatePassStatus() # PATCH /passes/:id (admin)
│           ├── generatePassId()   # Client-side Pass ID generation
│           └── calculateExpiry()  # Client-side expiry date computation
│
└── 📁 node_modules/              # Dependencies (337 packages)
```

---

## 🔐 Security Implementation

| Layer | Mechanism | Details |
|-------|-----------|---------|
| **Password Storage** | bcrypt hashing | 10 salt rounds, never stored in plaintext |
| **Authentication** | JWT tokens | 8-hour expiry, signed with secret key from `.env` |
| **HTTP Headers** | Helmet.js | Sets 15+ security headers (CSP, HSTS, etc.) |
| **Rate Limiting** | express-rate-limit | 100 requests per 15 min on `/login` |
| **Input Validation** | express-validator | Server-side email, password, name validation |
| **SQL Injection** | Parameterized queries | All DB queries use `?` placeholders |
| **XSS Prevention** | HTML escaping | User input escaped via `.escape()` |
| **CORS** | Configurable origin | Defaults to `http://localhost:5173` |
| **Route Protection** | JWT middleware | All protected routes verify token before executing |
| **Role Authorization** | JWT claims | Admin-only routes check `req.user.role === 'admin'` |
| **Sensitive Data** | Password stripping | Passwords removed from API responses (`password: undefined`) |

---

## ⚙️ Setup & Installation

### Prerequisites
- **Node.js** v18 or higher
- **npm** v9 or higher

### Step-by-Step

```bash
# 1. Clone the repository
git clone <repository-url>
cd "BUSPASS REGISTRATION"

# 2. Install all dependencies (frontend + backend)
npm install

# 3. Configure environment variables (optional — defaults work out of box)
# Edit .env file if needed:
#   PORT=5000
#   JWT_SECRET=your_custom_secret
#   DB_PATH=./transit.db
#   CORS_ORIGIN=http://localhost:5173

# 4. Start the Backend Server (Terminal 1)
node server.js
# Output: Server running at http://localhost:5000

# 5. Start the Frontend Dev Server (Terminal 2)
npm run dev
# Output: VITE ready at http://localhost:5173

# 6. Open in browser
# → http://localhost:5173
```

### NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

---

## 🔑 Default Credentials

### Administrator
| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `password@123` |

### Demo Conductors
| Conductor ID | PIN | Name | Route |
|-------------|-----|------|-------|
| COND001 | 1234 | Ravi Kumar | Route 5C |
| COND002 | 5678 | Suresh Babu | Route 12A |
| COND003 | 9999 | Priya Devi | Route 8B |

> ⚠️ **Note**: The admin password is auto-hashed with bcrypt on first server start. Conductor credentials are hardcoded in the frontend for prototype purposes.

---

## 🖼️ Screenshots & UI Flow

### User Journey Flow

```
                    ┌─────────┐
                    │  HOME   │
                    │ (Public)│
                    └─────┬───┘
                          │
               ┌──────────┼──────────┐
               │          │          │
         ┌─────▼───┐ ┌───▼────┐ ┌──▼──────────┐
         │ REGISTER│ │ LOGIN  │ │ CONDUCTOR   │
         │ (New)   │ │(Exist.)│ │   LOGIN     │
         └─────┬───┘ └───┬────┘ └──┬──────────┘
               │         │         │
               └────┬────┘         │
                    │              │
           ┌────────▼────────┐    ┌▼──────────────┐
           │   ROLE CHECK    │    │  VERIFICATION  │
           └────┬───────┬────┘    │    PORTAL      │
                │       │         └────────────────┘
         ┌──────▼──┐ ┌──▼────────┐
         │  USER   │ │  ADMIN    │
         │ PORTAL  │ │ DASHBOARD │
         └──┬──┬───┘ └──┬───────┘
            │  │         │
    ┌───────▼┐ ▼────┐ ┌──▼──────────┐
    │ APPLY  │MY    │ │ MANAGE APPS │
    │ PASS   │PASSES│ │ VIEW USERS  │
    └────────┘──────┘ │ ANALYTICS   │
                      └─────────────┘
```

### Key Screens

| Screen | Route | Description |
|--------|-------|-------------|
| Landing Page | `/` | Hero section, features grid, pass categories, CTA |
| Login | `/login` | Glassmorphism card, Login/Register tabs |
| Register | `/register` | Name + Email + Password form |
| Apply Pass | `/apply` | Multi-field form with duration toggle + date preview |
| My Passes | `/my-pass` | Grid of pass cards with status badges |
| Admin Dashboard | `/admin` | Stats + Charts + Application table |
| Conductor Login | `/conductor` | ID + PIN secure entry |
| Verification | `/conductor/verify` | Pass ID input + result card + history |
| 404 Page | `/*` | Custom "route not found" page |

---

## 🎨 Design System

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--primary` | `#6366f1` | Indigo — buttons, active states, icons |
| `--secondary` | `#ec4899` | Pink — accents, gradient endpoints |
| `--accent` | `#8b5cf6` | Purple — gradient midpoints |
| `--background` | `#0f172a` | Dark navy — page background |
| `--surface` | `#1e293b` | Slate — card backgrounds |
| `--text` | `#f8fafc` | Near-white — primary text |
| `--text-muted` | `#94a3b8` | Gray — secondary text, labels |
| `--border` | `rgba(255,255,255,0.1)` | Subtle borders |

### Typography

| Font | Weight Range | Usage |
|------|-------------|-------|
| **Inter** | 300–700 | Body text, labels, buttons |
| **Outfit** | 300–700 | Headings (h1-h6) |
| **Courier New** | — | Pass IDs, monospace data |

### Design Principles

1. **Dark-Modern Dashboard** — Deep navy background with bright accent colors
2. **Glassmorphism** — Semi-transparent cards with `backdrop-filter: blur(16px)`
3. **Vibrant Gradients** — Indigo → Purple → Pink for CTAs and accents
4. **Responsive Breakpoints** — 480px (mobile), 640px (small tablet), 768px (tablet), 1024px (desktop)
5. **Micro-Animations** — `fadeIn`, `float`, and `spin` for engagement
6. **Mobile-First** — Tables convert to cards, desktop nav hidden on mobile

---

## 📄 License

This project is for educational and demonstration purposes.

---

<p align="center">
  Built with ❤️ by <strong>TransitPass Technologies</strong> • © 2026
</p>
