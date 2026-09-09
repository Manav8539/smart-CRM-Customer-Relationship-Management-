import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getOpenAI } from "@/lib/openai";

function fallbackTemplate(purpose: string, recipientName: string, context: string) {
  return `Subject: Following up${recipientName ? ` — ${recipientName}` : ""}\n\nHi ${recipientName || "there"},\n\nI wanted to follow up regarding ${context || "our recent conversation"}. ${purpose ? `The goal of this note is to ${purpose.toLowerCase()}.` : ""}\n\nLet me know a good time to connect this week — happy to work around your schedule.\n\nBest regards,\n[Your name]`;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { purpose, recipientName, context, tone } = await req.json();
  const openai = getOpenAI();

  if (!openai) {
    return NextResponse.json({ email: fallbackTemplate(purpose, recipientName, context) });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You write concise, professional sales/CRM emails. Return only the email with a Subject line, no preamble.",
        },
        {
          role: "user",
          content: `Write a ${tone || "professional"} email.\nPurpose: ${purpose}\nRecipient: ${recipientName}\nContext: ${context}`,
        },
      ],
    });
    const email = completion.choices[0].message.content || fallbackTemplate(purpose, recipientName, context);
    return NextResponse.json({ email });
  } catch (err) {
    console.error("OpenAI email generation failed, using fallback:", err);
    return NextResponse.json({ email: fallbackTemplate(purpose, recipientName, context) });
  }
}
