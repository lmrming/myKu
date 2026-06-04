import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion'
import { gsap } from 'gsap'
import {
  Search,
  MapPin,
  Wind,
  Droplets,
  Eye,
  Gauge,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Snowflake,
  Navigation,
  RefreshCw,
  Thermometer,
  X,
  ChevronDown,
  Clock,
  ArrowRight,
  Crosshair,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { useGeolocation } from '../hooks/useGeolocation'
import { 
  usePageEnter, 
  useScrollReveal, 
  useStaggerList,
  useCardHover,
  useCountUp,
  useBlurReveal
} from '../hooks/useGSAPAnimations'
import AnimatedWeatherIcon from '../components/AnimatedWeatherIcon'

// ============================================
// Magazine × e-ink Editorial Style
// Palette: Dune (沙丘) - 适合旅行、天气主题
// ============================================

const PALETTE = {
  bg: '#f5f0e8',           // sand
  text: '#2d2d2d',         // charcoal
  accent: '#c9a86c',       // gold sand
  secondary: '#a89b8c',    // warm gray
  surface: '#faf8f3',      // light sand
  border: '#e5e0d8',       // sand border
  ink: '#1a1a1a',          // soft black
  paper: '#f7f5f0'         // rice paper
}

// 热门城市列表
const POPULAR_CITIES = [
  { name: '北京', lat: 39.9042, lon: 116.4074 },
  { name: '上海', lat: 31.2304, lon: 121.4737 },
  { name: '广州', lat: 23.1291, lon: 113.2644 },
  { name: '深圳', lat: 22.5431, lon: 114.0579 },
  { name: '杭州', lat: 30.2741, lon: 120.1551 },
  { name: '成都', lat: 30.5728, lon: 104.0668 },
  { name: '武汉', lat: 30.5928, lon: 114.3055 },
  { name: '西安', lat: 34.3416, lon: 108.9398 },
]

// 天气图标映射 - 杂志风格简化图标
const getWeatherIcon = (code, size = 'large') => {
  const sizes = {
    large: { wrapper: 'w-32 h-32', icon: 'w-16 h-16' },
    medium: { wrapper: 'w-16 h-16', icon: 'w-8 h-8' },
    small: { wrapper: 'w-10 h-10', icon: 'w-5 h-5' }
  }
  const s = sizes[size]
  
  const iconProps = {
    className: s.icon,
    strokeWidth: 1.5
  }
  
  let IconComponent = Cloud
  let iconColor = PALETTE.secondary
  
  if (code === 0) { IconComponent = Sun; iconColor = PALETTE.accent }
  else if (code === 1 || code === 2) { IconComponent = Sun; iconColor = '#d4a574' }
  else if (code === 3) { IconComponent = Cloud; iconColor = PALETTE.secondary }
  else if (code >= 45 && code <= 48) { IconComponent = Cloud; iconColor = '#8b9a8b' }
  else if (code >= 51 && code <= 67) { IconComponent = CloudRain; iconColor = '#7a8b99' }
  else if (code >= 71 && code <= 77) { IconComponent = Snowflake; iconColor = '#a8c4d9' }
  else if (code >= 80 && code <= 82) { IconComponent = CloudRain; iconColor = '#5a7a8a' }
  else if (code >= 85 && code <= 86) { IconComponent = CloudSnow; iconColor = '#8ba8b8' }
  else if (code >= 95) { IconComponent = CloudLightning; iconColor = '#6b5b73' }
  
  return (
    <div 
      className={s.wrapper}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        border: `1px solid ${PALETTE.border}`,
        backgroundColor: PALETTE.surface
      }}
    >
      <IconComponent {...iconProps} style={{ color: iconColor }} />
    </div>
  )
}

// 天气描述
const getWeatherDesc = (code) => {
  const codes = {
    0: '晴朗', 1: '多云', 2: '多云', 3: '阴天',
    45: '雾', 48: '雾凇',
    51: '毛毛雨', 53: '小雨', 55: '中雨',
    61: '小雨', 63: '中雨', 65: '大雨',
    71: '小雪', 73: '中雪', 75: '大雪',
    95: '雷雨', 96: '雷暴', 99: '强雷暴'
  }
  return codes[code] || '多云'
}

