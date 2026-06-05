# HumanBits Product Blueprint

## One-Line Vision

HumanBits is a privacy-first archive of anonymous human experiences that helps people discover: "I am not the only one who felt this."

## Product Thesis

HumanBits should not behave like a quiz app. It should behave like an emotional dataset, a living atlas of private human moments. The core product is Human Echo: aggregated, anonymous emotional evidence that many people carry similar memories, fears, regrets, hopes, and discoveries.

## Core Principles

- Privacy before growth.
- Reflection before judgment.
- Aggregate insight before individual exposure.
- Emotional safety before virality.
- AI as a gentle mirror, not a therapist or authority.
- Every experience should move through pain, confession, shared echo, and a small hopeful exit.

## User Roles

| Role | Capabilities |
| --- | --- |
| Guest | Browse public experiences, answer lightweight prompts, view limited Echo Cards. |
| Registered User | Save personal archive, revisit Time Machine entries, follow themes, manage consent. |
| Google Login User | Fast auth through Firebase, optional profile, private dashboard. |
| Moderator | Review flagged stories, hide unsafe content, approve featured anonymous stories. |
| Administrator | Manage experiments, analytics, moderation rules, AI labels, abuse patterns, and exports. |

## Story Submission Workflow

1. User selects an experience prompt.
2. User chooses anonymous or private-account mode.
3. User writes a short response or story.
4. System asks for consent: aggregate analytics, public anonymous display, Time Machine reminder.
5. AI detects emotion, themes, risk level, summary, and similar echoes.
6. User sees Human Echo results and an Echo Card.
7. User can share card, save privately, or submit to anonymous public wall.
8. Moderation queue receives risky or public-display stories.

## AI System

### AI Emotion Detection

Detect only soft reflective labels:

- longing
- regret
- gratitude
- grief
- uncertainty
- tenderness
- closure
- loneliness
- hope

Never diagnose, moralize, or infer protected traits.

### AI Summary

```json
{
  "emotion": "regret",
  "intensity": 0.62,
  "summary": "A message that sounds like an apology arriving late.",
  "themes": ["unsaid words", "missed timing"],
  "safetyLevel": "normal"
}
```

### Similar Experience Matching

Use embeddings for anonymous text matching. Match by emotional theme, not identity or personal details.

Recommended flow:

- Store sanitized story text.
- Generate embedding.
- Match against experiences with the same consent level.
- Return aggregate echoes, not raw private stories.

## Recommendation Engine

Inputs:

- Recent themes answered.
- Emotional state labels.
- User-chosen interests.
- Time since last heavy prompt.
- Safety pacing.

Rules:

- Do not chain too many painful prompts.
- Alternate depth with lighter reflection.
- Recommend hopeful or closure-oriented prompts after intense stories.

## Database Design

Supabase/PostgreSQL tables:

```sql
create table profiles (
  id uuid primary key,
  firebase_uid text unique,
  display_name text,
  country text,
  age_range text,
  interests text[],
  created_at timestamptz default now()
);

create table experiments (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  prompt text not null,
  theme text not null,
  intensity_level int default 1,
  status text default 'draft',
  created_at timestamptz default now()
);

create table stories (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid references experiments(id),
  profile_id uuid references profiles(id),
  body text not null,
  anonymous boolean default true,
  public_anonymous boolean default false,
  consent_aggregate boolean default false,
  consent_time_machine boolean default false,
  country text,
  created_at timestamptz default now()
);

create table ai_analyses (
  id uuid primary key default gen_random_uuid(),
  story_id uuid references stories(id),
  emotion text,
  sentiment text,
  intensity numeric,
  summary text,
  themes text[],
  safety_level text,
  model text,
  created_at timestamptz default now()
);

create table reactions (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid references experiments(id),
  story_id uuid references stories(id),
  profile_id uuid references profiles(id),
  reaction text,
  created_at timestamptz default now()
);

create table moderation_events (
  id uuid primary key default gen_random_uuid(),
  story_id uuid references stories(id),
  status text,
  reason text,
  moderator_id uuid references profiles(id),
  created_at timestamptz default now()
);

create table time_machine_entries (
  id uuid primary key default gen_random_uuid(),
  story_id uuid references stories(id),
  profile_id uuid references profiles(id),
  remind_at timestamptz,
  status text default 'scheduled',
  created_at timestamptz default now()
);
```

## Backend Architecture

- Next.js Route Handlers for app APIs.
- Supabase Postgres for durable data.
- Supabase Realtime for live rooms.
- Firebase Auth for Google login.
- OpenAI Responses API for emotion analysis and summaries.
- Background jobs later for Time Machine reminders and digest emails.

## API Design

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/experiments` | List active experiences. |
| `POST` | `/api/stories` | Submit anonymous or account-linked story. |
| `POST` | `/api/sentiment` | Analyze emotion and summary. |
| `GET` | `/api/echo/:experimentId` | Return aggregate Human Echo stats. |
| `GET` | `/api/maps` | Emotional heatmap dashboard data. |
| `POST` | `/api/moderation/report` | Report unsafe content. |
| `POST` | `/api/time-machine` | Schedule future reflection. |

## Frontend Architecture

- Landing/experience page: emotional entry point.
- Experiment view: prompt, response, consent, AI reflection.
- Echo Card: shareable insight.
- Human Maps: aggregate emotional dashboard.
- Time Machine: private archive and future reflection.
- Moderator dashboard: flagged stories and actions.
- Admin dashboard: experiments, analytics, growth, and safety.

## UI Wireframes

### Viral Experience

```text
[HumanBits]
Anonymous emotional dataset

