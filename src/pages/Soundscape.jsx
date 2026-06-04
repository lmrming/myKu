import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Wind,
  CloudRain,
  Waves,
  Flame,
  Bird,
  Coffee,
  Music,
  Moon,
  Timer,
  X,
  Plus,
  Minus,
  Headphones
} from 'lucide-react'

// 白噪音类型配置
const SOUNDSCAPES = [
  {
    id: 'rain',
    name: '雨声',
    icon: CloudRain,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500',
    description: '轻柔的雨天氛围',
    emoji: '🌧️'
  },
  {
    id: 'waves',
    name: '海浪',
    icon: Waves,
    color: 'from-teal-500 to-blue-500',
    bgColor: 'bg-teal-500',
    description: '舒缓的海浪声',
    emoji: '🌊'
  },
  {
    id: 'wind',
    name: '风声',
    icon: Wind,
    color: 'from-gray-400 to-gray-600',
    bgColor: 'bg-gray-500',
    description: '自然的风声',
    emoji: '🍃'
  },
  {
    id: 'fire',
    name: '篝火',
    icon: Flame,
    color: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-500',
    description: '温暖的篝火声',
    emoji: '🔥'
  },
  {
    id: 'birds',
    name: '鸟鸣',
    icon: Bird,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-500',
    description: '清晨的鸟鸣',
    emoji: '🐦'
  },
  {
    id: 'cafe',
    name: '咖啡馆',
    icon: Coffee,
    color: 'from-amber-600 to-orange-600',
    bgColor: 'bg-amber-600',
    description: '咖啡馆背景音',
    emoji: '☕'
  },
  {
    id: 'night',
    name: '夜晚',
    icon: Moon,
    color: 'from-indigo-500 to-purple-500',
    bgColor: 'bg-indigo-500',
    description: '宁静的夜晚',
    emoji: '🌙'
  },
  {
    id: 'white',
    name: '白噪音',
    icon: Music,
    color: 'from-slate-400 to-slate-600',
    bgColor: 'bg-slate-500',
    description: '经典白噪音',
    emoji: '🎵'
  }
]