// ============================================
// Editorial Components
// ============================================

// L4: Full Page Image + Overlay - Hero Section
const HeroSection = ({ city, weather, lastUpdate, parallaxY, tempRef }) => (
  <motion.section
    className="gsap-item"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    style={{
      position: 'relative',
      height: '70vh',
      minHeight: '500px',
      overflow: 'hidden',
      backgroundColor: PALETTE.bg
    }}
  >
    {/* Background - Atmospheric gradient based on weather */}
    <motion.div
      style={{
        position: 'absolute',
        inset: 0,
        background: weather?.code === 0 
          ? 'linear-gradient(180deg, #f5e6d3 0%, #f5f0e8 100%)'
          : weather?.code >= 51 
            ? 'linear-gradient(180deg, #d4d8dc 0%, #f5f0e8 100%)'
            : 'linear-gradient(180deg, #e8e4dc 0%, #f5f0e8 100%)',
        y: parallaxY
      }}
    />
    
    {/* Decorative Elements */}
    <div style={{
      position: 'absolute',
      top: '15%',
      left: '10%',
      width: '1px',
      height: '120px',
      backgroundColor: PALETTE.accent
    }} />
    <div style={{
      position: 'absolute',
      top: '20%',
      right: '15%',
      fontFamily: '"IBM Plex Mono", monospace',
      fontSize: '10px',
      letterSpacing: '0.2em',
      color: PALETTE.secondary,
      textTransform: 'uppercase'
    }}>
      Weather Report
    </div>
    
    {/* Main Content Overlay */}
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: PALETTE.bg,
      padding: '64px 48px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Location & Time */}
        <div 
          className="gsap-item"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            marginBottom: '24px'
          }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '12px',
            letterSpacing: '0.1em',
            color: PALETTE.secondary,
            textTransform: 'uppercase'
          }}>
            <MapPin style={{ width: '14px', height: '14px' }} />
            {city}
          </div>
          {lastUpdate && (
            <div style={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '11px',
              color: PALETTE.secondary
            }}>
              {lastUpdate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
        
        {/* Temperature - Display Typography with CountUp */}
        <div 
          className="gsap-item"
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '32px',
            marginBottom: '16px'
          }}>
          <h1 
            ref={tempRef}
            style={{
              fontFamily: '"Noto Serif SC", serif',
              fontSize: 'clamp(80px, 15vw, 140px)',
              fontWeight: 700,
              lineHeight: 0.9,
              color: PALETTE.ink,
              letterSpacing: '-0.03em'
            }}>
            {weather?.temp}°
          </h1>
          <div style={{ paddingBottom: '20px' }}>
            <AnimatedWeatherIcon code={weather?.code} size="large" />
          </div>
        </div>
        
        {/* Weather Description */}
        <div 
          className="gsap-item"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
          <span style={{
            fontFamily: '"Noto Serif SC", serif',
            fontSize: '24px',
            fontWeight: 500,
            color: PALETTE.text
          }}>
            {getWeatherDesc(weather?.code)}
          </span>
          <span style={{
            width: '40px',
            height: '1px',
            backgroundColor: PALETTE.border
          }} />
          <span style={{
            fontFamily: '"Noto Sans SC", sans-serif',
            fontSize: '14px',
            color: PALETTE.secondary
          }}>
            体感 {weather?.feelsLike}°
          </span>
        </div>
      </div>
    </div>
  </motion.section>
)

