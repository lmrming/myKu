import { useState, useEffect, useCallback, useRef } from 'react'

// 性能等级
export const PERFORMANCE_LEVELS = {
  HIGH: 'high',     // 高端设备 - 完整效果
  MEDIUM: 'medium', // 中端设备 - 简化效果
  LOW: 'low',       // 低端设备 - 最小效果
}

// 性能监控 Hook
export const usePerformanceMonitor = () => {
  const [performanceLevel, setPerformanceLevel] = useState(PERFORMANCE_LEVELS.HIGH)
  const [batteryLevel, setBatteryLevel] = useState(100)
  const [isBatterySaving, setIsBatterySaving] = useState(false)
  const frameCount = useRef(0)
  const lastTime = useRef(performance.now())
  const fpsHistory = useRef([])

  // 检测 FPS
  const measureFPS = useCallback(() => {
    const now = performance.now()
    const delta = now - lastTime.current
    
    if (delta >= 1000) {
      const fps = Math.round((frameCount.current * 1000) / delta)
      fpsHistory.current.push(fps)
      
      // 保持最近 5 秒的历史
      if (fpsHistory.current.length > 5) {
        fpsHistory.current.shift()
      }
      
      // 计算平均 FPS
      const avgFPS = fpsHistory.current.reduce((a, b) => a + b, 0) / fpsHistory.current.length
      
      // 根据 FPS 调整性能等级
      if (avgFPS < 30) {
        setPerformanceLevel(PERFORMANCE_LEVELS.LOW)
      } else if (avgFPS < 50) {
        setPerformanceLevel(PERFORMANCE_LEVELS.MEDIUM)
      } else {
        setPerformanceLevel(PERFORMANCE_LEVELS.HIGH)
      }
      
      frameCount.current = 0
      lastTime.current = now
    }
    
    frameCount.current++
    requestAnimationFrame(measureFPS)
  }, [])

  // 监控电池状态
  useEffect(() => {
    const checkBattery = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await navigator.getBattery()
          
          const updateBattery = () => {
            setBatteryLevel(Math.round(battery.level * 100))
            setIsBatterySaving(battery.level < 0.2 || !battery.charging)
            
            // 低电量时降低性能
            if (battery.level < 0.15) {
              setPerformanceLevel(PERFORMANCE_LEVELS.LOW)
            } else if (battery.level < 0.3 && performanceLevel === PERFORMANCE_LEVELS.HIGH) {
              setPerformanceLevel(PERFORMANCE_LEVELS.MEDIUM)
            }
          }
          
          updateBattery()
          battery.addEventListener('levelchange', updateBattery)
          battery.addEventListener('chargingchange', updateBattery)
          
          return () => {
            battery.removeEventListener('levelchange', updateBattery)
            battery.removeEventListener('chargingchange', updateBattery)
          }
        } catch (e) {
          console.log('Battery API not available')
        }
      }
    }
    
    checkBattery()
  }, [])

  // 检测设备类型
  useEffect(() => {
    const checkDevice = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const isLowPower = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4
      
      if (isMobile || isLowPower) {
        setPerformanceLevel(PERFORMANCE_LEVELS.MEDIUM)
      }
    }
    
    checkDevice()
  }, [])

  // 开始 FPS 监控
  useEffect(() => {
    const rafId = requestAnimationFrame(measureFPS)
    return () => cancelAnimationFrame(rafId)
  }, [measureFPS])

  // 获取动画配置
  const getAnimationConfig = useCallback(() => {
    switch (performanceLevel) {
      case PERFORMANCE_LEVELS.LOW:
        return {
          enableOrbs: false,
          enableGrid: false,
          enableFlow: false,
          particleCount: 0,
          frameRate: 15,
          blurAmount: 0,
          enableTransitions: false,
        }
      case PERFORMANCE_LEVELS.MEDIUM:
        return {
          enableOrbs: true,
          enableGrid: false,
          enableFlow: true,
          particleCount: 6,
          frameRate: 30,
          blurAmount: 20,
          enableTransitions: true,
        }
      case PERFORMANCE_LEVELS.HIGH:
      default:
        return {
          enableOrbs: true,
          enableGrid: true,
          enableFlow: true,
          particleCount: 12,
          frameRate: 30,
          blurAmount: 30,
          enableTransitions: true,
        }
    }
  }, [performanceLevel])

  return {
    performanceLevel,
    batteryLevel,
    isBatterySaving,
    getAnimationConfig,
  }
}

export default usePerformanceMonitor
