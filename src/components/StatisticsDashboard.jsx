import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, TrendingUp, Target, Clock, CheckCircle2, Calendar,
  BarChart3, PieChart, Activity, ChevronLeft, ChevronRight,
  Flame, Zap, Award, BookOpen
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts'

// 统计卡片组件
const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-5 rounded-3xl bg-white dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700/50"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>
        )}
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs ${trend > 0 ? 'text-green-500' : 'text-rose-500'}`}>
            <TrendingUp className="w-3 h-3" />
            <span>{trend > 0 ? '+' : ''}{trend}% 较上周</span>
          </div>
        )}
      </div>
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </motion.div>
)

// 统计仪表板组件
const StatisticsDashboard = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [timeRange, setTimeRange] = useState('week')
  const [stats, setStats] = useState(null)

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

  // 加载统计数据
  useEffect(() => {
    if (!isOpen) return

    const loadStats = () => {
      const now = new Date()
      const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

      // 加载各类数据
      const todos = JSON.parse(localStorage.getItem('myku_todos') || '[]')
      const habits = JSON.parse(localStorage.getItem('myku_habits') || '[]')
      const notes = JSON.parse(localStorage.getItem('myku_notes') || '[]')
      const focusSessions = JSON.parse(localStorage.getItem('myku_focus_sessions') || '[]')
      const calendarEvents = JSON.parse(localStorage.getItem('myku_calendar_events') || '[]')

      // 计算待办统计
      const completedTodos = todos.filter(t => t.completed)
      const completionRate = todos.length > 0 ? Math.round((completedTodos.length / todos.length) * 100) : 0

      // 计算专注时间
      const totalFocusMinutes = focusSessions.reduce((sum, s) => sum + (s.duration || 0), 0)
      const totalFocusHours = Math.round(totalFocusMinutes / 60 * 10) / 10

      // 计算习惯连续天数
      const totalStreak = habits.reduce((sum, h) => sum + (h.streak || 0), 0)
      const avgStreak = habits.length > 0 ? Math.round(totalStreak / habits.length) : 0

      // 生成每日数据（用于图表）
      const dailyData = []
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dateStr = date.toISOString().split('T')[0]
        const dayStart = new Date(date.setHours(0, 0, 0, 0))
        const dayEnd = new Date(date.setHours(23, 59, 59, 999))

        const dayTodos = todos.filter(t => {
          const tDate = new Date(t.completedAt || t.createdAt)
          return tDate >= dayStart && tDate <= dayEnd && t.completed
        }).length

        const dayFocus = focusSessions
          .filter(s => {
            const sDate = new Date(s.date || s.startTime)
            return sDate >= dayStart && sDate <= dayEnd
          })
          .reduce((sum, s) => sum + (s.duration || 0), 0) / 60

        dailyData.push({
          date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
          todos: dayTodos,
          focus: Math.round(dayFocus * 10) / 10,
          fullDate: dateStr
        })
      }

      // 待办分类统计
      const todoCategories = {}
      todos.forEach(t => {
        const cat = t.category || '未分类'
        todoCategories[cat] = (todoCategories[cat] || 0) + 1
      })
      const categoryData = Object.entries(todoCategories)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6)

      // 习惯完成统计
      const habitStats = habits.map(h => ({
        name: h.name,
        streak: h.streak || 0,
        completed: h.completedDates?.length || 0,
        rate: h.completedDates?.length > 0
          ? Math.round((h.completedDates.length / days) * 100)
          : 0
      })).sort((a, b) => b.streak - a.streak).slice(0, 5)

      // 生产力评分（综合指标）
      const productivityScore = Math.min(100, Math.round(
        (completionRate * 0.3) +
        (Math.min(totalFocusHours * 5, 30)) +
        (avgStreak * 5) +
        (notes.length * 2)
      ))

      setStats({
        overview: {
          totalTodos: todos.length,
          completedTodos: completedTodos.length,
          completionRate,
          totalFocusHours,
          totalNotes: notes.length,
          totalHabits: habits.length,
          avgStreak,
          productivityScore,
          totalEvents: calendarEvents.length
        },
        dailyData,
        categoryData,
        habitStats,
        recentActivity: [
          ...todos.slice(-5).map(t => ({
            type: 'todo',
            title: t.task || t.title,
            time: t.completedAt || t.createdAt,
            status: t.completed ? 'completed' : 'created'
          })),
          ...notes.slice(-3).map(n => ({
            type: 'note',
            title: n.title,
            time: n.updatedAt || n.createdAt,
            status: 'updated'
          })),
          ...focusSessions.slice(-3).map(s => ({
            type: 'focus',
            title: `${s.duration} 分钟专注`,
            time: s.date || s.startTime,
            status: 'completed'
          }))
        ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8)
      })
    }

    loadStats()
  }, [isOpen, timeRange])

  const timeRangeOptions = [
    { key: 'week', label: '本周' },
    { key: 'month', label: '本月' },
    { key: 'year', label: '全年' }
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      {/* 主面板 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">数据统计</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">查看您的 productivity 分析</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* 时间范围选择 */}
            <div className="flex p-1 bg-gray-100 dark:bg-zinc-800 rounded-xl">
              {timeRangeOptions.map(option => (
                <button
                  key={option.key}
                  onClick={() => setTimeRange(option.key)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    timeRange === option.key
                      ? 'bg-white dark:bg-zinc-700 text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* 标签页 */}
        <div className="flex px-6 pt-4 gap-1 border-b border-gray-100 dark:border-zinc-800">
          {[
            { key: 'overview', label: '总览', icon: Activity },
            { key: 'todos', label: '待办', icon: CheckCircle2 },
            { key: 'habits', label: '习惯', icon: Target },
            { key: 'focus', label: '专注', icon: Clock },
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all ${
                  activeTab === tab.key
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          {!stats ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {/* 总览标签 */}
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* 生产力评分 */}
                  <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm">生产力评分</p>
                        <p className="text-5xl font-bold mt-2">{stats.overview.productivityScore}</p>
                        <p className="text-purple-100 text-sm mt-2">
                          {stats.overview.productivityScore >= 80 ? '太棒了！保持这个节奏' :
                           stats.overview.productivityScore >= 60 ? '不错，继续加油' : '还有提升空间'}
                        </p>
                      </div>
                      <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
                        <Award className="w-12 h-12 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* 统计卡片 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                      title="待办完成率"
                      value={`${stats.overview.completionRate}%`}
                      subtitle={`${stats.overview.completedTodos}/${stats.overview.totalTodos}`}
                      icon={CheckCircle2}
                      color="bg-blue-500"
                      trend={5}
                    />
                    <StatCard
                      title="专注时长"
                      value={`${stats.overview.totalFocusHours}h`}
                      subtitle="累计专注时间"
                      icon={Clock}
                      color="bg-amber-500"
                      trend={12}
                    />
                    <StatCard
                      title="习惯连续"
                      value={`${stats.overview.avgStreak}天`}
                      subtitle="平均连续天数"
                      icon={Flame}
                      color="bg-rose-500"
                    />
                    <StatCard
                      title="笔记数量"
                      value={stats.overview.totalNotes}
                      subtitle="已创建笔记"
                      icon={BookOpen}
                      color="bg-green-500"
                    />
                  </div>

                  {/* 活动趋势图 */}
                  <div className="p-6 rounded-3xl bg-gray-50 dark:bg-zinc-800/50">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">活动趋势</h3>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.dailyData}>
                          <defs>
                            <linearGradient id="colorTodos" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
                          <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                          <YAxis stroke="#9CA3AF" fontSize={12} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: 'none',
                              borderRadius: '12px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <Area type="monotone" dataKey="todos" stroke="#3B82F6" fillOpacity={1} fill="url(#colorTodos)" name="完成任务" />
                          <Area type="monotone" dataKey="focus" stroke="#F59E0B" fillOpacity={1} fill="url(#colorFocus)" name="专注时长" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 待办标签 */}
              {activeTab === 'todos' && (
                <motion.div
                  key="todos"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 分类统计 */}
                    <div className="p-6 rounded-3xl bg-gray-50 dark:bg-zinc-800/50">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">分类分布</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <RePieChart>
                            <Pie
                              data={stats.categoryData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {stats.categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </RePieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {stats.categoryData.map((cat, index) => (
                          <div key={cat.name} className="flex items-center gap-1.5 text-xs">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-gray-600 dark:text-gray-400">{cat.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 完成趋势 */}
                    <div className="p-6 rounded-3xl bg-gray-50 dark:bg-zinc-800/50">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">每日完成</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stats.dailyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
                            <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                            <YAxis stroke="#9CA3AF" fontSize={12} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                border: 'none',
                                borderRadius: '12px'
                              }}
                            />
                            <Bar dataKey="todos" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 习惯标签 */}
              {activeTab === 'habits' && (
                <motion.div
                  key="habits"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stats.habitStats.map((habit, index) => (
                      <motion.div
                        key={habit.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-5 rounded-3xl bg-gray-50 dark:bg-zinc-800/50"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-gray-900 dark:text-white">{habit.name}</span>
                          <div className="flex items-center gap-1 text-rose-500">
                            <Flame className="w-4 h-4" />
                            <span className="text-sm font-medium">{habit.streak}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">完成率</span>
                            <span className="text-gray-900 dark:text-white">{habit.rate}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-gray-200 dark:bg-zinc-700 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${habit.rate}%` }}
                              transition={{ duration: 0.5, delay: index * 0.1 }}
                              className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-500"
                            />
                          </div>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            已完成 {habit.completed} 次
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* 专注标签 */}
              {activeTab === 'focus' && (
                <motion.div
                  key="focus"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-500/10 text-center">
                      <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                        {stats.overview.totalFocusHours}
                      </p>
                      <p className="text-sm text-amber-600/70 dark:text-amber-400/70 mt-1">总专注小时</p>
                    </div>
                    <div className="p-5 rounded-3xl bg-blue-50 dark:bg-blue-500/10 text-center">
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {Math.round(stats.overview.totalFocusHours / (timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365) * 10) / 10}
                      </p>
                      <p className="text-sm text-blue-600/70 dark:text-blue-400/70 mt-1">日均专注</p>
                    </div>
                    <div className="p-5 rounded-3xl bg-green-50 dark:bg-green-500/10 text-center">
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {Math.round(stats.overview.totalFocusHours * 60 / Math.max(stats.dailyData.reduce((sum, d) => sum + d.focus, 0), 1)) || 0}
                      </p>
                      <p className="text-sm text-green-600/70 dark:text-green-400/70 mt-1">平均单次</p>
                    </div>
                  </div>

                  <div className="p-6 rounded-3xl bg-gray-50 dark:bg-zinc-800/50">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">专注时长趋势</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats.dailyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
                          <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                          <YAxis stroke="#9CA3AF" fontSize={12} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: 'none',
                              borderRadius: '12px'
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="focus"
                            stroke="#F59E0B"
                            strokeWidth={3}
                            dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6 }}
                            name="专注时长(小时)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default StatisticsDashboard
