"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type Reaction = "agree" | "skip" | "laugh" | "reflect";

const experiments = [
  {
    id: "ten-quroosh",
    title: "عشر قروش",
    question: "إذا قرأت هذا: هل تدفع عشر قروش لشخص محتاج اليوم؟",
    category: "Generosity",
    country: "Jordan",
    responses: 1284,
    agree: 62,
    avgThink: "7.4s",
  },
  {
    id: "kind-note",
    title: "رسالة لغريب",
    question: "اكتب جملة واحدة قد تنقذ يوم شخص لا تعرفه.",
    category: "Empathy",
    country: "UAE",
    responses: 842,
    agree: 78,
    avgThink: "11.2s",
  },
  {
    id: "awkward-truth",
    title: "اعتراف صغير",
    question: "ما الشيء البسيط الذي تخجل منه لكنه إنساني جدًا؟",
    category: "Honesty",
    country: "KSA",
    responses: 611,
    agree: 54,
    avgThink: "18.9s",
  },
];

const reactionCopy: Record<
  Reaction,
  { label: string; analyzer: string; score: string; tone: string }
> = {
  agree: {
    label: "أوافق",
    analyzer: "استجابة إنسانية مباشرة مع ميل للتصرف.",
    score: "73% chaotic good",
    tone: "Generous",
  },
  skip: {
    label: "مش اليوم",
    analyzer: "تردد مفهوم: الفكرة أثارت مقاومة خفيفة بدل رفض كامل.",
    score: "48% practical skeptic",
    tone: "Careful",
  },
  laugh: {
    label: "ضحكت",
    analyzer: "رد ساخر/لطيف، قابل للتحول إلى مشاركة اجتماعية.",
    score: "81% playful human",
    tone: "Humorous",
  },
  reflect: {
    label: "خلتني أفكر",
    analyzer: "استجابة تأملية: ليست قرارًا سريعًا، لكنها تفاعل عميق.",
    score: "69% reflective soul",
    tone: "Reflective",
  },
};

