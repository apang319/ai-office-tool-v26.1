import Link from "next/link"
import { ArrowRight, FileText, ClipboardList, BookOpen, Zap, Shield, Clock, Star } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* 导航栏 */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">效率星</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              免费试用 <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero 区域 */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-indigo-50 to-white pt-20 pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Zap size={14} />
            基于 Kimi AI · 国内极速响应
          </div>
          <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-6">
            告别低效办公<br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              AI 帮你搞定一切
            </span>
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            会议纪要、周报日报、文档总结 — 粘贴内容，10秒生成，<br />专业高效，让你把时间花在真正重要的事上
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/dashboard"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold px-8 py-4 rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl text-lg flex items-center gap-2 active:scale-95"
            >
              立即免费使用 <ArrowRight size={18} />
            </Link>
            <div className="flex items-center gap-1 text-gray-400 text-sm">
              <Shield size={14} />
              每日免费 5 次 · 无需注册
            </div>
          </div>
        </div>
      </section>

      {/* 功能卡片 */}
      <section className="max-w-6xl mx-auto px-6 -mt-12 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <ClipboardList size={28} className="text-blue-600" />,
              bg: "bg-blue-50",
              title: "🗒️ 会议纪要",
              desc: "粘贴会议内容，自动生成结构化纪要",
              features: ["核心议题提炼", "决策结论整理", "待办任务分配"],
              badge: "最受欢迎",
              badgeColor: "bg-blue-600",
            },
            {
              icon: <FileText size={28} className="text-indigo-600" />,
              bg: "bg-indigo-50",
              title: "📊 周报日报",
              desc: "输入工作内容，一键生成专业报告",
              features: ["工作成果提炼", "问题与解决方案", "下周工作计划"],
              badge: "高频刚需",
              badgeColor: "bg-indigo-600",
            },
            {
              icon: <BookOpen size={28} className="text-violet-600" />,
              bg: "bg-violet-50",
              title: "📄 文档总结",
              desc: "长文档、合同、邮件快速提取要点",
              features: ["核心内容概括", "关键数据提取", "风险要点提示"],
              badge: "效率神器",
              badgeColor: "bg-violet-600",
            },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-6 hover:-translate-y-1">
              <div className={`${item.bg} w-14 h-14 rounded-2xl flex items-center justify-center mb-4`}>
                {item.icon}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                <span className={`text-xs text-white px-2 py-0.5 rounded-full ${item.badgeColor}`}>{item.badge}</span>
              </div>
              <p className="text-gray-500 text-sm mb-4">{item.desc}</p>
              <ul className="space-y-2">
                {item.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* 使用步骤 */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">三步完成，10秒出结果</h2>
          <p className="text-gray-500 mb-12">无需学习成本，上手即用</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "选择工具", desc: "会议纪要 / 周报日报 / 文档总结，按需选择" },
              { step: "02", title: "粘贴内容", desc: "把原始内容粘贴进来，几句话到几千字都行" },
              { step: "03", title: "一键生成", desc: "点击生成，AI 即刻处理，复制结果直接使用" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg mb-4 shadow-lg">
                  {item.step}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 定价 */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">简单透明的定价</h2>
          <p className="text-gray-500">先免费体验，满意再升级</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-8">
            <div className="text-gray-500 text-sm font-medium mb-2">免费版</div>
            <div className="text-4xl font-bold text-gray-900 mb-1">¥0</div>
            <div className="text-gray-400 text-sm mb-6">永久免费</div>
            <ul className="space-y-3 mb-8">
              {["每日 5 次使用", "全部 3 个工具", "无需注册登录"].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/dashboard" className="block text-center border-2 border-blue-500 text-blue-600 font-medium py-3 rounded-xl hover:bg-blue-50 transition-colors">
              免费开始
            </Link>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
              推荐
            </div>
            <div className="text-blue-200 text-sm font-medium mb-2">专业版</div>
            <div className="text-4xl font-bold mb-1">¥29</div>
            <div className="text-blue-200 text-sm mb-6">每月</div>
            <ul className="space-y-3 mb-8">
              {["无限次使用", "全部 3 个工具", "历史记录保存", "优先处理速度", "专属客服支持"].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  {f}
                </li>
              ))}
            </ul>
            <button className="w-full bg-white text-blue-600 font-semibold py-3 rounded-xl hover:bg-blue-50 transition-colors">
              即将开放
            </button>
          </div>
        </div>
      </section>

      {/* 用户评价 */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">用户怎么说</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { name: "张经理", role: "产品总监", text: "每周写周报最烦了，用了这个工具之后5分钟搞定，节省了我大量时间！" },
              { name: "李小姐", role: "市场运营", text: "会议纪要整理得非常专业，格式规范，待办事项一目了然，老板表扬了我。" },
              { name: "王工", role: "技术主管", text: "合同要点提取功能太好用了，再也不用一页一页翻合同找关键条款了。" },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, j) => <Star key={j} size={14} className="fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">&ldquo;{item.text}&rdquo;</p>
                <div>
                  <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                  <div className="text-gray-400 text-xs">{item.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">现在就开始，每天省出 1 小时</h2>
        <p className="text-blue-200 mb-8">无需注册 · 免费使用 · 10 秒出结果</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-white text-blue-600 font-bold px-8 py-4 rounded-2xl hover:bg-blue-50 transition-all shadow-lg text-lg"
        >
          立即免费试用 <ArrowRight size={18} />
        </Link>
      </section>

      {/* 底部 */}
      <footer className="bg-gray-900 text-gray-400 py-10 text-center text-sm">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md flex items-center justify-center">
            <Zap size={12} className="text-white" />
          </div>
          <span className="text-white font-semibold">效率星</span>
        </div>
        <p>© 2026 效率星 · AI 驱动的智能办公助手 · <Clock size={12} className="inline" /> 帮你节省每一分钟</p>
      </footer>
    </div>
  )
}
