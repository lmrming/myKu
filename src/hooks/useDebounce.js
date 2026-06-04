import { useState, useEffect } from 'react'

/**
 * 防抖 hook
 * @param value 需要防抖的值
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的值
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * 防抖函数 hook
 * @param callback 需要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function useDebouncedCallback(callback, delay = 300) {
  const [timeoutId, setTimeoutId] = useState(null)

  const debouncedCallback = (...args) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    const newTimeoutId = setTimeout(() => {
      callback(...args)
    }, delay)

    setTimeoutId(newTimeoutId)
  }

  // 清理函数
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [timeoutId])

  return debouncedCallback
}

/**
 * 节流 hook
 * @param value 需要节流的值
 * @param delay 延迟时间（毫秒）
 * @returns 节流后的值
 */
export function useThrottle(value, delay = 300) {
  const [throttledValue, setThrottledValue] = useState(value)
  const [lastExecuted, setLastExecuted] = useState(Date.now())

  useEffect(() => {
    const now = Date.now()
    const timeElapsed = now - lastExecuted

    if (timeElapsed >= delay) {
      setThrottledValue(value)
      setLastExecuted(now)
    } else {
      const timeoutId = setTimeout(() => {
        setThrottledValue(value)
        setLastExecuted(Date.now())
      }, delay - timeElapsed)

      return () => clearTimeout(timeoutId)
    }
  }, [value, delay, lastExecuted])

  return throttledValue
}
