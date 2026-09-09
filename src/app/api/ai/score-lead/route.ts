import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getOpenAI } from "@/lib/openai";

// Heuristic fallback: combines a few signals into a 0-100 score.
function heuristicScore(lead: { value: number | null; probability: number | null; status: string; source: string | null }) {
  let score = 20;
  if (lead.value) score += Math.min(30, lead.value / 1000);
  if (lead.probability) score += lead.probability * 0.3;
  const statusBoost: Record<string, number> = {
    NEW: 0, CONTACTED: 5, QUALIFIED: 15, PROPOSAL: 25, NEGOTIATION: 30, CONVERTED: 40, LOST: -50,
  };
  score += statusBoost[lead.status] ?? 0;
  if (lead.source && ["referral", "partner"].includes(lead.source.toLowerCase())) score += 10;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { leadId } = await req.json();
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, include: { contact: true } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const openai = getOpenAI();
  let score = heuristicScore(lead);
  let reasoning = "Score calculated from deal value, probability, pipeline stage, and lead source.";

  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a CRM lead-scoring assistant. Respond ONLY with JSON: {\"score\": number 0-100, \"reasoning\": string under 40 words}.",
          },
          {
            role: "user",
            content: `Score this lead:\nTitle: ${lead.title}\nStatus: ${lead.status}\nValue: ${lead.value}\nProbability: ${lead.probability}\nSource: ${lead.source}\nCompany: ${lead.contact.company}\nDescription: ${lead.description}`,
          },
        ],
        response_format: { type: "json_object" },
      });
      const parsed = JSON.parse(completion.choices[0].message.content || "{}");
      if (typeof parsed.score === "number") score = Math.max(0, Math.min(100, Math.round(parsed.score)));
      if (parsed.reasoning) reasoning = parsed.reasoning;
    } catch (err) {
      console.error("OpenAI scoring failed, using heuristic fallback:", err);
    }
  }

  await prisma.lead.update({ where: { id: leadId }, data: { score } });
  return NextResponse.json({ score, reasoning });
}
