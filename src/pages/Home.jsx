/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 */
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform, AnimatePresence, useSpring, useMotionValue } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext.jsx'

// ============================================
// Parallax Hook - Guizang Editorial Style
// Supports reduced motion preference
// ============================================
const useParallax = (ref, speed = 0.5) => {
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  })
  
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })
  
  const y = useTransform(
    smoothProgress, 
    [0, 1], 
    prefersReducedMotion ? [0, 0] : [0, -50 * speed]
  )
  
  const opacity = useTransform(smoothProgress, [0, 0.3, 0.7, 1], [0.6, 1, 1, 0.6])
  
  return { y, opacity, scrollYProgress, smoothProgress }
}

// Multi-layer parallax speeds (from SKILL.md)
const PARALLAX_SPEEDS = {
  background: 0.3,  // Slowest - background layer
  content: 1,       // Normal - main content
  foreground: 1.2   // Fastest - foreground accents
}
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Calendar,
  Focus,
  StickyNote,
  Target,
  Headphones,
  Clock,
  MapPin,
  Compass
} from 'lucide-react'

/* ============================================
   Unified Image Assets — Editorial Style
   High-quality magazine photography
   ============================================ */
const IMAGES = {
  hero: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80',
  feature: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=3840&q=90',
  // Bento Grid - 4K Editorial Photography
  todo: 'https://images.unsplash.com/photo-1542435503-956c469947f6?w=3840&q=90',
  calendar: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=3840&q=90',
  focus: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=3840&q=90',
  notes: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=3840&q=90',
  habits: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=3840&q=90',
  soundscape: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=3840&q=90'
}

/* ============================================
   Route Mapping for Navigation
   ============================================ */
const ROUTES = {
  '待办': '/todo',
  '日历': '/calendar',
  '专注': '/focus',
  '备忘': '/notes',
  '习惯': '/habits',
  '白噪音': '/soundscape'
}

/* ============================================
   Editorial Magazine Home Page
   ============================================ */

// Animated counter
const AnimatedCounter = ({ value, suffix = '' }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const duration = 2000
    const steps = 60
    const increment = value / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])

  return (
    <span style={{ fontVariantNumeric: 'tabular-nums' }}>
      {count}{suffix}
    </span>
  )
}

// Editorial Section Label
const SectionLabel = ({ children }) => (
  <motion.span
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    style={{
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--font-size-xs)',
      fontWeight: 600,
      letterSpacing: '0.2em',
      textTransform: 'uppercase',
      color: 'var(--color-text-tertiary)',
      display: 'block',
      marginBottom: 'var(--space-6)'
    }}
  >
    {children}
  </motion.span>
)

