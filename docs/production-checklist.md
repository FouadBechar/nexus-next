# Production Checklist

Use this checklist before promoting a deployment or announcing a release.

## Environment Variables

Configure these in Vercel for the appropriate environments:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
OPENROUTER_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Rules:

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
- Never commit `.env.local`.
- Keep `.env.example` as placeholders only.

## Clerk

- Use production Clerk keys for production deployments.
- Verify sign-in and sign-out on the deployed URL.
- Confirm allowed origins and redirect URLs include the Vercel domain.

## Supabase

- Confirm `chats` and `messages` tables exist.
- Confirm Row Level Security is enabled.
- Confirm API routes validate the Clerk user before database access.
- Test create, rename, delete, refresh, and reload persistence.

## OpenRouter

- Confirm `OPENROUTER_API_KEY` is configured.
- Test at least two configured models.
- Confirm failed provider responses appear in the UI error state.

## Vercel

- Run `pnpm lint`.
- Run `pnpm build`.
- Test the deployed app on desktop and mobile.
- Smoke test chat creation, streaming, search, settings, and export.
