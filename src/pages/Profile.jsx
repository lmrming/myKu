/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 */
import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import AvatarUploader from '../components/AvatarUploader.jsx'
import { 
  User, 
  Mail, 
  Calendar, 
  MapPin, 
  Heart, 
  Settings, 
  LogOut, 
  Edit2, 
  Camera,
  CheckCircle2,
  Target,
  Flame,
  TrendingUp,
  ChevronRight,
  Shield,
  Download,
  Trash2,
  X,
  Save,
  ArrowRight
} from 'lucide-react'

/* ============================================
   Editorial Magazine Profile Page
   ============================================ */

const SectionLabel = ({ children }) => (
  <span
    style={{
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--font-size-xs)',
      fontWeight: 600,
      letterSpacing: '0.2em',
      textTransform: 'uppercase',
      color: 'var(--color-text-tertiary)',
      display: 'block',
      marginBottom: 'var(--space-4)'
    }}
  >
    {children}
  </span>
)

const Profile = () => {
  const { user: authUser, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({
    totalTodos: 0,
    completedTodos: 0,
    completionRate: 0,
    streakDays: 0,
    totalFocus: 0,
    totalHabits: 0
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [previewAvatar, setPreviewAvatar] = useState(null)

  const avatarOptions = ['👤', '👨', '👩', '🧑', '👦', '👧', '🧔', '👱', '👨‍🦰', '👩‍🦰', '🧑‍🦰', '👨‍🦱', '👩‍🦱']

  useEffect(() => {
    if (authUser) {
      setUser(authUser)
      setEditForm(authUser)
      setIsLoading(false)
      fetchUserStats()
    } else {
      const currentUser = localStorage.getItem('currentUser')
      if (currentUser) {
        const parsed = JSON.parse(currentUser)
        setUser(parsed)
        setEditForm(parsed)
        setIsLoading(false)
        fetchUserStats()
      } else {
        navigate('/login')
      }
    }
  }, [authUser, navigate])

  const fetchUserStats = async () => {
    try {
      const todos = JSON.parse(localStorage.getItem('myku_todos') || '[]')
      const completed = todos.filter(t => t.completed).length
      const total = todos.length
      
      const focusMinutes = parseInt(localStorage.getItem('myku_focus_today') || '0')
      
      const habits = JSON.parse(localStorage.getItem('myku_habits') || '[]')
      
      setStats({
        totalTodos: total,
        completedTodos: completed,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        streakDays: calculateStreak(todos),
        totalFocus: focusMinutes,
        totalHabits: habits.length
      })

      const activities = todos
        .sort((a, b) => new Date(b.createdAt || b.updatedAt) - new Date(a.createdAt || a.updatedAt))
        .slice(0, 5)
        .map(todo => ({
          id: todo.id,
          action: todo.completed ? '完成了任务' : '创建了任务',
          task: todo.task || todo.title,
          time: todo.createdAt || todo.updatedAt,
          icon: todo.completed ? CheckCircle2 : Target
        }))
      setRecentActivity(activities)
    } catch (err) {
      console.error('获取统计数据失败:', err)
    }
  }

  const calculateStreak = (todos) => {
    const completedDates = todos
      .filter(t => t.completed && t.completedAt)
      .map(t => new Date(t.completedAt).toDateString())
    
    const uniqueDates = [...new Set(completedDates)].sort((a, b) => new Date(b) - new Date(a))
    
    let streak = 0
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    
    if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
      streak = 1
      for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i - 1])
        const currDate = new Date(uniqueDates[i])
        const diffDays = (prevDate - currDate) / (1000 * 60 * 60 * 24)
        if (diffDays === 1) {
          streak++
        } else {
          break
        }
      }
    }
    
    return streak
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleEdit = () => {
    setIsEditing(true)
    setEditForm({ ...user })
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditForm({ ...user })
  }

  const handleSaveEdit = async () => {
    try {
      // 更新本地状态
      const result = updateUser(editForm)
      if (result.success) {
        setUser(editForm)
        
        // 同步保存到数据库
        try {
          const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api'
          const userId = await getDbUserId()
          
          if (!userId) {
            console.warn('[Profile] 无法获取用户ID，跳过数据库同步')
            setIsEditing(false)
            return
          }
          
          const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: editForm.username,
              email: editForm.email,
              gender: editForm.gender,
              age: editForm.age,
              birth: editForm.birth,
              address: editForm.address,
              hobbies: editForm.hobbies ? editForm.hobbies.split(',').map(h => h.trim()) : [],
              avatar: editForm.avatar
            })
          })
          
          if (response.ok) {
            console.log('[Profile] 个人资料已同步到数据库')
            const data = await response.json()
            console.log('[Profile] 服务器响应:', data.user)
          } else {
            const error = await response.json()
            console.error('[Profile] 数据库同步失败:', error.error)
          }
        } catch (err) {
          console.error('[Profile] 数据库连接失败:', err.message)
        }
        
        setIsEditing(false)
      }
    } catch (err) {
      console.error('保存失败:', err)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setEditForm(prev => ({ ...prev, [name]: value }))
  }

  const handleAvatarSelect = (avatar) => {
    setPreviewAvatar(avatar)
  }

  // 获取数据库中的用户ID（如果没有的话）
  const getDbUserId = async () => {
    if (user?.id) return user.id
    
    // 根据用户名从数据库查找
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api'
          const response = await fetch(`${API_BASE_URL}/users?username=${encodeURIComponent(user.username)}`)
      if (response.ok) {
        const users = await response.json()
        if (users.length > 0) {
          // 更新本地用户数据，添加 id
          const dbUser = users[0]
          const updatedUser = { ...user, id: dbUser.id }
          updateUser(updatedUser)
          setUser(updatedUser)
          return dbUser.id
        }
      }
    } catch (err) {
      console.warn('[Profile] 获取用户ID失败:', err.message)
    }
    return null
  }

  const handleAvatarSave = async () => {
    if (previewAvatar) {
      const updated = { ...user, avatar: previewAvatar }
      
      // 先更新本地状态
      updateUser(updated)
      setUser(updated)
      
      // 同步保存到数据库
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api'
        const userId = await getDbUserId()
        
        if (!userId) {
          console.warn('[Avatar] 无法获取用户ID，跳过数据库同步')
          setShowAvatarModal(false)
          setPreviewAvatar(null)
          return
        }
        
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar: previewAvatar })
        })
        
        if (response.ok) {
          console.log('[Avatar] 头像已同步到数据库')
          const result = await response.json()
          console.log('[Avatar] 服务器响应:', result.user)
        } else {
          const error = await response.json()
          console.error('[Avatar] 数据库同步失败:', error.error)
        }
      } catch (err) {
        console.error('[Avatar] 数据库连接失败:', err.message)
      }
      
      setShowAvatarModal(false)
      setPreviewAvatar(null)
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewAvatar(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: 'var(--color-bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <LoadingSpinner size={40} />
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: 'var(--color-bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>请先登录</p>
          <Link to="/login" style={{ color: 'var(--color-text-primary)', textDecoration: 'underline' }}>去登录</Link>
        </div>
      </div>
    )
  }

  const labels = {
    username: '用户名',
    gender: '性别',
    age: '年龄',
    birth: '出生年月',
    email: '邮箱地址',
    address: '家庭住址',
    hobbies: '兴趣爱好'
  }

  const tabs = [
    { key: 'overview', label: '概览', icon: User },
    { key: 'profile', label: '资料', icon: Edit2 },
    { key: 'activity', label: '活动', icon: TrendingUp },
    { key: 'settings', label: '设置', icon: Settings },
  ]

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'var(--color-bg-primary)',
      paddingTop: '100px',
      paddingBottom: 'var(--space-16)'
    }}>
      <div className="container" style={{ maxWidth: '1000px' }}>
        
        {/* Header Section - Editorial Style */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <SectionLabel>个人资料</SectionLabel>
          
          <div style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            overflow: 'hidden'
          }}>
            {/* Cover Image */}
            <div style={{
              height: '160px',
              background: 'linear-gradient(135deg, var(--color-ink-8) 0%, var(--color-ink-6) 100%)',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'url(https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1920&q=80)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'grayscale(50%) brightness(0.6)'
              }} />
            </div>
            
            <div style={{ padding: '0 var(--space-6) var(--space-6)' }}>
              {/* Avatar & Actions */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginTop: '-48px',
                marginBottom: 'var(--space-6)'
              }}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                  onClick={() => setShowAvatarModal(true)}
                >
                  <div style={{
                    width: '96px',
                    height: '96px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-paper-1)',
                    border: '4px solid var(--color-paper-1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '48px',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-3)'
                  }}>
                    {user.avatar ? (
                      user.avatar.startsWith('data:') ? (
                        <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        user.avatar
                      )
                    ) : (
                      <User style={{ width: '40px', height: '40px', color: 'var(--color-text-tertiary)' }} />
                    )}
                  </div>
                  <div style={{
                    position: 'absolute',
                    bottom: '-4px',
                    right: '-4px',
                    width: '32px',
                    height: '32px',
                    backgroundColor: 'var(--color-ink-9)',
                    borderRadius: 'var(--radius-full)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-paper-1)',
                    boxShadow: 'var(--shadow-2)'
                  }}>
                    <Camera style={{ width: '16px', height: '16px' }} />
                  </div>
                </motion.div>
                
                <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                  {!isEditing ? (
                    <button
                      onClick={handleEdit}
                      className="btn-secondary"
                      style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                    >
                      <Edit2 style={{ width: '16px', height: '16px' }} />
                      编辑
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleSaveEdit}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                      >
                        <Save style={{ width: '16px', height: '16px' }} />
                        保存
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                      >
                        <X style={{ width: '16px', height: '16px' }} />
                        取消
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* User Info */}
              <div style={{ marginBottom: 'var(--space-8)' }}>
                <h1 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--font-size-3xl)',
                  fontWeight: 500,
                  color: 'var(--color-text-primary)',
                  marginBottom: 'var(--space-2)',
                  letterSpacing: '-0.02em'
                }}>
                  {user.username}
                </h1>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)'
                }}>
                  {user.email}
                </p>
              </div>

              {/* Stats Grid - Editorial */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 'var(--space-4)'
              }}>
                {[
                  { label: '总任务', value: stats.totalTodos, icon: Target },
                  { label: '已完成', value: stats.completedTodos, icon: CheckCircle2 },
                  { label: '连续天数', value: stats.streakDays, icon: Flame },
                  { label: '完成率', value: `${stats.completionRate}%`, icon: TrendingUp }
                ].map((stat, i) => {
                  const Icon = stat.icon
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                      style={{
                        padding: 'var(--space-4)',
                        backgroundColor: 'var(--color-bg-secondary)',
                        borderRadius: 'var(--radius-sm)',
                        textAlign: 'center'
                      }}
                    >
                      <Icon style={{ 
                        width: '20px', 
                        height: '20px', 
                        color: 'var(--color-text-tertiary)',
                        marginBottom: 'var(--space-2)'
                      }} />
                      <div style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'var(--font-size-2xl)',
                        fontWeight: 500,
                        color: 'var(--color-text-primary)',
                        letterSpacing: '-0.02em'
                      }}>
                        {stat.value}
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-tertiary)',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase'
                      }}>
                        {stat.label}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs - Editorial Style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginTop: 'var(--space-8)', marginBottom: 'var(--space-6)' }}
        >
          <div style={{
            display: 'flex',
            gap: 'var(--space-2)',
            borderBottom: '1px solid var(--color-border)'
          }}>
            {tabs.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-3) var(--space-5)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    borderBottom: isActive ? '2px solid var(--color-ink-9)' : '2px solid transparent',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Icon style={{ width: '16px', height: '16px' }} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <SectionLabel>快速访问</SectionLabel>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 'var(--space-4)'
              }}>
                {[
                  { 
                    title: '待办事项', 
                    desc: `${stats.totalTodos - stats.completedTodos} 个待完成`,
                    icon: Target,
                    route: '/todo'
                  },
                  { 
                    title: '习惯追踪', 
                    desc: `${stats.totalHabits} 个习惯`,
                    icon: Flame,
                    route: '/habits'
                  }
                ].map((item, i) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={i}
                      to={item.route}
                      style={{ textDecoration: 'none' }}
                    >
                      <motion.div
                        whileHover={{ y: -4 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                          padding: 'var(--space-6)',
                          backgroundColor: 'var(--color-surface)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-4)'
                        }}
                      >
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--color-bg-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Icon style={{ width: '24px', height: '24px', color: 'var(--color-text-primary)' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 'var(--font-size-lg)',
                            fontWeight: 500,
                            color: 'var(--color-text-primary)',
                            marginBottom: 'var(--space-1)'
                          }}>
                            {item.title}
                          </h4>
                          <p style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--color-text-secondary)'
                          }}>
                            {item.desc}
                          </p>
                        </div>
                        <ArrowRight style={{ width: '20px', height: '20px', color: 'var(--color-text-tertiary)' }} />
                      </motion.div>
                    </Link>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                padding: 'var(--space-6)'
              }}
            >
              <SectionLabel>基本信息</SectionLabel>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {Object.entries(labels).map(([key, label]) => {
                  if (key === 'password') return null
                  const value = isEditing ? editForm[key] : user[key]
                  
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--color-bg-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {key === 'username' && <User style={{ width: '20px', height: '20px', color: 'var(--color-text-tertiary)' }} />}
                        {key === 'email' && <Mail style={{ width: '20px', height: '20px', color: 'var(--color-text-tertiary)' }} />}
                        {key === 'gender' && <User style={{ width: '20px', height: '20px', color: 'var(--color-text-tertiary)' }} />}
                        {key === 'age' && <Calendar style={{ width: '20px', height: '20px', color: 'var(--color-text-tertiary)' }} />}
                        {key === 'birth' && <Calendar style={{ width: '20px', height: '20px', color: 'var(--color-text-tertiary)' }} />}
                        {key === 'address' && <MapPin style={{ width: '20px', height: '20px', color: 'var(--color-text-tertiary)' }} />}
                        {key === 'hobbies' && <Heart style={{ width: '20px', height: '20px', color: 'var(--color-text-tertiary)' }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-text-tertiary)',
                          display: 'block',
                          marginBottom: 'var(--space-1)',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase'
                        }}>
                          {label}
                        </label>
                        {isEditing ? (
                          key === 'gender' ? (
                            <select
                              name={key}
                              value={value || ''}
                              onChange={handleChange}
                              className="input"
                            >
                              <option value="">请选择</option>
                              <option value="男">男</option>
                              <option value="女">女</option>
                              <option value="其他">其他</option>
                            </select>
                          ) : key === 'birth' ? (
                            <input
                              type="month"
                              name={key}
                              value={value || ''}
                              onChange={handleChange}
                              className="input"
                            />
                          ) : (
                            <input
                              type={key === 'age' ? 'number' : 'text'}
                              name={key}
                              value={value || ''}
                              onChange={handleChange}
                              className="input"
                            />
                          )
                        ) : (
                          <div style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: 'var(--font-size-base)',
                            color: 'var(--color-text-primary)'
                          }}>
                            {value || '未填写'}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                padding: 'var(--space-6)'
              }}
            >
              <SectionLabel>最近活动</SectionLabel>
              
              {recentActivity.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {recentActivity.map((activity, index) => {
                    const Icon = activity.icon
                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-4)',
                          padding: 'var(--space-4)',
                          backgroundColor: 'var(--color-bg-secondary)',
                          borderRadius: 'var(--radius-sm)'
                        }}
                      >
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--color-paper-1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Icon style={{ width: '20px', height: '20px', color: 'var(--color-text-primary)' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--color-text-primary)'
                          }}>
                            {activity.action} <span style={{ fontWeight: 500 }}>{activity.task}</span>
                          </div>
                          <div style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--color-text-tertiary)'
                          }}>
                            {new Date(activity.time).toLocaleString('zh-CN')}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                  <TrendingUp style={{ 
                    width: '48px', 
                    height: '48px', 
                    color: 'var(--color-text-tertiary)',
                    margin: '0 auto var(--space-4)'
                  }} />
                  <p style={{ color: 'var(--color-text-secondary)' }}>暂无活动记录</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <SectionLabel>账号设置</SectionLabel>
              
              <div style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                overflow: 'hidden'
              }}>
                {[
                  { icon: Shield, title: '修改密码', desc: '定期更换密码保护账号安全', action: '修改' },
                  { icon: Download, title: '导出数据', desc: '导出所有个人数据', action: '导出' },
                  { icon: Trash2, title: '删除账号', desc: '此操作不可恢复，请谨慎', action: '删除', danger: true }
                ].map((item, i, arr) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--space-4)',
                      borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: item.danger ? 'rgba(231, 76, 60, 0.1)' : 'var(--color-bg-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <item.icon style={{ 
                          width: '20px', 
                          height: '20px', 
                          color: item.danger ? '#e74c3c' : 'var(--color-text-primary)' 
                        }} />
                      </div>
                      <div>
                        <div style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 500,
                          color: item.danger ? '#e74c3c' : 'var(--color-text-primary)'
                        }}>
                          {item.title}
                        </div>
                        <div style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-text-tertiary)'
                        }}>
                          {item.desc}
                        </div>
                      </div>
                    </div>
                    <button
                      className={item.danger ? 'btn-secondary' : 'btn-ghost'}
                      style={{ 
                        fontSize: 'var(--font-size-xs)',
                        color: item.danger ? '#e74c3c' : undefined
                      }}
                    >
                      {item.action}
                    </button>
                  </div>
                ))}
              </div>

              {/* Logout */}
              <motion.button
                onClick={handleLogout}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%',
                  marginTop: 'var(--space-6)',
                  padding: 'var(--space-4)',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 'var(--space-2)',
                  color: '#e74c3c',
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                <LogOut style={{ width: '18px', height: '18px' }} />
                退出登录
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Avatar Modal - 使用新的 AvatarUploader 组件 */}
        <AnimatePresence>
          {showAvatarModal && (
            <AvatarUploader
              currentAvatar={user.avatar}
              onSave={async (avatarData) => {
                // 更新本地状态
                const updated = { ...user, avatar: avatarData }
                updateUser(updated)
                setUser(updated)
                
                // 同步到数据库
                try {
                  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api'
                  const userId = await getDbUserId()
                  
                  if (!userId) {
                    console.warn('[Avatar] 无法获取用户ID，跳过数据库同步')
                    return
                  }
                  
                  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ avatar: avatarData })
                  })
                  
                  if (response.ok) {
                    console.log('[Avatar] 头像已同步到数据库')
                  } else {
                    const error = await response.json()
                    console.error('[Avatar] 数据库同步失败:', error.error)
                    throw new Error(error.error)
                  }
                } catch (err) {
                  console.error('[Avatar] 保存失败:', err)
                  throw err
                }
              }}
              onCancel={() => {
                setShowAvatarModal(false)
                setPreviewAvatar(null)
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default Profile
