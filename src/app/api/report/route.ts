import { NextRequest, NextResponse } from "next/server"
import { getKimiClient, KIMI_MODEL } from "@/lib/kimi"

export async function POST(req: NextRequest) {
  try {
    const { content, type, name, department } = await req.json()

    if (!content || content.trim().length < 10) {
      return NextResponse.json({ error: "请输入工作内容" }, { status: 400 })
    }

    const reportType = type === "daily" ? "日报" : "周报"
    const client = getKimiClient()

    const completion = await client.chat.completions.create({
      model: KIMI_MODEL,
      messages: [
        {
          role: "system",
          content: `你是一位专业的职场写作助手，擅长撰写工作${reportType}。
请根据用户提供的工作内容，生成一份专业、规范的${reportType}，格式如下：

## 📊 ${reportType}

**姓名：** ${name || "未填写"}
**部门：** ${department || "未填写"}
**日期：** ${new Date().toLocaleDateString("zh-CN")}

---

### 一、本${type === "daily" ? "日" : "周"}工作完成情况
[将工作内容整理为条目，突出完成度和成果，语言专业简洁]

### 二、工作成果与亮点
[提炼主要成果和价值贡献]

### 三、遇到的问题与解决方案
[如内容中有提及，则整理；否则写"本${type === "daily" ? "日" : "周"}工作进展顺利，无重大问题"]

### 四、下${type === "daily" ? "日" : "周"}工作计划
[基于本${type === "daily" ? "日" : "周"}工作，合理规划下${type === "daily" ? "日" : "周"}重点任务]

请保持语言专业、积极，符合职场规范。`,
        },
        {
          role: "user",
          content: `请根据以下内容生成${reportType}：\n\n${content}`,
        },
      ],
      temperature: 0.4,
    })

    const result = completion.choices[0]?.message?.content || ""
    return NextResponse.json({ result })
  } catch (error: unknown) {
    console.error("Report API error:", error)
    const message = error instanceof Error ? error.message : "处理失败，请重试"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
