/**
 * 数据同步服务 v2.1 - 优化版
 * 
 * 优化特性：
 * - 请求去重机制（避免重复请求）
 * - AbortController 清理（防止内存泄漏）
 * - ERR_ABORTED 错误过滤（减少无效日志）
 * - 请求队列管理（控制并发）
 * - 智能重试策略
 */

// API 基础地址（智能回退：环境变量 > 相对路径 > 同源）
// 使用相对路径通过 Vite 代理转发到后端，避免硬编码端口
const _envUrl = (import.meta.env.VITE_API_URL || '').trim()
const API_BASE_URL = _envUrl || '/api'

// ==================== 配置常量 ====================

const CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY_BASE: 1000,
  REQUEST_TIMEOUT: 10000,
  HEALTH_CHECK_TIMEOUT: 5000,
  CONCURRENT_LIMIT: 3,
  SYNC_LOG_MAX_SIZE: 200,
  REQUEST_DEDUP_WINDOW: 5000,
  ABORT_ERROR_FILTER: true,
  CIRCUIT_BREAKER_THRESHOLD: 3,
  CIRCUIT_BREAKER_COOLDOWN: 30000,
  MAX_BACKOFF_DELAY: 8000
};

const circuitBreaker = {
  failureCount: 0,
  lastFailureTime: 0,
  isOpen: false,

  recordSuccess() {
    this.failureCount = 0;
    this.isOpen = false;
  },

  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= CONFIG.CIRCUIT_BREAKER_THRESHOLD) {
      this.isOpen = true;
      logger.log('warn', 'system', `熔断器开启：连续失败 ${this.failureCount} 次，进入冷却期 ${CONFIG.CIRCUIT_BREAKER_COOLDOWN / 1000}s`);
    }
  },

  shouldAllowRequest() {
    if (!this.isOpen) return true;

    const timeSinceLastFailure = Date.now() - this.lastFailureTime;
    if (timeSinceLastFailure >= CONFIG.CIRCUIT_BREAKER_COOLDOWN) {
      this.isOpen = false;
      this.failureCount = 0;
      logger.log('info', 'system', '熔断器关闭：冷却期结束，允许请求');
      return true;
    }

    const remainingCooldown = Math.ceil((CONFIG.CIRCUIT_BREAKER_COOLDOWN - timeSinceLastFailure) / 1000);
    logger.log('debug', 'system', `熔断器开启中：剩余冷却时间 ${remainingCooldown}s，跳过请求`);
    return false;
  },

  getBackoffDelay(attempt) {
    const delay = Math.min(
      CONFIG.RETRY_DELAY_BASE * Math.pow(2, attempt - 1),
      CONFIG.MAX_BACKOFF_DELAY
    );
    return delay;
  }
};

// ==================== 请求去重管理器 ====================

class RequestDeduplicator {
  constructor() {
    this.pendingRequests = new Map();
    this.requestTimestamps = new Map();
    this.MAX_ENTRIES = 50;
    this.CLEANUP_INTERVAL = 5 * 60 * 1000;
    this.MAX_AGE = 5 * 60 * 1000;
    this.cleanupTimer = null;
    this.startAutoCleanup();
  }

  startAutoCleanup() {
    if (this.cleanupTimer) return;
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL);
  }

  stopAutoCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  // 生成请求唯一标识
  getRequestKey(endpoint, options = {}) {
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    return `${method}:${endpoint}:${body}`;
  }

  // 检查是否有重复请求
  hasDuplicate(key) {
    const now = Date.now();
    const lastRequest = this.requestTimestamps.get(key);
    
    if (lastRequest && (now - lastRequest) < CONFIG.REQUEST_DEDUP_WINDOW) {
      return true;
    }
    
    return this.pendingRequests.has(key);
  }

  // 获取或创建请求
  async dedupe(key, requestFn) {
    // 检查重复
    if (this.pendingRequests.has(key)) {
      console.log(`[Deduplicator] 复用请求: ${key}`);
      return this.pendingRequests.get(key);
    }

    // 检查时间窗口
    const now = Date.now();
    const lastRequest = this.requestTimestamps.get(key);
    if (lastRequest && (now - lastRequest) < CONFIG.REQUEST_DEDUP_WINDOW) {
      console.log(`[Deduplicator] 跳过重复请求: ${key}`);
      throw new Error('REQUEST_DEDUPED');
    }

    // 创建新请求
    this.requestTimestamps.set(key, now);
    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });
    
    this.pendingRequests.set(key, promise);
    return promise;
  }

  // 清理过期记录
  cleanup() {
    const now = Date.now();
    
    for (const [key, timestamp] of this.requestTimestamps) {
      if ((now - timestamp) > this.MAX_AGE) {
        this.requestTimestamps.delete(key);
        this.pendingRequests.delete(key);
      }
    }

    if (this.requestTimestamps.size > this.MAX_ENTRIES) {
      const entries = [...this.requestTimestamps.entries()]
        .sort((a, b) => a[1] - b[1]);
      const toRemove = entries.slice(0, this.requestTimestamps.size - this.MAX_ENTRIES);
      for (const [key] of toRemove) {
        this.requestTimestamps.delete(key);
        this.pendingRequests.delete(key);
      }
    }
  }
}

