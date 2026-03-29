# Smart ExpenseFlow — Reimbursement Management System

Full-stack reimbursement app: **React (Vite) + Tailwind + Framer Motion** frontend, **Express + MongoDB + Mongoose** backend, JWT auth, configurable approval workflows, conditional rules engine, OCR (Tesseract.js), FX conversion, and Socket.io notifications.

## Prerequisites

- Node.js 20+
- MongoDB Atlas URI (or local MongoDB)
- Optional: [ExchangeRate API](https://www.exchangerate-api.com/) key for live currency conversion (without it, amounts are stored with a 1:1 fallback note on the server)

## Quick start

### 1. Backend

```bash
cd server
cp .env.example .env
# Edit .env: set MONGODB_URI, JWT_SECRET, and optionally EXCHANGE_RATE_API_KEY
npm install
npm run dev
```

API listens on `http://localhost:5000` by default.

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api`, `/uploads`, and `/socket.io` to the backend.

### 3. First user

Use **Sign up** to create a company. The first user becomes **Admin**; company default currency is taken from the selected country via REST Countries.

Then (as Admin):

1. **Settings** — confirm company name and default currency.
2. **Users** — add **Managers** and **Employees**; set **Reports to** for employees.
3. **Workflow** — add sequential steps (Manager → specific users for Finance/Director, etc.).
4. **Rules** (optional) — percentage threshold, designated approver (e.g. CFO), or hybrid OR/AND.

Employees submit expenses (any ISO currency); amounts are converted to the company default currency when an ExchangeRate API key is set.

## Environment variables

### `server/.env`

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `development` or `production` |
| `PORT` | API port (default `5000`) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | e.g. `7d` |
| `CLIENT_URL` | CORS origin (e.g. `http://localhost:5173`) |
| `EXCHANGE_RATE_API_KEY` | Optional; v6 ExchangeRate API key |
| `UPLOAD_DIR` | Upload root (default `uploads`) |

### `client/.env` (optional)

Only needed if you do **not** use the Vite proxy (e.g. deployed separately). You can set `VITE_API_URL` and point `axios` base URL there (not wired by default; production often uses same-origin nginx proxy).

## Project structure

- `client/` — Vite React app, Tailwind v4, Framer Motion, react-hot-toast, Socket.io client
- `server/src/` — MVC-style layout:
  - `models/` — User, Company, Expense, ApprovalFlow, ApprovalLog, Rule
  - `routes/`, `controllers/`, `services/`
  - `middleware/` — auth, error handler
  - `errors/` — operational errors + centralized handler

## API highlights

- `POST /api/auth/signup` | `POST /api/auth/login` | `GET /api/auth/me`
- `GET /api/meta/countries` — country + currency (REST Countries)
- `GET|PATCH /api/company`
- `GET|PUT /api/approval-flow`
- `CRUD /api/rules`
- `GET|POST /api/users` (admin)
- `POST /api/expenses` (multipart: receipt + fields)
- `POST /api/expenses/ocr-preview` — OCR preview
- `GET /api/expenses/pending` — items where **you** are the current approver
- `POST /api/expenses/:id/act` — approve / reject
- `POST /api/expenses/:id/override` — admin override
- `GET /api/expenses/:id/logs` — approval audit trail

## Security notes

- Passwords hashed with bcrypt.
- JWT on `Authorization: Bearer`.
- Joi validation on inputs; Helmet + rate limiting on API.
- Production error responses avoid leaking stack traces (see `errorHandler`).

## License

MIT (sample project).
