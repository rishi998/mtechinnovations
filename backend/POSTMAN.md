# Testing the API with Postman

Base URL (when server runs locally): **`http://localhost:3001/api`**

---

## 1. Setup

1. **Start the server** (from `backend/`):
   ```bash
   npm run start:dev
   ```
   Ensure MongoDB is running and `MONGODB_URI` / `JWT_SECRET` are set in `.env`.

2. **Create a Postman collection** (optional):  
   File → New → Collection → name it e.g. "ClientEcomm API".

3. **Use a collection variable** (recommended):  
   In the collection, go to **Variables** and add:
   - `baseUrl` = `http://localhost:3001/api`
   - `token` = *(leave empty; set from Login response)*  

   In the collection request URL use: `{{baseUrl}}/...`  
   In **Authorization** for protected requests use: Bearer Token `{{token}}`.

---

## 2. Auth (no token required for register/login)

### Register

- **Method:** `POST`
- **URL:** `http://localhost:3001/api/auth/register`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "phone": "9876543210"
  }
  ```
  `phone` is optional.

- **Success:** You get `user` and `accessToken`. Copy `accessToken` for protected requests.

---

### Login

- **Method:** `POST`
- **URL:** `http://localhost:3001/api/auth/login`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "email": "test@example.com",
    "password": "password123"
  }
  ```

- **Success:** Copy `accessToken` from the response. In Postman, you can add a **Tests** script to save it:
  ```js
  if (pm.response.code === 201 || pm.response.code === 200) {
    const json = pm.response.json();
    if (json.accessToken) pm.collectionVariables.set('token', json.accessToken);
  }
  ```

---

### Get profile (requires JWT)

- **Method:** `GET`
- **URL:** `http://localhost:3001/api/auth/profile`
- **Headers:**
  - `Authorization: Bearer <your_access_token>`
  - or in Postman: Auth → Type: Bearer Token → Token: `{{token}}`

---

## 3. Products

### List all products (no auth)

- **Method:** `GET`
- **URL:** `http://localhost:3001/api/products`

---

### Get one product (no auth)

- **Method:** `GET`
- **URL:** `http://localhost:3001/api/products/:id`  
  Replace `:id` with a product’s MongoDB `_id` (e.g. from the list response).

---

### Create product (admin only)

- **Method:** `POST`
- **URL:** `http://localhost:3001/api/products`
- **Auth:** Bearer token of an **admin** user.
- **Body (raw JSON):**
  ```json
  {
    "name": "Arduino Uno",
    "slug": "arduino-uno",
    "category": "Development Boards",
    "subcategory": "Arduino",
    "price": 450,
    "brand": "Arduino",
    "description": "Classic Arduino board"
  }
  ```
  Optional: `sku`, `originalPrice`, `discount`, `images`, `rating`, `reviewsCount`, `stock`, `specs`, `tags`, `featured`, `trending`, `dealOfDay`, `isNewLaunch`.

---

### Update product (admin only)

- **Method:** `PATCH`
- **URL:** `http://localhost:3001/api/products/:id`
- **Auth:** Bearer token (admin).
- **Body (raw JSON):** Any subset of create-product fields, e.g. `{ "price": 420 }`.

---

### Delete product (admin only)

- **Method:** `DELETE`
- **URL:** `http://localhost:3001/api/products/:id`
- **Auth:** Bearer token (admin).

---

## 4. Cart (all require JWT)

Use the same Bearer token for all cart requests.

### Get cart

- **Method:** `GET`
- **URL:** `http://localhost:3001/api/cart`

---

### Add to cart

- **Method:** `POST`
- **URL:** `http://localhost:3001/api/cart/add`
- **Body (raw JSON):**
  ```json
  {
    "productId": "<MongoDB product _id>",
    "quantity": 2
  }
  ```
  Get `productId` from `GET /api/products` (use `_id` of a product).

---

### Update cart item quantity

- **Method:** `PATCH`
- **URL:** `http://localhost:3001/api/cart/update`
- **Body (raw JSON):**
  ```json
  {
    "productId": "<MongoDB product _id>",
    "quantity": 3
  }
  ```
  Use `quantity: 0` (or remove item) if your server supports it; otherwise use Remove.

---

### Remove item from cart

