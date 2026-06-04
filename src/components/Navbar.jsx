/* Hallmark · pre-emit critique: P5 H5 E5 S5 R4 V5 */
import React, { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutGrid, 
  CheckSquare, 
  Calendar, 
  Timer,
  StickyNote,
  Target,
  CloudSun,
  Music,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Search,
  BarChart3,
  Database,
  MoreHorizontal
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import ThemeToggle from './ThemeToggle'
import SyncButton from './SyncButton'

// 主导航项（核心功能）
const mainNavItems = [
  { name: '首页', path: '/', icon: LayoutGrid },
  { name: '待办', path: '/todo', icon: CheckSquare },
  { name: '日历', path: '/calendar', icon: Calendar },
  { name: '专注', path: '/focus', icon: Timer },
]

// 次要导航项（更多功能）
const moreNavItems = [
  { name: '备忘', path: '/notes', icon: StickyNote },
  { name: '习惯', path: '/habits', icon: Target },
  { name: '天气', path: '/weather', icon: CloudSun },
  { name: '白噪音', path: '/soundscape', icon: Music },
]

const Navbar = () => {
  const { user, isLoggedIn, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const userMenuRef = useRef(null)
  const moreMenuRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false)
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setIsMoreMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setIsMobileMenuOpen(false)
    setIsUserMenuOpen(false)
    setIsMoreMenuOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    setIsUserMenuOpen(false)
    navigate('/login')
  }

  // 获取用户头像显示
  const getUserAvatar = () => {
    if (!user) return null
    
    // 如果有头像（emoji 或图片）
    if (user.avatar) {
      if (user.avatar.startsWith('data:')) {
        // 是图片
        return (
          <img 
            src={user.avatar} 
            alt="avatar" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              borderRadius: 'var(--radius-sm)'
            }} 
          />
        )
      } else {
        // 是 emoji
        return (
          <span style={{ fontSize: '16px' }}>{user.avatar}</span>
        )
      }
    }
    
    // 默认显示首字母
    return (
      <span 
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '12px',
          fontWeight: 600
        }}
      >
        {user.username?.charAt(0).toUpperCase() || 'U'}
      </span>
    )
  }

  // 检查当前路径是否在更多菜单中
  const isMoreMenuActive = moreNavItems.some(item => location.pathname === item.path)

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          backgroundColor: scrolled ? 'var(--color-bg-primary)' : 'transparent',
          borderBottom: scrolled ? '1px solid var(--color-border)' : 'none',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          transition: 'all 400ms cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div className="container">
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: '72px'
            }}
          >
            {/* Magazine Logo - Elegant typography */}
            <Link 
              to="/" 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexShrink: 0
              }}
            >
              <div 
                style={{
                  width: '40px',
                  height: '40px',
                  border: '2px solid var(--color-ink-9)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span 
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '18px',
                    fontWeight: 700,
                    color: 'var(--color-text-primary)'
                  }}
                >
                  M
                </span>
              </div>
              <div>
                <span 
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '22px',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    letterSpacing: '-0.02em'
                  }}
                >
                  my库
                </span>
                <span 
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-body)',
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    color: 'var(--color-text-tertiary)'
                  }}
                >
                  Magazine
                </span>
              </div>
            </Link>

            {/* Desktop Navigation - 分层导航 */}
            <div 
              className="hidden xl:flex"
              style={{ 
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                gap: '2px'
              }}
            >
              {/* 主导航 */}
              {mainNavItems.map((item) => {
                const isActive = location.pathname === item.path
                const Icon = item.icon
                
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '10px 14px',
                      fontFamily: 'var(--font-body)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 500,
                      letterSpacing: '0.02em',
                      transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                      color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                      borderBottom: isActive ? '2px solid var(--color-primary-6)' : '2px solid transparent',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </NavLink>
                )
              })}

              {/* 更多菜单 */}
              <div ref={moreMenuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 14px',
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 500,
                    letterSpacing: '0.02em',
                    transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                    color: isMoreMenuActive || isMoreMenuOpen ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    borderBottom: isMoreMenuActive || isMoreMenuOpen ? '2px solid var(--color-primary-6)' : '2px solid transparent',
                    backgroundColor: 'transparent',
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <MoreHorizontal className="w-4 h-4" />
                  <span>更多</span>
                  <ChevronDown 
                    className="w-3 h-3" 
                    style={{
                      transform: isMoreMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 200ms ease'
                    }}
                  />
                </button>

                {/* 更多菜单下拉 */}
                <AnimatePresence>
                  {isMoreMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '180px',
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-3)',
                        overflow: 'hidden',
                        zIndex: 600
                      }}
                    >
                      {moreNavItems.map((item) => {
                        const isActive = location.pathname === item.path
                        const Icon = item.icon
                        
                        return (
                          <NavLink
                            key={item.path}
                            to={item.path}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '12px 16px',
                              fontFamily: 'var(--font-body)',
                              fontSize: 'var(--font-size-sm)',
                              color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                              backgroundColor: isActive ? 'var(--color-bg-secondary)' : 'transparent',
                              transition: 'all 200ms ease'
                            }}
                            onMouseEnter={(e) => {
                              if (!isActive) {
                                e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)'
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isActive) {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }
                            }}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{item.name}</span>
                          </NavLink>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* 中等屏幕导航 (lg-xl) */}
            <div 
              className="hidden lg:flex xl:hidden"
              style={{ 
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                gap: '2px'
              }}
            >
              {/* 中等屏幕只显示核心导航 */}
              {[...mainNavItems, ...moreNavItems].slice(0, 5).map((item) => {
                const isActive = location.pathname === item.path
                const Icon = item.icon
                
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '10px 12px',
                      fontFamily: 'var(--font-body)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 500,
                      transition: 'all 200ms ease',
                      color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                      borderBottom: isActive ? '2px solid var(--color-primary-6)' : '2px solid transparent'
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </NavLink>
                )
              })}
            </div>

            {/* Right Section - Magazine elegant */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {/* Quick actions - 只在 xl 屏幕显示 */}
              <div 
                className="hidden xl:flex"
                style={{ gap: '2px', marginRight: '4px' }}
              >
                {[
                  { icon: Search, title: '搜索', event: 'openSearch' },
                  { icon: BarChart3, title: '统计', event: 'openStats' },
                  { icon: Database, title: '数据', event: 'openDataManager' },
                ].map(({ icon: Icon, title, event }) => (
                  <button
                    key={event}
                    onClick={() => window.dispatchEvent(new CustomEvent(event))}
                    style={{
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 'var(--radius-sm)',
                      transition: 'all 200ms ease',
                      color: 'var(--color-text-secondary)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)'
                      e.currentTarget.style.color = 'var(--color-text-primary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.color = 'var(--color-text-secondary)'
                    }}
                    title={title}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
              
              {/* 数据同步按钮 - 只在登录后显示 */}
              {isLoggedIn && (
                <div className="hidden md:block">
                  <SyncButton />
                </div>
              )}
              
              {/* 中等屏幕只显示搜索按钮 */}
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('openSearch'))}
                className="hidden md:flex xl:hidden"
                style={{
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'all 200ms ease',
                  color: 'var(--color-text-secondary)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)'
                  e.currentTarget.style.color = 'var(--color-text-primary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = 'var(--color-text-secondary)'
                }}
                title="搜索"
              >
                <Search className="w-4 h-4" />
              </button>
              
              <div 
                className="hidden md:block"
                style={{
                  width: '1px',
                  height: '24px',
                  backgroundColor: 'var(--color-border)'
                }}
              />
              
              <ThemeToggle />
              
              {isLoggedIn ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '4px 10px 4px 4px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'transparent',
                      transition: 'all 200ms ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border-strong)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border)'
                    }}
                  >
                    <div 
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: user?.avatar?.startsWith('data:') ? 'transparent' : 'var(--color-ink-9)',
                        color: user?.avatar?.startsWith('data:') ? 'inherit' : 'var(--color-paper-1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--font-display)',
                        fontSize: '12px',
                        fontWeight: 600,
                        overflow: 'hidden'
                      }}
                    >
                      {getUserAvatar()}
                    </div>
                    <ChevronDown 
                      className="w-4 h-4" 
                      style={{
                        color: 'var(--color-text-tertiary)',
                        transform: isUserMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 200ms ease'
                      }}
                    />
                  </button>

                  {/* User Dropdown - Magazine style */}
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: 'calc(100% + 8px)',
                          width: '200px',
                          backgroundColor: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-md)',
                          boxShadow: 'var(--shadow-3)',
                          overflow: 'hidden',
                          zIndex: 600
                        }}
                      >
                        <Link
                          to="/profile"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            fontFamily: 'var(--font-body)',
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--color-text-primary)',
                            transition: 'background-color 200ms ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                        >
                          <User className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                          个人资料
                        </Link>
                        <Link
                          to="/dashboard"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            fontFamily: 'var(--font-body)',
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--color-text-primary)',
                            transition: 'background-color 200ms ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                        >
                          <LayoutGrid className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                          仪表盘
                        </Link>
                        <div 
                          style={{
                            height: '1px',
                            backgroundColor: 'var(--color-border)'
                          }}
                        />
                        <button
                          onClick={handleLogout}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            width: '100%',
                            padding: '12px 16px',
                            fontFamily: 'var(--font-body)',
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--color-error-4)',
                            textAlign: 'left',
                            transition: 'background-color 200ms ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--color-error-1)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                        >
                          <LogOut className="w-4 h-4" />
                          退出登录
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden sm:flex" style={{ gap: '6px' }}>
                  <Link
                    to="/login"
                    style={{
                      padding: '8px 14px',
                      fontFamily: 'var(--font-body)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 500,
                      color: 'var(--color-text-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      transition: 'all 200ms ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--color-text-primary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--color-text-secondary)'
                    }}
                  >
                    登录
                  </Link>
                  <Link
                    to="/register"
                    style={{
                      padding: '8px 14px',
                      fontFamily: 'var(--font-body)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 500,
                      color: 'var(--color-text-inverse)',
                      backgroundColor: 'var(--color-ink-9)',
                      borderRadius: 'var(--radius-sm)',
                      transition: 'all 200ms ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-ink-8)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-ink-9)'
                    }}
                  >
                    注册
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                style={{
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'transparent',
                  transition: 'all 200ms ease'
                }}
                className="lg:hidden"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu - Magazine style */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(13, 11, 10, 0.5)',
                backdropFilter: 'blur(4px)',
                zIndex: 400
              }}
              className="lg:hidden"
            />
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: 'min(340px, 85vw)',
                backgroundColor: 'var(--color-bg-primary)',
                borderLeft: '1px solid var(--color-border)',
                zIndex: 500,
                overflow: 'auto'
              }}
              className="lg:hidden"
            >
              <div style={{ padding: '100px 32px 32px' }}>
                {/* Magazine header in mobile menu */}
                <div style={{ marginBottom: '40px' }}>
                  <span 
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '28px',
                      fontWeight: 600,
                      color: 'var(--color-text-primary)'
                    }}
                  >
                    my库
                  </span>
                  <p 
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.15em',
                      color: 'var(--color-text-tertiary)',
                      marginTop: '4px'
                    }}
                  >
                    Magazine Edition
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {[...mainNavItems, ...moreNavItems].map((item, index) => {
                    const isActive = location.pathname === item.path
                    const Icon = item.icon
                    
                    return (
                      <motion.div
                        key={item.path}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <NavLink
                          to={item.path}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            padding: '16px 0',
                            fontFamily: 'var(--font-body)',
                            fontSize: 'var(--font-size-lg)',
                            fontWeight: 500,
                            transition: 'all 200ms ease',
                            color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                            borderBottom: isActive ? '2px solid var(--color-primary-6)' : 'none'
                          }}
                        >
                          <Icon className="w-5 h-5" />
                          <span>{item.name}</span>
                        </NavLink>
                      </motion.div>
                    )
                  })}
                </div>

                {!isLoggedIn && (
                  <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <Link
                        to="/login"
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '16px',
                          textAlign: 'center',
                          fontFamily: 'var(--font-body)',
                          fontSize: 'var(--font-size-base)',
                          fontWeight: 500,
                          color: 'var(--color-text-primary)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-sm)',
                          transition: 'all 200ms ease'
                        }}
                      >
                        登录
                      </Link>
                      <Link
                        to="/register"
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '16px',
                          textAlign: 'center',
                          fontFamily: 'var(--font-body)',
                          fontSize: 'var(--font-size-base)',
                          fontWeight: 500,
                          color: 'var(--color-text-inverse)',
                          backgroundColor: 'var(--color-ink-9)',
                          borderRadius: 'var(--radius-sm)',
                          transition: 'all 200ms ease'
                        }}
                      >
                        注册
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar
