/**
 * Register (or update) QStash cron schedules for background jobs.
 *
 * Run this ONCE per environment after initial deploy:
 *   npx tsx scripts/register-qstash-schedules.ts
 *
 * Prerequisites:
 *   - QSTASH_TOKEN set in env
 *   - NEXT_PUBLIC_APP_URL set to the deployed app's public URL
 * *
 * If you need to change a schedule, delete the existing one
 * from the QStash console and rerun this script.
 *
 *
 *⚠️ Do NOT run this locally unless you have a public tunnel (ngrok / Cloudflare).
 * QStash needs to POST back to the callback URLs — localhost won't work.
 */

import "dotenv/config";
import { Client } from "@upstash/qstash";

const token = process.env.QSTASH_TOKEN;
const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

if (!token) {
  console.error("❌ QSTASH_TOKEN is not set");
  process.exit(1);
}

if (!baseUrl) {
  console.error("❌ NEXT_PUBLIC_APP_URL is not set");
  process.exit(1);
}

const client = new Client({ token });

const schedules = [
  {
    destination: `${baseUrl}/api/jobs/escalation`,
    cron: "0 * * * *", // every hour — SLA check
    body: JSON.stringify({ type: "check-sla" }),
    retries: 3,
    label: "escalation-sla-check",
  },
  {
    destination: `${baseUrl}/api/jobs/digest`,
    cron: "0 9 * * 1", // Monday 9am — weekly admin digest
    body: JSON.stringify({ type: "weekly-digest" }),
    retries: 3,
    label: "digest-weekly",
  },
  {
    destination: `${baseUrl}/api/jobs/cleanup`,
    cron: "0 0 * * *", // daily midnight — purge soft-deleted complaints
    body: JSON.stringify({ type: "purge-deleted" }),
    retries: 3,
    label: "cleanup-daily",
  },
] as const;

console.log(`\n🚀 Registering QStash schedules for: ${baseUrl}\n`);

for (const schedule of schedules) {
  try {
    const result = await client.schedules.create({
      destination: schedule.destination,
      cron: schedule.cron,
      body: schedule.body,
      retries: schedule.retries,
    });
    console.log(
      `✅ [${schedule.label}] Schedule created — ID: ${result.scheduleId}`,
    );
    console.log(`   → ${schedule.destination} (cron: ${schedule.cron})`);
  } catch (err) {
    console.error(`❌ [${schedule.label}] Failed to create schedule:`, err);
    process.exit(1);
  }
}

console.log(
  "\n✅ All schedules registered. View them at: https://console.upstash.com/qstash → Schedules\n",
);
