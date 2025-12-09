"use client"

import type React from "react"
import { NuqsAdapter } from "nuqs/adapters/next/app"

export function Providers({ children }: { children: React.ReactNode }) {
  return <NuqsAdapter>{children}</NuqsAdapter>
}
