import { type NextRequest, NextResponse } from "next/server"
import { createHash } from "crypto"

// Gravatar avatar styles that produce fun/quirky images
const GRAVATAR_STYLES = [
  "monsterid", // Monster-like creatures
  "wavatar", // Faces with different features
  "retro", // 8-bit arcade-style faces
  "robohash", // Robot faces
  "identicon", // Geometric patterns
] as const

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const username = searchParams.get("username")

  if (!username) {
    return NextResponse.json({ error: "Missing required parameter: username" }, { status: 400 })
  }

  // Create a hash from the username for consistent results
  const hash = createHash("md5").update(username.toLowerCase().trim()).digest("hex")

  // Use username hash to select a consistent style per user
  const styleIndex = Math.abs(hashString(username)) % GRAVATAR_STYLES.length
  const style = GRAVATAR_STYLES[styleIndex]

  // Build Gravatar URL with the style
  // Using a fake email hash ensures we always get the default (fun) image
  const gravatarUrl = `https://www.gravatar.com/avatar/${hash}?d=${style}&s=256&f=y`

  return NextResponse.json({
    imageUrl: gravatarUrl,
    style: style,
    username: username,
  })
}

// Simple string hash function for consistent style selection per username
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash
}
