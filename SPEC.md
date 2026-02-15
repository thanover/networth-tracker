# Net Worth Tracker — Specification

## Overview

A self-hosted net worth tracking application where users can add financial accounts (assets and debts), view their current net worth, and project net worth over time. The chart X-axis shows the user's age alongside the calendar year. Deployed via Docker Compose.

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS (v4) + Recharts
- **Backend:** Express.js + Mongoose
- **Database:** MongoDB
- **Package manager:** pnpm
- **Containerization:** Docker + Docker Compose
- **CI/CD:** GitHub Actions (build + publish Docker images to GHCR)

---

## Authentication

- Username/password auth
- JWT-based sessions (7-day expiry)
- Passwords hashed with bcrypt
- Single-user or multi-user (each user sees only their own data)

---

## Data Model

### User

| Field           | Type     | Notes                              |
|-----------------|----------|------------------------------------|
| `_id`           | ObjectId | Auto-generated                     |
| `username`      | String   | Unique, required                   |
| `password`      | String   | Hashed with bcrypt, required       |
| `birthday`      | Date     | Optional; used for age-aware chart |
| `inflationRate` | Number   | Default 3.5%; used for real-value projection |
| `createdAt`     | Date     | Auto-generated                     |

### Account

| Field          | Type     | Notes                                       |
|----------------|----------|---------------------------------------------|
| `_id`          | ObjectId | Auto-generated                              |
| `userId`       | ObjectId | Ref to User                                 |
| `name`         | String   | User-defined label, required                |
| `category`     | String   | `asset` or `debt`, required                 |
| `type`         | String   | See types below, required                   |
| `balance`      | Number   | Current value/balance (≥ 0), required       |
| `interestRate` | Number   | Annual % (shared optional field)            |
| `expectedGrowthRate`  | Number | Annual % growth/depreciation         |
| `monthlyContribution` | Number | Expected monthly deposits            |
| `monthlyPayment`      | Number | Expected monthly payment             |
| `remainingTerm`       | Number | Remaining months on loan             |
| `createdAt`    | Date     | Auto-generated                              |

#### Asset Types and Required Fields

**`investment`** — Brokerage, 401k, IRA, index funds, crypto
| Field                  | Required | Notes                         |
|------------------------|----------|-------------------------------|
| `expectedGrowthRate`   | Yes      | Annual % growth estimate      |
| `monthlyContribution`  | No       | Expected monthly contribution |

**`property`** — Real estate
| Field                  | Required | Notes                         |
|------------------------|----------|-------------------------------|
| `expectedGrowthRate`   | No       | Annual % appreciation         |

**`vehicle`** — Cars, motorcycles, boats (depreciating assets)
| Field                  | Required | Notes                                    |
|------------------------|----------|------------------------------------------|
| `expectedGrowthRate`   | No       | Annual %; defaults to -15 (depreciation) |

**`cash`** — Checking, savings, money market
| Field                  | Required | Notes                          |
|------------------------|----------|--------------------------------|
| `interestRate`         | No       | Annual APY                     |
| `monthlyContribution`  | No       | Expected monthly deposits      |

#### Debt Types and Required Fields

**`loan`** — Mortgage, student, auto, personal loans
| Field                  | Required | Notes                                                   |
|------------------------|----------|---------------------------------------------------------|
| `interestRate`         | Yes      | Annual %                                                |
| `monthlyPayment`       | Yes      | Monthly payment amount                                  |
| `remainingTerm`        | Yes      | Remaining months (required to project when debt ends)   |

**`credit_card`** — Revolving credit
| Field                  | Required | Notes                          |
|------------------------|----------|--------------------------------|
| `interestRate`         | Yes      | Annual APR                     |
| `monthlyPayment`       | Yes      | Expected monthly payment       |

---

## Projection Math

All projections are calculated **monthly** on the client side (`client/src/utils/projection.js`).

### Assets

**Investment / Cash (with contributions):**
```
monthlyRate = annualRate / 100 / 12
balance[m+1] = balance[m] * (1 + monthlyRate) + monthlyContribution
```

**Property / Vehicle (appreciation/depreciation only):**
```
monthlyRate = annualRate / 100 / 12
balance[m+1] = balance[m] * (1 + monthlyRate)
```

### Debts

**Loan (amortizing):**
```
monthlyRate = annualRate / 100 / 12
interest     = balance[m] * monthlyRate
principal    = monthlyPayment - interest
balance[m+1] = max(0, balance[m] - principal)
// Stops at 0 or when remainingTerm is reached
```

**Credit Card:**
```
monthlyRate  = annualRate / 100 / 12
interest     = balance[m] * monthlyRate
balance[m+1] = max(0, balance[m] + interest - monthlyPayment)
```

### Net Worth

```
netWorth[m] = sum(assets[m]) - sum(debts[m])
```

### Inflation Adjustment (Real value)

When the "Inflation-adjusted" toggle is on, each projected value is deflated back to today's purchasing power:
```
realValue[m] = nominalValue[m] / (1 + inflationRate/100/12)^m
```

---

## API Endpoints

All endpoints except auth require `Authorization: Bearer <token>`.

### Auth

| Method | Path                  | Body                        | Response                      |
|--------|-----------------------|-----------------------------|-------------------------------|
| POST   | `/api/auth/register`  | `{ username, password }`    | `{ token, username }`         |
| POST   | `/api/auth/login`     | `{ username, password }`    | `{ token, username }`         |

### User Profile

