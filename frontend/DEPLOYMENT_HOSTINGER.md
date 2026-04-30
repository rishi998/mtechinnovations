# Deploy to Hostinger – Build & Upload Guide

This guide explains how to build the **`out`** folder (static export) and deploy it on **Hostinger** shared hosting.

---

## White page / no CSS / everything looks like plain HTML?

The static site loads CSS and JavaScript from paths such as **`/nx/static/...`** after our default Hostinger build. That only works if:

1. **You open the site over HTTP(S), not as a file.**  
   Do **not** double‑click `index.html` (that uses the `file://` protocol). The browser will look for asset URLs at the wrong place and **no styles will load**.  
   - **Local check after `npm run build`:** from the `frontend` folder run `npm run preview` and open **http://localhost:3000** (serves the `out` folder).

2. **The site lives in a subfolder** (e.g. `yoursite.com/store/`).  
   You must set **`NEXT_PUBLIC_BASE_PATH`** to that folder **before** `npm run build`, then upload the new `out` (see “Subfolder” below). Example: `NEXT_PUBLIC_BASE_PATH=/store` (no trailing slash). Assets load from **`/store/nx/...`** on Hostinger builds.

3. **Static assets were uploaded.** After build you should have **`nx/`** next to **`index.html`** — upload both. If you mix old **`_next`** files with new HTML (or vice versa), routes like **checkout** may throw **ChunkLoadError**. Delete **`public_html/_next`** when switching to **`nx`**.

---

## Prerequisites

- **Node.js** (v18 or v20) installed on your computer  
  - Check: `node -v`
- **npm** (comes with Node)  
  - Check: `npm -v`
- A Hostinger account and access to **File Manager** or **FTP**

---

## Step 1: Build the `out` folder locally

From your project root, go to the `frontend` folder and run:

```bash
cd frontend
npm install
export NEXT_STATIC_EXPORT=true   # Linux/macOS — PowerShell: $env:NEXT_STATIC_EXPORT="true"
npm run build
```

- **`npm install`** – installs dependencies (only needed when you haven’t run it yet or after pulling changes).
- **`npm run build`** – runs `next build`, then writes **`out/_next/.htaccess`**, then **renames `_next` → `nx`** and rewrites paths for Hostinger (see Step 2). Set **`NEXT_STATIC_EXPORT=true`** so `next.config.mjs` outputs **`out/`**.

To **skip** the rename (keep **`_next`** — only if your host serves `/_next/` without 400):

`HOSTINGER_PATCH_EXPORT=false npm run build` (with **`NEXT_STATIC_EXPORT=true`** as usual).

When the build finishes, you should see:

- **`frontend/out/`** – this folder contains the full static site (HTML, JS, CSS, images).

Everything you need to deploy is inside **`frontend/out/`**.

---

## Step 2: What’s in the `out` folder

Typical structure **after** `NEXT_STATIC_EXPORT=true` and **`npm run build`** (Hostinger default):

```
out/
├── nx/             ← JS, CSS, chunks (renamed from _next for Hostinger)
├── 404.html
├── index.html
├── checkout/
│   └── index.html
├── cart/
│   └── index.html
├── track/
│   └── index.html
├── product/
├── images/
├── .htaccess
└── ...
```

- On Hostinger builds, references point to **`/nx/static/...`** (not **`/_next/`**), which avoids **400 Bad Request** on many LiteSpeed setups.
- Do **not** mix uploads: if you previously deployed **`_next`**, delete **`public_html/_next`** after switching to **`nx`**, then upload the full new **`out/`** contents.
- To keep the original **`_next`** folder name: set **`HOSTINGER_PATCH_EXPORT=false`** before **`npm run build`** (only if your server handles **`/_next/`** correctly).

---

## Step 3: Upload to Hostinger

### Option A: File Manager (recommended)

1. Log in to **Hostinger** → **hPanel**.
2. Open **Files** → **File Manager**.
3. Go to **`public_html`** (this is the web root for your domain).
4. **Optional:** Clear old site files in `public_html` (or use a subfolder; see below).
5. Upload the **contents** of **`frontend/out/`** into `public_html`:
   - Upload **all files and folders** inside `out/` (e.g. **`nx`**, `index.html`, `404.html`, `checkout`, `cart`, `track`, `product`, `images`, `.htaccess`, etc.).
   - Do **not** upload the `out` folder itself; upload what’s **inside** `out/`.

