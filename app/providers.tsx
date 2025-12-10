"use client"

import type React from "react"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { SWRConfig } from "swr"
import { swrConfig } from "@/lib/swr-config"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NuqsAdapter>
      <SWRConfig value={swrConfig}>{children}</SWRConfig>
    </NuqsAdapter>
  )
}
