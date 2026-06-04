/**
 * Redis 服务层
 * 封装 Redis 操作，提供高级缓存功能
 */

import {
  createRedisClient,
  getRedisClient,
  CACHE_STRATEGY,
  CACHE_PROTECTION,
  SERIALIZATION
} from '../config/redis.config.js';

// ============================================
// 缓存管理器类
// ============================================

class CacheManager {
  constructor() {
    this.client = null;
    this.initialized = false;
  }

  // 初始化
  async init() {
    if (this.initialized) return;
    
    try {
      this.client = await createRedisClient();
      this.initialized = true;
      console.log('CacheManager initialized');
    } catch (error) {
      console.error('CacheManager initialization failed:', error);
      throw error;
    }
  }

  // ============================================
  // 基础操作
  // ============================================

  // 生成缓存键
  generateKey(module, identifier) {
    const strategy = CACHE_STRATEGY.strategies[module];
    if (!strategy) {
      throw new Error(`Unknown cache module: ${module}`);
    }
    return `${strategy.keyPrefix}${identifier}`;
  }

  // 计算 TTL（带随机偏移防止雪崩）
  calculateTTL(module) {
    const strategy = CACHE_STRATEGY.strategies[module];
    let ttl = strategy?.ttl || CACHE_STRATEGY.defaultTTL;

    // 雪崩防护：添加随机偏移
    if (CACHE_PROTECTION.avalanche.enabled) {
      const randomOffset = Math.floor(Math.random() * CACHE_PROTECTION.avalanche.randomRange);
      ttl += randomOffset;
    }

    return ttl;
  }

  // ============================================
  // 缓存读取
  // ============================================

  async get(module, identifier) {
    try {
      const key = this.generateKey(module, identifier);
      const data = await this.client.get(key);

      if (data === null) {
        return null;
      }

      // 检查空值缓存（穿透防护）
      if (data === '__EMPTY__') {
        return null;
      }

      return SERIALIZATION.deserialize(data);
    } catch (error) {
      console.error(`Cache get error [${module}:${identifier}]:`, error);
      return null;
    }
  }

  // ============================================
  // 缓存写入
  // ============================================

  async set(module, identifier, data, customTTL = null) {
    try {
      const key = this.generateKey(module, identifier);
      const ttl = customTTL || this.calculateTTL(module);
      
      const serialized = SERIALIZATION.serialize(data);
      await this.client.setEx(key, ttl, serialized);
      
      return true;
    } catch (error) {
      console.error(`Cache set error [${module}:${identifier}]:`, error);
      return false;
    }
  }

  // 设置空值缓存（穿透防护）
  async setEmpty(module, identifier) {
    if (!CACHE_PROTECTION.penetration.enabled) return;

    try {
      const key = this.generateKey(module, identifier);
      const ttl = CACHE_PROTECTION.penetration.emptyValueTTL;
      
      await this.client.setEx(key, ttl, '__EMPTY__');
    } catch (error) {
      console.error(`Cache setEmpty error [${module}:${identifier}]:`, error);
    }
  }

  // ============================================
  // 缓存删除
  // ============================================

  async delete(module, identifier) {
    try {
      const key = this.generateKey(module, identifier);
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error(`Cache delete error [${module}:${identifier}]:`, error);
      return false;
    }
  }