// L3: Editorial Grid - Forecast
const ForecastGrid = ({ forecast, listRef }) => (
  <section 
    className="gsap-item"
    style={{
      padding: '64px 48px',
      backgroundColor: PALETTE.bg
    }}>
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Section Header */}
      <div 
        className="gsap-item"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '48px'
        }}>
        <span style={{
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '11px',
          letterSpacing: '0.15em',
          color: PALETTE.secondary,
          textTransform: 'uppercase'
        }}>
          07-Day Forecast
        </span>
        <div style={{
          flex: 1,
          height: '1px',
          backgroundColor: PALETTE.border
        }} />
      </div>
      
      {/* Editorial Grid: Date | Icon | Temps */}
      <div 
        ref={listRef}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '2px',
          backgroundColor: PALETTE.border
        }}>
        {forecast.slice(0, 7).map((day, index) => {
          const date = new Date(day.time)
          const isToday = index === 0
          
          return (
            <div
              key={day.time}
              className="stagger-item"
              style={{
                backgroundColor: PALETTE.surface,
                padding: '32px 24px',
                textAlign: 'center',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                gsap.to(e.currentTarget, {
                  y: -8,
                  boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
                  duration: 0.3,
                  ease: 'power2.out'
                })
              }}
              onMouseLeave={(e) => {
                gsap.to(e.currentTarget, {
                  y: 0,
                  boxShadow: '0 0 0 rgba(0,0,0,0)',
                  duration: 0.3,
                  ease: 'power2.out'
                })
              }}
            >
              {/* Date - Narrative Column */}
              <div style={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: '11px',
                letterSpacing: '0.1em',
                color: isToday ? PALETTE.accent : PALETTE.secondary,
                textTransform: 'uppercase',
                marginBottom: '16px'
              }}>
                {isToday ? 'Today' : date.toLocaleDateString('zh-CN', { weekday: 'short' })}
              </div>
              <div style={{
                fontFamily: '"Noto Sans SC", sans-serif',
                fontSize: '13px',
                color: PALETTE.text,
                marginBottom: '24px'
              }}>
                {date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
              </div>
              
              {/* Icon - Visual Column with Animation */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '24px'
              }}>
                <AnimatedWeatherIcon code={day.weatherCode} size="small" />
              </div>
              
              {/* Temps - Metadata Column */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'baseline',
                gap: '12px'
              }}>
                <span style={{
                  fontFamily: '"Noto Serif SC", serif',
                  fontSize: '20px',
                  fontWeight: 600,
                  color: PALETTE.ink
                }}>
                  {Math.round(day.maxTemp)}°
                </span>
                <span style={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: '13px',
                  color: PALETTE.secondary
                }}>
                  {Math.round(day.minTemp)}°
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  </section>
)

// L8: Text + Marginalia - Details
const DetailsSection = ({ weather, city, detailsRef }) => {
  const details = [
    { label: '湿度', value: weather?.humidity, unit: '%', icon: Droplets },
    { label: '风速', value: weather?.windSpeed, unit: 'km/h', icon: Wind },
    { label: '气压', value: Math.round(weather?.pressure), unit: 'hPa', icon: Gauge },
    { label: '能见度', value: (weather?.visibility / 1000).toFixed(1), unit: 'km', icon: Eye },
  ]
  
  return (
    <section 
      ref={detailsRef}
      className="gsap-item"
      style={{
        padding: '64px 48px',
        backgroundColor: PALETTE.paper
      }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 280px',
          gap: '64px',
          alignItems: 'start'
        }}>
          {/* Main Text */}
          <div>
            <h2 style={{
              fontFamily: '"Noto Serif SC", serif',
              fontSize: '32px',
              fontWeight: 600,
              color: PALETTE.ink,
              marginBottom: '24px',
              lineHeight: 1.3
            }}>
              当前天气状况
            </h2>
            <p style={{
              fontFamily: '"Noto Sans SC", sans-serif',
              fontSize: '16px',
              lineHeight: 1.8,
              color: PALETTE.text,
              marginBottom: '32px'
            }}>
              {city} 今日天气{getWeatherDesc(weather?.code)}，
              气温 {weather?.temp}°，体感温度 {weather?.feelsLike}°。
              湿度 {weather?.humidity}%，风速 {weather?.windSpeed} km/h，
              气压 {Math.round(weather?.pressure)} hPa，能见度 {(weather?.visibility / 1000).toFixed(1)} km。
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '12px',
              color: PALETTE.accent
            }}>
              <span>查看详细数据</span>
              <ArrowRight style={{ width: '14px', height: '14px' }} />
            </div>
          </div>
          
          {/* Marginalia - Sidebar */}
          <div style={{
            borderLeft: `1px solid ${PALETTE.border}`,
            paddingLeft: '32px'
          }}>
            <div style={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '10px',
              letterSpacing: '0.15em',
              color: PALETTE.secondary,
              textTransform: 'uppercase',
              marginBottom: '24px'
            }}>
              Data Points
            </div>
            
            {details.map((detail, index) => (
              <div
                key={detail.label}
                className="stagger-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px 0',
                  borderBottom: index < details.length - 1 ? `1px solid ${PALETTE.border}` : 'none',
                  transition: 'transform 0.3s ease, background-color 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  gsap.to(e.currentTarget, {
                    x: 12,
                    backgroundColor: 'rgba(201,168,108,0.08)',
                    duration: 0.25,
                    ease: 'power2.out'
                  })
                }}
                onMouseLeave={(e) => {
                  gsap.to(e.currentTarget, {
                    x: 0,
                    backgroundColor: 'rgba(201,168,108,0)',
                    duration: 0.25,
                    ease: 'power2.out'
                  })
                }}
              >
                <detail.icon style={{ width: '18px', height: '18px', color: PALETTE.secondary }} />
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: '"Noto Sans SC", sans-serif',
                    fontSize: '12px',
                    color: PALETTE.secondary,
                    marginBottom: '4px'
                  }}>
                    {detail.label}
                  </div>
                  <div style={{
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: '18px',
                    color: PALETTE.ink
                  }}>
                    {detail.value}{detail.unit}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// Search Component - Magazine Style