- **Method:** `DELETE`
- **URL:** `http://localhost:3001/api/cart/remove/:productId`  
  Replace `:productId` with the product’s MongoDB `_id`.

---

## 5. Orders (require JWT except where noted)

### Create order

- **Method:** `POST`
- **URL:** `http://localhost:3001/api/orders`
- **Auth:** Bearer token.
- **Body (raw JSON):**
  ```json
  {
    "shippingAddress": {
      "name": "Test User",
      "phone": "9876543210",
      "addressLine1": "123 Main Street",
      "addressLine2": "Apt 4",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001"
    },
    "paymentMethod": "card",
    "discount": 0
  }
  ```
  `addressLine2`, `paymentMethod`, and `discount` are optional.

---

### List my orders

- **Method:** `GET`
- **URL:** `http://localhost:3001/api/orders`

---

### Get one order

- **Method:** `GET`
- **URL:** `http://localhost:3001/api/orders/:id`  
  Use the order’s MongoDB `_id` (from the list response).

---

### Update order status (admin only)

- **Method:** `PATCH`
- **URL:** `http://localhost:3001/api/orders/:id/status`
- **Auth:** Bearer token (admin).
- **Body (raw JSON):**
  ```json
  {
    "status": "shipped",
    "trackingId": "TRK123456"
  }
  ```
  `status` must be one of: `pending`, `processing`, `shipped`, `delivered`, `cancelled`.  
  `trackingId` is optional.

---

## 6. Payments (require JWT)

### Create payment

- **Method:** `POST`
- **URL:** `http://localhost:3001/api/payments/create`
- **Body (raw JSON):**
  ```json
  {
    "orderId": "<order MongoDB _id>"
  }
  ```

---

### Verify payment

- **Method:** `POST`
- **URL:** `http://localhost:3001/api/payments/verify`
- **Body (raw JSON):**
  ```json
  {
    "paymentId": "<paymentId from create response>"
  }
  ```

---

## 7. Suggested test flow

1. **Register** → `POST /api/auth/register` → copy `accessToken`.
2. **Login** → `POST /api/auth/login` → set `token` in collection (or paste in Auth).
3. **Profile** → `GET /api/auth/profile` with Bearer `token`.
4. **Products** → `GET /api/products` → copy a product `_id`.
5. **Cart** → `POST /api/cart/add` with that `productId` → `GET /api/cart` to confirm.
6. **Order** → `POST /api/orders` with a shipping address and `paymentMethod`.
7. **My orders** → `GET /api/orders` → copy an order `_id`.
8. **Order detail** → `GET /api/orders/:id` with that `_id`.

For **admin** product/order-status actions, ensure the user’s `role` is `admin` in the database (or create a user and set `role: 'admin'` in MongoDB).

---

## 8. Common issues

| Issue | Check |
|-------|--------|
| 401 Unauthorized | Valid Bearer token in **Authorization** header. |
| 403 Forbidden | User has required role (e.g. admin for products create/update/delete, order status). |
| 404 Not Found | Correct base URL (`/api` prefix), correct path and `:id` / `:productId`. |
| 400 Bad Request | Body is valid JSON and matches DTOs (required fields, types). |
| Product not found on add to cart | Use product’s MongoDB `_id` from `GET /api/products`. |
| Empty cart after login | Cart is per user on server; use same user token for cart and orders. |

---

## 9. Quick reference

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/api/auth/register` | No |
| POST | `/api/auth/login` | No |
| GET | `/api/auth/profile` | JWT |
| GET | `/api/products` | No |
| GET | `/api/products/:id` | No |
| POST | `/api/products` | Admin |
| PATCH | `/api/products/:id` | Admin |
| DELETE | `/api/products/:id` | Admin |
| GET | `/api/cart` | JWT |
| POST | `/api/cart/add` | JWT |
| PATCH | `/api/cart/update` | JWT |
| DELETE | `/api/cart/remove/:productId` | JWT |
| POST | `/api/orders` | JWT |
| GET | `/api/orders` | JWT |
| GET | `/api/orders/:id` | JWT |
| PATCH | `/api/orders/:id/status` | Admin |
| POST | `/api/payments/create` | JWT |
| POST | `/api/payments/verify` | JWT |
