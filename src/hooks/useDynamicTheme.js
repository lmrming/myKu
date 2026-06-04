import { useState, useEffect, useCallback } from 'react'

// 时间段主题配置
const TIME_THEMES = {
  dawn: {
    name: '黎明',
    hours: [5, 6, 7],
    primary: '#FF9A8B',
    secondary: '#FECFEF',
    accent: '#FF6B9D',
    background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    glassColor: 'rgba(255, 154, 139, 0.2)',
    textColor: '#5D4037',
  },
  morning: {
    name: '早晨',
    hours: [8, 9, 10, 11],
    primary: '#4FACFE',
    secondary: '#00F2FE',
    accent: '#43E97B',
    background: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
    glassColor: 'rgba(79, 172, 254, 0.2)',
    textColor: '#1565C0',
  },
  noon: {
    name: '正午',
    hours: [12, 13, 14],
    primary: '#F6D365',
    secondary: '#FDA085',
    accent: '#FF6B6B',
    background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    glassColor: 'rgba(246, 211, 101, 0.2)',
    textColor: '#E65100',
  },
  afternoon: {
    name: '下午',
    hours: [15, 16, 17],
    primary: '#A8EDEA',
    secondary: '#FED6E3',
    accent: '#FF9A9E',
    background: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
    glassColor: 'rgba(168, 237, 234, 0.2)',
    textColor: '#00695C',
  },
  evening: {
    name: '傍晚',
    hours: [18, 19],
    primary: '#FF9A9E',
    secondary: '#FECFEF',
    accent: '#F6D365',
    background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)',
    glassColor: 'rgba(255, 154, 158, 0.2)',
    textColor: '#AD1457',
  },
  night: {
    name: '夜晚',
    hours: [20, 21, 22, 23, 0, 1, 2, 3, 4],
    primary: '#667EEA',
    secondary: '#764BA2',
    accent: '#F093FB',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    glassColor: 'rgba(102, 126, 234, 0.2)',
    textColor: '#E8EAF6',
  },
}

// 天气主题配置
const WEATHER_THEMES = {
  sunny: {
    primary: '#FFD700',
    secondary: '#FFA500',
    accent: '#FF6347',
    glassColor: 'rgba(255, 215, 0, 0.15)',
  },
  cloudy: {
    primary: '#B0C4DE',
    secondary: '#778899',
    accent: '#696969',
    glassColor: 'rgba(176, 196, 222, 0.15)',
  },
  rainy: {
    primary: '#4682B4',
    secondary: '#5F9EA0',
    accent: '#2F4F4F',
    glassColor: 'rgba(70, 130, 180, 0.2)',
  },
  snowy: {
    primary: '#E0FFFF',
    secondary: '#B0E0E6',
    accent: '#87CEEB',
    glassColor: 'rgba(224, 255, 255, 0.25)',
  },
}

export const useDynamicTheme = () => {
  const [currentTheme, setCurrentTheme] = useState(TIME_THEMES.morning)
  const [timeOfDay, setTimeOfDay] = useState('morning')
  const [weatherTheme, setWeatherTheme] = useState(null)
  const [customColors, setCustomColors] = useState(null)

  // 根据时间获取主题
  const getThemeByTime = useCallback(() => {
    const hour = new Date().getHours()
    
    for (const [key, theme] of Object.entries(TIME_THEMES)) {
      if (theme.hours.includes(hour)) {
        return { key, theme }
      }
    }
    
    return { key: 'morning', theme: TIME_THEMES.morning }
  }, [])

  // 更新时间主题
  const updateTimeTheme = useCallback(() => {
    const { key, theme } = getThemeByTime()
    setTimeOfDay(key)
    
    // 如果有自定义颜色，优先使用
    if (customColors) {
      setCurrentTheme({
        ...theme,
        primary: customColors.primary,
        secondary: customColors.secondary,
        accent: customColors.accent,
      })
    } else if (weatherTheme) {
      // 如果有天气主题，混合使用
      setCurrentTheme({
        ...theme,
        primary: weatherTheme.primary,
        secondary: weatherTheme.secondary,
        accent: weatherTheme.accent,
        glassColor: weatherTheme.glassColor,
      })
    } else {
      setCurrentTheme(theme)
    }
  }, [customColors, getThemeByTime, weatherTheme])

  // 设置天气主题
  const setWeather = useCallback((weatherCode) => {
    // WMO Weather interpretation codes
    if (weatherCode === 0 || weatherCode === 1) {
      setWeatherTheme(WEATHER_THEMES.sunny)
    } else if (weatherCode >= 2 && weatherCode <= 48) {
      setWeatherTheme(WEATHER_THEMES.cloudy)
    } else if (weatherCode >= 51 && weatherCode <= 67) {
      setWeatherTheme(WEATHER_THEMES.rainy)
    } else if (weatherCode >= 71 && weatherCode <= 86) {
      setWeatherTheme(WEATHER_THEMES.snowy)
    } else {
      setWeatherTheme(null)
    }
  }, [])

  // 设置自定义颜色
  const setCustomTheme = useCallback((colors) => {
    setCustomColors(colors)
  }, [])

  // 重置为默认
  const resetTheme = useCallback(() => {
    setCustomColors(null)
    setWeatherTheme(null)
  }, [])

  // 定时更新主题
  useEffect(() => {
    updateTimeTheme()
    
    // 每分钟检查一次
    const interval = setInterval(updateTimeTheme, 60000)
    
    return () => clearInterval(interval)
  }, [updateTimeTheme])

  // 监听自定义颜色和天气主题变化
  useEffect(() => {
    updateTimeTheme()
  }, [customColors, weatherTheme, updateTimeTheme])

  // 获取问候语
  const getGreeting = useCallback(() => {
    const greetings = {
      dawn: '早上好，新的一天开始了',
      morning: '上午好，愿你精神饱满',
      noon: '中午好，记得休息一下',
      afternoon: '下午好，继续加油',
      evening: '晚上好，享受美好时光',
      night: '夜深了，早点休息',
    }
    return greetings[timeOfDay] || '你好'
  }, [timeOfDay])

  return {
    theme: currentTheme,
    timeOfDay,
    setWeather,
    setCustomTheme,
    resetTheme,
    getGreeting,
    isCustom: !!customColors,
    isWeather: !!weatherTheme,
  }
}

export default useDynamicTheme
