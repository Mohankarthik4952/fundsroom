# Mini ERP + CRM Operations Portal

A full-stack operations portal for a wholesale/distribution company with customer CRM, product inventory, and sales challan workflows.

## Features

- JWT authentication with four roles: Admin, Sales, Warehouse, Accounts
- Customer management and follow-up notes
- Product and inventory tracking with stock movement logs
- Draft and confirmed sales challans with stock validation
- Responsive admin dashboard

## Tech Stack

- Frontend: React + Vite + TypeScript
- Backend: Node.js + Express + TypeScript
- Database: SQLite (local development), Prisma ORM
- Auth: JWT with role-based access control

## Local Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Environment Variables

Backend `.env`:

```env
PORT=4000
JWT_SECRET=your_secure_secret
DATABASE_URL="file:./dev.db"
CLIENT_URL="http://localhost:5173"
```

Frontend `.env`:

```env
VITE_API_URL=http://localhost:4000
```

## Demo Login Credentials

- Admin: `admin@mini.erp` / `admin123`
- Sales: `sales@mini.erp` / `sales123`
- Warehouse: `warehouse@mini.erp` / `warehouse123`
- Accounts: `accounts@mini.erp` / `accounts123`

## API Overview

- `POST /auth/login`
- `GET /customers`
- `POST /customers`
- `GET /customers/:id`
- `POST /customers/:id/follow-ups`
- `GET /products`
- `POST /products`
- `GET /challans`
- `POST /challans`
- `GET /dashboard/summary`

## Deployment Notes

To deploy:

1. Host the backend on Render/Railway/Fly.io with environment variables.
2. Host the frontend on Vercel/Netlify.
3. Use a hosted Postgres database for production if needed.
4. Set `CLIENT_URL` and `VITE_API_URL` to the deployed domain values.

## Assumptions

- SQLite is used for local development because the assignment is time-bound and this keeps setup simple.
- Follow-up notes are stored per customer and linked to the creating user.
- Challan confirmation reduces stock immediately and validates for insufficient inventory.

## Known Limitations

- PDF invoice export and S3 image upload are not included in this MVP.
- Production-grade deployment and monitoring are not yet configured.
- No automated test suite was included for the initial demo build.
