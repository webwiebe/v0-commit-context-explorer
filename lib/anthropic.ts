// Shared Anthropic client for AI text generation
// Used by all API routes that need AI summaries

import Anthropic from "@anthropic-ai/sdk"

// Singleton client instance
let client: Anthropic | null = null

export function getAnthropicClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable is not set")
    }
    client = new Anthropic({ apiKey })
  }
  return client
}

// Default model for all AI generations
export const DEFAULT_MODEL = "claude-sonnet-4-20250514"

// Helper function to extract text from Anthropic response
export function extractText(response: Anthropic.Message): string {
  const textBlock = response.content.find((block) => block.type === "text")
  return textBlock?.type === "text" ? textBlock.text : ""
}

// Simplified generate function that matches our usage pattern
export async function generateText(options: {
  prompt: string
  system?: string
  model?: string
  maxTokens?: number
  temperature?: number
}): Promise<string> {
  const anthropic = getAnthropicClient()

  const response = await anthropic.messages.create({
    model: options.model ?? DEFAULT_MODEL,
    max_tokens: options.maxTokens ?? 4096,
    ...(options.system && { system: options.system }),
    messages: [{ role: "user", content: options.prompt }],
    ...(options.temperature !== undefined && { temperature: options.temperature }),
  })

  return extractText(response)
}
