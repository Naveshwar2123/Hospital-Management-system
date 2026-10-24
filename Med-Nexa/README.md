<p align="center">
  <img src="https://img.shields.io/badge/Med--Nexa-Smart%20Hospital%20Platform-00a651?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjIgMTJoLTRsLTMgOUw5IDNsLTMgOUgyIi8+PC9zdmc+" alt="Med-Nexa Badge" />
</p>

<h1 align="center">🏥 Med-Nexa</h1>
<h3 align="center">Smart Hospital Management & Outpatient Queue System</h3>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.3-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js&logoColor=white" alt="Node" />
  <img src="https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/PostgreSQL-17-336791?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Socket.IO-4.x-010101?logo=socket.io&logoColor=white" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white" alt="Vite" />
</p>

<p align="center">
  A full-stack, real-time hospital outpatient management platform with live OPD queue tracking, appointment booking, doctor consultation panels, and dual-database architecture (Supabase PostgreSQL + Google Sheets academic engine).
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database](#-database)
- [API Endpoints](#-api-endpoints)
- [Demo Accounts](#-demo-accounts)
- [Google Sheets Database (Academic Reference)](#-google-sheets-database-academic-reference)
- [Screenshots](#-screenshots)
- [License](#-license)

---

## 🌟 Overview

**Med-Nexa** is a comprehensive hospital management system designed to digitize and streamline the outpatient department (OPD) workflow. It provides separate, role-based portals for **patients** and **doctors** with real-time queue management powered by WebSockets.

The project showcases a **dual-database architecture**:
- **Active Production DB:** Supabase PostgreSQL (cloud-hosted, real-time sync)
- **Academic Reference DB:** Google Sheets via Apps Script (preserved & commented for teacher/viva explanation)

---

## ✨ Features

### 🏠 Landing Page
- Animated bento-grid layout with glassmorphism design
- Interactive **OPD Queue Simulator** with live token counter and audio chime
- Department slot explorer and E-Rx prescription preview tabs
- Scroll-triggered progress bar and sticky navbar with `.scrolled` effect
- Responsive design for mobile, tablet, and desktop

### 🧑‍⚕️ Patient Portal (`/patient/*`)
| Feature | Description |
| :--- | :--- |
| **Dashboard** | Today's appointments, live queue position tracker, recent medical records, and quick-action cards |
| **Find Doctors** | Browse all available doctors by specialization, view ratings, qualifications, experience, and fees |
| **Book Appointment** | Select a doctor → pick a date → choose a time slot → confirm booking with unique Booking ID |
| **My Appointments** | View all upcoming/past appointments with status badges (Scheduled, Checked-In, Completed, Cancelled) |
| **Live Queue** | Real-time OPD queue tracker — see your token number, current serving token, estimated wait time, and position |
| **Medical Records** | View consultation history, diagnoses, prescriptions, vital signs, and follow-up dates |

### 👨‍⚕️ Doctor Portal (`/doctor/*`)
| Feature | Description |
| :--- | :--- |
| **Dashboard** | Today's patient count, queue stats, recent consultations, and appointment overview cards |
| **Appointments** | View and manage all patient appointments for today and upcoming dates |
| **Active Queue Manager** | Call next patient, skip patients, manage the live OPD queue with token system |
| **Consultations** | Record diagnosis, symptoms, prescriptions (medicine name, dosage, frequency, duration), doctor notes, vital signs, and follow-up dates |
| **Profile** | View and update doctor profile — specialization, qualification, consultation fee, bio |

### ⚡ Real-Time Features
- **Socket.IO** WebSocket integration for live queue updates
- Patients are notified instantly when their token is called ("It's your turn!")
- Queue dashboard updates in real-time across all connected clients
- Token-based OPD management with automatic queue progression

### 🔐 Authentication & Security
- JWT-based authentication with **access + refresh token** dual-token strategy
- HttpOnly secure cookies for token storage
- Role-based route protection (patient / doctor)
- Helmet.js security headers
- Express rate limiting on auth endpoints
- bcrypt password hashing (12-round salt)

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
| :--- | :--- |
| **React 19** | UI library with functional components & hooks |
| **Vite 8** | Lightning-fast build tool and dev server |
| **React Router 7** | Client-side routing with role-based guards |
| **Socket.IO Client** | Real-time WebSocket connection for live queue |
| **Axios** | HTTP client for REST API requests |
| **Lucide React** | Modern icon library |
| **React Hot Toast** | Elegant notification system |
| **Vanilla CSS** | Custom design system with CSS variables, glassmorphism, and micro-animations |

### Backend
| Technology | Purpose |
| :--- | :--- |
| **Node.js 22** | JavaScript runtime |
| **Express 5** | Web application framework |
| **PostgreSQL 17 (Supabase)** | Cloud relational database (primary database) |
| **pg** | PostgreSQL client with connection pooling |
| **Socket.IO 4** | WebSocket server for real-time events |
| **JWT** | Access & refresh token authentication |
| **bcryptjs** | Password hashing |
| **Helmet** | HTTP security headers |
| **Morgan** | HTTP request logger |
| **express-rate-limit** | API rate limiting |
| **express-validator** | Input validation middleware |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│  React 19 + Vite 8 + Socket.IO Client + React Router 7          │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌──────────────┐  │
│  │ Landing  │  │  Auth    │  │  Patient   │  │   Doctor     │  │
│  │  Page    │  │  Pages   │  │  Portal    │  │   Portal     │  │
│  └──────────┘  └──────────┘  └────────────┘  └──────────────┘  │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTP (REST) + WebSocket (Socket.IO)
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SERVER (Node.js + Express 5)                 │
│  ┌────────┐ ┌────────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │ Auth   │ │Appointments│ │  Queue   │ │  Consultations    │  │
│  │ Routes │ │   Routes   │ │  Routes  │ │     Routes        │  │
│  └───┬────┘ └─────┬──────┘ └────┬─────┘ └────────┬──────────┘  │
│      │            │             │                 │              │
│      ▼            ▼             ▼                 ▼              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Controllers + Services Layer                │    │
│  │   • supabaseService.js (PostgreSQL database service)     │    │
│  │   • googleSheetsService.js (commented, academic ref)     │    │
│  └────────────────────────────┬────────────────────────────┘    │
│                               │                                 │
│                               ▼                                 │
│              ┌─────────────────────────────────┐                │
│              │     Supabase PostgreSQL 17      │                │
│              │   (Primary Database via pg)     │                │
│              └─────────────────────────────────┘                │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐       │
│  │  Google Sheets Database Engine (Academic / Commented) │       │
│  │  google-sheets-database/Code.gs → Apps Script WebApp  │       │
│  └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
Navi hospital/
├── backend/                          # Express.js REST API Server
│   ├── server.js                     # Entry point — Express, Socket.IO, routes
│   ├── .env                          # Environment variables (Supabase PostgreSQL, JWT)
│   ├── package.json
│   └── src/
│       ├── config/
│       │   ├── db.js                 # Database connection (PostgreSQL)
│       │   └── supabase.js           # Supabase PostgreSQL connection pool (pg)
│       ├── controllers/
│       │   ├── authController.js     # Register, Login, Logout, Refresh Token
│       │   ├── appointmentController.js  # Create, Get, Cancel appointments
│       │   ├── consultationController.js # Start, Complete consultations
│       │   ├── doctorController.js   # Doctor listing, profile, availability
│       │   └── queueController.js    # Check-in, Call next, Skip patient
│       ├── middleware/
│       │   ├── auth.js               # JWT authentication middleware
│       │   └── validators.js         # Express-validator input validation
│       ├── models/                   # PostgreSQL Data Models
│       │   ├── User.js              
│       │   ├── DoctorProfile.js     
│       │   ├── Appointment.js       
│       │   ├── Queue.js             
│       │   └── Consultation.js      
│       ├── routes/
│       │   ├── authRoutes.js        
│       │   ├── appointmentRoutes.js 
│       │   ├── consultationRoutes.js
│       │   ├── doctorRoutes.js      
│       │   ├── queueRoutes.js       
│       │   ├── supabaseRoutes.js     # Supabase status & preview API
│       │   └── sheetsRoutes.js       # (Commented) Google Sheets API routes
│       ├── services/
│       │   ├── supabaseService.js    # Active Supabase PostgreSQL service
│       │   └── googleSheetsService.js # (Commented) Google Sheets HTTP client
│       ├── scripts/
│       │   ├── setupSupabase.js      # Create PostgreSQL tables in Supabase
│       │   └── migrateToSupabase.js  # PostgreSQL database verification script
│       ├── socket/
│       │   └── socketHandler.js      # WebSocket authentication & room management
│       └── utils/
│           ├── seedData.js           # Seed demo doctors on first boot
│           └── tokenUtils.js         # JWT access/refresh token generation
│
├── frontend/                         # React 19 + Vite 8 SPA
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── src/
│       ├── App.jsx                   # Root component with React Router
│       ├── main.jsx                  # ReactDOM entry point
│       ├── index.css                 # Global design system (CSS variables, animations)
│       ├── components/
│       │   ├── common/
│       │   │   ├── DatabaseModal.jsx # Supabase status + Google Sheets teacher reference
│       │   │   ├── GoogleSheetsModal.jsx # (Preserved) Original Google Sheets modal
│       │   │   └── ProtectedRoute.jsx    # Role-based route guard
│       │   └── layout/
│       │       ├── DashboardLayout.jsx   # Sidebar + content layout wrapper
│       │       └── Sidebar.jsx           # Navigation sidebar with Supabase DB button
│       ├── contexts/
│       │   └── AuthContext.jsx       # Global authentication state (login, logout, user)
│       ├── hooks/
│       │   └── useSocket.js          # Custom hook for Socket.IO connection
│       ├── pages/
│       │   ├── Landing.jsx           # Public landing page with bento design
│       │   ├── auth/
│       │   │   ├── Login.jsx         # Login form with demo account buttons
│       │   │   └── Register.jsx      # Registration form (patient/doctor)
│       │   ├── patient/
│       │   │   ├── PatientDashboard.jsx  # Patient home dashboard
│       │   │   ├── FindDoctors.jsx       # Doctor search & appointment booking
│       │   │   ├── MyAppointments.jsx    # Patient's appointment list
│       │   │   ├── LiveQueue.jsx         # Real-time queue tracker
│       │   │   └── MedicalRecords.jsx    # Consultation history viewer
│       │   └── doctor/
│       │       ├── DoctorDashboard.jsx   # Doctor home dashboard
│       │       ├── DoctorAppointments.jsx # Doctor's appointment manager
│       │       ├── ActiveQueueManager.jsx # OPD queue control panel
│       │       ├── DoctorConsultations.jsx # E-Rx consultation recorder
│       │       └── DoctorProfile.jsx      # Doctor profile editor
│       └── services/
│           └── api.js                # Axios instance with interceptors
│
└── google-sheets-database/          # Academic Reference: Google Sheets DB Engine
    ├── Code.gs                       # Google Apps Script (doPost/doGet handlers)
    └── README.md                     # Setup instructions for Apps Script deployment
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ (recommended: v22.x)
- **PostgreSQL / Supabase** account or instance
- **npm** (comes with Node.js)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "Navi hospital"
```

### 2. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Configure Environment Variables

Create `backend/.env` (or edit the existing one):

```env
PORT=5000
JWT_ACCESS_SECRET=your_access_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# Supabase PostgreSQL (Production Database)
SUPABASE_HOST=aws-0-ap-southeast-2.pooler.supabase.com
SUPABASE_PORT=5432
SUPABASE_DATABASE=postgres
SUPABASE_USER=postgres.your_project_ref
SUPABASE_PASSWORD=your_supabase_password
```

### 4. Start the Servers

```bash
# Terminal 1 — Start Backend (auto-restarts on file change)
cd backend
npm run dev

# Terminal 2 — Start Frontend (Vite dev server with HMR)
cd frontend
npm run dev
```

### 5. Open in Browser

```
Frontend:  http://localhost:5173
Backend:   http://localhost:5000
API Docs:  http://localhost:5000/api/health
```

> 💡 **First launch:** The backend automatically seeds **demo doctors** on startup if none exist.

---

## ⚙️ Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Backend server port | `5000` |
| `JWT_ACCESS_SECRET` | Secret key for access tokens | Required |
| `JWT_REFRESH_SECRET` | Secret key for refresh tokens | Required |
| `JWT_ACCESS_EXPIRY` | Access token expiry duration | `15m` |
| `JWT_REFRESH_EXPIRY` | Refresh token expiry duration | `7d` |
| `CLIENT_URL` | Frontend URL (for CORS) | `http://localhost:5173` |
| `NODE_ENV` | Environment mode | `development` |
| `SUPABASE_HOST` | Supabase pooler hostname | *(optional)* |
| `SUPABASE_PORT` | PostgreSQL port | `5432` |
| `SUPABASE_DATABASE` | Database name | `postgres` |
| `SUPABASE_USER` | Supabase database user | *(optional)* |
| `SUPABASE_PASSWORD` | Supabase database password | *(optional)* |

---

## 🗄 Database

### Primary: Supabase PostgreSQL 17

The application uses **PostgreSQL 17** (hosted via Supabase) as the primary database with relationally-backed tables:

| Table | Description |
| :--- | :--- |
| `users` | Patient and doctor accounts (name, email, phone, password_hash, role) |
| `doctor_profiles` | Doctor specialization, qualification, fee, working_hours, rating |
| `appointments` | Patient-doctor appointments with booking ID, date, slot, status |
| `queues` | Daily OPD queue per doctor with token entries |
| `consultations` | Diagnosis, symptoms, prescriptions, vitals, follow-up |

Every write operation (registration, appointment booking, queue updates) executes directly on Supabase PostgreSQL. This provides:

- PostgreSQL relational integrity with foreign keys and UUIDs
- Connection pooling for high performance
- Dashboard statistics via `/api/supabase/status`
- Dashboard statistics via `/api/supabase/status`

### Academic Reference: Google Sheets

The Google Sheets database engine is **fully preserved and commented** in the codebase. See the [dedicated section](#-google-sheets-database-academic-reference) below.

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new patient or doctor |
| `POST` | `/api/auth/login` | Login with email & password |
| `POST` | `/api/auth/logout` | Logout and clear tokens |
| `POST` | `/api/auth/refresh` | Refresh access token |
| `GET` | `/api/auth/me` | Get authenticated user profile |

### Doctors
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/doctors` | List all available doctors |
| `GET` | `/api/doctors/:id` | Get specific doctor profile |
| `GET` | `/api/doctors/:id/slots` | Get available time slots for a date |
| `PUT` | `/api/doctors/profile` | Update doctor profile |
| `PUT` | `/api/doctors/toggle-availability` | Toggle doctor online/offline |

### Appointments
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/appointments` | Book a new appointment |
| `GET` | `/api/appointments/my` | Get patient's appointments |
| `GET` | `/api/appointments/doctor` | Get doctor's appointments |
| `PUT` | `/api/appointments/:id/cancel` | Cancel an appointment |

### Queue Management
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/queue/:doctorId` | Get queue status for a doctor |
| `POST` | `/api/queue/:doctorId/check-in` | Check into OPD queue |
| `POST` | `/api/queue/:doctorId/call-next` | Call next patient (doctor) |
| `POST` | `/api/queue/:doctorId/skip/:token` | Skip a patient (doctor) |
| `GET` | `/api/queue/my-position/:doctorId` | Get patient's queue position |

### Consultations
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/consultations` | Create consultation record |
| `GET` | `/api/consultations/patient` | Get patient's consultation history |
| `GET` | `/api/consultations/doctor` | Get doctor's consultations |

### Supabase Status
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/supabase/status` | Connection health & table row counts |
| `GET` | `/api/supabase/preview/:table` | Preview records from a Supabase table |

### Health Check
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | API health check |

---

## 🔑 Demo Accounts

The application includes **one-click demo login buttons** on the login page:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Patient** | `rahul.sharma@example.com` | `patient123` |
| **Doctor** | `priya.sharma@navihospital.com` | `doctor123` |

> These accounts are automatically created when you first register through the app. Use the **"Demo Patient"** and **"Demo Doctor"** quick-login buttons on the login page.

### Pre-Seeded Doctors

On first boot, the system seeds **8 specialist doctors**:

| Doctor | Specialization | Fee |
| :--- | :--- | :--- |
| Dr. Priya Sharma | Cardiology | ₹800 |
| Dr. Rajesh Kumar | Orthopedics | ₹700 |
| Dr. Anjali Mehta | Dermatology | ₹600 |
| Dr. Vikram Singh | Pediatrics | ₹500 |
| Dr. Neha Gupta | Neurology | ₹900 |
| Dr. Amit Patel | General Medicine | ₹400 |
| Dr. Sneha Reddy | Gynecology | ₹750 |
| Dr. Arjun Nair | ENT | ₹550 |

---

## 📊 Google Sheets Database (Academic Reference)

> **Status:** Commented in codebase — preserved for teacher/viva explanation. Not active in production.

The project originally implemented a **Google Sheets database engine** to demonstrate serverless data storage using Google Apps Script as a REST API bridge. This code is fully retained and documented for academic presentation.

### Architecture

```
Node.js Backend                      Google Cloud
┌──────────────────┐     HTTPS POST   ┌──────────────────────────┐
│ googleSheetsService│ ──────────────►  │ Code.gs (Apps Script)    │
│   .insertOne()    │                  │   doPost(e) handler      │
│   .findAll()      │ ◄──────────────  │   SpreadsheetApp API     │
│   .testConnection │    JSON Response │   Sheet tabs:            │
└──────────────────┘                  │     Users, DoctorProfiles │
                                      │     Appointments, Queues  │
                                      │     Consultations         │
                                      └──────────────────────────┘
```

### Code Locations for Teacher Review

| File | What to Explain |
| :--- | :--- |
| `google-sheets-database/Code.gs` | Apps Script `doPost(e)` / `doGet(e)` handlers, dynamic sheet tab creation, JSON row serialization |
| `backend/src/services/googleSheetsService.js` | Node.js HTTP client that sends POST requests to the Apps Script Web App endpoint |
| `backend/src/routes/sheetsRoutes.js` | Express routes for `/api/sheets/status`, `/api/sheets/test`, `/api/sheets/sync` |
| `backend/src/controllers/appointmentController.js` | Commented `sheetsService.insertOne('Appointments', {...})` call showing real-time sync |
| `backend/server.js` | Commented `app.use('/api/sheets', sheetsRoutes)` mount point |
| `backend/.env` | Commented `GOOGLE_SHEET_WEBAPP_URL` with deployment URL |
| `frontend/src/components/common/GoogleSheetsModal.jsx` | React modal UI for testing Google Sheets connection |

### How It Worked

1. **Google Sheets** acted as a serverless NoSQL-style database
2. **Apps Script** (`Code.gs`) exposed `doPost(e)` as a Web App endpoint
3. **Node.js backend** sent HTTP POST requests with JSON payloads like `{ action: 'insertOne', collection: 'Users', data: {...} }`
4. Apps Script parsed the request and used `SpreadsheetApp.getActiveSpreadsheet()` to read/write rows
5. Standard JSON responses were returned to the backend

### Re-Enabling Google Sheets (If Needed)

1. Uncomment `GOOGLE_SHEET_WEBAPP_URL` in `backend/.env`
2. Uncomment `const sheetsRoutes = require(...)` in `backend/server.js`
3. Uncomment `app.use('/api/sheets', sheetsRoutes)` in `backend/server.js`
4. Uncomment `const sheetsService = require(...)` in `appointmentController.js`
5. Uncomment the `sheetsService.insertOne(...)` block in the same file

---

## 🎨 Design System

The frontend uses a custom **CSS design system** built with CSS variables:

- **Color Palette:** Emerald green (`#00a651`) primary, dark navy (`#0f172a`) backgrounds
- **Typography:** System font stack with `Inter` and `Segoe UI`
- **Effects:** Glassmorphism cards, smooth hover transitions, micro-animations
- **Components:** Custom buttons (`.btn-primary`, `.btn-outline`, `.btn-ghost`), cards, tables, badges
- **Responsive:** Mobile-first with sidebar collapse on smaller viewports
- **Animations:** Page enter slide-fade, table row hover, bento card lift, pulsing queue indicator

---

## 🧪 Production Build

```bash
# Build frontend for production
cd frontend
npm run build

# Output: frontend/dist/
# Serve with any static file server or deploy to Vercel/Netlify
```

---

## 📄 License

This project is licensed under the **ISC License**.

---

<p align="center">
  Built with ❤️ for smart healthcare management
  <br />
  <strong>Med-Nexa</strong> — Digitizing Hospital OPD, One Token at a Time
</p>
