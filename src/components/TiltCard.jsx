import React, { useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

// 3D 倾斜卡片组件
const TiltCard = ({ 
  children, 
  className = '',
  tiltAmount = 10,
  glareEnabled = true,
  scale = 1.02
}) => {
  const ref = useRef(null)
  const [isHovered, setIsHovered] = useState(false)

  // 鼠标位置
  const x = useMotionValue(0.5)
  const y = useMotionValue(0.5)

  // 弹簧动画配置
  const springConfig = { damping: 20, stiffness: 300 }
  const rotateX = useSpring(useTransform(y, [0, 1], [tiltAmount, -tiltAmount]), springConfig)
  const rotateY = useSpring(useTransform(x, [0, 1], [-tiltAmount, tiltAmount]), springConfig)

  // 光泽位置
  const glareX = useTransform(x, [0, 1], ['0%', '100%'])
  const glareY = useTransform(y, [0, 1], ['0%', '100%'])

  const handleMouseMove = (e) => {
    if (!ref.current) return
    
    const rect = ref.current.getBoundingClientRect()
    const xPos = (e.clientX - rect.left) / rect.width
    const yPos = (e.clientY - rect.top) / rect.height
    
    x.set(xPos)
    y.set(yPos)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    x.set(0.5)
    y.set(0.5)
  }

  return (
    <motion.div
      ref={ref}
      className={`relative ${className}`}
      style={{
        perspective: 1000,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        animate={{ scale: isHovered ? scale : 1 }}
        transition={{ duration: 0.2 }}
        className="w-full h-full"
      >
        {children}
        
        {/* 光泽效果 */}
        {glareEnabled && (
          <motion.div
            className="absolute inset-0 pointer-events-none rounded-inherit overflow-hidden"
            style={{
              background: useTransform(
                [glareX, glareY],
                ([x, y]) => `radial-gradient(circle at ${x} ${y}, rgba(255,255,255,0.15) 0%, transparent 50%)`
              ),
              opacity: isHovered ? 1 : 0,
            }}
            transition={{ opacity: { duration: 0.3 } }}
          />
        )}
      </motion.div>
    </motion.div>
  )
}

// 磁吸按钮组件
export const MagneticButton = ({ 
  children, 
  className = '',
  strength = 0.3
}) => {
  const ref = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const springConfig = { damping: 15, stiffness: 150 }
  const xSpring = useSpring(x, springConfig)
  const ySpring = useSpring(y, springConfig)

  const handleMouseMove = (e) => {
    if (!ref.current) return
    
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    const distanceX = (e.clientX - centerX) * strength
    const distanceY = (e.clientY - centerY) * strength
    
    x.set(distanceX)
    y.set(distanceY)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.button
      ref={ref}
      className={className}
      style={{ x: xSpring, y: ySpring }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.button>
  )
}

export default TiltCard
