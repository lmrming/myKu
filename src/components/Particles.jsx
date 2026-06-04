import React, { useEffect, useRef, useCallback } from 'react'

// 粒子背景组件
const Particles = ({ 
  particleCount = 50,
  color = 'rgba(100, 149, 237, 0.5)',
  speed = 0.5,
  connectParticles = true
}) => {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const animationRef = useRef(null)
  const mouseRef = useRef({ x: 0, y: 0 })

  // 初始化粒子
  const initParticles = useCallback((width, height) => {
    particlesRef.current = []
    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        radius: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2
      })
    }
  }, [particleCount, speed])

  // 绘制粒子
  const drawParticles = useCallback((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height)
    
    const particles = particlesRef.current
    
    // 更新和绘制粒子
    particles.forEach((particle, i) => {
      // 更新位置
      particle.x += particle.vx
      particle.y += particle.vy
      
      // 边界检测
      if (particle.x < 0 || particle.x > width) particle.vx *= -1
      if (particle.y < 0 || particle.y > height) particle.vy *= -1
      
      // 鼠标交互
      const dx = mouseRef.current.x - particle.x
      const dy = mouseRef.current.y - particle.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < 100) {
        const force = (100 - distance) / 100
        particle.vx -= (dx / distance) * force * 0.02
        particle.vy -= (dy / distance) * force * 0.02
      }
      
      // 绘制粒子
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
      ctx.fillStyle = color.replace('0.5', particle.opacity.toString())
      ctx.fill()
      
      // 连接粒子
      if (connectParticles) {
        for (let j = i + 1; j < particles.length; j++) {
          const other = particles[j]
          const dx = particle.x - other.x
          const dy = particle.y - other.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          
          if (dist < 100) {
            ctx.beginPath()
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(other.x, other.y)
            ctx.strokeStyle = color.replace('0.5', ((1 - dist / 100) * 0.2).toString())
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
    })
  }, [color, connectParticles])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let width = window.innerWidth
    let height = window.innerHeight

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
      initParticles(width, height)
    }

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', handleMouseMove)

    const animate = () => {
      drawParticles(ctx, width, height)
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [initParticles, drawParticles])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  )
}

export default Particles
