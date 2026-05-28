# HumanBits

HumanBits is a playful MVP for tiny human experiments: quick prompts, anonymous reactions, creator insights, and a light AI-style reaction analyzer.

The first iconic experiment is **عشر قروش**: "Would you give ten qirsh to someone in need today?"

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Ready for Vercel

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## MVP scope

- Guest-friendly experiment viewer
- Interactive reaction buttons
- Firebase Google sign-in
- Supabase-ready live experiment rooms
- OpenAI-backed sentiment API with a safe fallback when `OPENAI_API_KEY` is missing
- Creator experiment cards
- Basic admin analytics preview
- Anonymous-use and consent messaging
- Local visual asset for the product interface

## Environment variables

Copy `.env.example` to `.env.local` for local development. Add the same variables in Vercel project settings.

Firebase identifiers are public client config. Keep `OPENAI_API_KEY` server-only and do not expose it with a `NEXT_PUBLIC_` prefix.

## Later

- Supabase tables for durable experiments and reactions
- Creator/admin dashboards with real aggregate queries
- Real support accounts for Buy Me a Coffee, Ko-fi, or Patreon
