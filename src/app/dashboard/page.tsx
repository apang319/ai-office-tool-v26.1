"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import {
  ClipboardList, FileText, BookOpen, Copy, Download,
  Zap, ChevronRight, RotateCcw, ArrowLeft, Sparkles,
  Mail, History, X, Clock, Trash2, ChevronDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"
import {
  canUseToday, getRemainingCount, incrementUsage, DAILY_LIMIT,
  saveToHistory, getHistory, clearHistory, type HistoryItem,
} from "@/lib/storage"

type Tool = "meeting" | "report" | "summary" | "email"
type ReportType = "weekly" | "daily"
type SummaryMode = "summary" | "contract" | "email"
type EmailType = "new" | "reply"
type EmailTone = "formal" | "friendly" | "urgent"

const TOOLS = [
  {
    id: "meeting" as Tool,
    icon: ClipboardList,
    label: "会议纪要",
    emoji: "🗒️",
    desc: "自动整理会议内容",
    color: "text-blue-600",
    bg: "bg-blue-50",
    placeholder:
      "粘贴会议记录或会议对话内容...\n\n例如：\n今天开了产品需求评审会，张总说要在下周五前完成登录模块，李工负责后端接口，王工负责前端页面，测试由小陈负责...",
  },
  {
    id: "report" as Tool,
    icon: FileText,
    label: "周报日报",
    emoji: "📊",
    desc: "一键生成专业报告",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    placeholder:
      "输入本周/本日完成的工作内容...\n\n例如：\n完成了用户中心模块的开发，修复了3个线上bug，参加了产品需求评审会议，整理了技术文档，下周计划完成支付模块...",
  },
  {
    id: "summary" as Tool,
    icon: BookOpen,
    label: "文档总结",
    emoji: "📄",
    desc: "快速提取文档要点",
    color: "text-violet-600",
    bg: "bg-violet-50",
    placeholder: "粘贴需要总结的文档内容...\n\n支持：长文章、合同条款、邮件内容、方案报告等",
  },
  {
    id: "email" as Tool,
    icon: Mail,
    label: "邮件起草",
    emoji: "✉️",
    desc: "AI生成商务邮件",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    placeholder:
      "描述邮件的目的和要点...\n\n例如：\n给客户发一封关于项目延期的邮件，说明延期原因是需求变更导致技术复杂度增加，新的交付时间是下周五，并表示歉意",
  },
]

// 工具颜色映射（active 状态）
const TOOL_ACTIVE: Record<Tool, string> = {
  meeting: "bg-blue-600",
  report: "bg-indigo-600",
  summary: "bg-violet-600",
  email: "bg-emerald-600",
}

// 改进的 Markdown 渲染（逐行解析，避免 <br/> 注入 block 元素）
function renderMarkdown(text: string): string {
  const lines = text.split("\n")
  const out: string[] = []
  let inUl = false

  const inline = (s: string) =>
    s
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, "<code>$1</code>")

  const closeUl = () => {
    if (inUl) { out.push("</ul>"); inUl = false }
  }

  for (const raw of lines) {
    const line = raw.trimEnd()

    if (/^## /.test(line)) {
      closeUl()
      out.push(`<h2>${inline(line.slice(3))}</h2>`)
    } else if (/^### /.test(line)) {
      closeUl()
      out.push(`<h3>${inline(line.slice(4))}</h3>`)
    } else if (/^#### /.test(line)) {
      closeUl()
      out.push(`<h4>${inline(line.slice(5))}</h4>`)
    } else if (/^---+$/.test(line)) {
      closeUl()
      out.push("<hr/>")
    } else if (/^[-•✦✓] /.test(line)) {
      if (!inUl) { out.push('<ul class="md-ul">'); inUl = true }
      out.push(`<li>${inline(line.replace(/^[-•✦✓] /, ""))}</li>`)
    } else if (/^\d+\. /.test(line)) {
      if (!inUl) { out.push('<ul class="md-ul md-ol">'); inUl = true }
      out.push(`<li>${inline(line.replace(/^\d+\. /, ""))}</li>`)
    } else if (line === "") {
      closeUl()
      out.push('<div class="md-gap"></div>')
    } else {
      closeUl()
      out.push(`<p>${inline(line)}</p>`)
    }
  }
  closeUl()
  return out.join("")
}

// 时间格式化
function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 1) return "刚刚"
  if (m < 60) return `${m}分钟前`
  if (h < 24) return `${h}小时前`
  return `${d}天前`
}