// Hero Section — Magazine Cover Style with Multi-layer Parallax
const HeroSection = () => {
  const sectionRef = useRef(null)
  const { y: bgY, opacity: bgOpacity } = useParallax(sectionRef, PARALLAX_SPEEDS.background)
  const { y: contentY } = useParallax(sectionRef, PARALLAX_SPEEDS.content)
  const { y: fgY } = useParallax(sectionRef, PARALLAX_SPEEDS.foreground)

  return (
    <section
      ref={sectionRef}
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        backgroundColor: 'var(--color-bg-primary)'
      }}
    >
      {/* Layer 1: Background Image - Slowest parallax */}
      <motion.div
        style={{ 
          y: bgY, 
          opacity: bgOpacity,
          position: 'absolute',
          inset: 0,
          zIndex: 0
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${IMAGES.hero})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.85) saturate(0.9)',
            transform: 'scale(1.1)' // Prevent edge visibility during parallax
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(250,250,247,0) 0%, rgba(250,250,247,0.9) 100%)'
          }}
        />
      </motion.div>

      {/* Layer 2: Decorative Line Element - Foreground parallax */}
      <motion.div
        style={{
          y: fgY,
          position: 'absolute',
          top: '20%',
          right: '10%',
          width: '1px',
          height: '200px',
          backgroundColor: 'var(--color-accent)',
          zIndex: 1,
          opacity: 0.6
        }}
      />

      {/* Layer 3: Content - Normal parallax speed */}
      <motion.div 
        className="container relative z-10" 
        style={{ 
          y: contentY,
          paddingTop: '120px', 
          paddingBottom: '80px' 
        }}
      >
        <div className="grid-editorial">
          {/* Left Column — Main Headline */}
          <div className="grid-editorial-feature">
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-tertiary)',
                  display: 'block',
                  marginBottom: 'var(--space-6)'
                }}
              >
                编辑精选 · 2026
              </span>

              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(64px, 10vw, 120px)',
                  fontWeight: 500,
                  lineHeight: 0.95,
                  letterSpacing: '-0.04em',
                  color: 'var(--color-text-primary)',
                  margin: 0
                }}
              >
                全新
                <br />
                旅程
              </h1>

              <p
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 'clamp(24px, 3vw, 36px)',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  color: 'var(--color-text-secondary)',
                  marginTop: 'var(--space-6)',
                  lineHeight: 1.3
                }}
              >
                效率工具 2026
              </p>
            </motion.div>
          </div>

          {/* Right Column — Description + CTA */}
          <div className="grid-editorial-sidebar" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 300,
                  lineHeight: 'var(--leading-relaxed)',
                  color: 'var(--color-text-secondary)',
                  marginBottom: 'var(--space-8)'
                }}
              >
                为现代创意人精心策划的工具合集。
                极简、优雅、 purposeful。
              </p>

              <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
                <button
                  className="btn-primary"
                  style={{
                    padding: 'var(--space-4) var(--space-8)',
                    fontSize: 'var(--font-size-sm)',
                    letterSpacing: '0.15em'
                  }}
                >
                  探索
                  <ArrowRight style={{ width: '16px', height: '16px' }} />
                </button>

                <button className="btn-ghost" style={{ fontSize: 'var(--font-size-sm)' }}>
                  了解更多
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{
            marginTop: 'var(--space-20)',
            paddingTop: 'var(--space-8)',
            borderTop: '1px solid var(--color-border)',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--space-8)'
          }}
        >
          {[
            { label: '工具', value: 6, suffix: '' },
            { label: '用户', value: 12, suffix: 'K' },
            { label: '城市', value: 48, suffix: '+' }
          ].map((stat, i) => (
            <div key={i}>
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--font-size-3xl)',
                  fontWeight: 500,
                  color: 'var(--color-text-primary)',
                  letterSpacing: '-0.02em',
                  marginBottom: 'var(--space-2)'
                }}
              >
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-tertiary)'
                }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}

