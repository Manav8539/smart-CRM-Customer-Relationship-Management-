import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getOpenAI } from "@/lib/openai";

function heuristicRecommendations(status: string) {
  const byStatus: Record<string, string[]> = {
    NEW: ["Send an introductory email within 24 hours", "Research the contact's company and role", "Schedule a discovery call"],
    CONTACTED: ["Follow up if no response within 3 days", "Share relevant case studies", "Confirm pain points and budget"],
    QUALIFIED: ["Prepare a tailored proposal", "Loop in a technical specialist if needed", "Set a decision-timeline expectation"],
    PROPOSAL: ["Follow up 48 hours after sending the proposal", "Address likely objections proactively", "Offer a call to walk through pricing"],
    NEGOTIATION: ["Clarify any blocking terms", "Get approval on any discount before offering it", "Set a target close date"],
    CONVERTED: ["Send a welcome/onboarding email", "Schedule a kickoff call", "Introduce the customer success contact"],
    LOST: ["Send a graceful close-out note", "Ask for feedback on why it did not move forward", "Add to a nurture list for 6 months out"],
  };
  return byStatus[status] || ["Review the lead details and plan next outreach"];
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { leadId } = await req.json();
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, include: { contact: true, activities: { orderBy: { date: "desc" }, take: 5 } } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const openai = getOpenAI();
  if (!openai) return NextResponse.json({ recommendations: heuristicRecommendations(lead.status) });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a CRM sales assistant. Suggest 3 concise next actions. Respond ONLY with JSON: {\"recommendations\": string[]}.",
        },
        {
          role: "user",
          content: `Lead: ${lead.title}\nStatus: ${lead.status}\nValue: ${lead.value}\nRecent activity: ${lead.activities.map((a) => a.description).join("; ")}`,
        },
      ],
      response_format: { type: "json_object" },
    });
    const parsed = JSON.parse(completion.choices[0].message.content || "{}");
    return NextResponse.json({ recommendations: parsed.recommendations || heuristicRecommendations(lead.status) });
  } catch (err) {
    console.error("OpenAI recommendations failed, using heuristic fallback:", err);
    return NextResponse.json({ recommendations: heuristicRecommendations(lead.status) });
  }
}
