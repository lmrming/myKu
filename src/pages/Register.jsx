import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    gender: '男',
    age: '',
    birth: '',
    email: '',
    address: '',
    hobbies: []
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/dashboard')
    }
  }, [isLoggedIn, navigate])

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.username.trim()) {
      newErrors.username = '请输入用户名'
    } else if (formData.username.length < 2) {
      newErrors.username = '用户名至少需要2个字符'
    } else if (formData.username.length > 20) {
      newErrors.username = '用户名不能超过20个字符'
    }

    if (!formData.password) {
      newErrors.password = '请输入密码'
    } else if (formData.password.length < 6) {
      newErrors.password = '密码至少需要6个字符'
    } else if (formData.password.length > 20) {
      newErrors.password = '密码不能超过20个字符'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '请确认密码'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致'
    }

    if (!formData.age) {
      newErrors.age = '请输入年龄'
    } else if (isNaN(formData.age) || formData.age < 1 || formData.age > 120) {
      newErrors.age = '请输入有效的年龄（1-120）'
    }

    if (!formData.birth) {
      newErrors.birth = '请选择出生年月'
    }

    if (!formData.email.trim()) {
      newErrors.email = '请输入邮箱地址'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址'
    }

    if (!formData.address.trim()) {
      newErrors.address = '请输入家庭住址'
    } else if (formData.address.length < 5) {
      newErrors.address = '地址至少需要5个字符'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        hobbies: checked 
          ? [...prev.hobbies, value] 
          : prev.hobbies.filter(hobby => hobby !== value)
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
    setSubmitError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    setSubmitSuccess('')
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    
    try {
      const { confirmPassword, ...submitData } = formData
      
      if (submitData.birth && submitData.birth.length === 7) {
        submitData.birth = submitData.birth + '-01'
      }
      
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || '注册失败')
      }
      
      const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]')
      users.push(submitData)
      localStorage.setItem('registeredUsers', JSON.stringify(users))
      
      setSubmitSuccess('注册成功！正在跳转到登录页面...')
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err) {
      setSubmitError(err.message || '注册失败，请稍后重试')
      console.error('注册错误:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoggedIn) {
    return <LoadingSpinner fullScreen text="正在跳转..." />
  }

  const inputClassName = (fieldName) => `
    w-full px-0 py-3 bg-transparent border-0 border-b transition-all duration-300 
    text-stone-800 dark:text-stone-100 placeholder:text-stone-300 dark:placeholder:text-stone-600 
    focus:outline-none focus:ring-0 text-sm
    ${errors[fieldName] 
      ? 'border-red-400 focus:border-red-500' 
      : 'border-stone-300 dark:border-stone-600 focus:border-[#2563eb] dark:focus:border-[#3b82f6]'
    }
  `

  return (
    <div className="min-h-screen bg-[#faf9f7] dark:bg-[#1a1a1a] relative overflow-hidden">
      {/* 背景艺术图片 */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=1920&h=1080&fit=crop&q=80"
          alt="architecture"
          className="w-full h-full object-cover opacity-[0.12] dark:opacity-[0.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#faf9f7]/90 via-transparent to-[#faf9f7]/70 dark:from-[#1a1a1a]/95 dark:to-[#1a1a1a]/80" />
      </div>

      {/* 几何线条装饰 */}
      <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid-register" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-stone-300 dark:text-stone-700 opacity-30"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-register)" />
        <line x1="0" y1="0" x2="40%" y2="100%" className="text-stone-400 dark:text-stone-600 opacity-15" strokeWidth="1" stroke="currentColor"/>
        <line x1="100%" y1="0" x2="60%" y2="100%" className="text-stone-400 dark:text-stone-600 opacity-15" strokeWidth="1" stroke="currentColor"/>
      </svg>

      {/* 杂志编号 */}
      <div className="absolute top-8 left-8 z-10">
        <span className="text-[10px] tracking-[0.4em] text-stone-400 dark:text-stone-500 font-medium">
          ISSUE 01
        </span>
      </div>

      {/* 页码式标识 */}
      <div className="absolute bottom-8 right-8 z-10">
        <span className="text-[10px] tracking-[0.3em] text-stone-400 dark:text-stone-500 font-medium">
          03
        </span>
      </div>

      {/* 竖排装饰文字 */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 z-10 hidden lg:block">
        <span 
          className="text-[11px] tracking-[0.5em] text-stone-300 dark:text-stone-600 font-medium"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        >
          JOIN MYKU
        </span>
      </div>

      {/* 主内容区 */}
      <div className="relative z-10 min-h-screen flex items-center py-12">
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-start">
            
            {/* 左侧 - 大标题区域 */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 lg:sticky lg:top-24"
            >
              {/* 副标题 */}
              <div className="mb-6 flex items-center gap-4">
                <div className="h-px w-12 bg-stone-400 dark:bg-stone-500" />
                <span className="text-[11px] tracking-[0.3em] text-stone-500 dark:text-stone-400 uppercase font-medium">
                  New Member
                </span>
              </div>

              {/* 主标题 - 超大衬线字体 */}
              <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl text-stone-800 dark:text-stone-100 leading-[0.9] tracking-tight">
                <span className="block">创建</span>
                <span className="block text-[#2563eb] dark:text-[#3b82f6] mt-2">账户</span>
              </h1>

              {/* 描述文字 */}
              <p className="mt-8 text-stone-500 dark:text-stone-400 text-sm lg:text-base max-w-sm leading-relaxed font-light">
                加入我们，开启高效生活的新篇章。记录每一个精彩瞬间，规划每一段美好旅程。
              </p>

              {/* 装饰性引用 */}
              <div className="mt-12 hidden lg:block">
                <blockquote className="text-stone-400 dark:text-stone-500 text-xs italic border-l-2 border-stone-300 dark:border-stone-600 pl-4">
                  "Begin anywhere."
                </blockquote>
              </div>

              {/* 已有账户提示 */}
              <div className="mt-12 hidden lg:block">
                <p className="text-[11px] text-stone-400 dark:text-stone-500">
                  已有账户？{' '}
                  <Link 
                    to="/login" 
                    className="text-[#2563eb] dark:text-[#3b82f6] hover:underline underline-offset-4 transition-colors duration-300"
                  >
                    立即登录
                  </Link>
                </p>
              </div>
            </motion.div>

            {/* 右侧 - 注册表单区域 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-6 lg:col-start-7"
            >
              <div className="bg-white/60 dark:bg-stone-800/40 backdrop-blur-sm p-8 lg:p-10 relative">
                {/* 表单边框 - 细线条 */}
                <div className="absolute inset-0 border border-stone-300 dark:border-stone-600" />
                <div className="absolute -top-3 left-8 bg-[#faf9f7] dark:bg-[#1a1a1a] px-2">
                  <span className="text-[10px] tracking-[0.2em] text-stone-400 dark:text-stone-500 uppercase">
                    Registration
                  </span>
                </div>

                {/* 错误提示 */}
                <AnimatePresence>
                  {submitError && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6 text-xs text-red-500 border-l-2 border-red-400 pl-3"
                    >
                      {submitError}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 成功提示 */}
                <AnimatePresence>
                  {submitSuccess && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6 text-xs text-green-600 dark:text-green-400 border-l-2 border-green-400 pl-3"
                    >
                      {submitSuccess}
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} noValidate className="space-y-5 relative">
                  {/* 用户名 */}
                  <div className="space-y-1">
                    <label className="block text-[10px] tracking-[0.2em] text-stone-500 dark:text-stone-400 uppercase font-medium">
                      Username *
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="请输入用户名"
                      className={inputClassName('username')}
                      disabled={isLoading}
                    />
                    <AnimatePresence>
                      {errors.username && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[10px] text-red-500">
                          {errors.username}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 密码 */}
                  <div className="space-y-1">
                    <label className="block text-[10px] tracking-[0.2em] text-stone-500 dark:text-stone-400 uppercase font-medium">
                      Password *
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="6-20位字符"
                      className={inputClassName('password')}
                      disabled={isLoading}
                    />
                    <AnimatePresence>
                      {errors.password && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[10px] text-red-500">
                          {errors.password}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 确认密码 */}
                  <div className="space-y-1">
                    <label className="block text-[10px] tracking-[0.2em] text-stone-500 dark:text-stone-400 uppercase font-medium">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="请再次输入密码"
                      className={inputClassName('confirmPassword')}
                      disabled={isLoading}
                    />
                    <AnimatePresence>
                      {errors.confirmPassword && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[10px] text-red-500">
                          {errors.confirmPassword}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 性别 */}
                  <div className="space-y-2">
                    <label className="block text-[10px] tracking-[0.2em] text-stone-500 dark:text-stone-400 uppercase font-medium">
                      Gender
                    </label>
                    <div className="flex gap-6">
                      {['男', '女', '其他'].map(gender => (
                        <label key={gender} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="radio"
                            name="gender"
                            value={gender}
                            checked={formData.gender === gender}
                            onChange={handleChange}
                            className="text-[#2563eb] focus:ring-[#2563eb] border-stone-300"
                            disabled={isLoading}
                          />
                          <span className="text-sm text-stone-600 dark:text-stone-400 group-hover:text-stone-800 dark:group-hover:text-stone-200 transition-colors">
                            {gender}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 年龄和出生年月 - 两列布局 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] tracking-[0.2em] text-stone-500 dark:text-stone-400 uppercase font-medium">
                        Age *
                      </label>
                      <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleChange}
                        placeholder="年龄"
                        min="1"
                        max="120"
                        className={inputClassName('age')}
                        disabled={isLoading}
                      />
                      <AnimatePresence>
                        {errors.age && (
                          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[10px] text-red-500">
                            {errors.age}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] tracking-[0.2em] text-stone-500 dark:text-stone-400 uppercase font-medium">
                        Birth *
                      </label>
                      <input
                        type="month"
                        name="birth"
                        value={formData.birth}
                        onChange={handleChange}
                        className={inputClassName('birth')}
                        disabled={isLoading}
                      />
                      <AnimatePresence>
                        {errors.birth && (
                          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[10px] text-red-500">
                            {errors.birth}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* 邮箱 */}
                  <div className="space-y-1">
                    <label className="block text-[10px] tracking-[0.2em] text-stone-500 dark:text-stone-400 uppercase font-medium">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="example@email.com"
                      className={inputClassName('email')}
                      disabled={isLoading}
                    />
                    <AnimatePresence>
                      {errors.email && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[10px] text-red-500">
                          {errors.email}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 地址 */}
                  <div className="space-y-1">
                    <label className="block text-[10px] tracking-[0.2em] text-stone-500 dark:text-stone-400 uppercase font-medium">
                      Address *
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="请输入详细住址"
                      rows="2"
                      className={`${inputClassName('address')} resize-none`}
                      disabled={isLoading}
                    />
                    <AnimatePresence>
                      {errors.address && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[10px] text-red-500">
                          {errors.address}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 兴趣爱好 */}
                  <div className="space-y-2">
                    <label className="block text-[10px] tracking-[0.2em] text-stone-500 dark:text-stone-400 uppercase font-medium">
                      Hobbies
                    </label>
                    <div className="flex flex-wrap gap-4">
                      {['阅读', '运动', '音乐', '旅行', '编程'].map(hobby => (
                        <label key={hobby} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            name="hobbies"
                            value={hobby}
                            checked={formData.hobbies.includes(hobby)}
                            onChange={handleChange}
                            className="text-[#2563eb] focus:ring-[#2563eb] border-stone-300 rounded"
                            disabled={isLoading}
                          />
                          <span className="text-sm text-stone-600 dark:text-stone-400 group-hover:text-stone-800 dark:group-hover:text-stone-200 transition-colors">
                            {hobby}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 注册按钮 - 压印质感 */}
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full mt-6 py-4 bg-[#2563eb] dark:bg-[#3b82f6] text-white relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed group"
                    style={{
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.1)'
                    }}
                  >
                    {/* 网点质感 */}
                    <div 
                      className="absolute inset-0 opacity-10"
                      style={{
                        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
                        backgroundSize: '4px 4px'
                      }}
                    />
                    <span className="relative z-10 text-[11px] tracking-[0.3em] uppercase font-medium">
                      {isLoading ? '注册中...' : '提交注册'}
                    </span>
                  </motion.button>

                  {/* 移动端登录链接 */}
                  <div className="pt-4 text-center lg:hidden">
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      已有账户？{' '}
                      <Link 
                        to="/login" 
                        className="text-[#2563eb] dark:text-[#3b82f6] hover:underline underline-offset-4 transition-colors duration-300"
                      >
                        立即登录
                      </Link>
                    </p>
                  </div>
                </form>

                {/* 角落装饰 */}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-r border-b border-stone-400 dark:border-stone-500" />
                <div className="absolute -top-1 -left-1 w-4 h-4 border-l border-t border-stone-400 dark:border-stone-500" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* 底部版权 */}
      <div className="absolute bottom-8 left-8 z-10">
        <p className="text-[9px] tracking-[0.2em] text-stone-400 dark:text-stone-600 uppercase">
          © 2026 MyKu Magazine
        </p>
      </div>
    </div>
  )
}

export default Register
