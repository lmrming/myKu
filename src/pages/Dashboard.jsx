import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area
} from 'recharts';
import { Users, CheckCircle2, ClipboardList, Clock, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    users: [],
    todos: [],
    userCount: 0,
    todoCount: 0,
    completedTodos: 0,
    pendingTodos: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, todosRes] = await Promise.all([
          axios.get('/api/users'),
          axios.get('/api/todos')
        ]);

        const users = usersRes.data;
        const todos = todosRes.data;

        setStats({
          users,
          todos,
          userCount: users.length,
          todoCount: todos.length,
          completedTodos: todos.filter(t => t.completed).length,
          pendingTodos: todos.filter(t => !t.completed).length
        });
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // 数据配置
  const todoStatusData = [
    { name: '已完成', value: stats.completedTodos, color: '#34d399' },
    { name: '未完成', value: stats.pendingTodos, color: '#fbbf24' }
  ];

  const genderData = [
    { name: '男', count: stats.users.filter(u => u.gender === '男').length },
    { name: '女', count: stats.users.filter(u => u.gender === '女').length },
    { name: '其他', count: stats.users.filter(u => u.gender === '其他').length }
  ];

  const ageGroups = [
    { name: '18-25', count: stats.users.filter(u => u.age >= 18 && u.age <= 25).length },
    { name: '26-35', count: stats.users.filter(u => u.age >= 26 && u.age <= 35).length },
    { name: '36-45', count: stats.users.filter(u => u.age >= 36 && u.age <= 45).length },
    { name: '46+', count: stats.users.filter(u => u.age >= 46).length }
  ];

  const weeklyData = [
    { day: '周一', completed: 5, created: 8 },
    { day: '周二', completed: 7, created: 6 },
    { day: '周三', completed: 4, created: 9 },
    { day: '周四', completed: 8, created: 5 },
    { day: '周五', completed: 6, created: 7 },
    { day: '周六', completed: 3, created: 4 },
    { day: '周日', completed: 2, created: 3 }
  ];

  const statCards = [
    { title: '用户', value: stats.userCount, icon: Users, color: '#3b82f6', lightColor: '#dbeafe', subtext: '总计' },
    { title: '待办', value: stats.todoCount, icon: ClipboardList, color: '#8b5cf6', lightColor: '#ede9fe', subtext: '任务' },
    { title: '完成', value: stats.completedTodos, icon: CheckCircle2, color: '#10b981', lightColor: '#d1fae5', subtext: '已处理' },
    { title: '待处理', value: stats.pendingTodos, icon: Clock, color: '#f59e0b', lightColor: '#fef3c7', subtext: '进行中' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black pt-20 pb-12 flex items-center justify-center transition-colors duration-300">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-700 border-t-blue-500 dark:border-t-white rounded-full animate-spin" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pt-20 pb-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-4xl font-semibold text-gray-900 dark:text-white tracking-tight">概览</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">数据仪表盘</p>
        </motion.div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-zinc-900/80 backdrop-blur-xl rounded-xl p-5 border border-gray-200 dark:border-zinc-800/50 shadow-sm dark:shadow-none transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="w-10 h-10 rounded-2xl flex items-center justify-center transition-colors duration-300" 
                  style={{ backgroundColor: stat.lightColor }}
                >
                  <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
                <span className="text-gray-500 dark:text-gray-400 text-sm">{stat.title}</span>
              </div>
              <p className="text-3xl font-semibold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">{stat.subtext}</p>
            </motion.div>
          ))}
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* 完成率 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-zinc-900/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200 dark:border-zinc-800/50 shadow-sm dark:shadow-none transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-gray-900 dark:text-white font-medium">完成率</h3>
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                {stats.todoCount > 0 ? Math.round((stats.completedTodos / stats.todoCount) * 100) : 0}%
              </span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={todoStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {todoStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    color: '#1f2937',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4">
              {todoStatusData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-500 dark:text-gray-400 text-sm">{item.name}</span>
                  <span className="text-gray-900 dark:text-white text-sm font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 性别分布 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-zinc-900/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200 dark:border-zinc-800/50 shadow-sm dark:shadow-none transition-all duration-300"
          >
            <h3 className="text-gray-900 dark:text-white font-medium mb-6">性别分布</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={genderData} barSize={40}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    color: '#1f2937',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar dataKey="count" fill="#a855f7" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* 年龄分布 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-zinc-900/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200 dark:border-zinc-800/50 shadow-sm dark:shadow-none transition-all duration-300"
          >
            <h3 className="text-gray-900 dark:text-white font-medium mb-6">年龄分布</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ageGroups} barSize={32}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    color: '#1f2937',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* 每周趋势 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-zinc-900/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200 dark:border-zinc-800/50 shadow-sm dark:shadow-none transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-gray-900 dark:text-white font-medium">本周趋势</h3>
              <TrendingUp className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="day" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    color: '#1f2937',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#34d399" 
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCompleted)"
                />
                <Area 
                  type="monotone" 
                  dataKey="created" 
                  stroke="#60a5fa" 
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCreated)"
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-gray-500 dark:text-gray-400 text-sm">已完成</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-gray-500 dark:text-gray-400 text-sm">新创建</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
