import React, { useEffect, useState, useRef } from 'react'
import { useInView, motion } from 'framer-motion'

// 数字滚动动画组件
const AnimatedNumber = ({ 
  value, 
  duration = 2, 
  prefix = '', 
  suffix = '',
  decimals = 0,
  className = ''
}) => {
  const [displayValue, setDisplayValue] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!isInView || hasAnimated.current) return
    hasAnimated.current = true

    const startTime = Date.now()
    const startValue = 0
    const endValue = value

    const animate = () => {
      const now = Date.now()
      const progress = Math.min((now - startTime) / (duration * 1000), 1)
      
      // 使用 easeOutExpo 缓动函数
      const easeOutExpo = 1 - Math.pow(2, -10 * progress)
      const currentValue = startValue + (endValue - startValue) * easeOutExpo
      
      setDisplayValue(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setDisplayValue(endValue)
      }
    }

    requestAnimationFrame(animate)
  }, [isInView, value, duration])

  const formattedValue = decimals > 0 
    ? displayValue.toFixed(decimals)
    : Math.round(displayValue).toLocaleString()

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
    >
      {prefix}{formattedValue}{suffix}
    </motion.span>
  )
}

// 计数器卡片组件
export const CounterCard = ({ 
  icon: Icon, 
  label, 
  value, 
  suffix = '',
  color = 'blue',
  delay = 0 
}) => {
  const colors = {
    blue: 'from-blue-500/20 to-cyan-500/20 text-blue-500',
    purple: 'from-purple-500/20 to-pink-500/20 text-purple-500',
    emerald: 'from-emerald-500/20 to-teal-500/20 text-emerald-500',
    amber: 'from-amber-500/20 to-orange-500/20 text-amber-500',
    rose: 'from-rose-500/20 to-red-500/20 text-rose-500'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="relative overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6"
    >
      {/* 背景渐变 */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors[color]} opacity-0 group-hover:opacity-100 transition-opacity`} />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
        
        <div className="text-4xl font-bold text-[var(--color-text-primary)] mb-1">
          <AnimatedNumber value={value} suffix={suffix} />
        </div>
        
        <p className="text-[var(--color-text-secondary)]">{label}</p>
      </div>
    </motion.div>
  )
}

export default AnimatedNumber
