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

### Option A — Static export (typical for `public_html` / LiteSpeed)

Preferred:

```bash
npm ci
npm run build:static
```

(`build:static` sets `NEXT_STATIC_EXPORT=true` and runs the Hostinger patch: **`out/_next` → `out/nx`** and rewrites asset URLs to **`/nx/`**, which avoids **400 Bad Request** on many Hostinger/LiteSpeed setups that dislike `/_next/`.)

Upload **everything inside** **`frontend/out/`** (including **`nx/`**, not `_next`). If an old **`_next`** folder exists on the server from a previous deploy, **delete it** so you do not mix `nx` HTML with stale `_next` chunks.

To keep **`/_next/`** paths (only if your host serves them without 400):  
`HOSTINGER_PATCH_EXPORT=false npm run build:static`

### Option B — `next start` on the VPS

Do **not** set `NEXT_STATIC_EXPORT`. Use **`npm run build`** (not `build:static`), run Next with PM2 on port **3000**, and point Nginx **`/`** at that upstream. The browser will correctly request **`/_next/static/...`** from Node.

### After deploy

Hard-refresh the site; in DevTools → Network, product requests must go to **`https://mtechinnovations.in/api/...`** (HTTPS), not `http://` or a raw IP.

---

### `/_next/static/...` → **400** in the browser (common causes)

| Setup | What it usually means | What to do |
|--------|------------------------|------------|
| **Static `out/` on Hostinger** | LiteSpeed/WAF blocks **`/_next/`**, or HTML/chunks mismatch | Use **`npm run build:static`** (default **`nx`** paths). Upload full **`out/`**. Remove **`public_html/_next`** if present. Hard refresh / incognito. |
| **VPS + `next start` + Nginx proxy** | Edge WAF (Cloudflare, Imunify, ModSecurity) or odd Nginx rules rejecting `/_next/` | From the server: `curl -I http://127.0.0.1:3000/_next/static/...` (paste one failing URL path). If **200** locally but **400** on the domain, fix/disable rules on the CDN/WAF or add an explicit Nginx `location ^~ /_next/` → same upstream as `/`. If **400** even on localhost, wipe **`frontend/.next`**, **`npm run build`**, restart PM2 `frontend`. |

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
