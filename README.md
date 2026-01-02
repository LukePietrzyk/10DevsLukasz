# Flashcards

A minimalistic web application for creating and reviewing flashcards with a simple spaced-repetition flow.



## Table of Contents

1. [Tech Stack](#tech-stack)  
2. [Getting Started Locally](#getting-started-locally)  
3. [Available Scripts](#available-scripts)  
4. [Project Scope](#project-scope)  
5. [Project Status](#project-status)  
6. [License](#license)

## Tech Stack

**Frontend**  
- Astro 5  
- React 19  
- TypeScript 5  
- Tailwind CSS 4  
- shadcn/ui component library

**Backend / Infrastructure**  
- Supabase (PostgreSQL ✚ Auth)  
- CI/CD – GitHub Actions  
- Docker image deployed to DigitalOcean

**Tooling & Quality**  
- ESLint + Prettier  
- Husky + lint-staged  
- Unit tests (tsx / logic) & one E2E smoke test

## Getting Started Locally

### Prerequisites
* Node.js 22.14.0 (see `.nvmrc`)
* npm ≥ 10 (bundled with Node) or pnpm

### Clone & Install

```bash
git clone https://github.com/<your-org>/flashcards.git
cd flashcards
npm install
```

### Environment variables
Create a `.env.local` file and provide your Supabase credentials:

```bash
SUPABASE_URL=<your-supabase-instance-url>
SUPABASE_ANON_KEY=<your-anon-key>
```

### Run the app

```bash
# start dev server with hot-reload
npm run dev
```

Open http://localhost:4321 in your browser.

### Build & preview production

```bash
npm run build     # generates static output
npm run preview   # serves the build locally
```

## Available Scripts

| Script            | Description                          |
|-------------------|--------------------------------------|
| `dev`             | Start development server             |
| `build`           | Produce production build             |
| `preview`         | Preview the production build locally |
| `lint`            | Run ESLint over the codebase         |
| `lint:fix`        | Run ESLint with `--fix`              |
| `format`          | Format files with Prettier           |

All scripts are defined in `package.json`.

## Project Scope

### In scope (MVP)
- Account management: sign-up, login, logout, password reset, delete account  
- Manual CRUD for flashcards (front / back / subject)  
- List with search & pagination  
- Daily review screen with difficulty grading (hard / medium / easy)  
- Basic progress counter for today’s reviews  
- Minimal settings & FAQ/help pages  
- Basic analytics events  
- Security & privacy fundamentals

### Out of scope (post-MVP roadmap)
- AI-assisted flashcard generation  
- Advanced spaced-repetition algorithm (e.g. SuperMemo)  
- Sharing decks, import/export, mobile apps, notifications, advanced stats, full i18n

See [`./.ai/prd.md`](./.ai/prd.md) for the full product requirements document.

## Project Status

![GitHub last commit](https://img.shields.io/github/last-commit/<your-org>/flashcards?style=flat-square)
![GitHub issues](https://img.shields.io/github/issues/<your-org>/flashcards?style=flat-square)

MVP is **in active development** – v0.1 expected by **22 Jan 2026**.

## License

MIT © 2026
