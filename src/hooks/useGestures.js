import { useState, useEffect, useCallback, useRef } from 'react'

// 手势 Hook
export const useGestures = (elementRef, options = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    onLongPress,
    onPullDown,
    threshold = 50,
    longPressDelay = 500,
  } = options

  const [gesture, setGesture] = useState(null)
  const touchStart = useRef({ x: 0, y: 0, time: 0 })
  const touchEnd = useRef({ x: 0, y: 0, time: 0 })
  const longPressTimer = useRef(null)
  const isLongPress = useRef(false)
  const pullDownStart = useRef(0)

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0]
    touchStart.current = { x: touch.clientX, y: touch.clientY, time: Date.now() }
    touchEnd.current = { x: touch.clientX, y: touch.clientY, time: Date.now() }
    isLongPress.current = false

    // 记录下拉刷新起始位置
    if (elementRef.current && elementRef.current.scrollTop === 0) {
      pullDownStart.current = touch.clientY
    }

    // 长按检测
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        isLongPress.current = true
        onLongPress(e)
      }, longPressDelay)
    }
  }, [onLongPress, longPressDelay, elementRef])

  const handleTouchMove = useCallback((e) => {
    const touch = e.touches[0]
    touchEnd.current = { x: touch.clientX, y: touch.clientY, time: Date.now() }

    // 取消长按
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }

    // 下拉刷新检测
    if (onPullDown && elementRef.current) {
      const scrollTop = elementRef.current.scrollTop
      if (scrollTop === 0) {
        const pullDistance = touch.clientY - pullDownStart.current
        if (pullDistance > 0) {
          setGesture({ type: 'pullDown', distance: pullDistance })
        }
      }
    }
  }, [onPullDown, elementRef])

  const handleTouchEnd = useCallback((e) => {
    // 清除长按定时器
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }

    // 如果是长按，不处理其他手势
    if (isLongPress.current) return

    const startX = touchStart.current.x
    const startY = touchStart.current.y
    const endX = touchEnd.current.x
    const endY = touchEnd.current.y
    const startTime = touchStart.current.time
    const endTime = touchEnd.current.time

    const diffX = endX - startX
    const diffY = endY - startY
    const diffTime = endTime - startTime

    // 点击检测
    if (Math.abs(diffX) < 10 && Math.abs(diffY) < 10 && diffTime < 200) {
      setGesture({ type: 'tap' })
      onTap?.(e)
      return
    }

    // 下拉刷新完成检测
    if (gesture?.type === 'pullDown' && gesture.distance > threshold) {
      onPullDown?.()
      setGesture(null)
      return
    }

    // 滑动手势检测
    const absX = Math.abs(diffX)
    const absY = Math.abs(diffY)

    if (Math.max(absX, absY) > threshold) {
      if (absX > absY) {
        // 水平滑动
        if (diffX > 0) {
          setGesture({ type: 'swipeRight', distance: absX })
          onSwipeRight?.(e)
        } else {
          setGesture({ type: 'swipeLeft', distance: absX })
          onSwipeLeft?.(e)
        }
      } else {
        // 垂直滑动
        if (diffY > 0) {
          setGesture({ type: 'swipeDown', distance: absY })
          onSwipeDown?.(e)
        } else {
          setGesture({ type: 'swipeUp', distance: absY })
          onSwipeUp?.(e)
        }
      }
    }
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onTap, onPullDown, threshold, gesture])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [elementRef, handleTouchStart, handleTouchMove, handleTouchEnd])

  return gesture
}

// 滑动删除 Hook
export const useSwipeToDelete = (elementRef, onDelete, threshold = 100) => {
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const startX = useRef(0)
  const currentX = useRef(0)

  const handleTouchStart = useCallback((e) => {
    startX.current = e.touches[0].clientX
    currentX.current = e.touches[0].clientX
    setIsSwiping(true)
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (!isSwiping) return
    currentX.current = e.touches[0].clientX
    const diff = currentX.current - startX.current
    
    // 只允许向左滑动
    if (diff < 0) {
      setSwipeOffset(Math.max(diff, -threshold * 1.5))
    }
  }, [isSwiping, threshold])

  const handleTouchEnd = useCallback(() => {
    setIsSwiping(false)
    const diff = currentX.current - startX.current

    if (diff < -threshold) {
      // 滑动距离超过阈值，触发删除
      setSwipeOffset(-threshold * 1.5)
      setTimeout(() => {
        onDelete?.()
        setSwipeOffset(0)
      }, 200)
    } else {
      // 滑动距离不足，恢复原位
      setSwipeOffset(0)
    }
  }, [onDelete, threshold])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [elementRef, handleTouchStart, handleTouchMove, handleTouchEnd])

  return { swipeOffset, isSwiping }
}

// 下拉刷新 Hook
export const usePullToRefresh = (elementRef, onRefresh, threshold = 80) => {
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startY = useRef(0)
  const currentY = useRef(0)

  const handleTouchStart = useCallback((e) => {
    const element = elementRef.current
    if (!element || element.scrollTop > 0) return

    startY.current = e.touches[0].clientY
    currentY.current = e.touches[0].clientY
    setIsPulling(true)
  }, [elementRef])

  const handleTouchMove = useCallback((e) => {
    if (!isPulling || isRefreshing) return

    const element = elementRef.current
    if (!element || element.scrollTop > 0) {
      setIsPulling(false)
      setPullDistance(0)
      return
    }

    currentY.current = e.touches[0].clientY
    const diff = currentY.current - startY.current

    if (diff > 0) {
      // 使用阻尼效果
      const dampedDistance = Math.min(diff * 0.5, threshold * 1.5)
      setPullDistance(dampedDistance)
    }
  }, [isPulling, isRefreshing, elementRef, threshold])

  const handleTouchEnd = useCallback(async () => {
    setIsPulling(false)

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      setPullDistance(threshold)

      try {
        await onRefresh?.()
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      setPullDistance(0)
    }
  }, [pullDistance, threshold, isRefreshing, onRefresh])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [elementRef, handleTouchStart, handleTouchMove, handleTouchEnd])

  return { pullDistance, isPulling, isRefreshing }
}

// 双击 Hook
export const useDoubleTap = (elementRef, onDoubleTap, delay = 300) => {
  const [tapCount, setTapCount] = useState(0)
  const tapTimer = useRef(null)

  const handleTap = useCallback(() => {
    setTapCount(prev => prev + 1)

    if (tapCount === 1) {
      // 第二次点击，触发双击
      onDoubleTap?.()
      setTapCount(0)
      if (tapTimer.current) {
        clearTimeout(tapTimer.current)
        tapTimer.current = null
      }
    } else {
      // 第一次点击，启动定时器
      tapTimer.current = setTimeout(() => {
        setTapCount(0)
      }, delay)
    }
  }, [tapCount, onDoubleTap, delay])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    element.addEventListener('click', handleTap)

    return () => {
      element.removeEventListener('click', handleTap)
      if (tapTimer.current) {
        clearTimeout(tapTimer.current)
      }
    }
  }, [elementRef, handleTap])

  return tapCount === 1
}

export default {
  useGestures,
  useSwipeToDelete,
  usePullToRefresh,
  useDoubleTap,
}