const deduplicator = new RequestDeduplicator();

// ==================== AbortController 管理器 ====================

class AbortControllerManager {
  constructor() {
    this.controllers = new Map();
    this.creationTimes = new Map();
    this.MAX_ENTRIES = 100;
    this.CLEANUP_INTERVAL = 5 * 60 * 1000;
    this.cleanupTimer = null;
    this.startAutoCleanup();
  }

  startAutoCleanup() {
    if (this.cleanupTimer) return;
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldest();
    }, this.CLEANUP_INTERVAL);
  }

  stopAutoCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  cleanupOldest() {
    if (this.controllers.size <= this.MAX_ENTRIES) return;

    const entries = [...this.creationTimes.entries()]
      .sort((a, b) => a[1] - b[1]);
    const toRemove = entries.slice(0, this.controllers.size - this.MAX_ENTRIES);
    
    for (const [key] of toRemove) {
      this.abort(key);
    }
  }

  create(key) {
    this.abort(key);

    if (this.controllers.size >= this.MAX_ENTRIES) {
      this.cleanupOldest();
    }

    const controller = new AbortController();
    this.controllers.set(key, controller);
    this.creationTimes.set(key, Date.now());
    return controller;
  }

  abort(key) {
    const controller = this.controllers.get(key);
    if (controller) {
      controller.abort();
      this.controllers.delete(key);
      this.creationTimes.delete(key);
    }
  }

  abortAll() {
    for (const [key, controller] of this.controllers) {
      controller.abort();
    }
    this.controllers.clear();
    this.creationTimes.clear();
  }
}

const abortManager = new AbortControllerManager();

// ==================== 日志系统 ====================

class SyncLogger {
  constructor() {
    this.key = 'myku_sync_logs';
    this.buffer = [];
    this.bufferTimer = null;
    this.MAX_BUFFER_SIZE = 5;
    this.FLUSH_INTERVAL = 2000;
    this.setupFlushListeners();
  }

  setupFlushListeners() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush();
      }
    });

    window.addEventListener('beforeunload', () => {
      this.flush();
    });
  }

  flush() {
    if (this.buffer.length === 0) return;

    if (this.bufferTimer) {
      clearTimeout(this.bufferTimer);
      this.bufferTimer = null;
    }

    try {
      const logs = this.getLogs();
      logs.push(...this.buffer);
      
      if (logs.length > CONFIG.SYNC_LOG_MAX_SIZE) {
        logs.splice(0, logs.length - CONFIG.SYNC_LOG_MAX_SIZE);
      }
      
      localStorage.setItem(this.key, JSON.stringify(logs));
      this.buffer = [];
    } catch (e) {
      console.error('[Logger] 批量保存日志失败:', e);
    }
  }

  // 检查是否是 ABORT 错误
  isAbortError(error) {
    if (!error) return false;
    const message = error.message || error.toString();
    return message.includes('ABORT') || 
           message.includes('AbortError') ||
           message.includes('cancelled') ||
           (error.name === 'AbortError');
  }

  log(level, module, message, details = null) {
    if (CONFIG.ABORT_ERROR_FILTER && level === 'error' && details?.error) {
      if (this.isAbortError(details.error)) {
        console.debug(`[ABORTED] [Sync ${module}]`, message);
        return;
      }
    }

    const entry = {
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      details
    };

    const prefix = `[${level.toUpperCase()}] [Sync ${module}]`;
    switch (level) {
      case 'error':
        console.error(prefix, message, details || '');
        break;
      case 'warn':
        console.warn(prefix, message);
        break;
      case 'success':
        console.log(`%c${prefix} ${message}`, 'color: #10b981; font-weight: bold');
        break;
      case 'debug':
        console.debug(prefix, message, details || '');
        break;
      default:
        console.log(prefix, message);
    }

    this.buffer.push(entry);

    if (this.buffer.length >= this.MAX_BUFFER_SIZE) {
      this.flush();
      return;
    }

    if (!this.bufferTimer) {
      this.bufferTimer = setTimeout(() => {
        this.flush();
      }, this.FLUSH_INTERVAL);
    }
  }

  getLogs() {
    try {
      return JSON.parse(localStorage.getItem(this.key) || '[]');
    } catch (e) {
      return [];
    }
  }

  clear() {
    localStorage.removeItem(this.key);
  }
}

const logger = new SyncLogger();

// ==================== 工具函数 ====================

let userIdCache = {
  value: null,
  timestamp: 0,
  TTL: 30000
};

const getCurrentUserId = () => {
  const now = Date.now();
  
  if (userIdCache.value !== null && (now - userIdCache.timestamp) < userIdCache.TTL) {
    return userIdCache.value;
  }

  try {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    userIdCache.value = user?.id || null;
    userIdCache.timestamp = now;
    return userIdCache.value;
  } catch (e) {
    logger.log('error', 'system', '获取用户失败', { error: e.message });
    return null;
  }
};

