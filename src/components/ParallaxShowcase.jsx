/**
 * Parallax Showcase Component
 * Demonstrates long-scroll parallax configurations
 * Based on deck-guizang-editorial SKILL.md specifications
 */

import React from 'react'
import { motion } from 'framer-motion'
import {
  useLongScrollParallax,
  useHeroParallax,
  useContentParallax,
  useEditorialParallax,
  PARALLAX_PRESETS,
  SPRING_CONFIGS
} from '../hooks/useLongScrollParallax.js'

// ============================================
// Example 1: Hero Section with Dramatic Parallax
// ============================================
export const HeroParallax = () => {
  const { ref, transforms } = useHeroParallax({
    preset: 'dramatic',
    enableOnMobile: false  // Disable on mobile for performance
  })

  return (
    <section
      ref={ref}
      style={{
        position: 'relative',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* Background Layer - Slowest */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          y: transforms.background.y,
          scale: transforms.background.scale,
          opacity: transforms.background.opacity
        }}
      >
        <img
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80"
          alt="Background"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'brightness(0.7)'
          }}
        />
      </motion.div>

      {/* Midground Layer - Medium speed */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          y: transforms.midground.y,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div
          style={{
            width: '60%',
            height: '60%',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '50%'
          }}
        />
      </motion.div>

      {/* Foreground Layer - Fastest */}
      <motion.div
        style={{
          position: 'relative',
          zIndex: 10,
          y: transforms.foreground.y,
          opacity: transforms.foreground.opacity,
          textAlign: 'center',
          color: 'white'
        }}
      >
        <h1 style={{ fontSize: 'clamp(48px, 8vw, 120px)', fontWeight: 500 }}>
          深度沉浸
        </h1>
        <p style={{ fontSize: 'clamp(18px, 2vw, 24px)', opacity: 0.8 }}>
          体验视差滚动的艺术
        </p>
      </motion.div>
    </section>
  )
}

// ============================================
// Example 2: Editorial Section - Magazine Style
// ============================================
export const EditorialParallax = () => {
  const { ref, transforms, isEnabled } = useEditorialParallax()

  return (
    <section
      ref={ref}
      style={{
        position: 'relative',
        minHeight: '80vh',
        padding: '120px 0',
        backgroundColor: '#f7f5f0'
      }}
    >
      <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
        {/* Image with parallax */}
        <motion.div
          style={{
            y: transforms.background.y,
            opacity: transforms.background.opacity
          }}
        >
          <img
            src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80"
            alt="Editorial"
            style={{
              width: '100%',
              aspectRatio: '3/4',
              objectFit: 'cover'
            }}
          />
        </motion.div>

        {/* Content with subtle parallax */}
        <motion.div
          style={{
            y: transforms.midground.y
          }}
        >
          <span style={{ fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8b7355' }}>
            编辑精选
          </span>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', marginTop: '20px', lineHeight: 1.2 }}>
            杂志风格的
            <br />
            视差叙事
          </h2>
          <p style={{ fontSize: '18px', lineHeight: 1.8, color: '#666', marginTop: '24px' }}>
            通过精心调校的视差参数，创造出如翻阅实体杂志般的阅读体验。
            每一层元素都以不同的速度移动，形成丰富的空间层次感。
          </p>
        </motion.div>
      </div>

      {/* Status indicator */}
      <div style={{ position: 'absolute', bottom: '20px', right: '20px', fontSize: '12px', color: '#999' }}>
        视差: {isEnabled ? '已启用' : '已禁用'}
      </div>
    </section>
  )
}

// ============================================
// Example 3: Content Section - Subtle Parallax
// ============================================
export const ContentParallax = () => {
  const { ref, transforms } = useContentParallax({
    preset: 'subtle'  // Very subtle movement for text-heavy content
  })

  return (
    <section
      ref={ref}
      style={{
        minHeight: '60vh',
        padding: '100px 0',
        backgroundColor: '#1a1a1a',
        color: 'white'
      }}
    >
      <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <motion.div style={{ y: transforms.background.y }}>
          <blockquote
            style={{
              fontSize: 'clamp(24px, 3vw, 36px)',
              fontStyle: 'italic',
              lineHeight: 1.6,
              textAlign: 'center'
            }}
          >
            "简单是终极的复杂。视差效果应当服务于内容，而非喧宾夺主。"
          </blockquote>
        </motion.div>

        <motion.div
          style={{
            y: transforms.foreground.y,
            marginTop: '40px',
            textAlign: 'center'
          }}
        >
          <span style={{ fontSize: '14px', letterSpacing: '0.15em', opacity: 0.6 }}>
            — 列奥纳多·达·芬奇
          </span>
        </motion.div>
      </div>
    </section>
  )
}

// ============================================
// Example 4: Full Page with Multiple Sections
// ============================================
export const FullPageParallax = () => {
  return (
    <div style={{ overflowX: 'hidden' }}>
      <HeroParallax />
      <EditorialParallax />
      <ContentParallax />
    </div>
  )
}

// ============================================
// Configuration Reference Card
// ============================================
export const ParallaxConfigReference = () => (
  <div style={{ padding: '40px', backgroundColor: '#f5f5f5', fontFamily: 'monospace', fontSize: '14px' }}>
    <h3>视差配置参考</h3>

    <h4>1. 预设配置 (PARALLAX_PRESETS)</h4>
    <pre>{JSON.stringify(PARALLAX_PRESETS, null, 2)}</pre>

    <h4>2. 弹簧配置 (SPRING_CONFIGS)</h4>
    <pre>{JSON.stringify(SPRING_CONFIGS, null, 2)}</pre>

    <h4>3. 使用建议</h4>
    <ul>
      <li><strong>subtle</strong>: 文字为主的页面，最大位移 50px</li>
      <li><strong>standard</strong>: 通用配置，平衡效果与性能</li>
      <li><strong>dramatic</strong>: 视觉展示页面，强烈的层次感</li>
      <li><strong>editorial</strong>: 杂志风格，符合 guizang 规范</li>
    </ul>

    <h4>4. 性能优化</h4>
    <ul>
      <li>移动端默认禁用 (enableOnMobile: false)</li>
      <li>尊重用户减少动画偏好 (respectReducedMotion: true)</li>
      <li>使用 transform3d 启用 GPU 加速</li>
      <li>背景图片预缩放 1.1x 防止边缘露出</li>
    </ul>
  </div>
)

export default FullPageParallax