| Method | Path        | Body                                        | Response                            |
|--------|-------------|---------------------------------------------|-------------------------------------|
| GET    | `/api/user` | —                                           | `{ username, birthday, inflationRate }` |
| PATCH  | `/api/user` | `{ birthday?, inflationRate? }`             | `{ username, birthday, inflationRate }` |

### Accounts

| Method | Path                  | Description                  |
|--------|-----------------------|------------------------------|
| GET    | `/api/accounts`       | List all user accounts       |
| POST   | `/api/accounts`       | Create a new account         |
| PUT    | `/api/accounts/:id`   | Update an account            |
| DELETE | `/api/accounts/:id`   | Delete an account            |

### Export / Import

| Method | Path          | Description                                                         |
|--------|---------------|---------------------------------------------------------------------|
| GET    | `/api/export` | Download all user data as a JSON file (`version: 1`)                |
| POST   | `/api/export` | Restore from an export file; replaces all existing accounts. Returns `{ imported: { accounts: N }, failures: [...] }` for any rows that failed validation. |

---

## UI Pages

### 1. Login / Register

- Username + password form
- Toggle between login and register

### 2. Dashboard

**Header bar**
- App title
- Export / Import buttons (JSON)
- Sign out

**Birthday banner** (shown when no date of birth is set)
- Inline date input to enter DOB; dismissed once saved
- Required for age-aware chart labels

**Net Worth Summary card**
- Large display of current total net worth (green if positive, red if negative)
- Assets and debts subtotals

**Net Worth Projection Chart**
- Line chart of projected net worth over time (Recharts)
- Time range toggle: 1Y / 5Y / 10Y / 40Y
- X-axis shows `Age XX` / `YYYY` when DOB is set; falls back to year offsets otherwise
- ~5 evenly spaced tick marks per range to avoid crowding
- Tooltip shows age, year, and projected value on hover
- **Chart footer:**
  - Left: current age + "Change DOB" button (inline date input)
  - Right: "Inflation-adjusted" checkbox; when checked, shows rate input with Save button

**Assets / Debts sections**
- Each account row shows:
  - Name
  - Type + key at-a-glance stats (e.g. `Investment · +7%/yr · +$500/mo`, `Loan · 4.6% APR · $1,800/mo · 23 yrs left`)
  - Balance (green for assets, red for debts)
  - Click row → opens Account Detail Modal
- Section footer shows category total

### 3. Account Detail Modal

Opens when any account row is clicked. Three states:

**View** — read-only display of all fields with formatted values
- Balance (large, color-coded)
- Type-specific fields (e.g. `+7%/yr`, `$1,800/mo`, `23 yrs (280 mo)`)
- Footer: Delete button (left) + Edit button (right)

**Edit** — full editable form (same fields as Add modal)
- Footer: Cancel + Save changes

**Delete confirm** — "Delete [name]? This cannot be undone."
- Footer: Cancel + Delete (red)

### 4. Add Account Modal

Opens from the "+ Add" button in each section header.

- Name, Category (asset/debt), Type dropdown
- Balance (label adapts to type, e.g. "Outstanding Balance" for debts)
- Type-specific fields (required fields enforced; optional fields labelled)
- Vehicle type pre-fills growth rate with -15%

---

## Styling & UI

### Theme

GitHub Dark-inspired. Dark-only.

### Color Palette

| Token        | Hex       | Usage                           |
|--------------|-----------|---------------------------------|
| `gh-bg`      | `#0d1117` | Page background                 |
| `gh-surface` | `#161b22` | Cards, panels                   |
| `gh-raised`  | `#21262d` | Elevated surfaces, hover states |
| `gh-border`  | `#30363d` | Borders, dividers               |
| `gh-text`    | `#c9d1d9` | Primary text                    |
| `gh-muted`   | `#8b949e` | Secondary/muted text            |
| `gh-bright`  | `#f0f6fc` | Headings, emphasis              |
| `gh-blue`    | `#388bfd` | Links, primary actions          |
| `gh-green`   | `#3fb950` | Positive values, assets         |
| `gh-yellow`  | `#d29922` | Warnings, banners               |
| `gh-red`     | `#f85149` | Negative values, debts, errors  |

### Typography

- **Font:** Monospace stack — `ui-monospace`, `Cascadia Code`, `Fira Code`, `monospace`
- **Base size:** 13px
- **Section headers:** 10–11px uppercase with letter-spacing

### Libraries

- **Tailwind CSS v4** — Utility-first styling; colors defined as CSS custom properties in `index.css`
- **Radix UI** — Accessible dialog primitives (`Dialog`)
- **Recharts** — React charting library for the net worth projection chart

---

## Docker Setup

### Services

| Service  | Image / Build        | Port      | Notes                            |
|----------|----------------------|-----------|----------------------------------|
| `mongo`  | `mongo:7`            | (internal)| Named volume for persistence     |
| `server` | `./server`           | 5001→5000 | Waits for mongo healthcheck      |
| `client` | `./client`           | 80→80     | Nginx serving built React app    |

### Environment Variables

| Variable      | Service | Default              | Description              |
|---------------|---------|----------------------|--------------------------|
| `MONGODB_URI` | server  | `mongodb://mongo:27017/networth` | MongoDB connection |
| `JWT_SECRET`  | server  | `dev-secret-change-me` | **Change before deploying** |

---

## CI/CD (GitHub Actions)

- **Trigger:** Push to `main`
- **Steps:** Build client + server Docker images → push to `ghcr.io` tagged with `latest` and git SHA

---

## Out of Scope (for now)

- Importing transactions from banks / Plaid integration
- Multiple currencies
- Budgeting or expense tracking
- Mobile app
- OAuth / social login
- Email verification or password reset
