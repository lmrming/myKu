import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Check, X, TrendingUp, Calendar, Trophy, Flame,
  Target, Clock, ChevronLeft, ChevronRight, Zap, Award,
  BarChart3, Star, Sparkles, Crown, Diamond, Medal
} from 'lucide-react'
import { loadHabitsFromDB } from '../services/dataSync.js'

// ============ 设计令牌 ============
// 使用 Tailwind dark: 前缀支持深色模式
const EDITORIAL = {
  serif: "'Playfair Display', 'Noto Serif SC', Georgia, serif",
  sans: "'Inter', 'Noto Sans SC', -apple-system, sans-serif",
}

const HABIT_ICONS = [
  { icon: '💪', name: '健身' }, { icon: '📚', name: '阅读' },
  { icon: '💧', name: '喝水' }, { icon: '😴', name: '早睡' },
  { icon: '🧘', name: '冥想' }, { icon: '✍️', name: '写作' },
  { icon: '🎨', name: '绘画' }, { icon: '🎵', name: '音乐' },
  { icon: '🥗', name: '健康饮食' }, { icon: '🚶', name: '步行' },
  { icon: '💊', name: '服药' }, { icon: '🌱', name: '学习' },
]

const HABIT_COLORS = [
  { bg: '#dc2626', soft: '#fee2e2', text: '#991b1b' },
  { bg: '#ea580c', soft: '#ffedd5', text: '#9a3412' },
  { bg: '#ca8a04', soft: '#fef9c3', text: '#854d0e' },
  { bg: '#16a34a', soft: '#dcfce7', text: '#166534' },
  { bg: '#0d9488', soft: '#ccfbf1', text: '#115e59' },
  { bg: '#2563eb', soft: '#dbeafe', text: '#1e40af' },
  { bg: '#4f46e5', soft: '#e0e7ff', text: '#3730a3' },
  { bg: '#9333ea', soft: '#f3e8ff', text: '#6b21a8' },
  { bg: '#db2777', soft: '#fce7f3', text: '#9d174d' },
]

// 签到里程碑奖励
const MILESTONES = [
  { days: 7, badge: '🥉', title: '初露锋芒', color: '#cd7f32', desc: '连续签到7天' },
  { days: 14, badge: '🥈', title: '坚持不懈', color: '#c0c0c0', desc: '连续签到14天' },
  { days: 21, badge: '🥇', title: '习惯成自然', color: '#ffd700', desc: '连续签到21天' },
  { days: 30, badge: '💎', title: '登峰造极', color: '#60a5fa', desc: '连续签到30天' },
]

// ============ 粒子动效组件 ============
const ParticleBurst = ({ x, y, color, onComplete }) => {
  const particles = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      id: i,
      angle: (i / 24) * Math.PI * 2,
      distance: 60 + Math.random() * 80,
      size: 4 + Math.random() * 6,
      duration: 0.5 + Math.random() * 0.4,
      delay: Math.random() * 0.1,
    }))
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-[100]" style={{ left: 0, top: 0 }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ x, y, scale: 1, opacity: 1 }}
          animate={{
            x: x + Math.cos(p.angle) * p.distance,
            y: y + Math.sin(p.angle) * p.distance,
            scale: 0,
            opacity: 0,
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' }}
          onAnimationComplete={p.id === 0 ? onComplete : undefined}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: color,
            marginLeft: -p.size / 2,
            marginTop: -p.size / 2,
          }}
        />
      ))}
    </div>
  )
}

// 签到成功徽章弹出
const BadgePopup = ({ milestone, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[90] flex items-center justify-center bg-black/30 backdrop-blur-sm"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.3, rotate: -10 }}
      animate={{ scale: 1, rotate: 0 }}
      exit={{ scale: 0.3, opacity: 0 }}
      transition={{ type: 'spring', damping: 12 }}
      className="text-center"
      onClick={e => e.stopPropagation()}
    >
      <motion.div
        animate={{ rotate: [0, -5, 5, -5, 0] }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="text-8xl mb-4"
      >
        {milestone.badge}
      </motion.div>
      <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: EDITORIAL.serif }}>
        {milestone.title}
      </h3>
      <p className="text-white/80 mb-6">{milestone.desc}</p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClose}
        className="px-8 py-3 bg-white text-neutral-900 rounded-full font-medium"
      >
        太棒了！
      </motion.button>
    </motion.div>
  </motion.div>
)

