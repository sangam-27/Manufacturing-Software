# 🏭 ManufactureOS — MERN ERP System

A production-grade Manufacturing ERP system built with the MERN stack (MongoDB, Express, React, Node.js).

---

## 📁 Project Structure

```
manufactureos/
├── server/                  ← Express + Node.js API
│   ├── config/db.js
│   ├── controllers/         ← Business logic
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── productController.js
│   │   ├── productionController.js
│   │   ├── taskController.js
│   │   ├── billingController.js
│   │   └── dashboardController.js
│   ├── middleware/
│   │   ├── auth.js          ← JWT verify
│   │   ├── rbac.js          ← Role-based access
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── ProductionOrder.js
│   │   ├── Sale.js
│   │   ├── Task.js
│   │   ├── InventoryLog.js
│   │   └── Counter.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── products.js
│   │   ├── production.js
│   │   ├── tasks.js
│   │   ├── billing.js
│   │   └── dashboard.js
│   ├── seedData.js          ← Demo data seeder
│   ├── server.js            ← Entry point
│   ├── .env
│   └── package.json
│
├── client/                  ← React + Redux frontend
│   ├── public/index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/index.jsx      ← All reusable UI components
│   │   │   └── layout/
│   │   │       ├── Sidebar.jsx
│   │   │       └── Topbar.jsx
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── ProductionPage.jsx
│   │   │   ├── InventoryPage.jsx
│   │   │   ├── BillingPage.jsx
│   │   │   ├── TasksPage.jsx
│   │   │   └── UsersPage.jsx
│   │   ├── store/
│   │   │   ├── index.js
│   │   │   └── slices/
│   │   │       ├── authSlice.js
│   │   │       ├── productsSlice.js
│   │   │       ├── ordersSlice.js
│   │   │       ├── tasksSlice.js
│   │   │       ├── billingSlice.js
│   │   │       └── usersSlice.js
│   │   ├── services/api.js   ← Axios API service layer
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   ├── .env
│   └── package.json
│
├── package.json             ← Root scripts
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally (or MongoDB Atlas URI)
- npm ≥ 8

### 1. Clone & Install

```bash
# Install root dev dependencies (concurrently)
npm install

# Install all dependencies
npm run install:all
```

### 2. Configure environment

**server/.env** (already created — update if needed):
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/manufactureos
JWT_SECRET=manufactureos_super_secret_jwt_key_change_in_production_2024
JWT_EXPIRES_IN=7d
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

**client/.env** (already created):
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

### 3. Seed the database

```bash
npm run seed
```

This creates 6 users, 8 products, 5 production orders, 6 tasks, and 5 invoices.

### 4. Start development servers

```bash
# Start both frontend + backend concurrently
npm run dev

# Or separately:
npm run server    # → http://localhost:5000
npm run client    # → http://localhost:3000
```

---

## 🔑 Login Credentials

| Role       | Email                  | Password   |
|------------|------------------------|------------|
| Admin      | admin@manufos.com      | admin123   |
| Supervisor | priya@manufos.com      | super123   |
| Worker     | rahul@manufos.com      | user123    |

---

## 👥 Role-Based Access Control

| Feature          | Admin | Supervisor | Worker |
|-----------------|-------|-----------|--------|
| Dashboard        | ✅    | ✅        | ✅     |
| Production       | ✅    | ✅ (CRUD) | ✅ (view/update own) |
| Inventory        | ✅    | ✅        | ❌     |
| Billing & Sales  | ✅    | ❌        | ❌     |
| User Management  | ✅    | ❌        | ❌     |
| Tasks (own)      | ✅    | ✅        | ✅     |

---

## 📡 API Endpoints

### Auth
```
POST  /api/auth/login             → Login
POST  /api/auth/register          → Register (Admin only)
GET   /api/auth/me                → Get current user
PUT   /api/auth/change-password   → Change password
```

### Products
```
GET   /api/products               → List (Admin, Supervisor)
POST  /api/products               → Create (Admin)
PUT   /api/products/:id           → Update (Admin)
DELETE /api/products/:id          → Delete (Admin)
POST  /api/products/:id/stock     → Adjust stock (Admin, Supervisor)
GET   /api/products/:id/logs      → Inventory logs
```

### Production Orders
```
GET   /api/production             → List (all roles, scoped by role)
POST  /api/production             → Create (Admin, Supervisor)
PUT   /api/production/:id         → Update (Admin, Supervisor)
PATCH /api/production/:id/progress → Update progress (all roles)
DELETE /api/production/:id        → Delete (Admin)
```

### Billing
```
GET   /api/billing                → List invoices (Admin)
POST  /api/billing                → Create invoice (Admin)
PATCH /api/billing/:id/status     → Update status (Admin)
DELETE /api/billing/:id           → Delete (Admin)
```

### Tasks
```
GET   /api/tasks                  → List (scoped by role)
POST  /api/tasks                  → Create (Admin, Supervisor)
PATCH /api/tasks/:id              → Update (all roles)
DELETE /api/tasks/:id             → Delete (Admin, Supervisor)
```

### Dashboard
```
GET   /api/dashboard              → Aggregated KPIs + charts
```

---

## ⚡ Real-time Events (Socket.io)

| Event               | Trigger                        |
|--------------------|-------------------------------|
| `order:created`     | New production order created   |
| `order:updated`     | Order details changed          |
| `order:progress`    | Progress percentage updated    |
| `product:created`   | New product added              |
| `product:updated`   | Product stock/details changed  |
| `invoice:created`   | New invoice created            |
| `invoice:updated`   | Invoice status changed         |
| `alert:low_stock`   | Product hits low stock level   |
| `task:created`      | New task assigned              |
| `task:updated`      | Task status changed            |

---

## 🛠️ Tech Stack

**Backend**
- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- Socket.io (real-time)
- bcryptjs (password hashing)
- Helmet + mongo-sanitize (security)
- express-rate-limit

**Frontend**
- React 18
- Redux Toolkit
- Axios (API client)
- Recharts (charts)
- React Hook Form
- react-hot-toast
- Socket.io-client

---

## 🔒 Security Features

- JWT tokens with expiry
- Passwords hashed with bcrypt (12 rounds)
- MongoDB injection sanitization
- HTTP security headers (Helmet)
- Rate limiting (500 req / 15 min)
- CORS restricted to client URL
- Role-based route protection

---

## 📦 Production Build

```bash
# Build React frontend
npm run build

# The build/ folder can be served by Express in production:
# Add to server.js:
# app.use(express.static(path.join(__dirname, '../client/build')));
# app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/build/index.html')));
```

---

## 🐛 Common Issues

**MongoDB not connecting?**
```bash
# Start MongoDB service
sudo systemctl start mongod
# or
mongod --dbpath /data/db
```

**Port 5000 already in use?**
```bash
lsof -ti:5000 | xargs kill -9
```

**Frontend can't reach API?**
- Check `client/.env` has correct `REACT_APP_API_URL`
- Ensure CORS `CLIENT_URL` in `server/.env` matches frontend URL
