import { Resend } from "resend";

// ============================================
// Resend email client — lazy singleton
// Validated on first use, not at import time,
// so the worker process can start without Resend
// being configured (e.g. during local dev).
// ============================================

let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error(
      "Missing RESEND_API_KEY — add it to your .env to enable email sending.",
    );
  }
  _resend ??= new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

export const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "JotaComplaint <noreply@jotacomplaint.com>";
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
