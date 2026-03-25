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

2. Duplicate the `backend/.env.example` file and rename it to `.env`

3. In the `.env` file, replace the corresponding fields with the correct values for your SQL server setup

> [!WARNING]
> Make sure to never push this file up to the remote repository, as it contains credentials and other sensitive data.

4. Run `npm run dev` to run both frontend and backend concurrently

## Relevant Links

- [React](https://react.dev/)
- [Vite](https://vite.dev/)
- [shadcn](https://ui.shadcn.com/)
