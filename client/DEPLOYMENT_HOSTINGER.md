# Deploy to Hostinger – Build & Upload Guide

This guide explains how to build the **`out`** folder (static export) and deploy it on **Hostinger** shared hosting.

---

## Prerequisites

- **Node.js** (v18 or v20) installed on your computer  
  - Check: `node -v`
- **npm** (comes with Node)  
  - Check: `npm -v`
- A Hostinger account and access to **File Manager** or **FTP**

---

## Step 1: Build the `out` folder locally

From your project root, go to the `client` folder and run:

```bash
cd client
npm install
npm run build
```

- **`npm install`** – installs dependencies (only needed when you haven’t run it yet or after pulling changes).
- **`npm run build`** – runs `next build`. With `output: 'export'` in `next.config.mjs`, Next.js generates a **static export** into the **`out`** folder.

When the build finishes, you should see:

- **`client/out/`** – this folder contains the full static site (HTML, JS, CSS, images).

Everything you need to deploy is inside **`client/out/`**.

---

## Step 2: What’s in the `out` folder

Typical structure:

```
out/
├── _next/          ← JS, CSS, chunks (do not rename)
├── 404.html        ← Not-found page
├── index.html      ← Homepage
├── track/
│   └── index.html
├── cart/
│   └── index.html
├── product/
│   └── [slug]/
│       └── index.html
├── images/         ← From public/ (e.g. logo)
├── .htaccess       ← From public/ (Apache / Hostinger)
└── ... (one folder per route, each with index.html)
```

- **Do not** change the structure or rename `_next`.
- The **`.htaccess`** in `public/` is copied to `out/` during build so Hostinger (Apache) can use it for 404 handling.

---

## Step 3: Upload to Hostinger

### Option A: File Manager (recommended)

1. Log in to **Hostinger** → **hPanel**.
2. Open **Files** → **File Manager**.
3. Go to **`public_html`** (this is the web root for your domain).
4. **Optional:** Clear old site files in `public_html` (or use a subfolder; see below).
5. Upload the **contents** of **`client/out/`** into `public_html`:
   - Upload **all files and folders** inside `out/` (e.g. `_next`, `index.html`, `404.html`, `track`, `cart`, `product`, `images`, `.htaccess`, etc.).
   - Do **not** upload the `out` folder itself; upload what’s **inside** `out/`.

Result:

- `public_html/index.html` → homepage  
- `public_html/track/index.html` → track page  
- `public_html/_next/` → assets  
- `public_html/404.html` → 404 page  

### Option B: FTP

1. Connect with an FTP client (FileZilla, WinSCP, etc.) using the Hostinger FTP details.
2. Go to the remote **`public_html`** (or the folder that points to your domain).
3. Upload the **contents** of **`client/out/`** into `public_html` (same as above: all files and folders inside `out/`, not the `out` folder itself).

---

## Step 4: Subfolder or subdomain (optional)

- **Subfolder (e.g. `yoursite.com/store/`):**  
  Upload the contents of `out/` into e.g. **`public_html/store/`**.  
  You must set **`basePath: '/store'`** in `next.config.mjs` and **rebuild** so links and assets use `/store/`. Then upload the new `out/` contents into `public_html/store/`.

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
| Install deps      | `cd client && npm install`              |
| Build static site | `cd client && npm run build`            |
| Build output      | **`client/out/`**                       |
| Upload target     | **Contents of `out/`** → `public_html/` |

---

## Troubleshooting

- **Blank or broken page**
  - Ensure **all** of `out/` was uploaded (especially `_next/` and `index.html`).
  - Check browser console (F12) for 404s; fix paths or re-upload missing files.

- **404 for every route**
  - Make sure you’re uploading **contents** of `out/` into the **root** of `public_html` (or the subdomain root), not into an extra `out` folder.
  - Ensure **`.htaccess`** is present in `public_html` (it’s copied from `public/.htaccess` during build).

- **Images or logo missing**
  - Confirm `public/images/` (e.g. logo) is in `public` before build; it will be in `out/images/` after build. Upload `out/images/` to `public_html/images/`.

- **Build fails**
  - Run `cd client && rm -rf .next out && npm run build` (on Windows: delete `.next` and `out` manually, then `npm run build`).
  - Ensure Node is v18+ and all dependencies are installed (`npm install`).

---

## One-line build (from repo root)

From the **project root** (parent of `client`):

```bash
cd client && npm install && npm run build
```

Then upload the **contents** of **`client/out/`** to Hostinger **`public_html`**.
