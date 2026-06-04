import React, { useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'

// 环形进度条
export const CircularProgress = ({ 
  percentage, 
  size = 120, 
  strokeWidth = 8, 
  color = '#3B82F6',
  showPercentage = true 
}) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(0,0,0,0.1)"
          className="dark:stroke-white/10"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      {showPercentage && (
        <span className="absolute text-lg font-bold text-gray-900 dark:text-white">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  )
}

// 柱状图
export const BarChart = ({ data, maxValue, height = 150, barColor = '#3B82F6' }) => {
  const chartMax = maxValue || Math.max(...data.map(d => d.value))
  
  return (
    <div className="flex items-end justify-between gap-2 h-full" style={{ height }}>
      {data.map((item, index) => (
        <div key={index} className="flex flex-col items-center flex-1">
          <motion.div
            className="w-full rounded-t-lg"
            style={{ backgroundColor: barColor }}
            initial={{ height: 0 }}
            animate={{ height: (item.value / chartMax) * height }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          />
          <span className="text-xs text-gray-500 mt-2">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

// 折线图
export const LineChart = ({ data, width = 300, height = 150, color = '#3B82F6' }) => {
  const canvasRef = useRef(null)
  
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio, 2)
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    ctx.scale(dpr, dpr)
    
    const maxValue = Math.max(...data.map(d => d.value))
    const minValue = Math.min(...data.map(d => d.value))
    const range = maxValue - minValue || 1
    
    const padding = 20
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2
    
    // 绘制网格线
    ctx.strokeStyle = 'rgba(0,0,0,0.05)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }
    
    // 绘制折线
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    
    data.forEach((point, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth
      const y = padding + chartHeight - ((point.value - minValue) / range) * chartHeight
      
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    
    ctx.stroke()
    
    // 绘制渐变填充
    ctx.lineTo(padding + chartWidth, padding + chartHeight)
    ctx.lineTo(padding, padding + chartHeight)
    ctx.closePath()
    
    const gradient = ctx.createLinearGradient(0, padding, 0, padding + chartHeight)
    gradient.addColorStop(0, color + '40')
    gradient.addColorStop(1, color + '00')
    ctx.fillStyle = gradient
    ctx.fill()
    
    // 绘制数据点
    data.forEach((point, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth
      const y = padding + chartHeight - ((point.value - minValue) / range) * chartHeight
      
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
      
      ctx.beginPath()
      ctx.arc(x, y, 6, 0, Math.PI * 2)
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 2
      ctx.stroke()
    })
  }, [data, width, height, color])
  
  useEffect(() => {
    draw()
  }, [draw])
  
  return <canvas ref={canvasRef} className="w-full" />
}

// 热力图（习惯追踪用）
export const Heatmap = ({ data, color = '#10B981' }) => {
  const getColor = (value) => {
    const opacity = value * 0.2 + 0.1
    return color + Math.floor(opacity * 255).toString(16).padStart(2, '0')
  }
  
  return (
    <div className="grid grid-cols-7 gap-1">
      {data.map((day, index) => (
        <motion.div
          key={index}
          className="aspect-square rounded-md"
          style={{ backgroundColor: getColor(day.value) }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.01 }}
          title={`${day.date}: ${day.value} 次`}
        />
      ))}
    </div>
  )
}

// 迷你趋势图
export const MiniTrend = ({ data, color = '#3B82F6', height = 40 }) => {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = 100 - ((value - min) / range) * 100
    return `${x},${y}`
  }).join(' ')
  
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full" style={{ height }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

// 统计卡片
export const StatCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color = 'blue',
  trend = null 
}) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-500/20 dark:text-green-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
  }
  
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {change && (
            <p className={`text-xs mt-1 ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {change >= 0 ? '+' : ''}{change}% 较上周
            </p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend && (
        <div className="mt-3">
          <MiniTrend data={trend} color={color === 'blue' ? '#3B82F6' : color === 'green' ? '#10B981' : '#EF4444'} />
        </div>
      )}
    </div>
  )
}

export default {
  CircularProgress,
  BarChart,
  LineChart,
  Heatmap,
  MiniTrend,
  StatCard,
}
