import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.verificationOtp !== otp) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }
    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return NextResponse.json({ error: "Verification code has expired" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verificationOtp: null, otpExpiry: null },
    });

    return NextResponse.json({ message: "Email verified. You can now log in." });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
