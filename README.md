# BriefAI: AI SaaS Starter (Next.js 16 + Drizzle + OpenAI)

Turn messy meeting notes into a short summary and a clear list of action items.

BriefAI is a small but complete AI SaaS starter. It shows the parts every real AI product needs: sign up and login, a database, a protected dashboard, a server-side AI call with structured output, input validation, and a free-plan usage limit.

Built for the YouTube tutorial on [@osamaayubdev](https://www.youtube.com/@osamaayubdev).

## Features

- Email and password auth (bcrypt hashing, signed JWT in an httpOnly cookie)
- Route protection with Next.js `proxy.ts`, plus a real check on the server for every action
- SQLite locally, Turso (libSQL) in production, with Drizzle ORM
- OpenAI Responses API with structured output (Zod schema): title, summary, action items
- Your API key stays on the server and never reaches the browser
- Free plan: 5 briefs per day per user (configurable)
- Demo mode: runs without an OpenAI key so anyone can try it locally
- Server Actions with `useActionState`, form errors that keep what the user typed
- Cache Components and Suspense streaming (Next.js 16 defaults)
- Tailwind CSS v4

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Drizzle ORM · libSQL / Turso · OpenAI SDK · Zod · jose · bcryptjs

## Getting started

```bash
git clone https://github.com/osamaayub/briefai.git
cd briefai
npm install
cp .env.example .env.local
```

Set `SESSION_SECRET` in `.env.local` to a long random string:

```bash
openssl rand -base64 32
```

Create the database tables and start the app:

```bash
npx drizzle-kit push
npm run dev
```

Open http://localhost:3000.

Without `OPENAI_API_KEY` the app runs in **demo mode**, which uses a simple local rule instead of AI. Add your key to `.env.local` to use the real model.

## Environment variables

| Name | Required | Description |
| --- | --- | --- |
| `SESSION_SECRET` | Yes | Secret used to sign the session cookie |
| `OPENAI_API_KEY` | No | Your OpenAI key. Empty means demo mode |
| `OPENAI_MODEL` | No | Model name, default `gpt-5-mini` |
| `DATABASE_URL` | No | `file:local.db` locally, your Turso URL in production |
| `DATABASE_AUTH_TOKEN` | Prod | Turso auth token |
| `FREE_DAILY_LIMIT` | No | Free briefs per user per day, default 5 |

## Project structure

```
src/
  proxy.ts               Optimistic redirect for /dashboard, /login, /signup
  actions/
    auth.ts              signup, login, logout (Server Actions)
    briefs.ts            generateBrief, deleteBrief (Server Actions)
  app/
    page.tsx             Landing page
    (auth)/login         Login page
    (auth)/signup        Sign-up page
    dashboard/page.tsx   Protected dashboard (streams behind Suspense)
  components/            AuthForm, GenerateForm, BriefCard, Logo
  db/
    schema.ts            users and briefs tables
    index.ts             Drizzle client (libSQL)
  lib/
    session.ts           JWT cookie: create, verify, delete
    auth.ts              getCurrentUser (Data Access Layer)
    ai.ts                OpenAI call with a Zod schema, plus demo mode
    usage.ts             Daily usage count
```

## How a brief is created

1. The user submits the form. `generateBrief` runs on the server.
2. `getCurrentUser()` checks the session. The client is never trusted.
3. Zod validates the notes (length limits stop abuse and runaway costs).
4. The daily limit is checked in the database.
5. `createBrief()` calls OpenAI with a Zod schema, so the result is typed JSON.
6. The brief is saved and the dashboard refreshes.

## Deploy

1. Create a database on [Turso](https://turso.tech) and copy the URL and token.
2. Run `npx drizzle-kit push` with `DATABASE_URL` and `DATABASE_AUTH_TOKEN` set to your Turso values.
3. Import the repo on [Vercel](https://vercel.com) and add the environment variables above.
4. Set a spending limit in your OpenAI account.

## Ideas to extend it

- Stripe subscriptions for a Pro plan with a higher limit
- Streaming responses
- Teams and shared briefs
- Export to Notion or email

## License

MIT
