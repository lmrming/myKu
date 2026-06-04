import React, { Suspense } from 'react'
import { motion } from 'framer-motion'

/**
 * 加载占位符
 */
const LoadingPlaceholder = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="min-h-[200px] flex items-center justify-center"
  >
    <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
  </motion.div>
)

/**
 * 懒加载包装器
 * @param Component 需要懒加载的组件
 * @param fallback 自定义加载占位符
 */
export function lazyLoad(Component, fallback = <LoadingPlaceholder />) {
  const LazyComponent = React.lazy(Component)
  
  return function WrappedComponent(props) {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }
}

/**
 * 图片懒加载组件
 */
export function LazyImage({ src, alt, className, ...props }) {
  const [isLoaded, setIsLoaded] = React.useState(false)
  const [error, setError] = React.useState(false)

  return (
    <div className={`relative ${className}`}>
      {!isLoaded && !error && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg" />
      )}
      
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <span className="text-gray-400 text-sm">加载失败</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setError(true)}
          {...props}
        />
      )}
    </div>
  )
}

/**
 * 虚拟列表组件（用于长列表优化）
 */
export function VirtualList({ items, renderItem, itemHeight = 50, overscan = 5 }) {
  const containerRef = React.useRef(null)
  const [scrollTop, setScrollTop] = React.useState(0)
  const [containerHeight, setContainerHeight] = React.useState(0)

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => setScrollTop(container.scrollTop)
    const handleResize = () => setContainerHeight(container.clientHeight)

    handleResize()
    container.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleResize)

    return () => {
      container.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const totalHeight = items.length * itemHeight
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  const visibleItems = items.slice(startIndex, endIndex + 1)
  const offsetY = startIndex * itemHeight

  return (
    <div ref={containerRef} className="overflow-auto h-full">
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default lazyLoad
