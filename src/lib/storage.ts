// 本地用量追踪（免费用户每日限制）
const FREE_DAILY_LIMIT = 5

export function getTodayUsage(): number {
  if (typeof window === "undefined") return 0
  const today = new Date().toDateString()
  const stored = localStorage.getItem("ai_office_usage")
  if (!stored) return 0
  const data = JSON.parse(stored)
  if (data.date !== today) return 0
  return data.count || 0
}

export function incrementUsage(): void {
  if (typeof window === "undefined") return
  const today = new Date().toDateString()
  const current = getTodayUsage()
  localStorage.setItem(
    "ai_office_usage",
    JSON.stringify({ date: today, count: current + 1 })
  )
}

export function canUseToday(): boolean {
  return getTodayUsage() < FREE_DAILY_LIMIT
}

export function getRemainingCount(): number {
  return Math.max(0, FREE_DAILY_LIMIT - getTodayUsage())
}

export const DAILY_LIMIT = FREE_DAILY_LIMIT
