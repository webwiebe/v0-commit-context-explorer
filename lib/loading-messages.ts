// Snarky loading messages to entertain users while waiting for AI responses
// These rotate randomly during loading states

export const LOADING_MESSAGES = [
  "Consulting the silicon oracle...",
  "Teaching hamsters to run faster...",
  "Bribing the AI with virtual cookies...",
  "Reticulating splines...",
  "Convincing electrons to cooperate...",
  "Asking the magic 8-ball for guidance...",
  "Warming up the flux capacitor...",
  "Untangling the quantum spaghetti...",
  "Negotiating with the cloud gods...",
  "Downloading more RAM...",
  "Counting backwards from infinity...",
  "Polishing the crystal ball...",
  "Waking up the AI from its nap...",
  "Converting caffeine to code...",
  "Searching for the any key...",
  "Performing digital interpretive dance...",
  "Asking ChatGPT to ask Claude...",
  "Feeding the neural network its vegetables...",
  "Spinning up the hamster wheels...",
  "Consulting ancient scrolls of documentation...",
  "Dividing by zero (safely)...",
  "Herding digital cats...",
  "Compiling the compilations...",
  "Optimizing the optimizations...",
  "Making the bits byte...",
] as const

export type LoadingMessage = (typeof LOADING_MESSAGES)[number]

// Get a random loading message
export function getRandomLoadingMessage(): string {
  return LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]
}

// Get a loading message based on a seed (for consistent results per request)
export function getSeededLoadingMessage(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  const index = Math.abs(hash) % LOADING_MESSAGES.length
  return LOADING_MESSAGES[index]
}