[Prompt]
If they read it and could not reply, what would you write?

[Story textarea]
[Emotion chips]
[Submit anonymously]

[Echo Card]
You were not alone.
67% felt something close to this.
[Share]
```

### Human Maps

```text
Human Maps
This week:
43% wrote an apology
21% wrote to someone they lost
18% wrote to themselves
16% wrote to someone still present but far away
```

## Brand Identity

- Tone: tender, intelligent, restrained, safe.
- Visual language: warm paper, deep ink, muted red, human green, amber light.
- Avoid: therapy branding, medical language, moral scoring, dark doom aesthetic.
- Tagline: Small echoes of what we never say out loud.

## Landing Page Copy

Headline:

> You were not the only one.

Subhead:

> HumanBits collects anonymous human experiences and turns them into shared emotional echoes.

CTA:

> Write an anonymous echo

Trust line:

> Anonymous by default. Aggregate by design. AI as reflection, not diagnosis.

## Viral Sharing System

Echo Cards should be generated as clean square images:

- "You were not alone."
- Main statistic.
- One emotional insight.
- HumanBits logo.
- No private text unless the user explicitly chooses to include it.

## Gamification

Use soft, non-addictive progress:

- Reflection streaks.
- Themes explored.
- Echoes contributed.
- Kindness badges.
- No leaderboards for pain.
- No public ranking of emotional depth.

## Analytics Dashboard

Track:

- submissions by theme
- completion rate
- share rate
- repeat visits
- intense prompt drop-off
- moderation rate
- consent rate
- Time Machine return rate
- top Echo Cards

## Privacy-First Architecture

- Anonymous mode as default.
- Separate identity from story content.
- Store consent per story.
- Aggregate analytics only after consent.
- Never show private stories in matching.
- Allow deletion.
- Avoid collecting precise location.
- Encrypt sensitive fields later.
- Public anonymous wall requires moderation.

## HumanBits AI Companion

Positioning:

> A gentle reflection companion that helps users understand what they wrote without diagnosing them.

Boundaries:

- No therapy claims.
- No crisis handling beyond safe resource guidance.
- No romantic advice authority.
- No "you should contact them" recommendations.

## Monetization Strategy

### Consumer

- HumanBits Plus:
  - private archive
  - Time Machine reminders
  - deeper reflection summaries
  - personal emotional journey
  - premium Echo Card themes

### Creator/Research

- Anonymous trend dashboards.
- Themed report packs.
- Cultural emotional maps.

### Enterprise

- Employee sentiment reflection tools.
- Anonymous pulse maps.
- Wellbeing insights without surveillance.

## Investor Pitch Structure

1. Problem: People feel alone in private emotions, and current social platforms reward performance.
2. Solution: Anonymous emotional experiences with aggregate Human Echo insights.
3. Product: prompts, stories, Echo Cards, Human Maps, Time Machine.
4. Market: mental wellness adjacency, social sharing, anonymous communities, cultural insights.
5. Differentiation: privacy-first emotional dataset for the Arab world.
6. Growth: shareable Echo Cards and viral prompts.
7. Moat: consented anonymous emotional dataset and matching graph.
8. Business model: subscriptions, insights, enterprise dashboards.
9. Safety: moderation, consent, non-clinical AI, privacy architecture.
10. Roadmap: MVP, scale, enterprise, global.

## MVP Version

Build next:

1. Durable Supabase `experiments` and `stories`.
2. Story submission with consent.
3. AI emotion summary stored per story.
4. Human Echo aggregates.
5. Shareable Echo Card image.
6. Basic moderation queue.
7. Google login with private archive.

## Enterprise Version

- Organization spaces.
- Anonymous employee reflection rooms.
- Admin heatmaps.
- Custom prompt packs.
- Exportable aggregate reports.
- Strict privacy and minimum-group thresholds.

## Future VR Mode

VR should not be an early feature. Later it can become:

- anonymous memory rooms
- shared echo galleries
- immersive grief/closure rituals
- guided reflection environments

## Patent-Worthy Directions

Not legal advice, but possible areas to discuss with a patent attorney:

- Privacy-preserving emotional echo matching.
- Time-delayed reflection loops that compare past and present emotional state.
- Consent-aware anonymous story aggregation and share-card generation.
- Emotion pacing algorithms that prevent overexposure to heavy prompts.
- Cross-cultural emotional heatmaps with minimum-group anonymity thresholds.

## Global Scaling Roadmap

### 0-3 Months

- Launch one killer experience: If They Read It.
- Add story persistence, Echo Cards, moderation.
- Validate share rate and return rate.

### 3-6 Months

- Add Human Maps, Time Machine, personal archive.
- Add Arabic/English prompt library.
- Add paid Plus tier.

### 6-12 Months

- Build creator/admin tools.
- Launch cultural reports.
- Add partnerships with creators and communities.

### 1-3 Years

- Enterprise dashboards.
- Multilingual expansion.
- Research-grade anonymous emotional dataset.

## Biggest Risk

HumanBits could become a digital graveyard for sadness.

Mitigation:

Every experience must include shared echo and a hopeful exit.

## Highest-Leverage Next Step

Build the full submission-to-Echo-Card loop for one experience only: If They Read It.
