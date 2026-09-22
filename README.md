# FinanceFlow — Personal Finance & Expense Management Platform

[![Python](https://img.shields.io/badge/Python-3.13-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3+-646CFF.svg)](https://vitejs.dev/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0+-red.svg)](https://www.sqlalchemy.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

FinanceFlow is a production-ready, full-stack personal finance and expense management SaaS platform. It enables individuals to securely record income and expenses, organize transactions by category, set and monitor monthly budgets with visual threshold alerts, visualize cash flow trends with interactive charts, and maintain strict data isolation between accounts.

---

## 🌐 Live Production & Mobile Access Endpoints

- **Official GitHub Repository:** [https://github.com/Manasa120205/FinanceFlow-Expense-Management](https://github.com/Manasa120205/FinanceFlow-Expense-Management)
- **Production Backend API (HTTPS):** [https://financeflow-api.loca.lt](https://financeflow-api.loca.lt)
- **Interactive OpenAPI / Swagger Documentation:** [https://financeflow-api.loca.lt/docs](https://financeflow-api.loca.lt/docs)
- **Backend Health Check:** [https://financeflow-api.loca.lt/health](https://financeflow-api.loca.lt/health)
- **Live Production Web Application (Vercel):** [https://temporary-racing-krypton-rb9epsl.vercel.app](https://temporary-racing-krypton-rb9epsl.vercel.app)
- **Mobile Wi-Fi Local URL:** `http://192.168.1.189:5173` (connect phone to same Wi-Fi)
- **Local Dev URLs:** Frontend `http://localhost:5173` | Backend `http://127.0.0.1:8000`

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Features](#2-features)
3. [Tech Stack](#3-tech-stack)
4. [Architecture](#4-architecture)
5. [Folder Structure](#5-folder-structure)
6. [Database Design & Schema](#6-database-design--schema)
7. [Environment Variables](#7-environment-variables)
8. [Local Setup](#8-local-setup)
9. [Database Setup & Migrations](#9-database-setup--migrations)
10. [Starting Backend and Frontend](#10-starting-backend-and-frontend)
11. [Testing Suite](#11-testing-suite)
12. [Postman Collection Usage](#12-postman-collection-usage)
13. [Production Deployment (Docker & Cloud)](#13-production-deployment-docker--cloud)
14. [Security Best Practices](#14-security-best-practices)
15. [Known Limitations](#15-known-limitations)

---

## 1. Project Overview

FinanceFlow solves personal wealth management challenges by providing real-time visibility into earnings, spending, and budgets. Built entirely from scratch with a Python FastAPI backend and a React single-page application (SPA), every calculation (current balance, monthly cash flows, category percentages, budget progress) is performed deterministically at the database layer.

---

## 2. Features

- **Authentication & Security:**
  - Secure registration with email validation and real-time password strength checks.
  - Salted and hashed passwords using `bcrypt` (12 computational rounds).
  - Stateless JSON Web Token (JWT) authentication with automated client session expiration handling.
  - Strict user data isolation: all queries filter by `user_id == current_user.id`.
- **Transaction Management:**
  - Add, edit, and delete income and expense records with deletion confirmation dialogs.
  - Categorized under Salary, Freelance, Business, Investment, Food, Transport, Shopping, Bills, Rent, Healthcare, etc.
  - Server-side pagination, sorting (by date and amount), and multi-criteria filters (date range, type, category).
  - Keyword search across descriptions and categories.
- **Monthly Budget System:**
  - Set category spending limits per month and year (e.g., Food → ₹8,000, Transport → ₹3,000).
  - Real-time spending progress bars.
  - Proactive warning badge at **80% - 100%** utilization.
  - Highlighted alert when budget is **exceeded (> 100%)**.
  - Duplicate prevention: enforced unique constraints per category per month/year.
- **Financial Dashboard & Analytics:**
  - 5 summary metrics: Total Income, Total Expenses, Current Balance, Current Month Spending, Total Transactions.
  - 4 Interactive Recharts visualizations:
    - **Chart 1:** Income vs Expense cash flow (Bar chart).
    - **Chart 2:** Monthly Expenses Trend (Area chart).
    - **Chart 3:** Expense by Category (Donut / Pie chart with percentage breakdown).
    - **Chart 4:** Budget vs Actual Spending (Grouped Bar chart).
  - Helpful empty states when no data is recorded.
- **Localized Currency:**
  - Default Indian Rupee (₹) formatting adhering to the Indian numbering system (e.g. ₹1,500, ₹25,000, ₹1,25,000).
- **Responsive SaaS UI:**
  - Desktop sidebar + navbar, mobile drawer navigation.
  - Accessible form controls with inline error validation and keyboard escape listeners.
- **Profile Management:**
  - Displays user profile, email, account creation date, and enables updating display name.

---

## 3. Tech Stack

### Frontend
- **React 19** + **Vite 8** (fast compilation and Rolldown manual chunk splitting).
- **React Router v6** (client-side routing, protected routes).
- **Axios** (configured with request/response JWT interceptors).
- **Recharts** (interactive data visualization).
- **Lucide React** (accessible icon set).
- **Modern CSS3 Design System** (custom CSS variables, responsive grid, glassmorphism modal surfaces).

### Backend
- **Python 3.13** + **FastAPI** (asynchronous REST API framework).
- **SQLAlchemy 2.0** (declarative relational ORM).
- **Pydantic v2** & **Pydantic Settings** (strict request/response data validation).
- **Alembic** (database schema migrations).
- **PyJWT** & **Bcrypt** (cryptographic authentication and hashing).
- **Psycopg2-binary** (PostgreSQL driver).

### Database
- **PostgreSQL 16** (production target) with **SQLite** zero-setup fallback for local development and testing.

---

## 4. Architecture

```
                                  ┌───────────────────────────────┐
                                  │      Client Web Browser       │
                                  │   (Desktop / Tablet / Mobile) │
                                  └───────────────┬───────────────┘
                                                  │ HTTP (Port 5173 / 80)
                                                  ▼
                                  ┌───────────────────────────────┐
                                  │   Frontend: React 19 + Vite   │
                                  │  (Protected Routes, Context)  │
                                  └───────────────┬───────────────┘
                                                  │ REST API / Bearer JWT
                                                  ▼
                                  ┌───────────────────────────────┐
                                  │    Backend: FastAPI App       │
                                  │   (Routers, Schemas, CORS)    │
                                  └───────┬───────────────┬───────┘
                                          │               │
                             Auth / Guard │               │ SQL Queries
                                          ▼               ▼
                                   [JWT / Bcrypt]   [SQLAlchemy 2.0]
                                                          │
                                                          ▼
                                            ┌───────────────────────────┐
                                            │   PostgreSQL / SQLite     │
                                            │ (Users, Txs, Budgets DB)  │
                                            └───────────────────────────┘
```

---

## 5. Folder Structure

```
c:/Personal Finance and Expense Management/
├── .env.example                     # Environment template
├── .gitignore                       # Git ignore rules for Python, Node, Secrets
├── docker-compose.yml               # Production container orchestration
├── README.md                        # Documentation
├── postman/
│   └── FinanceFlow.postman_collection.json # Complete API testing collection
│
├── backend/
│   ├── Dockerfile                   # Production Python 3.13 slim container
│   ├── requirements.txt             # Backend Python dependencies
│   ├── pytest.ini                   # Pytest test discovery configuration
│   ├── alembic.ini                  # Alembic migration configuration
│   ├── alembic/
│   │   ├── env.py                   # Alembic migration environment
│   │   └── versions/
│   │       └── 001_initial_schema.py # Initial DB schema migration
│   ├── app/
│   │   ├── main.py                  # FastAPI app factory, CORS, lifespan
│   │   ├── core/
│   │   │   ├── config.py            # Environment settings and DB normalization
│   │   │   └── security.py          # Bcrypt hashing & JWT token creation/decoding
│   │   ├── db/
│   │   │   ├── base.py              # Base declarative model & TimestampMixin
│   │   │   └── session.py           # Engine & SessionLocal provider
│   │   ├── models/
│   │   │   ├── user.py              # User entity
│   │   │   ├── transaction.py       # Transaction entity
│   │   │   └── budget.py            # Budget entity
│   │   ├── schemas/
│   │   │   ├── user.py              # User & Token schemas
│   │   │   ├── transaction.py       # Transaction request/response schemas
│   │   │   ├── budget.py            # Budget progress & list schemas
│   │   │   └── dashboard.py         # Summary & Analytics schemas
│   │   └── api/
│   │       ├── deps.py              # DB & get_current_user dependencies
│   │       └── v1/
│   │           ├── auth.py          # /auth/register, /auth/login, /auth/me
│   │           ├── transactions.py  # /transactions CRUD, pagination, filters
│   │           ├── budgets.py       # /budgets CRUD, progress calculations
│   │           ├── dashboard.py     # /dashboard/summary, monthly, categories
│   │           └── profile.py       # /profile user name update
│   └── tests/
│       ├── conftest.py              # Test fixtures & isolated in-memory DB
│       ├── test_auth.py             # Auth & registration tests
│       ├── test_transactions.py     # Transaction CRUD, filters, search tests
│       ├── test_budgets.py          # Budget progress & threshold tests
│       ├── test_dashboard.py        # Financial aggregation tests
│       └── test_user_isolation.py   # Strict multi-user data isolation tests
│
└── frontend/
    ├── Dockerfile                   # Multi-stage production container build
    ├── nginx.conf                   # Production Nginx server & reverse proxy
    ├── package.json                 # Node dependencies & scripts
    ├── vite.config.js               # Vite config with Rolldown chunking & proxy
    ├── index.html                   # HTML5 shell & metadata
    ├── public/
    │   └── favicon.svg              # FinanceFlow wallet SVG icon
    └── src/
        ├── main.jsx                 # React root entrypoint with BrowserRouter
        ├── App.jsx                  # Route definitions & AuthProvider
        ├── index.css                # SaaS design system & responsive styling
        ├── api/
        │   └── client.js            # Axios client with JWT interceptors
        ├── context/
        │   └── AuthContext.jsx      # Global authentication provider
        ├── utils/
        │   ├── currency.js          # Indian Rupee (₹) & date formatters
        │   └── constants.js         # Predefined categories & palettes
        ├── components/
        │   ├── layout/
        │   │   ├── Navbar.jsx       # Header with user menu & mobile toggle
        │   │   ├── Sidebar.jsx      # Left navigation menu
        │   │   └── Layout.jsx       # Authenticated page shell
        │   └── common/
        │       ├── StatCard.jsx     # Financial metric cards
        │       ├── Modal.jsx        # Accessible dialog component
        │       ├── ConfirmDialog.jsx# Deletion confirmation dialog
        │       ├── EmptyState.jsx   # Helpful empty state callout
        │       ├── LoadingSpinner.jsx# Animated loading indicator
        │       └── ProtectedRoute.jsx# Route guard
        └── pages/
            ├── LandingPage.jsx      # Public landing experience
            ├── LoginPage.jsx        # User login form
            ├── RegisterPage.jsx     # User registration with password checklist
            ├── DashboardPage.jsx    # Primary financial overview & quick add
            ├── TransactionsPage.jsx # Paginated, filterable transaction table
            ├── BudgetsPage.jsx      # Monthly budgets with warning alerts
            ├── AnalyticsPage.jsx    # 4 interactive financial charts
            ├── ProfilePage.jsx      # User profile & security status
            └── NotFoundPage.jsx     # 404 page
```

---

## 6. Database Design & Schema

### Tables

1. **`users`**
   - `id` (INTEGER, Primary Key, Auto-increment)
   - `name` (VARCHAR(100), NOT NULL)
   - `email` (VARCHAR(255), UNIQUE, INDEX, NOT NULL)
   - `password_hash` (VARCHAR(255), NOT NULL)
   - `created_at` (TIMESTAMP WITH TIME ZONE, NOT NULL)
   - `updated_at` (TIMESTAMP WITH TIME ZONE, NOT NULL)

2. **`transactions`**
   - `id` (INTEGER, Primary Key, Auto-increment)
   - `user_id` (INTEGER, FOREIGN KEY -> `users.id` ON DELETE CASCADE, INDEX, NOT NULL)
   - `type` (VARCHAR(20), INDEX, NOT NULL) — values: `'income'` | `'expense'`
   - `amount` (FLOAT, NOT NULL, CHECK `amount > 0`)
   - `category` (VARCHAR(50), INDEX, NOT NULL)
   - `description` (VARCHAR(255), NULLABLE)
   - `transaction_date` (DATE, INDEX, NOT NULL)
   - `created_at` (TIMESTAMP WITH TIME ZONE, NOT NULL)
   - `updated_at` (TIMESTAMP WITH TIME ZONE, NOT NULL)
   - *Composite Indexes:* `(user_id, transaction_date)`, `(user_id, type)`, `(user_id, category)`

3. **`budgets`**
   - `id` (INTEGER, Primary Key, Auto-increment)
   - `user_id` (INTEGER, FOREIGN KEY -> `users.id` ON DELETE CASCADE, INDEX, NOT NULL)
   - `category` (VARCHAR(50), NOT NULL)
   - `amount` (FLOAT, NOT NULL, CHECK `amount > 0`)
   - `month` (INTEGER, NOT NULL) — values: 1 to 12
   - `year` (INTEGER, NOT NULL) — values: 2000 to 2100
   - `created_at` (TIMESTAMP WITH TIME ZONE, NOT NULL)
   - `updated_at` (TIMESTAMP WITH TIME ZONE, NOT NULL)
   - *Unique Constraint:* `(user_id, category, month, year)`
   - *Composite Index:* `(user_id, year, month)`

---

## 7. Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string (or SQLite for local) | `sqlite:///./financeflow.db` |
| `JWT_SECRET` | 32+ character cryptographic secret for signing JWTs | `replace_with_a_secure_random_key_in_production` |
| `JWT_ALGORITHM` | Algorithm for token signatures | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Expiration lifespan for access tokens | `1440` (24 hours) |
| `ENVIRONMENT` | Runtime mode (`development` or `production`) | `development` |
| `CORS_ORIGINS` | JSON list or comma-separated origins allowlist | `["http://localhost:5173","http://localhost:3000"]` |
| `VITE_API_URL` | Frontend API target endpoint URL | `http://localhost:8000/api/v1` |

---

## 8. Local Setup

### Prerequisites
- Python 3.10+ (Tested on Python 3.13)
- Node.js 18+ & npm 9+ (Tested on Node 22)
- Git

### Clone the Repository
```bash
git clone <repository_url>
cd "Personal Finance and Expense Management"
```

---

## 9. Database Setup & Migrations

FinanceFlow uses **Alembic** for schema migrations.

### Apply Migrations to Database
```bash
# From root directory:
./backend/.venv/Scripts/alembic -c backend/alembic.ini upgrade head

# Or on Linux/macOS:
source backend/.venv/bin/activate
alembic -c backend/alembic.ini upgrade head
```

### Create a New Migration (if modifying models)
```bash
alembic -c backend/alembic.ini revision --autogenerate -m "describe_changes"
```

---

## 10. Starting Backend and Frontend

### 1. Start the Backend API Server
```powershell
# Windows PowerShell:
.\backend\.venv\Scripts\python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload

# Linux/macOS Bash:
source backend/.venv/bin/activate
uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```
The backend is now live at:
- **API Base:** `http://127.0.0.1:8000`
- **Interactive Swagger Docs:** `http://127.0.0.1:8000/docs`
- **ReDoc Documentation:** `http://127.0.0.1:8000/redoc`
- **Healthcheck:** `http://127.0.0.1:8000/health`

### 2. Start the Frontend React Client
In a second terminal:
```bash
cd frontend
npm run dev
```
The frontend is now accessible at:
- **Web App URL:** `http://localhost:5173`

---

## 11. Testing Suite

### Running Backend Pytest Suite
FinanceFlow includes 22 automated tests covering authentication, transaction CRUD, pagination, multi-criteria filtering, budget progress math, dashboard analytics, and multi-user data isolation.

```powershell
# Windows PowerShell:
.\backend\.venv\Scripts\pytest -v backend/tests

# Linux/macOS Bash:
source backend/.venv/bin/activate
pytest -v backend/tests
```

**Test Results Summary:**
```
backend/tests/test_auth.py ................ [PASSED]
backend/tests/test_transactions.py ........ [PASSED]
backend/tests/test_budgets.py ............. [PASSED]
backend/tests/test_dashboard.py ........... [PASSED]
backend/tests/test_user_isolation.py ...... [PASSED]
======================= 22 passed in 9.04s =======================
```

### Running Full End-to-End User Journey Test
To simulate a real browser user journey from registration through transaction creation, editing, deletion, budget alerts, and data isolation verification:
```bash
.\backend\.venv\Scripts\python scratch/verify_e2e_journey.py
```

---

## 12. Postman Collection Usage

The collection file is located at:
`postman/FinanceFlow.postman_collection.json`

### How to Import & Use:
1. Open **Postman**.
2. Click **Import** in the top left corner.
3. Drag & drop or select `postman/FinanceFlow.postman_collection.json`.
4. In the collection settings, the `base_url` variable is pre-configured to `http://localhost:8000/api/v1`.
5. Run the **1. Authentication -> Login User** request. The test script will automatically capture the returned `access_token` and save it to the collection variable `token`.
6. All subsequent requests (Transactions, Budgets, Dashboard, Profile) automatically include `Bearer {{token}}`.

---

## 13. Production Deployment (Docker & Cloud)

### Deploying with Docker Compose (Recommended)

The provided `docker-compose.yml` orchestrates:
1. **db:** PostgreSQL 16 Alpine container with persistent health checks.
2. **backend:** Multi-stage Python 3.13 container running unprivileged.
3. **frontend:** Multi-stage Nginx Alpine container serving optimized static assets and reverse proxying `/api/` traffic.

```bash
# Build and run all services in production mode:
docker compose up --build -d

# Check running status:
docker compose ps

# View backend logs:
docker compose logs -f backend
```
The application will be live at `http://localhost` (Port 80) and database on Port 5432.

### Deploying on Cloud Providers (Render / Railway / Supabase)
1. **Database:** Create a PostgreSQL database on [Supabase](https://supabase.com/) or [Neon](https://neon.tech/) and copy the connection URI.
2. **Backend:** Deploy the `backend/` directory on [Render](https://render.com/) or [Railway](https://railway.app/).
   - Set environment variable `DATABASE_URL` to your PostgreSQL URI.
   - Set `JWT_SECRET` to a secure 32+ character hex string.
   - Set `CORS_ORIGINS` to your production frontend domain.
3. **Frontend:** Deploy the `frontend/` directory on [Vercel](https://vercel.com/) or [Netlify](https://netlify.com/).
   - Set `VITE_API_URL` to `https://your-backend.onrender.com/api/v1`.

---

## 14. Security Best Practices

- **Zero Plaintext Passwords:** Hashed with `bcrypt` using 12 computational rounds.
- **Resource Ownership Authorization:** Every single SQL query incorporates `user_id == current_user.id`. User B receives a 404 Not Found if attempting to query or modify User A's record.
- **CORS Protection:** Configurable origin allowlisting blocks unauthorized cross-origin requests.
- **Strict Input Validation:** Powered by Pydantic v2 schemas; rejects negative amounts, invalid emails, empty categories, and mismatched passwords.
- **No Secrets in Git:** `.gitignore` excludes `.env`, `*.db`, certificates, and secrets.

---

## 15. Known Limitations

- **Email Delivery:** Account registration validates email syntax and domain deliverability, but does not send transactional activation emails (token is issued immediately upon valid registration).
- **Currencies:** Indian Rupee (₹) is the default formatted currency; modular architecture in `frontend/src/utils/currency.js` allows adjusting locale and currency codes if multi-currency conversion is needed later.

---

*FinanceFlow — Built with precision, security, and modern full-stack best practices.*
