import { useState, useEffect, useCallback } from 'react'

/**
 * 优化的 localStorage hook
 * - 使用 try-catch 处理错误
 * - 支持 SSR
 * - 防抖写入
 */
export function useLocalStorage(key, initialValue) {
  // 获取初始值
  const getStoredValue = useCallback(() => {
    if (typeof window === 'undefined') return initialValue
    
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  }, [key, initialValue])

  const [storedValue, setStoredValue] = useState(getStoredValue)
  const [isLoaded, setIsLoaded] = useState(false)

  // 初始加载
  useEffect(() => {
    setStoredValue(getStoredValue())
    setIsLoaded(true)
  }, [getStoredValue])

  // 防抖写入 localStorage
  useEffect(() => {
    if (!isLoaded) return
    
    const timeoutId = setTimeout(() => {
      try {
        window.localStorage.setItem(key, JSON.stringify(storedValue))
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error)
      }
    }, 300) // 300ms 防抖

    return () => clearTimeout(timeoutId)
  }, [key, storedValue, isLoaded])

  // 监听其他标签页的更改
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue))
        } catch {
          setStoredValue(e.newValue)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key])

  return [storedValue, setStoredValue, isLoaded]
}

/**
 * 批量更新多个 localStorage 项
 */
export function useLocalStorageBatch(updates) {
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        Object.entries(updates).forEach(([key, value]) => {
          window.localStorage.setItem(key, JSON.stringify(value))
        })
      } catch (error) {
        console.warn('Error batch updating localStorage:', error)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [updates])
}

/**
 * 安全的 localStorage 操作
 */
export const storage = {
  get: (key, defaultValue = null) => {
    if (typeof window === 'undefined') return defaultValue
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  },
  
  set: (key, value) => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  },
  
  remove: (key) => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.removeItem(key)
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error)
    }
  },
  
  clear: () => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.clear()
    } catch (error) {
      console.warn('Error clearing localStorage:', error)
    }
  }
}
