# 🌹 Aurelia Parfums — Backend API

## Quick Setup (5 steps)

### Step 1 — Node.js install karo
```
Node.js v18+ download: https://nodejs.org
```

### Step 2 — Dependencies install karo
```bash
cd aurelia-backend
npm install
```

### Step 3 — .env file banao
```bash
cp .env.example .env
```
Then `.env` file mein apni values bharo:

| Variable | Kahan se milega |
|---|---|
| `MONGO_URI` | https://cloud.mongodb.com → Create cluster → Connect |
| `CLOUDINARY_*` | https://cloudinary.com/console |
| `JWT_SECRET` | Koi bhi random 32+ character string |

### Step 4 — MongoDB Atlas Setup
1. mongodb.com pe free account banao
2. New Project → New Cluster (free tier M0 choose karo)
3. Database Access → Add User (username/password note karo)
4. Network Access → Allow from anywhere (0.0.0.0/0)
5. Connect → Drivers → Copy connection string → .env mein paste karo

### Step 5 — Server chalao
```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

---

## API Endpoints

### Auth
| Method | URL | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | New account banao |
| POST | `/api/v1/auth/login` | Login |
| GET  | `/api/v1/auth/me` | Apni info dekho (JWT required) |

### Products
| Method | URL | Description |
|---|---|---|
| GET  | `/api/v1/products` | Sab products |
| GET  | `/api/v1/products?category=Attar` | Filter by category |
| GET  | `/api/v1/products?featured=true` | Featured only |
| GET  | `/api/v1/products/:id` | Single product |
| POST | `/api/v1/products` | Add product (admin) |
| PUT  | `/api/v1/products/:id` | Update (admin) |
| DELETE | `/api/v1/products/:id` | Delete (admin) |

### Orders
| Method | URL | Description |
|---|---|---|
| POST | `/api/v1/orders` | Order place karo |
| GET  | `/api/v1/orders/my` | Apne orders (JWT) |
| GET  | `/api/v1/orders/track/:orderId` | Track by order ID |
| POST | `/api/v1/orders/:id/payment-screenshot` | Screenshot upload |

### Admin
| Method | URL | Description |
|---|---|---|
| GET | `/api/v1/admin/dashboard` | Stats |
| GET | `/api/v1/admin/orders` | Sab orders |
| PUT | `/api/v1/admin/orders/:id/status` | Status update |
| PUT | `/api/v1/admin/orders/:id/verify-payment` | Payment verify |
| GET | `/api/v1/admin/users` | Sab users |

---

## First Admin kaise banayein?

MongoDB Atlas mein Users collection mein jaao aur manually ek user ka `role` field `"admin"` kar do.

Ya seed script chalao:
```bash
node utils/seed.js
```

---

## Deployment (Render.com — Free)

1. GitHub pe code push karo
2. render.com → New Web Service → Connect repo
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Environment Variables mein sab .env values daalo
6. Deploy!

Free tier pe 750 hours/month — kaafi hai starting ke liye.