// 连续火焰动效
const StreakFlame = ({ streak }) => (
  <motion.div
    className="relative inline-flex items-center gap-1"
    animate={streak > 0 ? { scale: [1, 1.1, 1] } : {}}
    transition={{ duration: 2, repeat: Infinity }}
  >
    <Flame className="w-4 h-4 text-orange-500" />
    <span className="font-bold text-orange-600">{streak}</span>
    <span className="text-xs text-orange-400">天连胜</span>
    {streak >= 7 && (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="absolute -top-1 -right-2 text-xs"
      >
        🔥
      </motion.div>
    )}
  </motion.div>
)

// ============ 主组件 ============
const Habits = () => {
  const [habits, setHabits] = useState([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedHabit, setSelectedHabit] = useState(null)
  const [checkInAnim, setCheckInAnim] = useState(null)
  const [newBadge, setNewBadge] = useState(null)
  const [checkInHistory, setCheckInHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('myku_checkin_history') || '{}') }
    catch { return {} }
  })

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}')
        if (user.id) {
          const dbHabits = await loadHabitsFromDB()
          if (dbHabits.length > 0) { setHabits(dbHabits); return }
        }
      } catch (e) { console.warn('DB load failed:', e.message) }
      try {
        const saved = localStorage.getItem('myku_habits')
        if (saved) setHabits(JSON.parse(saved))
      } catch (e) { console.error(e) }
    }
    loadData()
  }, [])

  useEffect(() => {
    localStorage.setItem('myku_habits', JSON.stringify(habits))
  }, [habits])

  useEffect(() => {
    localStorage.setItem('myku_checkin_history', JSON.stringify(checkInHistory))
  }, [checkInHistory])

  // 新习惯表单
  const [newHabit, setNewHabit] = useState({
    name: '', icon: 0, color: 3, targetDays: 21, reminder: '', description: ''
  })

  const getDateString = (date) => date.toISOString().split('T')[0]

  const getMonthData = useCallback(() => {
    const year = currentDate.getFullYear(), month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const startDayOfWeek = firstDay.getDay()
    const days = []
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month, -i), isCurrentMonth: false })
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true })
    }
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false })
    }
    return days
  }, [currentDate])

  const changeMonth = (delta) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1))
  }

  // 创建习惯
  const createHabit = () => {
    if (!newHabit.name.trim()) return
    const habit = {
      id: Date.now(), ...newHabit,
      createdAt: new Date().toISOString(),
      completedDates: [], streak: 0, longestStreak: 0, totalCompletions: 0
    }
    setHabits(prev => [...prev, habit])
    setShowAddModal(false)
    setNewHabit({ name: '', icon: 0, color: 3, targetDays: 21, reminder: '', description: '' })
  }

  const deleteHabit = (id) => {
    setHabits(prev => prev.filter(h => h.id !== id))
    setSelectedHabit(null)
  }

  // 计算连续天数
  const calculateStreak = (dates) => {
    if (dates.length === 0) return 0
    const sorted = [...dates].sort().reverse()
    const today = getDateString(new Date())
    const yesterday = getDateString(new Date(Date.now() - 86400000))
    if (sorted[0] !== today && sorted[0] !== yesterday) return 0
    let streak = 1
    for (let i = 1; i < sorted.length; i++) {
      const diff = (new Date(sorted[i - 1]) - new Date(sorted[i])) / 86400000
      if (diff === 1) streak++; else break
    }
    return streak
  }

  // 签到/打卡 - 同步到数据库
  const handleCheckIn = async (habitId, e) => {
    e?.stopPropagation()
    const dateStr = getDateString(new Date())

    // 先检查今天是否已签到
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return

    const completedDates = habit.completedDates || []
    const isCompleted = completedDates.includes(dateStr)

    // 同步到数据库
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}')
      if (user.id) {
        if (!isCompleted) {
          // 签到 - 插入记录
          const response = await fetch(`http://localhost:3002/api/habits/${habitId}/checkin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id })
          })
          if (!response.ok) throw new Error('打卡同步失败')
        } else {
          // 取消签到 - 删除今天的记录
          const response = await fetch(`http://localhost:3002/api/habits/${habitId}/checkin`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, date: dateStr })
          })
          if (!response.ok) throw new Error('取消打卡同步失败')
        }
      }
    } catch (err) {
      console.warn('数据库同步失败，仅更新本地:', err.message)
    }

    // 更新本地状态
    setHabits(prev => prev.map(h => {
      if (h.id !== habitId) return h

      const dates = h.completedDates || []
      const wasCompleted = dates.includes(dateStr)
      let newCompletedDates

      if (wasCompleted) {
        newCompletedDates = dates.filter(d => d !== dateStr)
      } else {
        newCompletedDates = [...dates, dateStr].sort()
        // 触发粒子动效
        const rect = e?.target?.getBoundingClientRect()
        if (rect) {
          setCheckInAnim({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            color: HABIT_COLORS[h.color].bg
          })
        }
      }

      const streak = calculateStreak(newCompletedDates)
      const longestStreak = Math.max(streak, h.longestStreak || 0)

      // 检查里程碑
      if (!wasCompleted) {
        const milestone = MILESTONES.find(m => streak === m.days)
        if (milestone) {
          setTimeout(() => setNewBadge(milestone), 600)
        }
      }

      return {
        ...h, completedDates: newCompletedDates,
        streak, longestStreak, totalCompletions: newCompletedDates.length
      }
    }))

    // 更新签到历史
    if (!isCompleted) {
      setCheckInHistory(prev => ({ ...prev, [dateStr]: true }))
    }
  }

  const isCompletedOnDate = (habit, date) => {
    return (habit.completedDates || []).includes(getDateString(date))
  }

  const todayCompleted = useMemo(() => {
    const today = getDateString(new Date())
    return habits.filter(h => (h.completedDates || []).includes(today)).length
  }, [habits])

  const totalStreak = useMemo(() => {
    return habits.reduce((sum, h) => sum + (h.streak || 0), 0)
  }, [habits])

  const getCompletionRate = (habit) => {
    const days = Math.max(1, Math.floor((Date.now() - new Date(habit.createdAt).getTime()) / 86400000))
    return Math.round((habit.totalCompletions / days) * 100)
  }

  const getWeeklyData = (habit) => {
    const data = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      data.push({
        day: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
        completed: isCompletedOnDate(habit, date)
      })
    }
    return data
  }

  // 连续签到天数（全局）
  const globalStreak = useMemo(() => {
    const dates = Object.keys(checkInHistory).sort().reverse()
    if (dates.length === 0) return 0
    const today = getDateString(new Date())
    const yesterday = getDateString(new Date(Date.now() - 86400000))
    if (dates[0] !== today && dates[0] !== yesterday) return 0
    let streak = 1
    for (let i = 1; i < dates.length; i++) {
      const diff = (new Date(dates[i - 1]) - new Date(dates[i])) / 86400000
      if (diff === 1) streak++; else break
    }
    return streak
  }, [checkInHistory])

  const monthData = getMonthData()
  const monthNames = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月']

  return (
    <div className="min-h-screen transition-colors duration-300 bg-[#f8f4ec] dark:bg-neutral-950">
      {/* 粒子动效层 */}
      <AnimatePresence>
        {checkInAnim && (
          <ParticleBurst
            {...checkInAnim}
            onComplete={() => setCheckInAnim(null)}
          />
        )}
      </AnimatePresence>

      {/* 徽章弹出 */}
      <AnimatePresence>
        {newBadge && (
          <BadgePopup milestone={newBadge} onClose={() => setNewBadge(null)} />
        )}
      </AnimatePresence>

      {/* ===== 杂志化页眉 ===== */}
      <section className="relative overflow-hidden border-b border-black/10 dark:border-white/10">
        <div className="absolute inset-y-0 right-0 hidden w-[42%] lg:block">
          <img
            src="https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=1200&q=85"
            alt=""
            className="h-full w-full object-cover opacity-60 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#f8f4ec]/30 to-[#f8f4ec] dark:via-neutral-950/30 dark:to-neutral-950" />
        </div>

        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* 杂志编号 */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-neutral-400 dark:text-neutral-500">
                HABITS ISSUE 01
              </span>
              <div className="h-px flex-1 max-w-[60px] bg-black/10 dark:bg-white/10" />
            </div>

            {/* 主标题 */}
            <h1 className="font-serif text-[clamp(3.5rem,10vw,7rem)] leading-[0.85] tracking-tight text-neutral-950 dark:text-white" style={{ fontFamily: EDITORIAL.serif }}>
              习惯
            </h1>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-neutral-600 dark:text-neutral-300">
              以每日微小的坚持，雕刻更好的自己。记录每一次打卡，见证习惯的养成。
            </p>

            {/* 今日签到区 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 flex items-center gap-6"
            >
              <div className="flex items-center gap-3 px-5 py-3 border border-black/10 dark:border-white/10 rounded-xl">
                <Flame className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500">连续签到</p>
                  <p className="text-2xl font-bold leading-none text-neutral-950 dark:text-white">
                    {globalStreak}<span className="text-sm font-normal ml-1">天</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-5 py-3 border border-black/10 dark:border-white/10 rounded-xl">
                <Check className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500">今日完成</p>
                  <p className="text-2xl font-bold leading-none text-neutral-950 dark:text-white">
                    {todayCompleted}<span className="text-sm font-normal ml-1">/ {habits.length}</span>
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        {/* ===== 统计栏 - 杂志信息图风格 ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-px mb-10 bg-black/10 dark:bg-white/10"
        >
          {[
            { label: '总习惯', value: habits.length, icon: Target, accent: '#1f4f7a' },
            { label: '今日打卡', value: `${todayCompleted}/${habits.length}`, icon: Check, accent: '#2f7d62' },
            { label: '总连胜', value: totalStreak, icon: Flame, accent: '#ea580c' },
            { label: '总完成', value: habits.reduce((s, h) => s + h.totalCompletions, 0), icon: Trophy, accent: '#9333ea' },
          ].map((stat, i) => (
            <div key={i} className="bg-[#f8f4ec] dark:bg-neutral-900 p-6 flex items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center" style={{ backgroundColor: stat.accent + '15' }}>
                <stat.icon className="w-5 h-5" style={{ color: stat.accent }} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">{stat.label}</p>
                <p className="text-2xl font-bold mt-0.5 text-neutral-950 dark:text-white" style={{ fontFamily: EDITORIAL.serif }}>{stat.value}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* ===== 主内容区 ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* 左侧：习惯列表 */}
          <div className="space-y-4">
            {/* 新建按钮 */}
            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddModal(true)}
              className="w-full flex items-center justify-between border border-black/10 dark:border-white/10 px-5 py-4 group transition-colors hover:bg-neutral-950 hover:text-white rounded-xl text-neutral-950 dark:text-white"
            >
              <span className="text-sm font-medium">新建习惯</span>
              <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
            </motion.button>

            <AnimatePresence>
              {habits.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20 border border-black/10 dark:border-white/10 rounded-xl"
                >
                  <div className="text-5xl mb-4 opacity-30">🎯</div>
                  <p className="font-serif text-xl text-neutral-600 dark:text-neutral-300">还没有习惯</p>
                  <p className="text-sm mt-2 text-neutral-400 dark:text-neutral-500">点击上方创建你的第一个习惯</p>
                </motion.div>
              ) : (
                habits.map((habit, index) => (
                  <motion.div
                    key={habit.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedHabit(habit)}
                    className="group border border-black/10 dark:border-white/10 cursor-pointer transition-all hover:shadow-lg rounded-xl bg-white dark:bg-neutral-900"
                  >
                    <div className="p-5 flex items-start gap-4">
                      {/* 图标 */}
                      <div
                        className="w-12 h-12 flex-shrink-0 flex items-center justify-center text-2xl"
                        style={{ backgroundColor: HABIT_COLORS[habit.color].soft }}
                      >
                        {HABIT_ICONS[habit.icon]?.icon}
                      </div>

                      {/* 内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-medium text-base text-neutral-950 dark:text-white">{habit.name}</h3>
                            <p className="text-sm mt-0.5 truncate text-neutral-600 dark:text-neutral-300">{habit.description || '无描述'}</p>
                          </div>
                          {/* 签到按钮 */}
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={(e) => handleCheckIn(habit.id, e)}
                            className="flex-shrink-0 w-10 h-10 flex items-center justify-center transition-all"
                            style={{
                              backgroundColor: isCompletedOnDate(habit, new Date()) ? HABIT_COLORS[habit.color].bg : 'transparent',
                              color: isCompletedOnDate(habit, new Date()) ? '#fff' : 'var(--tw-text-opacity)',
                              border: `1px solid ${isCompletedOnDate(habit, new Date()) ? HABIT_COLORS[habit.color].bg : 'rgba(0,0,0,0.1)'}`
                            }}
                          >
                            <Check className="w-5 h-5" />
                          </motion.button>
                        </div>

                        {/* 底部信息栏 */}
                        <div className="mt-3 flex items-center gap-4 text-xs text-neutral-400 dark:text-neutral-500">
                          <StreakFlame streak={habit.streak || 0} />
                          <span>完成率 {getCompletionRate(habit)}%</span>
                          <span>{habit.totalCompletions}/{habit.targetDays} 天</span>
                        </div>

                        {/* 本周进度条 */}
                        <div className="mt-3 flex gap-1">
                          {getWeeklyData(habit).map((day, i) => (
                            <div
                              key={i}
                              className="flex-1 h-1.5 transition-all"
                              style={{
                                backgroundColor: day.completed ? HABIT_COLORS[habit.color].bg : 'rgba(0,0,0,0.1)'
                              }}
                              title={day.day}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* 右侧：日历 + 里程碑 */}
          <aside className="space-y-6">
            {/* 日历 */}
            <div className="border border-black/10 dark:border-white/10 p-5 rounded-xl bg-white dark:bg-neutral-900">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => changeMonth(-1)} className="p-1 hover:opacity-60 transition-opacity">
                  <ChevronLeft className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                </button>
                <h3 className="text-sm font-medium text-neutral-950 dark:text-white">
                  {currentDate.getFullYear()}年 {monthNames[currentDate.getMonth()]}
                </h3>
                <button onClick={() => changeMonth(1)} className="p-1 hover:opacity-60 transition-opacity">
                  <ChevronRight className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-px text-center text-[10px] mb-1 text-neutral-400 dark:text-neutral-500">
                {['日','一','二','三','四','五','六'].map(d => <div key={d}>{d}</div>)}
              </div>

              <div className="grid grid-cols-7 gap-px">
                {monthData.map((day, i) => {
                  const isToday = getDateString(day.date) === getDateString(new Date())
                  const completedCount = habits.filter(h => isCompletedOnDate(h, day.date)).length
                  const hasCheckIn = checkInHistory[getDateString(day.date)]

                  return (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.1 }}
                      className="aspect-square flex flex-col items-center justify-center text-xs cursor-pointer transition-colors"
                      style={{
                        color: day.isCurrentMonth ? 'inherit' : 'var(--tw-text-opacity)',
                        backgroundColor: isToday ? '#dbeafe' : 'transparent',
                      }}
                    >
                      <span className={`${isToday ? 'font-bold' : ''} ${day.isCurrentMonth ? 'text-neutral-950 dark:text-white' : 'text-neutral-400 dark:text-neutral-500'}`}>{day.date.getDate()}</span>
                      {completedCount > 0 && (
                        <div className="flex gap-0.5 mt-0.5">
                          {Array.from({ length: Math.min(completedCount, 3) }).map((_, j) => (
                            <div key={j} className="w-1 h-1 rounded-full bg-blue-500" />
                          ))}
                        </div>
                      )}
                      {hasCheckIn && completedCount === 0 && (
                        <div className="w-1 h-1 rounded-full mt-0.5 bg-neutral-400 dark:bg-neutral-500" />
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* 里程碑进度 */}
            <div className="border border-black/10 dark:border-white/10 p-5 rounded-xl bg-white dark:bg-neutral-900">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-4 text-neutral-400 dark:text-neutral-500">
                里程碑
              </h3>
              <div className="space-y-3">
                {MILESTONES.map((m, i) => {
                  const achieved = globalStreak >= m.days
                  const progress = Math.min(100, (globalStreak / m.days) * 100)
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-8 h-8 flex items-center justify-center text-lg ${achieved ? '' : 'opacity-30 grayscale'}`}
                        style={{ backgroundColor: achieved ? m.color + '20' : 'rgba(0,0,0,0.05)' }}>
                        {m.badge}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${achieved ? 'text-neutral-950 dark:text-white' : 'text-neutral-400 dark:text-neutral-500'}`}>{m.title}</span>
                          <span className="text-xs text-neutral-400 dark:text-neutral-500">{m.days}天</span>
                        </div>
                        <div className="h-1 mt-1.5 overflow-hidden bg-black/10 dark:bg-white/10">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full"
                            style={{ backgroundColor: achieved ? m.color : 'var(--tw-text-opacity)' }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ===== 添加习惯弹窗 ===== */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md p-6 max-h-[90vh] overflow-y-auto bg-[#f8f4ec] dark:bg-neutral-900"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-2xl text-neutral-950 dark:text-white" style={{ fontFamily: EDITORIAL.serif }}>新建习惯</h2>
                <button onClick={() => setShowAddModal(false)} className="p-1 hover:opacity-60">
                  <X className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] mb-2 text-neutral-400 dark:text-neutral-500">习惯名称</label>
                  <input
                    type="text"
                    value={newHabit.name}
                    onChange={e => setNewHabit({ ...newHabit, name: e.target.value })}
                    placeholder="例如：每天阅读30分钟"
                    className="w-full px-4 py-3 border border-black/10 dark:border-white/10 bg-transparent text-sm outline-none focus:border-neutral-950 dark:focus:border-white transition-colors text-neutral-950 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] mb-2 text-neutral-400 dark:text-neutral-500">选择图标</label>
                  <div className="grid grid-cols-6 gap-2">
                    {HABIT_ICONS.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => setNewHabit({ ...newHabit, icon: i })}
                        className="aspect-square text-xl flex items-center justify-center border transition-all hover:scale-110"
                        style={{
                          borderColor: newHabit.icon === i ? 'currentColor' : 'rgba(0,0,0,0.1)',
                          backgroundColor: newHabit.icon === i ? 'currentColor' : 'transparent',
                          color: newHabit.icon === i ? 'white' : 'inherit',
                        }}
                      >
                        {item.icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] mb-2 text-neutral-400 dark:text-neutral-500">选择颜色</label>
                  <div className="flex gap-2">
                    {HABIT_COLORS.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => setNewHabit({ ...newHabit, color: i })}
                        className="w-8 h-8 transition-all hover:scale-110"
                        style={{
                          backgroundColor: c.bg,
                          outline: newHabit.color === i ? '2px solid currentColor' : 'none',
                          outlineOffset: 2,
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] mb-2 text-neutral-400 dark:text-neutral-500">
                    目标天数: {newHabit.targetDays}
                  </label>
                  <input
                    type="range" min="7" max="100"
                    value={newHabit.targetDays}
                    onChange={e => setNewHabit({ ...newHabit, targetDays: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] mb-2 text-neutral-400 dark:text-neutral-500">描述（可选）</label>
                  <textarea
                    value={newHabit.description}
                    onChange={e => setNewHabit({ ...newHabit, description: e.target.value })}
                    placeholder="添加一些描述..."
                    className="w-full px-4 py-3 border border-black/10 dark:border-white/10 bg-transparent text-sm outline-none focus:border-neutral-950 dark:focus:border-white resize-none h-20 text-neutral-950 dark:text-white"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-3 border border-black/10 dark:border-white/10 text-sm font-medium transition-colors hover:bg-neutral-950 hover:text-white text-neutral-950 dark:text-white"
                  >
                    取消
                  </button>
                  <button
                    onClick={createHabit}
                    disabled={!newHabit.name.trim()}
                    className="flex-1 px-4 py-3 bg-neutral-950 text-white text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors hover:bg-neutral-800"
                  >
                    创建
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== 习惯详情弹窗 ===== */}
      <AnimatePresence>
        {selectedHabit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedHabit(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto bg-[#f8f4ec] dark:bg-neutral-900"
            >
              {/* 头部 */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 flex items-center justify-center text-3xl"
                    style={{ backgroundColor: HABIT_COLORS[selectedHabit.color].soft }}
                  >
                    {HABIT_ICONS[selectedHabit.icon]?.icon}
                  </div>
                  <div>
                    <h2 className="font-serif text-xl text-neutral-950 dark:text-white" style={{ fontFamily: EDITORIAL.serif }}>{selectedHabit.name}</h2>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300">{selectedHabit.description || '无描述'}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedHabit(null)} className="p-1 hover:opacity-60">
                  <X className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
                </button>
              </div>

              {/* 统计 */}
              <div className="grid grid-cols-3 gap-px mb-6 bg-black/10 dark:bg-white/10">
                {[
                  { icon: Flame, label: '当前连续', value: selectedHabit.streak || 0, color: '#ea580c' },
                  { icon: Trophy, label: '最长连续', value: selectedHabit.longestStreak || 0, color: '#ca8a04' },
                  { icon: Check, label: '总完成', value: selectedHabit.totalCompletions || 0, color: '#16a34a' },
                ].map((s, i) => (
                  <div key={i} className="p-4 text-center bg-[#f8f4ec] dark:bg-neutral-900">
                    <s.icon className="w-5 h-5 mx-auto mb-2" style={{ color: s.color }} />
                    <p className="text-2xl font-bold text-neutral-950 dark:text-white" style={{ fontFamily: EDITORIAL.serif }}>{s.value}</p>
                    <p className="text-[10px] uppercase tracking-wider mt-1 text-neutral-400 dark:text-neutral-500">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* 完成历史 */}
              <div className="mb-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3 text-neutral-400 dark:text-neutral-500">最近完成</h3>
                <div className="flex flex-wrap gap-2">
                  {(selectedHabit.completedDates || []).slice(-14).map((date, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 text-xs border border-black/10 dark:border-white/10 text-neutral-600 dark:text-neutral-300"
                    >
                      {new Date(date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                    </span>
                  ))}
                  {(selectedHabit.completedDates || []).length === 0 && (
                    <p className="text-sm text-neutral-400 dark:text-neutral-500">还没有完成记录</p>
                  )}
                </div>
              </div>

              {/* 操作 */}
              <div className="flex gap-3">
                <button
                  onClick={() => deleteHabit(selectedHabit.id)}
                  className="flex-1 px-4 py-3 border border-black/10 dark:border-white/10 text-sm font-medium transition-colors hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-neutral-600 dark:text-neutral-300"
                >
                  删除
                </button>
                <button
                  onClick={(e) => {
                    handleCheckIn(selectedHabit.id, e)
                    setSelectedHabit(prev => prev ? {
                      ...prev,
                      completedDates: isCompletedOnDate(prev, new Date())
                        ? (prev.completedDates || []).filter(d => d !== getDateString(new Date()))
                        : [...(prev.completedDates || []), getDateString(new Date())].sort()
                    } : null)
                  }}
                  className="flex-1 px-4 py-3 text-sm font-medium text-white transition-colors hover:opacity-90"
                  style={{ backgroundColor: isCompletedOnDate(selectedHabit, new Date()) ? 'var(--tw-text-opacity)' : HABIT_COLORS[selectedHabit.color].bg }}
                >
                  {isCompletedOnDate(selectedHabit, new Date()) ? '取消打卡' : '今日打卡'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Habits
