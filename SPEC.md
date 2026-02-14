# Net Worth Tracker — Specification

## Overview

A self-hosted net worth tracking application where users can add financial accounts (assets and debts), view their current net worth, and project net worth over time based on provided parameters. Deployed via Docker Compose.

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS + shadcn/ui + Recharts
- **Backend:** Express.js + Mongoose
- **Database:** MongoDB
- **Containerization:** Docker + Docker Compose
- **CI/CD:** GitHub Actions (build + publish Docker images)

---

## Authentication

- Simple username/password auth
- JWT-based sessions
- Passwords hashed with bcrypt
- Single-user or multi-user (each user sees only their own data)
- No OAuth/social login for now

---

## Data Model

### User

| Field        | Type   | Notes                |
|--------------|--------|----------------------|
| `_id`        | ObjectId | Auto-generated     |
| `username`   | String | Unique, required     |
| `password`   | String | Hashed, required     |
| `createdAt`  | Date   | Auto-generated       |

### Account

| Field          | Type    | Notes                                      |
|----------------|---------|---------------------------------------------|
| `_id`          | ObjectId | Auto-generated                             |
| `userId`       | ObjectId | Ref to User                                |
| `name`         | String  | User-defined label (e.g. "Chase Savings")   |
| `category`     | String  | `asset` or `debt`                           |
| `type`         | String  | See types below                             |
| `balance`      | Number  | Current balance (positive number)           |
| `interestRate` | Number  | Annual % (e.g. 5.0 = 5%)                   |
| `createdAt`    | Date   | Auto-generated                               |

#### Asset Types and Extra Fields

**`investment`** — Brokerage, 401k, IRA, index funds, crypto, etc.
| Field                  | Type   | Notes                          |
|------------------------|--------|--------------------------------|
| `expectedGrowthRate`   | Number | Annual % growth estimate       |
| `monthlyContribution`  | Number | Expected monthly contribution  |

**`property`** — Real estate
| Field                  | Type   | Notes                          |
|------------------------|--------|--------------------------------|
| `expectedGrowthRate`   | Number | Annual % appreciation          |

**`vehicle`** — Cars, motorcycles, boats, etc. (depreciating)
| Field                  | Type   | Notes                                          |
|------------------------|--------|-------------------------------------------------|
| `expectedGrowthRate`   | Number | Annual % (typically negative, e.g. -15)        |

**`cash`** — Checking, savings, money market
| Field                  | Type   | Notes                          |
|------------------------|--------|--------------------------------|
| `interestRate`         | Number | Annual APY                     |
| `monthlyContribution`  | Number | Expected monthly deposits      |

#### Debt Types and Extra Fields

**`loan`** — Mortgage, student, auto, personal loans
| Field                  | Type   | Notes                          |
|------------------------|--------|--------------------------------|
| `interestRate`         | Number | Annual %                       |
| `monthlyPayment`       | Number | Monthly payment amount         |
| `remainingTerm`        | Number | Remaining months               |

**`credit_card`** — Revolving credit
| Field                  | Type   | Notes                          |
|------------------------|--------|--------------------------------|
| `interestRate`         | Number | Annual APR                     |
| `monthlyPayment`       | Number | Expected monthly payment       |

> **Note:** `remainingTerm` is used for amortizing loans so the projection knows when the debt reaches zero. Credit cards don't have a fixed term.

---

## Projection Math

All projections are calculated **monthly** on the client side.

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

**Loan (amortizing — mortgage, student, auto, personal):**
```
monthlyRate = annualRate / 100 / 12
interest = balance[m] * monthlyRate
principal = monthlyPayment - interest
balance[m+1] = max(0, balance[m] - principal)
// Stops at 0 or when remainingTerm is reached
```

**Credit Card:**
```
monthlyRate = annualRate / 100 / 12
interest = balance[m] * monthlyRate
balance[m+1] = max(0, balance[m] + interest - monthlyPayment)
```

### Net Worth

```
netWorth[m] = sum(assets[m]) - sum(debts[m])
```

---

## API Endpoints

All endpoints except auth require a valid JWT in the `Authorization: Bearer <token>` header.

### Auth

| Method | Path              | Description          |
|--------|-------------------|----------------------|
| POST   | `/api/auth/register` | Create new user   |
| POST   | `/api/auth/login`    | Login, returns JWT |

### Accounts

| Method | Path                   | Description               |
|--------|------------------------|---------------------------|
| GET    | `/api/accounts`        | List all user accounts    |
| POST   | `/api/accounts`        | Create a new account      |
| PUT    | `/api/accounts/:id`    | Update an account         |
| DELETE | `/api/accounts/:id`    | Delete an account         |

---

## UI Pages

### 1. Login / Register

- Simple form with username + password
- Toggle between login and register

### 2. Dashboard (main page)

