import { NextResponse } from "next/server"
import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"

// Create xAI provider (Grok uses OpenAI-compatible API)
const xai = createOpenAI({
  name: "xai",
  baseURL: "https://api.x.ai/v1",
  apiKey: process.env.XAI_API_KEY,
})

export async function GET() {
  try {
    const { text } = await generateText({
      model: xai("grok-3-mini"),
      prompt: `Generate a single snarky, sarcastic loading message for a developer tool that generates release notes/changelogs.

The message should:
- Be about 10-20 words
- Mock enterprise software development, corporate processes, or how things take forever in business
- Be witty and slightly cynical but not mean-spirited
- Reference things developers hate: meetings, standups, JIRA, PRs, deployments, etc.
- Sound like a tired developer who's seen too many sprint planning sessions

Just output the message text, nothing else. No quotes, no explanation.`,
    })

    return NextResponse.json({ message: text.trim() })
  } catch (error) {
    console.error("Snark generation failed:", error)
    // Return a fallback message if AI fails
    const fallbacks = [
      "Loading... much like your quarterly OKRs, this is 'in progress'",
      "Generating changelog... unlike your standups, this actually produces something useful",
      "Please hold while we pretend this is instant...",
    ]
    return NextResponse.json({
      message: fallbacks[Math.floor(Math.random() * fallbacks.length)],
    })
  }
}