// Editorial Feature Section — Asymmetric Layout with Parallax
const EditorialFeature = () => {
  const sectionRef = useRef(null)
  const { y: imageY } = useParallax(sectionRef, PARALLAX_SPEEDS.background)
  const { y: textY } = useParallax(sectionRef, PARALLAX_SPEEDS.content)

  return (
    <section ref={sectionRef} style={{ padding: 'var(--space-24) 0', backgroundColor: 'var(--color-bg-secondary)' }}>
      <div className="container">
        <SectionLabel>精选故事</SectionLabel>

        <div className="grid-editorial" style={{ alignItems: 'center' }}>
          {/* Left — Image with parallax */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="grid-editorial-feature"
            style={{ y: imageY }}
          >
            <div
              style={{
                position: 'relative',
                aspectRatio: '4/5',
                overflow: 'hidden',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <img
                src={IMAGES.feature}
                alt="京都风景"
                loading="lazy"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: 'grayscale(20%) contrast(1.1)',
                  imageRendering: 'auto'
                }}
              />
              {/* Overlapping text */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 'var(--space-8)',
                  left: 'var(--space-8)',
                  right: 'var(--space-8)'
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(48px, 6vw, 80px)',
                    fontWeight: 500,
                    color: 'white',
                    lineHeight: 1,
                    letterSpacing: '-0.03em',
                    textShadow: '0 2px 20px rgba(0,0,0,0.3)',
                    display: 'block'
                  }}
                >
                  Focus
                </span>
              </div>
            </div>
          </motion.div>

          {/* Right — Content with parallax */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="grid-editorial-sidebar"
            style={{ paddingLeft: 'var(--space-8)', y: textY }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--font-size-4xl)',
                fontWeight: 500,
                lineHeight: 'var(--leading-snug)',
                letterSpacing: '-0.02em',
                marginBottom: 'var(--space-6)'
              }}
            >
              深度工作
              <br />
              的艺术
            </h2>

            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--font-size-lg)',
                fontWeight: 300,
                lineHeight: 'var(--leading-relaxed)',
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--space-8)'
              }}
            >
              在一个充满干扰的世界里，深度专注的能力是一种超能力。
              我们的工具帮助你重新夺回注意力。
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {['番茄钟计时器', '环境音景', '干扰屏蔽'].map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-3) 0',
                    borderBottom: '1px solid var(--color-border)'
                  }}
                >
                  <ArrowUpRight style={{ width: '16px', height: '16px', color: 'var(--color-text-tertiary)' }} />
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 500,
                      color: 'var(--color-text-primary)'
                    }}
                  >
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// Bento Grid Section - with smooth click animation and parallax
const BentoSection = () => {
  const navigate = useNavigate()
  const [clickedIndex, setClickedIndex] = useState(null)
  const sectionRef = useRef(null)
  const { y: sectionY } = useParallax(sectionRef, PARALLAX_SPEEDS.content)

  const handleCardClick = (route, index) => {
    setClickedIndex(index)
    // Delay navigation to show animation
    setTimeout(() => {
      navigate(route)
    }, 400)
  }

  const features = [
    {
      icon: CheckCircle2,
      title: '待办',
      description: '以优雅的简洁组织你的一天',
      size: '2x2',
      image: IMAGES.todo,
      route: '/todo'
    },
    {
      icon: Calendar,
      title: '日历',
      description: '时间，优美地排列',
      size: '1x1',
      image: IMAGES.calendar,
      route: '/calendar'
    },
    {
      icon: Focus,
      title: '专注',
      description: '深度工作模式',
      size: '1x1',
      image: IMAGES.focus,
      route: '/focus'
    },
    {
      icon: StickyNote,
      title: '备忘',
      description: '即时捕捉灵感',
      size: '2x1',
      image: IMAGES.notes,
      route: '/notes'
    },
    {
      icon: Target,
      title: '习惯',
      description: '建立持久的习惯',
      size: '1x1',
      image: IMAGES.habits,
      route: '/habits'
    },
    {
      icon: Headphones,
      title: '白噪音',
      description: '沉浸式音频体验',
      size: '1x1',
      image: IMAGES.soundscape,
      route: '/soundscape'
    }
  ]

  return (
    <motion.section 
      ref={sectionRef}
      style={{ 
        padding: 'var(--space-24) 0', 
        backgroundColor: 'var(--color-bg-primary)',
        y: sectionY
      }}
    >
      <div className="container">
        <SectionLabel>工具合集</SectionLabel>

        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(48px, 6vw, 80px)',
            fontWeight: 500,
            lineHeight: 'var(--leading-tight)',
            letterSpacing: '-0.03em',
            marginBottom: 'var(--space-16)',
            maxWidth: '800px'
          }}
        >
          你需要的一切，
          <br />
          <span style={{ fontStyle: 'italic', fontWeight: 400 }}>仅此而已</span>
        </motion.h2>

        <div className="grid-bento">
          {features.map((feature, i) => {
            const Icon = feature.icon
            const isLarge = feature.size === '2x2'
            const isWide = feature.size === '2x1'

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className={isLarge ? 'grid-bento-2x2' : isWide ? 'grid-bento-2x1' : ''}
                animate={{
                  scale: clickedIndex === i ? 0.95 : 1,
                  opacity: clickedIndex === i ? 0.8 : 1
                }}
                whileHover={{ 
                  y: -4,
                  transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
                }}
                whileTap={{ 
                  scale: 0.95,
                  transition: { duration: 0.1 }
                }}
                style={{
                  position: 'relative',
                  backgroundColor: 'var(--color-surface)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  minHeight: isLarge ? '400px' : '200px',
                  cursor: 'pointer',
                  border: '1px solid var(--color-border)'
                }}
                onClick={() => handleCardClick(feature.route, i)}
              >
                {/* Image with zoom effect on click */}
                <motion.div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    overflow: 'hidden'
                  }}
                  animate={{
                    scale: clickedIndex === i ? 1.05 : 1
                  }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  {feature.image && (
                    <img
                      src={feature.image}
                      alt={feature.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: 'grayscale(30%) brightness(0.9)'
                      }}
                    />
                  )}
                </motion.div>

                {/* Ripple effect overlay */}
                <AnimatePresence>
                  {clickedIndex === i && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'radial-gradient(circle at center, rgba(255,255,255,0.2) 0%, transparent 70%)',
                        zIndex: 3,
                        pointerEvents: 'none'
                      }}
                    />
                  )}
                </AnimatePresence>

                <motion.div
                  style={{
                    position: 'relative',
                    zIndex: 2,
                    padding: 'var(--space-6)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    background: feature.image
                      ? 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 100%)'
                      : 'none'
                  }}
                  animate={{
                    y: clickedIndex === i ? -8 : 0
                  }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  <motion.div
                    animate={{
                      scale: clickedIndex === i ? 1.1 : 1,
                      x: clickedIndex === i ? 4 : 0
                    }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Icon
                      style={{
                        width: '24px',
                        height: '24px',
                        marginBottom: 'var(--space-4)',
                        color: feature.image ? 'white' : 'var(--color-text-primary)'
                      }}
                    />
                  </motion.div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: isLarge ? 'var(--font-size-3xl)' : 'var(--font-size-xl)',
                      fontWeight: 500,
                      color: feature.image ? 'white' : 'var(--color-text-primary)',
                      marginBottom: 'var(--space-2)',
                      letterSpacing: '-0.02em'
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 'var(--font-size-sm)',
                      color: feature.image ? 'rgba(255,255,255,0.7)' : 'var(--color-text-secondary)',
                      lineHeight: 1.5
                    }}
                  >
                    {feature.description}
                  </p>
                </motion.div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.section>
  )
}

