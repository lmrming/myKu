import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Download, Upload, FileJson, FileSpreadsheet, 
  Trash2, AlertTriangle, CheckCircle2, X,
  Database, Calendar, Target, FileText, CheckSquare
} from 'lucide-react'

// 数据导入导出管理组件
const DataManager = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('export')
  const [selectedTypes, setSelectedTypes] = useState(['all'])
  const [isProcessing, setIsProcessing] = useState(false)
  const [notification, setNotification] = useState(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const dataTypes = [
    { key: 'todos', label: '待办事项', icon: CheckSquare, color: 'bg-blue-500', storageKey: 'myku_todos' },
    { key: 'notes', label: '笔记', icon: FileText, color: 'bg-yellow-500', storageKey: 'myku_notes' },
    { key: 'habits', label: '习惯', icon: Target, color: 'bg-rose-500', storageKey: 'myku_habits' },
    { key: 'calendar', label: '日历事件', icon: Calendar, color: 'bg-purple-500', storageKey: 'myku_calendar_events' },
    { key: 'focus', label: '专注记录', icon: Target, color: 'bg-amber-500', storageKey: 'myku_focus_sessions' },
  ]

  // 显示通知
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }, [])

  // 导出数据
  const handleExport = useCallback(async (format) => {
    setIsProcessing(true)
    
    try {
      const exportData = {}
      const typesToExport = selectedTypes.includes('all') 
        ? dataTypes.map(t => t.key)
        : selectedTypes

      typesToExport.forEach(type => {
        const dataType = dataTypes.find(t => t.key === type)
        if (dataType) {
          exportData[type] = JSON.parse(localStorage.getItem(dataType.storageKey) || '[]')
        }
      })

      exportData._exportInfo = {
        date: new Date().toISOString(),
        version: '1.0',
        app: 'MyKu'
      }

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `myku_backup_${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
      } else if (format === 'csv') {
        // CSV导出
        let csvContent = 'data:text/csv;charset=utf-8,\uFEFF'
        
        Object.entries(exportData).forEach(([type, data]) => {
          if (type.startsWith('_')) return
          if (Array.isArray(data) && data.length > 0) {
            csvContent += `\n${type.toUpperCase()}\n`
            const headers = Object.keys(data[0]).join(',')
            csvContent += headers + '\n'
            data.forEach(item => {
              const values = Object.values(item).map(v => {
                const str = String(v).replace(/"/g, '""')
                return str.includes(',') ? `"${str}"` : str
              }).join(',')
              csvContent += values + '\n'
            })
          }
        })
        
        const encodedUri = encodeURI(csvContent)
        const a = document.createElement('a')
        a.href = encodedUri
        a.download = `myku_backup_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
      }

      showNotification('数据导出成功！')
    } catch (error) {
      showNotification('导出失败，请重试', 'error')
    } finally {
      setIsProcessing(false)
    }
  }, [selectedTypes, showNotification])

  // 导入数据
  const handleImport = useCallback(async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setIsProcessing(true)

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (!data._exportInfo) {
        throw new Error('无效的数据文件')
      }

      // 导入数据
      Object.entries(data).forEach(([key, value]) => {
        if (key.startsWith('_')) return
        const dataType = dataTypes.find(t => t.key === key)
        if (dataType && Array.isArray(value)) {
          const existing = JSON.parse(localStorage.getItem(dataType.storageKey) || '[]')
          // 合并数据，避免重复
          const merged = [...existing, ...value].filter((item, index, self) => 
            index === self.findIndex(t => t.id === item.id)
          )
          localStorage.setItem(dataType.storageKey, JSON.stringify(merged))
        }
      })

      showNotification('数据导入成功！')
      setTimeout(() => window.location.reload(), 1500)
    } catch (error) {
      showNotification('导入失败：' + error.message, 'error')
    } finally {
      setIsProcessing(false)
      event.target.value = ''
    }
  }, [showNotification])

  // 清除数据
  const handleClearData = useCallback(() => {
    const typesToClear = selectedTypes.includes('all')
      ? dataTypes.map(t => t.key)
      : selectedTypes

    typesToClear.forEach(type => {
      const dataType = dataTypes.find(t => t.key === type)
      if (dataType) {
        localStorage.removeItem(dataType.storageKey)
      }
    })

    showNotification('数据已清除')
    setShowClearConfirm(false)
    setTimeout(() => window.location.reload(), 1500)
  }, [selectedTypes, showNotification])

  // 切换选择
  const toggleSelection = (key) => {
    if (key === 'all') {
      setSelectedTypes(['all'])
    } else {
      setSelectedTypes(prev => {
        const filtered = prev.filter(k => k !== 'all')
        if (filtered.includes(key)) {
          const newSelection = filtered.filter(k => k !== key)
          return newSelection.length === 0 ? ['all'] : newSelection
        } else {
          return [...filtered, key]
        }
      })
    }
  }

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
        className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
              <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">数据管理</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">导入、导出或清除您的数据</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 标签页 */}
        <div className="flex p-2 mx-6 mt-4 bg-gray-100 dark:bg-zinc-800 rounded-2xl">
          {[
            { key: 'export', label: '导出', icon: Download },
            { key: 'import', label: '导入', icon: Upload },
            { key: 'clear', label: '清除', icon: Trash2 },
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* 内容区域 */}
        <div className="p-6">
          {/* 数据类型选择 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              选择数据类型
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => toggleSelection('all')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedTypes.includes('all')
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                }`}
              >
                全部
              </button>
              {dataTypes.map(type => {
                const Icon = type.icon
                const isSelected = selectedTypes.includes(type.key)
                return (
                  <button
                    key={type.key}
                    onClick={() => toggleSelection(type.key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {type.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 导出面板 */}
          {activeTab === 'export' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                将您的数据导出为文件，以便备份或迁移
              </p>
              <button
                onClick={() => handleExport('json')}
                disabled={isProcessing}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 transition disabled:opacity-50"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                  <FileJson className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900 dark:text-white">导出为 JSON</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">推荐，保留完整数据结构</div>
                </div>
                <Download className="w-5 h-5 text-gray-400" />
              </button>
              <button
                onClick={() => handleExport('csv')}
                disabled={isProcessing}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 transition disabled:opacity-50"
              >
                <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900 dark:text-white">导出为 CSV</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">适合在表格软件中查看</div>
                </div>
                <Download className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          )}

          {/* 导入面板 */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                从之前导出的 JSON 文件恢复数据
              </p>
              <label className="flex flex-col items-center justify-center w-full h-32 rounded-2xl border-2 border-dashed border-gray-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 transition cursor-pointer bg-gray-50 dark:bg-zinc-800/50">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">点击选择文件</span>
                <span className="text-xs text-gray-400 mt-1">支持 .json 格式</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  disabled={isProcessing}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* 清除面板 */}
          {activeTab === 'clear' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      警告：此操作不可撤销
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      清除的数据将无法恢复，建议先导出备份
                    </p>
                  </div>
                </div>
              </div>
              
              {!showClearConfirm ? (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-medium hover:bg-rose-200 dark:hover:bg-rose-500/30 transition"
                >
                  <Trash2 className="w-5 h-5" />
                  清除选中的数据
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 p-4 rounded-2xl bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-zinc-700 transition"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleClearData}
                    disabled={isProcessing}
                    className="flex-1 p-4 rounded-2xl bg-rose-500 text-white font-medium hover:bg-rose-600 transition disabled:opacity-50"
                  >
                    确认清除
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 通知 */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={`absolute bottom-4 left-4 right-4 flex items-center gap-3 p-4 rounded-2xl ${
                notification.type === 'error' 
                  ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300' 
                  : 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300'
              }`}
            >
              {notification.type === 'error' ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
              <span className="font-medium">{notification.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default DataManager
