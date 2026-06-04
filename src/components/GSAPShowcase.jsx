import React from 'react'
import {
  usePageEnter,
  useScrollReveal,
  useTextReveal,
  useCardHover,
  useStaggerList,
  useMagneticButton,
  useCountUp,
  useBlurReveal,
  useBreathing
} from '../hooks/useGSAPAnimations'

/**
 * GSAP 动画展示组件
 * 展示各种 GSAP 动画效果的使用方法
 */

const GSAPShowcase = () => {
  // 使用各种动画 Hook
  const pageRef = usePageEnter({ duration: 0.8, stagger: 0.1 })
  const textRef = useTextReveal({ duration: 0.05, stagger: 0.03 })
  const cardRef = useCardHover()
  const listRef = useStaggerList({ stagger: 0.1, duration: 0.6 })
  const magneticRef = useMagneticButton()
  const countRef = useCountUp(100, { duration: 2, suffix: '%' })
  const blurRef = useBlurReveal({ duration: 1 })
  const breatheRef = useBreathing({ scale: 1.05, duration: 2 })
  
  // 滚动触发动画
  const reveal1 = useScrollReveal()
  const reveal2 = useScrollReveal()
  const reveal3 = useScrollReveal()

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      color: '#fff',
      padding: '40px 20px',
      fontFamily: '"Inter", -apple-system, sans-serif'
    },
    section: {
      maxWidth: '1200px',
      margin: '0 auto 80px',
      padding: '40px'
    },
    title: {
      fontSize: '48px',
      fontWeight: 700,
      marginBottom: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    },
    subtitle: {
      fontSize: '18px',
      color: '#94a3b8',
      marginBottom: '40px'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '30px',
      marginTop: '40px'
    },
    card: {
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '16px',
      padding: '30px',
      border: '1px solid rgba(255,255,255,0.1)',
      cursor: 'pointer',
      transition: 'transform 0.3s ease'
    },
    cardTitle: {
      fontSize: '24px',
      fontWeight: 600,
      marginBottom: '12px',
      color: '#fff'
    },
    cardDesc: {
      fontSize: '14px',
      color: '#94a3b8',
      lineHeight: 1.6
    },
    button: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '16px 32px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      border: 'none',
      borderRadius: '12px',
      color: '#fff',
      fontSize: '16px',
      fontWeight: 600,
      cursor: 'pointer',
      marginTop: '20px'
    },
    list: {
      listStyle: 'none',
      padding: 0,
      margin: '20px 0'
    },
    listItem: {
      padding: '16px 20px',
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '8px',
      marginBottom: '12px',
      border: '1px solid rgba(255,255,255,0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    number: {
      fontSize: '72px',
      fontWeight: 700,
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      textAlign: 'center',
      margin: '40px 0'
    },
    breatheCircle: {
      width: '120px',
      height: '120px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      margin: '40px auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight: 600,
      boxShadow: '0 0 60px rgba(79,172,254,0.4)'
    },
    blurBox: {
      padding: '40px',
      background: 'rgba(255,255,255,0.1)',
      borderRadius: '16px',
      textAlign: 'center',
      fontSize: '24px',
      fontWeight: 600,
      border: '1px solid rgba(255,255,255,0.2)'
    },
    code: {
      background: 'rgba(0,0,0,0.3)',
      padding: '20px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '14px',
      overflow: 'auto',
      marginTop: '20px',
      color: '#a5b4fc'
    }
  }

  const features = [
    { icon: '✨', title: '页面进入动画', desc: '使用 usePageEnter 实现平滑的页面加载效果' },
    { icon: '📜', title: '滚动触发动画', desc: '使用 useScrollReveal 在滚动时触发动画' },
    { icon: '📝', title: '文字逐字动画', desc: '使用 useTextReveal 实现逐字显示效果' },
    { icon: '🎯', title: '卡片悬停效果', desc: '使用 useCardHover 添加悬停动画' },
    { icon: '🎪', title: '列表交错动画', desc: '使用 useStaggerList 实现列表依次进入' },
    { icon: '🧲', title: '磁性按钮效果', desc: '使用 useMagneticButton 创建磁性按钮' }
  ]

  return (
    <div ref={pageRef} style={styles.container}>
      {/* Hero Section */}
      <section style={styles.section}>
        <h1 ref={textRef} style={styles.title}>
          GSAP 动画展示
        </h1>
        <p style={styles.subtitle}>
          高性能 JavaScript 动画库，为 React 应用带来流畅的动画体验
        </p>
        
        <button ref={magneticRef} style={styles.button}>
          <span>🧲</span>
          磁性按钮效果
        </button>
      </section>

      {/* Features Grid */}
      <section style={styles.section}>
        <h2 style={{ ...styles.title, fontSize: '32px' }}>动画效果展示</h2>
        <div style={styles.grid}>
          {features.map((feature, index) => (
            <div
              key={index}
              ref={index === 0 ? cardRef : null}
              className="gsap-item"
              style={styles.card}
            >
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>
                {feature.icon}
              </div>
              <h3 style={styles.cardTitle}>{feature.title}</h3>
              <p style={styles.cardDesc}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stagger List */}
      <section style={styles.section}>
        <h2 style={{ ...styles.title, fontSize: '32px' }}>列表交错动画</h2>
        <ul ref={listRef} style={styles.list}>
          {['React', 'Vue', 'Angular', 'Svelte', 'Next.js'].map((item, index) => (
            <li key={index} className="stagger-item" style={styles.listItem}>
              <span style={{ fontSize: '20px' }}>⚡</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Count Up Animation */}
      <section style={styles.section}>
        <h2 style={{ ...styles.title, fontSize: '32px' }}>数字计数动画</h2>
        <div ref={countRef} style={styles.number}>
          0%
        </div>
        <p style={{ textAlign: 'center', color: '#94a3b8' }}>
          滚动到此处查看数字从 0 计数到 100
        </p>
      </section>

      {/* Breathing Animation */}
      <section style={styles.section}>
        <h2 style={{ ...styles.title, fontSize: '32px' }}>呼吸动画</h2>
        <div ref={breatheRef} style={styles.breatheCircle}>
          呼吸
        </div>
      </section>

      {/* Blur Reveal */}
      <section style={styles.section}>
        <h2 style={{ ...styles.title, fontSize: '32px' }}>模糊渐入效果</h2>
        <div ref={blurRef} style={styles.blurBox}>
          从模糊到清晰的渐入效果
        </div>
      </section>

      {/* Scroll Reveal Sections */}
      <section style={styles.section}>
        <h2 style={{ ...styles.title, fontSize: '32px' }}>滚动触发动画</h2>
        
        <div ref={reveal1} style={{ ...styles.card, marginBottom: '30px' }}>
          <h3 style={styles.cardTitle}>第一屏</h3>
          <p style={styles.cardDesc}>
            滚动到此处时，这个卡片会从下方滑入并淡入显示
          </p>
        </div>
        
        <div ref={reveal2} style={{ ...styles.card, marginBottom: '30px' }}>
          <h3 style={styles.cardTitle}>第二屏</h3>
          <p style={styles.cardDesc}>
            继续滚动，看到更多滚动触发的动画效果
          </p>
        </div>
        
        <div ref={reveal3} style={styles.card}>
          <h3 style={styles.cardTitle}>第三屏</h3>
          <p style={styles.cardDesc}>
            ScrollTrigger 让滚动动画变得简单而强大
          </p>
        </div>
      </section>

      {/* Usage Example */}
      <section style={styles.section}>
        <h2 style={{ ...styles.title, fontSize: '32px' }}>使用方法</h2>
        <div style={styles.code}>
{`import { usePageEnter, useScrollReveal } from '../hooks/useGSAPAnimations'

function MyComponent() {
  // 页面进入动画
  const pageRef = usePageEnter({ duration: 0.8, stagger: 0.1 })
  
  // 滚动触发动画
  const elementRef = useScrollReveal()
  
  return (
    <div ref={pageRef}>
      <h1 className="gsap-item">标题</h1>
      <p className="gsap-item">内容</p>
      <div ref={elementRef}>滚动时显示</div>
    </div>
  )
}`}
        </div>
      </section>

      {/* Available Hooks */}
      <section style={styles.section}>
        <h2 style={{ ...styles.title, fontSize: '32px' }}>可用的 Hooks</h2>
        <div style={{ ...styles.grid, gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          {[
            { name: 'usePageEnter', desc: '页面进入动画' },
            { name: 'useScrollReveal', desc: '滚动触发动画' },
            { name: 'useTextReveal', desc: '文字逐字动画' },
            { name: 'useCardHover', desc: '卡片悬停效果' },
            { name: 'useParallax', desc: '视差滚动效果' },
            { name: 'useStaggerList', desc: '列表交错动画' },
            { name: 'useBreathing', desc: '呼吸动画' },
            { name: 'useMagneticButton', desc: '磁性按钮' },
            { name: 'useCountUp', desc: '数字计数' },
            { name: 'useDrawPath', desc: '路径绘制' },
            { name: 'useFlipCard', desc: '3D 翻转卡片' },
            { name: 'useWaveAnimation', desc: '波浪动画' },
            { name: 'useBlurReveal', desc: '模糊渐入' }
          ].map((hook, index) => (
            <div key={index} style={{ ...styles.card, padding: '20px' }}>
              <h4 style={{ ...styles.cardTitle, fontSize: '16px', fontFamily: 'monospace' }}>
                {hook.name}
              </h4>
              <p style={{ ...styles.cardDesc, fontSize: '13px' }}>{hook.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default GSAPShowcase