- **Net Worth Summary** — Large display of current total net worth
- **Net Worth Over Time Chart** — Line chart showing projected net worth
  - Time range toggle: **1Y / 5Y / 10Y / 40Y**
  - Shows total net worth line
- **Accounts List** — Two sections: Assets and Debts
  - Each account shows: name, type, current balance
  - Total assets and total debts subtotals
  - Add / Edit / Delete actions per account

### 3. Add/Edit Account Modal

- Form fields change dynamically based on category (asset/debt) and type selection
- Fields:
  - Name (text)
  - Category (asset / debt)
  - Type (dropdown, filtered by category)
  - Balance (currency input)
  - Type-specific fields (interest rate, growth rate, monthly payment, monthly contribution, remaining term)

---

## Styling & UI

### Theme

GitHub Dark theme-inspired dashboard. Dark-only (no light mode toggle).

### Color Palette

| Token       | Hex       | Usage                          |
|-------------|-----------|--------------------------------|
| `gh-bg`     | `#0d1117` | Page background                |
| `gh-surface`| `#161b22` | Cards, panels                  |
| `gh-raised` | `#21262d` | Elevated surfaces, hover states|
| `gh-border` | `#30363d` | Borders, dividers              |
| `gh-text`   | `#c9d1d9` | Primary text                   |
| `gh-muted`  | `#8b949e` | Secondary/muted text           |
| `gh-bright` | `#f0f6fc` | Headings, emphasis             |
| `gh-blue`   | `#388bfd` | Links, primary actions         |
| `gh-green`  | `#3fb950` | Positive values, assets        |
| `gh-yellow` | `#d29922` | Warnings, neutral indicators   |
| `gh-purple` | `#bc8cff` | Accents                        |
| `gh-red`    | `#f85149`  | Negative values, debts, errors |

### Typography

- **Font:** Monospace stack — `ui-monospace`, `Cascadia Code`, `Fira Code`, `monospace`
- **Base size:** 13px
- **Section headers:** 10-11px uppercase with letter-spacing

### Libraries

- **Tailwind CSS** — Utility-first styling with custom theme extending GitHub's dark palette
- **shadcn/ui** — Component primitives (cards, badges, buttons, modals, tabs, forms). Copied into the project, styled with Tailwind. CSS variables customized to match the GitHub palette.
- **Recharts** — React-native charting library for the net worth projection line chart

### Tailwind Config

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      gh: {
        bg: '#0d1117',
        surface: '#161b22',
        raised: '#21262d',
        border: '#30363d',
        text: '#c9d1d9',
        muted: '#8b949e',
        bright: '#f0f6fc',
        blue: '#388bfd',
        green: '#3fb950',
        yellow: '#d29922',
        purple: '#bc8cff',
        red: '#f85149',
      }
    },
    fontFamily: {
      mono: ['ui-monospace', 'Cascadia Code', 'Fira Code', 'monospace'],
    }
  }
}
```

### Component Style Notes

- **Cards:** Rounded corners, `gh-surface` background, `gh-border` 1px border
- **Badges/Pills:** Semi-transparent colored backgrounds (e.g. `bg-gh-green/10 text-gh-green`)
- **Buttons:** `gh-raised` background, `gh-border` border, `gh-text` on hover
- **Scrollbars:** Thin custom scrollbars (6px, `gh-border` thumb)
- **Chart:** `gh-green` for assets line, `gh-red` for debts line, `gh-blue` for net worth line
- **Net worth display:** Large monospace number, `gh-green` if positive, `gh-red` if negative

---

## Docker Setup

### Services (docker-compose.yml)

1. **`client`** — Nginx serving the built React app
2. **`server`** — Node.js Express API
3. **`mongo`** — MongoDB instance with a named volume for persistence

### Environment Variables

| Variable            | Service  | Description                    |
|---------------------|----------|--------------------------------|
| `MONGODB_URI`       | server   | MongoDB connection string      |
| `JWT_SECRET`        | server   | Secret for signing JWTs        |
| `VITE_API_URL`      | client   | API base URL for the frontend  |

---

## GitHub Actions

- **Trigger:** Push to `main`
- **Steps:**
  1. Build client Docker image
  2. Build server Docker image
  3. Push both to GitHub Container Registry (ghcr.io)
  4. Tag with `latest` and git SHA

---

## Project Structure

```
networth-tracker/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom hooks
│   │   ├── utils/           # Projection math, helpers
│   │   ├── api/             # API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.js
├── server/                  # Express + Mongoose backend
│   ├── src/
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # Express routes
│   │   ├── middleware/      # Auth middleware
│   │   └── index.js         # Entry point
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .github/
│   └── workflows/
│       └── build.yml
├── SPEC.md
└── README.md
```

---

## Out of Scope (for now)

- Historical balance snapshots (manual or via Plaid)
- Importing transactions from banks
- Multiple currencies
- Budgeting or expense tracking
- Mobile app
- OAuth / social login
- Email verification or password reset
