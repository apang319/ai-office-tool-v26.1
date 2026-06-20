import { NextRequest, NextResponse } from "next/server"
import { getKimiClient, KIMI_MODEL } from "@/lib/kimi"

export async function POST(req: NextRequest) {
  try {
    const { content, mode } = await req.json()

    if (!content || content.trim().length < 20) {
      return NextResponse.json({ error: "请输入需要总结的文档内容" }, { status: 400 })
    }

    const client = getKimiClient()

    const modePrompts: Record<string, string> = {
      summary: `请对以下文档进行智能总结，输出格式：

## 📄 文档总结

### 核心内容（3句话概括）
[用3句话精准概括文档主旨]

### 关键要点
[列出5-8个最重要的知识点或信息，用 ✦ 标注]

### 重要数据/结论
[提取文中的关键数据、重要结论]

### 行动建议
[基于文档内容，给出1-3条实用建议]`,

      contract: `请对以下合同/协议进行要点提取，输出格式：

## 📋 合同要点分析

### ⚠️ 核心条款
[列出最重要的条款]

### 💰 金额与付款
[提取所有涉及金额和付款的条款]

### ⏰ 重要时间节点
[提取所有截止日期、有效期等时间信息]

### 🔒 权利与义务
[双方的主要权利和义务]

### ⚡ 风险提示
[需要特别注意的条款或潜在风险]`,

      email: `请对以下邮件内容进行整理，输出格式：

## 📧 邮件要点整理

### 邮件主旨
[一句话概括邮件核心内容]

### 需要回复/处理的事项
[列出需要我方回应或处理的内容]

### 关键信息
[重要的数据、链接、联系方式等]

### 建议回复要点
[提供回复此邮件的建议要点]`,
    }

    const prompt = modePrompts[mode] || modePrompts.summary

    const completion = await client.chat.completions.create({
      model: KIMI_MODEL,
      messages: [
        {
          role: "system",
          content: `你是一位专业的文档分析师，擅长提取和整理文档要点。请保持客观准确。\n\n${prompt}`,
        },
        {
          role: "user",
          content: `请分析以下内容：\n\n${content}`,
        },
      ],
      temperature: 0.2,
    })

    const result = completion.choices[0]?.message?.content || ""
    return NextResponse.json({ result })
  } catch (error: unknown) {
    console.error("Summary API error:", error)
    const message = error instanceof Error ? error.message : "处理失败，请重试"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
