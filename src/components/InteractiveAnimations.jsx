import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

// 3D 倾斜卡片效果
export const TiltCard = ({ children, className = '', tiltAmount = 10 }) => {
  const ref = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const rotateX = useTransform(y, [-0.5, 0.5], [tiltAmount, -tiltAmount])
  const rotateY = useTransform(x, [-0.5, 0.5], [-tiltAmount, tiltAmount])
  
  const springConfig = { damping: 20, stiffness: 300 }
  const rotateXSpring = useSpring(rotateX, springConfig)
  const rotateYSpring = useSpring(rotateY, springConfig)
  
  const handleMouseMove = useCallback((e) => {
    if (!ref.current) return
    
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    const mouseX = (e.clientX - centerX) / (rect.width / 2)
    const mouseY = (e.clientY - centerY) / (rect.height / 2)
    
    x.set(mouseX * 0.5)
    y.set(mouseY * 0.5)
  }, [x, y])
  
  const handleMouseLeave = useCallback(() => {
    x.set(0)
    y.set(0)
  }, [x, y])
  
  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        rotateX: rotateXSpring,
        rotateY: rotateYSpring,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  )
}

// 水波纹按钮效果
export const RippleButton = ({ children, onClick, className = '', ...props }) => {
  const [ripples, setRipples] = useState([])
  const buttonRef = useRef(null)
  
  const handleClick = useCallback((e) => {
    const button = buttonRef.current
    if (!button) return
    
    const rect = button.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const newRipple = {
      id: Date.now(),
      x,
      y,
    }
    
    setRipples(prev => [...prev, newRipple])
    
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id))
    }, 600)
    
    onClick?.(e)
  }, [onClick])
  
  return (
    <button
      ref={buttonRef}
      className={`relative overflow-hidden ${className}`}
      onClick={handleClick}
      {...props}
    >
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
          }}
          initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 0.8 }}
          animate={{ 
            width: 400, 
            height: 400, 
            x: -200, 
            y: -200, 
            opacity: 0 
          }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ))}
      {children}
    </button>
  )
}

// 页面切换过渡动画
export const PageTransition = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.98 }}
      transition={{ 
        duration: 0.4, 
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {children}
    </motion.div>
  )
}

// 滚动视差效果
export const ParallaxContainer = ({ children, speed = 0.5 }) => {
  const [offsetY, setOffsetY] = useState(0)
  const ref = useRef(null)
  
  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const scrolled = window.scrollY
      const elementTop = rect.top + scrolled
      const relativeScroll = scrolled - elementTop + window.innerHeight
      
      setOffsetY(relativeScroll * speed * 0.1)
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [speed])
  
  return (
    <div ref={ref} className="relative overflow-hidden">
      <motion.div
        style={{ y: offsetY }}
        transition={{ type: 'tween', ease: 'linear' }}
      >
        {children}
      </motion.div>
    </div>
  )
}

// 淡入动画包装器
export const FadeIn = ({ 
  children, 
  delay = 0, 
  duration = 0.5, 
  direction = 'up',
  className = '' 
}) => {
  const directions = {
    up: { y: 30 },
    down: { y: -30 },
    left: { x: 30 },
    right: { x: -30 },
    none: {},
  }
  
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...directions[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ 
        duration, 
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {children}
    </motion.div>
  )
}

// 交错动画容器
export const StaggerContainer = ({ 
  children, 
  staggerDelay = 0.1,
  className = '' 
}) => {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

// 交错动画子项
export const StaggerItem = ({ children, className = '' }) => {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: {
            duration: 0.5,
            ease: [0.25, 0.46, 0.45, 0.94],
          },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

// 脉冲动画
export const Pulse = ({ children, className = '' }) => {
  return (
    <motion.div
      className={className}
      animate={{
        scale: [1, 1.05, 1],
        opacity: [1, 0.8, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  )
}

// 悬浮动画
export const Float = ({ 
  children, 
  className = '',
  amplitude = 10,
  duration = 3 
}) => {
  return (
    <motion.div
      className={className}
      animate={{
        y: [-amplitude, amplitude, -amplitude],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  )
}

// 呼吸动画
export const Breathe = ({ children, className = '' }) => {
  return (
    <motion.div
      className={className}
      animate={{
        scale: [1, 1.02, 1],
        opacity: [1, 0.9, 1],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  )
}

// 震动动画
export const Shake = ({ children, className = '', trigger = false }) => {
  return (
    <motion.div
      className={className}
      animate={trigger ? {
        x: [-5, 5, -5, 5, 0],
      } : {}}
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.div>
  )
}

// 旋转动画
export const Spin = ({ children, className = '', duration = 2 }) => {
  return (
    <motion.div
      className={className}
      animate={{ rotate: 360 }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      {children}
    </motion.div>
  )
}

// 计数动画
export const CountUp = ({ 
  end, 
  duration = 2, 
  className = '',
  suffix = '' 
}) => {
  const [count, setCount] = useState(0)
  const countRef = useRef(null)
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let startTime = null
          const animate = (timestamp) => {
            if (!startTime) startTime = timestamp
            const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)
            
            // 使用 easeOutQuart 缓动
            const easeProgress = 1 - Math.pow(1 - progress, 4)
            setCount(Math.floor(easeProgress * end))
            
            if (progress < 1) {
              requestAnimationFrame(animate)
            }
          }
          requestAnimationFrame(animate)
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )
    
    if (countRef.current) {
      observer.observe(countRef.current)
    }
    
    return () => observer.disconnect()
  }, [end, duration])
  
  return (
    <span ref={countRef} className={className}>
      {count}{suffix}
    </span>
  )
}

export default {
  TiltCard,
  RippleButton,
  PageTransition,
  ParallaxContainer,
  FadeIn,
  StaggerContainer,
  StaggerItem,
  Pulse,
  Float,
  Breathe,
  Shake,
  Spin,
  CountUp,
}
