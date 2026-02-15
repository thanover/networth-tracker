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

## 7. Client-side Encryption
All account data is encrypted in the browser before being sent to the server, using a key derived from the user's password. The server stores only ciphertext — a DB breach exposes nothing readable.

- Key derivation: PBKDF2 (300k iterations, SHA-256) → AES-GCM-256 key; per-user salt generated at registration and stored on server
- Each account saved as `{ iv, data }` (base64 AES-GCM ciphertext of JSON fields)
- Key stored in `sessionStorage` (survives refresh, cleared on tab close); user re-authenticates on new session to re-derive key
- Export changed to client-side (decrypt in browser, download plaintext JSON); import encrypts each account before sending to server
- Migration: existing plaintext accounts pass through as-is until re-saved

**Files:** `server/src/models/User.js`, `server/src/models/Account.js`, `server/src/routes/auth.js`, `server/src/routes/accounts.js`, `server/src/routes/export.js`, `client/src/utils/crypto.js` (new), `client/src/context/AuthContext.jsx`, `client/src/api/accounts.js`, `client/src/pages/DashboardPage.jsx`

---

## Status

| # | Feature | Status |
|---|---------|--------|
| 1 | Type-aware account modal | done |
| 2 | Balance checkpoints | pending |
| 3 | Actual vs projected lookback | pending |
| 4 | Configurable inflation | done |
| 5 | Data export / import | done |
| 6 | CSV account import | pending |
| 7 | Client-side encryption | pending |
