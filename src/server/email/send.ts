import type { ReactElement } from "react";
import { render } from "@react-email/components";
import { getResend, EMAIL_FROM } from "./client";

// ============================================
// Centralised email sender
// All email sends go through this function.
// ============================================

type SendEmailOptions = {
  to: string | string[];
  subject: string;
  react: ReactElement;
};

type SendEmailResult =
  | { success: true; messageId: string }
  | { success: false; error: string };

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  try {
    const html = await render(options.react);

    const { data, error } = await getResend().emails.send({
      from: EMAIL_FROM,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html,
    });

    if (error) {
      console.error("[email] Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id ?? "unknown" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    console.error("[email] Send failed:", message);
    return { success: false, error: message };
  }
}
