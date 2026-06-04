import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

// 语言资源
const translations = {
  zh: {
    // 导航栏
    home: '首页',
    login: '登录',
    register: '注册',
    profile: '个人资料',
    dashboard: '仪表盘',
    backend: '后端系统',
    todo: '待办事项',
    weather: '天气查询',
    
    // 首页
    welcome: '欢迎来到 my库',
    intro: '这是一个功能丰富的个人效率工具集，包含待办事项、日历、专注模式、备忘录、习惯追踪、天气和白噪音功能',
    features: '功能特点',
    userAuth: '用户认证',
    userAuthDesc: '安全的登录和注册功能，保护用户信息',
    todoApp: '待办事项',
    todoAppDesc: '管理个人任务，提高工作效率',
    weatherApp: '天气查询',
    weatherAppDesc: '实时查询天气信息，方便出行',
    
    // 登录页
    loginTitle: '账号登录',
    username: '用户名',
    password: '密码',
    loginBtn: '登录',
    registerNew: '注册新账号',
    loginFailed: '登录失败，请检查用户名和密码',
    
    // 注册页
    registerTitle: '用户注册',
    confirmPassword: '确认密码',
    gender: '性别',
    age: '年龄',
    birth: '出生年月',
    email: '邮箱地址',
    address: '家庭住址',
    hobbies: '兴趣爱好',
    submitRegister: '提交注册',
    hasAccount: '已有账号？去登录',
    registerSuccess: '注册成功！',
    registerFailed: '注册失败，请检查网络连接',
    
    // 个人资料
    profileTitle: '个人资料',
    logout: '退出登录',
    loading: '正在加载...',
    
    // 待办事项
    todoTitle: '待办事项',
    addTodo: '添加新的待办事项...',
    addBtn: '添加',
    noTodos: '还没有待办事项',
    noTodosDesc: '点击上方按钮添加新的待办事项',
    completed: '已完成',
    pending: '未完成',
    delete: '删除',
    fetchFailed: '获取待办事项失败',
    addFailed: '添加待办事项失败',
    updateFailed: '更新待办事项失败',
    deleteFailed: '删除待办事项失败',
    
    // 天气查询
    weatherTitle: '天气查询',
    searchCity: '输入城市名称...',
    searchBtn: '搜索',
    searching: '搜索中...',
    weatherFailed: '获取天气信息失败，请检查城市名称是否正确',
    humidity: '湿度',
    pressure: '气压',
    windSpeed: '风速',
    visibility: '能见度',
    
    // 仪表盘
    dashboardTitle: '数据仪表盘',
    totalUsers: '总用户数',
    totalTodos: '总待办数',
    completedTodos: '已完成',
    pendingTodos: '未完成',
    todoCompletion: '待办事项完成率',
    genderDistribution: '用户性别分布',
    ageDistribution: '用户年龄分布',
    weeklyTrend: '每周待办趋势',
    statFailed: '获取统计数据失败',
    
    // 后端管理
    backendTitle: '后端数据管理',
    userManagement: '用户管理',
    todoManagement: '待办事项管理',
    noUserData: '暂无用户数据',
    noTodoData: '暂无待办事项数据',
    confirmDelete: '确定要删除这个用户吗？',
    confirmDeleteTodo: '确定要删除这个待办事项吗？',
    deleteUserFailed: '删除用户失败',
    deleteTodoFailed: '删除待办事项失败',
    
    // 通用
    success: '成功',
    error: '错误',
    warning: '警告',
    info: '信息',
    close: '关闭',
    cancel: '取消',
    confirm: '确认',
    
    // 快捷键
    shortcuts: '键盘快捷键',
    showShortcuts: '显示/隐藏快捷键帮助',
    goHome: '返回首页',
    goLogin: '跳转到登录页',
    goRegister: '跳转到注册页',
    goTodo: '跳转到待办事项',
    goWeather: '跳转到天气查询',
    goDashboard: '跳转到仪表盘',
    goBackend: '跳转到后端管理',
    goProfile: '跳转到个人资料',
    closeModal: '关闭弹窗/返回',
    pressToOpen: '按 Ctrl + / 随时打开此帮助',
    
    // 主题
    darkMode: '深色模式',
    lightMode: '浅色模式',
    toggleTheme: '切换主题',
    
    // 语言
    changeLanguage: '切换语言',
    chinese: '中文',
    english: 'English'
  },
  en: {
    // Navbar
    home: 'Home',
    login: 'Login',
    register: 'Register',
    profile: 'Profile',
    dashboard: 'Dashboard',
    backend: 'Backend',
    todo: 'Todo',
    weather: 'Weather',
    
    // Home
    welcome: 'Welcome to my库',
    intro: 'This is a feature-rich personal productivity toolkit with todo list, calendar, focus mode, notes, habit tracking, weather and soundscape functions',
    features: 'Features',
    userAuth: 'User Authentication',
    userAuthDesc: 'Secure login and registration functions to protect user information',
    todoApp: 'Todo List',
    todoAppDesc: 'Manage personal tasks and improve work efficiency',
    weatherApp: 'Weather Query',
    weatherAppDesc: 'Real-time weather information for convenient travel',
    
    // Login
    loginTitle: 'Account Login',
    username: 'Username',
    password: 'Password',
    loginBtn: 'Login',
    registerNew: 'Register new account',
    loginFailed: 'Login failed, please check username and password',
    
    // Register
    registerTitle: 'User Registration',
    confirmPassword: 'Confirm Password',
    gender: 'Gender',
    age: 'Age',
    birth: 'Date of Birth',
    email: 'Email Address',
    address: 'Home Address',
    hobbies: 'Hobbies',
    submitRegister: 'Submit Registration',
    hasAccount: 'Already have an account? Go to login',
    registerSuccess: 'Registration successful!',
    registerFailed: 'Registration failed, please check network connection',
    
    // Profile
    profileTitle: 'Personal Profile',
    logout: 'Logout',
    loading: 'Loading...',
    
    // Todo
    todoTitle: 'Todo List',
    addTodo: 'Add new todo item...',
    addBtn: 'Add',
    noTodos: 'No todo items yet',
    noTodosDesc: 'Click the button above to add new todo items',
    completed: 'Completed',
    pending: 'Pending',
    delete: 'Delete',
    fetchFailed: 'Failed to fetch todo items',
    addFailed: 'Failed to add todo item',
    updateFailed: 'Failed to update todo item',
    deleteFailed: 'Failed to delete todo item',
    
    // Weather
    weatherTitle: 'Weather Query',
    searchCity: 'Enter city name...',
    searchBtn: 'Search',
    searching: 'Searching...',
    weatherFailed: 'Failed to get weather information, please check city name',
    humidity: 'Humidity',
    pressure: 'Pressure',
    windSpeed: 'Wind Speed',
    visibility: 'Visibility',
    
    // Dashboard
    dashboardTitle: 'Data Dashboard',
    totalUsers: 'Total Users',
    totalTodos: 'Total Todos',
    completedTodos: 'Completed',
    pendingTodos: 'Pending',
    todoCompletion: 'Todo Completion Rate',
    genderDistribution: 'Gender Distribution',
    ageDistribution: 'Age Distribution',
    weeklyTrend: 'Weekly Todo Trend',
    statFailed: 'Failed to get statistics data',
    
    // Backend
    backendTitle: 'Backend Data Management',
    userManagement: 'User Management',
    todoManagement: 'Todo Management',
    noUserData: 'No user data',
    noTodoData: 'No todo data',
    confirmDelete: 'Are you sure you want to delete this user?',
    confirmDeleteTodo: 'Are you sure you want to delete this todo item?',
    deleteUserFailed: 'Failed to delete user',
    deleteTodoFailed: 'Failed to delete todo item',
    
    // Common
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Info',
    close: 'Close',
    cancel: 'Cancel',
    confirm: 'Confirm',
    
    // Shortcuts
    shortcuts: 'Keyboard Shortcuts',
    showShortcuts: 'Show/hide shortcuts help',
    goHome: 'Go to home page',
    goLogin: 'Go to login page',
    goRegister: 'Go to register page',
    goTodo: 'Go to todo list',
    goWeather: 'Go to weather query',
    goDashboard: 'Go to dashboard',
    goBackend: 'Go to backend management',
    goProfile: 'Go to profile page',
    closeModal: 'Close modal/back',
    pressToOpen: 'Press Ctrl + / to open this help at any time',
    
    // Theme
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    toggleTheme: 'Toggle Theme',
    
    // Language
    changeLanguage: 'Change Language',
    chinese: '中文',
    english: 'English'
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || 'zh';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'zh' ? 'en' : 'zh');
  };

  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;