# Libres Personal Trainer

AI-powered personal trainer MVP built with Next.js, TypeScript, and PostgreSQL.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5 (strict mode)
- **Database**: PostgreSQL 16 + Prisma ORM
- **API**: tRPC v11 + React Query
- **UI**: Tailwind CSS + Recharts
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

| Command                 | Description                 |
| ----------------------- | --------------------------- |
| `npm run dev`           | Start development server    |
| `npm run build`         | Production build            |
| `npm run test`          | Run unit tests (Vitest)     |
| `npm run test:watch`    | Run tests in watch mode     |
| `npm run test:coverage` | Run tests with coverage     |
| `npm run test:e2e`      | Run E2E tests (Playwright)  |
| `npm run test:e2e:ui`   | Run E2E tests with UI mode  |
| `npm run lint`          | Run ESLint                  |
| `npm run format`        | Format with Prettier        |
| `npm run typecheck`     | Type-check without emitting |

## Project Structure

```
src/
├── app/              # Next.js App Router
│   ├── (dashboard)/  # Dashboard routes (progress, volume)
│   ├── dashboard/    # Dashboard routes (workouts)
│   ├── onboarding/   # Onboarding wizard
│   ├── exercises/    # Exercise browser
│   └── api/          # tRPC API routes
├── components/       # React components
│   ├── onboarding/   # Wizard steps
│   ├── workout/      # Workout logger
│   ├── progress/     # Charts and forms
│   └── exercise/     # Exercise browser
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
seeds/                # Database seed data
```

## Testing

### Unit Tests

```bash
npm run test              # Run all unit tests
npm run test:coverage     # Run with coverage report
```

### E2E Tests

```bash
npm run test:e2e          # Run all E2E tests
npm run test:e2e:ui       # Run with Playwright UI
```

### Test Structure

- **Unit tests**: `src/**/*.test.ts` - Domain logic, adapters, utilities
- **Component tests**: `src/**/*.test.tsx` - React components with RTL
- **E2E tests**: `e2e/**/*.spec.ts` - Full user flows with Playwright

## E2E Test Coverage

### Onboarding Flow

- Complete 5-step wizard (profile, experience, goals, equipment, limitations)
- Form validation (age required, age range)
- Step navigation (back/forward)
- localStorage persistence
- Progress indicator

### Workout Flow

- Generate training program
- Start workout session
- Log sets (reps, weight, RPE)
- Complete workout
- Workout history

### Progress View

- Render charts (body weight, 1RM, volume load)
- Add body weight entries
- Date range filtering
- Export data (CSV)

## CI/CD

GitHub Actions pipeline with:

- **Lint**: ESLint + Prettier checks
- **Type Check**: TypeScript strict mode validation
- **Unit Tests**: Vitest with coverage
- **E2E Tests**: Playwright (Chromium, Firefox, WebKit)
- **Build**: Next.js production build
- **Lighthouse**: Performance audit (score > 90)
- **Accessibility**: axe-core automated checks

## Performance Targets

- Lighthouse score > 90
- First Contentful Paint < 1.5s
- Largest Contentful Paint < 2.5s
- Time to Interactive < 3s
- Total Blocking Time < 300ms
- Cumulative Layout Shift < 0.1

## Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader support (ARIA labels)
- Skip to main content link
- Proper form validation messages
- Focus management on step transitions

## Architecture

### Hexagonal Architecture

```
Domain (Pure TypeScript)
├── types.ts          # Domain types
├── training-engine.ts # Split selection
├── periodization.ts  # Program generation
├── volume.ts         # Volume landmarks
├── overload.ts       # Progressive overload
├── deload.ts         # Deload logic
└── substitution.ts   # Exercise substitution

Ports (Interfaces)
├── exercise-repository.ts
├── program-repository.ts
├── workout-repository.ts
├── progress-repository.ts
└── user-repository.ts

Infrastructure (Adapters)
└── prisma/
    ├── client.ts
    └── adapters/
        ├── exercise.ts
        ├── program.ts
        ├── workout.ts
        ├── progress.ts
        └── user-profile.ts
```

## License

MIT
