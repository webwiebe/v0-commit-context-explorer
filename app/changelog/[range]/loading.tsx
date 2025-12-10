import { Loader2 } from "lucide-react"

// Static loading messages for initial page load (before client hydration)
const LOADING_MESSAGES = [
  "Summoning the changelog spirits...",
  "Consulting the oracle of git...",
  "Warming up the sarcasm engine...",
]

export default function Loading() {
  // Pick a random message on initial render (server-side)
  const message = LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    </div>
  )
}
