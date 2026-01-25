# Task Management System

A full-stack task management application (Scrum/Agile) built with NestJS (Backend) and React/Vite (Frontend).

## Project Structure

- **backend/**: NestJS API with TypeORM, Postgres, JWT Auth.
- **frontend/**: React + Vite, TailwindCSS, React Query.

## Prerequisites

- Node.js (v18+)
- Docker & Docker Compose (optional, for local DB/Dev)
- PostgreSQL (if running locally without Docker)

## Local Development

### Option 1: Using Docker Compose (Recommended)

Run the entire stack (Backend, Frontend, Database) with one command:

```bash
docker-compose up --build
```

- Backend: http://localhost:3000
- Frontend: http://localhost:5173
- Database: localhost:5432

### Option 2: Manual Setup

#### Backend

1. Navigate to `backend/`
2. Copy `.env.example` to `.env` and configure it.
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm run start:dev
   ```

#### Frontend

1. Navigate to `frontend/`
2. Copy `.env.example` to `.env`
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```

## Deployment

### Vercel (Frontend)

1. Install Vercel CLI or connect via Dashboard.
2. Set the Root Directory to `frontend`.
3. Add Environment Variable: `VITE_API_URL` pointing to your deployed backend.

### Render (Full Stack)

This project is configured with `render.yaml` for "Blueprint" deployment.

1. Connect your repo to Render.
2. Select "New Blueprint Instance".
3. Render will automatically detect:
   - **Backend Service**: Node.js service.
   - **Frontend Service**: Static site.
   - **Database**: PostgreSQL instance.

### Supabase (Database)

If you prefer using Supabase for the database:

1. Create a Supabase project.
2. Get the Connection String (Transaction Pooler recommended for serverless/Render).
3. Update `DATABASE_URL` in your backend `.env` (or Render Env Vars).
4. **Note**: The backend uses TypeORM. Ensure `DB_SSL=true` is set for Supabase.

## Testing

- **Backend**: `npm test` (in backend folder)
- **Frontend**: `npm test` (in frontend folder)

## Security Features

- **Helmet**: Secure HTTP headers.
- **Rate Limiting**: Protection against brute-force.
- **CORS**: Configurable origin whitelist.
- **JWT**: Secure authentication.
