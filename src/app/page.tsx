"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { User } from "firebase/auth";
import {
  getFirebaseAnalytics,
  getFirebaseAuth,
  hasFirebaseConfig,
  signInWithGoogle,
  signOutOfGoogle,
} from "@/lib/firebase";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Reaction = "love" | "regret" | "goodbye" | "gratitude";

type SentimentResult = {
  tone: string;
  sentiment: string;
  intensity: number;
  tags: string[];
  summary: string;
  safetyNote: string;
};

const experiments = [
  {
    id: "if-they-read-it",
    title: "لو قرأها",
    question: "لو كنت متأكدًا أن هذا الشخص سيقرأ رسالتك ولن يستطيع الرد، ماذا ستكتب؟",
    category: "Unsent",
    country: "Arab world",
    responses: 4288,
    echo: 67,
    avgThink: "21.6s",
  },
  {
    id: "last-message",
    title: "آخر رسالة",
    question: "هناك شخص ما زلت تتذكر آخر رسالة منه. هل تعتقد أنه يتذكرها أيضًا؟",
    category: "Memory",
    country: "Jordan",
    responses: 2197,
    echo: 41,
    avgThink: "14.3s",
  },
  {
    id: "how-much-in-story",
    title: "كم كنت في قصته؟",
    question: "كنت تعتقد أنك بطل القصة. ماذا لو كنت عنده مجرد مشهد عابر؟",
    category: "One-sided",
    country: "UAE",
    responses: 1861,
    echo: 53,
    avgThink: "17.9s",
  },
];

const reactionCopy: Record<
  Reaction,
  { label: string; analyzer: string; echo: string; tone: string }
> = {
  love: {
    label: "حب",
    analyzer: "الرسالة تبدو كأنها شيء بقي حيًا حتى بعد أن انتهت المحادثة.",
    echo: "41% كتبوا لشخص كان عالمهم لفترة.",
    tone: "tender",
  },
  regret: {
    label: "ندم",
    analyzer: "فيها محاولة متأخرة لقول شيء تأخر أكثر مما يجب.",
    echo: "28% كتبوا اعتذارًا لم يجد طريقه لصاحبه.",
    tone: "regretful",
  },
  goodbye: {
    label: "وداع",
    analyzer: "هذه ليست نهاية صاخبة، بل باب بقي نصف مفتوح.",
    echo: "19% كتبوا لشخص لن يعود إلى نفس المكان.",
    tone: "quiet",
  },
  gratitude: {
    label: "امتنان",
    analyzer: "في الرسالة ضوء صغير لشخص ترك أثرًا أكبر مما يعرف.",
    echo: "12% كتبوا شكرًا لم يقولوه في وقته.",
    tone: "warm",
  },
};

const humanMap = [
  ["كتبوا اعتذارًا", "43%"],
  ["كتبوا لشخص فقدوه", "21%"],
  ["كتبوا لأنفسهم دون أن ينتبهوا", "18%"],
  ["كتبوا لشخص ما زال موجودًا لكن بعيدًا", "16%"],
];

const supportLinks = [
  {
    label: "Buy Me a Coffee",
    href:
      process.env.NEXT_PUBLIC_BUY_ME_A_COFFEE_URL ??
      "https://www.buymeacoffee.com/Asrawi612",
  },
  {
    label: "Ko-fi",
    href: process.env.NEXT_PUBLIC_KOFI_URL ?? "https://ko-fi.com/",
  },
  {
    label: "Patreon",
    href: process.env.NEXT_PUBLIC_PATREON_URL ?? "https://www.patreon.com/",
  },
];

