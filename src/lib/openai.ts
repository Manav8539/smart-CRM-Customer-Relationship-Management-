import OpenAI from "openai";

let client: OpenAI | null = null;

/**
 * Returns a shared OpenAI client, or null if no API key is configured.
 * Every AI route below falls back to a sensible heuristic/mock response
 * when this is null, so the app is fully demoable without an API key.
 */
export function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}
