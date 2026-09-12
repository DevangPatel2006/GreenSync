# GreenSync

GreenSync is an intelligent energy synchronization and smart device scheduling platform designed to optimize energy consumption, reduce carbon footprints, and reward sustainable usage.

---

## 📁 Project Structure

```text
greensync/
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI pieces (Button, Card, Chart, etc.)
│   │   ├── pages/          # One file per route (Dashboard.jsx, Login.jsx…)
│   │   ├── layouts/        # Shared page shells (AppLayout, AuthLayout)
│   │   ├── services/       # api.js — the ONLY place axios is configured
│   │   ├── hooks/          # useAuth, useDevices, etc.
│   │   ├── context/        # AuthContext, global state
│   │   ├── utils/          # formatters, validators
│   │   └── assets/         # images, icons
│   └── .env.example
├── backend/
│   ├── src/
│   │   ├── config/         # db.js, env loading
│   │   ├── controllers/    # request handlers (thin — call services)
│   │   ├── middleware/     # auth.js, errorHandler.js, validate.js
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # Express routers, one file per resource
│   │   ├── services/       # business logic (scheduling/, energy/, rewards/)
│   │   ├── providers/      # EnergyDataProvider implementations
│   │   └── utils/          # response.js, logger.js
│   └── .env.example
├── docs/                   # architecture notes, ADRs (shared, coordinate changes)
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB
- Git

### Frontend Setup
1. Navigate to frontend:
   ```bash
   cd frontend
   ```
2. Copy environment template:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies & start dev server:
   ```bash
   npm install
   npm run dev
   ```

### Backend Setup
1. Navigate to backend:
   ```bash
   cd backend
   ```
2. Copy environment template:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies & start server:
   ```bash
   npm install
   npm run dev
   ```

---

## 📜 Documentation
- [Architecture Overview](docs/architecture.md)
- [Architecture Decision Records (ADRs)](docs/ADR.md)
