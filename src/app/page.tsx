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
    title: "If They Read It",
    question:
      "If you were 100% sure this person would read your message and could not reply, what would you write?",
    category: "Unsent",
    responses: 4288,
    echo: 67,
    avgThink: "21.6s",
  },
  {
    id: "last-message",
    title: "The Last Message",
    question:
      "There is someone whose last message you still remember. Do you think they remember it too?",
    category: "Memory",
    responses: 2197,
    echo: 41,
    avgThink: "14.3s",
  },
  {
    id: "how-much-in-story",
    title: "How Much Were You In Their Story?",
    question:
      "You thought you were a main character. What if you were only a passing scene?",
    category: "One-sided",
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
    label: "Love",
    analyzer:
      "This reads like something that stayed alive after the conversation ended.",
    echo: "41% wrote to someone who once felt like their whole world.",
    tone: "tender",
  },
  regret: {
    label: "Regret",
    analyzer: "This feels like words arriving later than they should have.",
    echo: "28% wrote an apology that never reached the person.",
    tone: "regretful",
  },
  goodbye: {
    label: "Goodbye",
    analyzer: "This is not a loud ending. It is a door left half open.",
    echo: "19% wrote to someone who will not return to the same place.",
    tone: "quiet",
  },
  gratitude: {
    label: "Gratitude",
    analyzer:
      "There is a small light here for someone who left a larger mark than they knew.",
    echo: "12% wrote a thank-you they did not say in time.",
    tone: "warm",
  },
};

