# Production Checklist

Use this checklist before promoting a deployment or announcing a release.

## Environment Variables

Configure these in Vercel for the appropriate environments:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
OPENROUTER_API_KEY=
GEMINI_API_KEY=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXUS_REQUIRE_AUTH_FOR_CHAT=
NEXUS_GUEST_CHAT_LIMIT=
NEXUS_SIGNED_IN_CHAT_LIMIT=
NEXUS_CHAT_RATE_LIMIT_WINDOW_MS=
```

Rules:

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
- Never commit `.env.local`.
- Keep `.env.example` as placeholders only.
- Set `NEXUS_REQUIRE_AUTH_FOR_CHAT=true` if anonymous users should not be able to call the AI route.
- Keep guest chat limits low enough to protect provider spend.

## Clerk

- Use production Clerk keys for production deployments.
- Verify sign-in and sign-out on the deployed URL.
- Confirm allowed origins and redirect URLs include the Vercel domain.

## Supabase

- Confirm `chats` and `messages` tables exist.
- Apply migrations in `supabase/migrations` before deploying code that depends on new columns.
- Confirm Row Level Security is enabled.
- Confirm API routes validate the Clerk user before database access.
- Test create, rename, delete, refresh, and reload persistence.

## OpenRouter

- Confirm `OPENROUTER_API_KEY` is configured.
- Test at least two configured models.
- Confirm failed provider responses appear in the UI error state.
- Confirm `/api/chat` returns `429` after the configured guest or signed-in rate limit is exceeded.

## Vercel

- Run `pnpm lint`.
- Run `pnpm build`.
- Run the smoke checklist in `docs/smoke-test.md`.
- Test the deployed app on desktop and mobile.
- Smoke test chat creation, streaming, search, settings, and export.
