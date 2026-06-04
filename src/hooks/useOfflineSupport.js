import { useState, useEffect, useCallback } from 'react'

// 离线支持 Hook
export const useOfflineSupport = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [wasOffline, setWasOffline] = useState(false)
  const [syncQueue, setSyncQueue] = useState(() => {
    const saved = localStorage.getItem('myku_sync_queue')
    return saved ? JSON.parse(saved) : []
  })

  // 监听网络状态
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setWasOffline(true)
      // 网络恢复后自动同步
      processSyncQueue()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // 保存同步队列
  useEffect(() => {
    localStorage.setItem('myku_sync_queue', JSON.stringify(syncQueue))
  }, [syncQueue])

  // 添加到同步队列
  const addToSyncQueue = useCallback((action) => {
    const syncItem = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action,
      retries: 0,
    }
    setSyncQueue(prev => [...prev, syncItem])
  }, [])

  // 处理同步队列
  const processSyncQueue = useCallback(async () => {
    if (!isOnline || syncQueue.length === 0) return

    const failedItems = []

    for (const item of syncQueue) {
      try {
        // 尝试执行同步操作
        await executeSyncAction(item.action)
      } catch (error) {
        if (item.retries < 3) {
          failedItems.push({ ...item, retries: item.retries + 1 })
        }
      }
    }

    setSyncQueue(failedItems)
  }, [isOnline, syncQueue])

  // 执行同步操作
  const executeSyncAction = async (action) => {
    // 这里根据 action 类型执行相应的 API 调用
    console.log('Syncing action:', action)
    // 模拟 API 调用
    return new Promise((resolve) => setTimeout(resolve, 100))
  }

  // 保存离线数据
  const saveOfflineData = useCallback((key, data) => {
    const offlineData = {
      timestamp: new Date().toISOString(),
      data,
    }
    localStorage.setItem(`myku_offline_${key}`, JSON.stringify(offlineData))
  }, [])

  // 获取离线数据
  const getOfflineData = useCallback((key) => {
    const saved = localStorage.getItem(`myku_offline_${key}`)
    if (saved) {
      const { data } = JSON.parse(saved)
      return data
    }
    return null
  }, [])

  return {
    isOnline,
    wasOffline,
    syncQueue,
    addToSyncQueue,
    processSyncQueue,
    saveOfflineData,
    getOfflineData,
  }
}

export default useOfflineSupport
