import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Check,
  Trash2,
  Search,
  X,
  Edit2,
  Sparkles,
  Target,
  Zap,
  Layers3,
  ArrowUpRight,
  ClipboardList,
  Scissors
} from 'lucide-react'
import { loadTodosFromDB, deleteTodoFromDB } from '../services/dataSync.js'

const t = {
  pageKicker: '\u0045\u0064\u0069\u0074\u006f\u0072\u0069\u0061\u006c\u0020\u0047\u0072\u0069\u0064\u0020\u0053\u0079\u0073\u0074\u0065\u006d\u0020\u002f\u0020\u0054\u006f\u0064\u006f\u0020\u0049\u0073\u0073\u0075\u0065\u0020\u0032\u0030\u0032\u0036',
  titleA: '\u5f85\u529e',
  titleB: '\u4e8b\u9879',
  lead: '\u628a\u65e5\u5e38\u4efb\u52a1\u7f16\u6392\u6210\u4e00\u5f20\u53ef\u4ee5\u9605\u8bfb\u7684\u5de5\u4f5c\u6d77\u62a5\u3002',
  desc: '\u4ee5\u975e\u5bf9\u79f0\u7f51\u683c\u7ec4\u7ec7\u4efb\u52a1\u4f18\u5148\u7ea7\u3001\u5206\u7c7b\u3001\u622a\u6b62\u65f6\u95f4\u4e0e\u72b6\u6001\uff0c\u8ba9\u91cd\u8981\u4e8b\u9879\u81ea\u7136\u6210\u4e3a\u7248\u9762\u7126\u70b9\u3002',
  total: '\u5168\u90e8\u4efb\u52a1',
  rate: '\u672a\u5b8c\u6210\u7387',
  pending: '\u5f85\u5904\u7406',
  high: '\u9ad8\u4f18\u5148\u7ea7',
  totalHelp: '\u7248\u9762\u4e2d\u7684\u5168\u90e8\u4efb\u52a1\u6761\u76ee',
  rateHelp: '\u9879\u5c1a\u672a\u5b8c\u6210',
  pendingHelp: '\u4ecd\u5728\u7b49\u5f85\u63a8\u8fdb\u7684\u4e8b\u9879',
  highHelp: '\u9700\u8981\u88ab\u653e\u4e0a\u5934\u7248\u7684\u4efb\u52a1',
  currentCover: '\u0043\u0075\u0072\u0072\u0065\u006e\u0074\u0020\u0043\u006f\u0076\u0065\u0072',
  coverEmpty: '\u5f53\u524d\u6ca1\u6709\u5934\u7248\u4efb\u52a1\uff0c\u7248\u9762\u7b49\u5f85\u7b2c\u4e00\u6761\u5185\u5bb9\u3002',
  coverLead: '\u5934\u7248\u4efb\u52a1\uff1a',
  add: '\u65b0\u5efa\u5f85\u529e',
  batch: '\u6279\u91cf\u7f16\u8f91',
  selected: '\u5df2\u9009\u9879',
  completeSelected: '\u5b8c\u6210\u6240\u9009',
  deleteSelected: '\u5220\u9664\u6240\u9009',
  clear: '\u6e05\u9664\u9009\u62e9',
  search: '\u641c\u7d22\u5f85\u529e\u3001\u6807\u7b7e...',
  allCategories: '\u6240\u6709\u5206\u7c7b',
  noMatch: '\u6ca1\u6709\u5339\u914d\u7ed3\u679c',
  noMatchDesc: '\u6362\u4e00\u4e2a\u5173\u952e\u8bcd\uff0c\u6216\u8005\u6e05\u7a7a\u7b5b\u9009\u540e\u91cd\u65b0\u6d4f\u89c8\u7248\u9762\u3002',
  addFirst: '\u6dfb\u52a0\u7b2c\u4e00\u9879',
  edit: '\u7f16\u8f91\u4efb\u52a1',
  newEntry: '\u65b0\u5efa\u4efb\u52a1',
  taskPlaceholder: '\u5199\u4e0b\u4efb\u52a1\u6807\u9898...',
  priority: '\u4f18\u5148\u7ea7',
  category: '\u5206\u7c7b',
  due: '\u622a\u6b62\u65e5\u671f',
  tags: '\u6807\u7b7e',
  tagPlaceholder: '\u9879\u76ee, \u7d27\u6025, \u4eca\u65e5',
  cancel: '\u53d6\u6d88',
  save: '\u4fdd\u5b58\u4efb\u52a1',
  addToBoard: '\u52a0\u5165\u7248\u9762',
  unnamed: '\u672a\u547d\u540d\u4efb\u52a1',
  noDate: '\u672a\u8bbe\u65e5\u671f',
  confirmDelete: '\u786e\u5b9a\u8981\u5220\u9664\u9009\u4e2d\u7684',
  confirmDeleteSuffix: '\u4e2a\u5f85\u529e\u4e8b\u9879\u5417\uff1f',
  markDone: '\u6807\u8bb0\u4e3a\u5b8c\u6210',
  markUndone: '\u6807\u8bb0\u4e3a\u672a\u5b8c\u6210',
  selectTask: '\u9009\u62e9\u4efb\u52a1',
  deleteTask: '\u5220\u9664\u4efb\u52a1'
}

