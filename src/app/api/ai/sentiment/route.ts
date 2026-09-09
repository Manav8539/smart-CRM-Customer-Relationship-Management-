import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getOpenAI } from "@/lib/openai";

const POSITIVE_WORDS = ["great", "happy", "love", "excellent", "thanks", "good", "interested", "excited"];
const NEGATIVE_WORDS = ["unhappy", "bad", "cancel", "frustrated", "angry", "issue", "problem", "disappointed"];

function heuristicSentiment(text: string) {
  const lower = text.toLowerCase();
  const pos = POSITIVE_WORDS.filter((w) => lower.includes(w)).length;
  const neg = NEGATIVE_WORDS.filter((w) => lower.includes(w)).length;
  let sentiment: "positive" | "neutral" | "negative" = "neutral";
  if (pos > neg) sentiment = "positive";
  else if (neg > pos) sentiment = "negative";
  const score = Math.max(-1, Math.min(1, (pos - neg) / 5));
  return { sentiment, score: Math.round(score * 100) / 100 };
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { text } = await req.json();
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const openai = getOpenAI();
  if (!openai) return NextResponse.json(heuristicSentiment(text));

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Analyze sentiment of customer interaction notes. Respond ONLY with JSON: {\"sentiment\": \"positive\"|\"neutral\"|\"negative\", \"score\": number from -1 to 1}.",
        },
        { role: "user", content: text },
      ],
      response_format: { type: "json_object" },
    });
    const parsed = JSON.parse(completion.choices[0].message.content || "{}");
    return NextResponse.json({
      sentiment: parsed.sentiment || heuristicSentiment(text).sentiment,
      score: typeof parsed.score === "number" ? parsed.score : heuristicSentiment(text).score,
    });
  } catch (err) {
    console.error("OpenAI sentiment failed, using heuristic fallback:", err);
    return NextResponse.json(heuristicSentiment(text));
  }
}
