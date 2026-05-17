# LuxStore Backend

## Setup

1. Install dependencies:
```
npm install
```

2. Create your `.env` file (copy from `.env.example`):
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/luxstore
JWT_SECRET=your_long_secret_here
SUPER_ADMIN_EMAIL=superadmin@luxstore.com
SUPER_ADMIN_PASSWORD=SuperAdmin123
```

3. Seed the superadmin:
```
npm run seed
```

4. Start the server:
```
npm run dev
```

---

## API Endpoints

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me                  (protected)
GET    /api/auth/users               (admin, superadmin)
PUT    /api/auth/users/:id/role      (superadmin only)
```

### Products
```
GET    /api/products                 (protected)
GET    /api/products/search?q=term   (protected)
POST   /api/products                 (admin, superadmin)
PUT    /api/products/:id             (admin who created it, superadmin)
DELETE /api/products/:id             (admin who created it, superadmin)
```

### Cart
```
GET    /api/cart                     (protected)
POST   /api/cart                     (protected)
PUT    /api/cart/:itemId             (protected)
DELETE /api/cart                     (protected)
DELETE /api/cart/:itemId             (protected)
```

### Orders
```
POST   /api/orders/checkout          (protected)
GET    /api/orders/my-orders         (protected)
GET    /api/orders                   (admin, superadmin)
GET    /api/orders/:id               (protected)
PUT    /api/orders/:id/status        (admin, superadmin)
```

---

## Roles
- **user** — browse, cart, checkout, view own orders
- **admin** — manage own products, view/update all orders, view all users
- **superadmin** — everything + change user roles
