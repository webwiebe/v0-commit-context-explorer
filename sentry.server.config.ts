import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn:
    process.env.SENTRY_DSN ||
    "https://95041ae96d0c924b78a5466a7a215d17@o4506175484526592.ingest.us.sentry.io/4510510108246016",

  // Performance Monitoring
  tracesSampleRate: 1.0,

  // Environment configuration
  environment: process.env.VERCEL_ENV || "development",
})
