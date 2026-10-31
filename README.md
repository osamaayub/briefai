# BriefAI: AI SaaS Starter (Next.js 16 + Drizzle + OpenAI)

Turn messy meeting notes into a short summary and a clear list of action items.

BriefAI is a small but complete AI SaaS starter. It shows the parts every real AI product needs: sign up and login, a database, a protected dashboard, a server-side AI call with structured output, input validation, and a free-plan usage limit.

Built for the YouTube tutorial on [@osamaayubdev](https://www.youtube.com/@osamaayubdev): [watch the build](https://youtu.be/AF0uYuU0z_M). The code exactly as shown in the video is on the [`video-version`](https://github.com/osamaayub/briefai/tree/video-version) branch; `main` has the refactored, production-style architecture described below.

## Features

- Email and password auth (bcrypt hashing, signed JWT in an httpOnly cookie)
- Route protection with Next.js `proxy.ts`, plus a real check on the server for every action
- Race-safe daily limits, structured logging, security headers, unit tests and CI
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
cp .env.example .env.local      # set SESSION_SECRET (openssl rand -base64 32)
npm run db:migrate              # create the tables from drizzle/ migrations
npm run dev
```

Open http://localhost:3000. Without `OPENAI_API_KEY` the app runs in **demo mode**, which uses a simple local rule instead of AI.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run check` | Lint, type-check and unit tests |
| `npm test` | Vitest unit tests |
| `npm run db:generate` | Create a new SQL migration after editing the schema |
| `npm run db:migrate` | Apply migrations |
| `npm run db:studio` | Browse the database |

## Environment variables

Validated with Zod on first use (`src/server/env.ts`). A missing or invalid value fails fast with a clear message.

| Name | Required | Description |
| --- | --- | --- |
| `SESSION_SECRET` | Yes | 32+ characters, signs the session cookie |
| `OPENAI_API_KEY` | No | Empty means demo mode |
| `OPENAI_MODEL` | No | Default `gpt-5-mini` |
| `DATABASE_URL` | No | `file:local.db` locally, Turso URL in production |
| `DATABASE_AUTH_TOKEN` | Prod | Turso auth token |
| `FREE_DAILY_LIMIT` | No | Briefs per user per day, default 5 |

## Architecture

Feature-first structure with clear layers. Each layer only depends on the one below it.

```
src/
  app/                         Routes only: pages, layouts, error and loading UI
  proxy.ts                     Optimistic redirects (no database)
  components/                  Shared UI (Logo, FormError, SubmitButton)
  lib/result.ts                Result and ActionState types
  server/
    env.ts                     Typed, validated configuration
    logger.ts                  Structured JSON logs
    db/schema.ts, client.ts    Drizzle schema, indexes, client
  features/
    auth/
      actions.ts               Server Actions: signup, login, logout
      schemas.ts               Zod input schemas
      components/              AuthForm
      server/
        token.ts               JWT sign/verify (pure, shared with proxy)
        session.ts             Cookie handling
        password.ts            bcrypt with timing-safe failed logins
        user-repository.ts     All user SQL
        current-user.ts        Data Access Layer (request-deduped)
    briefs/
      actions.ts               Thin Server Actions: auth, call service, refresh
      schemas.ts, types.ts     Input and AI output schemas, domain types
      components/              GenerateForm, BriefList, BriefCard, UsageCard
      server/
        brief-service.ts       Business rules (framework-free, unit-tested)
        brief-repository.ts    All brief SQL, atomic limit insert
        ai/generator.ts        BriefGenerator interface (port)
        ai/openai-generator.ts OpenAI adapter (structured output, retries, timeout)
        ai/demo-generator.ts   Offline adapter
        index.ts               Composition root: wires adapters into the service
```

### Request flow: generating a brief

```
Form (useActionState)
  -> generateBrief (Server Action)       authenticate with getCurrentUser()
    -> briefService.generate()           validate, check limit, call AI
      -> BriefGenerator.generate()       OpenAI or demo, behind one interface
      -> briefRepository.insertWithinLimit()   count + insert in one transaction
  <- Result<Brief, BriefError>           expected failures are values, not exceptions
  -> refresh()                           dashboard re-renders with the new brief
```

### Design decisions

- **Service layer with dependency injection.** `createBriefService({ repo, generator, dailyLimit })` has no Next.js, SDK or database imports, so the business rules are tested with fakes in milliseconds.
- **Ports and adapters for AI.** Adding Anthropic or Gemini means writing one class that implements `BriefGenerator` and choosing it in `ai/index.ts`.
- **Race-safe usage limits.** The limit is checked before the AI call (to avoid paying for a brief the user can't keep) and enforced again atomically in a write transaction. Eight parallel requests cannot go over the limit.
- **Results, not exceptions,** for expected failures (`INVALID_INPUT`, `LIMIT_REACHED`, `AI_FAILED`). Unexpected errors are logged and hit the route's `error.tsx`.
- **Security.** httpOnly signed cookies, server-side authorisation in every action, ownership checks on delete, constant-time-ish failed logins (no email enumeration), input length limits, security headers, `server-only` on every module that reads secrets or the database.
- **Migrations, not `push`.** SQL migrations are committed in `drizzle/` and applied in CI and deploys. A composite index on `(user_id, created_at)` backs the dashboard and limit queries.
- **CI.** GitHub Actions runs lint, type-check, tests, migrations and a production build on every push.

## Tests

```bash
npm test
```

Covers the brief service (creation, validation, daily limit, per-user limits, AI failure, ownership), the demo generator, auth schemas and session tokens.

## Deploy

1. Create a database on [Turso](https://turso.tech) and copy the URL and token.
2. Run `npm run db:migrate` with `DATABASE_URL` and `DATABASE_AUTH_TOKEN` set to your Turso values.
3. Import the repo on [Vercel](https://vercel.com) and add the environment variables above.
4. Set a spending limit in your OpenAI account.

## Ideas to extend it

- Login rate limiting (for example Upstash Ratelimit) and email verification
- Stripe subscriptions for a Pro plan with a higher limit
- Streaming responses
- Teams and shared briefs
- Export to Notion or email

## License

MIT
