import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  Trash2,
  Pin,
  Palette,
  Clock,
  X,
  Grid3X3,
  List,
} from 'lucide-react'
import { loadNotesFromDB } from '../services/dataSync.js'

const COLORS = [
  { name: '纯白', bg: 'bg-white', border: 'border-gray-200', text: 'text-gray-800' },
  { name: '珊瑚', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800' },
  { name: '琥珀', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800' },
  { name: '薄荷', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800' },
  { name: '天空', bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-800' },
  { name: '紫罗兰', bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-800' },
  { name: '粉色', bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-800' },
]

const PRESET_TAGS = ['工作', '学习', '生活', '灵感', '重要']

// 笔记卡片 - iOS 风格
const NoteCard = ({ note, onClick, onPin, onDelete, viewMode }) => {
  const color = COLORS[note.color] || COLORS[0]

  const handleDelete = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onDelete(note.id)
  }

  const handlePin = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onPin(note.id)
  }

  const handleCardClick = (e) => {
    if (e.target.closest('button')) return
    onClick(note)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={handleCardClick}
      className={`
        relative cursor-pointer group
        ${viewMode === 'grid' ? '' : 'flex items-center gap-4'}
        ${color.bg}
        rounded-xl p-5 shadow-sm
        transition-all duration-200
        hover:shadow-md
      `}
    >
      {note.isPinned && (
        <div className="absolute -top-2 -right-2 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
          <Pin className="w-3.5 h-3.5 text-white" />
        </div>
      )}

      <div className={viewMode === 'grid' ? '' : 'flex-1'}>
        <h3 className={`font-semibold mb-2 line-clamp-2 ${color.text}`}>
          {note.title || '无标题'}
        </h3>

        <p className={`text-sm line-clamp-3 mb-3 opacity-80 ${color.text}`}>
          {note.content || '无内容'}
        </p>

        {note.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {note.tags.map((tag, i) => (
              <span key={i} className="px-2.5 py-0.5 text-xs rounded-full bg-black/5">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-xs opacity-50">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(note.updatedAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
          </span>

          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handlePin}
              className={`p-2 rounded-xl transition-colors ${note.isPinned ? 'text-blue-500' : 'hover:bg-black/5'}`}
            >
              <Pin className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 rounded-xl hover:bg-red-500/10 text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// 编辑弹窗 - iOS 风格
const EditModal = ({ note, isOpen, onClose, onSave }) => {
  const [editedNote, setEditedNote] = useState(note || { title: '', content: '', color: 0, tags: [], isPinned: false })
  const [showColorPicker, setShowColorPicker] = useState(false)
  
  if (!isOpen) return null
  
  const handleSave = () => {
    onSave({
      ...editedNote,
      updatedAt: new Date().toISOString()
    })
    onClose()
  }
  
  const toggleTag = (tag) => {
    setEditedNote(prev => ({
      ...prev,
      tags: prev.tags?.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...(prev.tags || []), tag]
    }))
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl shadow-2xl ${COLORS[editedNote.color].bg}`}
      >
        <div className="sticky top-0 flex items-center justify-between p-4 bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-t-xl">
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-2 rounded-xl hover:bg-black/5 transition-colors"
              >
                <Palette className="w-5 h-5" />
              </button>
              
              <AnimatePresence>
                {showColorPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-2 p-2 bg-white dark:bg-zinc-900 rounded-xl shadow-xl flex gap-1"
                  >
                    {COLORS.map((color, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setEditedNote({ ...editedNote, color: idx }); setShowColorPicker(false) }}
                        className={`w-8 h-8 rounded-xl ${color.bg} border-2 ${editedNote.color === idx ? 'border-blue-500' : 'border-transparent'}`}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="flex gap-1">
              {PRESET_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                    editedNote.tags?.includes(tag)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditedNote({ ...editedNote, isPinned: !editedNote.isPinned })}
              className={`p-2 rounded-xl transition-colors ${editedNote.isPinned ? 'text-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'hover:bg-black/5'}`}
            >
              <Pin className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-black/5">
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
            >
              保存
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <input
            type="text"
            value={editedNote.title}
            onChange={(e) => setEditedNote({ ...editedNote, title: e.target.value })}
            placeholder="标题"
            className={`w-full text-2xl font-bold bg-transparent border-none outline-none placeholder-gray-400 ${COLORS[editedNote.color].text}`}
            autoFocus
          />
          <textarea
            value={editedNote.content}
            onChange={(e) => setEditedNote({ ...editedNote, content: e.target.value })}
            placeholder="开始记录..."
            className={`w-full mt-4 h-64 bg-transparent border-none outline-none resize-none placeholder-gray-400 ${COLORS[editedNote.color].text}`}
          />
        </div>
      </motion.div>
    </div>
  )
}

const Notes = () => {
  const [notes, setNotes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [selectedTag, setSelectedTag] = useState('全部')
  const [editingNote, setEditingNote] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}')
        if (user.id) {
          const dbNotes = await loadNotesFromDB()
          setNotes(dbNotes)
          setIsLoading(false)
          return
        }
      } catch (e) {
        console.warn('从数据库加载笔记失败，使用本地数据:', e.message)
      }
      try {
        const saved = localStorage.getItem('myku_notes')
        setNotes(saved ? JSON.parse(saved) : [])
      } catch (e) {
        console.error('Failed to load notes:', e)
        setNotes([])
      }
      setIsLoading(false)
    }
    loadData()
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('myku_notes', JSON.stringify(notes))
    } catch (e) {
      console.error('Failed to save notes:', e)
    }
  }, [notes])

  const createNote = () => {
    const newNote = {
      id: Date.now(),
      title: '',
      content: '',
      color: 0,
      tags: [],
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setEditingNote(newNote)
    setIsModalOpen(true)
  }

  const saveNote = (note) => {
    if (note.id && notes.find(n => n.id === note.id)) {
      setNotes(notes.map(n => n.id === note.id ? note : n))
    } else {
      setNotes([note, ...notes])
    }
    setIsModalOpen(false)
    setEditingNote(null)
  }

  const deleteNote = (id) => {
    if (!confirm('确定要删除这个笔记吗？')) return
    setNotes(prevNotes => prevNotes.filter(n => n.id !== id))
  }

  const togglePin = (id) => {
    setNotes(notes.map(n => 
      n.id === id ? { ...n, isPinned: !n.isPinned, updatedAt: new Date().toISOString() } : n
    ))
  }

  const filteredNotes = notes.filter(note => {
    if (selectedTag !== '全部' && !note.tags?.includes(selectedTag)) return false
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (note.title?.toLowerCase().includes(query) || 
              note.content?.toLowerCase().includes(query))
    }
    
    return true
  }).sort((a, b) => {
    if (a.isPinned !== b.isPinned) return b.isPinned ? 1 : -1
    return new Date(b.updatedAt) - new Date(a.updatedAt)
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pt-20 pb-12 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">备忘录</h1>
              <p className="text-gray-500 dark:text-gray-400">记录灵感，管理思绪</p>
            </div>
            <button
              onClick={createNote}
              className="flex items-center gap-2 px-5 py-2.5 bg-yellow-500 text-white rounded-xl font-medium hover:bg-yellow-600 transition-colors shadow-lg shadow-yellow-500/25"
            >
              <Plus className="w-5 h-5" />
              新建笔记
            </button>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索笔记..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="全部">全部标签</option>
              {PRESET_TAGS.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
            
            <div className="flex gap-1 bg-gray-100 dark:bg-zinc-800 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-gray-500'}`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-gray-500'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="flex gap-6 mt-4 text-sm text-gray-500 dark:text-gray-400">
            <span>共 {isLoading ? '...' : notes.length} 个笔记</span>
            <span>置顶 {isLoading ? '...' : notes.filter(n => n.isPinned).length} 个</span>
          </div>
        </motion.div>
        
        {isLoading ? (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'flex flex-col gap-4'
          }>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm ${viewMode === 'grid' ? '' : 'flex items-center gap-4'}`}
              >
                <div className="animate-pulse space-y-3">
                  <div className={`h-6 bg-gray-200 dark:bg-zinc-800 rounded w-3/4 ${viewMode === 'list' ? 'w-48' : ''}`} />
                  <div className="space-y-2">
                    <div className={`h-4 bg-gray-200 dark:bg-zinc-800 rounded ${viewMode === 'list' ? 'w-full' : ''}`} />
                    <div className={`h-4 bg-gray-200 dark:bg-zinc-800 rounded w-5/6 ${viewMode === 'list' ? 'w-4/5' : ''}`} />
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-1/3" />
                </div>
              </motion.div>
            ))}
          </div>
        ) : filteredNotes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {searchQuery ? '没有找到匹配的笔记' : '还没有笔记'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery ? '尝试其他搜索词' : '点击上方按钮创建你的第一个笔记'}
            </p>
          </motion.div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'flex flex-col gap-4'
          }>
            <AnimatePresence>
              {filteredNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onClick={(n) => { setEditingNote(n); setIsModalOpen(true) }}
                  onPin={togglePin}
                  onDelete={deleteNote}
                  viewMode={viewMode}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
        
        <AnimatePresence>
          {isModalOpen && (
            <EditModal
              note={editingNote}
              isOpen={isModalOpen}
              onClose={() => { setIsModalOpen(false); setEditingNote(null) }}
              onSave={saveNote}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default Notes
