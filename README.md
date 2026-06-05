# HumanBits

HumanBits is an anonymous emotional dataset for the small human moments people rarely say out loud.

The product is **Human Echo**: aggregate emotional reflections that answer the question people care about most: "Am I the only one?"

The current viral launch experiment is **لو قرأها**:

> لو كنت متأكدًا أن هذا الشخص سيقرأ رسالتك ولن يستطيع الرد، ماذا ستكتب؟

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
- Echo Cards for shareable aggregate insights
- Human Maps for anonymous emotional trends
- Time Machine concept for returning to past reflections
- Dataset pulse metrics
- Anonymous-use and consent messaging
- Local visual asset for the product interface

## Environment variables

Copy `.env.example` to `.env.local` for local development. Add the same variables in Vercel project settings.

Firebase identifiers are public client config. Keep `OPENAI_API_KEY` server-only and do not expose it with a `NEXT_PUBLIC_` prefix.

## Later

- Supabase tables for durable echoes, experiments, and consent
- Creator/admin dashboards with real aggregate emotional maps
- Share-image generation for Echo Cards
- Personal archive and one-year reflection reminders
- Real support accounts for Buy Me a Coffee, Ko-fi, or Patreon
