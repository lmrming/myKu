import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * 高性能地理定位 Hook
 * 优化目标：定位时间 <= 3秒，成功率 >= 95%
 */

const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,      // 高精度模式
  timeout: 3000,                 // 3秒超时
  maximumAge: 300000             // 5分钟缓存
}

const IP_GEOLOCATION_SERVICES = [
  {
    name: 'ipapi.co',
    url: 'https://ipapi.co/json/',
    timeout: 2000,
    parser: (data) => ({
      lat: data.latitude,
      lon: data.longitude,
      city: data.city,
      region: data.region,
      country: data.country_name
    })
  },
  {
    name: 'ip-api.com',
    url: 'http://ip-api.com/json/?fields=status,lat,lon,city,regionName,country',
    timeout: 2000,
    parser: (data) => data.status === 'success' ? {
      lat: data.lat,
      lon: data.lon,
      city: data.city,
      region: data.regionName,
      country: data.country
    } : null
  },
  {
    name: 'ipwho.is',
    url: 'https://ipwho.is/',
    timeout: 2000,
    parser: (data) => data.success ? {
      lat: data.latitude,
      lon: data.longitude,
      city: data.city,
      region: data.region,
      country: data.country
    } : null
  }
]

export const useGeolocation = () => {
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [permissionStatus, setPermissionStatus] = useState('prompt')
  const abortControllerRef = useRef(null)
  const timeoutRef = useRef(null)

  // 清理函数
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  // 检查权限状态
  const checkPermission = useCallback(async () => {
    if (!navigator.permissions) return 'prompt'
    
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' })
      setPermissionStatus(result.state)
      
      result.addEventListener('change', () => {
        setPermissionStatus(result.state)
      })
      
      return result.state
    } catch {
      return 'prompt'
    }
  }, [])

  // GPS 定位 - 高精度优先
  const getGPSLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('浏览器不支持地理定位'))
        return
      }

      // 快速超时机制
      const fastTimeout = setTimeout(() => {
        reject(new Error('GPS定位超时，尝试备用方案'))
      }, GEOLOCATION_OPTIONS.timeout)

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(fastTimeout)
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracy: position.coords.accuracy,
            source: 'GPS',
            timestamp: position.timestamp
          })
        },
        (err) => {
          clearTimeout(fastTimeout)
          reject(new Error(getGeolocationErrorMessage(err)))
        },
        GEOLOCATION_OPTIONS
      )
    })
  }, [])

  // IP 定位 - 备用方案
  const getIPLocation = useCallback(async (serviceIndex = 0) => {
    if (serviceIndex >= IP_GEOLOCATION_SERVICES.length) {
      throw new Error('所有IP定位服务均不可用')
    }

    const service = IP_GEOLOCATION_SERVICES[serviceIndex]
    abortControllerRef.current = new AbortController()

    try {
      const timeoutPromise = new Promise((_, reject) => {
        timeoutRef.current = setTimeout(() => {
          reject(new Error(`${service.name} 超时`))
        }, service.timeout)
      })

      const fetchPromise = fetch(service.url, {
        signal: abortControllerRef.current.signal,
        headers: { 'Accept': 'application/json' }
      })

      const response = await Promise.race([fetchPromise, timeoutPromise])
      clearTimeout(timeoutRef.current)

      if (!response.ok) throw new Error(`${service.name} 返回错误`)

      const data = await response.json()
      const parsed = service.parser(data)

      if (!parsed || !parsed.lat || !parsed.lon) {
        throw new Error('无法解析位置数据')
      }

      return {
        ...parsed,
        source: `IP (${service.name})`,
        accuracy: 5000, // IP定位精度约5km
        timestamp: Date.now()
      }
    } catch (err) {
      console.warn(`IP定位 [${service.name}] 失败:`, err.message)
      return getIPLocation(serviceIndex + 1)
    }
  }, [])

  // 主定位函数 - 智能降级策略
  const getCurrentLocation = useCallback(async (options = {}) => {
    const { preferGPS = true, fallbackToIP = true } = options
    
    cleanup()
    setLoading(true)
    setError(null)

    const startTime = performance.now()

    try {
      let locationData = null

      // 策略1: GPS 高精度定位
      if (preferGPS) {
        try {
          locationData = await getGPSLocation()
          console.log(`GPS定位成功: ${(performance.now() - startTime).toFixed(0)}ms`)
        } catch (gpsErr) {
          console.warn('GPS定位失败:', gpsErr.message)
          
          if (!fallbackToIP) {
            throw gpsErr
          }
        }
      }

      // 策略2: IP 定位备用
      if (!locationData && fallbackToIP) {
        try {
          locationData = await getIPLocation()
          console.log(`IP定位成功: ${(performance.now() - startTime).toFixed(0)}ms`)
        } catch (ipErr) {
          console.error('IP定位失败:', ipErr.message)
          throw new Error('无法获取您的位置，请手动选择城市')
        }
      }

      if (!locationData) {
        throw new Error('定位失败')
      }

      setLocation(locationData)
      return locationData

    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
      cleanup()
    }
  }, [cleanup, getGPSLocation, getIPLocation])

  // 反向地理编码 - 获取城市名称
  const reverseGeocode = useCallback(async (lat, lon) => {
    try {
      // 使用 Open-Meteo 的反向地理编码（免费）
      const response = await fetch(
        `https://api.open-meteo.com/v1/search?name=${lat},${lon}&count=1`,
        { signal: abortControllerRef.current?.signal }
      )
      
      if (!response.ok) throw new Error('反向地理编码失败')
      
      const data = await response.json()
      
      if (data.results && data.results.length > 0) {
        return data.results[0].name
      }
      
      return '当前位置'
    } catch {
      return '当前位置'
    }
  }, [])

  // 组件卸载时清理
  useEffect(() => {
    return cleanup
  }, [cleanup])

  return {
    location,
    loading,
    error,
    permissionStatus,
    getCurrentLocation,
    reverseGeocode,
    checkPermission
  }
}

// 错误消息映射
function getGeolocationErrorMessage(error) {
  const messages = {
    1: '定位权限被拒绝，请在浏览器设置中允许定位',
    2: '无法获取位置信息，请检查设备定位功能',
    3: '定位超时，请检查网络连接'
  }
  return messages[error.code] || '定位失败，请重试'
}

export default useGeolocation
