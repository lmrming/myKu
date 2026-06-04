import { useState, useEffect, useCallback, useRef } from 'react'

// 通知 Hook
export const useNotifications = () => {
  const [permission, setPermission] = useState('default')
  const [notifications, setNotifications] = useState([])

  // 请求通知权限
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications')
      return false
    }

    const result = await Notification.requestPermission()
    setPermission(result)
    return result === 'granted'
  }, [])

  // 发送通知
  const sendNotification = useCallback((title, options = {}) => {
    if (permission !== 'granted') return

    const notification = new Notification(title, {
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: Date.now().toString(),
      requireInteraction: false,
      ...options,
    })

    notification.onclick = () => {
      window.focus()
      notification.close()
      options.onClick?.()
    }

    setNotifications(prev => [...prev, notification])
  }, [permission])

  // 检查权限
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  return {
    permission,
    requestPermission,
    sendNotification,
  }
}

// 智能提醒 Hook
export const useSmartReminders = () => {
  const { permission, requestPermission, sendNotification } = useNotifications()
  const [reminders, setReminders] = useState(() => {
    const saved = localStorage.getItem('myku_reminders')
    return saved ? JSON.parse(saved) : []
  })
  const checkInterval = useRef(null)

  // 保存提醒
  useEffect(() => {
    localStorage.setItem('myku_reminders', JSON.stringify(reminders))
  }, [reminders])

  // 添加提醒
  const addReminder = useCallback((reminder) => {
    const newReminder = {
      id: Date.now(),
      enabled: true,
      ...reminder,
    }
    setReminders(prev => [...prev, newReminder])
    return newReminder.id
  }, [])

  // 删除提醒
  const removeReminder = useCallback((id) => {
    setReminders(prev => prev.filter(r => r.id !== id))
  }, [])

  // 切换提醒状态
  const toggleReminder = useCallback((id) => {
    setReminders(prev => prev.map(r => 
      r.id === id ? { ...r, enabled: !r.enabled } : r
    ))
  }, [])

  // 检查提醒
  const checkReminders = useCallback(() => {
    const now = new Date()
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const currentDay = now.getDay()

    reminders.forEach(reminder => {
      if (!reminder.enabled) return

      // 检查时间
      if (reminder.time !== currentTime) return

      // 检查重复
      if (reminder.repeat) {
        if (reminder.repeat === 'daily') {
          // 每天提醒
        } else if (reminder.repeat === 'weekdays' && (currentDay === 0 || currentDay === 6)) {
          return // 周末不提醒
        } else if (Array.isArray(reminder.repeat) && !reminder.repeat.includes(currentDay)) {
          return // 不在指定日期
        }
      }

      // 检查是否已经提醒过（避免重复）
      const lastReminded = reminder.lastReminded
      if (lastReminded) {
        const lastDate = new Date(lastReminded)
        if (lastDate.toDateString() === now.toDateString()) {
          return // 今天已经提醒过
        }
      }

      // 发送通知
      sendNotification(reminder.title, {
        body: reminder.body,
        icon: reminder.icon || '/logo192.png',
      })

      // 更新最后提醒时间
      setReminders(prev => prev.map(r => 
        r.id === reminder.id ? { ...r, lastReminded: now.toISOString() } : r
      ))
    })
  }, [reminders, sendNotification])

  // 定时检查
  useEffect(() => {
    checkInterval.current = setInterval(checkReminders, 30000) // 每30秒检查一次
    return () => clearInterval(checkInterval.current)
  }, [checkReminders])

  // 习惯打卡提醒
  const checkHabitReminders = useCallback((habits) => {
    const now = new Date()
    const currentHour = now.getHours()

    // 早上提醒未打卡的习惯
    if (currentHour === 9) {
      const uncheckedHabits = habits.filter(h => {
        const today = now.toISOString().split('T')[0]
        return !h.completedDates?.includes(today)
      })

      if (uncheckedHabits.length > 0 && permission === 'granted') {
        sendNotification('习惯打卡提醒', {
          body: `你还有 ${uncheckedHabits.length} 个习惯待打卡，加油！`,
          onClick: () => window.location.href = '/habits',
        })
      }
    }
  }, [permission, sendNotification])

  // 专注时间休息提醒
  const focusBreakReminder = useCallback((focusMinutes) => {
    if (focusMinutes >= 25 && permission === 'granted') {
      sendNotification('休息提醒', {
        body: '你已经专注了25分钟，建议休息5分钟，保护眼睛和颈椎',
        onClick: () => window.location.href = '/focus',
      })
    }
  }, [permission, sendNotification])

  // 待办截止提醒
  const checkTodoReminders = useCallback((todos) => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const urgentTodos = todos.filter(todo => {
      if (todo.completed) return false
      if (!todo.dueDate) return false
      
      const dueDate = new Date(todo.dueDate)
      const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60)
      
      return hoursUntilDue > 0 && hoursUntilDue <= 24
    })

    if (urgentTodos.length > 0 && permission === 'granted') {
      // 每天只提醒一次
      const lastTodoReminder = localStorage.getItem('myku_last_todo_reminder')
      if (lastTodoReminder !== now.toDateString()) {
        sendNotification('待办事项提醒', {
          body: `你有 ${urgentTodos.length} 个待办事项即将到期`,
          onClick: () => window.location.href = '/todo',
        })
        localStorage.setItem('myku_last_todo_reminder', now.toDateString())
      }
    }
  }, [permission, sendNotification])

  return {
    permission,
    requestPermission,
    reminders,
    addReminder,
    removeReminder,
    toggleReminder,
    checkHabitReminders,
    focusBreakReminder,
    checkTodoReminders,
  }
}

export default useSmartReminders
