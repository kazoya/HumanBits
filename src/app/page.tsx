"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { User } from "firebase/auth";
import {
  getFirebaseAnalytics,
  getFirebaseAuth,
  getGoogleRedirectUser,
  hasFirebaseConfig,
  signInWithGoogle,
  signOutOfGoogle,
} from "@/lib/firebase";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Language = "ar" | "en";
type Theme = "light" | "dark";
type Reaction = "love" | "regret" | "goodbye" | "gratitude";

type SentimentResult = {
  tone: string;
  sentiment: string;
  intensity: number;
  tags: string[];
  summary: string;
  safetyNote: string;
};

const content = {
  ar: {
    dir: "rtl",
    nav: ["بطاقات الصدى", "خرائط المشاعر", "آلة الزمن"],
    login: "الدخول بجوجل",
    signOut: "تسجيل الخروج",
    theme: "الوضع",
    language: "EN",
    eyebrow: "Human Echo",
    headline: "لأن ما تشعر به... شعر به شخص آخر أيضًا.",
    subhead:
      "HumanBits ليس تطبيق أسئلة. هو أرشيف مجهول للتجارب الإنسانية، مبني حول الصدى العاطفي المشترك.",
    principles: ["الخصوصية أولًا", "إنساني في جوهره", "مجهول باختيارك"],
    launch: "تجربة الإطلاق",
    echoCard: "بطاقة الصدى",
    notAlone: "لم تكن وحدك",
    share: "شارك الصدى",
    mirror: "الذكاء الاصطناعي كمرآة لطيفة",
    reflect: "حلل الرسالة بلطف",
    analyzing: "جار التحليل...",
    maps: "خرائط المشاعر",
    mapsText: "خريطة مجهولة للنبض الإنساني، بدون أسماء وبدون تشخيص.",
    timeMachine: "آلة الزمن",
    oneYear: "بعد سنة، تسألك المنصة:",
    oldNote: "في 6 يونيو 2026 كتبت: &quot;أتمنى لو عرفت.&quot;",
    still: "هل ما زلت تشعر بذلك؟",
    feed: "نبض الصدى الحي",
    pulse: "نبض البيانات",
    support: "ادعم المختبر",
    firebaseMissing: "Firebase غير مضبوط على هذا النشر بعد.",
    textarea: "أتمنى لو عرفت أنك كنت مهمًا أكثر مما قلت لك.",
    echoLine: (percent: number) => `${percent}% شعروا بشيء قريب مما كتبت.`,
    stats: {
      echoes: "أصداء مجهولة",
      shared: "شعور مشترك",
      avg: "متوسط التأمل",
      countries: "الدول",
    },
    experiments: [
      {
        id: "if-they-read-it",
        title: "لو قرأها",
        question:
          "لو كنت متأكدًا 100% أن هذا الشخص سيقرأ رسالتك ولن يستطيع الرد، ماذا ستكتب؟",
        category: "رسائل لم ترسل",
        responses: 4288,
        echo: 67,
        avgThink: "21.6s",
      },
      {
        id: "last-message",
        title: "آخر رسالة",
        question:
          "هناك شخص ما زلت تتذكر آخر رسالة منه. هل تعتقد أنه يتذكرها أيضًا؟",
        category: "ذاكرة",
        responses: 2197,
        echo: 41,
        avgThink: "14.3s",
      },
      {
        id: "how-much-in-story",
        title: "كم كنت في قصته؟",
        question:
          "كنت تعتقد أنك شخصية رئيسية. ماذا لو كنت مجرد مشهد عابر؟",
        category: "من طرف واحد",
        responses: 1861,
        echo: 53,
        avgThink: "17.9s",
      },
    ],
    reactions: {
      love: {
        label: "حب",
        analyzer: "تبدو كشيء بقي حيًا بعد انتهاء المحادثة.",
        echo: "41% كتبوا لشخص كان عالمهم لفترة.",
        tone: "tender",
      },
      regret: {
        label: "ندم",
        analyzer: "هذه كلمات وصلت متأخرة أكثر مما يجب.",
        echo: "28% كتبوا اعتذارًا لم يصل لصاحبه.",
        tone: "regretful",
      },
      goodbye: {
        label: "وداع",
        analyzer: "ليست نهاية صاخبة، بل باب بقي نصف مفتوح.",
        echo: "19% كتبوا لشخص لن يعود إلى نفس المكان.",
        tone: "quiet",
      },
      gratitude: {
        label: "امتنان",
        analyzer: "فيها ضوء صغير لشخص ترك أثرًا أكبر مما يعرف.",
        echo: "12% كتبوا شكرًا لم يقولوه في وقته.",
        tone: "warm",
      },
    },
    humanMap: [
      ["كتبوا اعتذارًا", "43%"],
      ["كتبوا لشخص فقدوه", "21%"],
      ["كتبوا لأنفسهم دون أن ينتبهوا", "18%"],
      ["كتبوا لشخص حاضر لكنه بعيد", "16%"],
    ],
    feedItems: [
      "Human Echo: 67% ما زالوا يتذكرون شخصًا لا يتحدثون معه.",
      "ضيف من عمّان كتب رسالة لم ترسل.",
    ],
  },
  en: {
    dir: "ltr",
    nav: ["Echo Cards", "Human Maps", "Time Machine"],
    login: "Google Login",
    signOut: "Sign out",
    theme: "Theme",
    language: "عربي",
    eyebrow: "Human Echo",
    headline: "Because what you feel, someone else has felt too.",
    subhead:
      "HumanBits is not a quiz app. It is a privacy-first archive of anonymous human experiences, built around shared emotional echoes.",
    principles: ["Privacy first", "Human centered", "Anonymous by choice"],
    launch: "Viral launch experiment",
    echoCard: "Echo Card",
    notAlone: "You were not alone",
    share: "Share Echo",
    mirror: "AI as a gentle mirror",
    reflect: "Reflect this message",
    analyzing: "Analyzing...",
    maps: "Human Maps",
    mapsText: "Anonymous emotional geography, without names and without diagnosis.",
    timeMachine: "Time Machine",
    oneYear: "One year later, it asks:",
    oldNote: "On June 6, 2026 you wrote: &quot;I wish you knew.&quot;",
    still: "Do you still feel the same?",
    feed: "Live Echo Feed",
    pulse: "Dataset pulse",
    support: "Support the lab",
    firebaseMissing: "Firebase is not configured on this deployment yet.",
    textarea: "I wish you knew you mattered more than I ever said.",
    echoLine: (percent: number) =>
      `${percent}% felt something close to what you wrote.`,
    stats: {
      echoes: "Anonymous echoes",
      shared: "Shared feeling",
      avg: "Avg reflection",
      countries: "Countries",
    },
    experiments: [
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
    ],
    reactions: {
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
    },
    humanMap: [
      ["Wrote an apology", "43%"],
      ["Wrote to someone they lost", "21%"],
      ["Accidentally wrote to themselves", "18%"],
      ["Wrote to someone still present but far away", "16%"],
    ],
    feedItems: [
      "Human Echo: 67% still remember someone they no longer talk to.",
      "Guest from Amman wrote an unsent message.",
    ],
  },
} as const;

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

function formatAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  if (
    message.includes("CONFIGURATION_NOT_FOUND") ||
    message.includes("configuration-not-found")
  ) {
    return "Firebase Auth is not fully configured. Enable Authentication, enable Google provider, and add human-bits.vercel.app to Authorized domains.";
  }

  if (message.includes("popup-blocked")) {
    return "The browser blocked the Google popup. Redirect sign-in is now enabled; please try again.";
  }

  if (message.includes("unauthorized-domain")) {
    return "This domain is not authorized in Firebase Auth. Add human-bits.vercel.app in Firebase Authentication settings.";
  }

  return message;
}

export default function Home() {
  const [language, setLanguage] = useState<Language>("ar");
  const [theme, setTheme] = useState<Theme>("light");
  const [activeId, setActiveId] = useState<string>(content.ar.experiments[0].id);
  const [reaction, setReaction] = useState<Reaction>("regret");
  const [user, setUser] = useState<User | null>(null);
  const [roomCount, setRoomCount] = useState(118);
  const [roomFeed, setRoomFeed] = useState<string[]>([...content.ar.feedItems]);
  const [note, setNote] = useState<string>(content.ar.textarea);
  const [sentiment, setSentiment] = useState<SentimentResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const copy = content[language];
  const activeExperiment =
    copy.experiments.find((item) => item.id === activeId) ?? copy.experiments[0];
  const isFirebaseReady = hasFirebaseConfig();
  const isDark = theme === "dark";
  const isRtl = language === "ar";

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = copy.dir;
  }, [copy.dir, language]);

  useEffect(() => {
    if (!isFirebaseReady) {
      return;
    }

    const auth = getFirebaseAuth();
    const unsubscribe = auth.onAuthStateChanged((currentUser) =>
      setUser(currentUser),
    );
    void getFirebaseAnalytics();
    void getGoogleRedirectUser()
      .then((redirectUser) => {
        if (redirectUser) {
          setUser(redirectUser);
        }
      })
      .catch((error) => setAuthError(formatAuthError(error)));

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
      sentiment: sentiment?.tone ?? copy.reactions[reaction].tone,
    };
  }, [activeExperiment, copy.reactions, reaction, roomCount, sentiment]);

  async function handleGoogleLogin() {
    setAuthError(null);

    try {
      if (!isFirebaseReady) {
        throw new Error(copy.firebaseMissing);
      }

      await signInWithGoogle();
    } catch (error) {
      setAuthError(formatAuthError(error));
    }
  }

  function switchLanguage() {
    const nextLanguage = isRtl ? "en" : "ar";
    setLanguage(nextLanguage);
    setNote(content[nextLanguage].textarea);
    setRoomFeed([...content[nextLanguage].feedItems]);
  }

  async function handleReaction(nextReaction: Reaction) {
    setReaction(nextReaction);
    setRoomFeed((items) =>
      [
        `${isRtl ? "أضفت صدى" : "You added an echo"}: ${copy.reactions[nextReaction].label}`,
        ...items,
      ].slice(0, 5),
    );
    setRoomCount((count) => count + 1);

    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.channel(`human-echo:${activeId}`).send({
        type: "broadcast",
        event: "echo",
        payload: {
          label: copy.reactions[nextReaction].label,
          experimentId: activeId,
        },
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

  const styles = {
    main: isDark ? "bg-[#030914] text-[#edf7ff]" : "bg-[#f7fbff] text-[#07101c]",
    overlay: isDark
      ? "bg-[linear-gradient(90deg,#030914_0%,rgba(3,9,20,.92)_38%,rgba(3,9,20,.72)_100%)]"
      : "bg-[linear-gradient(90deg,rgba(247,251,255,.96)_0%,rgba(247,251,255,.9)_42%,rgba(247,251,255,.68)_100%)]",
    card: isDark
      ? "border-white/12 bg-[#07101c]/82 text-[#edf7ff]"
      : "border-[#dbe7f0] bg-white/82 text-[#07101c]",
    muted: isDark ? "text-[#b7c9d8]" : "text-[#526475]",
    heading: isDark ? "text-white" : "text-[#07101c]",
    soft: isDark ? "bg-white/8" : "bg-[#eaf4fb]",
    border: isDark ? "border-white/12" : "border-[#dbe7f0]",
    primary: isDark
      ? "bg-[#f0bd64] text-[#07101c] hover:bg-[#ffe0a0]"
      : "bg-[#0e3150] text-white hover:bg-[#174a75]",
    accentText: isDark ? "text-[#f0bd64]" : "text-[#b87921]",
  };

  return (
    <main className={`min-h-screen ${styles.main}`} dir={copy.dir}>
      <section className="relative min-h-screen overflow-hidden">
        <Image
          src="/brand/bg.png"
          alt="HumanBits emotional constellation background"
          fill
          priority
          className={`object-cover ${isDark ? "opacity-55" : "opacity-18"}`}
        />
        <div className={`absolute inset-0 ${styles.overlay}`} />

        <div className="relative grid min-h-screen grid-cols-1 gap-0 lg:grid-cols-[0.92fr_1.08fr]">
          <aside className="flex min-h-[560px] flex-col justify-between px-6 py-6 sm:px-10 lg:min-h-screen">
            <div>
              <Image
                src="/brand/logo.png"
                width={380}
                height={220}
                priority
                alt="HumanBits logo"
                className={`h-auto w-56 rounded-md object-cover object-left-top sm:w-72 ${
                  isDark ? "" : "shadow-xl shadow-[#18324d]/10"
                }`}
              />
              <p className={`mt-8 text-sm uppercase tracking-[0.28em] ${styles.accentText}`}>
                {copy.eyebrow}
              </p>
              <h1 className={`mt-4 max-w-xl text-4xl font-semibold leading-tight sm:text-6xl ${styles.heading}`}>
                {copy.headline}
              </h1>
              <p className={`mt-5 max-w-xl text-lg leading-8 ${styles.muted}`}>
                {copy.subhead}
              </p>
            </div>

            <div className={`grid gap-3 text-sm ${styles.muted} sm:grid-cols-3`}>
              {copy.principles.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </aside>

          <section className="flex flex-col px-5 py-5 sm:px-8 lg:px-10">
            <nav className={`flex flex-wrap items-center justify-between gap-3 border-b ${styles.border} pb-4`}>
              <div className="flex flex-wrap gap-2">
                {copy.nav.map((item) => (
                  <button
                    key={item}
                    className={`h-10 rounded-md border px-4 text-sm font-medium backdrop-blur transition ${styles.border} ${
                      isDark
                        ? "bg-white/5 text-[#edf7ff] hover:border-[#f0bd64] hover:text-[#f0bd64]"
                        : "bg-white/70 text-[#0e3150] hover:border-[#0e3150]"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setTheme(isDark ? "light" : "dark")}
                  className={`min-h-10 rounded-md border px-4 text-sm font-semibold ${styles.border}`}
                >
                  {copy.theme}: {isDark ? "Dark" : "Light"}
                </button>
                <button
                  onClick={switchLanguage}
                  className={`min-h-10 rounded-md border px-4 text-sm font-semibold ${styles.border}`}
                >
                  {copy.language}
                </button>
                {user ? (
                  <button
                    onClick={() => signOutOfGoogle()}
                    className={`min-h-10 rounded-md px-4 text-sm font-semibold transition ${styles.primary}`}
                  >
                    {user.displayName ?? "Signed in"} - {copy.signOut}
                  </button>
                ) : (
                  <button
                    onClick={handleGoogleLogin}
                    className={`min-h-10 rounded-md px-4 text-sm font-semibold transition ${styles.primary}`}
                  >
                    {copy.login}
                  </button>
                )}
              </div>
            </nav>
            {!isFirebaseReady ? (
              <p className={`mt-3 text-sm ${styles.accentText}`}>{copy.firebaseMissing}</p>
            ) : null}
            {authError ? <p className="mt-3 text-sm text-[#c7423a]">{authError}</p> : null}

            <div className="grid flex-1 gap-5 py-5 xl:grid-cols-[1fr_360px]">
              <div className="flex flex-col gap-5">
                <section className={`rounded-lg border p-5 shadow-2xl backdrop-blur ${styles.card}`}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#2f9fca]">
                        {copy.launch}
                      </p>
                      <h2 className={`mt-2 text-3xl font-semibold ${styles.heading}`}>
                        {activeExperiment.title}
                      </h2>
                    </div>
                    <span className="rounded-md bg-[#f0bd64]/18 px-3 py-2 text-sm font-semibold text-[#b87921]">
                      {activeExperiment.category}
                    </span>
                  </div>
                  <p className={`mt-6 max-w-3xl text-2xl font-medium leading-relaxed ${styles.heading}`}>
                    {activeExperiment.question}
                  </p>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    className={`mt-6 min-h-32 w-full rounded-md border p-4 text-lg leading-8 outline-none focus:border-[#2f9fca] ${
                      isDark
                        ? "border-white/15 bg-black/35 text-[#edf7ff] placeholder:text-white/40"
                        : "border-[#dbe7f0] bg-white/85 text-[#07101c]"
                    }`}
                  />
                  <div className="mt-4 grid gap-3 sm:grid-cols-4">
                    {(Object.keys(copy.reactions) as Reaction[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => handleReaction(key)}
                        className={`min-h-12 rounded-md border px-3 text-sm font-semibold transition ${
                          reaction === key
                            ? "border-[#f0bd64] bg-[#f0bd64] text-[#07101c]"
                            : `${styles.border} ${isDark ? "bg-white/5 text-[#edf7ff]" : "bg-white/75 text-[#0e3150]"} hover:border-[#f0bd64]`
                        }`}
                      >
                        {copy.reactions[key].label}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                  {copy.experiments.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveId(item.id)}
                      className={`rounded-lg border p-4 backdrop-blur transition ${
                        activeId === item.id
                          ? "border-[#2f9fca] bg-[#78d7ff]/14"
                          : `${styles.card} hover:border-[#2f9fca]`
                      } ${isRtl ? "text-right" : "text-left"}`}
                    >
                      <span className={`text-xs font-semibold uppercase tracking-[0.16em] ${styles.muted}`}>
                        {item.category}
                      </span>
                      <h3 className={`mt-2 text-lg font-semibold ${styles.heading}`}>{item.title}</h3>
                      <p className={`mt-3 text-sm leading-6 ${styles.muted}`}>{item.question}</p>
                    </button>
                  ))}
                </section>

                <section className="grid gap-4 md:grid-cols-2">
                  <div className={`rounded-lg border p-5 backdrop-blur ${styles.card}`}>
                    <h3 className={`text-xl font-semibold ${styles.heading}`}>{copy.echoCard}</h3>
                    <div className={`mt-4 rounded-lg border p-5 ${isDark ? "border-white/15 bg-black/45" : "border-[#dbe7f0] bg-[#07101c] text-[#edf7ff]"}`}>
                      <p className="text-sm uppercase tracking-[0.22em] text-[#f0bd64]">
                        {copy.notAlone}
                      </p>
                      <p className="mt-4 text-3xl font-semibold leading-tight">
                        {copy.echoLine(stats.echo)}
                      </p>
                      <p className="mt-4 leading-7 text-[#d7e8f5]/76">
                        {copy.reactions[reaction].echo}
                      </p>
                      <button className="mt-5 min-h-11 rounded-md bg-[#78d7ff] px-4 text-sm font-semibold text-[#07101c]">
                        {copy.share}
                      </button>
                    </div>
                  </div>

                  <div className={`rounded-lg border p-5 backdrop-blur ${styles.card}`}>
                    <h3 className={`text-xl font-semibold ${styles.heading}`}>
                      {copy.mirror}
                    </h3>
                    <button
                      onClick={analyzeReaction}
                      disabled={isAnalyzing}
                      className={`mt-4 min-h-11 rounded-md px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${styles.primary}`}
                    >
                      {isAnalyzing ? copy.analyzing : copy.reflect}
                    </button>
                    <p className={`mt-4 leading-7 ${styles.muted}`}>
                      {sentiment?.summary ?? copy.reactions[reaction].analyzer}
                    </p>
                    <div className={`mt-5 rounded-md px-4 py-3 font-mono text-sm ${isDark ? "bg-black/45 text-[#edf7ff]" : "bg-[#eaf4fb] text-[#07101c]"}`}>
                      tone={stats.sentiment}; sentiment=
                      {sentiment?.sentiment ?? "local"}; intensity=
                      {sentiment?.intensity ?? "n/a"}
                    </div>
                  </div>
                </section>

                <section className={`overflow-hidden rounded-lg border p-4 backdrop-blur ${styles.card}`}>
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
                <section className={`rounded-lg border p-5 backdrop-blur ${styles.card}`}>
                  <h2 className={`text-xl font-semibold ${styles.heading}`}>{copy.maps}</h2>
                  <p className={`mt-2 text-sm leading-6 ${styles.muted}`}>
                    {copy.mapsText}
                  </p>
                  <div className="mt-5 grid gap-3">
                    {copy.humanMap.map(([label, value]) => (
                      <div key={label}>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className={`text-sm ${styles.muted}`}>{label}</span>
                          <strong className={`font-mono text-lg ${styles.heading}`}>{value}</strong>
                        </div>
                        <div className={`h-2 overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-[#dbe7f0]"}`}>
                          <div
                            className="h-full rounded-full bg-[#2f9fca]"
                            style={{ width: value }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className={`rounded-lg border p-5 backdrop-blur ${styles.card}`}>
                  <h2 className={`text-xl font-semibold ${styles.heading}`}>
                    {copy.timeMachine}
                  </h2>
                  <div className={`mt-4 rounded-md p-4 ${styles.soft}`}>
                    <p className={`text-sm ${styles.muted}`}>{copy.oneYear}</p>
                    <p
                      className={`mt-3 text-lg font-semibold leading-7 ${styles.heading}`}
                      dangerouslySetInnerHTML={{ __html: copy.oldNote }}
                    />
                    <p className={`mt-3 text-sm ${styles.muted}`}>{copy.still}</p>
                  </div>
                </section>

                <section className={`rounded-lg border p-5 backdrop-blur ${styles.card}`}>
                  <h2 className={`text-xl font-semibold ${styles.heading}`}>{copy.feed}</h2>
                  <div className="mt-4 space-y-2">
                    {roomFeed.map((item, index) => (
                      <p
                        key={`${item}-${index}`}
                        className={`rounded-md px-3 py-2 text-sm ${styles.soft} ${styles.muted}`}
                      >
                        {item}
                      </p>
                    ))}
                  </div>
                </section>

                <section className={`rounded-lg border p-5 backdrop-blur ${styles.card}`}>
                  <h2 className={`text-xl font-semibold ${styles.heading}`}>{copy.pulse}</h2>
                  <div className="mt-5 grid gap-3">
                    {[
                      [copy.stats.echoes, stats.total.toLocaleString()],
                      [copy.stats.shared, `${stats.echo}%`],
                      [copy.stats.avg, activeExperiment.avgThink],
                      [copy.stats.countries, stats.countries.toString()],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className={`flex items-center justify-between border-b pb-3 last:border-0 last:pb-0 ${styles.border}`}
                      >
                        <span className={`text-sm ${styles.muted}`}>{label}</span>
                        <strong className={`font-mono text-lg ${styles.heading}`}>{value}</strong>
                      </div>
                    ))}
                  </div>
                </section>

                <section className={`rounded-lg border p-5 backdrop-blur ${styles.card}`}>
                  <h2 className={`text-xl font-semibold ${styles.heading}`}>{copy.support}</h2>
                  <div className="mt-4 grid gap-2">
                    {supportLinks.map((item) => (
                      <a
                        key={item.label}
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${styles.border} ${
                          isDark
                            ? "bg-white/5 text-[#edf7ff] hover:border-[#f0bd64] hover:text-[#f0bd64]"
                            : "bg-white/75 text-[#0e3150] hover:border-[#0e3150]"
                        }`}
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
