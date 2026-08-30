# Libres Personal Trainer

AI-powered personal trainer MVP built with Next.js, TypeScript, and PostgreSQL.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5 (strict mode)
- **Database**: PostgreSQL 16 + Prisma ORM
- **Testing**: Vitest (unit), React Testing Library (components), Playwright (E2E)
- **Architecture**: Hexagonal (domain logic is pure TS, no framework imports)

## Getting Started

### Prerequisites

- Node.js >= 20
- Docker (for PostgreSQL)

### Setup

```bash
# Install dependencies
npm install

# Start PostgreSQL
docker compose up -d

# Set up environment
cp .env.example .env

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database
npx prisma db seed

# Start dev server
npm run dev
```

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run test:e2e` | Run E2E tests (Playwright) |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |
| `npm run typecheck` | Type-check without emitting |

## Project Structure

```
src/
├── app/              # Next.js App Router
├── components/       # React components
├── hooks/            # Custom React hooks
├── lib/
│   ├── domain/       # Pure TS training engine (NO framework imports)
│   ├── ports/        # Interfaces for domain ↔ infrastructure
│   ├── infrastructure/ # Adapters (Prisma, etc.)
│   └── api/          # tRPC routers
├── __tests__/        # Vitest unit tests
│   └── components/   # RTL component tests
e2e/                  # Playwright tests
prisma/               # Schema and migrations
```

## License

MIT
