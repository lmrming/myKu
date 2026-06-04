import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useTheme } from '../contexts/ThemeContext.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'

const BARCODE_WIDTHS = [3,1.5,3,1.5,1.5,3,1.5,3,3,1.5,1.5,3,1.5,1.5,3,3,1.5,3,1.5,1.5,3,1.5,3,3,1.5,1.5,3,1.5,3,1.5,1.5,3]
const BARCODE_HEIGHTS = [28,34,24,38,30,26,36,24,32,28,38,26,30,34,24,29,35,27,33,25,37,29,31,26,34,28,30,33,27,35,30,26]

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const timeRef = useRef(new Date())
  const [, forceTick] = useState(0)
  const { login, isLoggedIn } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  useEffect(() => {
    try {
      const raw = localStorage.getItem('currentUser')
      if (!raw) return
      const parsedUser = JSON.parse(raw)
      if (!parsedUser || typeof parsedUser !== 'object') throw new Error('invalid')
    } catch {
      localStorage.removeItem('currentUser')
      setSubmitError('本地登录信息已失效，请重新登录')
    }
  }, [])

  useEffect(() => {
    if (isLoggedIn) navigate('/')
  }, [isLoggedIn, navigate])

  useEffect(() => {
    let rafId
    const tick = () => {
      timeRef.current = new Date()
      rafId = requestAnimationFrame(tick)
      forceTick(n => n + 1)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [])

  const currentTime = timeRef.current

  const formattedTime = useMemo(
    () => currentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [Math.floor(currentTime.getTime() / 1000)]
  )

  const formattedDate = useMemo(
    () => currentTime.toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentTime.toDateString()]
  )

  const validateForm = useCallback(() => {
    const e = {}
    const u = formData.username.trim()
    if (!u) e.username = '请输入用户名'
    else if (u.length < 2) e.username = '用户名至少需要2个字符'
    if (!formData.password) e.password = '请输入密码'
    else if (formData.password.length < 6) e.password = '密码至少需要6个字符'
    setErrors(e)
    return Object.keys(e).length === 0
  }, [formData.username, formData.password])

  const handleChange = useCallback((ev) => {
    const { name, value } = ev.target
    setFormData(p => ({ ...p, [name]: value }))
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }))
    setSubmitError('')
  }, [errors])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    if (!validateForm()) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: formData.username.trim(), password: formData.password })
      })
      const text = await res.text()
      if (!text) throw new Error('服务器返回空响应')
      let data
      try { data = JSON.parse(text) } catch { throw new Error('服务器返回格式错误') }
      if (res.ok) {
        if (!data.user) throw new Error('服务器返回缺少用户信息')
        const result = login(data.user)
        if (result.success) navigate('/')
        else setSubmitError(result.error || '登录状态保存失败')
      } else {
        const map = { 400: '请输入用户名和密码', 401: '用户名或密码错误', 403: '账户已禁用', 500: '服务暂时不可用' }
        setSubmitError(data.error || map[res.status])
      }
    } catch (err) {
      setSubmitError(err instanceof TypeError ? '无法连接到服务' : err.message || '登录失败')
    } finally { setIsLoading(false) }
  }

  if (isLoggedIn) return <LoadingSpinner fullScreen text="正在跳转..." />

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0a0a0a] relative overflow-hidden font-sans">
      {/* ===== Optimized background: single composite layer ===== */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none"
        style={{
          background: `
            radial-gradient(ellipse 600px 600px at 15% 20%, rgba(201,184,150,0.06) 0%, transparent 70%),
            radial-gradient(ellipse 800px 800px at 85% 35%, rgba(26,54,93,0.04) 0%, transparent 60%),
            radial-gradient(ellipse 500px 500px at 45% 85%, rgba(212,165,116,0.03) 0%, transparent 65%),
            radial-gradient(circle 200px at 42% 48%, rgba(37,99,235,0.05) 0%, transparent 70%)
          `,
          willChange: 'transform',
          transform: 'translateZ(0)'
        }}
      />

      {/* ===== Top Navigation Bar ===== */}
      <nav className="relative z-50 flex items-center justify-between px-6 lg:px-12 py-5" style={{ contain: 'layout style' }}>
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 border border-stone-900 dark:border-white/80 flex items-center justify-center transition-colors duration-300 group-hover:bg-stone-900 group-hover:text-white dark:group-hover:bg-white dark:group:hover:text-stone-900">
            <span className="text-sm font-bold tracking-tight">M</span>
          </div>
          <div className="hidden sm:block">
            <span className="text-xs font-semibold tracking-[0.15em] text-stone-900 dark:text-white">my库</span>
            <span className="text-[9px] font-light tracking-[0.25em] text-stone-400 dark:text-stone-500 ml-1.5 uppercase">Magazine</span>
          </div>
        </Link>

        <div className="flex items-center gap-1">
          <button className="w-10 h-10 flex items-center justify-center text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors" aria-label="搜索">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </button>
          <button onClick={toggleTheme} className="w-10 h-10 flex items-center justify-center text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors" aria-label="切换主题">
            {theme === 'light' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            )}
          </button>
          <Link to="/register" className="hidden md:flex items-center px-5 py-2.5 border border-stone-300 dark:border-white/15 text-stone-700 dark:text-white/80 text-xs tracking-wide hover:border-stone-900 dark:hover:border-white/50 transition-colors duration-300">
            注册
          </Link>
          <button className="w-10 h-10 flex flex-col items-center justify-center gap-1.5 group" aria-label="菜单">
            <span className="block w-5 h-[1.5px] bg-stone-700 dark:bg-white/70 transition-all group-hover:w-4"/>
            <span className="block w-4 h-[1.5px] bg-stone-700 dark:bg-white/70 transition-all group-hover:w-5"/>
          </button>
        </div>
      </nav>

      {/* ===== Main Content Grid ===== */}
      <main className="relative z-10 min-h-[calc(100vh-72px)] flex items-center">
        <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-16 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-8 items-center">

            {/* ===== Left Side - Typography Heavy Magazine Layout ===== */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="order-2 lg:order-1 pt-12 lg:pt-0"
              style={{ contain: 'layout style paint' }}
            >
              <div className="flex items-center gap-4 mb-8">
                <span className="text-[10px] font-medium tracking-[0.4em] text-stone-400 dark:text-stone-600 uppercase">Vol. I · Issue 01 · 2026</span>
                <div className="h-px w-16 bg-gradient-to-r from-stone-300 to-transparent dark:from-stone-700 dark:to-transparent"/>
              </div>

              <h1 className="font-serif leading-[0.85] tracking-tight mb-6"
                style={{
                  fontSize: 'clamp(5rem, 12vw, 10rem)',
                  fontFamily: "'Playfair Display', 'Noto Serif SC', 'Didot', 'Bodoni MT', serif",
                  color: '#1a1a2e',
                  willChange: 'auto'
                }}
              >MYKU</h1>

              <p className="text-lg lg:text-xl font-light leading-relaxed max-w-md mb-10 text-stone-600 dark:text-stone-400" style={{ letterSpacing: '0.02em' }}>
                以杂志美学重塑个人效率空间。<br/>记录、规划、成长——一切从这里优雅开始。
              </p>

              <div className="space-y-6 pl-0 lg:pl-2">
                <div className="flex gap-4">
                  <div className="w-px h-20 bg-gradient-to-b from-transparent via-stone-300 to-transparent dark:via-stone-700"/>
                  <blockquote className="text-sm italic text-stone-500 dark:text-stone-500 leading-relaxed max-w-xs" style={{ fontFamily: "'Playfair Display', serif" }}>
                    "The secret of getting ahead is getting started."
                    <footer className="mt-2 not-italic text-[10px] tracking-widest uppercase text-stone-400 dark:text-stone-600">— Mark Twain</footer>
                  </blockquote>
                </div>

                {/* Barcode - pre-computed values, no Math.random() per render */}
                <div className="flex items-end gap-[3px] opacity-20 dark:opacity-10 mt-8" aria-hidden="true">
                  {BARCODE_WIDTHS.map((w, i) => (
                    <div key={i} className="bg-stone-900 dark:bg-white" style={{ width: `${w}px`, height: `${BARCODE_HEIGHTS[i]}px` }}/>
                  ))}
                </div>
              </div>

              <div className="hidden xl:block absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <span className="text-[10px] font-medium tracking-[0.6em] uppercase text-stone-300 dark:text-stone-700"
                  style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                >Personal Productivity · Editorial Design</span>
              </div>
            </motion.div>

            {/* ===== Right Side - Portrait Image + Login Card ===== */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="order-1 lg:order-2 relative"
            >
              {/* Fashion Portrait - lazy loaded */}
              <div className="hidden lg:block absolute inset-y-0 -right-16 w-[55%] overflow-hidden pointer-events-none">
                <img
                  src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=85&auto=format"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover object-top opacity-[0.85]"
                  style={{
                    maskImage: 'linear-gradient(to right, transparent 0%, black 30%, black 100%)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 30%, black 100%)',
                    willChange: 'auto'
                  }}
                />
                <div className="absolute top-[15%] right-[20%] w-[45%] aspect-square rounded-full border border-white/20"
                  style={{ boxShadow: 'inset 0 0 60px rgba(0,0,0,0.15)' }}
                />
              </div>

              {/* ===== Floating Login Card ===== */}
              <div className="relative z-10 max-w-[420px] mx-auto lg:mx-0 lg:ml-auto">
                <div
                  className="relative p-8 sm:p-10"
                  style={{
                    background: theme === 'light' ? 'rgba(255,255,255,0.75)' : 'rgba(26,26,26,0.65)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    borderRadius: '24px',
                    boxShadow: theme === 'light'
                      ? '0 4px 20px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)'
                      : '0 4px 20px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
                    border: `1px solid ${theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`,
                    willChange: 'transform',
                    transform: 'translateZ(0)'
                  }}
                >
                  {/* Card top bar: Clock + Date */}
                  <div className="flex items-start justify-between mb-8">
                    <div><div className="text-[10px] font-medium tracking-[0.2em] uppercase text-stone-400 dark:text-stone-500">{formattedDate}</div></div>
                    <div className="text-right">
                      <div className="font-serif text-2xl font-light tracking-tight text-stone-900 dark:text-white" style={{ fontFamily: "'Playfair Display', 'Didot', serif" }}>{formattedTime}</div>
                      <div className="flex items-center justify-end gap-1.5 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"/>
                        <span className="text-[9px] tracking-wider text-stone-400 dark:text-stone-500 uppercase">Live</span>
                      </div>
                    </div>
                  </div>

                  {/* Title area */}
                  <div className="mb-8">
                    <h2 className="font-serif text-3xl sm:text-[2.1rem] text-stone-900 dark:text-white tracking-tight mb-1.5" style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', 'Didot', serif" }}>欢迎回来</h2>
                    <p className="text-[11px] tracking-[0.2em] uppercase text-stone-400 dark:text-stone-500 font-medium">Welcome Back</p>
                    <div className="mt-5 h-px w-full bg-gradient-to-r from-transparent via-stone-200 dark:via-stone-700 to-transparent"/>
                  </div>

                  {/* Error alert */}
                  <AnimatePresence>
                    {submitError && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -8, height: 0 }}
                        className="mb-5 px-4 py-3 text-xs text-red-600 dark:text-red-400 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30"
                      >{submitError}</motion.div>
                    )}
                  </AnimatePresence>

                  {/* Form */}
                  <form onSubmit={handleSubmit} noValidate className="space-y-5">
                    <div className="space-y-1.5">
                      <label htmlFor="username" className="block text-[10px] tracking-[0.15em] uppercase font-medium text-stone-500 dark:text-stone-400">用户名 / Username</label>
                      <input
                        type="text" id="username" name="username" value={formData.username} onChange={handleChange}
                        placeholder="请输入用户名" disabled={isLoading} autoComplete="username"
                        className={`w-full px-4 py-3.5 rounded-2xl text-sm outline-none transition-all duration-150 placeholder:text-stone-300 dark:placeholder:text-stone-600 ${
                          errors.username
                            ? 'bg-red-50/50 dark:bg-red-950/20 border-red-300 dark:border-red-800 text-stone-900 dark:text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                            : 'bg-white/60 dark:bg-white/[0.06] border-stone-200/80 dark:border-white/10 text-stone-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-white/[0.08]'
                        }`} style={{ border: '1px solid' }}
                      />
                      <AnimatePresence>{errors.username && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[10px] text-red-500 mt-1.5 pl-1">{errors.username}</motion.p>}</AnimatePresence>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="password" className="block text-[10px] tracking-[0.15em] uppercase font-medium text-stone-500 dark:text-stone-400">密码 / Password</label>
                      <input
                        type="password" id="password" name="password" value={formData.password} onChange={handleChange}
                        placeholder="请输入密码" disabled={isLoading} autoComplete="current-password"
                        className={`w-full px-4 py-3.5 rounded-2xl text-sm outline-none transition-all duration-150 placeholder:text-stone-300 dark:placeholder:text-stone-600 ${
                          errors.password
                            ? 'bg-red-50/50 dark:bg-red-950/20 border-red-300 dark:border-red-800 text-stone-900 dark:text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                            : 'bg-white/60 dark:bg-white/[0.06] border-stone-200/80 dark:border-white/10 text-stone-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-white/[0.08]'
                        }`} style={{ border: '1px solid' }}
                      />
                      <AnimatePresence>{errors.password && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[10px] text-red-500 mt-1.5 pl-1">{errors.password}</motion.p>}</AnimatePresence>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer group/select">
                        <div className="w-4 h-4 rounded-md border border-stone-300 dark:border-white/20 group-hover/select:border-stone-400 dark:group-hover/select:border-white/30 flex items-center justify-center">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <svg className="w-2.5 h-2.5 text-blue-500 opacity-0 peer-checked:opacity-100 transition-opacity hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                        </div>
                        <span className="text-[11px] text-stone-500 dark:text-stone-400">记住我</span>
                      </label>
                      <Link to="/forgot" className="text-[11px] text-stone-400 dark:text-stone-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">忘记密码？</Link>
                    </div>

                    <button
                      type="submit" disabled={isLoading}
                      className="relative w-full mt-3 py-4 rounded-2xl text-white font-medium text-sm tracking-wide overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] transition-transform duration-100"
                      style={{
                        background: 'linear-gradient(135deg, #0066CC 0%, #0052A3 50%, #003D7A 100%)',
                        boxShadow: '0 4px 20px rgba(0,102,204,0.35), 0 1px 3px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.15)',
                        willChange: 'transform'
                      }}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {isLoading ? (
                          <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>登录中...</>
                        ) : '登 录'}
                      </span>
                    </button>

                    <div className="flex items-center gap-4 my-5">
                      <div className="flex-1 h-px bg-stone-200 dark:bg-white/10"/>
                      <span className="text-[10px] tracking-[0.2em] uppercase text-stone-400 dark:text-stone-500 font-medium">or</span>
                      <div className="flex-1 h-px bg-stone-200 dark:bg-white/10"/>
                    </div>

                    <div className="text-center pb-1">
                      <p className="text-[12px] text-stone-500 dark:text-stone-400">
                        还没有账户？{' '}
                        <Link to="/register" className="text-blue-600 dark:text-blue-400 font-medium hover:underline underline-offset-3 transition-colors">创建新账户</Link>
                      </p>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* ===== Magazine Footer ===== */}
      <footer className="absolute bottom-5 left-6 lg:left-12 z-10">
        <div className="flex items-center gap-6">
          <span className="text-[9px] tracking-[0.25em] uppercase text-stone-400 dark:text-stone-600">© 2026 MyKu Magazine</span>
          <span className="text-[9px] tracking-widest text-stone-300 dark:text-stone-700">Editorial Design System v1.0</span>
        </div>
      </footer>

      <div className="absolute bottom-5 right-6 lg:right-12 z-10">
        <span className="font-serif text-2xl text-stone-300 dark:text-stone-700" style={{ fontFamily: "'Playfair Display', serif" }}>02</span>
      </div>
    </div>
  )
}

export default Login
