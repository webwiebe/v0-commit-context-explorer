import { type NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";

const MONKEY_SCENARIOS = [
  "a cartoon monkey engineer holding a wrench upside down with a confused expression, trying to fix a computer",
  "a cartoon monkey developer staring confused at code on a computer screen, scratching its head",
  "a cartoon monkey engineer wearing a hard hat backwards while typing on a keyboard",
  "a cartoon monkey completely tangled in ethernet cables and looking panicked",
  "a cartoon monkey using a keyboard as a hammer to hit a computer monitor",
  "a cartoon monkey trying to plug a banana into a USB port",
  "a cartoon monkey reading a programming book upside down with a serious expression",
  "a cartoon monkey wearing safety goggles on top of its head while soldering incorrectly",
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { error: "Missing required parameter: username" },
      { status: 400 }
    );
  }

  // Use username as seed for consistent scenario per user
  const scenarioIndex =
    Math.abs(hashString(username)) % MONKEY_SCENARIOS.length;
  const scenario = MONKEY_SCENARIOS[scenarioIndex];

  try {
    const result = await generateText({
      model: "google/gemini-2.5-flash-image",
      prompt: `${scenario}. Digital art style, humorous, cute, vibrant colors, simple background. The scene should be funny and lighthearted.`,
    });

    return NextResponse.json({
      image: result.files[0].base64,
      mimeType: "image/png",
      scenario: scenario,
    });
  } catch (error) {
    console.error("Monkey image generation failed:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to generate monkey image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Simple string hash function for consistent results per username
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}
