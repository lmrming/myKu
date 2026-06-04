import React, { Suspense, lazy, useEffect, memo, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar.jsx'
import LoadingSpinner from './components/LoadingSpinner.jsx'
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp.jsx'
import MouseGlow from './components/MouseGlow.jsx'
import LiquidGlassBackground from './components/LiquidGlassBackground.jsx'
import OfflineIndicator from './components/OfflineIndicator.jsx'
import GlobalSearch from './components/GlobalSearch.jsx'
import DataManager from './components/DataManager.jsx'
import StatisticsDashboard from './components/StatisticsDashboard.jsx'
import NotesErrorBoundary from './components/NotesErrorBoundary.jsx'
import { useTheme } from './contexts/ThemeContext.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts.js'
import usePerformanceMonitor from './hooks/usePerformanceMonitor.js'
import useDynamicTheme from './hooks/useDynamicTheme.js'
import useSmartReminders from './hooks/useNotifications.js'
import useOfflineSupport from './hooks/useOfflineSupport.js'

// 懒加载页面组件
const Home = lazy(() => import('./pages/Home.jsx'))
const Login = lazy(() => import('./pages/Login.jsx'))
const Register = lazy(() => import('./pages/Register.jsx'))
const Profile = lazy(() => import('./pages/Profile.jsx'))
const Todo = lazy(() => import('./pages/Todo.jsx'))
const Weather = lazy(() => import('./pages/Weather.jsx'))
const Backend = lazy(() => import('./pages/Backend.jsx'))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const Calendar = lazy(() => import('./pages/Calendar.jsx'))
const Focus = lazy(() => import('./pages/Focus.jsx'))

const Notes = lazy(() => {
  return new Promise((resolve) => {
    const loadNotes = () => {
      import('./pages/Notes.jsx')
        .then(resolve)
        .catch((error) => {
          console.warn('[Notes] 首次加载失败，1秒后重试...', error.message)
          setTimeout(loadNotes, 1000)
        })
    }
    loadNotes()
  })
})

const Habits = lazy(() => import('./pages/Habits.jsx'))
const Soundscape = lazy(() => import('./pages/Soundscape.jsx'))

// 简化的页面过渡动画 - 仅使用透明度变化，避免复杂的 transform
const PageTransition = memo(({ children }) => {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ 
          duration: 0.15, // 极短的动画时间
          ease: 'linear' // 线性动画更流畅
        }}
        className="w-full"
        style={{ 
          willChange: 'opacity', // 提示浏览器优化
          transform: 'translateZ(0)' // 启用 GPU 加速
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
})

PageTransition.displayName = 'PageTransition'

// 页面包装器
const PageWrapper = memo(({ children }) => (
  <PageTransition>
    {children}
  </PageTransition>
))

PageWrapper.displayName = 'PageWrapper'

// 优化的主内容组件
const AppContent = memo(() => {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const isFullPageLayout = ['/login', '/register'].includes(location.pathname)
  
  // 全局搜索状态
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  // 数据管理状态
  const [isDataManagerOpen, setIsDataManagerOpen] = useState(false)
  // 统计报表状态
  const [isStatsOpen, setIsStatsOpen] = useState(false)
  
  // 使用性能监控
  const { performanceLevel, getAnimationConfig } = usePerformanceMonitor()
  
  // 使用动态主题
  const { theme: dynamicTheme, timeOfDay, getGreeting } = useDynamicTheme()
  
  // 使用智能提醒
  const { permission, requestPermission, checkHabitReminders, checkTodoReminders } = useSmartReminders()
  
  // 使用离线支持
  const { isOnline, wasOffline } = useOfflineSupport()

  // 获取动画配置
  const animationConfig = getAnimationConfig()

  // 请求通知权限
  useEffect(() => {
    if (permission === 'default') {
      requestPermission()
    }
  }, [permission, requestPermission])

  // 监听全局事件
  useEffect(() => {
    const handleOpenSearch = () => setIsSearchOpen(true)
    const handleOpenDataManager = () => setIsDataManagerOpen(true)
    const handleOpenStats = () => setIsStatsOpen(true)

    window.addEventListener('openSearch', handleOpenSearch)
    window.addEventListener('openDataManager', handleOpenDataManager)
    window.addEventListener('openStats', handleOpenStats)

    return () => {
      window.removeEventListener('openSearch', handleOpenSearch)
      window.removeEventListener('openDataManager', handleOpenDataManager)
      window.removeEventListener('openStats', handleOpenStats)
    }
  }, [])

  // 键盘快捷键
  useKeyboardShortcuts({
    'ctrl+h': () => navigate('/'),
    'ctrl+l': () => navigate('/login'),
    'ctrl+r': () => navigate('/register'),
    'ctrl+t': () => navigate('/todo'),
    'ctrl+w': () => navigate('/weather'),
    'ctrl+d': () => navigate('/dashboard'),
    'ctrl+b': () => navigate('/backend'),
    'ctrl+p': () => navigate('/profile'),
    'ctrl+c': () => navigate('/calendar'),
    'ctrl+f': () => navigate('/focus'),
    'ctrl+n': () => navigate('/notes'),
    'ctrl+shift+h': () => navigate('/habits'),
    'ctrl+s': () => navigate('/soundscape'),
    'ctrl+k': () => setIsSearchOpen(true),
    'cmd+k': () => setIsSearchOpen(true),
    'ctrl+e': () => setIsDataManagerOpen(true),
  })

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'dark' : ''}`}>
      {/* 液态玻璃背景 - 根据性能配置调整 */}
      <LiquidGlassBackground 
        enableOrbs={animationConfig.enableOrbs}
        enableGrid={animationConfig.enableGrid}
        enableFlow={animationConfig.enableFlow}
      />
      
      {/* 鼠标跟随光效 - 低性能设备禁用 */}
      {performanceLevel !== 'low' && <MouseGlow />}
      
      {/* 离线状态提示 */}
      <OfflineIndicator isOnline={isOnline} wasOffline={wasOffline} />
      
      {/* 性能等级指示器（开发调试用） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50 px-3 py-1.5 bg-black/70 text-white text-xs rounded-full pointer-events-none">
          性能: {performanceLevel} | 时段: {timeOfDay}
        </div>
      )}
      
      {!isFullPageLayout && <Navbar />}
      <main className="relative z-10">
        <Suspense fallback={<LoadingSpinner size={40} />}>
          <Routes>
            <Route path="/" element={<PageWrapper><Home dynamicTheme={dynamicTheme} getGreeting={getGreeting} /></PageWrapper>} />
            <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
            <Route path="/register" element={<PageWrapper><Register /></PageWrapper>} />
            <Route path="/profile" element={<PageWrapper><Profile /></PageWrapper>} />
            <Route path="/todo" element={<PageWrapper><Todo checkTodoReminders={checkTodoReminders} /></PageWrapper>} />
            <Route path="/weather" element={<PageWrapper><Weather dynamicTheme={dynamicTheme} /></PageWrapper>} />
            <Route path="/backend" element={<PageWrapper><Backend /></PageWrapper>} />
            <Route path="/dashboard" element={<PageWrapper><Dashboard dynamicTheme={dynamicTheme} /></PageWrapper>} />
            <Route path="/calendar" element={<PageWrapper><Calendar /></PageWrapper>} />
            <Route path="/focus" element={<PageWrapper><Focus /></PageWrapper>} />
            <Route path="/notes" element={
              <NotesErrorBoundary>
                <PageWrapper><Notes /></PageWrapper>
              </NotesErrorBoundary>
            } />
            <Route path="/habits" element={<PageWrapper><Habits checkHabitReminders={checkHabitReminders} /></PageWrapper>} />
            <Route path="/soundscape" element={<PageWrapper><Soundscape /></PageWrapper>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      
      {/* 全局搜索 */}
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      
      {/* 数据管理 */}
      <DataManager isOpen={isDataManagerOpen} onClose={() => setIsDataManagerOpen(false)} />
      
      {/* 统计报表 */}
      <StatisticsDashboard isOpen={isStatsOpen} onClose={() => setIsStatsOpen(false)} />
      
      <KeyboardShortcutsHelp />
    </div>
  )
})

AppContent.displayName = 'AppContent'

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  )
}

export default App
