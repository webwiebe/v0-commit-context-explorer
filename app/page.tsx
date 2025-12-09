"use client"

import { PageLayout } from "@/components/page-layout"

export default function HomePage() {
  return (
    <PageLayout>
      {/* Empty State */}
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">
          Enter a commit SHA to explore its context, provide a range to generate a changelog, or analyze a mach-config
          deployment.
        </p>
        <p className="text-xs mt-2">Example: abc1234 → def5678</p>
      </div>
    </PageLayout>
  )
}
