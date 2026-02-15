# Net Worth Tracker

A self-hosted personal finance dashboard. Track assets and debts, project net worth over time, and visualize your financial trajectory by age.

---

## Running with Docker (recommended)

**Pull pre-built images and start:**
```bash
pnpm docker:pull
# or
docker compose pull && docker compose up
```

**Build from source and start:**
```bash
pnpm docker:dev
# or
docker compose up --build
```

The app is available at [http://localhost](http://localhost). The API runs on port `5001`.

**Set a strong JWT secret before deploying:**
```bash
JWT_SECRET=your-secret-here docker compose up
```

---

## Local Development

Requires Node.js 18+ and [pnpm](https://pnpm.io).

```bash
# Install dependencies
pnpm install
pnpm --prefix client install
pnpm --prefix server install

# Start client + server with hot reload
pnpm dev
```

- Client: http://localhost:5173
- Server: http://localhost:5000

---

## Running Tests

```bash
pnpm test
# or
pnpm --prefix server run test
```

---

## Project Structure

```
networth-tracker/
├── client/                  # React + Vite frontend
│   └── src/
│       ├── api/             # API client + endpoint wrappers
│       ├── components/      # Reusable UI components
│       ├── context/         # React context (auth, user state)
│       ├── hooks/           # Custom hooks (useAccounts)
│       ├── pages/           # Page components (Dashboard, Login)
│       └── utils/           # Projection math, account config, helpers
├── server/                  # Express + Mongoose backend
│   └── src/
│       ├── middleware/      # JWT auth middleware
│       ├── models/          # Mongoose schemas (User, Account)
│       ├── routes/          # Express route handlers
│       └── tests/           # Vitest integration tests
├── docker-compose.yml
└── .github/workflows/       # CI: builds + pushes Docker images to GHCR
```

---

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Recharts
- **Backend:** Express.js, Mongoose, MongoDB
- **Auth:** JWT + bcrypt
- **Containerization:** Docker + Docker Compose
- **CI/CD:** GitHub Actions → GitHub Container Registry (ghcr.io)
- **Package manager:** pnpm
