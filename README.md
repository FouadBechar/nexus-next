# Nexus Next

Nexus Next is a modern multi-model AI chat workspace built with Next.js 16, React 19, Clerk, OpenRouter, and Supabase-ready architecture.

The project currently focuses on a clean chat foundation: streaming responses, model switching, authentication UI, markdown rendering, local chat persistence, and a componentized App Router structure that can grow into database sync, search, uploads, RAG, and agents.

## Features

- Multi-model chat through OpenRouter
- Streaming assistant responses
- Local chat history persistence
- Chat create, rename, delete, regenerate, and stop-generation controls
- Markdown rendering with GitHub Flavored Markdown support
- Clerk authentication UI
- Next.js 16 `proxy.ts` convention
- Componentized chat UI and extracted hooks
- Supabase client foundation for future database persistence

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
  components/chat/
  components/layout/
  hooks/
  types/
lib/
  ai/
  markdown/
  supabase.ts
proxy.ts
```

Important modules:

- `app/hooks/useChats.ts` manages local chat state and persistence.
- `app/hooks/useStreamingChat.ts` manages send, stream, abort, and error state.
- `lib/ai/models.ts` defines the available model registry.
- `lib/ai/openrouter.ts` owns OpenRouter API integration.
- `lib/markdown/renderer.tsx` owns markdown rendering.

## Environment Safety

Do not commit `.env.local` or any real secret values. The repository includes `.env.example` only as a safe template.

## Roadmap

- Supabase database persistence for chats and messages
- User chat sync after sign-in
- Message search
- Settings panel for model behavior, system prompt, and theme
- File and image attachments
- Chat export to Markdown, JSON, and PDF
- RAG and agent workflows
- Public landing page
- Vercel deployment