export default function Home() {
  const [activeId, setActiveId] = useState(experiments[0].id);
  const [reaction, setReaction] = useState<Reaction>("regret");
  const [user, setUser] = useState<User | null>(null);
  const [roomCount, setRoomCount] = useState(118);
  const [roomFeed, setRoomFeed] = useState<string[]>([
    "Human Echo: 67% still remember someone they no longer talk to.",
    "Guest from Amman wrote an unsent message.",
  ]);
  const [note, setNote] = useState("كنت أتمنى لو عرفت أنك كنت مهمًا أكثر مما قلت لك.");
  const [sentiment, setSentiment] = useState<SentimentResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const activeExperiment = experiments.find((item) => item.id === activeId) ?? experiments[0];
  const isFirebaseReady = hasFirebaseConfig();

  useEffect(() => {
    if (!isFirebaseReady) {
      return;
    }

    const auth = getFirebaseAuth();
    const unsubscribe = auth.onAuthStateChanged((currentUser) => setUser(currentUser));
    void getFirebaseAnalytics();

    return unsubscribe;
  }, [isFirebaseReady]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let channel: RealtimeChannel | null = null;

    if (supabase) {
      channel = supabase.channel(`human-echo:${activeId}`);
      channel
        .on("broadcast", { event: "echo" }, ({ payload }) => {
          const label = String(payload?.label ?? "new echo");
          setRoomFeed((items) => [`Live echo: ${label}`, ...items].slice(0, 5));
          setRoomCount((count) => count + 1);
        })
        .subscribe();
    }

    return () => {
      if (channel) {
        void supabase?.removeChannel(channel);
      }
    };
  }, [activeId]);

  const stats = useMemo(() => {
    const seed = activeExperiment.responses + activeExperiment.echo + reaction.length + roomCount;
    return {
      total: activeExperiment.responses + seed * 2,
      echo: Math.min(94, activeExperiment.echo + (reaction === "regret" ? 6 : 0)),
      countries: 18 + (seed % 9),
      sentiment: sentiment?.tone ?? reactionCopy[reaction].tone,
    };
  }, [activeExperiment, reaction, roomCount, sentiment]);

  async function handleGoogleLogin() {
    setAuthError(null);

    try {
      if (!isFirebaseReady) {
        throw new Error("Firebase is not configured on this deployment yet.");
      }

      await signInWithGoogle();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Google sign-in failed.");
    }
  }

  async function handleReaction(nextReaction: Reaction) {
    setReaction(nextReaction);
    setRoomFeed((items) => [`You added an echo: ${reactionCopy[nextReaction].label}`, ...items].slice(0, 5));
    setRoomCount((count) => count + 1);

    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.channel(`human-echo:${activeId}`).send({
        type: "broadcast",
        event: "echo",
        payload: { label: reactionCopy[nextReaction].label, experimentId: activeId },
      });
    }
  }

  async function analyzeReaction() {
    setIsAnalyzing(true);
    setSentiment(null);

    try {
      const response = await fetch("/api/sentiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: note, experimentId: activeId }),
      });
      const data = (await response.json()) as SentimentResult;
      setSentiment(data);
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f4ea] text-[#182027]">
      <section className="grid min-h-screen grid-cols-1 gap-0 lg:grid-cols-[0.88fr_1.12fr]">
        <aside className="flex min-h-[560px] flex-col justify-between bg-[#182027] px-6 py-6 text-[#fffaf0] sm:px-10 lg:min-h-screen">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-[#e6b143]">HumanBits</p>
              <h1 className="mt-3 max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">
                Wikipedia للمشاعر التي لا نقولها بصوت عال.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-[#fffaf0]/76">
                لسنا تطبيق أسئلة. نحن نبني أكبر أرشيف مجهول للحظات والمشاعر الصغيرة في العالم العربي.
              </p>
            </div>
            <div className="hidden rounded-md border border-[#fffaf0]/20 px-3 py-2 text-sm text-[#fffaf0]/80 sm:block">
              Human Echo
            </div>
          </div>

          <div className="my-8 overflow-hidden rounded-lg border border-[#fffaf0]/15 bg-[#fffaf0]/5">
            <Image
              src="/humanbits-lab.png"
              width={1400}
              height={900}
              priority
              alt="HumanBits anonymous emotional dataset interface"
              className="h-auto w-full object-cover"
            />
          </div>

          <div className="grid gap-3 text-sm text-[#fffaf0]/78 sm:grid-cols-3">
            <p>Anonymous emotional dataset.</p>
            <p>Echo Cards built for sharing.</p>
            <p>Time Machine for returning memories.</p>
          </div>
        </aside>

        <section className="flex flex-col px-5 py-5 sm:px-8 lg:px-10">
          <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-[#182027]/12 pb-4">
            <div className="flex flex-wrap gap-2">
              {["Echo Cards", "Human Maps", "Time Machine"].map((item) => (
                <button
                  key={item}
                  className="h-10 rounded-md border border-[#182027]/15 px-4 text-sm font-medium transition hover:border-[#eb5954] hover:text-[#eb5954]"
                >
                  {item}
                </button>
              ))}
            </div>
            {user ? (
              <button
                onClick={() => signOutOfGoogle()}
                className="min-h-10 rounded-md bg-[#182027] px-4 text-sm font-semibold text-[#fffaf0] transition hover:bg-[#2a373f]"
              >
                {user.displayName ?? "Signed in"} · Sign out
              </button>
            ) : (
              <button
                onClick={handleGoogleLogin}
                className="min-h-10 rounded-md bg-[#182027] px-4 text-sm font-semibold text-[#fffaf0] transition hover:bg-[#2a373f]"
              >
                Google Login
              </button>
            )}
          </nav>
          {!isFirebaseReady ? (
            <p className="mt-3 text-sm text-[#b93834]">
              Firebase is not configured on this deployment yet.
            </p>
          ) : null}
          {authError ? <p className="mt-3 text-sm text-[#b93834]">{authError}</p> : null}

          <div className="grid flex-1 gap-5 py-5 xl:grid-cols-[1fr_360px]">
            <div className="flex flex-col gap-5">
              <section className="rounded-lg border border-[#182027]/12 bg-[#fffdf6] p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#2a916e]">
                      Viral launch experiment
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
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="mt-6 min-h-32 w-full rounded-md border border-[#182027]/15 bg-white p-4 text-right text-lg leading-8 outline-none focus:border-[#2a916e]"
                />
                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  {(Object.keys(reactionCopy) as Reaction[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => handleReaction(key)}
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
                      {item.category}
                    </span>
                    <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#5d6870]">{item.question}</p>
                  </button>
                ))}
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-[#182027]/12 bg-[#fffdf6] p-5">
                  <h3 className="text-xl font-semibold">Echo Card</h3>
                  <div className="mt-4 rounded-lg border border-[#182027]/15 bg-[#182027] p-5 text-[#fffaf0]">
                    <p className="text-sm uppercase tracking-[0.22em] text-[#e6b143]">You were not alone</p>
                    <p className="mt-4 text-3xl font-semibold leading-tight">
                      {stats.echo}% شعروا بشيء قريب مما كتبت.
                    </p>
                    <p className="mt-4 leading-7 text-[#fffaf0]/76">
                      {reactionCopy[reaction].echo}
                    </p>
                    <button className="mt-5 min-h-11 rounded-md bg-[#eb5954] px-4 text-sm font-semibold text-white">
                      Share Echo
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-[#182027]/12 bg-[#fffdf6] p-5">
                  <h3 className="text-xl font-semibold">AI as a gentle mirror</h3>
                  <button
                    onClick={analyzeReaction}
                    disabled={isAnalyzing}
                    className="mt-4 min-h-11 rounded-md bg-[#2a916e] px-4 text-sm font-semibold text-white transition hover:bg-[#237b5d] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isAnalyzing ? "Analyzing..." : "Reflect this message"}
                  </button>
                  <p className="mt-4 leading-7 text-[#4a5560]">
                    {sentiment?.summary ?? reactionCopy[reaction].analyzer}
                  </p>
                  <div className="mt-5 rounded-md bg-[#182027] px-4 py-3 font-mono text-sm text-[#fffaf0]">
                    tone={stats.sentiment}; sentiment={sentiment?.sentiment ?? "local"};
                    intensity={sentiment?.intensity ?? "n/a"}
                  </div>
                </div>
              </section>
            </div>

            <aside className="flex flex-col gap-5">
              <section className="rounded-lg border border-[#182027]/12 bg-[#fffdf6] p-5">
                <h2 className="text-xl font-semibold">Human Maps</h2>
                <p className="mt-2 text-sm leading-6 text-[#5d6870]">
                  خريطة مجهولة للنبض الإنساني الجماعي، بدون أسماء وبدون تشخيص.
                </p>
                <div className="mt-5 grid gap-3">
                  {humanMap.map(([label, value]) => (
                    <div key={label}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-sm text-[#5d6870]">{label}</span>
                        <strong className="font-mono text-lg">{value}</strong>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#182027]/10">
                        <div className="h-full rounded-full bg-[#2a916e]" style={{ width: value }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-[#182027]/12 bg-[#fffdf6] p-5">
                <h2 className="text-xl font-semibold">Time Machine</h2>
                <div className="mt-4 rounded-md bg-[#e1f0ec] p-4">
                  <p className="text-sm text-[#5d6870]">بعد سنة سيعود السؤال:</p>
                  <p className="mt-3 text-lg font-semibold leading-7">
                    في 5 يونيو 2026 كتبت: “أتمنى لو عرفت.”
                  </p>
                  <p className="mt-3 text-sm text-[#5d6870]">هل ما زلت تشعر بذلك؟</p>
                </div>
              </section>

              <section className="rounded-lg border border-[#182027]/12 bg-[#fffdf6] p-5">
                <h2 className="text-xl font-semibold">Live Echo Feed</h2>
                <div className="mt-4 space-y-2">
                  {roomFeed.map((item, index) => (
                    <p key={`${item}-${index}`} className="rounded-md bg-[#f7f4ea] px-3 py-2 text-sm">
                      {item}
                    </p>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-[#182027]/12 bg-[#fffdf6] p-5">
                <h2 className="text-xl font-semibold">Dataset pulse</h2>
                <div className="mt-5 grid gap-3">
                  {[
                    ["Anonymous echoes", stats.total.toLocaleString()],
                    ["Shared feeling", `${stats.echo}%`],
                    ["Avg reflection", activeExperiment.avgThink],
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
                <h2 className="text-xl font-semibold">Support the lab</h2>
                <div className="mt-4 grid gap-2">
                  {supportLinks.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md border border-[#182027]/12 bg-white px-3 py-2 text-sm font-semibold transition hover:border-[#eb5954] hover:text-[#eb5954]"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </section>
      </section>
    </main>
  );
}
