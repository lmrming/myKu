/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 */
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Cloud,
  CloudOff
} from 'lucide-react'
import { syncAllData, startAutoSync, stopAutoSync, setupVisibilitySync } from '../services/dataSync.js'

const SyncButton = () => {
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState(null)
  const [syncStatus, setSyncStatus] = useState('idle') // idle, syncing, success, error
  const [syncResult, setSyncResult] = useState(null)
  const [isAutoSync, setIsAutoSync] = useState(false)

  useEffect(() => {
    // 获取上次同步时间
    const lastSyncTime = localStorage.getItem('myku_last_sync')
    if (lastSyncTime) {
      setLastSync(new Date(lastSyncTime))
    }

    // 设置页面可见性同步
    setupVisibilitySync()

    // 启动自动同步
    startAutoSync(5)
    setIsAutoSync(true)

    return () => {
      stopAutoSync()
    }
  }, [])

  const handleSync = async () => {
    if (isSyncing) return

    setIsSyncing(true)
    setSyncStatus('syncing')

    try {
      const result = await syncAllData()
      setSyncResult(result)
      
      if (result.success) {
        setSyncStatus('success')
        setLastSync(new Date())
      } else {
        setSyncStatus('error')
      }
    } catch (error) {
      console.error('同步失败:', error)
      setSyncStatus('error')
      setSyncResult({ error: error.message })
    } finally {
      setIsSyncing(false)
      
      // 3秒后重置状态
      setTimeout(() => {
        setSyncStatus('idle')
      }, 3000)
    }
  }

  const toggleAutoSync = () => {
    if (isAutoSync) {
      stopAutoSync()
      setIsAutoSync(false)
    } else {
      startAutoSync(5)
      setIsAutoSync(true)
    }
  }

  const formatLastSync = () => {
    if (!lastSync) return '从未同步'
    
    const now = new Date()
    const diff = now - lastSync
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes} 分钟前`
    if (hours < 24) return `${hours} 小时前`
    return lastSync.toLocaleDateString('zh-CN')
  }

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <RefreshCw style={{ width: '16px', height: '16px' }} className="spin" />
      case 'success':
        return <CheckCircle2 style={{ width: '16px', height: '16px', color: '#27ae60' }} />
      case 'error':
        return <AlertCircle style={{ width: '16px', height: '16px', color: '#e74c3c' }} />
      default:
        return isAutoSync 
          ? <Cloud style={{ width: '16px', height: '16px', color: '#3498db' }} />
          : <CloudOff style={{ width: '16px', height: '16px', color: '#95a5a6' }} />
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <motion.button
        onClick={handleSync}
        disabled={isSyncing}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 14px',
          backgroundColor: syncStatus === 'success' ? 'rgba(39, 174, 96, 0.1)' : 
                          syncStatus === 'error' ? 'rgba(231, 76, 60, 0.1)' : 
                          'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--font-size-xs)',
          color: syncStatus === 'success' ? '#27ae60' : 
                 syncStatus === 'error' ? '#e74c3c' : 
                 'var(--color-text-secondary)',
          cursor: isSyncing ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        <motion.div
          animate={isSyncing ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 1, repeat: isSyncing ? Infinity : 0, ease: 'linear' }}
        >
          {getStatusIcon()}
        </motion.div>
        <span>
          {isSyncing ? '同步中...' : 
           syncStatus === 'success' ? '同步成功' : 
           syncStatus === 'error' ? '同步失败' : 
           formatLastSync()}
        </span>
      </motion.button>

      {/* 同步详情弹窗 */}
      <AnimatePresence>
        {syncResult && syncStatus !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '280px',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
              boxShadow: 'var(--shadow-3)',
              zIndex: 100
            }}
          >
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              marginBottom: 'var(--space-3)',
              color: syncResult.success ? '#27ae60' : '#e74c3c'
            }}>
              {syncResult.success ? '✓ 同步完成' : '✗ 同步失败'}
            </div>
            
            {/* 同步详情 - 成功时 */}
            {syncResult.success && syncResult.results && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <div style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>待办事项</span>
                  <span style={{ color: '#27ae60' }}>
                    +{(syncResult.results.todos?.created || 0)} 
                    {(syncResult.results.todos?.updated || 0) > 0 ? ` 更新${syncResult.results.todos.updated}` : ''}
                  </span>
                </div>
                <div style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>备忘录</span>
                  <span style={{ color: '#27ae60' }}>+{syncResult.results.notes?.created || 0}</span>
                </div>
                <div style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>习惯</span>
                  <span style={{ color: '#27ae60' }}>+{syncResult.results.habits?.created || 0}</span>
                </div>
              </div>
            )}

            {/* 同步详情 - 失败时 */}
            {!syncResult.success && syncResult.results && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {/* 显示各项同步状态 */}
                {Object.entries(syncResult.results).map(([key, result]) => (
                  <div key={key} style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--font-size-xs)',
                    color: result.success ? '#27ae60' : '#e74c3c',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <span>{key === 'todos' ? '待办事项' : key === 'notes' ? '备忘录' : '习惯'}</span>
                    <span>{result.success ? '✓' : `✗ ${result.error || ''}`}</span>
                  </div>
                ))}
                
                {/* 显示具体错误 */}
                {Object.values(syncResult.results).some(r => r.errors?.length > 0) && (
                  <div style={{
                    marginTop: 'var(--space-2)',
                    padding: 'var(--space-2)',
                    backgroundColor: 'rgba(231, 76, 60, 0.05)',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    <div style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      color: '#e74c3c',
                      marginBottom: 'var(--space-2)'
                    }}>
                      错误详情:
                    </div>
                    {Object.entries(syncResult.results)
                      .filter(([, r]) => r.errors?.length > 0)
                      .map(([key, result]) => 
                        result.errors.map((err, i) => (
                          <div key={i} style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '10px',
                            color: '#e74c3c',
                            opacity: 0.8,
                            marginBottom: 'var(--space-1)'
                          }}>
                            • {err.task || err.title || err.habit}: {err.error}
                          </div>
                        ))
                      )
                    }
                  </div>
                )}
              </div>
            )}
            
            {!syncResult.success && !syncResult.results && syncResult.error && (
              <div style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--font-size-xs)',
                color: '#e74c3c'
              }}>
                {syncResult.error}
              </div>
            )}

            {/* 自动同步开关 */}
            <div style={{
              marginTop: 'var(--space-3)',
              paddingTop: 'var(--space-3)',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-secondary)'
              }}>
                自动同步
              </span>
              <button
                onClick={toggleAutoSync}
                style={{
                  width: '36px',
                  height: '20px',
                  borderRadius: '10px',
                  backgroundColor: isAutoSync ? '#27ae60' : '#95a5a6',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background-color 0.2s ease'
                }}
              >
                <motion.div
                  animate={{ x: isAutoSync ? 18 : 2 }}
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    position: 'absolute',
                    top: '2px'
                  }}
                />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SyncButton
