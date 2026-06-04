import React from 'react'
import { motion } from 'framer-motion'

// 加载动画组件
const LoadingSpinner = ({ size = 40, color = 'var(--color-primary)' }) => {
  return (
    <div className="flex items-center justify-center">
      <motion.div
        className="relative"
        style={{ width: size, height: size }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 40 40"
          fill="none"
        >
          <motion.circle
            cx="20"
            cy="20"
            r="18"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="80 120"
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
        </svg>
      </motion.div>
    </div>
  )
}

// 脉冲加载
export const PulseLoader = ({ size = 12, color = 'var(--color-primary)' }) => {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="rounded-full"
          style={{ 
            width: size, 
            height: size, 
            backgroundColor: color 
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  )
}

// 骨架屏
export const Skeleton = ({ width = '100%', height = 20, className = '' }) => {
  return (
    <motion.div
      className={`bg-[var(--color-bg-secondary)] rounded-lg overflow-hidden ${className}`}
      style={{ width, height }}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div className="w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
    </motion.div>
  )
}

// 页面加载遮罩
export const PageLoader = ({ isLoading }) => {
  if (!isLoading) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg-primary)]/80 backdrop-blur-sm"
    >
      <div className="text-center">
        <LoadingSpinner size={60} />
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-[var(--color-text-secondary)]"
        >
          加载中...
        </motion.p>
      </div>
    </motion.div>
  )
}

// 进度条
export const ProgressBar = ({ progress, className = '' }) => {
  return (
    <div className={`w-full h-2 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden ${className}`}>
      <motion.div
        className="h-full bg-[var(--color-primary)] rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </div>
  )
}

export default LoadingSpinner
