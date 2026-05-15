# Nexus Next

Nexus Next is a modern multi-model AI chat workspace built with Next.js 16, React 19, Clerk, OpenRouter, and Supabase.

Live beta: [https://nexusnext.vercel.app](https://nexusnext.vercel.app)

The project currently focuses on a clean chat foundation: streaming responses, model switching, authentication UI, markdown rendering, Supabase persistence, search, settings, exports, and a componentized App Router structure that can grow into uploads, RAG, and agents.

## Features

- Multi-model chat through OpenRouter
- Streaming assistant responses
- Supabase chat and message persistence for signed-in users
- Local chat history persistence for signed-out users
- Chat create, rename, delete, regenerate, and stop-generation controls
- Chat search across loaded titles and messages
- Settings panel for model, temperature, and system prompt
- Chat export to Markdown and JSON
- Markdown rendering with GitHub Flavored Markdown support
- Clerk authentication UI
- Next.js 16 `proxy.ts` convention
- Componentized chat UI and extracted hooks

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Clerk
- OpenRouter
- Supabase
- React Markdown

## Getting Started

Install dependencies:

```bash
pnpm install
```

Create your local environment file:

```bash
cp .env.example .env.local
```

Fill in the required values in `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
OPENROUTER_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
```

## Project Structure

```txt
app/
  api/chat/route.ts
  api/chats/
  components/chat/
  components/layout/
  components/settings/
  hooks/
  types/
lib/
  ai/
  markdown/
  supabase/
  utils/
  supabase.ts
proxy.ts
```

Important modules:

- `app/hooks/useChats.ts` manages local chat state and persistence.
- `app/hooks/useStreamingChat.ts` manages send, stream, abort, and error state.
- `app/hooks/useChatSettings.ts` manages persisted model behavior settings.
- `lib/ai/models.ts` defines the available model registry.
- `lib/ai/openrouter.ts` owns OpenRouter API integration.
- `lib/markdown/renderer.tsx` owns markdown rendering.
- `lib/utils/export-chat.ts` owns Markdown and JSON chat export.
- `lib/supabase/server.ts` owns the server-only Supabase admin client.

## Environment Safety

Do not commit `.env.local` or any real secret values. The repository includes `.env.example` only as a safe template.

## Roadmap

- File and image attachments
- PDF export
- Theme controls
- Supabase-backed full-text search
- RAG and agent workflows
- Public landing page

See [docs/roadmap.md](docs/roadmap.md) for the fuller plan.