// 音频生成器 - 使用 Web Audio API 生成各种环境音效
class SoundGenerator {
  constructor() {
    this.audioContext = null
    this.nodes = []
    this.masterGain = null
  }

  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      this.masterGain = this.audioContext.createGain()
      this.masterGain.connect(this.audioContext.destination)
    }
  }

  setVolume(volume) {
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(volume / 100, this.audioContext.currentTime)
    }
  }

  stop() {
    this.nodes.forEach(node => {
      try {
        if (node.stop) node.stop()
        if (node.disconnect) node.disconnect()
      } catch (e) {}
    })
    this.nodes = []
  }

  // 创建白噪音
  createWhiteNoise() {
    const bufferSize = this.audioContext.sampleRate * 2
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }
    return buffer
  }

  // 创建粉噪音
  createPinkNoise() {
    const bufferSize = this.audioContext.sampleRate * 2
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.96900 * b2 + white * 0.1538520
      b3 = 0.86650 * b3 + white * 0.3104856
      b4 = 0.55000 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.0168980
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362
      data[i] *= 0.11
      b6 = white * 0.115926
    }
    return buffer
  }

  // 创建棕噪音
  createBrownNoise() {
    const bufferSize = this.audioContext.sampleRate * 2
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)
    let lastOut = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      data[i] = (lastOut + (0.02 * white)) / 1.02
      lastOut = data[i]
      data[i] *= 3.5
    }
    return buffer
  }

  // 雨声 - 使用滤波白噪音模拟
  playRain() {
    this.init()
    const noise = this.audioContext.createBufferSource()
    noise.buffer = this.createPinkNoise()
    noise.loop = true

    // 低通滤波器模拟雨声
    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 800
    filter.Q.value = 0.5

    // 增益控制
    const gain = this.audioContext.createGain()
    gain.gain.value = 0.3

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)

    noise.start()
    this.nodes.push(noise, filter, gain)
  }

  // 海浪声 - 使用振荡器和噪声混合
  playWaves() {
    this.init()
    
    // 低频振荡模拟海浪起伏
    const lfo = this.audioContext.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.value = 0.1 // 每10秒一个周期

    const lfoGain = this.audioContext.createGain()
    lfoGain.gain.value = 0.5

    // 粉噪音作为基础
    const noise = this.audioContext.createBufferSource()
    noise.buffer = this.createPinkNoise()
    noise.loop = true

    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 400

    const gain = this.audioContext.createGain()
    gain.gain.value = 0.2

    lfo.connect(lfoGain)
    lfoGain.connect(filter.frequency)
    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)

    lfo.start()
    noise.start()
    this.nodes.push(lfo, noise, filter, gain, lfoGain)
  }

  // 风声 - 使用带通滤波的白噪音
  playWind() {
    this.init()
    const noise = this.audioContext.createBufferSource()
    noise.buffer = this.createPinkNoise()
    noise.loop = true

    // 带通滤波器
    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 600
    filter.Q.value = 0.3

    // 自动增益控制模拟风声起伏
    const gain = this.audioContext.createGain()
    gain.gain.value = 0.15

    // 添加LFO模拟风声变化
    const lfo = this.audioContext.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.value = 0.2
    const lfoGain = this.audioContext.createGain()
    lfoGain.gain.value = 0.1

    lfo.connect(lfoGain)
    lfoGain.connect(gain.gain)
    
    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)

    lfo.start()
    noise.start()
    this.nodes.push(noise, filter, gain, lfo, lfoGain)
  }

  // 篝火声 - 使用爆裂噪声模拟
  playFire() {
    this.init()
    
    // 创建多个随机爆裂声
    const createCrackle = () => {
      const noise = this.audioContext.createBufferSource()
      noise.buffer = this.createBrownNoise()
      
      const filter = this.audioContext.createBiquadFilter()
      filter.type = 'highpass'
      filter.frequency.value = 1000

      const gain = this.audioContext.createGain()
      gain.gain.setValueAtTime(0, this.audioContext.currentTime)
      gain.gain.linearRampToValueAtTime(0.1 + Math.random() * 0.1, this.audioContext.currentTime + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1 + Math.random() * 0.2)

      noise.connect(filter)
      filter.connect(gain)
      gain.connect(this.masterGain)

      noise.start()
      noise.stop(this.audioContext.currentTime + 0.5)
      
      this.nodes.push(noise, filter, gain)
    }

    // 基础火焰声
    const baseNoise = this.audioContext.createBufferSource()
    baseNoise.buffer = this.createBrownNoise()
    baseNoise.loop = true

    const baseFilter = this.audioContext.createBiquadFilter()
    baseFilter.type = 'lowpass'
    baseFilter.frequency.value = 300

    const baseGain = this.audioContext.createGain()
    baseGain.gain.value = 0.1

    baseNoise.connect(baseFilter)
    baseFilter.connect(baseGain)
    baseGain.connect(this.masterGain)

    baseNoise.start()
    this.nodes.push(baseNoise, baseFilter, baseGain)

    // 定时创建爆裂声
    const crackleInterval = setInterval(() => {
      if (Math.random() > 0.3) createCrackle()
    }, 100)

    this.crackleInterval = crackleInterval
  }

  // 鸟鸣声 - 使用高频振荡器
  playBirds() {
    this.init()
    
    const createChirp = () => {
      const osc = this.audioContext.createOscillator()
      osc.type = 'sine'
      
      const gain = this.audioContext.createGain()
      gain.gain.value = 0

      // 随机频率（鸟鸣频率范围）
      const baseFreq = 2000 + Math.random() * 3000
      osc.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime)
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, this.audioContext.currentTime + 0.1)

      // 包络
      gain.gain.setValueAtTime(0, this.audioContext.currentTime)
      gain.gain.linearRampToValueAtTime(0.05, this.audioContext.currentTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15)

      osc.connect(gain)
      gain.connect(this.masterGain)

      osc.start()
      osc.stop(this.audioContext.currentTime + 0.2)
      
      this.nodes.push(osc, gain)
    }

    // 定时创建鸟鸣
    const chirpInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        createChirp()
        // 有时连续叫几声
        if (Math.random() > 0.5) {
          setTimeout(createChirp, 150)
          setTimeout(createChirp, 300)
        }
      }
    }, 800)

    this.chirpInterval = chirpInterval
  }

  // 咖啡馆 - 低频嗡嗡声 + 随机杯盘声
  playCafe() {
    this.init()
    
    // 背景嗡嗡声
    const noise = this.audioContext.createBufferSource()
    noise.buffer = this.createPinkNoise()
    noise.loop = true

    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 200

    const gain = this.audioContext.createGain()
    gain.gain.value = 0.15

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)

    noise.start()
    this.nodes.push(noise, filter, gain)

    // 随机杯盘声
    const createClink = () => {
      const osc = this.audioContext.createOscillator()
      osc.type = 'sine'
      
      const gain = this.audioContext.createGain()
      
      osc.frequency.setValueAtTime(800 + Math.random() * 400, this.audioContext.currentTime)
      osc.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1)

      gain.gain.setValueAtTime(0, this.audioContext.currentTime)
      gain.gain.linearRampToValueAtTime(0.03, this.audioContext.currentTime + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3)

      osc.connect(gain)
      gain.connect(this.masterGain)

      osc.start()
      osc.stop(this.audioContext.currentTime + 0.4)
      
      this.nodes.push(osc, gain)
    }

    const clinkInterval = setInterval(() => {
      if (Math.random() > 0.8) createClink()
    }, 2000)

    this.clinkInterval = clinkInterval
  }

  // 夜晚 - 低频嗡嗡 + 蟋蟀声
  playNight() {
    this.init()
    
    // 背景低频
    const noise = this.audioContext.createBufferSource()
    noise.buffer = this.createBrownNoise()
    noise.loop = true

    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 150

    const gain = this.audioContext.createGain()
    gain.gain.value = 0.2

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)

    noise.start()
    this.nodes.push(noise, filter, gain)

    // 蟋蟀声
    const createCricket = () => {
      const osc = this.audioContext.createOscillator()
      osc.type = 'sine'
      
      const gain = this.audioContext.createGain()
      
      const freq = 3500 + Math.random() * 500
      osc.frequency.value = freq

      // 快速颤音模拟蟋蟀
      const now = this.audioContext.currentTime
      gain.gain.setValueAtTime(0, now)
      
      for (let i = 0; i < 10; i++) {
        gain.gain.linearRampToValueAtTime(0.02, now + i * 0.02)
        gain.gain.linearRampToValueAtTime(0, now + i * 0.02 + 0.01)
      }

      osc.connect(gain)
      gain.connect(this.masterGain)

      osc.start()
      osc.stop(now + 0.5)
      
      this.nodes.push(osc, gain)
    }

    const cricketInterval = setInterval(() => {
      if (Math.random() > 0.4) createCricket()
    }, 600)

    this.cricketInterval = cricketInterval
  }

  // 白噪音
  playWhite() {
    this.init()
    const noise = this.audioContext.createBufferSource()
    noise.buffer = this.createWhiteNoise()
    noise.loop = true

    const gain = this.audioContext.createGain()
    gain.gain.value = 0.2

    noise.connect(gain)
    gain.connect(this.masterGain)

    noise.start()
    this.nodes.push(noise, gain)
  }

  clearIntervals() {
    if (this.crackleInterval) clearInterval(this.crackleInterval)
    if (this.chirpInterval) clearInterval(this.chirpInterval)
    if (this.clinkInterval) clearInterval(this.clinkInterval)
    if (this.cricketInterval) clearInterval(this.cricketInterval)
    this.crackleInterval = null
    this.chirpInterval = null
    this.clinkInterval = null
    this.cricketInterval = null
  }
}