const SearchSection = ({ 
  searchQuery, 
  setSearchQuery, 
  showCityDropdown, 
  setShowCityDropdown,
  selectCity,
  city,
  dropdownRef,
  onLocate,
  isLocating,
  locationStatus,
  permissionStatus
}) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  }}>
    {/* 定位按钮 */}
    <motion.button
      onClick={onLocate}
      disabled={isLocating}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 16px',
        backgroundColor: locationStatus === 'success' ? '#e8f5e9' : 
                        locationStatus === 'error' ? '#ffebee' : 
                        PALETTE.surface,
        border: `1px solid ${locationStatus === 'success' ? '#4caf50' : 
                             locationStatus === 'error' ? '#f44336' : 
                             PALETTE.border}`,
        fontFamily: '"Noto Sans SC", sans-serif',
        fontSize: '13px',
        color: locationStatus === 'success' ? '#2e7d32' : 
               locationStatus === 'error' ? '#c62828' : 
               PALETTE.text,
        cursor: isLocating ? 'wait' : 'pointer',
        transition: 'all 200ms ease',
        opacity: isLocating ? 0.7 : 1
      }}
    >
      {isLocating ? (
        <RefreshCw style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
      ) : locationStatus === 'success' ? (
        <CheckCircle2 style={{ width: '16px', height: '16px' }} />
      ) : locationStatus === 'error' ? (
        <AlertCircle style={{ width: '16px', height: '16px' }} />
      ) : (
        <Crosshair style={{ width: '16px', height: '16px' }} />
      )}
      <span>
        {isLocating ? '定位中...' : 
         locationStatus === 'success' ? '已定位' : 
         locationStatus === 'error' ? '定位失败' : 
         '当前位置'}
      </span>
    </motion.button>
    
    {/* 搜索框 */}
    <div style={{
      position: 'relative',
      width: '240px'
    }} ref={dropdownRef}>
      <form style={{ position: 'relative' }}>
        <Search style={{
          position: 'absolute',
          left: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '18px',
          height: '18px',
          color: PALETTE.secondary
        }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={(e) => {
            setShowCityDropdown(true)
            e.target.style.borderColor = PALETTE.accent
          }}
          onBlur={(e) => {
            e.target.style.borderColor = PALETTE.border
          }}
          placeholder="搜索城市..."
          style={{
            width: '100%',
            padding: '12px 16px 12px 48px',
            backgroundColor: PALETTE.surface,
            border: `1px solid ${PALETTE.border}`,
            fontFamily: '"Noto Sans SC", sans-serif',
            fontSize: '14px',
            color: PALETTE.text,
            outline: 'none',
            transition: 'border-color 200ms ease'
          }}
        />
      </form>
      
      <AnimatePresence>
        {showCityDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              right: 0,
              backgroundColor: PALETTE.surface,
              border: `1px solid ${PALETTE.border}`,
              boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
              zIndex: 100
            }}
          >
            <div style={{
              padding: '12px 16px',
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '10px',
              letterSpacing: '0.1em',
              color: PALETTE.secondary,
              textTransform: 'uppercase',
              borderBottom: `1px solid ${PALETTE.border}`
            }}>
              Popular Cities
            </div>
            {POPULAR_CITIES.map((cityData) => (
              <button
                key={cityData.name}
                onClick={() => selectCity(cityData)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  textAlign: 'left',
                  backgroundColor: city === cityData.name ? PALETTE.paper : 'transparent',
                  border: 'none',
                  fontFamily: '"Noto Sans SC", sans-serif',
                  fontSize: '14px',
                  color: city === cityData.name ? PALETTE.accent : PALETTE.text,
                  cursor: 'pointer',
                  transition: 'background-color 200ms ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
                onMouseEnter={(e) => {
                  if (city !== cityData.name) {
                    e.currentTarget.style.backgroundColor = PALETTE.paper
                  }
                }}
                onMouseLeave={(e) => {
                  if (city !== cityData.name) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                <MapPin style={{ width: '14px', height: '14px' }} />
                {cityData.name}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </div>
)

// ============================================
// Main Component
// ============================================

const Weather = () => {
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [city, setCity] = useState('北京')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCityDropdown, setShowCityDropdown] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isLocating, setIsLocating] = useState(false)
  const [locationStatus, setLocationStatus] = useState('') // 'success' | 'error' | ''
  const dropdownRef = useRef(null)
  const containerRef = useRef(null)
  
  // 使用优化的定位 Hook
  const { 
    location, 
    loading: geoLoading, 
    error: geoError, 
    permissionStatus,
    getCurrentLocation,
    checkPermission 
  } = useGeolocation()
  
  // Parallax scroll effect
  const { scrollY } = useScroll()
  const parallaxY = useTransform(scrollY, [0, 500], [0, 100])
  const smoothParallaxY = useSpring(parallaxY, { stiffness: 100, damping: 30 })

  // 监听网络状态
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // 检查定位权限状态
  useEffect(() => {
    checkPermission()
  }, [checkPermission])

  // 获取天气数据 - 优化版本（5秒超时）
  const fetchWeather = useCallback(async (lat = 39.9042, lon = 116.4074, cityName = '北京') => {
    const startTime = performance.now()
    
    try {
      setLoading(true)
      setError(null)

      // 5秒超时控制
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,pressure_msl,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
      
      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`天气API返回错误: ${response.status}`)
      }
      
      const data = await response.json()
      
      setWeather({
        temp: Math.round(data.current.temperature_2m),
        feelsLike: Math.round(data.current.apparent_temperature),
        humidity: data.current.relative_humidity_2m,
        windSpeed: data.current.wind_speed_10m,
        pressure: data.current.pressure_msl,
        visibility: data.current.visibility,
        code: data.current.weather_code
      })

      setForecast(data.daily.time.map((time, i) => ({
        time,
        maxTemp: data.daily.temperature_2m_max[i],
        minTemp: data.daily.temperature_2m_min[i],
        weatherCode: data.daily.weather_code[i]
      })))

      setCity(cityName)
      setLastUpdate(new Date())
      
      console.log(`天气数据获取成功: ${(performance.now() - startTime).toFixed(0)}ms`)
      
    } catch (err) {
      console.error('天气API失败:', err)
      
      // 使用模拟数据作为降级方案
      setWeather({
        temp: 22,
        feelsLike: 21,
        humidity: 65,
        windSpeed: 8,
        pressure: 1013,
        visibility: 10000,
        code: 1
      })
      
      const mockForecast = []
      for (let i = 0; i < 7; i++) {
        const date = new Date()
        date.setDate(date.getDate() + i)
        mockForecast.push({
          time: date.toISOString().split('T')[0],
          maxTemp: 20 + Math.random() * 8,
          minTemp: 12 + Math.random() * 6,
          weatherCode: [0, 1, 2, 3, 51, 61][Math.floor(Math.random() * 6)]
        })
      }
      setForecast(mockForecast)
      setCity(cityName)
      setLastUpdate(new Date())
      setError('网络连接不稳定，显示模拟数据')
      
    } finally {
      setLoading(false)
    }
  }, [])

  // 选择城市
  const selectCity = (cityData) => {
    setLocationStatus('')
    fetchWeather(cityData.lat, cityData.lon, cityData.name)
    setShowCityDropdown(false)
    setSearchQuery('')
  }

  // 获取当前位置天气 - 优化版本
  const handleGetCurrentLocation = useCallback(async () => {
    setIsLocating(true)
    setLocationStatus('')
    setError(null)

    try {
      // 检查权限
      if (permissionStatus === 'denied') {
        setError('定位权限被拒绝，请在浏览器设置中允许定位，或手动选择城市')
        setLocationStatus('error')
        setIsLocating(false)
        return
      }

      // 执行定位（3秒超时）
      const loc = await getCurrentLocation({ preferGPS: true, fallbackToIP: true })
      
      if (loc) {
        // 确定城市名称
        let cityName = loc.city || '当前位置'
        if (!loc.city && loc.source === 'GPS') {
          cityName = '当前位置'
        }
        
        // 获取天气数据
        await fetchWeather(loc.lat, loc.lon, cityName)
        setLocationStatus('success')
        
        // 3秒后清除成功状态
        setTimeout(() => setLocationStatus(''), 3000)
      }
    } catch (err) {
      console.error('定位失败:', err)
      setError(err.message || '定位失败，请手动选择城市')
      setLocationStatus('error')
    } finally {
      setIsLocating(false)
    }
  }, [getCurrentLocation, fetchWeather, permissionStatus])

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCityDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 初始加载
  useEffect(() => {
    fetchWeather()
  }, [fetchWeather])

  // GSAP 动画 Hooks
  const pageRef = usePageEnter({ duration: 0.6, stagger: 0.08 })
  const forecastListRef = useStaggerList({ stagger: 0.08, duration: 0.5 })
  const detailsRef = useScrollReveal({ start: 'top 85%' })
  const tempRef = useCountUp(weather?.temp || 0, { duration: 1.5, suffix: '°' })
  const blurRef = useBlurReveal({ duration: 0.8 })
  const cardHoverRef = useCardHover()

  if (loading && !weather) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: PALETTE.bg
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '2px',
            height: '60px',
            margin: '0 auto 24px',
            backgroundColor: PALETTE.accent,
            animation: 'pulse 1.5s ease-in-out infinite'
          }} />
          <p style={{
            fontFamily: '"Noto Sans SC", sans-serif',
            fontSize: '14px',
            color: PALETTE.secondary
          }}>
            获取天气中...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div ref={pageRef} style={{
      minHeight: '100vh',
      backgroundColor: PALETTE.bg,
      paddingTop: '72px'
    }}>
      {/* Fixed Header with Search */}
      <div style={{
        position: 'fixed',
        top: '72px',
        left: 0,
        right: 0,
        zIndex: 50,
        padding: '24px 48px',
        backgroundColor: PALETTE.bg,
        borderBottom: `1px solid ${PALETTE.border}`
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '11px',
            letterSpacing: '0.15em',
            color: PALETTE.secondary,
            textTransform: 'uppercase'
          }}>
            Weather Magazine
          </div>
          <SearchSection
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            showCityDropdown={showCityDropdown}
            setShowCityDropdown={setShowCityDropdown}
            selectCity={selectCity}
            city={city}
            dropdownRef={dropdownRef}
            onLocate={handleGetCurrentLocation}
            isLocating={isLocating}
            locationStatus={locationStatus}
            permissionStatus={permissionStatus}
          />
        </div>
      </div>
      
      {/* Spacer for fixed header */}
      <div style={{ height: '80px' }} />
      
      {/* Hero Section with Parallax */}
      <HeroSection 
        city={city} 
        weather={weather} 
        lastUpdate={lastUpdate}
        parallaxY={smoothParallaxY}
        tempRef={tempRef}
      />
      
      {/* Forecast Grid */}
      <ForecastGrid forecast={forecast} listRef={forecastListRef} />
      
      {/* Details Section */}
      <DetailsSection weather={weather} city={city} detailsRef={detailsRef} />
      
      {/* Footer */}
      <footer style={{
        padding: '48px',
        backgroundColor: PALETTE.ink,
        color: PALETTE.paper
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <p style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '11px',
            letterSpacing: '0.1em',
            color: PALETTE.secondary
          }}>
            Data provided by Open-Meteo
          </p>
        </div>
      </footer>
      
      {/* Global Styles for Animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

export default Weather
