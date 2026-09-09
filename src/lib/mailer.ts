import nodemailer from "nodemailer";

/**
 * Lazily creates a transporter. If SMTP env vars are missing (e.g. in local
 * dev), emails are simply logged to the console instead of failing the flow.
 */
function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
}

export async function sendMail(to: string, subject: string, html: string) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[mailer] (no SMTP configured) would send to ${to}: ${subject}\n${html}`);
    return;
  }
  await transporter.sendMail({ from: process.env.SMTP_FROM, to, subject, html });
}

export function otpEmailTemplate(otp: string, purpose: string) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>SmartCRM</h2>
      <p>Your ${purpose} code is:</p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px;">${otp}</p>
      <p>This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
    </div>
  `;
}
