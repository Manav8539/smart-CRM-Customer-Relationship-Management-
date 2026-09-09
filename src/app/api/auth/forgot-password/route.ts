import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordEmailSchema } from "@/lib/validations";
import { generateOtp } from "@/lib/auth";
import { sendMail, otpEmailTemplate } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = forgotPasswordEmailSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user) {
      return NextResponse.json({ message: "If that email exists, a code has been sent." });
    }

    const otp = generateOtp();
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: otp, resetTokenExpiry: new Date(Date.now() + 10 * 60 * 1000) },
    });

    await sendMail(user.email, "Reset your SmartCRM password", otpEmailTemplate(otp, "password reset"));
    return NextResponse.json({ message: "If that email exists, a code has been sent." });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
