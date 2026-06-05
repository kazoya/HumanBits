# HumanBits

HumanBits is an anonymous emotional dataset for the small human moments people rarely say out loud.

The product is **Human Echo**: aggregate emotional reflections that answer the question people care about most: "Am I the only one?"

The current viral launch experiment is **If They Read It**:

> If you were 100% sure this person would read your message and could not reply, what would you write?

## Product blueprint

The full product, architecture, growth, privacy, AI, monetization, and investor roadmap lives in:

[HumanBits Product Blueprint](docs/HUMANBITS_BLUEPRINT.md)

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Firebase Auth
- Supabase Realtime-ready
- OpenAI Responses API-ready
- Vercel

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## MVP scope

- Guest-friendly experience viewer
- Interactive reaction buttons
- Firebase Google sign-in
- Supabase-ready live rooms
- OpenAI-backed sentiment API with a safe fallback when `OPENAI_API_KEY` is missing
- Echo Cards for shareable aggregate insights
- Human Maps for anonymous emotional trends
- Time Machine concept for returning to past reflections
- Dataset pulse metrics
- Anonymous-use and consent messaging
- Local visual asset for the product interface

## Environment variables

Copy `.env.example` to `.env.local` for local development. Add the same variables in Vercel project settings.

Firebase identifiers are public client config. Keep `OPENAI_API_KEY` server-only and do not expose it with a `NEXT_PUBLIC_` prefix.
