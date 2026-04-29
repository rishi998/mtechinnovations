# ClientEcomm

Production-oriented monorepo: **Next.js** storefront (`frontend/`) and **NestJS** API (`backend/`).

## Prerequisites

- Node.js 20.x (matches Render’s default Node images)
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- Optional: Razorpay / Zoho credentials (see `backend/.env.example`)

## Local development

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set MONGODB_URI, JWT_SECRET, and optionally CORS_ORIGIN (e.g. http://localhost:3000)
npm install
npm run start:dev
```

API base URL: `http://localhost:3001/api` (port from `PORT` in `.env`, default `3001`).

### Frontend

```bash
cd frontend
cp .env.local.example .env.local
# NEXT_PUBLIC_API_URL should match the API (e.g. http://localhost:3001/api)
npm install
npm run dev
```

Open `http://localhost:3000`.

### Root shortcuts (optional)

Install dependencies once in `backend/` and `frontend/` (`npm install` in each). From the repo root you can use the convenience scripts in the root `package.json`:

```bash
npm run dev:backend    # Nest watch mode
npm run dev:frontend   # Next dev
```

## Production builds

**Backend**

```bash
cd backend
npm install
npm run build
npm run start:prod
```

**Frontend**

Set `NEXT_PUBLIC_API_URL` to your deployed API origin including `/api` (no trailing slash after `/api`). For a local production build:

```bash
cd frontend
cp .env.production.example .env.production
# Edit .env.production with your API URL
npm install
npm run build
npm start
```

**Static export (optional, e.g. Hostinger)**

If you deploy only static files (`out/`), set `NEXT_STATIC_EXPORT=true` before `npm run build`. See `frontend/DEPLOYMENT_HOSTINGER.md` (paths use `frontend/` instead of `client/`).

**Hostinger VPS (git pull, PM2, Nginx)** — step-by-step after each code change: [`DEPLOY_HOSTINGER.md`](./DEPLOY_HOSTINGER.md).

## Deploy on Render

1. Push this repo to GitHub/GitLab/Bitbucket.
2. In Render: **New** → **Blueprint** → select the repo and `render.yaml`.
3. Set **sync** / secret environment variables in the dashboard when prompted:
   - **Backend:** `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN` (your frontend origin, e.g. `https://clientecomm-frontend.onrender.com`). Render injects `PORT` automatically — do not override it.
   - **Frontend:** `NEXT_PUBLIC_API_URL` = `https://<your-backend-service>.onrender.com/api` (use the real backend URL after the first deploy).
4. Redeploy the frontend after `NEXT_PUBLIC_API_URL` is set so the client bundle points at the API.

Health check (backend): `GET /api/health` → `{ "status": "ok" }`.

## Project layout

| Path        | Description        |
| ----------- | ------------------ |
| `backend/`  | NestJS API         |
| `frontend/` | Next.js App Router |
| `render.yaml` | Render Blueprint |

## Security notes

- API uses **helmet**, **compression**, **CORS** (`CORS_ORIGIN`), **ValidationPipe** (class-validator), and a **global exception filter**.
- Never commit `.env` files; use `.env.example` / `.env.*.example` as templates.