// 清理对象中的 undefined 和无效值
const cleanData = (data) => {
  if (!data || typeof data !== 'object') return data;

  const cleaned = {};
  
  for (const key of Object.keys(data)) {
    let value = data[key];
    
    if (value === undefined) {
      cleaned[key] = null;
      continue;
    }
    
    if (Array.isArray(value)) {
      cleaned[key] = value.filter(item => item !== undefined && item !== null);
      continue;
    }
    
    if (typeof value === 'string') {
      cleaned[key] = value.trim();
      continue;
    }
    
    if (typeof value === 'boolean') {
      cleaned[key] = value ? 1 : 0;
      continue;
    }
    
    cleaned[key] = value;
  }
  
  return cleaned;
};

// 检查后端是否可用
const checkBackendHealth = async () => {
  const controller = abortManager.create('health');
  
  try {
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.HEALTH_CHECK_TIMEOUT);

    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      logger.log('success', 'system', '后端健康检查通过');
      return true;
    }
    return false;
  } catch (error) {
    if (!logger.isAbortError(error)) {
      logger.log('error', 'system', '后端不可用', { error: error.message });
    }
    return false;
  }
};

// 带重试机制和去重的 API 请求
const apiRequestWithRetry = async (endpoint, options = {}, retries = CONFIG.MAX_RETRIES) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const requestKey = deduplicator.getRequestKey(endpoint, options);
  
  if (!circuitBreaker.shouldAllowRequest()) {
    logger.log('debug', 'system', '请求被熔断器拦截', { url });
    return [];
  }
  
  try {
    return await deduplicator.dedupe(requestKey, async () => {
      let lastError;

      for (let attempt = 1; attempt <= retries; attempt++) {
        const controller = abortManager.create(`request:${endpoint}:${attempt}`);
        
        try {
          const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);

          const response = await fetch(url, {
            headers: {
              'Content-Type': 'application/json',
              ...options.headers
            },
            signal: controller.signal,
            ...options
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            let errorMessage;
            try {
              const errorData = await response.json();
              errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`;
            } catch (e) {
              errorMessage = `HTTP ${response.status} (${response.statusText})`;
            }
            
            throw new Error(errorMessage);
          }

          const data = await response.json();
          
          if (data === null || data === undefined) {
            logger.log('warn', 'system', `API 返回空数据，使用默认值 []`, { url });
            return [];
          }
          
          circuitBreaker.recordSuccess();
          
          if (attempt > 1) {
            logger.log('success', 'system', `请求成功 (第${attempt}次尝试)`, { url });
          }
          
          return data;
        } catch (error) {
          lastError = error;
          
          if (logger.isAbortError(error)) {
            throw error;
          }
          
          if (error.message.includes('Failed to fetch') || 
              error.message.includes('NetworkError') ||
              error.message.includes('ERR_CONNECTION')) {
            
            circuitBreaker.recordFailure();
            
            if (attempt === 1) {
              logger.log('error', 'system', `网络连接失败，后端服务可能未启动`, { 
                url, 
                error: error.message,
                hint: '请确保后端服务正在运行 (npm run dev:start)'
              });
            }
            
            if (attempt >= 2) {
              throw new Error(`网络连接失败: ${error.message}。请检查后端服务是否正常运行`);
            }
          }
          
          if (attempt < retries) {
            const delay = circuitBreaker.getBackoffDelay(attempt);
            logger.log('warn', 'system', `请求失败，将在 ${delay}ms 后重试 (${attempt}/${retries})`, {
              url,
              error: error.message,
              nextAttemptIn: delay
            });
            
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      circuitBreaker.recordFailure();
      throw lastError;
    });
  } catch (error) {
    if (error.message === 'REQUEST_DEDUPED') {
      return null;
    }
    
    if (logger.isAbortError(error)) {
      logger.log('debug', 'system', '[ABORTED] 请求被取消（正常行为）', { url });
      return null;
    }
    
    throw error;
  }
};

// 断点续传管理器
class SyncProgressManager {
  constructor(type) {
    this.type = type;
    this.key = `myku_sync_${type}_progress`;
  }

  getSyncedIds() {
    try {
      const data = JSON.parse(localStorage.getItem(this.key) || '{}');
      return data.syncedIds || [];
    } catch (e) {
      return [];
    }
  }

  addSyncedIds(ids) {
    try {
      const data = JSON.parse(localStorage.getItem(this.key) || '{}');
      const currentIds = data.syncedIds || [];
      data.syncedIds = [...new Set([...currentIds, ...ids])];
      data.lastUpdate = new Date().toISOString();
      localStorage.setItem(this.key, JSON.stringify(data));
    } catch (e) {
      logger.log('error', this.type, '更新同步进度失败', { error: e.message });
    }
  }

  clear() {
    localStorage.removeItem(this.key);
  }
}

// ==================== 待办事项同步 ====================

export const syncTodos = async () => {
  const startTime = Date.now();
  const userId = getCurrentUserId();
  const progressManager = new SyncProgressManager('todos');

  if (!userId) {
    logger.log('warn', 'todos', '未登录，跳过待办同步');
    return { success: false, error: '未登录：请先登录账户' };
  }

  // 健康检查仅作为参考，不阻塞同步（允许在网络不稳定时继续尝试）
  let backendWarning = null;
  try {
    const isBackendOk = await checkBackendHealth();
    if (!isBackendOk) {
      backendWarning = '健康检查未通过，将尝试继续同步';
      logger.log('warn', 'todos', backendWarning);
    }
  } catch (e) {
    backendWarning = `健康检查异常: ${e.message}`;
    logger.log('warn', 'todos', backendWarning);
  }

  try {
    const localTodos = JSON.parse(localStorage.getItem('myku_todos') || '[]');
    logger.log('info', 'todos', `开始同步，本地待办数量: ${localTodos.length}`);

    if (localTodos.length === 0) {
      logger.log('success', 'todos', '无本地数据需要同步');
      return { success: true, created: 0, updated: 0, skipped: 0 };
    }

    // 获取数据库中的待办
    let dbTodos = [];
    try {
      dbTodos = await apiRequestWithRetry(`/todos?user_id=${userId}`);
    } catch (err) {
      if (!logger.isAbortError(err)) {
        logger.log('warn', 'todos', '获取数据库待办失败，将尝试直接创建', { error: err.message });
      }
      dbTodos = [];
    }

    // 同步统计
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors = [];
    const newlySyncedIds = [];

    const syncPromises = localTodos.map(async (localTodo) => {
      try {
        const existingTodo = dbTodos.find(t => t.task === (localTodo.task || localTodo.title));
        
        const todoData = cleanData({
          user_id: userId,
          task: localTodo.task || localTodo.title,
          completed: localTodo.completed ? 1 : 0,
          priority: localTodo.priority || 'medium',
          category: localTodo.category || 'general',
          due_date: localTodo.dueDate || null,
          tags: Array.isArray(localTodo.tags) ? localTodo.tags : [],
          completed_at: localTodo.completedAt || null
        });

        if (existingTodo) {
          await apiRequestWithRetry(`/todos/${existingTodo.id}`, {
            method: 'PUT',
            body: JSON.stringify(todoData)
          });
          return { type: 'updated', id: existingTodo.id };
        } else {
          const result = await apiRequestWithRetry('/todos', {
            method: 'POST',
            body: JSON.stringify(todoData)
          });
          return { type: 'created', id: result?.id };
        }
      } catch (error) {
        if (!logger.isAbortError(error)) {
          return { type: 'error', error: error.message, task: localTodo.task };
        }
        return { type: 'skipped' };
      }
    });

    const results = await Promise.allSettled(syncPromises);
    
    for (const result of results) {
      const value = result.value;
      if (!value) continue;
      
      switch (value.type) {
        case 'created':
          created++;
          if (value.id) newlySyncedIds.push(value.id);
          break;
        case 'updated':
          updated++;
          if (value.id) newlySyncedIds.push(value.id);
          break;
        case 'error':
          errors.push({ todo: value.task, error: value.error });
          skipped++;
          break;
        case 'skipped':
          skipped++;
          break;
      }
    }

    // 更新同步进度
    if (newlySyncedIds.length > 0) {
      progressManager.addSyncedIds(newlySyncedIds);
    }

    const duration = Date.now() - startTime;
    const success = errors.length === 0;

    if (success) {
      logger.log('success', 'todos', `同步完成: ${created} 创建, ${updated} 更新`, { duration: `${duration}ms` });
    } else {
      logger.log('warn', 'todos', `部分同步失败: ${errors.length} 个错误`, { errors });
    }

    return { success, created, updated, skipped, errors, duration };

  } catch (error) {
    if (!logger.isAbortError(error)) {
      logger.log('error', 'todos', '同步异常', { error: error.message });
    }
    return { success: false, error: error.message };
  }
};

// ==================== 备忘录同步 ====================

export const syncNotes = async () => {
  const startTime = Date.now();
  const userId = getCurrentUserId();
  const progressManager = new SyncProgressManager('notes');

  if (!userId) {
    logger.log('warn', 'notes', '未登录，跳过备忘录同步');
    return { success: false, error: '未登录：请先登录账户' };
  }

  // 健康检查仅作为参考，不阻塞同步
  try {
    const isBackendOk = await checkBackendHealth();
    if (!isBackendOk) {
      logger.log('warn', 'notes', '健康检查未通过，将尝试继续同步');
    }
  } catch (e) {
    logger.log('warn', 'notes', `健康检查异常: ${e.message}`);
  }

  try {
    const localNotes = JSON.parse(localStorage.getItem('myku_notes') || '[]');
    logger.log('info', 'notes', `开始同步，本地备忘录数量: ${localNotes.length}`);

    if (localNotes.length === 0) {
      logger.log('success', 'notes', '无本地数据需要同步');
      return { success: true, created: 0, updated: 0, skipped: 0 };
    }

    let dbNotes = [];
    try {
      dbNotes = await apiRequestWithRetry(`/notes?user_id=${userId}`);
    } catch (err) {
      if (!logger.isAbortError(err)) {
        logger.log('warn', 'notes', '获取数据库备忘录失败', { error: err.message });
      }
      dbNotes = [];
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors = [];
    const newlySyncedIds = [];

    const syncPromises = localNotes.map(async (localNote) => {
      try {
        const existingNote = dbNotes.find(n => n.title === localNote.title);
        
        const noteData = cleanData({
          user_id: userId,
          title: localNote.title || '无标题',
          content: localNote.content || '',
          category: localNote.category || 'general',
          tags: Array.isArray(localNote.tags) ? localNote.tags : [],
          pinned: localNote.pinned ? 1 : 0
        });

        if (existingNote) {
          await apiRequestWithRetry(`/notes/${existingNote.id}`, {
            method: 'PUT',
            body: JSON.stringify(noteData)
          });
          return { type: 'updated', id: existingNote.id };
        } else {
          const result = await apiRequestWithRetry('/notes', {
            method: 'POST',
            body: JSON.stringify(noteData)
          });
          return { type: 'created', id: result?.id };
        }
      } catch (error) {
        if (!logger.isAbortError(error)) {
          return { type: 'error', error: error.message, title: localNote.title };
        }
        return { type: 'skipped' };
      }
    });

    const results = await Promise.allSettled(syncPromises);
    
    for (const result of results) {
      const value = result.value;
      if (!value) continue;
      
      switch (value.type) {
        case 'created':
          created++;
          if (value.id) newlySyncedIds.push(value.id);
          break;
        case 'updated':
          updated++;
          if (value.id) newlySyncedIds.push(value.id);
          break;
        case 'error':
          errors.push({ note: value.title, error: value.error });
          skipped++;
          break;
        case 'skipped':
          skipped++;
          break;
      }
    }

    if (newlySyncedIds.length > 0) {
      progressManager.addSyncedIds(newlySyncedIds);
    }

    const duration = Date.now() - startTime;
    const success = errors.length === 0;

    if (success) {
      logger.log('success', 'notes', `同步完成: ${created} 创建, ${updated} 更新`, { duration: `${duration}ms` });
    } else {
      logger.log('warn', 'notes', `部分同步失败: ${errors.length} 个错误`, { errors });
    }

    return { success, created, updated, skipped, errors, duration };

  } catch (error) {
    if (!logger.isAbortError(error)) {
      logger.log('error', 'notes', '同步异常', { error: error.message });
    }
    return { success: false, error: error.message };
  }
};

// ==================== 习惯同步 ====================

export const syncHabits = async () => {
  const startTime = Date.now();
  const userId = getCurrentUserId();
  const progressManager = new SyncProgressManager('habits');

  if (!userId) {
    logger.log('warn', 'habits', '未登录，跳过习惯同步');
    return { success: false, error: '未登录：请先登录账户' };
  }

  // 健康检查仅作为参考，不阻塞同步
  try {
    const isBackendOk = await checkBackendHealth();
    if (!isBackendOk) {
      logger.log('warn', 'habits', '健康检查未通过，将尝试继续同步');
    }
  } catch (e) {
    logger.log('warn', 'habits', `健康检查异常: ${e.message}`);
  }

  try {
    const localHabits = JSON.parse(localStorage.getItem('myku_habits') || '[]');
    logger.log('info', 'habits', `开始同步，本地习惯数量: ${localHabits.length}`);

    if (localHabits.length === 0) {
      logger.log('success', 'habits', '无本地数据需要同步');
      return { success: true, created: 0, updated: 0, skipped: 0 };
    }

    let dbHabits = [];
    try {
      dbHabits = await apiRequestWithRetry(`/habits?user_id=${userId}`);
    } catch (err) {
      if (!logger.isAbortError(err)) {
        logger.log('warn', 'habits', '获取数据库习惯失败', { error: err.message });
      }
      dbHabits = [];
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors = [];
    const newlySyncedIds = [];

    const syncPromises = localHabits.map(async (localHabit) => {
      try {
        const existingHabit = dbHabits.find(h => h.name === localHabit.name);
        
        const habitData = cleanData({
          user_id: userId,
          name: localHabit.name || '新习惯',
          description: localHabit.description || '',
          frequency: localHabit.frequency || 'daily',
          reminder_time: localHabit.reminderTime || null,
          target_days: localHabit.targetDays || 21
        });

        let habitId;
        if (existingHabit) {
          await apiRequestWithRetry(`/habits/${existingHabit.id}`, {
            method: 'PUT',
            body: JSON.stringify(habitData)
          });
          habitId = existingHabit.id;
        } else {
          const result = await apiRequestWithRetry('/habits', {
            method: 'POST',
            body: JSON.stringify(habitData)
          });
          habitId = result.id;
        }

        if (habitId && localHabit.completedDates && localHabit.completedDates.length > 0) {
          const logPromises = localHabit.completedDates.map(async (date) => {
            try {
              return await apiRequestWithRetry(`/habits/${habitId}/logs`, {
                method: 'POST',
                body: JSON.stringify({ completed_at: date })
              });
            } catch (logError) {
              if (!logError.message?.includes('duplicate')) {
                throw logError;
              }
            }
          });

          await Promise.allSettled(logPromises);
        }

        return { type: existingHabit ? 'updated' : 'created', id: habitId };
      } catch (error) {
        if (!logger.isAbortError(error)) {
          return { type: 'error', error: error.message, name: localHabit.name };
        }
        return { type: 'skipped' };
      }
    });

    const results = await Promise.allSettled(syncPromises);
    
    for (const result of results) {
      const value = result.value;
      if (!value) continue;
      
      switch (value.type) {
        case 'created':
          created++;
          if (value.id) newlySyncedIds.push(value.id);
          break;
        case 'updated':
          updated++;
          if (value.id) newlySyncedIds.push(value.id);
          break;
        case 'error':
          errors.push({ habit: value.name, error: value.error });
          skipped++;
          break;
        case 'skipped':
          skipped++;
          break;
      }
    }

    if (newlySyncedIds.length > 0) {
      progressManager.addSyncedIds(newlySyncedIds);
    }

    const duration = Date.now() - startTime;
    const success = errors.length === 0;

    if (success) {
      logger.log('success', 'habits', `同步完成: ${created} 创建, ${updated} 更新`, { duration: `${duration}ms` });
    } else {
      logger.log('warn', 'habits', `部分同步失败: ${errors.length} 个错误`, { errors });
    }

    return { success, created, updated, skipped, errors, duration };

  } catch (error) {
    if (!logger.isAbortError(error)) {
      logger.log('error', 'habits', '同步异常', { error: error.message });
    }
    return { success: false, error: error.message };
  }
};

// ==================== 全量同步 ====================

export const syncAllData = async () => {
  const startTime = Date.now();
  
  logger.log('info', 'system', '========================================');
  logger.log('info', 'system', '     开始全量数据同步...');
  logger.log('info', 'system', '========================================');
  
  // 清理去重记录
  deduplicator.cleanup();
  
  const results = {
    todos: await syncTodos(),
    notes: await syncNotes(),
    habits: await syncHabits()
  };

  const duration = Date.now() - startTime;
  const allSuccess = Object.values(results).every(r => r.success);

  logger.log('info', 'system', '========================================');
  logger.log(allSuccess ? 'success' : 'error', 'system', allSuccess ? '✓ 全量同步完成' : '✗ 部分同步失败');
  logger.log('info', 'system', `总耗时: ${(duration / 1000).toFixed(2)}s`);
  logger.log('info', 'system', '========================================');
  
  if (allSuccess) {
    localStorage.setItem('myku_last_sync', new Date().toISOString());
  }

  return { success: allSuccess, results, duration };
};

// ==================== 从数据库加载数据 ====================

export const loadTodosFromDB = async () => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  try {
    const todos = await apiRequestWithRetry(`/todos?user_id=${userId}`);
    
    // 空值检查：确保数据是数组
    const todosArray = Array.isArray(todos) ? todos : [];
    
    const localFormat = todosArray.map(t => ({
      id: t.id,
      task: t.task,
      title: t.task,
      completed: t.completed === 1,
      priority: t.priority,
      category: t.category,
      dueDate: t.due_date,
      tags: Array.isArray(t.tags) ? t.tags : [],
      createdAt: t.created_at,
      completedAt: t.completed_at
    }));

    localStorage.setItem('myku_todos', JSON.stringify(localFormat));
    logger.log('success', 'todos', `从数据库加载 ${localFormat.length} 条待办`);
    return localFormat;
  } catch (error) {
    if (!logger.isAbortError(error)) {
      logger.log('error', 'todos', '从数据库加载失败', { error: error.message });
    }
    return JSON.parse(localStorage.getItem('myku_todos') || '[]');
  }
};

export const deleteTodoFromDB = async (todoId) => {
  const userId = getCurrentUserId();
  if (!userId) {
    logger.log('debug', 'todos', '未登录，无法删除');
    throw new Error('未登录，无法删除任务');
  }

  // 检查网络状态
  if (!navigator.onLine) {
    logger.log('warn', 'todos', '网络离线，无法删除到数据库');
    throw new Error('网络连接不可用');
  }

  try {
    const result = await apiRequestWithRetry(`/todos/${todoId}`, {
      method: 'DELETE'
    });

    logger.log('success', 'todos', `成功从数据库删除任务 ID: ${todoId}`);

    // 同步更新本地存储
    const localTodos = JSON.parse(localStorage.getItem('myku_todos') || '[]');
    const updatedTodos = localTodos.filter(todo => todo.id !== todoId);
    localStorage.setItem('myku_todos', JSON.stringify(updatedTodos));

    return { success: true, id: todoId };
  } catch (error) {
    // 区分错误类型
    if (error.name === 'AbortError' || error.message?.includes('abort')) {
      logger.log('warn', 'todos', '删除请求被中止', { todoId, error: error.message });
      throw new Error('操作被取消，请重试');
    } else if (error.message?.includes('404')) {
      logger.log('warn', 'todos', '任务已不存在于数据库', { todoId });
      // 即使404也算成功（任务已经不存在了）
      const localTodos = JSON.parse(localStorage.getItem('myku_todos') || '[]');
      const updatedTodos = localTodos.filter(todo => todo.id !== todoId);
      localStorage.setItem('myku_todos', JSON.stringify(updatedTodos));
      return { success: true, id: todoId, message: '任务已不存在' };
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      logger.log('error', 'todos', '网络错误导致删除失败', { todoId, error: error.message });
      throw new Error('网络连接失败，请检查网络后重试');
    } else {
      logger.log('error', 'todos', '从数据库删除失败', { todoId, error: error.message });
      throw new Error(`删除失败: ${error.message}`);
    }
  }
};

export const loadNotesFromDB = async () => {
  const userId = getCurrentUserId();
  if (!userId) {
    logger.log('debug', 'notes', '未登录，返回空数组');
    return [];
  }

  // 检查网络状态
  if (!navigator.onLine) {
    logger.log('warn', 'notes', '网络离线，使用本地缓存');
    return getLocalNotes();
  }

  try {
    const notes = await apiRequestWithRetry(`/notes?user_id=${userId}`);

    // 空值检查：确保数据是数组
    const notesArray = Array.isArray(notes) ? notes : [];

    const localFormat = notesArray.map(n => ({
      id: n.id,
      title: n.title || '',
      content: n.content || '',
      category: n.category || '',
      tags: Array.isArray(n.tags) ? n.tags : [],
      color: n.color || 0,
      isPinned: n.is_pinned === 1 || n.isPinned === true,
      createdAt: n.created_at || new Date().toISOString(),
      updatedAt: n.updated_at || new Date().toISOString()
    }));

    localStorage.setItem('myku_notes', JSON.stringify(localFormat));
    logger.log('success', 'notes', `从数据库加载 ${localFormat.length} 条备忘录`);
    return localFormat;
  } catch (error) {
    // 区分不同类型的错误
    if (error.name === 'AbortError' || error.message?.includes('abort')) {
      logger.log('warn', 'notes', '请求被中止（可能是页面切换导致），使用本地缓存');
    } else if (error.message?.includes('fetch') || error.message?.includes('network')) {
      logger.log('error', 'notes', '网络错误，使用本地缓存', { error: error.message });
    } else if (error.message?.includes('Failed to fetch') || error.message?.includes('ERR_ABORTED')) {
      logger.log('error', 'notes', '模块加载失败导致的请求中止，降级到本地模式');
    } else {
      logger.log('error', 'notes', '从数据库加载失败', { error: error.message });
    }

    return getLocalNotes();
  }
};

const getLocalNotes = () => {
  try {
    const cached = localStorage.getItem('myku_notes');
    if (!cached) {
      logger.log('info', 'notes', '无本地缓存，返回空数组');
      return [];
    }
    const parsed = JSON.parse(cached);
    logger.log('info', 'notes', `从本地缓存加载 ${parsed.length} 条备忘录`);
    return parsed;
  } catch (parseError) {
    logger.log('error', 'notes', '解析本地缓存失败', { error: parseError.message });
    return [];
  }
};

// 计算连续天数
const calculateStreakFromDates = (dates) => {
  if (dates.length === 0) return 0;
  const sorted = [...dates].sort().reverse();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = (new Date(sorted[i - 1]) - new Date(sorted[i])) / 86400000;
    if (diff === 1) streak++; else break;
  }
  return streak;
};

export const loadHabitsFromDB = async () => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  try {
    const habits = await apiRequestWithRetry(`/habits?user_id=${userId}`);
    
    // 空值检查：确保数据是数组
    const habitsArray = Array.isArray(habits) ? habits : [];
    
    const habitsWithLogs = await Promise.all(
      habitsArray.map(async (h) => {
        let logs = [];
        try {
          logs = await apiRequestWithRetry(`/habits/${h.id}/logs`);
        } catch (e) {
          // 忽略 ABORT 错误
          if (!logger.isAbortError(e)) {
            logs = [];
          }
        }
        const completedDates = logs.map(l => {
          const d = new Date(l.completed_at);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        });
        
        // 从本地合并数据（确保不丢失本地未同步的打卡）
        const localHabits = JSON.parse(localStorage.getItem('myku_habits') || '[]');
        const localHabit = localHabits.find(lh => lh.id === h.id);
        let mergedDates = [...completedDates];
        if (localHabit && localHabit.completedDates) {
          localHabit.completedDates.forEach(d => {
            if (!mergedDates.includes(d)) mergedDates.push(d);
          });
        }
        mergedDates.sort();
        
        const streak = calculateStreakFromDates(mergedDates);
        
        return {
          id: h.id,
          name: h.name || '',
          description: h.description || '',
          frequency: h.frequency || 'daily',
          reminderTime: h.reminder_time || '',
          completedDates: mergedDates,
          streak,
          longestStreak: Math.max(streak, localHabit?.longestStreak || 0),
          totalCompletions: mergedDates.length,
          icon: localHabit?.icon || 0,
          color: localHabit?.color || 3,
          targetDays: localHabit?.targetDays || 21,
          reminder: h.reminder_time || '',
          createdAt: h.created_at
        };
      })
    );

    localStorage.setItem('myku_habits', JSON.stringify(habitsWithLogs));
    logger.log('success', 'habits', `从数据库加载 ${habitsWithLogs.length} 条习惯`);
    return habitsWithLogs;
  } catch (error) {
    if (!logger.isAbortError(error)) {
      logger.log('error', 'habits', '从数据库加载失败', { error: error.message });
    }
    return JSON.parse(localStorage.getItem('myku_habits') || '[]');
  }
};

// ==================== 自动同步 ====================

let syncInterval = null;
let isSyncing = false;

export const startAutoSync = (intervalMinutes = 5) => {
  // 立即执行一次
  performSafeSync();

  syncInterval = setInterval(() => {
    performSafeSync();
  }, intervalMinutes * 60 * 1000);
  
  logger.log('success', 'system', `自动同步已启动，间隔: ${intervalMinutes} 分钟`);
};

const performSafeSync = async () => {
  if (isSyncing) {
    logger.log('debug', 'system', '上一次同步尚未完成，跳过本次同步');
    return;
  }

  isSyncing = true;
  try {
    await syncAllData();
  } catch (e) {
    if (!logger.isAbortError(e)) {
      logger.log('error', 'system', '自动同步异常', { error: e.message });
    }
  } finally {
    isSyncing = false;
  }
};

export const stopAutoSync = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;

    // 标记同步已停止，不再发起新请求
    // 不再强制 abort 所有进行中请求（避免导航时产生大量 ERR_ABORTED 日志）
    // 进行中的请求会自然完成或超时，结果会被静默丢弃
    isSyncing = false;

    logger.log('success', 'system', '自动同步已停止');
  }
};

let lastVisibilitySyncTime = 0;
let visibilityDebounceTimer = null;
const VISIBILITY_DEBOUNCE_MS = 500;
const MIN_SYNC_INTERVAL_MS = 10000;

export const setupVisibilitySync = () => {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      const now = Date.now();
      
      if (visibilityDebounceTimer) {
        clearTimeout(visibilityDebounceTimer);
      }

      if (now - lastVisibilitySyncTime < MIN_SYNC_INTERVAL_MS) {
        logger.log('debug', 'system', '页面可见：距离上次同步不足 10 秒，跳过');
        return;
      }

      visibilityDebounceTimer = setTimeout(async () => {
        logger.log('info', 'system', '页面变为可见，从数据库加载数据');
        
        try {
          await Promise.all([
            loadTodosFromDB(),
            loadNotesFromDB(),
            loadHabitsFromDB()
          ]);
          lastVisibilitySyncTime = Date.now();
        } catch (e) {
          if (!logger.isAbortError(e)) {
            logger.log('error', 'system', '从数据库加载失败', { error: e.message });
          }
        }
      }, VISIBILITY_DEBOUNCE_MS);
    } else {
      logger.log('debug', 'system', '页面隐藏，执行后台同步');
      syncAllData().catch(e => {
        if (!logger.isAbortError(e)) {
          logger.log('error', 'system', '后台同步失败', { error: e.message });
        }
      });
    }
  });
};

// ==================== 导出工具函数 ====================

export const getSyncLogs = () => logger.getLogs();
export const clearSyncLogs = () => logger.clear();
export const getLastSyncTime = () => localStorage.getItem('myku_last_sync');
export const clearSyncProgress = () => {
  ['todos', 'notes', 'habits'].forEach(type => {
    const manager = new SyncProgressManager(type);
    manager.clear();
  });
};

// 清理函数（用于组件卸载）
export const cleanupSync = () => {
  stopAutoSync();
  // 不再调用 abortManager.abortAll()，让进行中的请求自然完成
  deduplicator.cleanup();
  abortManager.stopAutoCleanup();
};

export default {
  syncTodos,
  syncNotes,
  syncHabits,
  syncAllData,
  loadTodosFromDB,
  loadNotesFromDB,
  loadHabitsFromDB,
  startAutoSync,
  stopAutoSync,
  setupVisibilitySync,
  getSyncLogs,
  clearSyncLogs,
  getLastSyncTime,
  clearSyncProgress,
  cleanupSync
};
