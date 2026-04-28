// ============================================
// Worker Entrypoint — runs as a standalone process
// separate from the Next.js app.
//
// Start with: npm run worker
// ============================================

import "~/server/jobs/workers/email.worker";
import "~/server/jobs/workers/escalation.worker";
import "~/server/jobs/workers/digest.worker";
import "~/server/jobs/workers/cleanup.worker";
import { startScheduler } from "./scheduler";

console.log("🚀 JotaComplaint Workers starting...");

await startScheduler();

console.log("✅ All workers and schedulers active. Waiting for jobs...");

// Keep the process alive
process.on("SIGTERM", async () => {
  console.log("SIGTERM received — shutting down workers gracefully");
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received — shutting down workers gracefully");
  process.exit(0);
});