// 音效卡片组件 - iOS 风格
const SoundCard = ({ sound, isActive, isPlaying, volume, onClick, onVolumeChange }) => {
  const Icon = sound.icon
  
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative overflow-hidden cursor-pointer
        rounded-3xl p-6 transition-all duration-300
        ${isActive 
          ? `${sound.bgColor} text-white shadow-lg` 
          : 'bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md'
        }
      `}
    >
      {/* 背景装饰 */}
      <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
        <span className="text-6xl">{sound.emoji}</span>
      </div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-zinc-800'
          }`}>
            <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} />
          </div>
          
          {isActive && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
            >
              {isPlaying ? (
                <div className="flex gap-0.5">
                  <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-1 bg-white rounded-full" />
                  <motion.div animate={{ height: [8, 16, 8] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0.1 }} className="w-1 bg-white rounded-full" />
                  <motion.div animate={{ height: [6, 14, 6] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0.2 }} className="w-1 bg-white rounded-full" />
                </div>
              ) : (
                <Pause className="w-4 h-4 text-white" />
              )}
            </motion.div>
          )}
        </div>
        
        <h3 className={`text-lg font-semibold mb-1 ${isActive ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
          {sound.name}
        </h3>
        <p className={`text-sm ${isActive ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
          {sound.description}
        </p>
        
        {/* 音量控制 */}
        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-3"
          >
            <button
              onClick={(e) => { e.stopPropagation(); onVolumeChange(Math.max(0, volume - 10)) }}
              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <Minus className="w-4 h-4 text-white" />
            </button>
            <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-white rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${volume}%` }}
              />
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onVolumeChange(Math.min(100, volume + 10)) }}
              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
            <span className="text-xs text-white/80 w-8 text-right">{volume}%</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

// 计时器组件 - iOS 风格
const SleepTimer = ({ isOpen, onClose, onSetTimer, activeTimer }) => {
  const [minutes, setMinutes] = useState(30)
  
  if (!isOpen) return null
  
  const presets = [15, 30, 45, 60, 90]
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">定时关闭</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {activeTimer ? (
          <div className="text-center py-4">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              剩余时间: {Math.ceil(activeTimer / 60)} 分钟
            </p>
            <button
              onClick={() => onSetTimer(0)}
              className="px-6 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              取消定时
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                onClick={() => setMinutes(Math.max(5, minutes - 5))}
                className="p-3 rounded-full bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 transition-colors"
              >
                <Minus className="w-5 h-5 text-gray-600" />
              </button>
              <div className="text-4xl font-bold text-gray-900 dark:text-white w-24 text-center">
                {minutes}
              </div>
              <button
                onClick={() => setMinutes(minutes + 5)}
                className="p-3 rounded-full bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 transition-colors"
              >
                <Plus className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <p className="text-center text-gray-500 mb-6">分钟</p>
            
            <div className="flex gap-2 mb-6">
              {presets.map(m => (
                <button
                  key={m}
                  onClick={() => setMinutes(m)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                    minutes === m 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {m}分
                </button>
              ))}
            </div>
            
            <button
              onClick={() => onSetTimer(minutes * 60)}
              className="w-full py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-colors"
            >
              开始定时
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}

const Soundscape = () => {
  const [activeSound, setActiveSound] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(50)
  const [timer, setTimer] = useState(0)
  const [showTimerModal, setShowTimerModal] = useState(false)
  const [timerRemaining, setTimerRemaining] = useState(0)
  
  const soundGeneratorRef = useRef(null)
  const timerIntervalRef = useRef(null)

  // 初始化音频生成器
  useEffect(() => {
    soundGeneratorRef.current = new SoundGenerator()
    return () => {
      if (soundGeneratorRef.current) {
        soundGeneratorRef.current.clearIntervals()
        soundGeneratorRef.current.stop()
      }
    }
  }, [])

  // 播放/暂停音效
  const toggleSound = async (soundId) => {
    const generator = soundGeneratorRef.current
    if (!generator) return

    generator.init()
    
    if (activeSound === soundId) {
      // 切换播放/暂停
      if (isPlaying) {
        generator.clearIntervals()
        generator.stop()
        setIsPlaying(false)
      } else {
        playSoundEffect(soundId)
        setIsPlaying(true)
      }
    } else {
      // 切换音效
      generator.clearIntervals()
      generator.stop()
      setActiveSound(soundId)
      playSoundEffect(soundId)
      setIsPlaying(true)
    }
  }

  // 播放具体音效
  const playSoundEffect = (soundId) => {
    const generator = soundGeneratorRef.current
    if (!generator) return

    generator.setVolume(volume)

    switch (soundId) {
      case 'rain':
        generator.playRain()
        break
      case 'waves':
        generator.playWaves()
        break
      case 'wind':
        generator.playWind()
        break
      case 'fire':
        generator.playFire()
        break
      case 'birds':
        generator.playBirds()
        break
      case 'cafe':
        generator.playCafe()
        break
      case 'night':
        generator.playNight()
        break
      case 'white':
        generator.playWhite()
        break
      default:
        generator.playWhite()
    }
  }

  // 更新音量
  useEffect(() => {
    if (soundGeneratorRef.current) {
      soundGeneratorRef.current.setVolume(volume)
    }
  }, [volume])

  // 定时器逻辑
  useEffect(() => {
    if (timer > 0) {
      setTimerRemaining(timer)
      timerIntervalRef.current = setInterval(() => {
        setTimerRemaining(prev => {
          if (prev <= 1) {
            if (soundGeneratorRef.current) {
              soundGeneratorRef.current.clearIntervals()
              soundGeneratorRef.current.stop()
            }
            setActiveSound(null)
            setIsPlaying(false)
            setTimer(0)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [timer])

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume)
  }

  const handleSetTimer = (seconds) => {
    setTimer(seconds)
    setShowTimerModal(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pt-20 pb-12 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">白噪音</h1>
              <p className="text-gray-500 dark:text-gray-400">专注、放松、助眠的环境音效</p>
            </div>
            <div className="flex items-center gap-3">
              {activeSound && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => setShowTimerModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 rounded-full shadow-sm hover:shadow-md transition-all"
                >
                  <Timer className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  {timer > 0 ? `${Math.ceil(timerRemaining / 60)}分` : '定时'}
                </motion.button>
              )}
              <button
                onClick={() => activeSound ? toggleSound(activeSound) : null}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all
                  ${activeSound 
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
                    : 'bg-gray-200 dark:bg-zinc-800 text-gray-400 cursor-not-allowed'
                  }
                `}
                disabled={!activeSound}
              >
                {isPlaying ? (
                  <><Pause className="w-5 h-5" /> 暂停</>
                ) : (
                  <><Play className="w-5 h-5" /> 播放</>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Volume Control - iOS 风格 */}
        {activeSound && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-white dark:bg-zinc-900 rounded-3xl shadow-sm"
          >
            <div className="flex items-center gap-4">
              <button onClick={() => setVolume(0)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800">
                <VolumeX className="w-5 h-5 text-gray-500" />
              </button>
              <div className="flex-1 h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-blue-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${volume}%` }}
                />
              </div>
              <button onClick={() => setVolume(100)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800">
                <Volume2 className="w-5 h-5 text-gray-500" />
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">{volume}%</span>
            </div>
          </motion.div>
        )}

        {/* Sound Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {SOUNDSCAPES.map((sound, index) => (
            <motion.div
              key={sound.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <SoundCard
                sound={sound}
                isActive={activeSound === sound.id}
                isPlaying={isPlaying && activeSound === sound.id}
                volume={volume}
                onClick={() => toggleSound(sound.id)}
                onVolumeChange={handleVolumeChange}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 rounded-full shadow-sm text-sm text-gray-600 dark:text-gray-400">
            <Headphones className="w-4 h-4" />
            建议使用耳机获得最佳体验
          </div>
        </motion.div>
      </div>

      {/* Timer Modal */}
      <AnimatePresence>
        {showTimerModal && (
          <SleepTimer
            isOpen={showTimerModal}
            onClose={() => setShowTimerModal(false)}
            onSetTimer={handleSetTimer}
            activeTimer={timerRemaining}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default Soundscape