Result:

- `public_html/index.html` → homepage  
- `public_html/checkout/index.html` → checkout  
- `public_html/nx/` → JS/CSS chunks (**delete old `_next` if it still exists from a previous deploy**)

### Option B: FTP

1. Connect with an FTP frontend (FileZilla, WinSCP, etc.) using the Hostinger FTP details.
2. Go to the remote **`public_html`** (or the folder that points to your domain).
3. Upload the **contents** of **`frontend/out/`** into `public_html` (same as above: all files and folders inside `out/`, not the `out` folder itself).

---

## Step 4: Subfolder or subdomain (optional)

- **Subfolder (e.g. `yoursite.com/store/`):**  
  Upload the contents of `out/` into e.g. **`public_html/store/`**.  
  Before **`npm run build`**, set the base path (PowerShell example):  
  `$env:NEXT_PUBLIC_BASE_PATH="/store"; npm run build`  
  Or on macOS/Linux: `NEXT_PUBLIC_BASE_PATH=/store npm run build`  
  Use the folder name only (leading slash, **no** trailing slash). Assets load from **`/store/nx/...`** after our default Hostinger post-build step. Then upload the new `out/` into `public_html/store/`.

- **Subdomain (e.g. `shop.yoursite.com`):**  
  In Hostinger, point the subdomain’s document root to a folder (e.g. `public_html/shop`). Upload the contents of `out/` there. No `basePath` needed if the subdomain root is that folder.

---

## Step 5: Verify

1. Open your domain (e.g. `https://yourdomain.com`).
2. Check:
   - Homepage loads.
   - Navigation works (e.g. Track Order, Cart, a product page).
   - Direct URL works: `https://yourdomain.com/track/`.
   - Non-existent URL shows your 404 page (thanks to `ErrorDocument 404 /404.html` in `.htaccess`).

---

## Quick reference: build and paths

| Task              | Command / path                          |
|-------------------|------------------------------------------|
| Install deps      | `cd frontend && npm install`              |
| Build static site | **`npm run build:static`** (recommended — sets `NEXT_STATIC_EXPORT` for you), or `NEXT_STATIC_EXPORT=true npm run build` |
| Build output      | **`frontend/out/`** — assets under **`nx/`** by default (Hostinger) |
| Upload target     | **Contents of `out/`** → **`public_html/`** — remove stale **`_next`** if upgrading |

---

## Troubleshooting

- **`ChunkLoadError` / “Application error” on `/checkout/` (or other routes)**  
  Console shows **`/_next/static/...` → 400**: the live HTML does not match deployed chunks, or Hostinger blocks **`_next`**. Rebuild with **`NEXT_STATIC_EXPORT=true`**, run **`npm run build`** (default renames **`_next` → `nx`**), then upload **all** of **`out/`**. In File Manager **delete** leftover **`public_html/_next`** so only **`nx`** serves chunks.

- **`/_next/static/...` → 400 Bad Request**  
  Same fix: use the default Hostinger build (**`nx`**). Opt out only with **`HOSTINGER_PATCH_EXPORT=false`** if your host serves **`/_next/`** correctly.

- **Blank or broken page**
  - Ensure **all** of `out/` was uploaded (especially **`nx/`** and `index.html`).
  - Check browser console (F12) for 404s; fix paths or re-upload missing files.

- **404 for every route**
  - Make sure you’re uploading **contents** of `out/` into the **root** of `public_html` (or the subdomain root), not into an extra `out` folder.
  - Ensure **`.htaccess`** is present in `public_html` (it’s copied from `public/.htaccess` during build).

- **Images or logo missing**
  - Confirm `public/images/` (e.g. logo) is in `public` before build; it will be in `out/images/` after build. Upload `out/images/` to `public_html/images/`.

- **Build fails**
  - Run `cd frontend && rm -rf .next out && npm run build` (on Windows: delete `.next` and `out` manually, then `npm run build`).
  - Ensure Node is v18+ and all dependencies are installed (`npm install`).

---

## One-line build (from repo root)

From the **project root** (parent of `frontend`):

```bash
cd frontend && npm install && NEXT_STATIC_EXPORT=true npm run build
```

Then upload the **contents** of **`frontend/out/`** to Hostinger **`public_html`**.
