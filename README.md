# Quote Arena

Quote Arena is a full-stack RFQ reverse-bidding platform where buyers create auctions and suppliers compete by submitting bids in real time.

The system is built as two applications:
- Backend: Node.js + Express + TypeScript + Prisma + PostgreSQL
- Frontend: Next.js (App Router) + TypeScript + Tailwind + Framer Motion

## Core Features

- Cookie-based authentication (HTTP-only session cookie)
- Role-based access control for BUYER and SUPPLIER users
- RFQ creation with auction configuration rules
- Live rankings based on latest bid per supplier
- Automatic auction extension logic near close time
- Hard cap close time (forced close)
- Activity logs and auction event history
- Light/Dark theme UI with global theme toggle

## Monorepo Structure

```text
rfq/
  backend/
    prisma/
    src/
  frontend/
    app/
    components/
    lib/
    public/
```

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL database (Neon or local Postgres)

## Environment Setup

### Backend env file

Create `backend/.env`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB_NAME?sslmode=require
JWT_SECRET=your_min_32_char_secret_here
PORT=4000
NODE_ENV=development
```

Notes:
- `JWT_SECRET` must be at least 32 characters.
- `PORT` defaults to `4000` if omitted.

### Frontend env file

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Install Dependencies

From repo root:

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Database Setup (Prisma)

From `backend/`:

```bash
npm run prisma:generate
npm run prisma:push
```

Optional database UI:

```bash
npm run prisma:studio
```

## Run the Project (Development)

You need 2 terminals.

### Terminal 1: Backend

```bash
cd backend
npm run dev
```

Backend runs on:
- http://localhost:4000

### Terminal 2: Frontend

```bash
cd frontend
npm run dev
```

Frontend runs on:
- http://localhost:3000

## Build and Run (Production Mode)

### Backend

```bash
cd backend
npm run build
npm run start
```

### Frontend

```bash
cd frontend
npm run build
npm run start
```

## Available Scripts

### Backend (`backend/package.json`)

- `npm run dev` - Start backend in watch mode using tsx
- `npm run build` - Compile TypeScript to `dist/`
- `npm run start` - Run compiled backend
- `npm run typecheck` - Type check without emit
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:push` - Push schema to database
- `npm run prisma:studio` - Open Prisma Studio

### Frontend (`frontend/package.json`)

- `npm run dev` - Start Next.js dev server
- `npm run build` - Build optimized production bundle
- `npm run start` - Run production server
- `npm run lint` - Run ESLint

## Default Ports

- Frontend: `3000`
- Backend: `4000`

If you change backend port, also update `NEXT_PUBLIC_API_URL`.

## Troubleshooting

- If backend fails on startup, verify all required backend env vars are present.
- If login/auth fails between frontend and backend, verify frontend URL is `http://localhost:3000` and backend is running with cookie/CORS support.
- If database errors appear, re-run `npm run prisma:generate` and `npm run prisma:push` in `backend/`.

## License

Private project.