// Quote Section with Parallax
const QuoteSection = () => {
  const sectionRef = useRef(null)
  const { y: quoteY } = useParallax(sectionRef, PARALLAX_SPEEDS.background)

  return (
    <motion.section 
      ref={sectionRef} 
      style={{ 
        padding: 'var(--space-24) 0', 
        backgroundColor: 'var(--color-bg-secondary)',
        y: quoteY
      }}
    >
      <div className="container-narrow" style={{ margin: '0 auto' }}>
        <motion.blockquote
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 4vw, 48px)',
            fontStyle: 'italic',
            fontWeight: 400,
            lineHeight: 'var(--leading-snug)',
            color: 'var(--color-text-primary)',
            textAlign: 'center',
            letterSpacing: '-0.02em'
          }}
        >
          "简单是终极的复杂。"
        </motion.blockquote>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{
            marginTop: 'var(--space-8)',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              width: '40px',
              height: '1px',
              backgroundColor: 'var(--color-border)',
              margin: '0 auto var(--space-4)'
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--color-text-tertiary)'
            }}
          >
            列奥纳多·达·芬奇
          </span>
        </motion.div>
      </div>
    </motion.section>
  )
}

// Footer — Minimal Editorial
const EditorialFooter = () => {
  return (
    <footer
      style={{
        padding: 'var(--space-16) 0 var(--space-8)',
        backgroundColor: 'var(--color-ink-10)',
        color: 'var(--color-paper-1)'
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
            gap: 'var(--space-12)',
            marginBottom: 'var(--space-16)'
          }}
        >
          {/* Brand */}
          <div>
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 500,
                marginBottom: 'var(--space-4)',
                letterSpacing: '-0.02em'
              }}
            >
              my库
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-ink-4)',
                lineHeight: 'var(--leading-relaxed)'
              }}
            >
              为现代创意人打造的编辑工具。
            </p>
          </div>

          {/* Links */}
          {[
            {
              title: '产品',
              links: ['功能', '定价', '更新日志']
            },
            {
              title: '公司',
              links: ['关于', '博客', '招聘']
            },
            {
              title: '法律',
              links: ['隐私', '条款', 'Cookies']
            }
          ].map((group, i) => (
            <div key={i}>
              <h4
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'var(--color-ink-4)',
                  marginBottom: 'var(--space-4)'
                }}
              >
                {group.title}
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {group.links.map((link, j) => (
                  <li key={j}>
                    <a
                      href="#"
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-ink-3)',
                        transition: 'color 200ms ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--color-paper-1)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--color-ink-3)'
                      }}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            paddingTop: 'var(--space-8)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-4)'
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-ink-4)'
            }}
          >
            © 2026 my库. 保留所有权利。
          </span>

          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--color-ink-4)'
            }}
          >
            编辑杂志
          </span>
        </div>
      </div>
    </footer>
  )
}

// Main Home Component
const Home = () => {
  return (
    <div style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <HeroSection />
      <EditorialFeature />
      <BentoSection />
      <QuoteSection />
      <EditorialFooter />
    </div>
  )
}

export default Home
