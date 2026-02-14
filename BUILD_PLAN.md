# Build Plan

## Phase 1: Project Scaffolding ✅
- [x] Initialize client (Vite + React) and server (Express) projects
- [x] Install all dependencies
- [x] Set up Tailwind config with the GitHub dark theme
- [x] Set up shadcn/ui with customized CSS variables
- [x] Docker Compose + Dockerfiles for all three services
- [x] Verify everything starts up and connects

## Phase 2: Backend API
- [ ] MongoDB connection setup with Mongoose
- [ ] User model + auth routes (register/login) with JWT + bcrypt
- [ ] Auth middleware
- [ ] Account model (with all asset/debt type fields)
- [ ] Account CRUD routes
- [ ] Test all endpoints work

## Phase 3: Auth UI
- [ ] API client module with JWT handling
- [ ] Auth context/provider for React
- [ ] Login/Register page
- [ ] Protected route wrapper
- [ ] Verify login/register flow end-to-end

## Phase 4: Dashboard — Accounts
- [ ] Dashboard page layout (top bar, sections)
- [ ] Accounts list component (assets section + debts section with subtotals)
- [ ] Add/Edit account modal with dynamic form fields per type
- [ ] Delete account with confirmation
- [ ] Current net worth display

## Phase 5: Projections & Chart
- [ ] Projection math utility (all formulas from spec)
- [ ] Net worth over time line chart with Recharts
- [ ] Time range toggle (1Y / 5Y / 10Y / 40Y)
- [ ] Three lines: assets, debts, net worth

## Phase 6: Docker & CI/CD
- [ ] Finalize Dockerfiles (multi-stage builds, nginx config for client)
- [ ] Docker Compose with env vars and volumes
- [ ] GitHub Actions workflow to build and push to ghcr.io