const humanMap = [
  ["Wrote an apology", "43%"],
  ["Wrote to someone they lost", "21%"],
  ["Accidentally wrote to themselves", "18%"],
  ["Wrote to someone still present but far away", "16%"],
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
  const [note, setNote] = useState(
    "I wish you knew you mattered more than I ever said.",
  );
  const [sentiment, setSentiment] = useState<SentimentResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const activeExperiment =
    experiments.find((item) => item.id === activeId) ?? experiments[0];
  const isFirebaseReady = hasFirebaseConfig();

  useEffect(() => {
    if (!isFirebaseReady) {
      return;
    }

    const auth = getFirebaseAuth();
    const unsubscribe = auth.onAuthStateChanged((currentUser) =>
      setUser(currentUser),
    );
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
    const seed =
      activeExperiment.responses +
      activeExperiment.echo +
      reaction.length +
      roomCount;
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
    setRoomFeed((items) =>
      [`You added an echo: ${reactionCopy[nextReaction].label}`, ...items].slice(0, 5),
    );
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
    <main className="min-h-screen bg-[#030914] text-[#edf7ff]">
      <section className="relative min-h-screen overflow-hidden">
        <Image
          src="/brand/bg.png"
          alt="HumanBits emotional constellation background"
          fill
          priority
          className="object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#030914_0%,rgba(3,9,20,.92)_38%,rgba(3,9,20,.72)_100%)]" />

        <div className="relative grid min-h-screen grid-cols-1 gap-0 lg:grid-cols-[0.92fr_1.08fr]">
          <aside className="flex min-h-[560px] flex-col justify-between px-6 py-6 sm:px-10 lg:min-h-screen">
            <div>
              <Image
                src="/brand/logo.png"
                width={380}
                height={220}
                priority
                alt="HumanBits logo"
                className="h-auto w-56 rounded-md object-cover object-left-top sm:w-72"
              />
              <p className="mt-8 text-sm uppercase tracking-[0.28em] text-[#f0bd64]">
                Human Echo
              </p>
              <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight text-white sm:text-6xl">
                Because what you feel, someone else has felt too.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-[#d7e8f5]/78">
                HumanBits is not a quiz app. It is a privacy-first archive of
                anonymous human experiences, built around shared emotional echoes.
              </p>
            </div>

            <div className="grid gap-3 text-sm text-[#d7e8f5]/78 sm:grid-cols-3">
              <p>Privacy first.</p>
              <p>Human centered.</p>
              <p>Anonymous by choice.</p>
            </div>
          </aside>

          <section className="flex flex-col px-5 py-5 sm:px-8 lg:px-10">
            <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-white/12 pb-4">
              <div className="flex flex-wrap gap-2">
                {["Echo Cards", "Human Maps", "Time Machine"].map((item) => (
                  <button
                    key={item}
                    className="h-10 rounded-md border border-white/15 bg-white/5 px-4 text-sm font-medium text-[#edf7ff] backdrop-blur transition hover:border-[#f0bd64] hover:text-[#f0bd64]"
                  >
                    {item}
                  </button>
                ))}
              </div>
              {user ? (
                <button
                  onClick={() => signOutOfGoogle()}
                  className="min-h-10 rounded-md bg-[#f0bd64] px-4 text-sm font-semibold text-[#07101c] transition hover:bg-[#ffe0a0]"
                >
                  {user.displayName ?? "Signed in"} - Sign out
                </button>
              ) : (
                <button
                  onClick={handleGoogleLogin}
                  className="min-h-10 rounded-md bg-[#f0bd64] px-4 text-sm font-semibold text-[#07101c] transition hover:bg-[#ffe0a0]"
                >
                  Google Login
                </button>
              )}
            </nav>
            {!isFirebaseReady ? (
              <p className="mt-3 text-sm text-[#f0bd64]">
                Firebase is not configured on this deployment yet.
              </p>
            ) : null}
            {authError ? <p className="mt-3 text-sm text-[#ff8a80]">{authError}</p> : null}

            <div className="grid flex-1 gap-5 py-5 xl:grid-cols-[1fr_360px]">
              <div className="flex flex-col gap-5">
                <section className="rounded-lg border border-white/12 bg-[#07101c]/82 p-5 shadow-2xl backdrop-blur">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#78d7ff]">
                        Viral launch experiment
                      </p>
                      <h2 className="mt-2 text-3xl font-semibold text-white">
                        {activeExperiment.title}
                      </h2>
                    </div>
                    <span className="rounded-md bg-[#f0bd64]/18 px-3 py-2 text-sm font-semibold text-[#f0bd64]">
                      {activeExperiment.category}
                    </span>
                  </div>
                  <p className="mt-6 max-w-3xl text-2xl font-medium leading-relaxed text-[#edf7ff]">
                    {activeExperiment.question}
                  </p>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    className="mt-6 min-h-32 w-full rounded-md border border-white/15 bg-black/35 p-4 text-lg leading-8 text-[#edf7ff] outline-none placeholder:text-white/40 focus:border-[#78d7ff]"
                  />
                  <div className="mt-4 grid gap-3 sm:grid-cols-4">
                    {(Object.keys(reactionCopy) as Reaction[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => handleReaction(key)}
                        className={`min-h-12 rounded-md border px-3 text-sm font-semibold transition ${
                          reaction === key
                            ? "border-[#f0bd64] bg-[#f0bd64] text-[#07101c]"
                            : "border-white/15 bg-white/5 text-[#edf7ff] hover:border-[#f0bd64]"
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
                      className={`rounded-lg border p-4 text-left backdrop-blur transition ${
                        activeId === item.id
                          ? "border-[#78d7ff] bg-[#78d7ff]/12"
                          : "border-white/12 bg-[#07101c]/72 hover:border-[#78d7ff]"
                      }`}
                    >
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9fb6c8]">
                        {item.category}
                      </span>
                      <h3 className="mt-2 text-lg font-semibold text-white">{item.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-[#b7c9d8]">{item.question}</p>
                    </button>
                  ))}
                </section>

                <section className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-white/12 bg-[#07101c]/82 p-5 backdrop-blur">
                    <h3 className="text-xl font-semibold text-white">Echo Card</h3>
                    <div className="mt-4 rounded-lg border border-white/15 bg-black/45 p-5 text-[#edf7ff]">
                      <p className="text-sm uppercase tracking-[0.22em] text-[#f0bd64]">
                        You were not alone
                      </p>
                      <p className="mt-4 text-3xl font-semibold leading-tight">
                        {stats.echo}% felt something close to what you wrote.
                      </p>
                      <p className="mt-4 leading-7 text-[#d7e8f5]/76">
                        {reactionCopy[reaction].echo}
                      </p>
                      <button className="mt-5 min-h-11 rounded-md bg-[#78d7ff] px-4 text-sm font-semibold text-[#07101c]">
                        Share Echo
                      </button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/12 bg-[#07101c]/82 p-5 backdrop-blur">
                    <h3 className="text-xl font-semibold text-white">
                      AI as a gentle mirror
                    </h3>
                    <button
                      onClick={analyzeReaction}
                      disabled={isAnalyzing}
                      className="mt-4 min-h-11 rounded-md bg-[#f0bd64] px-4 text-sm font-semibold text-[#07101c] transition hover:bg-[#ffe0a0] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isAnalyzing ? "Analyzing..." : "Reflect this message"}
                    </button>
                    <p className="mt-4 leading-7 text-[#b7c9d8]">
                      {sentiment?.summary ?? reactionCopy[reaction].analyzer}
                    </p>
                    <div className="mt-5 rounded-md bg-black/45 px-4 py-3 font-mono text-sm text-[#edf7ff]">
                      tone={stats.sentiment}; sentiment=
                      {sentiment?.sentiment ?? "local"}; intensity=
                      {sentiment?.intensity ?? "n/a"}
                    </div>
                  </div>
                </section>

                <section className="overflow-hidden rounded-lg border border-white/12 bg-[#07101c]/82 p-4 backdrop-blur">
                  <Image
                    src="/brand/squiredscreens.png"
                    width={1400}
                    height={1400}
                    alt="HumanBits brand system and icon directions"
                    className="h-auto w-full rounded-md"
                  />
                </section>
              </div>

              <aside className="flex flex-col gap-5">
                <section className="rounded-lg border border-white/12 bg-[#07101c]/82 p-5 backdrop-blur">
                  <h2 className="text-xl font-semibold text-white">Human Maps</h2>
                  <p className="mt-2 text-sm leading-6 text-[#b7c9d8]">
                    Anonymous emotional geography, without names and without diagnosis.
                  </p>
                  <div className="mt-5 grid gap-3">
                    {humanMap.map(([label, value]) => (
                      <div key={label}>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="text-sm text-[#b7c9d8]">{label}</span>
                          <strong className="font-mono text-lg text-white">{value}</strong>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-[#78d7ff]"
                            style={{ width: value }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-lg border border-white/12 bg-[#07101c]/82 p-5 backdrop-blur">
                  <h2 className="text-xl font-semibold text-white">Time Machine</h2>
                  <div className="mt-4 rounded-md bg-white/8 p-4">
                    <p className="text-sm text-[#b7c9d8]">One year later, it asks:</p>
                    <p className="mt-3 text-lg font-semibold leading-7 text-white">
                      On June 6, 2026 you wrote: &quot;I wish you knew.&quot;
                    </p>
                    <p className="mt-3 text-sm text-[#b7c9d8]">
                      Do you still feel the same?
                    </p>
                  </div>
                </section>

                <section className="rounded-lg border border-white/12 bg-[#07101c]/82 p-5 backdrop-blur">
                  <h2 className="text-xl font-semibold text-white">Live Echo Feed</h2>
                  <div className="mt-4 space-y-2">
                    {roomFeed.map((item, index) => (
                      <p
                        key={`${item}-${index}`}
                        className="rounded-md bg-white/8 px-3 py-2 text-sm text-[#d7e8f5]"
                      >
                        {item}
                      </p>
                    ))}
                  </div>
                </section>

                <section className="rounded-lg border border-white/12 bg-[#07101c]/82 p-5 backdrop-blur">
                  <h2 className="text-xl font-semibold text-white">Dataset pulse</h2>
                  <div className="mt-5 grid gap-3">
                    {[
                      ["Anonymous echoes", stats.total.toLocaleString()],
                      ["Shared feeling", `${stats.echo}%`],
                      ["Avg reflection", activeExperiment.avgThink],
                      ["Countries", stats.countries.toString()],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between border-b border-white/10 pb-3 last:border-0 last:pb-0"
                      >
                        <span className="text-sm text-[#b7c9d8]">{label}</span>
                        <strong className="font-mono text-lg text-white">{value}</strong>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-lg border border-white/12 bg-[#07101c]/82 p-5 backdrop-blur">
                  <h2 className="text-xl font-semibold text-white">Support the lab</h2>
                  <div className="mt-4 grid gap-2">
                    {supportLinks.map((item) => (
                      <a
                        key={item.label}
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md border border-white/12 bg-white/5 px-3 py-2 text-sm font-semibold text-[#edf7ff] transition hover:border-[#f0bd64] hover:text-[#f0bd64]"
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                </section>
              </aside>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
