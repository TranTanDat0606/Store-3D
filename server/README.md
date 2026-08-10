# Store 3D — Server

REST API backend for the Store 3D e-commerce app (React + Express + MongoDB).

## Requirements

- Node.js 18+
- MongoDB Community Edition running locally on `mongodb://127.0.0.1:27017`

## Setup

```bash
cd server
npm install
copy .env.example .env   # then edit JWT_SECRET
npm run seed             # creates database store3d + sample data
npm run dev              # starts API at http://localhost:5000
```

The database `store3d` is created automatically on the first insert — no manual
creation needed. If it does not exist yet, run `npm run seed` and MongoDB creates it.

## Seed data

`npm run seed` inserts: 2 users, 6 categories, 12 products (images stored as base64
inside MongoDB), 2 coupons, a sample wishlist and reviews.

```bash
npm run seed          # inserts only missing data (idempotent)
npm run seed -- --fresh  # wipe all collections first, then re-seed
```

Demo accounts:

| Role     | Email                | Password  |
| -------- | -------------------- | --------- |
| Admin    | admin@store3d.com    | admin123  |
| Customer | khach@store3d.com    | khach123  |

## Connecting MongoDB Compass

1. Open **MongoDB Compass** → click **New Connection**.
2. Connection string field: `mongodb://127.0.0.1:27017/store3d`
3. Click **Connect**. The `store3d` database appears in the left sidebar
   (created after the first `npm run seed`).
4. You can also connect to the server as a whole with `mongodb://127.0.0.1:27017`
   and then pick the `store3d` database from the list.

## Scripts

| Command            | Description                         |
| ------------------ | ----------------------------------- |
| `npm run dev`      | Run with tsx watch (auto-restart)   |
| `npm run build`    | Compile TypeScript to `dist/`       |
| `npm run start`    | Run compiled build                  |
| `npm run seed`     | Seed the database                   |

## Env vars

See `.env.example` — `MONGODB_URI`, `JWT_SECRET`, `PORT`, `CLIENT_URL` and rate limit
tuning are the ones you'll usually touch.
