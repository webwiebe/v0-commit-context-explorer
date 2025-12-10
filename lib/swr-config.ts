import * as Sentry from "@sentry/nextjs"
import type { SWRConfiguration } from "swr"

interface FetchError extends Error {
  status?: number
}

export const swrConfig: SWRConfiguration = {
  onError: (error: FetchError, key) => {
    // Don't report 4xx errors (client errors like 400, 404)
    if (error?.status && error.status >= 400 && error.status < 500) {
      return
    }

    Sentry.captureException(error, {
      tags: {
        swrKey: typeof key === "string" ? key : "unknown",
      },
      extra: {
        fetchKey: key,
      },
    })
  },
  onErrorRetry: (error: FetchError, _key, _config, revalidate, { retryCount }) => {
    // Never retry on 404 or 400
    if (error?.status === 404 || error?.status === 400) return

    // Only retry 3 times max
    if (retryCount >= 3) return

    // Retry after 5 seconds
    setTimeout(() => revalidate({ retryCount }), 5000)
  },
}
