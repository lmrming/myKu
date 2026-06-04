/**
 * Long Scroll Parallax Hook
 * Optimized for full-page parallax scrolling experiences
 * Following deck-guizang-editorial SKILL.md specifications
 */

import { useRef, useEffect, useState } from 'react'
import { useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion'

// ============================================
// Configuration Presets
// ============================================

export const PARALLAX_PRESETS = {
  //  subtle: 适合文字为主的页面
  subtle: {
    background: { speed: 0.15, maxOffset: 50 },
    midground: { speed: 0.4, maxOffset: 30 },
    foreground: { speed: 1.1, maxOffset: -15 }
  },
  
  // standard: 通用配置
  standard: {
    background: { speed: 0.3, maxOffset: 100 },
    midground: { speed: 0.6, maxOffset: 60 },
    foreground: { speed: 1.2, maxOffset: -40 }
  },
  
  // dramatic: 强烈的层次感，适合视觉展示
  dramatic: {
    background: { speed: 0.2, maxOffset: 150 },
    midground: { speed: 0.5, maxOffset: 80 },
    foreground: { speed: 1.4, maxOffset: -60 }
  },
  
  // editorial: 杂志风格，符合 guizang 规范
  editorial: {
    background: { speed: 0.25, maxOffset: 80 },
    midground: { speed: 0.5, maxOffset: 40 },
    foreground: { speed: 1.15, maxOffset: -30 }
  }
}

export const SPRING_CONFIGS = {
  smooth: { stiffness: 50, damping: 25, mass: 1.2, restDelta: 0.001 },
  responsive: { stiffness: 150, damping: 20, mass: 0.8, restDelta: 0.001 },
  natural: { stiffness: 100, damping: 30, mass: 1, restDelta: 0.001 },
  snappy: { stiffness: 200, damping: 15, mass: 0.5, restDelta: 0.001 }
}

// ============================================
// Main Hook
// ============================================

export const useLongScrollParallax = (options = {}) => {
  const {
    preset = 'editorial',
    springConfig = 'natural',
    offset = ["start end", "end start"],
    respectReducedMotion = true,
    enableOnMobile = false
  } = options
  
  const ref = useRef(null)
  const [isMobile, setIsMobile] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  
  // Detect mobile and reduced motion preference
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(pointer: coarse)').matches)
    }
    
    const checkReducedMotion = () => {
      if (respectReducedMotion) {
        setPrefersReducedMotion(
          window.matchMedia('(prefers-reduced-motion: reduce)').matches
        )
      }
    }
    
    checkMobile()
    checkReducedMotion()
    
    window.addEventListener('resize', checkMobile)
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    mediaQuery.addEventListener('change', checkReducedMotion)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
      mediaQuery.removeEventListener('change', checkReducedMotion)
    }
  }, [respectReducedMotion])
  
  // Disable on mobile if not enabled
  const shouldDisable = (isMobile && !enableOnMobile) || prefersReducedMotion
  
  // Scroll progress
  const { scrollYProgress } = useScroll({
    target: ref,
    offset
  })
  
  // Smooth spring animation
  const spring = useSpring(scrollYProgress, SPRING_CONFIGS[springConfig])
  
  // Get preset values
  const config = PARALLAX_PRESETS[preset]
  
  // Calculate transforms
  const backgroundY = useTransform(
    spring,
    [0, 1],
    shouldDisable ? [0, 0] : [0, -config.background.maxOffset]
  )
  
  const midgroundY = useTransform(
    spring,
    [0, 1],
    shouldDisable ? [0, 0] : [0, -config.midground.maxOffset]
  )
  
  const foregroundY = useTransform(
    spring,
    [0, 1],
    shouldDisable ? [0, 0] : [0, config.foreground.maxOffset]
  )
  
  // Opacity transforms for fade effects
  const backgroundOpacity = useTransform(
    spring,
    [0, 0.2, 0.8, 1],
    [0.4, 1, 1, 0.4]
  )
  
  const foregroundOpacity = useTransform(
    spring,
    [0, 0.1, 0.9, 1],
    [0, 1, 1, 0]
  )
  
  // Scale transform for depth effect
  const backgroundScale = useTransform(
    spring,
    [0, 0.5, 1],
    shouldDisable ? [1, 1, 1] : [1.1, 1.05, 1.1]
  )
  
  return {
    ref,
    scrollYProgress,
    spring,
    transforms: {
      background: { y: backgroundY, opacity: backgroundOpacity, scale: backgroundScale },
      midground: { y: midgroundY },
      foreground: { y: foregroundY, opacity: foregroundOpacity }
    },
    config,
    isMobile,
    prefersReducedMotion,
    isEnabled: !shouldDisable
  }
}

// ============================================
// Specialized Hooks for Common Patterns
// ============================================

// Hero section parallax - full viewport effect
export const useHeroParallax = (options = {}) => {
  return useLongScrollParallax({
    preset: 'dramatic',
    springConfig: 'smooth',
    offset: ["start start", "end start"],
    ...options
  })
}

// Content section parallax - subtle effect
export const useContentParallax = (options = {}) => {
  return useLongScrollParallax({
    preset: 'subtle',
    springConfig: 'natural',
    offset: ["start 80%", "end 20%"],
    ...options
  })
}

// Gallery/Portfolio parallax - strong visual impact
export const useGalleryParallax = (options = {}) => {
  return useLongScrollParallax({
    preset: 'dramatic',
    springConfig: 'responsive',
    offset: ["start end", "end start"],
    ...options
  })
}

// Editorial parallax - magazine style
export const useEditorialParallax = (options = {}) => {
  return useLongScrollParallax({
    preset: 'editorial',
    springConfig: 'natural',
    offset: ["start 90%", "end 10%"],
    ...options
  })
}

export default useLongScrollParallax
