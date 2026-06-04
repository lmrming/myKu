import { useEffect, useRef, useCallback, useState } from 'react'

/**
 * 性能监控 hook
 * 用于监控组件渲染性能和内存使用
 */
export function usePerformanceMonitor(componentName) {
  const renderCount = useRef(0)
  const lastRenderTime = useRef(performance.now())

  useEffect(() => {
    renderCount.current += 1
    const currentTime = performance.now()
    const renderDuration = currentTime - lastRenderTime.current
    
    if (renderCount.current > 1) {
      console.log(`[Performance] ${componentName} rendered #${renderCount.current} in ${renderDuration.toFixed(2)}ms`)
    }
    
    lastRenderTime.current = currentTime
  })

  return {
    renderCount: renderCount.current,
    reset: () => {
      renderCount.current = 0
      lastRenderTime.current = performance.now()
    }
  }
}

/**
 * 测量函数执行时间
 */
export function useMeasureTiming() {
  return useCallback((fn, label = 'Function') => {
    const start = performance.now()
    const result = fn()
    const end = performance.now()
    console.log(`[Timing] ${label} took ${(end - start).toFixed(2)}ms`)
    return result
  }, [])
}

/**
 * 使用 RAF 进行节流
 * 用于优化高频更新（如滚动、resize）
 */
export function useRafThrottle(callback) {
  const rafId = useRef(null)
  const latestArgs = useRef([])

  const throttled = useCallback((...args) => {
    latestArgs.current = args

    if (rafId.current === null) {
      rafId.current = requestAnimationFrame(() => {
        callback(...latestArgs.current)
        rafId.current = null
      })
    }
  }, [callback])

  useEffect(() => {
    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current)
      }
    }
  }, [])

  return throttled
}

/**
 * 使用 Intersection Observer 进行懒加载
 */
export function useIntersectionObserver(options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasIntersected, setHasIntersected] = useState(false)
  const elementRef = useRef(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
      if (entry.isIntersecting && !hasIntersected) {
        setHasIntersected(true)
      }
    }, {
      threshold: 0.1,
      ...options
    })

    observer.observe(element)

    return () => observer.disconnect()
  }, [hasIntersected, options])

  return { ref: elementRef, isIntersecting, hasIntersected }
}
