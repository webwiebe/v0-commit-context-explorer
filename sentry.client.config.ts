import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn:
    process.env.NEXT_PUBLIC_SENTRY_DSN ||
    "https://95041ae96d0c924b78a5466a7a215d17@o4506175484526592.ingest.us.sentry.io/4510510108246016",

  // Performance Monitoring - adjust sample rate in production
  tracesSampleRate: 1.0,

  // Session Replay for error debugging
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [Sentry.replayIntegration(), Sentry.browserTracingIntegration()],

  // Environment configuration
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || "development",

  // Filter out noisy errors
  ignoreErrors: ["Failed to fetch", "NetworkError", "AbortError"],
})
