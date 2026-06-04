/**
 * 开发环境配置文件
 * 用于 dev-start.js 自动化启动脚本
 */

export default {
  // 前端配置
  frontend: {
    // 前端项目根目录（相对或绝对路径）
    cwd: '.',
    
    // 前端启动命令
    command: 'npm',
    args: ['run', 'dev'],
    
    // 启动成功检测关键词（在 stdout 中搜索）
    successKeywords: ['ready', 'localhost', 'Local:'],
    
    // 前端端口号（用于日志显示）
    port: 3002,
    
    // 启动超时时间（毫秒）
    timeout: 15000,
    
    // 显示名称
    name: 'Frontend (Vite)'
  },

  // 后端配置
  backend: {
    // 后端项目根目录（相对或绝对路径）
    cwd: '.',
    
    // 后端启动命令
    command: 'npm',
    args: ['start'],
    
    // 启动成功检测关键词
    successKeywords: ['服务器运行', 'listening', 'ready', 'localhost'],
    
    // 后端端口号（用于日志显示）
    port: 3001,
    
    // 启动超时时间（毫秒）
    timeout: 10000,
    
    // 后端启动延迟（前端启动成功后等待时间，毫秒）
    delay: 1000,
    
    // 显示名称
    name: 'Backend (Express)'
  },

  // Redis 配置
  redis: {
    // 是否启用自动启动
    enabled: true,

    // Redis 端口
    port: 6379,

    // 配置文件路径（相对项目根目录）
    configFile: 'redis.conf',

    // 启动超时时间（毫秒）
    timeout: 10000,

    // 启动方式优先级: ['docker', 'native', 'manual']
    // docker: 使用 Docker Compose 启动
    // native: 使用系统安装的 redis-server
    // manual: 仅检测，不自动启动
    startPreference: ['docker', 'native'],

    // Docker Compose 文件路径
    dockerComposeFile: 'docker-compose.redis.yml',

    // 显示名称
    name: 'Redis Server'
  },

  // 全局配置
  global: {
    // 是否启用彩色日志
    colors: true,
    
    // 日志级别：'verbose', 'info', 'error'
    logLevel: 'info',
    
    // 是否在前端关闭时自动关闭后端
    killBackendOnExit: true,
    
    // 进程清理间隔（毫秒）
    cleanupInterval: 5000
  }
}