const heroImage = 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1800&q=85'
const sideImage = 'https://images.unsplash.com/photo-1453928582365-b6ad33cbcf64?w=800&q=85'

const priorities = {
  high: { label: '\u9ad8', color: '#d94735', soft: '#f7d9d2' },
  medium: { label: '\u4e2d', color: '#b7862c', soft: '#f5e8c9' },
  low: { label: '\u4f4e', color: '#2f7d62', soft: '#d9eadf' }
}

const categories = [
  { name: '\u5de5\u4f5c', color: '#1f4f7a', icon: 'WK' },
  { name: '\u5b66\u4e60', color: '#6f4d8f', icon: 'ST' },
  { name: '\u751f\u6d3b', color: '#2f7d62', icon: 'LF' },
  { name: '\u5065\u5eb7', color: '#b83f5b', icon: 'HL' },
  { name: '\u5a31\u4e50', color: '#b9652b', icon: 'PL' },
  { name: '\u5176\u4ed6', color: '#4b5563', icon: 'OT' }
]

const filters = [
  { value: 'all', label: '\u5168\u90e8' },
  { value: 'active', label: '\u8fdb\u884c\u4e2d' },
  { value: 'completed', label: '\u5df2\u5b8c\u6210' },
  { value: 'high', label: '\u9ad8\u4f18\u5148\u7ea7' }
]

const emptyCopy = {
  all: ['\u6682\u65e0\u5f85\u529e\u4e8b\u9879', '\u5148\u5199\u4e0b\u4eca\u5929\u6700\u503c\u5f97\u88ab\u5b8c\u6210\u7684\u4e00\u4ef6\u4e8b\u3002'],
  active: ['\u6ca1\u6709\u8fdb\u884c\u4e2d\u7684\u4efb\u52a1', '\u5f53\u4e0b\u7684\u7248\u9762\u5f88\u5e72\u51c0\uff0c\u53ef\u4ee5\u5b89\u6392\u4e0b\u4e00\u6bb5\u5de5\u4f5c\u3002'],
  completed: ['\u8fd8\u6ca1\u6709\u5b8c\u6210\u8bb0\u5f55', '\u5b8c\u6210\u7b2c\u4e00\u9879\u540e\uff0c\u8fd9\u91cc\u4f1a\u50cf\u4f5c\u54c1\u76ee\u5f55\u4e00\u6837\u5c55\u5f00\u3002'],
  high: ['\u6ca1\u6709\u9ad8\u4f18\u5148\u7ea7\u4efb\u52a1', '\u91cd\u8981\u4e8b\u9879\u6682\u65f6\u7f3a\u5e2d\uff0c\u662f\u4e2a\u597d\u6d88\u606f\u3002']
}

const getTaskTitle = (todo) => todo.task || todo.title || t.unnamed

