# Build Plan

## Phase 1: Project Scaffolding ✅
- [x] Initialize client (Vite + React) and server (Express) projects
- [x] Install all dependencies
- [x] Set up Tailwind config with the GitHub dark theme
- [x] Set up shadcn/ui with customized CSS variables
- [x] Docker Compose + Dockerfiles for all three services
- [x] Verify everything starts up and connects

## Phase 2: Backend API ✅
- [x] MongoDB connection setup with Mongoose
- [x] User model + auth routes (register/login) with JWT + bcrypt
- [x] Auth middleware
- [x] Account model (with all asset/debt type fields)
- [x] Account CRUD routes
- [x] Test all endpoints work (Vitest + Supertest + mongodb-memory-server, 27 tests)

## Phase 3: Auth UI ✅
- [x] API client module with JWT handling
- [x] Auth context/provider for React
- [x] Login/Register page
- [x] Protected route wrapper
- [x] Verify login/register flow end-to-end (clean production build)

## Phase 4: Dashboard — Accounts ✅
- [x] Dashboard page layout (top bar, sections)
- [x] Accounts list component (assets section + debts section with subtotals)
- [x] Add/Edit account modal with dynamic form fields per type
- [x] Delete account with confirmation
- [x] Current net worth display

## Phase 5: Projections & Chart ✅
- [x] Projection math utility (all formulas from spec)
- [x] Net worth over time line chart with Recharts
- [x] Time range toggle (1Y / 5Y / 10Y / 40Y)
- [x] Three lines: assets, debts, net worth

## Phase 6: Docker & CI/CD ✅
- [x] Finalize Dockerfiles (multi-stage builds, nginx config for client)
- [x] Docker Compose with env vars and volumes
- [x] GitHub Actions workflow to build and push to ghcr.io