  // 按模式删除缓存
  async deletePattern(pattern) {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
        console.log(`Deleted ${keys.length} keys matching pattern: ${pattern}`);
      }
      return keys.length;
    } catch (error) {
      console.error(`Cache deletePattern error [${pattern}]:`, error);
      return 0;
    }
  }

  // 按模块清除缓存
  async clearModule(module) {
    const strategy = CACHE_STRATEGY.strategies[module];
    if (!strategy) return 0;

    return await this.deletePattern(`${strategy.keyPrefix}*`);
  }

  // ============================================
  // 缓存失效
  // ============================================

  async invalidate(module, event) {
    const strategy = CACHE_STRATEGY.strategies[module];
    if (!strategy || !strategy.invalidateOn.includes(event)) {
      return;
    }

    await this.clearModule(module);
    console.log(`Cache invalidated for module: ${module}, event: ${event}`);
  }

  // ============================================
  // 高级缓存模式
  // ============================================

  // 缓存 aside 模式（带击穿防护）
  async getOrSet(module, identifier, fetchFunction, customTTL = null) {
    // 1. 尝试从缓存获取
    let data = await this.get(module, identifier);
    
    if (data !== null) {
      return data;
    }

    // 2. 击穿防护：获取锁
    const lockKey = `${CACHE_PROTECTION.breakdown.lockKeyPrefix}${module}:${identifier}`;
    const lockAcquired = await this.acquireLock(lockKey);

    if (!lockAcquired) {
      // 未获取到锁，等待后重试
      await this.sleep(100);
      return await this.get(module, identifier);
    }

    try {
      // 双重检查
      data = await this.get(module, identifier);
      if (data !== null) {
        return data;
      }

      // 3. 从数据源获取
      data = await fetchFunction();

      // 4. 写入缓存
      if (data !== null && data !== undefined) {
        await this.set(module, identifier, data, customTTL);
      } else if (CACHE_PROTECTION.penetration.enabled) {
        await this.setEmpty(module, identifier);
      }

      return data;
    } finally {
      // 释放锁
      await this.releaseLock(lockKey);
    }
  }

  // 获取锁（用于击穿防护）
  async acquireLock(lockKey) {
    if (!CACHE_PROTECTION.breakdown.enabled) return true;

    try {
      const lockValue = Date.now().toString();
      const lockTTL = CACHE_PROTECTION.breakdown.lockTTL;
      
      // 使用 SET NX EX 原子操作
      const result = await this.client.set(lockKey, lockValue, {
        NX: true,
        EX: lockTTL
      });
      
      return result === 'OK';
    } catch (error) {
      console.error('Acquire lock error:', error);
      return false;
    }
  }

  // 释放锁
  async releaseLock(lockKey) {
    try {
      await this.client.del(lockKey);
    } catch (error) {
      console.error('Release lock error:', error);
    }
  }

  // 延迟函数
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================
  // 批量操作
  // ============================================

  async mget(module, identifiers) {
    try {
      const keys = identifiers.map(id => this.generateKey(module, id));
      const results = await this.client.mGet(keys);
      
      return results.map((data, index) => {
        if (data === null || data === '__EMPTY__') return null;
        try {
          return SERIALIZATION.deserialize(data);
        } catch (e) {
          console.error(`Deserialize error for ${identifiers[index]}:`, e);
          return null;
        }
      });
    } catch (error) {
      console.error(`Cache mget error [${module}]:`, error);
      return identifiers.map(() => null);
    }
  }

  async mset(module, entries, customTTL = null) {
    try {
      const ttl = customTTL || this.calculateTTL(module);
      const pipeline = this.client.multi();

      for (const [identifier, data] of entries) {
        const key = this.generateKey(module, identifier);
        const serialized = SERIALIZATION.serialize(data);
        pipeline.setEx(key, ttl, serialized);
      }

      await pipeline.exec();
      return true;
    } catch (error) {
      console.error(`Cache mset error [${module}]:`, error);
      return false;
    }
  }

  // ============================================
  // 哈希操作（用于存储对象）
  // ============================================

  async hset(module, identifier, field, value) {
    try {
      const key = this.generateKey(module, identifier);
      const serialized = SERIALIZATION.serialize(value);
      await this.client.hSet(key, field, serialized);
      
      // 设置过期时间
      const ttl = this.calculateTTL(module);
      await this.client.expire(key, ttl);
      
      return true;
    } catch (error) {
      console.error(`Cache hset error [${module}:${identifier}]:`, error);
      return false;
    }
  }

  async hget(module, identifier, field) {
    try {
      const key = this.generateKey(module, identifier);
      const data = await this.client.hGet(key, field);
      
      if (data === null) return null;
      return SERIALIZATION.deserialize(data);
    } catch (error) {
      console.error(`Cache hget error [${module}:${identifier}]:`, error);
      return null;
    }
  }

  async hgetall(module, identifier) {
    try {
      const key = this.generateKey(module, identifier);
      const data = await this.client.hGetAll(key);
      
      const result = {};
      for (const [field, value] of Object.entries(data)) {
        try {
          result[field] = SERIALIZATION.deserialize(value);
        } catch (e) {
          result[field] = value;
        }
      }
      
      return result;
    } catch (error) {
      console.error(`Cache hgetall error [${module}:${identifier}]:`, error);
      return {};
    }
  }

  // ============================================
  // 列表操作（用于队列、时间线等）
  // ============================================

  async lpush(module, identifier, value, maxLength = 100) {
    try {
      const key = this.generateKey(module, identifier);
      const serialized = SERIALIZATION.serialize(value);
      
      await this.client.lPush(key, serialized);
      
      // 限制列表长度
      if (maxLength > 0) {
        await this.client.lTrim(key, 0, maxLength - 1);
      }
      
      // 设置过期时间
      const ttl = this.calculateTTL(module);
      await this.client.expire(key, ttl);
      
      return true;
    } catch (error) {
      console.error(`Cache lpush error [${module}:${identifier}]:`, error);
      return false;
    }
  }

  async lrange(module, identifier, start = 0, stop = -1) {
    try {
      const key = this.generateKey(module, identifier);
      const data = await this.client.lRange(key, start, stop);
      
      return data.map(item => {
        try {
          return SERIALIZATION.deserialize(item);
        } catch (e) {
          return item;
        }
      });
    } catch (error) {
      console.error(`Cache lrange error [${module}:${identifier}]:`, error);
      return [];
    }
  }

  // ============================================
  // 统计信息
  // ============================================

  async getStats() {
    try {
      const info = await this.client.info('stats');
      const keyspace = await this.client.info('keyspace');
      
      return {
        stats: this.parseInfo(info),
        keyspace: this.parseInfo(keyspace)
      };
    } catch (error) {
      console.error('Get cache stats error:', error);
      return null;
    }
  }

  parseInfo(infoString) {
    const result = {};
    const lines = infoString.split('\r\n');
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        result[key] = value;
      }
    }
    
    return result;
  }

  // ============================================
  // 健康检查
  // ============================================

  async health() {
    try {
      await this.client.ping();
      return { status: 'healthy', connected: true };
    } catch (error) {
      return { status: 'unhealthy', connected: false, error: error.message };
    }
  }
}

// ============================================
// 单例模式
// ============================================

let cacheManager = null;

export const getCacheManager = async () => {
  if (!cacheManager) {
    cacheManager = new CacheManager();
    await cacheManager.init();
  }
  return cacheManager;
};

export const initCache = async () => {
  return await getCacheManager();
};

export default {
  getCacheManager,
  initCache
};
