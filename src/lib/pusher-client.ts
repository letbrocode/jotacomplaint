"use client";

import PusherJS from "pusher-js";

// ============================================
// Browser Pusher singleton
// Import this in client hooks — never in Server
// Components or server actions.
// ============================================

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY;
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

if (!PUSHER_KEY || !PUSHER_CLUSTER) {
  throw new Error(
    "Missing Pusher client env vars: NEXT_PUBLIC_PUSHER_KEY, NEXT_PUBLIC_PUSHER_CLUSTER",
  );
}

// Module-level singleton — prevents duplicate connections
let pusherClient: PusherJS | null = null;

export function getPusherClient(): PusherJS {
  if (!pusherClient) {
    pusherClient = new PusherJS(PUSHER_KEY!, {
      cluster: PUSHER_CLUSTER!,
    });
  }
  return pusherClient;
}
