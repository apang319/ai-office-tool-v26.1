import OpenAI from "openai"

export function getKimiClient() {
  return new OpenAI({
    apiKey: process.env.AI_API_KEY || "",
    baseURL: `${process.env.AI_BASE_URL}/v1`,
  })
}

export const KIMI_MODEL = process.env.AI_MODEL || "deepseek/deepseek-v3.2-251201"
