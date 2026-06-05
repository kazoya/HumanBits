import { NextResponse } from "next/server";

const experiments = [
  {
    id: "if-they-read-it",
    title: "لو قرأها",
    prompt: "لو كنت متأكدًا أن هذا الشخص سيقرأ رسالتك ولن يستطيع الرد، ماذا ستكتب؟",
    stats: {
      anonymousEchoes: 4288,
      sharedFeelingRate: 67,
      averageReflectionSeconds: 21.6,
      topEchoes: ["اعتذار", "شخص فقدوه", "رسالة للنفس"],
    },
  },
  {
    id: "last-message",
    title: "آخر رسالة",
    prompt: "هناك شخص ما زلت تتذكر آخر رسالة منه. هل تعتقد أنه يتذكرها أيضًا؟",
    stats: {
      anonymousEchoes: 2197,
      sharedFeelingRate: 41,
      averageReflectionSeconds: 14.3,
      topEchoes: ["حنين", "عدم إغلاق", "ذكرى من طرف واحد"],
    },
  },
  {
    id: "how-much-in-story",
    title: "كم كنت في قصته؟",
    prompt: "كنت تعتقد أنك بطل القصة. ماذا لو كنت عنده مجرد مشهد عابر؟",
    stats: {
      anonymousEchoes: 1861,
      sharedFeelingRate: 53,
      averageReflectionSeconds: 17.9,
      topEchoes: ["مقارنة", "تعلق", "دهشة"],
    },
  },
];

export function GET() {
  return NextResponse.json({
    positioning:
      "HumanBits is an anonymous emotional dataset, not a moral scoring app.",
    safetyRule:
      "Every experiment should move through pain, confession, shared echo, and a small hopeful exit.",
    experiments,
  });
}
