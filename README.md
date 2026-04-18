# Library Database Project

This is a fullstack project that emulates a library cataloging system. It was built for COSC 3380.

## Getting started

### Prerequisites

- [NodeJS](https://nodejs.org/en)
- [git](https://git-scm.com/)
- [Visual Studio Code](https://code.visualstudio.com/download) (recommended but not required)

### Setting up your workspace

1. Run the following commands to clone the repo and install the necessary packages:

```bash
git clone https://github.com/s-wick/library_database_project/
cd library_database_project
npm run install:all
```

1. Duplicate the `backend/.env.example` file and rename it to `.env`
2. In the `.env` file, replace the corresponding fields with the correct values for your SQL server setup

> [!WARNING]
> Make sure to never push this file up to the remote repository, as it contains credentials and other sensitive data.

3. Run `npm run dev` to run both frontend and backend concurrently
4. Open `http://localhost:5173` in your browser to view the frontend

## Database reset workflow

`npm run db:reset` will wipe your current database and re-import the schema and sample data. This is useful for development to allow editing triggers and sample data without needing to migrate existing data. It reads from `database/.env`.

To set up the `database/.env` file:

1. Duplicate `database/.env.example` and rename it to `.env`
2. Set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` values for your MySQL connection
3. (Optional) Set `DB_TIME_ZONE` (for example `+00:00`) to force a consistent MySQL session time zone during resets
4. Set `SEED_STAFF_PASSWORD` and `SEED_USER_PASSWORD` for seeded login passwords
5. (Optional) Set sample-date controls used by the first step of `db:reset`:
   - `SAMPLE_DATA_TIMEZONE` (IANA zone like `America/Chicago`) to control which "today" date is used
   - `SAMPLE_DATA_TARGET_DATE` (`YYYY-MM-DD`) to pin an explicit target date

Important: the date update step rewrites date values in sample SQL files (currently `database/data/transactions.sql` and `database/data/room-bookings.sql`) before importing. If you want deterministic fixtures in git, commit or discard those file changes intentionally.

This keeps seed credentials out of tracked SQL files and out of git history.

## Relevant Links

- [React](https://react.dev/)
- [Vite](https://vite.dev/)
- [shadcn](https://ui.shadcn.com/)
