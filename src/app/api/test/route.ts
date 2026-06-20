export async function GET() {
  return Response.json({
    hasApiKey: !!process.env.AI_API_KEY,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    hasBaseUrl: !!process.env.AI_BASE_URL,
    hasModel: !!process.env.AI_MODEL,
    nodeEnv: process.env.NODE_ENV,
  })
}
