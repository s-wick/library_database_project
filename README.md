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
npm install
```

2. Duplicate `backend/.env.example` to `backend/.env`

3. In `backend/.env`, replace the corresponding fields with the correct values for your SQL server setup

4. Optional: duplicate `frontend/.env.example` to `frontend/.env.local` if you need to override the default API behavior.

By default, the frontend uses relative `/api` paths and the Vite dev server proxies `/api` to `http://127.0.0.1:4000`, which keeps localhost development simple while matching production-friendly routing. If your backend runs on a different URL, set:

- `VITE_API_PROXY_TARGET` for local Vite development
- `VITE_API_BASE_URL` when the frontend must call a non-relative API origin
- `backend/.env` `ALLOWED_ORIGINS` to the comma-separated frontend origin list for cross-origin setups

> [!WARNING]
> Make sure to never push this file up to the remote repository, as it contains credentials and other sensitive data.

5. Run `npm run dev` to run both frontend and backend concurrently

## Relevant Links

- [React](https://react.dev/)
- [Vite](https://vite.dev/)
- [shadcn](https://ui.shadcn.com/)
