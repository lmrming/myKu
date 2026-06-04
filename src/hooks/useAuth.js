import { useState, useEffect, useCallback } from 'react'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initAuth = () => {
      try {
        const currentUser = localStorage.getItem('currentUser')
        if (currentUser) {
          const parsedUser = JSON.parse(currentUser)
          if (parsedUser && typeof parsedUser === 'object') {
            setUser(parsedUser)
          } else {
            localStorage.removeItem('currentUser')
          }
        }
      } catch (error) {
        localStorage.removeItem('currentUser')
        console.error('初始化认证状态失败:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()

    const handleStorageChange = (e) => {
      if (e.key === 'currentUser') {
        if (e.newValue) {
          try {
            setUser(JSON.parse(e.newValue))
          } catch (error) {
            localStorage.removeItem('currentUser')
            setUser(null)
            console.error('初始化认证状态失败:', error)
          }
        } else {
          setUser(null)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const login = useCallback((userData) => {
    try {
      localStorage.setItem('currentUser', JSON.stringify(userData))
      setUser(userData)
      return { success: true }
    } catch (error) {
      console.error('登录失败:', error)
      return { success: false, error: '登录失败' }
    }
  }, [])

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('currentUser')
      setUser(null)
      return { success: true }
    } catch (error) {
      console.error('退出登录失败:', error)
      return { success: false, error: '退出登录失败' }
    }
  }, [])

  const updateUser = useCallback((updates) => {
    try {
      const updatedUser = { ...user, ...updates }
      localStorage.setItem('currentUser', JSON.stringify(updatedUser))
      setUser(updatedUser)
      return { success: true }
    } catch (error) {
      console.error('更新用户信息失败:', error)
      return { success: false, error: '更新失败' }
    }
  }, [user])

  return {
    user,
    isLoggedIn: !!user,
    isLoading,
    login,
    logout,
    updateUser
  }
}
