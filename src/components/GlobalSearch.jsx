import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Command, FileText, CheckCircle2, Calendar, Target, StickyNote, Clock, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// 搜索结果项组件
const SearchResultItem = ({ item, onClick, isSelected }) => {
  const icons = {
    todo: CheckCircle2,
    note: FileText,
    habit: Target,
    calendar: Calendar,
    focus: Clock,
  }
  
  const Icon = icons[item.type] || FileText
  const colors = {
    todo: 'bg-blue-500',
    note: 'bg-yellow-500',
    habit: 'bg-rose-500',
    calendar: 'bg-purple-500',
    focus: 'bg-amber-500',
  }
  
  return (
    <motion.button
      layout
      onClick={() => onClick(item)}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
        isSelected 
          ? 'bg-blue-50 dark:bg-blue-500/20' 
          : 'hover:bg-gray-50 dark:hover:bg-zinc-800'
      }`}
    >
      <div className={`w-10 h-10 rounded-xl ${colors[item.type]} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 text-left">
        <div className="font-medium text-gray-900 dark:text-white line-clamp-1">
          {item.title}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
          {item.description}
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-gray-400" />
    </motion.button>
  )
}

// 全局搜索组件
const GlobalSearch = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  // 搜索所有数据
  const searchData = useCallback((searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    const allResults = []
    const lowerQuery = searchQuery.toLowerCase()

    // 搜索待办
    const todos = JSON.parse(localStorage.getItem('myku_todos') || '[]')
    todos.forEach(todo => {
      if ((todo.task || todo.title || '').toLowerCase().includes(lowerQuery)) {
        allResults.push({
          id: todo.id,
          type: 'todo',
          title: todo.task || todo.title,
          description: todo.completed ? '已完成' : '待完成',
          path: '/todo',
          data: todo
        })
      }
    })

    // 搜索笔记
    const notes = JSON.parse(localStorage.getItem('myku_notes') || '[]')
    notes.forEach(note => {
      if ((note.title || '').toLowerCase().includes(lowerQuery) || 
          (note.content || '').toLowerCase().includes(lowerQuery)) {
        allResults.push({
          id: note.id,
          type: 'note',
          title: note.title || '无标题',
          description: note.content?.substring(0, 50) || '无内容',
          path: '/notes',
          data: note
        })
      }
    })

    // 搜索习惯
    const habits = JSON.parse(localStorage.getItem('myku_habits') || '[]')
    habits.forEach(habit => {
      if ((habit.name || '').toLowerCase().includes(lowerQuery)) {
        allResults.push({
          id: habit.id,
          type: 'habit',
          title: habit.name,
          description: `连续 ${habit.streak || 0} 天`,
          path: '/habits',
          data: habit
        })
      }
    })

    // 搜索日历事件
    const calendarEvents = JSON.parse(localStorage.getItem('myku_calendar_events') || '[]')
    calendarEvents.forEach(event => {
      if ((event.title || '').toLowerCase().includes(lowerQuery)) {
        allResults.push({
          id: event.id,
          type: 'calendar',
          title: event.title,
          description: new Date(event.date).toLocaleDateString('zh-CN'),
          path: '/calendar',
          data: event
        })
      }
    })

    setResults(allResults.slice(0, 10)) // 最多显示10条
    setSelectedIndex(0)
  }, [])

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      searchData(query)
    }, 150)
    return () => clearTimeout(timer)
  }, [query, searchData])

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => (prev + 1) % results.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => (prev - 1 + results.length) % results.length)
          break
        case 'Enter':
          e.preventDefault()
          if (results[selectedIndex]) {
            handleSelect(results[selectedIndex])
          }
          break
        case 'Escape':
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex, onClose])

  // 聚焦输入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100)
    }
  }, [isOpen])

  const handleSelect = (item) => {
    navigate(item.path)
    onClose()
    setQuery('')
  }

  // 快捷命令
  const quickCommands = useMemo(() => [
    { key: 'todo', label: '待办', icon: CheckCircle2, action: () => { navigate('/todo'); onClose(); } },
    { key: 'note', label: '笔记', icon: FileText, action: () => { navigate('/notes'); onClose(); } },
    { key: 'habit', label: '习惯', icon: Target, action: () => { navigate('/habits'); onClose(); } },
    { key: 'calendar', label: '日历', icon: Calendar, action: () => { navigate('/calendar'); onClose(); } },
    { key: 'focus', label: '专注', icon: Clock, action: () => { navigate('/focus'); onClose(); } },
  ], [navigate, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      {/* 背景遮罩 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      
      {/* 搜索框 */}
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-2xl mx-4 bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* 搜索输入 */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-zinc-800">
          <Search className="w-6 h-6 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索待办、笔记、习惯..."
            className="flex-1 text-lg bg-transparent outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
          <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-zinc-800 rounded-lg text-xs text-gray-500">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </div>

        {/* 搜索结果 */}
        <div className="max-h-[60vh] overflow-y-auto">
          {query ? (
            results.length > 0 ? (
              <div className="p-2">
                <div className="px-4 py-2 text-xs text-gray-500 uppercase tracking-wider">
                  搜索结果 ({results.length})
                </div>
                {results.map((item, index) => (
                  <SearchResultItem
                    key={item.id}
                    item={item}
                    isSelected={index === selectedIndex}
                    onClick={handleSelect}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400">未找到相关结果</p>
              </div>
            )
          ) : (
            <div className="p-4">
              <div className="px-4 py-2 text-xs text-gray-500 uppercase tracking-wider">
                快捷导航
              </div>
              <div className="grid grid-cols-5 gap-2">
                {quickCommands.map((cmd) => {
                  const Icon = cmd.icon
                  return (
                    <button
                      key={cmd.key}
                      onClick={cmd.action}
                      className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">{cmd.label}</span>
                    </button>
                  )
                })}
              </div>
              
              {/* 最近访问 */}
              <div className="mt-6">
                <div className="px-4 py-2 text-xs text-gray-500 uppercase tracking-wider">
                  快捷键
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>选择上一个</span>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-zinc-800 rounded text-xs">↑</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>选择下一个</span>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-zinc-800 rounded text-xs">↓</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>打开选中项</span>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-zinc-800 rounded text-xs">Enter</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>关闭搜索</span>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-zinc-800 rounded text-xs">Esc</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default GlobalSearch
