# Deploy to Hostinger (VPS) after code changes

Use this checklist whenever you **change frontend or backend** and need production on **Hostinger VPS** (`mtechinnovations.in`) to run the new code.

**Assumptions**

- Code lives in **GitHub**; the server has a **clone** of the repo (example path: `/var/www/myapp/mtechinnovations`).
- **Nest** runs with **PM2**; the public API is served at **`https://mtechinnovations.in/api`** via **Nginx** → Node.
- **Secrets** live only in **`backend/.env`** and **`frontend/.env.production`** on the server — **never commit** them.

Adjust paths, branch name (`main` vs `master`), and PM2 process names if yours differ.

---

## 1. On your machine: push to GitHub

1. Commit and push your changes to the branch the server tracks (usually `main`).
2. Ensure fixes needed for production are included (e.g. backend must start cleanly — watch PM2 logs for crashes).

---

## 2. On the VPS: open a shell and go to the repo

```bash
ssh root@YOUR_SERVER_IP
cd /var/www/myapp/mtechinnovations
git fetch origin
git pull origin main
```

If you use SSH deploy keys or a token, ensure `git pull` succeeds before continuing.

---

## 3. If you changed the **backend** (NestJS)

From the repo root:

```bash
cd backend
npm ci
npm run build
pm2 restart backend
pm2 logs backend --lines 40
```

**Check**

- Logs show **`HTTP server listening on port …`** and **no** repeating crashes (e.g. `ReferenceError: crypto is not defined`).
- Replace `<PORT>` with the value in **`backend/.env`** (`PORT=…`, default `3001`):

```bash
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:<PORT>/api/products
```

Expect **`200`** and JSON when Mongo and routes are healthy.

**If you only edited `backend/.env`** (no code change):

```bash
cd /var/www/myapp/mtechinnovations/backend
pm2 restart backend
```

Nest reads env at process start; **restart** is required.

**Nginx** must **`proxy_pass`** to the **same** host and **PORT** Nest uses. If you change `PORT`, update Nginx and `sudo nginx -t && sudo systemctl reload nginx`.

---

## 4. If you changed the **frontend** (Next.js)

`NEXT_PUBLIC_*` variables are **baked in at build time**. Set them **before** `npm run build`.

On the server:

```bash
cd /var/www/myapp/mtechinnovations/frontend
```

Ensure **`frontend/.env.production`** exists and includes (example):

```env
NEXT_PUBLIC_API_URL=https://mtechinnovations.in/api
```

If the site is under a subpath, set `NEXT_PUBLIC_BASE_PATH` per `frontend/next.config.mjs` and rebuild.

### Option A — Static export (typical for `public_html`)

```bash
export NEXT_STATIC_EXPORT=true
npm ci
npm run build
```

Upload or sync the **`frontend/out/`** folder to the web root (e.g. `public_html`), preserving **`_next/`** next to `index.html`. Do not omit **`out/_next`**.

### Option B — `next start` on the VPS

Do **not** set `NEXT_STATIC_EXPORT`. After build, run Next with PM2 (separate process from backend), and point Nginx at that listener. (Use this only if you already use that pattern.)

### After deploy

Hard-refresh the site; in DevTools → Network, product requests must go to **`https://mtechinnovations.in/api/...`** (HTTPS), not `http://` or a raw IP.

---

## 5. If you changed **both** frontend and backend

1. Pull once: **Section 2**.
2. **Backend:** **Section 3**.
3. **Frontend:** **Section 4**.

---

## 6. Quick production verification

| Check | Command or action |
|--------|-------------------|
| API from internet | Open `https://mtechinnovations.in/api/products` → JSON array |
| API from server | `curl -sS http://127.0.0.1:<PORT>/api/products` → `200` |
| Nginx | `sudo nginx -t`; fix **502** by aligning upstream port and ensuring Nest is running |
| PM2 | `pm2 status` — backend (and frontend, if used) **online** |
| Storefront | Homepage loads products without mixed-content or CORS errors |

---

## 7. Common issues

| Symptom | What to do |
|--------|------------|
| **502 Bad Gateway** | Nest process down or Nginx `proxy_pass` port ≠ Nest `PORT`. Check `pm2 logs`, `ss -tlnp \| grep node`. |
| **Products empty / fetch blocked** | Rebuild frontend with correct **`NEXT_PUBLIC_API_URL`** (HTTPS + `/api`). |
| **CORS errors** | Set **`CORS_ORIGIN`** in `backend/.env` to your real site origin(s); restart backend. |
| **Schedule / `crypto` crash on Node 18** | Use current `main.ts` with `./crypto-global` import, rebuild backend, or use Node 20+. |

---

## 8. What not to do

- Do **not** commit **`.env`**, **`.env.production`**, or **`.env.local`** with real secrets.
- Do **not** skip **`npm run build`** after backend TS changes — PM2 must run **`dist/main.js`** from a fresh build.
- Do **not** change **only** the frontend on users’ browsers without rebuilding — old bundles keep the old API URL until you deploy a new **`out/`** or restart **`next start`**.

---

*Last updated to match this repo’s Nest global prefix `api`, PM2 workflow, and optional Next static export.*
