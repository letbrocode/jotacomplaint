import { Client } from "@upstash/qstash";
import { env } from "~/env";

// ============================================
// QStash client — HTTP-based job publisher
//
// QStash calls a public HTTPS URL, so local testing
// needs either the QStash CLI dev server (npx @upstash/qstash-cli dev)
// or an ngrok tunnel pointing at localhost:3000.
// ============================================

const globalForQStash = globalThis as unknown as {
  qstashClient: Client | undefined;
};

export const qstashClient =
  globalForQStash.qstashClient ?? new Client({ token: env.QSTASH_TOKEN ?? "" });

if (process.env.NODE_ENV !== "production") {
  globalForQStash.qstashClient = qstashClient;
}

/**
 * Build the absolute callback URL for a job route handler.
 * Uses NEXT_PUBLIC_APP_URL so QStash can reach the deployed app.
 */
export function jobUrl(path: string): string {
  const base =
    env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  return `${base}${path}`;
}

/**
 * Publish a job to QStash (fire-and-forget from the caller's perspective).
 * QStash will HTTP-POST the payload to the destination URL after verifying
 * the signature on the receiving route handler.
 *
 * @param destination - Full public URL of the job route handler
 * @param payload     - The job data object (serialized as JSON by QStash)
 * @param opts        - Optional overrides: retries, delay, deduplicationId, etc.
 */
export async function publishJob(
  destination: string,
  payload: object,
  opts?: {
    retries?: number;
    delay?: number;
    deduplicationId?: string;
  },
): Promise<void> {
  await qstashClient.publishJSON({
    url: destination,
    body: payload,
    retries: 3,
    ...opts,
  });
}
