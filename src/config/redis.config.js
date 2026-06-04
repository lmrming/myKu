/**
 * Redis 配置中心
 * 集中管理所有 Redis 相关配置
 */

import { createClient } from 'redis';

// ============================================
// 环境配置
// ============================================

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// ============================================
// Redis 连接配置
// ============================================

export const REDIS_CONFIG = {
  // 基础连接配置
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    database: parseInt(process.env.REDIS_DB) || 0,
    
    // 连接池配置
    socket: {
      connectTimeout: 5000,        // 连接超时 5秒
      keepAlive: 30000,            // TCP keepalive 30秒
      reconnectStrategy: (retries) => {
        // 重连策略：指数退避，最大 30 秒
        const delay = Math.min(retries * 50, 30000);
        console.log(`Redis 重连尝试 ${retries}，延迟 ${delay}ms`);
        return delay;
      }
    }
  },

  // 集群配置（生产环境）
  cluster: isProduction ? {
    rootNodes: [
      { host: process.env.REDIS_CLUSTER_HOST_1, port: 6379 },
      { host: process.env.REDIS_CLUSTER_HOST_2, port: 6379 },
      { host: process.env.REDIS_CLUSTER_HOST_3, port: 6379 }
    ],
    defaults: {
      password: process.env.REDIS_PASSWORD
    }
  } : null,

  // 哨兵配置（高可用）
  sentinel: isProduction ? {
    sentinels: [
      { host: process.env.REDIS_SENTINEL_HOST_1, port: 26379 },
      { host: process.env.REDIS_SENTINEL_HOST_2, port: 26379 }
    ],
    name: 'mymaster',
    password: process.env.REDIS_PASSWORD
  } : null
};

// ============================================
// 缓存策略配置
// ============================================

export const CACHE_STRATEGY = {
  // 默认 TTL（秒）
  defaultTTL: 300,  // 5 分钟

  // 各模块缓存策略
  strategies: {
    // 用户数据 - 较长缓存时间
    user: {
      ttl: 1800,           // 30 分钟
      keyPrefix: 'user:',
      invalidateOn: ['user:update', 'user:delete']
    },

    // 待办列表 - 中等缓存时间
    todo: {
      ttl: 300,            // 5 分钟
      keyPrefix: 'todo:',
      invalidateOn: ['todo:create', 'todo:update', 'todo:delete']
    },

    // 备忘录 - 中等缓存时间
    note: {
      ttl: 300,
      keyPrefix: 'note:',
      invalidateOn: ['note:create', 'note:update', 'note:delete']
    },

    // 习惯数据 - 较长缓存时间
    habit: {
      ttl: 600,            // 10 分钟
      keyPrefix: 'habit:',
      invalidateOn: ['habit:create', 'habit:update', 'habit:delete', 'habit:checkin']
    },

    // 习惯统计数据 - 短缓存时间（频繁变化）
    habitStats: {
      ttl: 60,             // 1 分钟
      keyPrefix: 'habit:stats:',
      invalidateOn: ['habit:checkin']
    },

    // API 响应缓存
    api: {
      ttl: 60,
      keyPrefix: 'api:',
      invalidateOn: []
    },

    // 会话数据
    session: {
      ttl: 86400,          // 24 小时
      keyPrefix: 'session:',
      invalidateOn: ['user:logout']
    },

    // 速率限制
    rateLimit: {
      ttl: 60,             // 1 分钟窗口
      keyPrefix: 'ratelimit:',
      invalidateOn: []
    }
  }
};

// ============================================
// 缓存防护配置（穿透/击穿/雪崩）
// ============================================

export const CACHE_PROTECTION = {
  // 缓存穿透防护 - 布隆过滤器或空值缓存
  penetration: {
    enabled: true,
    emptyValueTTL: 60,       // 空值缓存时间（秒）
    bloomFilterEnabled: false // 如需使用需额外安装 bloomfilter 模块
  },

  // 缓存击穿防护 - 互斥锁
  breakdown: {
    enabled: true,
    lockTTL: 10,             // 锁超时时间（秒）
    lockKeyPrefix: 'lock:'
  },

  // 缓存雪崩防护 - 随机过期时间
  avalanche: {
    enabled: true,
    randomRange: 30          // 随机范围（秒）
  }
};

// ============================================
// 监控告警配置
// ============================================

export const MONITORING = {
  // 慢查询阈值（毫秒）
  slowQueryThreshold: 100,

  // 内存使用告警阈值（百分比）
  memoryThreshold: 80,

  // 连接数告警阈值
  connectionThreshold: 80,

  // 命中率告警阈值（百分比）
  hitRateThreshold: 80,

  // 监控指标收集间隔（秒）
  metricsInterval: 60
};

// ============================================
// 序列化配置
// ============================================

export const SERIALIZATION = {
  // 默认序列化方法
  serialize: (data) => JSON.stringify(data),
  
  // 默认反序列化方法
  deserialize: (data) => JSON.parse(data),

  // 压缩配置（大数据时启用）
  compression: {
    enabled: false,          // 如需启用需安装压缩库
    threshold: 1024          // 超过 1KB 启用压缩
  }
};

// ============================================
// 创建 Redis 客户端
// ============================================

let redisClient = null;
let isConnected = false;

export const createRedisClient = async () => {
  if (redisClient && isConnected) {
    return redisClient;
  }

  try {
    redisClient = createClient({
      ...REDIS_CONFIG.connection,
      // 启用 ready 检查
      pingInterval: 30000
    });

    // 错误处理
    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
      isConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('Redis Client Connected');
      isConnected = true;
    });

    redisClient.on('disconnect', () => {
      console.log('Redis Client Disconnected');
      isConnected = false;
    });

    redisClient.on('reconnecting', () => {
      console.log('Redis Client Reconnecting...');
    });

    // 连接
    await redisClient.connect();

    return redisClient;
  } catch (error) {
    console.error('Failed to create Redis client:', error);
    throw error;
  }
};

// ============================================
// 获取 Redis 客户端实例
// ============================================

export const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call createRedisClient() first.');
  }
  return redisClient;
};

// ============================================
// 关闭 Redis 连接
// ============================================

export const closeRedisConnection = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isConnected = false;
    console.log('Redis connection closed');
  }
};

// ============================================
// 健康检查
// ============================================

export const checkRedisHealth = async () => {
  try {
    const client = getRedisClient();
    await client.ping();
    return { status: 'healthy', connected: true };
  } catch (error) {
    return { status: 'unhealthy', connected: false, error: error.message };
  }
};

export default {
  REDIS_CONFIG,
  CACHE_STRATEGY,
  CACHE_PROTECTION,
  MONITORING,
  SERIALIZATION,
  createRedisClient,
  getRedisClient,
  closeRedisConnection,
  checkRedisHealth
};
