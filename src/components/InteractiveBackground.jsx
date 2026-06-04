import React, { useEffect, useRef, useCallback, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

// 浮动渐变球组件
const FloatingOrbs = () => {
  const orbs = [
    { color: 'from-blue-400/20 to-cyan-400/20', size: 300, x: '10%', y: '20%', duration: 20 },
    { color: 'from-purple-400/20 to-pink-400/20', size: 400, x: '70%', y: '60%', duration: 25 },
    { color: 'from-orange-400/20 to-yellow-400/20', size: 250, x: '80%', y: '10%', duration: 18 },
    { color: 'from-green-400/20 to-emerald-400/20', size: 350, x: '30%', y: '70%', duration: 22 },
  ]

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {orbs.map((orb, index) => (
        <motion.div
          key={index}
          className={`absolute rounded-full bg-gradient-to-br ${orb.color} blur-3xl`}
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
          }}
          animate={{
            x: [0, 50, -30, 0],
            y: [0, -40, 30, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// 网格波浪效果
const GridWave = () => {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const timeRef = useRef(0)

  const draw = useCallback((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height)
    
    const gridSize = 40
    const cols = Math.ceil(width / gridSize) + 1
    const rows = Math.ceil(height / gridSize) + 1
    
    timeRef.current += 0.01
    
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = i * gridSize
        const y = j * gridSize
        
        // 计算与鼠标的距离
        const dx = mouseRef.current.x - x
        const dy = mouseRef.current.y - y
        const dist = Math.sqrt(dx * dx + dy * dy)
        
        // 波浪效果
        const wave = Math.sin(i * 0.3 + timeRef.current) * Math.cos(j * 0.3 + timeRef.current) * 5
        const mouseEffect = Math.max(0, 1 - dist / 200) * 15
        
        const size = 2 + wave + mouseEffect
        const opacity = 0.1 + Math.max(0, 1 - dist / 300) * 0.2
        
        ctx.beginPath()
        ctx.arc(x, y, Math.max(0, size), 0, Math.PI * 2)
        ctx.fillStyle = `rgba(100, 116, 139, ${opacity})`
        ctx.fill()
      }
    }
  }, [])

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
    }

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', handleMouseMove)

    const animate = () => {
      draw(ctx, width, height)
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
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.5 }}
    />
  )
}

// 鼠标轨迹效果
const MouseTrail = () => {
  const canvasRef = useRef(null)
  const pointsRef = useRef([])
  const animationRef = useRef(null)
  const mouseRef = useRef({ x: 0, y: 0 })

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
    }

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
      pointsRef.current.push({
        x: e.clientX,
        y: e.clientY,
        age: 0,
      })
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', handleMouseMove)

    const animate = () => {
      ctx.clearRect(0, 0, width, height)
      
      // 更新点的年龄
      pointsRef.current = pointsRef.current.filter(point => {
        point.age += 1
        return point.age < 50
      })

      // 绘制轨迹
      if (pointsRef.current.length > 1) {
        ctx.beginPath()
        ctx.moveTo(pointsRef.current[0].x, pointsRef.current[0].y)
        
        for (let i = 1; i < pointsRef.current.length; i++) {
          const point = pointsRef.current[i]
          const prevPoint = pointsRef.current[i - 1]
          
          const cx = (prevPoint.x + point.x) / 2
          const cy = (prevPoint.y + point.y) / 2
          
          ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, cx, cy)
        }
        
        // 创建渐变
        const gradient = ctx.createLinearGradient(
          pointsRef.current[0].x,
          pointsRef.current[0].y,
          pointsRef.current[pointsRef.current.length - 1].x,
          pointsRef.current[pointsRef.current.length - 1].y
        )
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0)')
        gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.3)')
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)')
        
        ctx.strokeStyle = gradient
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.stroke()
      }

      // 绘制点
      pointsRef.current.forEach((point, index) => {
        const opacity = 1 - point.age / 50
        const size = (1 - point.age / 50) * 6
        
        ctx.beginPath()
        ctx.arc(point.x, point.y, size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(59, 130, 246, ${opacity * 0.5})`
        ctx.fill()
      })

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
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
    />
  )
}

// 连接线效果
const ConnectionLines = () => {
  const canvasRef = useRef(null)
  const nodesRef = useRef([])
  const animationRef = useRef(null)
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let width = window.innerWidth
    let height = window.innerHeight

    // 初始化节点
    const initNodes = () => {
      nodesRef.current = []
      const nodeCount = Math.floor((width * height) / 40000)
      for (let i = 0; i < nodeCount; i++) {
        nodesRef.current.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 2 + 1,
        })
      }
    }

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
      initNodes()
    }

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', handleMouseMove)

    const animate = () => {
      ctx.clearRect(0, 0, width, height)

      const nodes = nodesRef.current

      // 更新节点位置
      nodes.forEach(node => {
        node.x += node.vx
        node.y += node.vy

        // 边界反弹
        if (node.x < 0 || node.x > width) node.vx *= -1
        if (node.y < 0 || node.y > height) node.vy *= -1

        // 鼠标吸引
        const dx = mouseRef.current.x - node.x
        const dy = mouseRef.current.y - node.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        
        if (dist < 150) {
          node.vx += dx * 0.0001
          node.vy += dy * 0.0001
        }

        // 速度限制
        const maxSpeed = 1
        const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy)
        if (speed > maxSpeed) {
          node.vx = (node.vx / speed) * maxSpeed
          node.vy = (node.vy / speed) * maxSpeed
        }
      })

      // 绘制连接线
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 120) {
            const opacity = (1 - dist / 120) * 0.2
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.strokeStyle = `rgba(148, 163, 184, ${opacity})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }

        // 绘制节点
        ctx.beginPath()
        ctx.arc(nodes[i].x, nodes[i].y, nodes[i].radius, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(148, 163, 184, 0.4)'
        ctx.fill()
      }

      // 绘制鼠标连接线
      nodes.forEach(node => {
        const dx = mouseRef.current.x - node.x
        const dy = mouseRef.current.y - node.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < 150) {
          const opacity = (1 - dist / 150) * 0.3
          ctx.beginPath()
          ctx.moveTo(node.x, node.y)
          ctx.lineTo(mouseRef.current.x, mouseRef.current.y)
          ctx.strokeStyle = `rgba(59, 130, 246, ${opacity})`
          ctx.lineWidth = 0.8
          ctx.stroke()
        }
      })

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
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  )
}

// 主组件
const InteractiveBackground = ({ 
  enableOrbs = true, 
  enableGrid = false, 
  enableTrail = false, 
  enableConnections = true 
}) => {
  return (
    <>
      {enableOrbs && <FloatingOrbs />}
      {enableGrid && <GridWave />}
      {enableTrail && <MouseTrail />}
      {enableConnections && <ConnectionLines />}
    </>
  )
}

export default InteractiveBackground
