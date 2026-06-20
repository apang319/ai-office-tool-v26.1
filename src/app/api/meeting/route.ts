import { NextRequest, NextResponse } from "next/server"
import { getKimiClient, KIMI_MODEL } from "@/lib/kimi"

export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json()

    if (!content || content.trim().length < 10) {
      return NextResponse.json({ error: "请输入会议内容" }, { status: 400 })
    }

    const client = getKimiClient()

    const completion = await client.chat.completions.create({
      model: KIMI_MODEL,
      messages: [
        {
          role: "system",
          content: `你是一位专业的会议助理，擅长整理会议纪要。
请将用户提供的会议内容整理成规范的会议纪要，格式如下：

## 📋 会议纪要

**会议主题：** [提取或概括]
**会议时间：** [如有则提取，否则填写"未提及"]
**参会人员：** [如有则提取，否则填写"未提及"]

---

### 🎯 核心议题
[列出主要讨论议题]

### ✅ 重要决策
[列出所有决策结论，用序号标注]

### 📌 待办事项
[列出所有待办任务，格式：- 【负责人】事项内容（截止日期）]

### 💡 其他要点
[其他重要信息]

请确保内容准确、简洁、专业。`,
        },
        {
          role: "user",
          content: `请整理以下会议内容：\n\n${content}`,
        },
      ],
      temperature: 0.3,
    })

    const result = completion.choices[0]?.message?.content || ""
    return NextResponse.json({ result })
  } catch (error: unknown) {
    console.error("Meeting API error:", error)
    const message = error instanceof Error ? error.message : "处理失败，请重试"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
