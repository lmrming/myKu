import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

// 打字机效果组件
const TypeWriter = ({ 
  text, 
  speed = 100, 
  delay = 0, 
  className = '',
  cursor = true,
  onComplete 
}) => {
  const [displayText, setDisplayText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    let timeout
    
    const startTyping = () => {
      setIsTyping(true)
      let currentIndex = 0
      
      const typeNextChar = () => {
        if (currentIndex < text.length) {
          setDisplayText(text.slice(0, currentIndex + 1))
          currentIndex++
          timeout = setTimeout(typeNextChar, speed)
        } else {
          setIsTyping(false)
          onComplete?.()
        }
      }
      
      typeNextChar()
    }

    timeout = setTimeout(startTyping, delay)

    return () => clearTimeout(timeout)
  }, [text, speed, delay, onComplete])

  // 光标闪烁
  useEffect(() => {
    if (!cursor || !isTyping) return
    
    const interval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 530)

    return () => clearInterval(interval)
  }, [cursor, isTyping])

  return (
    <span className={className}>
      {displayText}
      {cursor && (
        <motion.span
          animate={{ opacity: showCursor ? 1 : 0 }}
          transition={{ duration: 0.1 }}
          className="inline-block w-0.5 h-[1em] bg-current ml-0.5 align-middle"
        />
      )}
    </span>
  )
}

// 多文本循环打字机
export const LoopTypeWriter = ({
  texts,
  speed = 100,
  deleteSpeed = 50,
  pauseTime = 2000,
  className = ''
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [displayText, setDisplayText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const currentText = texts[currentIndex]
    let timeout

    if (isDeleting) {
      if (displayText === '') {
        setIsDeleting(false)
        setCurrentIndex((prev) => (prev + 1) % texts.length)
      } else {
        timeout = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1))
        }, deleteSpeed)
      }
    } else {
      if (displayText === currentText) {
        timeout = setTimeout(() => {
          setIsDeleting(true)
        }, pauseTime)
      } else {
        timeout = setTimeout(() => {
          setDisplayText(currentText.slice(0, displayText.length + 1))
        }, speed)
      }
    }

    return () => clearTimeout(timeout)
  }, [displayText, isDeleting, currentIndex, texts, speed, deleteSpeed, pauseTime])

  return (
    <span className={className}>
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
        className="inline-block w-0.5 h-[1em] bg-current ml-0.5 align-middle"
      />
    </span>
  )
}

export default TypeWriter
