import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Snowflake } from 'lucide-react'

/**
 * 动画天气图标组件
 * 根据天气代码显示不同的动画效果
 */

const AnimatedWeatherIcon = ({ code, size = 'medium', className = '' }) => {
  const iconRef = useRef(null)
  const containerRef = useRef(null)

  // 尺寸配置
  const sizes = {
    small: { icon: 28, container: 48 },
    medium: { icon: 48, container: 72 },
    large: { icon: 80, container: 120 }
  }

  const { icon: iconSize, container: containerSize } = sizes[size] || sizes.medium

  useEffect(() => {
    if (!containerRef.current) return

    const ctx = gsap.context(() => {
      // 根据天气代码应用不同动画
      switch (true) {
        // 晴天 (0-1)
        case code === 0 || code === 1:
          animateSun()
          break
        // 多云 (2-3)
        case code === 2 || code === 3:
          animateCloud()
          break
        // 雨天 (51-67, 80-82)
        case (code >= 51 && code <= 67) || (code >= 80 && code <= 82):
          animateRain()
          break
        // 雪天 (71-77, 85-86)
        case (code >= 71 && code <= 77) || (code >= 85 && code <= 86):
          animateSnow()
          break
        // 雷暴 (95-99)
        case code >= 95 && code <= 99:
          animateThunder()
          break
        // 默认
        default:
          animateCloud()
      }
    }, containerRef)

    return () => ctx.revert()
  }, [code])

  // 太阳动画 - 旋转光芒 + 脉动
  const animateSun = () => {
    const sun = containerRef.current.querySelector('.sun-icon')
    const rays = containerRef.current.querySelector('.sun-rays')

    // 太阳旋转
    gsap.to(sun, {
      rotation: 360,
      duration: 20,
      repeat: -1,
      ease: 'none'
    })

    // 光芒脉动
    gsap.to(rays, {
      scale: 1.1,
      opacity: 0.8,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    })

    // 整体轻微浮动
    gsap.to(containerRef.current, {
      y: -5,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    })
  }

  // 云朵动画 - 飘动 + 轻微缩放
  const animateCloud = () => {
    const cloud = containerRef.current.querySelector('.cloud-icon')

    // 水平飘动
    gsap.to(cloud, {
      x: 8,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    })

    // 轻微缩放
    gsap.to(cloud, {
      scale: 1.05,
      duration: 2.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: 0.5
    })
  }

  // 雨天动画 - 云朵飘动 + 雨滴下落
  const animateRain = () => {
    const cloud = containerRef.current.querySelector('.cloud-icon')
    const raindrops = containerRef.current.querySelectorAll('.raindrop')

    // 云朵轻微移动
    gsap.to(cloud, {
      x: 5,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    })

    // 雨滴下落
    raindrops.forEach((drop, i) => {
      gsap.fromTo(drop,
        { y: -10, opacity: 0 },
        {
          y: 20,
          opacity: 1,
          duration: 0.6,
          repeat: -1,
          delay: i * 0.15,
          ease: 'power1.in',
          onRepeat: () => {
            gsap.set(drop, { y: -10, opacity: 0 })
          }
        }
      )
    })
  }

  // 雪天动画 - 雪花旋转飘落
  const animateSnow = () => {
    const snowflakes = containerRef.current.querySelectorAll('.snowflake')

    snowflakes.forEach((flake, i) => {
      // 飘落
      gsap.fromTo(flake,
        { y: -15, x: 0, opacity: 0, rotation: 0 },
        {
          y: 25,
          x: Math.sin(i) * 10,
          opacity: 1,
          rotation: 360,
          duration: 2 + i * 0.3,
          repeat: -1,
          delay: i * 0.2,
          ease: 'none',
          onRepeat: () => {
            gsap.set(flake, { y: -15, x: 0, opacity: 0, rotation: 0 })
          }
        }
      )
    })
  }

  // 雷暴动画 - 闪电闪烁 + 云朵震动
  const animateThunder = () => {
    const cloud = containerRef.current.querySelector('.cloud-icon')
    const lightning = containerRef.current.querySelector('.lightning')

    // 云朵震动
    gsap.to(cloud, {
      x: 'random(-2, 2)',
      y: 'random(-1, 1)',
      duration: 0.1,
      repeat: -1,
      ease: 'none'
    })

    // 闪电闪烁
    gsap.to(lightning, {
      opacity: 1,
      scale: 1.1,
      duration: 0.1,
      repeat: -1,
      repeatDelay: 2,
      yoyo: true,
      ease: 'steps(1)',
      onRepeat: () => {
        gsap.set(lightning, { opacity: 0, scale: 1 })
        gsap.to(lightning, { opacity: 1, scale: 1.1, duration: 0.1, delay: 0.05 })
        gsap.to(lightning, { opacity: 0, scale: 1, duration: 0.1, delay: 0.15 })
      }
    })
  }

  // 渲染不同天气图标
  const renderIcon = () => {
    const color = '#c9a86c' // 金沙色，符合 Dune 配色

    switch (true) {
      case code === 0 || code === 1:
        return (
          <div style={{ position: 'relative', width: containerSize, height: containerSize }}>
            {/* 太阳光芒 */}
            <svg
              className="sun-rays"
              style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.6
              }}
              viewBox="0 0 100 100"
            >
              {[...Array(8)].map((_, i) => (
                <line
                  key={i}
                  x1="50"
                  y1="50"
                  x2={50 + 35 * Math.cos((i * 45 * Math.PI) / 180)}
                  y2={50 + 35 * Math.sin((i * 45 * Math.PI) / 180)}
                  stroke={color}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              ))}
            </svg>
            {/* 太阳主体 */}
            <div
              className="sun-icon"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            >
              <Sun size={iconSize} color={color} strokeWidth={1.5} />
            </div>
          </div>
        )

      case code === 2 || code === 3:
        return (
          <div
            className="cloud-icon"
            style={{ width: containerSize, height: containerSize, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Cloud size={iconSize} color={color} strokeWidth={1.5} />
          </div>
        )

      case (code >= 51 && code <= 67) || (code >= 80 && code <= 82):
        return (
          <div style={{ position: 'relative', width: containerSize, height: containerSize }}>
            <div
              className="cloud-icon"
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)'
              }}
            >
              <CloudRain size={iconSize} color={color} strokeWidth={1.5} />
            </div>
            {/* 雨滴 */}
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="raindrop"
                style={{
                  position: 'absolute',
                  bottom: 8,
                  left: `${30 + i * 20}%`,
                  width: 2,
                  height: 8,
                  backgroundColor: color,
                  borderRadius: 1,
                  opacity: 0
                }}
              />
            ))}
          </div>
        )

      case (code >= 71 && code <= 77) || (code >= 85 && code <= 86):
        return (
          <div style={{ position: 'relative', width: containerSize, height: containerSize }}>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)'
              }}
            >
              <CloudSnow size={iconSize} color={color} strokeWidth={1.5} />
            </div>
            {/* 雪花 */}
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="snowflake"
                style={{
                  position: 'absolute',
                  bottom: 5,
                  left: `${20 + i * 18}%`,
                  opacity: 0
                }}
              >
                <Snowflake size={10} color={color} />
              </div>
            ))}
          </div>
        )

      case code >= 95 && code <= 99:
        return (
          <div style={{ position: 'relative', width: containerSize, height: containerSize }}>
            <div
              className="cloud-icon"
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)'
              }}
            >
              <CloudLightning size={iconSize} color={color} strokeWidth={1.5} />
            </div>
            {/* 闪电 */}
            <div
              className="lightning"
              style={{
                position: 'absolute',
                bottom: 5,
                left: '50%',
                transform: 'translateX(-50%)',
                opacity: 0
              }}
            >
              <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
                <path
                  d="M9 0L0 14H6L3 24L16 8H9L12 0H9Z"
                  fill="#fbbf24"
                />
              </svg>
            </div>
          </div>
        )

      default:
        return (
          <div
            className="cloud-icon"
            style={{ width: containerSize, height: containerSize, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Cloud size={iconSize} color={color} strokeWidth={1.5} />
          </div>
        )
    }
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: containerSize,
        height: containerSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        willChange: 'transform'
      }}
    >
      {renderIcon()}
    </div>
  )
}

export default AnimatedWeatherIcon
