import { NextResponse } from "next/server";

const experiments = [
  {
    id: "ten-quroosh",
    title: "عشر قروش",
    prompt: "هل تدفع عشر قروش لشخص محتاج اليوم؟",
    stats: {
      responses: 1284,
      agreeRate: 62,
      averageThinkingSeconds: 7.4,
      topCountries: ["Jordan", "UAE", "KSA"],
    },
  },
  {
    id: "kind-note",
    title: "رسالة لغريب",
    prompt: "اكتب جملة واحدة قد تنقذ يوم شخص لا تعرفه.",
    stats: {
      responses: 842,
      agreeRate: 78,
      averageThinkingSeconds: 11.2,
      topCountries: ["UAE", "Jordan", "Egypt"],
    },
  },
];

export function GET() {
  return NextResponse.json({
    disclaimer:
      "HumanBits metrics are playful and reflective, not scientific or moral ratings.",
    experiments,
  });
}
