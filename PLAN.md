# Net Worth Tracker — Feature Backlog

---

## 1. Type-aware Account Modal
Fields in the Add/Edit Account modal adapt based on the selected type.

- Different field sets per type (e.g. interest rate for loans/credit cards, growth rate for investments, property value + mortgage balance for property)
- Required fields and validation rules scoped to type

**Files:** `client/src/components/AccountModal.jsx`, `server/src/models/Account.js`, `server/src/routes/accounts.js`

---

## 2. Balance Checkpoints
Users can record the actual balance of any account at a point in time.

- New `Checkpoint` model: `{ accountId, date, balance }`
- API: `POST /api/accounts/:id/checkpoints`, `GET /api/accounts/:id/checkpoints`
- UI: "Add checkpoint" action per account row, opens a small date + balance form

**Files:** `server/src/models/Checkpoint.js` (new), `server/src/routes/accounts.js`, `client/src/pages/DashboardPage.jsx`

---

## 3. Actual vs Projected Lookback
Chart overlay showing real balance history (from checkpoints) versus what was projected at the time.

- Toggle in chart header to switch between forward projection and historical view
- Actual net worth line drawn from checkpoint data
- Projected line recomputed from each checkpoint date for comparison

**Files:** `client/src/components/NetWorthChart.jsx`, `client/src/utils/projection.js`, possibly `client/src/utils/lookback.js` (new)

---

## 4. Configurable Inflation
Inflation rate setting that adjusts projected values to show real (inflation-adjusted) net worth.

- User-level `inflationRate` field (default 2.5%), stored via `PATCH /api/user`
- Projection math applies monthly deflation: `value / (1 + rate/12)^month`
- Chart toggle: "Nominal" vs "Real (inflation-adjusted)"

**Files:** `server/src/models/User.js`, `server/src/routes/user.js`, `client/src/context/AuthContext.jsx`, `client/src/components/NetWorthChart.jsx`, `client/src/utils/projection.js`

---

## 5. Data Export / Import
Users can export all their data to a file and re-import it to restore or migrate.

- Export: `GET /api/export` returns a JSON file containing accounts, checkpoints, and user profile (excluding password)
- Import: `POST /api/import` accepts the same JSON structure, upserts accounts and checkpoints, updates profile fields
- UI: "Export" and "Import" buttons in the dashboard header or a settings panel
- Import shows a confirmation summary before committing (e.g. "3 accounts, 12 checkpoints will be imported")

**Files:** `server/src/routes/export.js` (new), `server/src/app.js`, `client/src/pages/DashboardPage.jsx`

---

## 6. CSV Account Import
Users can bulk-add accounts by downloading a template CSV, filling it in, and uploading it.

- `GET /api/accounts/csv-template` — returns a pre-formatted CSV with headers and one example row
- `POST /api/accounts/csv-import` — parses uploaded CSV, validates each row, creates accounts in bulk
- UI: "Download template" link + file upload input in the dashboard (or account section header)
- Upload preview: show a table of parsed rows with any validation errors highlighted before confirming
- Template columns match account fields from feature 1 (type-aware); type-specific columns left blank when not applicable

**Files:** `server/src/routes/accounts.js`, `client/src/pages/DashboardPage.jsx` (or a new `CsvImportModal.jsx`)

---

## Status

| # | Feature | Status |
|---|---------|--------|
| 1 | Type-aware account modal | pending |
| 2 | Balance checkpoints | pending |
| 3 | Actual vs projected lookback | pending |
| 4 | Configurable inflation | done |
| 5 | Data export / import | done |
| 6 | CSV account import | pending |