const formatDueDate = (dateValue) => {
  if (!dateValue) return t.noDate
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return t.noDate
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

const StatBlock = ({ label, value, helper, icon: Icon, accent }) => (
  <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="border-t border-black/15 pt-4 dark:border-white/15">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-neutral-500 dark:text-neutral-400">{label}</p>
        <p className="mt-2 font-serif text-5xl leading-none text-neutral-950 dark:text-white">{value}</p>
        <p className="mt-3 max-w-[12rem] text-xs leading-5 text-neutral-500 dark:text-neutral-400">{helper}</p>
      </div>
      <span className="flex h-10 w-10 items-center justify-center border border-black/20 bg-white text-neutral-900 dark:border-white/20 dark:bg-neutral-950 dark:text-white">
        <Icon className="h-4 w-4" style={{ color: accent }} />
      </span>
    </div>
  </motion.div>
)

const TaskCard = ({ todo, index, onToggle, onDelete, onEdit, isSelected, onSelect, isBatchMode, isDeleting }) => {
  const priority = priorities[todo.priority] || priorities.medium
  const category = categories.find((item) => item.name === todo.category) || categories[5]
  const isFeature = index % 7 === 0
  const isTall = index % 5 === 2

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.24) }}
      className={[
        'group relative overflow-hidden rounded-xl border border-black/15 bg-[#f8f4ec] text-neutral-950 shadow-[0_20px_60px_rgba(0,0,0,0.08)] dark:border-white/15 dark:bg-neutral-900 dark:text-white',
        isFeature ? 'min-h-[28rem] md:col-span-2 md:row-span-2' : 'min-h-[17rem]',
        isTall ? 'min-h-[24rem] md:row-span-2' : '',
        isDeleting ? 'opacity-60 pointer-events-none' : ''
      ].join(' ')}
    >
      {/* 删除中遮罩 */}
      {isDeleting && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 backdrop-blur-sm dark:bg-neutral-900/40">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-950 dark:border-neutral-700 dark:border-t-white" />
            <span className="text-xs font-semibold uppercase tracking-widest text-neutral-600 dark:text-neutral-400">删除中...</span>
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: priority.color }} />
      <div className="absolute -right-10 top-8 font-serif text-[9rem] leading-none text-black/[0.035] dark:text-white/[0.04]">
        {String(index + 1).padStart(2, '0')}
      </div>

      <div className="relative flex h-full flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            {isBatchMode && (
              <button onClick={() => onSelect(todo.id)} aria-label={t.selectTask} className="flex h-8 w-8 items-center justify-center border border-black/25 bg-white/70 text-neutral-900 transition hover:bg-white dark:border-white/25 dark:bg-black/30 dark:text-white">
                {isSelected && <Check className="h-4 w-4" />}
              </button>
            )}
            <button
              onClick={() => onToggle(todo.id)}
              disabled={isDeleting || todo.completed}
              aria-label={todo.completed ? t.markUndone : t.markDone}
              className={[
                'flex h-8 w-8 items-center justify-center border border-black/25 bg-white/70 text-neutral-900 transition hover:bg-white dark:border-white/25 dark:bg-black/30 dark:text-white',
                isDeleting || todo.completed ? 'opacity-50 cursor-not-allowed' : ''
              ].join(' ')}
            >
              {todo.completed ? <Check className="h-4 w-4" /> : <span className="h-2 w-2 rounded-full bg-current" />}
            </button>
            <span className="border border-black/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] dark:border-white/15">
              {category.icon}
            </span>
          </div>
          <span className="px-3 py-1 text-[11px] font-semibold tracking-[0.2em]" style={{ backgroundColor: priority.soft, color: priority.color }}>
            {priority.label}
          </span>
        </div>

        <div className="mt-8 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-neutral-500 dark:text-neutral-400">
            {category.name} / {formatDueDate(todo.dueDate)}
          </p>
          <h2 className={[
            'mt-4 max-w-[18ch] font-serif leading-[0.98] tracking-normal',
            isFeature ? 'text-5xl sm:text-6xl' : 'text-3xl sm:text-4xl',
            todo.completed ? 'text-neutral-400 line-through decoration-2' : ''
          ].join(' ')}>
            {getTaskTitle(todo)}
          </h2>
        </div>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-4 border-t border-black/15 pt-4 dark:border-white/15">
          <div className="flex max-w-[70%] flex-wrap gap-2">
            {(todo.tags || []).slice(0, 4).map((tag) => (
              <span key={tag} className="text-xs italic text-neutral-500 dark:text-neutral-400">#{tag}</span>
            ))}
          </div>
          {!isBatchMode && (
            <div className="flex items-center gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
              <button onClick={() => onEdit(todo)} aria-label={t.edit} className="flex h-9 w-9 items-center justify-center border border-black/15 bg-white/60 transition hover:bg-white dark:border-white/15 dark:bg-black/20 dark:hover:bg-black/40">
                <Edit2 className="h-4 w-4" />
              </button>
              <button onClick={() => onDelete(todo.id)} aria-label={t.deleteTask} className="flex h-9 w-9 items-center justify-center border border-black/15 bg-white/60 text-red-600 transition hover:bg-white dark:border-white/15 dark:bg-black/20 dark:hover:bg-black/40">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.article>
  )
}