export default function Dashboard() {
  const [activeTool, setActiveTool] = useState<Tool>("meeting")
  const [input, setInput] = useState("")
  const [result, setResult] = useState("")
  const [loading, setLoading] = useState(false)   // 等待响应头
  const [streaming, setStreaming] = useState(false) // 流式接收中
  const [remaining, setRemaining] = useState(DAILY_LIMIT)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)

  // 周报选项
  const [reportType, setReportType] = useState<ReportType>("weekly")
  const [reportName, setReportName] = useState("")
  const [reportDept, setReportDept] = useState("")

  // 文档总结选项
  const [summaryMode, setSummaryMode] = useState<SummaryMode>("summary")

  // 邮件选项
  const [emailType, setEmailType] = useState<EmailType>("new")
  const [emailTone, setEmailTone] = useState<EmailTone>("formal")
  const [emailRecipient, setEmailRecipient] = useState("")

  // 历史记录
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])

  const { showToast } = useToast()
  const resultRef = useRef<HTMLDivElement>(null)
  const generateRef = useRef<() => void>(() => {})

  useEffect(() => {
    setRemaining(getRemainingCount())
    setHistory(getHistory())
  }, [])

  // Cmd/Ctrl + Enter 快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault()
        generateRef.current()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const currentTool = TOOLS.find((t) => t.id === activeTool)!

  function handleToolChange(tool: Tool) {
    setActiveTool(tool)
    setInput("")
    setResult("")
    setShowMobileSidebar(false)
  }

  async function handleGenerate() {
    if (!input.trim()) {
      showToast("请先输入内容", "error")
      return
    }
    if (!canUseToday()) {
      showToast(`今日免费次数已用完（${DAILY_LIMIT}次），请明天再来`, "error")
      return
    }
    if (loading || streaming) return

    setLoading(true)
    setStreaming(false)
    setResult("")

    try {
      let endpoint = ""
      let body: Record<string, string> = { content: input }

      if (activeTool === "meeting") {
        endpoint = "/api/meeting"
      } else if (activeTool === "report") {
        endpoint = "/api/report"
        body = { content: input, type: reportType, name: reportName, department: reportDept }
      } else if (activeTool === "summary") {
        endpoint = "/api/summary"
        body = { content: input, mode: summaryMode }
      } else {
        endpoint = "/api/email"
        body = { content: input, emailType, tone: emailTone, recipient: emailRecipient }
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "请求失败")
      }

      // 切换到流式接收状态
      setLoading(false)
      setStreaming(true)

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let fullText = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value, { stream: true })
        setResult(fullText)
      }

      // 流结束
      setStreaming(false)

      // 保存历史
      saveToHistory({
        tool: activeTool,
        toolLabel: currentTool.label,
        toolEmoji: currentTool.emoji,
        input,
        result: fullText,
        timestamp: Date.now(),
      })
      setHistory(getHistory())

      incrementUsage()
      setRemaining(getRemainingCount())
      showToast("生成完成！", "success")

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 100)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "生成失败，请重试"
      showToast(msg, "error")
      setLoading(false)
      setStreaming(false)
    }
  }

  // 保持 ref 最新，让键盘快捷键始终调用最新版本
  generateRef.current = handleGenerate

  function handleCopy() {
    navigator.clipboard.writeText(result)
    showToast("已复制到剪贴板", "success")
  }

  function handleDownload() {
    const labels: Record<Tool, string> = {
      meeting: "会议纪要",
      report: "工作报告",
      summary: "文档总结",
      email: "邮件草稿",
    }
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${labels[activeTool]}_${new Date().toLocaleDateString("zh-CN").replace(/\//g, "-")}.txt`
    a.click()
    URL.revokeObjectURL(url)
    showToast("文件已下载", "success")
  }

  function restoreFromHistory(item: HistoryItem) {
    setActiveTool(item.tool)
    setInput(item.input)
    setResult(item.result)
    setShowHistory(false)
    showToast("已还原历史记录", "success")
  }

  function handleClearHistory() {
    clearHistory()
    setHistory([])
    showToast("历史记录已清空", "success")
  }

  const isGenerating = loading || streaming

  // ─── 渲染 ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── 顶部导航 ── */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* 左侧 */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 transition-colors text-sm"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">返回首页</span>
            </Link>
            <div className="w-px h-4 bg-gray-200 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Zap size={13} className="text-white" />
              </div>
              <span className="font-bold text-gray-900">效率星</span>
            </div>
          </div>

          {/* 右侧 */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* 历史记录按钮 */}
            <button
              onClick={() => setShowHistory(true)}
              className="relative flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg transition-all"
            >
              <History size={14} />
              <span className="hidden sm:inline">历史记录</span>
              {history.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {history.length}
                </span>
              )}
            </button>

            {/* 剩余次数 */}
            <div className="flex items-center gap-1.5 text-sm">
              <div className={`w-2 h-2 rounded-full ${remaining > 0 ? "bg-green-400" : "bg-red-400"}`} />
              <span className="text-gray-500 hidden sm:inline">今日剩余</span>
              <span className={`font-bold ${remaining > 0 ? "text-green-600" : "text-red-500"}`}>{remaining}</span>
              <span className="text-gray-400">次</span>
            </div>
            <Badge variant="info">免费版</Badge>
          </div>
        </div>
      </nav>

      {/* ── 移动端工具栏 ── */}
      <div className="md:hidden bg-white border-b border-gray-100 px-4 py-2">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {TOOLS.map((tool) => {
            const Icon = tool.icon
            const isActive = activeTool === tool.id
            return (
              <button
                key={tool.id}
                onClick={() => handleToolChange(tool.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Icon size={14} />
                {tool.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex gap-6 lg:gap-8">
          {/* ── 左侧工具栏（桌面端） ── */}
          <div className="hidden md:block w-52 lg:w-56 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sticky top-20">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 mb-2">选择工具</p>
              <div className="space-y-1">
                {TOOLS.map((tool) => {
                  const Icon = tool.icon
                  const isActive = activeTool === tool.id
                  return (
                    <button
                      key={tool.id}
                      onClick={() => handleToolChange(tool.id)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${
                        isActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isActive ? TOOL_ACTIVE[tool.id] : tool.bg
                        }`}
                      >
                        <Icon size={15} className={isActive ? "text-white" : tool.color} />
                      </div>
                      <div className="min-w-0">
                        <div className={`text-sm font-medium ${isActive ? "text-blue-700" : "text-gray-700"}`}>
                          {tool.label}
                        </div>
                        <div className="text-xs text-gray-400 truncate">{tool.desc}</div>
                      </div>
                      {isActive && <ChevronRight size={14} className="ml-auto text-blue-400 flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>

              {/* 键盘快捷键提示 */}
              <div className="mt-3 px-2">
                <p className="text-[11px] text-gray-400 flex items-center gap-1">
                  <kbd className="bg-gray-100 border border-gray-200 rounded px-1 text-[10px]">⌘</kbd>
                  <kbd className="bg-gray-100 border border-gray-200 rounded px-1 text-[10px]">↵</kbd>
                  快速生成
                </p>
              </div>

              {/* 升级提示 */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 text-center">
                  <Sparkles size={18} className="text-indigo-500 mx-auto mb-1" />
                  <p className="text-xs font-medium text-gray-700 mb-1">升级专业版</p>
                  <p className="text-xs text-gray-400 mb-2">无限次 · 记录保存</p>
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-medium py-1.5 px-3 rounded-lg">
                    ¥29/月 · 即将开放
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── 主内容区 ── */}
          <div className="flex-1 min-w-0 space-y-5">
            {/* 输入卡片 */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
              {/* 工具标题 */}
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-10 h-10 rounded-xl ${currentTool.bg} flex items-center justify-center flex-shrink-0`}>
                  <currentTool.icon size={20} className={currentTool.color} />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">
                    {currentTool.emoji} {currentTool.label}
                  </h1>
                  <p className="text-sm text-gray-400">{currentTool.desc}</p>
                </div>
              </div>

              {/* ── 周报选项 ── */}
              {activeTool === "report" && (
                <div className="mb-4 space-y-3">
                  <div className="flex gap-2">
                    {(["weekly", "daily"] as ReportType[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setReportType(t)}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                          reportType === t
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        {t === "weekly" ? "📅 周报" : "📋 日报"}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={reportName}
                      onChange={(e) => setReportName(e.target.value)}
                      placeholder="姓名（选填）"
                      className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700 bg-gray-50"
                    />
                    <input
                      value={reportDept}
                      onChange={(e) => setReportDept(e.target.value)}
                      placeholder="部门（选填）"
                      className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700 bg-gray-50"
                    />
                  </div>
                </div>
              )}

              {/* ── 文档总结模式 ── */}
              {activeTool === "summary" && (
                <div className="mb-4 flex gap-2">
                  {[
                    { id: "summary" as SummaryMode, label: "📝 通用总结" },
                    { id: "contract" as SummaryMode, label: "📋 合同分析" },
                    { id: "email" as SummaryMode, label: "📧 邮件整理" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSummaryMode(m.id)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                        summaryMode === m.id
                          ? "border-violet-500 bg-violet-50 text-violet-700"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              )}

              {/* ── 邮件起草选项 ── */}
              {activeTool === "email" && (
                <div className="mb-4 space-y-3">
                  {/* 邮件类型 */}
                  <div className="flex gap-2">
                    {(["new", "reply"] as EmailType[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setEmailType(t)}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                          emailType === t
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        {t === "new" ? "📨 新邮件" : "↩️ 回复邮件"}
                      </button>
                    ))}
                  </div>
                  {/* 语气风格 */}
                  <div className="flex gap-2">
                    {[
                      { id: "formal" as EmailTone, label: "🏢 正式" },
                      { id: "friendly" as EmailTone, label: "😊 友好" },
                      { id: "urgent" as EmailTone, label: "⚡ 紧急" },
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setEmailTone(m.id)}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                          emailTone === m.id
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                  {/* 收件人 */}
                  <input
                    value={emailRecipient}
                    onChange={(e) => setEmailRecipient(e.target.value)}
                    placeholder="收件人信息（选填，如：客户张总，负责采购）"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-700 bg-gray-50"
                  />
                </div>
              )}

              {/* 文本输入框 */}
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={currentTool.placeholder}
                rows={8}
                className="mb-4"
                hint={`已输入 ${input.length} 字 · Cmd/Ctrl+Enter 快速生成`}
              />

              {/* 操作栏 */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => { setInput(""); setResult("") }}
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <RotateCcw size={14} />
                  清空重写
                </button>
                <Button
                  onClick={handleGenerate}
                  loading={loading}
                  disabled={remaining === 0 || streaming}
                  size="lg"
                  className="px-6 sm:px-8"
                >
                  {loading
                    ? "连接 AI..."
                    : streaming
                    ? "生成中..."
                    : `✨ 立即生成（剩余 ${remaining} 次）`}
                </Button>
              </div>
            </div>

            {/* 结果卡片 */}
            {(result || loading || streaming) && (
              <div ref={resultRef} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 animate-in">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${streaming ? "bg-blue-400 animate-pulse" : "bg-green-400"}`} />
                    <h2 className="font-bold text-gray-900">
                      {streaming ? "AI 生成中..." : "生成结果"}
                    </h2>
                    {streaming && (
                      <span className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                        实时输出
                      </span>
                    )}
                  </div>
                  {result && !streaming && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleCopy}>
                        <Copy size={14} />
                        复制
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleDownload}>
                        <Download size={14} />
                        下载
                      </Button>
                    </div>
                  )}
                </div>

                {/* 等待连接 spinner */}
                {loading && !result && (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin" />
                      <Zap size={16} className="absolute inset-0 m-auto text-blue-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-gray-700 font-medium">AI 正在连接...</p>
                      <p className="text-gray-400 text-sm mt-1">首次请求需要 2-3 秒建立连接</p>
                    </div>
                  </div>
                )}

                {/* 流式结果（streaming 或已完成） */}
                {result && (
                  <div
                    className="result-content prose max-w-none bg-gray-50 rounded-xl p-5 min-h-24"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(result) + (streaming ? '<span class="typing-cursor">▌</span>' : ""),
                    }}
                  />
                )}

                {/* 完成后操作栏 */}
                {result && !streaming && (
                  <div className="mt-4 flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      <Copy size={14} />
                      复制全文
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleDownload}>
                      <Download size={14} />
                      下载 .txt
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* 空状态 */}
            {!result && !loading && !streaming && (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles size={28} className="text-gray-300" />
                </div>
                <p className="text-gray-400 font-medium">输入内容后点击「立即生成」</p>
                <p className="text-gray-300 text-sm mt-1">
                  或按 <kbd className="bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 text-xs text-gray-500">⌘ Enter</kbd> 快速生成
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 历史记录抽屉 ── */}
      {showHistory && (
        <>
          {/* 遮罩 */}
          <div
            className="fixed inset-0 bg-black/30 z-50 backdrop-blur-sm"
            onClick={() => setShowHistory(false)}
          />
          {/* 抽屉面板 */}
          <div className="fixed right-0 top-0 bottom-0 w-80 sm:w-96 bg-white z-50 shadow-2xl flex flex-col animate-slide-in-right">
            {/* 抽屉头部 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <History size={18} className="text-gray-700" />
                <h2 className="font-bold text-gray-900">历史记录</h2>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{history.length}</span>
              </div>
              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 size={12} />
                    清空
                  </button>
                )}
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* 历史列表 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {history.length === 0 ? (
                <div className="text-center py-16">
                  <Clock size={36} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">还没有历史记录</p>
                  <p className="text-gray-300 text-xs mt-1">生成内容后会自动保存</p>
                </div>
              ) : (
                history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => restoreFromHistory(item)}
                    className="w-full text-left bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 rounded-xl p-4 transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">{item.toolEmoji}</span>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                        {item.toolLabel}
                      </span>
                      <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
                        <Clock size={10} />
                        {timeAgo(item.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {item.input.slice(0, 80)}
                      {item.input.length > 80 ? "..." : ""}
                    </p>
                    <p className="text-xs text-blue-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      点击还原 →
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