export default function Home() {
  const [activeId, setActiveId] = useState(experiments[0].id);
  const [reaction, setReaction] = useState<Reaction>("reflect");
  const activeExperiment = experiments.find((item) => item.id === activeId) ?? experiments[0];

  const stats = useMemo(() => {
    const seed = activeExperiment.responses + activeExperiment.agree + reaction.length;
    return {
      total: activeExperiment.responses + seed * 2,
      agree: Math.min(94, activeExperiment.agree + (reaction === "agree" ? 8 : 0)),
      countries: 18 + (seed % 9),
      sentiment: reactionCopy[reaction].tone,
    };
  }, [activeExperiment, reaction]);

  return (
    <main className="min-h-screen bg-[#f7f4ea] text-[#182027]">
      <section className="grid min-h-screen grid-cols-1 gap-0 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="flex min-h-[520px] flex-col justify-between bg-[#182027] px-6 py-6 text-[#fffaf0] sm:px-10 lg:min-h-screen">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-[#e6b143]">HumanBits</p>
              <h1 className="mt-3 max-w-lg text-4xl font-semibold leading-tight sm:text-5xl">
                تجارب إنسانية صغيرة تكشف ردودًا كبيرة.
              </h1>
            </div>
            <div className="hidden rounded-md border border-[#fffaf0]/20 px-3 py-2 text-sm text-[#fffaf0]/80 sm:block">
              MVP
            </div>
          </div>

          <div className="my-8 overflow-hidden rounded-lg border border-[#fffaf0]/15 bg-[#fffaf0]/5">
            <Image
              src="/humanbits-lab.png"
              width={1400}
              height={900}
              priority
              alt="HumanBits experiment dashboard illustration"
              className="h-auto w-full object-cover"
            />
          </div>

          <div className="grid gap-3 text-sm text-[#fffaf0]/78 sm:grid-cols-3">
            <p>Anonymous-first reactions.</p>
            <p>Playful AI analysis, not moral judgment.</p>
            <p>Built for Vercel, Neon, and Google OAuth later.</p>
          </div>
        </aside>

        <section className="flex flex-col px-5 py-5 sm:px-8 lg:px-10">
          <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-[#182027]/12 pb-4">
            <div className="flex flex-wrap gap-2">
              {["Guest view", "Creator", "Admin"].map((item) => (
                <button
                  key={item}
                  className="h-10 rounded-md border border-[#182027]/15 px-4 text-sm font-medium transition hover:border-[#eb5954] hover:text-[#eb5954]"
                >
                  {item}
                </button>
              ))}
            </div>
            <button className="h-10 rounded-md bg-[#182027] px-4 text-sm font-semibold text-[#fffaf0] transition hover:bg-[#2a373f]">
              Google Login
            </button>
          </nav>

          <div className="grid flex-1 gap-5 py-5 xl:grid-cols-[1fr_360px]">
            <div className="flex flex-col gap-5">
              <section className="rounded-lg border border-[#182027]/12 bg-[#fffdf6] p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#2a916e]">
                      Live tiny experiment
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold">{activeExperiment.title}</h2>
                  </div>
                  <span className="rounded-md bg-[#e6b143]/18 px-3 py-2 text-sm font-semibold">
                    {activeExperiment.category}
                  </span>
                </div>
                <p className="mt-6 max-w-3xl text-2xl font-medium leading-relaxed">
                  {activeExperiment.question}
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-4">
                  {(Object.keys(reactionCopy) as Reaction[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => setReaction(key)}
                      className={`min-h-12 rounded-md border px-3 text-sm font-semibold transition ${
                        reaction === key
                          ? "border-[#eb5954] bg-[#eb5954] text-white"
                          : "border-[#182027]/15 bg-white hover:border-[#eb5954]"
                      }`}
                    >
                      {reactionCopy[key].label}
                    </button>
                  ))}
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-3">
                {experiments.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveId(item.id)}
                    className={`rounded-lg border p-4 text-right transition ${
                      activeId === item.id
                        ? "border-[#2a916e] bg-[#e1f0ec]"
                        : "border-[#182027]/12 bg-white hover:border-[#2a916e]"
                    }`}
                  >
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5d6870]">
                      {item.country}
                    </span>
                    <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#5d6870]">{item.question}</p>
                  </button>
                ))}
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-[#182027]/12 bg-[#fffdf6] p-5">
                  <h3 className="text-xl font-semibold">AI Reaction Analyzer</h3>
                  <p className="mt-3 leading-7 text-[#4a5560]">{reactionCopy[reaction].analyzer}</p>
                  <div className="mt-5 rounded-md bg-[#182027] px-4 py-3 font-mono text-sm text-[#fffaf0]">
                    tone={stats.sentiment}; use=anonymous_statistics
                  </div>
                </div>
                <div className="rounded-lg border border-[#182027]/12 bg-[#fffdf6] p-5">
                  <h3 className="text-xl font-semibold">Humanity Score</h3>
                  <p className="mt-3 text-4xl font-semibold text-[#eb5954]">
                    {reactionCopy[reaction].score}
                  </p>
                  <p className="mt-3 leading-7 text-[#4a5560]">
                    مؤشر ترفيهي للتأمل والمشاركة، وليس تقييمًا أخلاقيًا أو علميًا.
                  </p>
                </div>
              </section>
            </div>

            <aside className="flex flex-col gap-5">
              <section className="rounded-lg border border-[#182027]/12 bg-[#fffdf6] p-5">
                <h2 className="text-xl font-semibold">Admin pulse</h2>
                <div className="mt-5 grid gap-3">
                  {[
                    ["Responses", stats.total.toLocaleString()],
                    ["Agree rate", `${stats.agree}%`],
                    ["Avg thinking", activeExperiment.avgThink],
                    ["Countries", stats.countries.toString()],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between border-b border-[#182027]/10 pb-3 last:border-0 last:pb-0"
                    >
                      <span className="text-sm text-[#5d6870]">{label}</span>
                      <strong className="font-mono text-lg">{value}</strong>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-[#182027]/12 bg-[#fffdf6] p-5">
                <h2 className="text-xl font-semibold">Creator checklist</h2>
                <div className="mt-4 space-y-3 text-sm leading-6 text-[#4a5560]">
                  <p>Nickname, country, interests, optional age.</p>
                  <p>Terms, privacy, and consent for anonymous aggregate analysis.</p>
                  <p>Experiment prompts, comments, reaction speed, and country-level stats.</p>
                </div>
              </section>

              <section className="rounded-lg border border-[#182027]/12 bg-[#fffdf6] p-5">
                <h2 className="text-xl font-semibold">Premium later</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["Deep AI analysis", "Custom themes", "Advanced stats", "Live rooms"].map(
                    (item) => (
                      <span key={item} className="rounded-md bg-[#e1f0ec] px-3 py-2 text-sm">
                        {item}
                      </span>
                    ),
                  )}
                </div>
              </section>
            </aside>
          </div>
        </section>
      </section>
    </main>
  );
}