const AddTodoModal = ({ isOpen, onClose, onAdd, onUpdate, editingTodo }) => {
  const isEditing = Boolean(editingTodo)
  const [task, setTask] = useState('')
  const [priority, setPriority] = useState('medium')
  const [category, setCategory] = useState(categories[5].name)
  const [dueDate, setDueDate] = useState('')
  const [tags, setTags] = useState('')

  useEffect(() => {
    if (editingTodo) {
      setTask(editingTodo.task || editingTodo.title || '')
      setPriority(editingTodo.priority || 'medium')
      setCategory(editingTodo.category || categories[5].name)
      if (editingTodo.dueDate) {
        const date = new Date(editingTodo.dueDate)
        if (!Number.isNaN(date.getTime())) {
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          setDueDate(`${year}-${month}-${day}`)
        }
      } else {
        setDueDate('')
      }
      setTags(editingTodo.tags?.join(', ') || '')
    } else {
      setTask('')
      setPriority('medium')
      setCategory(categories[5].name)
      setDueDate('')
      setTags('')
    }
  }, [editingTodo, isOpen])

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!task.trim()) return
    const todoData = {
      task: task.trim(),
      priority,
      category,
      dueDate: dueDate || null,
      tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean)
    }
    if (isEditing && onUpdate) {
      onUpdate(editingTodo.id, todoData)
    } else {
      onAdd({ ...todoData, completed: false, createdAt: new Date().toISOString() })
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} className="relative w-full max-w-2xl border border-black/15 bg-[#f8f4ec] p-6 shadow-2xl dark:border-white/15 dark:bg-neutral-950">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-neutral-500 dark:text-neutral-400">Editorial Entry</p>
            <h3 className="mt-3 font-serif text-4xl leading-none text-neutral-950 dark:text-white">{isEditing ? t.edit : t.newEntry}</h3>
          </div>
          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center border border-black/15 dark:border-white/15">
            <X className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input type="text" value={task} onChange={(event) => setTask(event.target.value)} placeholder={t.taskPlaceholder} className="w-full border-b border-black/30 bg-transparent px-0 py-4 font-serif text-3xl text-neutral-950 outline-none placeholder:text-neutral-400 focus:border-black dark:border-white/30 dark:text-white dark:focus:border-white" autoFocus />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">{t.priority}</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(priorities).map(([key, item]) => (
                  <button key={key} type="button" onClick={() => setPriority(key)} className="border px-3 py-3 text-sm font-semibold transition" style={{ borderColor: priority === key ? item.color : 'rgba(0,0,0,0.18)', backgroundColor: priority === key ? item.soft : 'transparent', color: priority === key ? item.color : 'inherit' }}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">{t.category}</label>
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-[46px] w-full border border-black/20 bg-white/60 px-3 text-sm text-neutral-950 outline-none focus:border-black dark:border-white/20 dark:bg-black/20 dark:text-white">
                {categories.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">{t.due}</label>
              <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="h-[46px] w-full border border-black/20 bg-white/60 px-3 text-sm text-neutral-950 outline-none focus:border-black dark:border-white/20 dark:bg-black/20 dark:text-white" />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">{t.tags}</label>
              <input type="text" value={tags} onChange={(event) => setTags(event.target.value)} placeholder={t.tagPlaceholder} className="h-[46px] w-full border border-black/20 bg-white/60 px-3 text-sm text-neutral-950 outline-none placeholder:text-neutral-400 focus:border-black dark:border-white/20 dark:bg-black/20 dark:text-white" />
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4 sm:flex-row">
            <button type="button" onClick={onClose} className="border border-black/20 px-5 py-3 text-sm font-semibold dark:border-white/20">{t.cancel}</button>
            <button type="submit" disabled={!task.trim()} className="flex flex-1 items-center justify-center gap-2 bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-neutral-950">
              {isEditing ? t.save : t.addToBoard}
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

const Todo = () => {
  const [todos, setTodos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isBatchMode, setIsBatchMode] = useState(false)
  const [selectedTodos, setSelectedTodos] = useState([])
  const [editingTodo, setEditingTodo] = useState(null)
  const [deletingTodos, setDeletingTodos] = useState(new Set())
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}')
        if (user.id) {
          const dbTodos = await loadTodosFromDB()
          if (dbTodos.length > 0) {
            setTodos(dbTodos)
            setIsLoading(false)
            return
          }
        }
      } catch (e) {
        console.warn('从数据库加载失败，使用本地数据:', e.message)
      }
      try {
        setTodos(JSON.parse(localStorage.getItem('myku_todos') || '[]'))
      } catch (error) {
        console.error('Failed to load todos:', error)
        setTodos([])
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    if (!isLoading) localStorage.setItem('myku_todos', JSON.stringify(todos))
  }, [todos, isLoading])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') {
        event.preventDefault()
        setEditingTodo(null)
        setIsAddModalOpen(true)
      }
      if (event.key === 'Escape') {
        setIsAddModalOpen(false)
        setIsBatchMode(false)
        setSelectedTodos([])
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleAdd = (todoData) => setTodos([{ ...todoData, id: Date.now().toString() }, ...todos])

  const handleToggle = async (id) => {
    const todo = todos.find(t => t.id === id)
    if (!todo || todo.completed || deletingTodos.has(id)) return

    // 乐观更新：立即标记为已完成（视觉反馈）
    const previousTodos = [...todos]
    setTodos(prev => prev.map(t =>
      t.id === id
        ? { ...t, completed: true, completedAt: new Date().toISOString() }
        : t
    ))

    // 标记为正在删除
    setDeletingTodos(prev => new Set([...prev, id]))
    setError(null)

    try {
      // 调用后端API永久删除任务
      await deleteTodoFromDB(id)

      // 成功：从列表中移除任务
      setTodos(prev => prev.filter(t => t.id !== id))

      // 3秒后自动清除错误提示（如果有）
      setTimeout(() => setError(null), 3000)
    } catch (err) {
      console.error('删除任务失败:', err.message)

      // 失败：回滚到未完成状态
      setTodos(previousTodos)
      setError({
        type: 'delete_failed',
        message: err.message || '删除失败，请重试',
        todoId: id,
        timestamp: Date.now()
      })

      // 5秒后自动清除错误
      setTimeout(() => setError(null), 5000)
    } finally {
      // 清除删除中状态
      setDeletingTodos(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const handleDelete = (id) => {
    if (deletingTodos.has(id)) return

    const previousTodos = [...todos]
    setTodos(prev => prev.filter(t => t.id !== id))
    setDeletingTodos(prev => new Set([...prev, id]))

    deleteTodoFromDB(id)
      .then(() => {
        // 删除成功，保持当前状态即可
      })
      .catch(err => {
        // 回滚
        setTodos(previousTodos)
        setError({
          type: 'delete_failed',
          message: err.message || '删除失败',
          todoId: id,
          timestamp: Date.now()
        })
        setTimeout(() => setError(null), 5000)
      })
      .finally(() => {
        setDeletingTodos(prev => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      })
  }
  const handleEdit = (todo) => {
    setEditingTodo(todo)
    setIsAddModalOpen(true)
  }
  const handleUpdate = (id, todoData) => {
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, ...todoData } : todo)))
    setEditingTodo(null)
  }
  const handleSelect = (id) => setSelectedTodos((current) => (current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]))
  const handleBatchComplete = async () => {
    if (selectedTodos.length === 0) return

    // 乐观更新：标记所有选中任务为已完成
    const previousTodos = [...todos]
    setTodos(prev => prev.map(todo =>
      selectedTodos.includes(todo.id)
        ? { ...todo, completed: true, completedAt: new Date().toISOString() }
        : todo
    ))

    // 标记所有选中的任务为正在删除
    setDeletingTodos(new Set(selectedTodos))
    setError(null)

    try {
      // 批量调用删除API
      await Promise.all(
        selectedTodos.map(id => deleteTodoFromDB(id))
      )

      // 成功：从列表中移除所有已完成的任务
      setTodos(prev => prev.filter(todo => !selectedTodos.includes(todo.id)))
    } catch (err) {
      console.error('批量完成失败:', err.message)

      // 回滚
      setTodos(previousTodos)
      setError({
        type: 'batch_complete_failed',
        message: `部分任务删除失败: ${err.message}`,
        timestamp: Date.now()
      })
      setTimeout(() => setError(null), 5000)
    } finally {
      setSelectedTodos([])
      setIsBatchMode(false)
      setDeletingTodos(new Set())
    }
  }
  const handleBatchDelete = async () => {
    if (selectedTodos.length === 0) return
    if (!confirm(`${t.confirmDelete} ${selectedTodos.length} ${t.confirmDeleteSuffix}`)) return

    const previousTodos = [...todos]
    setTodos(prev => prev.filter(todo => !selectedTodos.includes(todo.id)))
    setDeletingTodos(new Set(selectedTodos))
    setError(null)

    try {
      await Promise.all(
        selectedTodos.map(id => deleteTodoFromDB(id))
      )
      // 成功，保持当前状态
    } catch (err) {
      console.error('批量删除失败:', err.message)
      setTodos(previousTodos)
      setError({
        type: 'batch_delete_failed',
        message: `部分任务删除失败: ${err.message}`,
        timestamp: Date.now()
      })
      setTimeout(() => setError(null), 5000)
    } finally {
      setSelectedTodos([])
      setIsBatchMode(false)
      setDeletingTodos(new Set())
    }
  }

  const filteredTodos = useMemo(() => todos.filter((todo) => {
    if (filter === 'active' && todo.completed) return false
    if (filter === 'completed' && !todo.completed) return false
    if (filter === 'high' && todo.priority !== 'high') return false
    if (categoryFilter !== 'all' && todo.category !== categoryFilter) return false
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      return getTaskTitle(todo).toLowerCase().includes(query) || (todo.tags || []).join(' ').toLowerCase().includes(query)
    }
    return true
  }), [todos, filter, categoryFilter, searchQuery])

  const stats = useMemo(() => {
    const total = todos.length
    const completed = todos.filter((todo) => todo.completed).length
    const pending = todos.filter((todo) => !todo.completed).length
    const high = todos.filter((todo) => todo.priority === 'high' && !todo.completed).length
    return { total, completed, pending, high, completionRate: total > 0 ? Math.round((completed / total) * 100) : 0, incompletionRate: total > 0 ? Math.round((pending / total) * 100) : 0 }
  }, [todos])

  const leadTodo = filteredTodos[0]
  const empty = emptyCopy[filter] || emptyCopy.all

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f4ec] dark:bg-neutral-950">
        <div className="h-10 w-10 animate-spin border-2 border-neutral-300 border-t-neutral-950 dark:border-neutral-700 dark:border-t-white" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f4ec] pt-20 text-neutral-950 transition-colors duration-300 dark:bg-neutral-950 dark:text-white">
      {/* 错误提示 Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 right-6 z-50 max-w-md"
          >
            <div className="flex items-start gap-3 border border-red-300 bg-red-50 p-4 shadow-lg dark:border-red-800 dark:bg-red-950">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
                <X className="h-3 w-3" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900 dark:text-red-100">操作失败</p>
                <p className="mt-1 text-xs text-red-700 dark:text-red-300">{error.message}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="shrink-0 text-red-400 hover:text-red-600 dark:hover:text-red-200"
              >
                <span className="text-lg leading-none">×</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="relative overflow-hidden border-b border-black/15 dark:border-white/15">
        <div className="absolute inset-y-0 right-0 hidden w-[48%] lg:block">
          <img src={heroImage} alt="" className="h-full w-full object-cover opacity-75 grayscale" />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#f8f4ec]/20 to-[#f8f4ec] dark:via-neutral-950/20 dark:to-neutral-950" />
        </div>
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[minmax(0,1.1fr)_24rem] lg:py-20">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative z-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.42em] text-neutral-500 dark:text-neutral-400">{t.pageKicker}</p>
            <h1 className="mt-5 max-w-[9ch] font-serif text-[clamp(5rem,15vw,12rem)] leading-[0.78] tracking-normal">
              {t.titleA}<br />{t.titleB}
            </h1>
            <div className="mt-8 grid max-w-3xl gap-6 border-t border-black/15 pt-6 text-sm leading-7 text-neutral-600 dark:border-white/15 dark:text-neutral-300 sm:grid-cols-[1fr_1.4fr]">
              <p className="font-serif text-2xl leading-tight text-neutral-950 dark:text-white">{t.lead}</p>
              <p>{t.desc}</p>
            </div>
          </motion.div>
          <motion.aside initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="relative z-10 self-end bg-[#f8f4ec]/90 p-0 backdrop-blur dark:bg-neutral-950/80">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
              <StatBlock label={t.total} value={stats.total} helper={t.totalHelp} icon={Target} accent="#1f4f7a" />
              <StatBlock label={t.rate} value={`${stats.incompletionRate}%`} helper={`${stats.pending} ${t.rateHelp}`} icon={Sparkles} accent="#2f7d62" />
              <StatBlock label={t.pending} value={stats.pending} helper={t.pendingHelp} icon={Zap} accent="#b7862c" />
              <StatBlock label={t.high} value={stats.high} helper={t.highHelp} icon={Layers3} accent="#d94735" />
            </div>
          </motion.aside>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-12">
        <section className="grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)]">
          <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
            <div className="border-y border-black/15 py-5 dark:border-white/15">
              <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-neutral-500 dark:text-neutral-400">{t.currentCover}</p>
              <div className="mt-4 aspect-[4/5] overflow-hidden">
                <img src={sideImage} alt="" className="h-full w-full object-cover grayscale" />
              </div>
              <p className="mt-4 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                {leadTodo ? `${t.coverLead}${getTaskTitle(leadTodo)}` : t.coverEmpty}
              </p>
            </div>
            <div className="space-y-3">
              <button onClick={() => { setEditingTodo(null); setIsAddModalOpen(true) }} className="flex w-full items-center justify-between bg-neutral-950 px-4 py-4 text-sm font-bold text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-950">
                {t.add}<Plus className="h-5 w-5" />
              </button>
              <button onClick={() => { setIsBatchMode(!isBatchMode); setSelectedTodos([]) }} className={[
                'flex w-full items-center justify-between border px-4 py-4 text-sm font-bold transition',
                isBatchMode ? 'border-neutral-950 bg-white text-neutral-950 dark:border-white dark:bg-white dark:text-neutral-950' : 'border-black/20 text-neutral-700 hover:border-black dark:border-white/20 dark:text-neutral-200 dark:hover:border-white'
              ].join(' ')}>
                {t.batch}<Scissors className="h-5 w-5" />
              </button>
            </div>
            <AnimatePresence>
              {isBatchMode && selectedTodos.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="border border-black/15 bg-white/60 p-4 dark:border-white/15 dark:bg-white/5">
                  <p className="font-serif text-3xl">{selectedTodos.length}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.24em] text-neutral-500">{t.selected}</p>
                  <div className="mt-4 grid gap-2">
                    <button onClick={handleBatchComplete} className="flex items-center justify-between bg-emerald-700 px-3 py-2 text-sm font-semibold text-white">{t.completeSelected}<Check className="h-4 w-4" /></button>
                    <button onClick={handleBatchDelete} className="flex items-center justify-between bg-red-700 px-3 py-2 text-sm font-semibold text-white">{t.deleteSelected}<Trash2 className="h-4 w-4" /></button>
                    <button onClick={() => setSelectedTodos([])} className="text-left text-sm text-neutral-500 hover:text-neutral-950 dark:hover:text-white">{t.clear}</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </aside>

          <section>
            <div className="mb-8 grid gap-4 border-y border-black/15 py-4 dark:border-white/15 xl:grid-cols-[minmax(16rem,1fr)_auto]">
              <div className="relative">
                <Search className="absolute left-0 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                <input type="text" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={t.search} className="h-12 w-full border-0 border-b border-black/20 bg-transparent pl-8 pr-3 text-base text-neutral-950 outline-none placeholder:text-neutral-400 focus:border-black dark:border-white/20 dark:text-white dark:focus:border-white" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {filters.map((item) => (
                  <button key={item.value} onClick={() => setFilter(item.value)} className={[
                    'h-10 border px-3 text-xs font-bold uppercase tracking-[0.16em] transition',
                    filter === item.value ? 'border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950' : 'border-black/20 text-neutral-600 hover:border-black dark:border-white/20 dark:text-neutral-300 dark:hover:border-white'
                  ].join(' ')}>
                    {item.label}
                  </button>
                ))}
                <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="h-10 border border-black/20 bg-transparent px-3 text-xs font-bold uppercase tracking-[0.12em] text-neutral-700 outline-none focus:border-black dark:border-white/20 dark:text-neutral-200 dark:focus:border-white">
                  <option value="all">{t.allCategories}</option>
                  {categories.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
                </select>
              </div>
            </div>

            <AnimatePresence mode="popLayout">
              {filteredTodos.length === 0 ? (
                <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="grid min-h-[28rem] place-items-center border border-dashed border-black/25 px-6 text-center dark:border-white/25">
                  <div>
                    <ClipboardList className="mx-auto h-12 w-12 text-neutral-400" />
                    <h2 className="mt-6 font-serif text-5xl text-neutral-950 dark:text-white">{searchQuery ? t.noMatch : empty[0]}</h2>
                    <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-neutral-500 dark:text-neutral-400">{searchQuery ? t.noMatchDesc : empty[1]}</p>
                    <button onClick={() => { setEditingTodo(null); setIsAddModalOpen(true) }} className="mt-8 inline-flex items-center gap-2 bg-neutral-950 px-5 py-3 text-sm font-semibold text-white dark:bg-white dark:text-neutral-950">
                      {t.addFirst}<Plus className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid auto-rows-[minmax(17rem,auto)] grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {filteredTodos.map((todo, index) => (
                    <TaskCard
                      key={todo.id}
                      todo={todo}
                      index={index}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                      isSelected={selectedTodos.includes(todo.id)}
                      onSelect={handleSelect}
                      isBatchMode={isBatchMode}
                      isDeleting={deletingTodos.has(todo.id)}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </section>
      </main>

      <AnimatePresence>
        {isAddModalOpen && (
          <AddTodoModal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); setEditingTodo(null) }} onAdd={handleAdd} onUpdate={handleUpdate} editingTodo={editingTodo} />
        )}
      </AnimatePresence>
    </div>
  )
}

export default Todo
