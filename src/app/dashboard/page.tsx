"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import {
  ClipboardList, FileText, BookOpen, Copy, Download,
  Zap, ChevronRight, RotateCcw, ArrowLeft, Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"
import { canUseToday, getRemainingCount, incrementUsage, DAILY_LIMIT } from "@/lib/storage"

type Tool = "meeting" | "report" | "summary"
type ReportType = "weekly" | "daily"
type SummaryMode = "summary" | "contract" | "email"

const TOOLS = [
  {
    id: "meeting" as Tool,
    icon: ClipboardList,
    label: "会议纪要",
    emoji: "🗒️",
    desc: "自动整理会议内容",
    color: "text-blue-600",
    bg: "bg-blue-50",
    activeBg: "bg-blue-600",
    placeholder: "粘贴会议记录或会议对话内容...\n\n例如：\n今天开了产品需求评审会，张总说要在下周五前完成登录模块，李工负责后端接口，王工负责前端页面，测试由小陈负责...",
  },
  {
    id: "report" as Tool,
    icon: FileText,
    label: "周报日报",
    emoji: "📊",
    desc: "一键生成专业报告",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    activeBg: "bg-indigo-600",
    placeholder: "输入本周/本日完成的工作内容...\n\n例如：\n完成了用户中心模块的开发，修复了3个线上bug，参加了产品需求评审会议，整理了技术文档，下周计划完成支付模块...",
  },
  {
    id: "summary" as Tool,
    icon: BookOpen,
    label: "文档总结",
    emoji: "📄",
    desc: "快速提取文档要点",
    color: "text-violet-600",
    bg: "bg-violet-50",
    activeBg: "bg-violet-600",
    placeholder: "粘贴需要总结的文档内容...\n\n支持：长文章、合同条款、邮件内容、方案报告等",
  },
]

export default function Dashboard() {
  const [activeTool, setActiveTool] = useState<Tool>("meeting")
  const [input, setInput] = useState("")
  const [result, setResult] = useState("")
  const [loading, setLoading] = useState(false)
  const [remaining, setRemaining] = useState(DAILY_LIMIT)

  // Report options
  const [reportType, setReportType] = useState<ReportType>("weekly")
  const [reportName, setReportName] = useState("")
  const [reportDept, setReportDept] = useState("")

  // Summary options
  const [summaryMode, setSummaryMode] = useState<SummaryMode>("summary")

  const { showToast } = useToast()
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setRemaining(getRemainingCount())
  }, [])

  const currentTool = TOOLS.find((t) => t.id === activeTool)!

  function handleToolChange(tool: Tool) {
    setActiveTool(tool)
    setInput("")
    setResult("")
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

    setLoading(true)
    setResult("")

    try {
      let endpoint = ""
      let body: Record<string, string> = { content: input }

      if (activeTool === "meeting") {
        endpoint = "/api/meeting"
      } else if (activeTool === "report") {
        endpoint = "/api/report"
        body = { content: input, type: reportType, name: reportName, department: reportDept }
      } else {
        endpoint = "/api/summary"
        body = { content: input, mode: summaryMode }
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "请求失败")
      }

      setResult(data.result)
      incrementUsage()
      setRemaining(getRemainingCount())
      showToast("生成成功！", "success")

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 100)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "生成失败，请重试"
      showToast(msg, "error")
    } finally {
      setLoading(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(result)
    showToast("已复制到剪贴板", "success")
  }

  function handleDownload() {
    const labels: Record<Tool, string> = { meeting: "会议纪要", report: "工作报告", summary: "文档总结" }
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${labels[activeTool]}_${new Date().toLocaleDateString("zh-CN").replace(/\//g, "-")}.txt`
    a.click()
    URL.revokeObjectURL(url)
    showToast("文件已下载", "success")
  }

  // 简单 Markdown 渲染
  function renderMarkdown(text: string) {
    return text
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^---$/gm, '<hr/>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
      .replace(/\n/g, '<br/>')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 transition-colors text-sm">
              <ArrowLeft size={14} />
              返回首页
            </Link>
            <div className="w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Zap size={13} className="text-white" />
              </div>
              <span className="font-bold text-gray-900">效率星</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm">
              <div className={`w-2 h-2 rounded-full ${remaining > 0 ? "bg-green-400" : "bg-red-400"}`} />
              <span className="text-gray-500">今日剩余</span>
              <span className={`font-bold ${remaining > 0 ? "text-green-600" : "text-red-500"}`}>{remaining}</span>
              <span className="text-gray-400">次</span>
            </div>
            <Badge variant="info">免费版</Badge>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* 左侧工具选择 */}
          <div className="w-56 flex-shrink-0">
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
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isActive ? "bg-blue-600" : tool.bg
                      }`}>
                        <Icon size={15} className={isActive ? "text-white" : tool.color} />
                      </div>
                      <div>
                        <div className={`text-sm font-medium ${isActive ? "text-blue-700" : "text-gray-700"}`}>
                          {tool.label}
                        </div>
                        <div className="text-xs text-gray-400">{tool.desc}</div>
                      </div>
                      {isActive && <ChevronRight size={14} className="ml-auto text-blue-400" />}
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
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

          {/* 主内容区 */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* 输入区域 */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-10 h-10 rounded-xl ${currentTool.bg} flex items-center justify-center`}>
                  <currentTool.icon size={20} className={currentTool.color} />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">{currentTool.emoji} {currentTool.label}</h1>
                  <p className="text-sm text-gray-400">{currentTool.desc}</p>
                </div>
              </div>

              {/* 周报附加选项 */}
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

              {/* 文档总结模式选择 */}
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

              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={currentTool.placeholder}
                rows={8}
                className="mb-4"
                hint={`已输入 ${input.length} 字`}
              />

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
                  disabled={remaining === 0}
                  size="lg"
                  className="px-8"
                >
                  {loading ? "AI 生成中..." : `✨ 立即生成（剩余 ${remaining} 次）`}
                </Button>
              </div>
            </div>

            {/* 结果区域 */}
            {(result || loading) && (
              <div ref={resultRef} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-in">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <h2 className="font-bold text-gray-900">生成结果</h2>
                  </div>
                  {result && (
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

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin" />
                      <Zap size={16} className="absolute inset-0 m-auto text-blue-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-gray-700 font-medium">AI 正在处理...</p>
                      <p className="text-gray-400 text-sm mt-1">通常需要 5-15 秒</p>
                    </div>
                  </div>
                ) : (
                  <div
                    className="result-content prose max-w-none bg-gray-50 rounded-xl p-5 min-h-24"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(result) }}
                  />
                )}
              </div>
            )}

            {/* 空状态提示 */}
            {!result && !loading && (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles size={28} className="text-gray-300" />
                </div>
                <p className="text-gray-400 font-medium">输入内容后点击「立即生成」</p>
                <p className="text-gray-300 text-sm mt-1">AI 将在 10 秒内完成处理</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
