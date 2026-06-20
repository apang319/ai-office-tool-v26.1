import OpenAI from "openai"

export function getKimiClient() {
  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("API Key 未配置，请在环境变量中设置 AI_API_KEY")
  }
  const baseURL = process.env.AI_BASE_URL
  return new OpenAI({
    apiKey,
    ...(baseURL ? { baseURL: `${baseURL}/v1` } : {}),
  })
}

export const KIMI_MODEL = process.env.AI_MODEL || "deepseek/deepseek-v3.2-251201"
