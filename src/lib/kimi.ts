import OpenAI from "openai"

export function getKimiClient() {
  return new OpenAI({
    apiKey: process.env.KIMI_API_KEY || "",
    baseURL: "https://api.moonshot.cn/v1",
  })
}

export const KIMI_MODEL = "moonshot-v1-8k"
