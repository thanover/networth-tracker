# Claude Instructions for networth-tracker

## Database Seed (`server/src/seed.js`)

Whenever code changes touch the data model, keep the seed file in sync:

- **New account field added** — add it to the relevant account(s) in `DEMO_ACCOUNTS` so the demo data exercises the new field.
- **Account type added** — add at least one representative entry for that type to `DEMO_ACCOUNTS`.
- **Account type removed or renamed** — remove or update the corresponding entries in `DEMO_ACCOUNTS` and ensure the `category`/`type` values still match the model enum.
- **Field removed or renamed** — remove or rename it in every affected `DEMO_ACCOUNTS` entry.
- **User model fields added** — consider whether the seeded user should have a sensible default for the new field (set it in the `User.create(...)` call).

The goal is for the seeded demo data to always reflect what a realistic, fully-populated account set looks like for the current schema.
