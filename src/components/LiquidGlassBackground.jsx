import React, { useEffect, useRef, useCallback, memo } from 'react'
import { motion } from 'framer-motion'

// 液态玻璃球组件 - 优化版
const LiquidGlassOrb = memo(({ color, size, x, y, duration, delay }) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={{
      width: size,
      height: size,
      left: x,
      top: y,
      background: `radial-gradient(circle at 30% 30%, ${color}30, ${color}15, transparent)`,
      backdropFilter: 'blur(40px)',
      WebkitBackdropFilter: 'blur(40px)',
      boxShadow: `inset 0 0 30px ${color}20, 0 0 60px ${color}15`,
      willChange: 'transform, opacity',
      transform: 'translateZ(0)',
    }}
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{
      scale: [1, 1.05, 0.98, 1],
      opacity: [0.4, 0.6, 0.4, 0.5],
      x: [0, 20, -10, 0],
      y: [0, -20, 10, 0],
    }}
    transition={{
      duration: duration,
      delay: delay,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  />
))

LiquidGlassOrb.displayName = 'LiquidGlassOrb'

// 玻璃网格 - 极简版 (降低更新频率)
const GlassGrid = memo(() => {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const frameCount = useRef(0)
  const isActive = useRef(true)

  const draw = useCallback((ctx, width, height) => {
    if (!isActive.current) return
    
    // 每 3 帧绘制一次 (20fps)
    frameCount.current++
    if (frameCount.current % 3 !== 0) {
      animationRef.current = requestAnimationFrame(() => draw(ctx, width, height))
      return
    }
    
    ctx.clearRect(0, 0, width, height)
    
    const gridSize = 100 // 更大的间距
    const cols = Math.ceil(width / gridSize) + 1
    const rows = Math.ceil(height / gridSize) + 1
    const time = Date.now() * 0.0003 // 更慢的时间
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = i * gridSize + Math.sin(i * 0.3 + time) * 5
        const y = j * gridSize + Math.cos(j * 0.3 + time) * 5
        
        ctx.beginPath()
        ctx.arc(x, y, 2, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    
    animationRef.current = requestAnimationFrame(() => draw(ctx, width, height))
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    let width = window.innerWidth
    let height = window.innerHeight

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      const dpr = Math.min(window.devicePixelRatio, 1.5)
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = width + 'px'
      canvas.style.height = height + 'px'
      ctx.scale(dpr, dpr)
    }

    // 使用 IntersectionObserver 优化 - 页面不可见时停止动画
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isActive.current = entry.isIntersecting
        if (isActive.current && !animationRef.current) {
          animationRef.current = requestAnimationFrame(() => draw(ctx, width, height))
        }
      })
    })

    resize()
    window.addEventListener('resize', resize, { passive: true })
    observer.observe(canvas)
    
    animationRef.current = requestAnimationFrame(() => draw(ctx, width, height))

    return () => {
      window.removeEventListener('resize', resize)
      observer.disconnect()
      isActive.current = false
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.4, mixBlendMode: 'overlay' }}
    />
  )
})

GlassGrid.displayName = 'GlassGrid'

// 液态玻璃流动效果 - 极简版
const LiquidFlow = memo(() => {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const particlesRef = useRef([])
  const frameCount = useRef(0)
  const isActive = useRef(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    let width = window.innerWidth
    let height = window.innerHeight

    // 减少粒子数量到 6 个
    const initParticles = () => {
      particlesRef.current = []
      const colors = ['#60a5fa', '#a78bfa', '#34d399']
      for (let i = 0; i < 6; i++) {
        particlesRef.current.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
          radius: Math.random() * 60 + 40,
          color: colors[i % colors.length],
          opacity: Math.random() * 0.08 + 0.04,
        })
      }
    }

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      const dpr = Math.min(window.devicePixelRatio, 1.5)
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = width + 'px'
      canvas.style.height = height + 'px'
      ctx.scale(dpr, dpr)
      initParticles()
    }

    const animate = () => {
      if (!isActive.current) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }
      
      // 每 2 帧更新一次 (30fps)
      frameCount.current++
      const shouldUpdate = frameCount.current % 2 === 0
      
      ctx.clearRect(0, 0, width, height)

      particlesRef.current.forEach(particle => {
        if (shouldUpdate) {
          particle.x += particle.vx
          particle.y += particle.vy

          if (particle.x < -particle.radius) particle.x = width + particle.radius
          if (particle.x > width + particle.radius) particle.x = -particle.radius
          if (particle.y < -particle.radius) particle.y = height + particle.radius
          if (particle.y > height + particle.radius) particle.y = -particle.radius
        }

        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        ctx.fillStyle = particle.color + Math.floor(particle.opacity * 255).toString(16).padStart(2, '0')
        ctx.fill()
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    // 使用 IntersectionObserver
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isActive.current = entry.isIntersecting
      })
    })

    resize()
    window.addEventListener('resize', resize, { passive: true })
    observer.observe(canvas)
    
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', resize)
      observer.disconnect()
      isActive.current = false
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ 
        opacity: 0.5,
        filter: 'blur(20px)',
        mixBlendMode: 'screen',
      }}
    />
  )
})

LiquidFlow.displayName = 'LiquidFlow'

// 玻璃气泡效果 - 优化版
const GlassBubbles = memo(() => {
  const bubbles = [
    { size: 200, x: '10%', y: '20%', color: '#60a5fa', duration: 30, delay: 0 },
    { size: 280, x: '70%', y: '60%', color: '#a78bfa', duration: 35, delay: 2 },
    { size: 180, x: '80%', y: '10%', color: '#fbbf24', duration: 28, delay: 1 },
  ]

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {bubbles.map((bubble, index) => (
        <LiquidGlassOrb key={index} {...bubble} />
      ))}
    </div>
  )
})

GlassBubbles.displayName = 'GlassBubbles'

// 主组件 - 优化版
const LiquidGlassBackground = memo(({
  enableOrbs = true,
  enableGrid = true,
  enableFlow = true,
}) => {
  return (
    <>
      {/* 基础渐变背景 */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 50%, rgba(255, 255, 255, 0.05) 100%)',
        }}
      />
      
      {enableFlow && <LiquidFlow />}
      {enableOrbs && <GlassBubbles />}
      {enableGrid && <GlassGrid />}
    </>
  )
})

LiquidGlassBackground.displayName = 'LiquidGlassBackground'

export default LiquidGlassBackground
