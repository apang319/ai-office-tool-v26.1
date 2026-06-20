import { NextRequest, NextResponse } from "next/server"
import { getKimiClient, KIMI_MODEL } from "@/lib/kimi"

export async function POST(req: NextRequest) {
  try {
    const { content, emailType, tone, recipient } = await req.json()

    if (!content || content.trim().length < 5) {
      return NextResponse.json({ error: "请描述邮件内容要求" }, { status: 400 })
    }

    const client = getKimiClient()

    const typeLabel = emailType === "reply" ? "回复邮件" : "新邮件"
    const toneMap: Record<string, string> = {
      formal: "正式、专业、措辞严谨",
      friendly: "友好、亲切、自然流畅",
      urgent: "简洁、直接、突出紧迫性",
    }
    const toneLabel = toneMap[tone] || toneMap.formal

    const completion = await client.chat.completions.create({
      model: KIMI_MODEL,
      messages: [
        {
          role: "system",
          content: `你是一位专业的商务写作助手，擅长撰写各类职场邮件。
请根据用户的需求，撰写一封${typeLabel}，语气风格要求：${toneLabel}。

输出格式如下（严格遵守）：

## ✉️ 邮件草稿

**主题：** [邮件标题，简洁明确]

---

**正文：**

[邮件正文。开头问候语，主体内容清晰分段，结尾礼貌收尾]

---

**落款：**
[您的姓名]
[职务/部门（如已知）]
[日期]

请确保：
- 主题行抓人眼球、信息完整
- 正文逻辑清晰，重点突出
- 语气符合要求（${toneLabel}）
- 长度适中，不超过 350 字正文`,
        },
        {
          role: "user",
          content: `${recipient ? `收件人信息：${recipient}\n` : ""}邮件需求：\n${content}`,
        },
      ],
      temperature: 0.5,
      stream: true,
    })

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const text = chunk.choices[0]?.delta?.content
            if (text) controller.enqueue(encoder.encode(text))
          }
        } catch (e) {
          controller.error(e)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (error: unknown) {
    console.error("Email API error:", error)
    const message = error instanceof Error ? error.message : "处理失败，请重试"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
