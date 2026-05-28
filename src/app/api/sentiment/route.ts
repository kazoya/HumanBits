import OpenAI from "openai";
import { NextResponse } from "next/server";

type SentimentPayload = {
  text?: string;
  experimentId?: string;
};

const fallbackAnalysis = {
  tone: "reflective",
  sentiment: "mixed",
  intensity: 0.54,
  tags: ["thoughtful", "human"],
  summary:
    "Fallback analysis only. Add OPENAI_API_KEY in Vercel to enable model-backed sentiment analysis.",
  safetyNote: "This is playful reflection, not a scientific or moral rating.",
};

function hasMeaningfulText(text: unknown): text is string {
  return typeof text === "string" && text.trim().length >= 2 && text.trim().length <= 1000;
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as SentimentPayload;

  if (!hasMeaningfulText(payload.text)) {
    return NextResponse.json(
      { error: "Please send text between 2 and 1000 characters." },
      { status: 400 },
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      ...fallbackAnalysis,
      experimentId: payload.experimentId ?? "unknown",
    });
  }

  const openai = new OpenAI();
  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
    input: [
      {
        role: "system",
        content:
          "Analyze short social experiment reactions. Keep it playful, non-clinical, non-moralizing, and suitable for anonymous aggregate analytics.",
      },
      {
        role: "user",
        content: `Experiment: ${payload.experimentId ?? "unknown"}\nReaction: ${payload.text}`,
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "humanbits_sentiment",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            tone: {
              type: "string",
              enum: ["generous", "skeptical", "humorous", "reflective", "hostile", "uncertain"],
            },
            sentiment: {
              type: "string",
              enum: ["positive", "neutral", "negative", "mixed"],
            },
            intensity: {
              type: "number",
              minimum: 0,
              maximum: 1,
            },
            tags: {
              type: "array",
              items: { type: "string" },
              minItems: 2,
              maxItems: 5,
            },
            summary: {
              type: "string",
            },
            safetyNote: {
              type: "string",
            },
          },
          required: ["tone", "sentiment", "intensity", "tags", "summary", "safetyNote"],
        },
      },
    },
  });

  const text = response.output_text;

  return NextResponse.json({
    ...JSON.parse(text),
    experimentId: payload.experimentId ?? "unknown",
  });
}
