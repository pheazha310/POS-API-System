# POS API System

Structure-only backend skeleton for a Point of Sale (POS) system.

## Environment Setup

### Prerequisites

- Node.js `20+`
- npm `10+`
- Git

### Initial Setup

```bash
npm install
```

Create your local environment file:

```bash
copy .env.example .env
```

For PowerShell:

```powershell
Copy-Item .env.example .env
```

### Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run typecheck
npm run clean
```

## Recommended Team Conventions

- Keep `.env` local and never commit it.
- Put shared environment keys in `.env.example`.
- Implement runtime validation in `src/config/env.ts` when the team starts coding.
- Keep MySQL connection setup inside `src/config/database.ts`.

## Project Structure

```text
src/
├── config/
│   ├── database.ts
│   └── env.ts
├── constants/
│   ├── http-status.ts
│   ├── messages.ts
│   └── roles.ts
├── core/
│   ├── errors/
│   │   └── app-error.ts
│   ├── middlewares/
│   │   ├── error-handler.ts
│   │   └── not-found.ts
│   └── utils/
│       ├── api-response.ts
│       └── async-handler.ts
├── modules/
│   ├── auth/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── routes/
│   │   └── services/
│   ├── users/
│   ├── products/
│   ├── cart/
│   ├── sales/
│   ├── inventory/
│   └── reports/
├── app.ts
└── server.ts
```

## Notes

- Files currently contain placeholders only.
- Your team can implement each layer independently without removing starter business logic first.
- `package.json`, `tsconfig.json`, `.editorconfig`, and `.env.example` are ready for local development setup.
