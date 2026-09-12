# Architecture Overview

This document describes the high-level architecture, module boundaries, and design principles for **GreenSync**.

---

## 1. System Overview

GreenSync consists of:
- **Frontend**: A React single-page application communicating with the backend API. All HTTP requests are routed through `src/services/api.js`.
- **Backend**: An Express & Node.js service organized with layered architecture:
  - **Controllers**: Handle HTTP requests and responses (thin handlers).
  - **Services**: Encapsulate domain logic (scheduling, energy monitoring, rewards calculation).
  - **Providers**: Pluggable integrations for external energy grids and smart meters (`EnergyDataProvider`).
  - **Models**: MongoDB schemas using Mongoose.
  - **Middleware**: Authentication, validation, and centralized error handling.

---

## 2. Directory Separation of Concerns

### Frontend
- `components/`: Pure, reusable UI components.
- `pages/`: Route-level container components.
- `layouts/`: Shared visual shells (navigation, headers, footers).
- `services/`: Network clients and endpoint definitions.
- `hooks/`: Custom stateful hooks for reusable UI logic.
- `context/`: Application-level React Context providers.
- `utils/`: Pure helper functions, formatters, and validators.

### Backend
- `config/`: Database and environment configurations.
- `controllers/`: Thin request handlers delegating directly to services.
- `middleware/`: Cross-cutting concerns (auth, logging, error handling, validation).
- `models/`: Database schemas and persistence models.
- `routes/`: Express endpoint routing definitions.
- `services/`: Business logic separated by domain:
  - `scheduling/`: Intelligent device scheduling algorithms.
  - `energy/`: Real-time energy data calculation and tracking.
  - `rewards/`: Eco-credits and user reward mechanisms.
- `providers/`: Adapters implementing the `EnergyDataProvider` contract.
- `utils/`: Shared utilities (loggers, responses).
