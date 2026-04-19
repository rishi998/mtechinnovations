# ClientEcomm Backend (NestJS)

REST API for the e-commerce client. Uses NestJS, TypeORM (SQLite), JWT auth, and role-based access.

## Setup

```bash
cd server
npm install
# Copy .env.example to .env and set JWT_SECRET
# Windows: copy .env.example .env
# Mac/Linux: cp .env.example .env
npm run start:dev
```

If `nest` is not found, run `npm install` from inside the `server` folder so that `node_modules` is fully installed, then run `npm run start:dev` again.

API base: **http://localhost:3001/api**

## API Overview

### 1. Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register (body: email, password, name, phone?) |
| POST | `/api/auth/login` | Login (body: email, password) → returns `user` + `accessToken` |
| GET | `/api/auth/profile` | Get current user (Header: `Authorization: Bearer <token>`) |

### 2. Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/products` | Create product (Admin only) |
| GET | `/api/products` | List all products |
| GET | `/api/products/:id` | Get product by ID |
| PATCH | `/api/products/:id` | Update product (Admin only) |
| DELETE | `/api/products/:id` | Delete product (Admin only) |

### 3. Cart

All cart endpoints require JWT.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart` | Get current cart |
| POST | `/api/cart/add` | Add item (body: productId, quantity?) |
| PATCH | `/api/cart/update` | Update quantity (body: productId, quantity) |
| DELETE | `/api/cart/remove/:productId` | Remove item |

### 4. Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Place order (body: shippingAddress, paymentMethod?, discount?) |
| GET | `/api/orders` | List my orders |
| GET | `/api/orders/:id` | Get order by ID (UUID) |
| PATCH | `/api/orders/:id/status` | Update status (Admin only) (body: status, trackingId?) |

### 5. Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/create` | Create payment (body: orderId = order UUID) |
| POST | `/api/payments/verify` | Verify payment (body: paymentId) → order status set to processing |

## Admin

- Create an admin user by setting `role: 'admin'` in the database for a user, or add a seed.
- Admin-only routes: POST/PATCH/DELETE products, PATCH orders/:id/status.

## Database

- **MongoDB** via Mongoose. Set `MONGODB_URI` in `.env` (default: `mongodb://localhost:27017/clientecomm`).
- Ensure MongoDB is running locally, or use a cloud instance (e.g. MongoDB Atlas) and set `MONGODB_URI` to your connection string.

## Scripts

- `npm run start:dev` – watch mode
- `npm run build` – build for production
- `npm run start:prod` – run built app
