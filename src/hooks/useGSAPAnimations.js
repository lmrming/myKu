import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// 注册 GSAP 插件
gsap.registerPlugin(ScrollTrigger)

/**
 * GSAP 动画 Hook
 * 提供常用的页面动画效果
 */

// ==================== 页面进入动画 ====================

export const usePageEnter = (options = {}) => {
  const containerRef = useRef(null)
  const { duration = 0.8, ease = 'power3.out', stagger = 0.1 } = options

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 容器淡入
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration, ease }
      )

      // 子元素依次进入
      const children = containerRef.current?.querySelectorAll('.gsap-item')
      if (children?.length) {
        gsap.fromTo(
          children,
          { opacity: 0, y: 30 },
          { 
            opacity: 1, 
            y: 0, 
            duration: 0.6, 
            ease,
            stagger,
            delay: 0.2
          }
        )
      }
    }, containerRef)

    return () => ctx.revert()
  }, [duration, ease, stagger])

  return containerRef
}

// ==================== 滚动触发动画 ====================

export const useScrollReveal = (options = {}) => {
  const elementRef = useRef(null)
  const { 
    start = 'top 80%', 
    end = 'bottom 20%',
    scrub = false,
    markers = false,
    toggleActions = 'play none none reverse'
  } = options

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        element,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: element,
            start,
            end,
            scrub,
            markers,
            toggleActions
          }
        }
      )
    })

    return () => ctx.revert()
  }, [start, end, scrub, markers, toggleActions])

  return elementRef
}

// ==================== 文字逐字动画 ====================

export const useTextReveal = (options = {}) => {
  const textRef = useRef(null)
  const { duration = 0.05, stagger = 0.03, ease = 'power2.out' } = options

  useEffect(() => {
    const element = textRef.current
    if (!element) return

    const ctx = gsap.context(() => {
      // 将文字拆分为单个字符
      const text = element.textContent
      element.innerHTML = text
        .split('')
        .map(char => `<span class="char" style="display: inline-block">${char === ' ' ? '&nbsp;' : char}</span>`)
        .join('')

      const chars = element.querySelectorAll('.char')
      
      gsap.fromTo(
        chars,
        { opacity: 0, y: 20, rotateX: -90 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration,
          ease,
          stagger,
          scrollTrigger: {
            trigger: element,
            start: 'top 85%'
          }
        }
      )
    })

    return () => ctx.revert()
  }, [duration, stagger, ease])

  return textRef
}

// ==================== 卡片悬停效果 ====================

export const useCardHover = () => {
  const cardRef = useRef(null)

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const handleMouseEnter = () => {
      gsap.to(card, {
        scale: 1.02,
        y: -5,
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        duration: 0.3,
        ease: 'power2.out'
      })
    }

    const handleMouseLeave = () => {
      gsap.to(card, {
        scale: 1,
        y: 0,
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        duration: 0.3,
        ease: 'power2.out'
      })
    }

    card.addEventListener('mouseenter', handleMouseEnter)
    card.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      card.removeEventListener('mouseenter', handleMouseEnter)
      card.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return cardRef
}

// ==================== 视差滚动效果 ====================

export const useParallax = (speed = 0.5) => {
  const elementRef = useRef(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const ctx = gsap.context(() => {
      gsap.to(element, {
        yPercent: speed * 100,
        ease: 'none',
        scrollTrigger: {
          trigger: element,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      })
    })

    return () => ctx.revert()
  }, [speed])

  return elementRef
}

// ==================== 列表交错动画 ====================

export const useStaggerList = (options = {}) => {
  const listRef = useRef(null)
  const { stagger = 0.1, duration = 0.6, ease = 'power2.out' } = options

  useEffect(() => {
    const list = listRef.current
    if (!list) return

    const ctx = gsap.context(() => {
      const items = list.querySelectorAll('.stagger-item')
      
      gsap.fromTo(
        items,
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          duration,
          ease,
          stagger,
          scrollTrigger: {
            trigger: list,
            start: 'top 80%'
          }
        }
      )
    })

    return () => ctx.revert()
  }, [stagger, duration, ease])

  return listRef
}

// ==================== 呼吸动画 ====================

