import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    AUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    // Upstash Redis (rate limiting + caching)
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

    // BullMQ Redis (TCP — Railway/Render/local)
    REDIS_URL: z.string().optional().default("redis://localhost:6379"),

    // Pusher (server-side)
    PUSHER_APP_ID: z.string().optional(),
    PUSHER_KEY: z.string().optional(),
    PUSHER_SECRET: z.string().optional(),
    PUSHER_CLUSTER: z.string().optional(),

    // Resend email
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().optional(),
  },

  client: {
    // Pusher (browser)
    NEXT_PUBLIC_PUSHER_KEY: z.string().optional(),
    NEXT_PUBLIC_PUSHER_CLUSTER: z.string().optional(),

    // App URL
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  },

  runtimeEnv: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,

    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    REDIS_URL: process.env.REDIS_URL,

    PUSHER_APP_ID: process.env.PUSHER_APP_ID,
    PUSHER_KEY: process.env.PUSHER_KEY,
    PUSHER_SECRET: process.env.PUSHER_SECRET,
    PUSHER_CLUSTER: process.env.PUSHER_CLUSTER,

    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,

    NEXT_PUBLIC_PUSHER_KEY: process.env.NEXT_PUBLIC_PUSHER_KEY,
    NEXT_PUBLIC_PUSHER_CLUSTER: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
