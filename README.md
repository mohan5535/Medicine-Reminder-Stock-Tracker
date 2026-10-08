# Medicine Reminder & Stock Tracker

A production-ready full-stack healthcare web application that manages prescription schedules, tracks daily medication adherence, and automates pharmacy inventory levels in real time.

Live Deployments (Placeholders):
- **Frontend (Vercel)**: `https://your-frontend.vercel.app`
- **Backend API (Render)**: `https://your-backend.onrender.com/api`

---

## Features

- **Dashboard Adherence Overview**: Real-time adherence metrics (Total Medicines, Today's Doses, Taken Today, Missed Today, Low Stock alerts, Out of Stock warnings).
- **Today's Schedule & Actions**: Direct "Mark Taken" and "Mark Missed" intake tracking with instant stock updates.
- **Medication Catalog**: Complete CRUD management for medications with dosages, frequencies, schedule timings, active durations, and custom notes.
- **Automated Inventory & Stock Tracking**:
  - Automatically deducts stock upon recording a dose as "Taken".
  - Prevents double deduction for the same dose.
  - Hard guards ensuring stock never drops below zero.
  - Visual stock level indicators and threshold warnings (Normal, Low Stock, Out of Stock).
  - One-click stock refill and adjustment tool.
- **Prescription Schedules**: Configurable recurring schedules (daily, weekly, custom) with one-click enable/disable toggles.
- **Audit & Compliance History**: Full historical log of all taken and missed doses with timestamps (`takenAt`), filters by medicine, and status tracking.
- **Robust Error Handling**: Clean JSON error responses, form validation, delete confirmation modals, and retry states.

---

## Tech Stack

### Frontend
- **Framework**: React 19, Vite, TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM (with SPA routing fallback for Vercel)
- **Icons**: Lucide React
- **Architecture**: Modular layout, Context-based Toast notification system, reusable UI components

### Backend
- **Runtime & Framework**: Node.js, Express 5, TypeScript
- **Database & ODM**: MongoDB Atlas, Mongoose
- **CORS**: Configured for local development and production Vercel origins
- **Validation**: Schema-level and controller-level data validation

---

## Architecture

```
[ Client / Browser ] (React + Vite SPA on Vercel)
         │
         │ HTTPS / JSON API
         ▼
[ Express API Server ] (Node.js + TypeScript on Render)
         │
         │ Mongoose ODM
         ▼
[ MongoDB Atlas ] (Cloud NoSQL Database)
```

---

## Folder Structure

```
Medicine-Reminder-Stock-Tracker/
├── .gitignore                      # Root Git ignore (prevents committing secrets)
├── README.md                       # Complete documentation
├── backend/
│   ├── .env.example                # Backend environment template
│   ├── .gitignore                  # Backend Git ignore
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── app.ts                  # Express application setup & CORS configuration
│       ├── server.ts               # Server startup & 0.0.0.0 host binding
│       ├── config/
│       │   └── database.ts         # MongoDB Atlas connection
│       ├── controllers/
│       │   ├── medicineController.ts
│       │   ├── scheduleController.ts
│       │   └── doseController.ts   # Dose tracking & atomic stock deduction
│       ├── models/
│       │   ├── Medicine.ts
│       │   ├── Schedule.ts
│       │   └── DoseRecord.ts
│       └── routes/
│           ├── medicineRoutes.ts
│           ├── scheduleRoutes.ts
│           └── doseRoutes.ts
└── frontend/
    ├── .env.example                # Frontend environment template
    ├── .gitignore                  # Frontend Git ignore
    ├── package.json
    ├── tsconfig.json
    ├── tsconfig.app.json
    ├── vercel.json                 # Vercel SPA rewrite configuration
    ├── vite.config.ts
    └── src/
        ├── App.tsx                 # Route definitions
        ├── main.tsx                # Entry point
        ├── index.css               # Tailwind CSS styles
        ├── types/                  # TypeScript interfaces & status helpers
        ├── services/
        │   └── api.ts              # Centralized API service
        ├── context/
        │   └── ToastContext.tsx    # Toast notifications
        ├── components/
        │   ├── common/             # Reusable UI (Button, Badge, Modal, etc.)
        │   └── layout/             # Layout, Navbar, Sidebar
        └── pages/                  # Dashboard, Medicines, Schedules, Doses, History
```

---

## Local Setup

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (v9 or higher)
- MongoDB Atlas connection string (or local MongoDB instance)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/Medicine-Reminder-Stock-Tracker.git
cd Medicine-Reminder-Stock-Tracker
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create `.env` file in `backend/`:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:5173
```
Build and run the backend:
```bash
# Build TypeScript
npm run build

# Start server
npm start

# Or development mode with live watch:
npm run dev
```
Backend will run at `http://localhost:5000`. Test health:
```bash
curl http://localhost:5000/api/health
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```
Create `.env` file in `frontend/`:
```env
VITE_API_URL=http://localhost:5000/api
```
Build and run the frontend:
```bash
# Build TypeScript & Vite assets
npm run build

# Start Vite development server
npm run dev
```
Frontend will be available at `http://localhost:5173`.

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Example (Local) | Example (Production) |
| :--- | :--- | :--- | :--- |
| `PORT` | Server listening port | `5000` | Assigned automatically by Render |
| `MONGODB_URI` | MongoDB Atlas URI | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` | `mongodb+srv://...` |
| `CLIENT_URL` | Allowed frontend origin(s) | `http://localhost:5173` | `https://your-frontend.vercel.app` |

### Frontend (`frontend/.env`)
| Variable | Description | Example (Local) | Example (Production) |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | Backend base API URL | `http://localhost:5000/api` | `https://your-backend.onrender.com/api` |

---

## API Endpoints

### Health Check
- `GET /api/health` — System health check

### Medicines (`/api/medicines`)
- `POST /api/medicines` — Create a new medicine
- `GET /api/medicines` — List all medicines (sorted newest first)
- `GET /api/medicines/:id` — Get medicine details by ID
- `PUT /api/medicines/:id` — Update medicine details or stock
- `DELETE /api/medicines/:id` — Delete a medicine

### Schedules (`/api/schedules`)
- `POST /api/schedules` — Create a schedule
- `GET /api/schedules` — List schedules (supports `?medicineId=`)
- `GET /api/schedules/:id` — Get schedule by ID
- `PUT /api/schedules/:id` — Update schedule or toggle enabled
- `DELETE /api/schedules/:id` — Delete a schedule

### Doses (`/api/doses`)
- `POST /api/doses` — Log a new dose record
- `GET /api/doses` — List dose records (supports `?medicineId=&status=`)
- `GET /api/doses/today` — Get doses scheduled for today (supports `?date=`)
- `GET /api/doses/:id` — Get dose record by ID
- `PUT /api/doses/:id` — Update dose status (`pending`, `taken`, `missed`); marking taken atomically reduces stock
- `DELETE /api/doses/:id` — Delete a dose record

---

## MongoDB Setup

1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a Database User with read and write privileges.
3. In **Network Access**, add `0.0.0.0/0` to allow inbound connections from Render.
4. Obtain the connection string under **Database > Connect > Drivers**.
5. Set `MONGODB_URI` in `backend/.env` (or in Render environment settings).

---

## Production Deployment

### 1. Backend Deployment on Render

1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New + > Web Service**.
3. Connect your GitHub repository.
4. Set the following settings:
   - **Name**: `medicine-reminder-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. In **Environment Variables**, add:
   - `MONGODB_URI`: `<your_mongodb_atlas_connection_string>`
   - `CLIENT_URL`: `https://your-frontend.vercel.app`
   - `NODE_ENV`: `production`
   *(Render assigns `PORT` automatically; the server listens on `process.env.PORT` bound to `0.0.0.0`)*.
6. Deploy the service and note your live URL (e.g., `https://medicine-reminder-backend.onrender.com`).

### 2. Frontend Deployment on Vercel

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New... > Project** and import your GitHub repository.
3. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In **Environment Variables**, add:
   - `VITE_API_URL`: `https://your-backend.onrender.com/api`
5. Click **Deploy**.
6. SPA routing is automatically handled by [`frontend/vercel.json`](file:///c:/Users/Mohan/OneDrive/Desktop/Intership/Medicine-Reminder-Stock-Tracker/frontend/vercel.json) to prevent 404 errors on page refresh.

---

## Testing Instructions

### Run Backend Tests
Run the TypeScript compiler:
```bash
cd backend
npm run build
```

### Run Frontend Tests
Verify zero TypeScript and bundle errors:
```bash
cd frontend
npm run build
```

---

## Security Best Practices Implemented

- All `.env` and sensitive environment files are excluded via `.gitignore`.
- Zero credentials or secrets exist in the source code or documentation.
- CORS restricted to explicit development and configured production frontend domains.
- Input validation on all endpoints prevents injection, negative stock values, and invalid dates.
- Atomic stock decrements ensure concurrency safety without negative inventory.