export const useBreathing = (options = {}) => {
  const elementRef = useRef(null)
  const { scale = 1.05, duration = 2 } = options

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const ctx = gsap.context(() => {
      gsap.to(element, {
        scale,
        duration: duration / 2,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1
      })
    })

    return () => ctx.revert()
  }, [scale, duration])

  return elementRef
}

// ==================== 磁性按钮效果 ====================

export const useMagneticButton = () => {
  const buttonRef = useRef(null)

  useEffect(() => {
    const button = buttonRef.current
    if (!button) return

    const handleMouseMove = (e) => {
      const rect = button.getBoundingClientRect()
      const x = e.clientX - rect.left - rect.width / 2
      const y = e.clientY - rect.top - rect.height / 2

      gsap.to(button, {
        x: x * 0.3,
        y: y * 0.3,
        duration: 0.3,
        ease: 'power2.out'
      })
    }

    const handleMouseLeave = () => {
      gsap.to(button, {
        x: 0,
        y: 0,
        duration: 0.3,
        ease: 'elastic.out(1, 0.3)'
      })
    }

    button.addEventListener('mousemove', handleMouseMove)
    button.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      button.removeEventListener('mousemove', handleMouseMove)
      button.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return buttonRef
}

// ==================== 数字计数动画 ====================

export const useCountUp = (endValue, options = {}) => {
  const elementRef = useRef(null)
  const { duration = 2, ease = 'power2.out', suffix = '' } = options

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const ctx = gsap.context(() => {
      const obj = { value: 0 }
      
      gsap.to(obj, {
        value: endValue,
        duration,
        ease,
        scrollTrigger: {
          trigger: element,
          start: 'top 80%'
        },
        onUpdate: () => {
          element.textContent = Math.round(obj.value) + suffix
        }
      })
    })

    return () => ctx.revert()
  }, [endValue, duration, ease, suffix])

  return elementRef
}

// ==================== 路径绘制动画 ====================

export const useDrawPath = (options = {}) => {
  const pathRef = useRef(null)
  const { duration = 2, ease = 'power2.inOut' } = options

  useEffect(() => {
    const path = pathRef.current
    if (!path) return

    const ctx = gsap.context(() => {
      const length = path.getTotalLength()
      
      gsap.set(path, {
        strokeDasharray: length,
        strokeDashoffset: length
      })

      gsap.to(path, {
        strokeDashoffset: 0,
        duration,
        ease,
        scrollTrigger: {
          trigger: path,
          start: 'top 80%'
        }
      })
    })

    return () => ctx.revert()
  }, [duration, ease])

  return pathRef
}

// ==================== 3D 翻转卡片 ====================

export const useFlipCard = () => {
  const cardRef = useRef(null)
  const isFlipped = useRef(false)

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const handleClick = () => {
      isFlipped.current = !isFlipped.current
      
      gsap.to(card, {
        rotateY: isFlipped.current ? 180 : 0,
        duration: 0.6,
        ease: 'power2.inOut'
      })
    }

    card.addEventListener('click', handleClick)
    return () => card.removeEventListener('click', handleClick)
  }, [])

  return cardRef
}

// ==================== 波浪动画 ====================

export const useWaveAnimation = (options = {}) => {
  const containerRef = useRef(null)
  const { count = 5, duration = 1.5, stagger = 0.1 } = options

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const ctx = gsap.context(() => {
      const waves = container.querySelectorAll('.wave-item')
      
      gsap.to(waves, {
        y: -20,
        duration: duration / 2,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        stagger
      })
    })

    return () => ctx.revert()
  }, [count, duration, stagger])

  return containerRef
}

// ==================== 模糊渐入效果 ====================

export const useBlurReveal = (options = {}) => {
  const elementRef = useRef(null)
  const { duration = 1, ease = 'power2.out' } = options

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        element,
        { opacity: 0, filter: 'blur(10px)' },
        {
          opacity: 1,
          filter: 'blur(0px)',
          duration,
          ease,
          scrollTrigger: {
            trigger: element,
            start: 'top 85%'
          }
        }
      )
    })

    return () => ctx.revert()
  }, [duration, ease])

  return elementRef
}

// ==================== 导出所有 Hooks ====================

export default {
  usePageEnter,
  useScrollReveal,
  useTextReveal,
  useCardHover,
  useParallax,
  useStaggerList,
  useBreathing,
  useMagneticButton,
  useCountUp,
  useDrawPath,
  useFlipCard,
  useWaveAnimation,
  useBlurReveal
}
