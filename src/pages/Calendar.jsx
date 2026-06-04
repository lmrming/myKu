import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  Clock, CheckCircle2, Plus, X, ZoomIn, ZoomOut,
  GripHorizontal, Maximize2, Minimize2, Layers,
  ArrowLeftRight, CalendarDays, CalendarRange
} from 'lucide-react'

// ============ 设计令牌 ============
// 使用 Tailwind dark: 前缀支持深色模式
const EDITORIAL = {
  serif: "'Playfair Display', 'Noto Serif SC', Georgia, serif",
}

const MONTH_NAMES = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月']
const WEEK_DAYS = ['日','一','二','三','四','五','六']

// ============ 视图模式枚举 ============
const VIEW_MODES = {
  YEAR: 'year',      // 年视图 - 12个月概览
  MONTH: 'month',    // 月视图 - 传统日历
  WEEK: 'week',      // 周视图 - 7天详细
  DAY: 'day',        // 日视图 - 单日详情
  RANGE: 'range',    // 范围视图 - 自定义范围
}

// ============ 获取月份数据 ============
const getMonthData = (year, month) => {
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
}

// ============ 方案A: 时间轴折叠模式 ============
const TimelineFold = ({ currentDate, onDateChange, viewMode, onViewChange }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  return (
    <div className="relative">
      {/* 折叠控制器 */}
      <motion.div
        className="flex items-center gap-2 mb-4"
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 48 }}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-4 py-2 border border-black/10 dark:border-white/10 text-sm font-medium text-neutral-950 dark:text-white transition-colors hover:bg-neutral-950 hover:text-white"
        >
          <Layers className="w-4 h-4" />
          {isExpanded ? '收起时间轴' : '展开时间轴'}
        </button>

        {/* 快速层级切换 */}
        <div className="flex gap-1">
          {[
            { mode: VIEW_MODES.YEAR, label: '年', icon: CalendarDays },
            { mode: VIEW_MODES.MONTH, label: '月', icon: CalendarIcon },
            { mode: VIEW_MODES.WEEK, label: '周', icon: CalendarRange },
            { mode: VIEW_MODES.DAY, label: '日', icon: Clock },
          ].map(({ mode, label, icon: Icon }) => (
            <button
              key={mode}
              onClick={() => onViewChange(mode)}
              className={`px-3 py-2 text-xs font-medium border border-black/10 dark:border-white/10 transition-all ${
                viewMode === mode
                  ? 'bg-neutral-950 text-white'
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5 inline mr-1" />
              {label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* 展开的时间轴 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mb-6"
          >
            {/* 年份条 */}
            <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-2">
              {Array.from({ length: 5 }, (_, i) => year - 2 + i).map(y => (
                <motion.button
                  key={y}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onDateChange(new Date(y, month, 1))}
                  className={`flex-shrink-0 px-4 py-2 text-sm border border-black/10 dark:border-white/10 transition-all ${
                    y === year
                      ? 'bg-neutral-950 text-white'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {y}
                </motion.button>
              ))}
            </div>

            {/* 月份条 */}
            <div className="grid grid-cols-12 gap-1">
              {MONTH_NAMES.map((name, i) => (
                <motion.button
                  key={i}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onDateChange(new Date(year, i, 1))}
                  className={`py-2 text-xs border border-black/10 dark:border-white/10 transition-all ${
                    i === month
                      ? 'bg-neutral-950 text-white'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {name}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============ 方案B: 手势捏合缩放模式 ============
const PinchZoomCalendar = ({ currentDate, onDateChange, viewMode, onViewChange }) => {
  const containerRef = useRef(null)
  const [scale, setScale] = useState(1)
  const [isPinching, setIsPinching] = useState(false)
  const lastScale = useRef(1)

  // 处理滚轮缩放
  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      const newScale = Math.max(0.5, Math.min(2, scale + delta))
      setScale(newScale)

      // 根据缩放级别切换视图
      if (newScale < 0.7 && viewMode !== VIEW_MODES.YEAR) {
        onViewChange(VIEW_MODES.YEAR)
      } else if (newScale >= 0.7 && newScale < 1.3 && viewMode !== VIEW_MODES.MONTH) {
        onViewChange(VIEW_MODES.MONTH)
      } else if (newScale >= 1.3 && viewMode !== VIEW_MODES.WEEK) {
        onViewChange(VIEW_MODES.WEEK)
      }
    }
  }, [scale, viewMode, onViewChange])

  // 处理触摸捏合
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      setIsPinching(true)
      const distance = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      )
      lastScale.current = distance
    }
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && isPinching) {
      e.preventDefault()
      const distance = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      )
      const ratio = distance / lastScale.current
      const newScale = Math.max(0.5, Math.min(2, scale * ratio))
      setScale(newScale)
      lastScale.current = distance

      if (newScale < 0.7 && viewMode !== VIEW_MODES.YEAR) onViewChange(VIEW_MODES.YEAR)
      else if (newScale >= 0.7 && newScale < 1.3 && viewMode !== VIEW_MODES.MONTH) onViewChange(VIEW_MODES.MONTH)
      else if (newScale >= 1.3 && viewMode !== VIEW_MODES.WEEK) onViewChange(VIEW_MODES.WEEK)
    }
  }, [isPinching, scale, viewMode, onViewChange])

  const handleTouchEnd = useCallback(() => {
    setIsPinching(false)
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    el.addEventListener('touchstart', handleTouchStart)
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    el.addEventListener('touchend', handleTouchEnd)
    return () => {
      el.removeEventListener('wheel', handleWheel)
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd])

  return (
    <div ref={containerRef} className="relative select-none">
      {/* 缩放指示器 */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2 px-3 py-1.5 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm border border-black/10 dark:border-white/10 text-xs">
        <ZoomIn className="w-3 h-3 text-neutral-400 dark:text-neutral-500" />
        <div className="w-20 h-1 bg-gray-200 dark:bg-neutral-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-neutral-950 dark:bg-white"
            animate={{ width: `${((scale - 0.5) / 1.5) * 100}%` }}
          />
        </div>
        <span className="font-mono text-neutral-600 dark:text-neutral-300">{Math.round(scale * 100)}%</span>
      </div>

      {/* 缩放提示 */}
      <AnimatePresence>
        {isPinching && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
          >
            <div className="px-6 py-3 bg-neutral-950 text-white text-sm font-medium rounded-full">
              {scale < 0.8 ? '年视图' : scale < 1.2 ? '月视图' : '周视图'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 缩放控制按钮 */}
      <div className="absolute bottom-2 right-2 z-10 flex flex-col gap-1">
        <button
          onClick={() => {
            const newScale = Math.min(2, scale + 0.2)
            setScale(newScale)
            if (newScale >= 1.3) onViewChange(VIEW_MODES.WEEK)
            else if (newScale >= 0.7) onViewChange(VIEW_MODES.MONTH)
          }}
          className="w-8 h-8 flex items-center justify-center bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            const newScale = Math.max(0.5, scale - 0.2)
            setScale(newScale)
            if (newScale < 0.7) onViewChange(VIEW_MODES.YEAR)
            else if (newScale < 1.3) onViewChange(VIEW_MODES.MONTH)
          }}
          className="w-8 h-8 flex items-center justify-center bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setScale(1); onViewChange(VIEW_MODES.MONTH) }}
          className="w-8 h-8 flex items-center justify-center bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ============ 方案C: 智能范围选择器模式 ============
const SmartRangeSelector = ({ onRangeSelect, currentDate }) => {
  const [rangeStart, setRangeStart] = useState(null)
  const [rangeEnd, setRangeEnd] = useState(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [hoverDate, setHoverDate] = useState(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const days = getMonthData(year, month)

  const handleDateClick = (date) => {
    if (!isSelecting) {
      setRangeStart(date)
      setRangeEnd(null)
      setIsSelecting(true)
    } else {
      if (date < rangeStart) {
        setRangeEnd(rangeStart)
        setRangeStart(date)
      } else {
        setRangeEnd(date)
      }
      setIsSelecting(false)
      onRangeSelect({ start: rangeStart, end: date >= rangeStart ? date : rangeStart })
    }
  }

  const handleDateHover = (date) => {
    if (isSelecting) setHoverDate(date)
  }

  const isInRange = (date) => {
    if (!rangeStart) return false
    const end = isSelecting && hoverDate ? hoverDate : rangeEnd
    if (!end) return date.toDateString() === rangeStart.toDateString()
    return date >= rangeStart && date <= end
  }

  const isRangeStart = (date) => rangeStart && date.toDateString() === rangeStart.toDateString()
  const isRangeEnd = (date) => {
    const end = isSelecting && hoverDate ? hoverDate : rangeEnd
    return end && date.toDateString() === end.toDateString()
  }

  return (
    <div className="relative">
      {/* 范围指示器 */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
          <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
            {isSelecting ? '选择结束日期' : '点击选择范围'}
          </span>
        </div>
        {rangeStart && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => { setRangeStart(null); setRangeEnd(null); setIsSelecting(false) }}
            className="text-xs px-3 py-1 border border-black/10 dark:border-white/10 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            清除
          </motion.button>
        )}
      </div>

      {/* 范围预览 */}
      <AnimatePresence>
        {rangeStart && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-4 px-4 py-3 border border-black/10 dark:border-white/10 overflow-hidden bg-blue-100 dark:bg-blue-900/30"
          >
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
              已选择: {rangeStart.toLocaleDateString('zh-CN')}
              {rangeEnd ? ` - ${rangeEnd.toLocaleDateString('zh-CN')}` : ' ...'}
            </p>
            {rangeEnd && (
              <p className="text-xs mt-1 text-neutral-600 dark:text-neutral-300">
                共 {Math.floor((rangeEnd - rangeStart) / 86400000) + 1} 天
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 日历网格 */}
      <div className="grid grid-cols-7 gap-px bg-black/10 dark:bg-white/10">
        {WEEK_DAYS.map(day => (
          <div key={day} className="text-center text-[10px] font-bold uppercase tracking-wider py-2 text-neutral-400 dark:text-neutral-500 bg-[#f8f4ec] dark:bg-neutral-950">
            {day}
          </div>
        ))}
        {days.map((day, i) => {
          const inRange = isInRange(day.date)
          const isStart = isRangeStart(day.date)
          const isEnd = isRangeEnd(day.date)
          const isToday = new Date().toDateString() === day.date.toDateString()

          return (
            <motion.button
              key={i}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleDateClick(day.date)}
              onMouseEnter={() => handleDateHover(day.date)}
              className={`aspect-square flex items-center justify-center text-sm relative transition-all ${
                day.isCurrentMonth ? '' : 'opacity-30'
              }`}
              style={{
                backgroundColor: inRange ? undefined : '#fff',
                color: isStart || isEnd ? '#fff' : inRange ? undefined : undefined,
              }}
            >
              {/* 范围端点标记 */}
              {(isStart || isEnd) && (
                <motion.div
                  layoutId="rangeEndpoint"
                  className="absolute inset-1 bg-blue-500"
                />
              )}
              <span className="relative z-10">{day.date.getDate()}</span>
              {isToday && !inRange && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-500" />
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

// ============ 年视图组件 ============
const YearView = ({ year, onMonthSelect, todos }) => {
  return (
    <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
      {MONTH_NAMES.map((name, i) => {
        const monthDays = getMonthData(year, i)
        const monthTodos = todos.filter(t => {
          if (!t.dueDate) return false
          const d = new Date(t.dueDate)
          return d.getFullYear() === year && d.getMonth() === i
        })
        const completedCount = monthTodos.filter(t => t.completed).length

        return (
          <motion.button
            key={i}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onMonthSelect(i)}
            className="p-4 border border-black/10 dark:border-white/10 text-left transition-all hover:shadow-lg rounded-xl bg-white dark:bg-neutral-900"
          >
            <h3 className="font-serif text-lg mb-2 text-neutral-950 dark:text-white" style={{ fontFamily: EDITORIAL.serif }}>
              {name}
            </h3>
            <div className="grid grid-cols-7 gap-px mb-2 bg-black/10 dark:bg-white/10">
              {monthDays.slice(0, 28).map((day, j) => (
                <div
                  key={j}
                  className="aspect-square"
                  style={{
                    backgroundColor: day.isCurrentMonth ? '#fff' : 'transparent',
                    opacity: day.isCurrentMonth ? 1 : 0.3
                  }}
                />
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-neutral-400 dark:text-neutral-500">
              <span>{monthTodos.length} 任务</span>
              {completedCount > 0 && (
                <span className="text-green-600">{completedCount} 完成</span>
              )}
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}

// ============ 周视图组件 ============
const WeekView = ({ currentDate, todos, onDateSelect, onToggleTodo }) => {
  const weekStart = new Date(currentDate)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart)
    date.setDate(date.getDate() + i)
    return date
  })

  return (
    <div className="space-y-4">
      {weekDays.map((date, i) => {
        const dateStr = date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-')
        const dayTodos = todos.filter(t => {
          if (!t.dueDate) return false
          const todoDate = new Date(t.dueDate).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-')
          return todoDate === dateStr
        })
        const isToday = new Date().toDateString() === date.toDateString()

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onDateSelect(date)}
            className={`p-4 border border-black/10 dark:border-white/10 cursor-pointer transition-all hover:shadow-md rounded-xl bg-white dark:bg-neutral-900 ${
              isToday ? 'ring-1 ring-blue-500' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  {WEEK_DAYS[i]}
                </span>
                <h4 className="font-serif text-xl text-neutral-950 dark:text-white" style={{ fontFamily: EDITORIAL.serif }}>
                  {date.getDate()}
                </h4>
              </div>
              {dayTodos.length > 0 && (
                <div className="flex gap-1">
                  {dayTodos.slice(0, 3).map((t, j) => (
                    <div
                      key={j}
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: t.completed ? '#16a34a' : '#3b82f6' }}
                    />
                  ))}
                </div>
              )}
            </div>

            {dayTodos.length > 0 ? (
              <div className="space-y-2">
                {dayTodos.map(todo => (
                  <div
                    key={todo.id}
                    onClick={(e) => { e.stopPropagation(); onToggleTodo(todo.id) }}
                    className={`flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300 ${
                      todo.completed ? 'line-through opacity-50' : ''
                    }`}
                  >
                    <div className={`w-4 h-4 border flex items-center justify-center ${
                      todo.completed ? 'bg-emerald-500 border-emerald-500' : 'border-black/10 dark:border-white/10'
                    }`}
                    >
                      {todo.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    {todo.task || todo.title}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-400 dark:text-neutral-500">暂无安排</p>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

// ============ 日视图组件 ============
const DayView = ({ date, todos, onToggleTodo }) => {
  const dateStr = date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-')
  const dayTodos = todos.filter(t => {
    if (!t.dueDate) return false
    const todoDate = new Date(t.dueDate).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-')
    return todoDate === dateStr
  })

  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-2xl text-neutral-950 dark:text-white" style={{ fontFamily: EDITORIAL.serif }}>
          {date.getMonth() + 1}月{date.getDate()}日
        </h3>
        <span className="text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          {WEEK_DAYS[date.getDay()]}
        </span>
      </div>

      {hours.map(hour => {
        const hourTodos = dayTodos.filter(t => {
          const todoHour = t.dueTime ? parseInt(t.dueTime.split(':')[0]) : null
          return todoHour === hour
        })

        return (
          <div key={hour} className="flex gap-4 min-h-[60px]">
            <div className="w-12 text-right text-xs pt-2 text-neutral-400 dark:text-neutral-500">
              {String(hour).padStart(2, '0')}:00
            </div>
            <div className="flex-1 border-l border-black/10 dark:border-white/10 pl-4 pb-2">
              {hourTodos.map(todo => (
                <div
                  key={todo.id}
                  onClick={() => onToggleTodo(todo.id)}
                  className={`p-2 mb-1 border border-black/10 dark:border-white/10 text-sm cursor-pointer transition-all hover:shadow-sm rounded-lg ${
                    todo.completed ? 'opacity-50 line-through' : ''
                  } bg-white dark:bg-neutral-900`}
                >
                  {todo.task || todo.title}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============ 主日历组件 ============
const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState(VIEW_MODES.MONTH)
  const [todos, setTodos] = useState([])
  const [selectedRange, setSelectedRange] = useState(null)
  const [activeScheme, setActiveScheme] = useState('A') // A, B, C

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}')
        if (user.id) {
          const response = await fetch(`http://localhost:3002/api/todos?user_id=${user.id}`)
          if (response.ok) {
            const dbTodos = await response.json()
            if (dbTodos.length > 0) {
              setTodos(dbTodos.map(t => ({
                id: t.id, task: t.task, title: t.task,
                completed: t.completed === 1, priority: t.priority,
                dueDate: t.due_date, tags: Array.isArray(t.tags) ? t.tags : [],
              })))
              return
            }
          }
        }
      } catch (e) { console.warn('DB load failed:', e.message) }
      setTodos(JSON.parse(localStorage.getItem('myku_todos') || '[]'))
    }
    loadData()
  }, [])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const changeMonth = (delta) => {
    setCurrentDate(new Date(year, month + delta, 1))
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }

  const handleToggle = (id) => {
    const updated = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    setTodos(updated)
    localStorage.setItem('myku_todos', JSON.stringify(updated))
  }

  // 统计
  const stats = useMemo(() => {
    const monthStart = new Date(year, month, 1)
    const monthEnd = new Date(year, month + 1, 0)
    const monthTodos = todos.filter(t => {
      if (!t.dueDate) return false
      const d = new Date(t.dueDate)
      return d >= monthStart && d <= monthEnd
    })
    return {
      total: monthTodos.length,
      completed: monthTodos.filter(t => t.completed).length,
      pending: monthTodos.filter(t => !t.completed).length
    }
  }, [todos, year, month])

  // 渲染对应视图
  const renderView = () => {
    switch (viewMode) {
      case VIEW_MODES.YEAR:
        return (
          <YearView
            year={year}
            onMonthSelect={(m) => { setCurrentDate(new Date(year, m, 1)); setViewMode(VIEW_MODES.MONTH) }}
            todos={todos}
          />
        )
      case VIEW_MODES.WEEK:
        return (
          <WeekView
            currentDate={currentDate}
            todos={todos}
            onDateSelect={setSelectedDate}
            onToggleTodo={handleToggle}
          />
        )
      case VIEW_MODES.DAY:
        return (
          <DayView
            date={selectedDate}
            todos={todos}
            onToggleTodo={handleToggle}
          />
        )
      case VIEW_MODES.RANGE:
        return (
          <SmartRangeSelector
            currentDate={currentDate}
            onRangeSelect={setSelectedRange}
          />
        )
      default:
        // 月视图
        const days = getMonthData(year, month)
        return (
          <div className="grid grid-cols-7 gap-px bg-black/10 dark:bg-white/10">
            {WEEK_DAYS.map(day => (
              <div key={day} className="text-center text-[10px] font-bold uppercase tracking-wider py-3 text-neutral-400 dark:text-neutral-500 bg-[#f8f4ec] dark:bg-neutral-950">
                {day}
              </div>
            ))}
            {days.map((day, i) => {
              const isToday = new Date().toDateString() === day.date.toDateString()
              const isSelected = selectedDate.toDateString() === day.date.toDateString()
              const dateStr = day.date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-')
              const dayTodos = todos.filter(t => {
                if (!t.dueDate) return false
                const todoDate = new Date(t.dueDate).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-')
                return todoDate === dateStr
              })

              return (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedDate(day.date)}
                  className={`aspect-square p-2 flex flex-col items-center justify-start transition-all ${
                    day.isCurrentMonth ? '' : 'opacity-30'
                  } ${isSelected ? 'bg-blue-500 text-white' : 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-white'}`}
                >
                  <span className={`text-sm font-medium ${isToday ? 'font-bold' : ''}`}>{day.date.getDate()}</span>
                  {dayTodos.length > 0 && (
                    <div className="flex gap-0.5 mt-1">
                      {dayTodos.slice(0, 3).map((t, j) => (
                        <div
                          key={j}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: isSelected ? '#fff' : t.completed ? '#16a34a' : '#3b82f6' }}
                        />
                      ))}
                    </div>
                  )}
                </motion.button>
              )
            })}
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen transition-colors duration-300 bg-[#f8f4ec] dark:bg-neutral-950">
      {/* 杂志化页眉 */}
      <section className="relative overflow-hidden border-b border-black/10 dark:border-white/10">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-16">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-neutral-400 dark:text-neutral-500">
                CALENDAR ISSUE 01
              </span>
              <div className="h-px flex-1 max-w-[60px] bg-black/10 dark:bg-white/10" />
            </div>

            <div className="flex items-end justify-between">
              <div>
                <h1 className="font-serif text-[clamp(3rem,8vw,6rem)] leading-[0.85] tracking-tight text-neutral-950 dark:text-white"
                  style={{ fontFamily: EDITORIAL.serif }}>
                  日历
                </h1>
                <p className="mt-4 max-w-md text-lg leading-relaxed text-neutral-600 dark:text-neutral-300">
                  以多维视角审视时间，从年到日，层层深入你的日程安排。
                </p>
              </div>

              {/* 方案切换器 */}
              <div className="hidden lg:flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider mr-2 text-neutral-400 dark:text-neutral-500">
                  交互方案
                </span>
                {['A', 'B', 'C'].map(scheme => (
                  <button
                    key={scheme}
                    onClick={() => setActiveScheme(scheme)}
                    className={`w-8 h-8 flex items-center justify-center text-xs font-bold border border-black/10 dark:border-white/10 transition-all ${
                      activeScheme === scheme
                        ? 'bg-neutral-950 text-white'
                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    {scheme}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        {/* 统计栏 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-px mb-8 max-w-lg bg-black/10 dark:bg-white/10"
        >
          {[
            { label: '本月任务', value: stats.total, color: 'text-neutral-950 dark:text-white' },
            { label: '已完成', value: stats.completed, color: 'text-green-600' },
            { label: '待处理', value: stats.pending, color: 'text-yellow-600' },
          ].map((stat, i) => (
            <div key={i} className="p-4 bg-[#f8f4ec] dark:bg-neutral-950">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`} style={{ fontFamily: EDITORIAL.serif }}>{stat.value}</p>
            </div>
          ))}
        </motion.div>

        {/* 日历控制区 */}
        <div className="mb-6">
          {/* 导航 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => changeMonth(-1)}
                className="p-2 border border-black/10 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
              </button>
              <h2 className="font-serif text-xl min-w-[140px] text-center text-neutral-950 dark:text-white" style={{ fontFamily: EDITORIAL.serif }}>
                {year}年 {MONTH_NAMES[month]}
              </h2>
              <button
                onClick={() => changeMonth(1)}
                className="p-2 border border-black/10 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={goToToday}
                className="px-4 py-2 border border-black/10 dark:border-white/10 text-xs font-medium text-neutral-950 dark:text-white hover:bg-neutral-950 hover:text-white transition-colors"
              >
                今天
              </button>
              {/* 视图模式切换 */}
              <div className="flex gap-px bg-black/10 dark:bg-white/10">
                {[
                  { mode: VIEW_MODES.YEAR, label: '年' },
                  { mode: VIEW_MODES.MONTH, label: '月' },
                  { mode: VIEW_MODES.WEEK, label: '周' },
                  { mode: VIEW_MODES.DAY, label: '日' },
                  { mode: VIEW_MODES.RANGE, label: '范围' },
                ].map(({ mode, label }) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-2 text-xs font-medium transition-all ${
                      viewMode === mode
                        ? 'bg-neutral-950 text-white'
                        : 'bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 交互方案区域 */}
          <div className="relative">
            {/* 方案A: 时间轴折叠 */}
            {activeScheme === 'A' && (
              <TimelineFold
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                viewMode={viewMode}
                onViewChange={setViewMode}
              />
            )}

            {/* 方案B: 手势捏合缩放 */}
            {activeScheme === 'B' && (
              <PinchZoomCalendar
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                viewMode={viewMode}
                onViewChange={setViewMode}
              />
            )}

            {/* 方案C: 智能范围选择器 */}
            {activeScheme === 'C' && viewMode === VIEW_MODES.RANGE && (
              <div className="mb-4 p-3 border border-black/10 dark:border-white/10 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  方案C：点击选择日期范围，支持拖拽预览
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 日历主体 */}
        <div className="border border-black/10 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-neutral-900">
          {renderView()}
        </div>

        {/* 选中日期详情 */}
        <AnimatePresence>
          {selectedDate && viewMode !== VIEW_MODES.DAY && viewMode !== VIEW_MODES.RANGE && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-6 border border-black/10 dark:border-white/10 p-6 rounded-xl bg-white dark:bg-neutral-900"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-xl text-neutral-950 dark:text-white" style={{ fontFamily: EDITORIAL.serif }}>
                  {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日
                </h3>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-1 hover:opacity-60"
                >
                  <X className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
                </button>
              </div>

              {(() => {
                const dateStr = selectedDate.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-')
                const selectedTodos = todos.filter(t => {
                  if (!t.dueDate) return false
                  const todoDate = new Date(t.dueDate).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-')
                  return todoDate === dateStr
                })

                return selectedTodos.length > 0 ? (
                  <div className="space-y-2">
                    {selectedTodos.map(todo => (
                      <div
                        key={todo.id}
                        onClick={() => handleToggle(todo.id)}
                        className={`flex items-center gap-3 p-3 border border-black/10 dark:border-white/10 cursor-pointer transition-all hover:shadow-sm rounded-lg ${
                          todo.completed ? 'opacity-50' : ''
                        }`}
                      >
                        <div className={`w-5 h-5 border flex items-center justify-center ${
                          todo.completed ? 'bg-emerald-500 border-emerald-500' : 'border-black/10 dark:border-white/10'
                        }`}
                        >
                          {todo.completed && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className={`flex-1 text-sm ${todo.completed ? 'line-through text-neutral-400 dark:text-neutral-500' : 'text-neutral-950 dark:text-white'}`}>
                          {todo.task || todo.title}
                        </span>
                        <span className={`text-xs px-2 py-0.5 ${
                          todo.priority === 'high' ? 'bg-red-100 text-red-700' :
                          todo.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {todo.priority === 'high' ? '高' : todo.priority === 'medium' ? '中' : '低'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-center py-8 text-neutral-400 dark:text-neutral-500">暂无待办事项</p>
                )
              })()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 方案说明 */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              scheme: 'A',
              title: '时间轴折叠模式',
              desc: '通过展开/折叠时间轴，快速在不同时间层级间跳转。支持年、月、周、日四级视图切换。',
              pros: ['直观层级关系', '快速跳转', '节省空间'],
              cons: ['需要额外点击', '层级多时拥挤'],
              bestFor: '需要频繁在不同时间尺度间切换的用户'
            },
            {
              scheme: 'B',
              title: '手势捏合缩放模式',
              desc: '通过鼠标滚轮+Ctrl或双指捏合手势，像地图一样缩放日历。缩放级别自动切换视图模式。',
              pros: ['自然交互', '无缝过渡', '支持触屏'],
              cons: ['需要学习成本', '精确控制较难'],
              bestFor: '触屏设备和喜欢直观手势操作的用户'
            },
            {
              scheme: 'C',
              title: '智能范围选择器模式',
              desc: '点击选择起始日期，再点击选择结束日期，自动高亮范围。支持悬停预览和范围统计。',
              pros: ['精确选择', '视觉反馈强', '支持批量操作'],
              cons: ['两步操作', '不适合快速浏览'],
              bestFor: '需要选择特定日期范围进行统计或批量操作的用户'
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className={`border border-black/10 dark:border-white/10 p-5 transition-all cursor-pointer rounded-xl bg-white dark:bg-neutral-900 ${activeScheme === item.scheme ? 'ring-1 ring-blue-500' : 'hover:shadow-md'}`}
              onClick={() => setActiveScheme(item.scheme)}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded-lg ${
                  activeScheme === item.scheme ? 'bg-neutral-950 text-white' : 'border border-black/10 dark:border-white/10'
                }`}>
                  {item.scheme}
                </div>
                <h4 className="font-medium text-neutral-950 dark:text-white">{item.title}</h4>
              </div>
              <p className="text-sm mb-3 leading-relaxed text-neutral-600 dark:text-neutral-300">{item.desc}</p>
              <div className="space-y-1">
                <p className="text-xs text-green-600">✓ {item.pros.join('、')}</p>
                <p className="text-xs text-red-600">✗ {item.cons.join('、')}</p>
              </div>
              <p className="text-xs mt-2 pt-2 border-t border-black/10 dark:border-white/10 text-neutral-400 dark:text-neutral-500">
                适用：{item.bestFor}
              </p>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default Calendar
