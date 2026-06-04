/**
 * 速率限制服务
 * 基于 Redis 的滑动窗口限流实现
 */

import { getCacheManager } from './redis.service.js';

// ============================================
// 限流策略配置
// ============================================

const RATE_LIMIT_CONFIG = {
  // API 通用限制
  api: {
    windowMs: 60 * 1000,      // 1 分钟窗口
    maxRequests: 100,         // 最大请求数
    keyPrefix: 'ratelimit:api:'
  },

  // 登录接口限制（更严格）
  login: {
    windowMs: 15 * 60 * 1000, // 15 分钟窗口
    maxRequests: 5,           // 最多 5 次尝试
    keyPrefix: 'ratelimit:login:',
    blockDuration: 15 * 60    // 封禁 15 分钟
  },

  // 注册接口限制
  register: {
    windowMs: 60 * 60 * 1000, // 1 小时窗口
    maxRequests: 3,           // 最多 3 次注册
    keyPrefix: 'ratelimit:register:',
    blockDuration: 60 * 60    // 封禁 1 小时
  },

  // 密码重置限制
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 小时窗口
    maxRequests: 3,
    keyPrefix: 'ratelimit:pwdreset:',
    blockDuration: 60 * 60
  }
};

// ============================================
// 速率限制器类
// ============================================

class RateLimiter {
  constructor() {
    this.cache = null;
  }

  async init() {
    this.cache = await getCacheManager();
  }

  // ============================================
  // 滑动窗口限流
  // ============================================

  async checkLimit(identifier, type = 'api') {
    const config = RATE_LIMIT_CONFIG[type];
    if (!config) {
      throw new Error(`Unknown rate limit type: ${type}`);
    }

    const key = `${config.keyPrefix}${identifier}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    try {
      // 获取当前窗口内的请求记录
      const requests = await this.cache.lrange('rateLimit', key, 0, -1);
      
      // 清理过期请求
      const validRequests = requests.filter(timestamp => timestamp > windowStart);
      
      // 检查是否被封禁
      const blockKey = `${key}:blocked`;
      const isBlocked = await this.cache.get('rateLimit', `${identifier}:blocked`);
      
      if (isBlocked) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: isBlocked,
          reason: 'blocked'
        };
      }

      // 检查是否超过限制
      if (validRequests.length >= config.maxRequests) {
        // 封禁用户
        if (config.blockDuration) {
          const blockUntil = now + config.blockDuration * 1000;
          await this.cache.set('rateLimit', `${identifier}:blocked`, blockUntil, config.blockDuration);
        }

        return {
          allowed: false,
          remaining: 0,
          resetTime: validRequests[0] + config.windowMs,
          reason: 'rate_limited'
        };
      }

      // 记录本次请求
      await this.cache.lpush('rateLimit', key, now, config.maxRequests);

      return {
        allowed: true,
        remaining: config.maxRequests - validRequests.length - 1,
        resetTime: now + config.windowMs,
        reason: null
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      // 出错时允许请求通过（降级策略）
      return { allowed: true, remaining: 0, resetTime: now, reason: 'error' };
    }
  }

  // ============================================
  // 令牌桶限流（更平滑）
  // ============================================

  async tokenBucketCheck(identifier, config = {}) {
    const {
      capacity = 10,        // 桶容量
      refillRate = 1,       // 每秒填充令牌数
      keyPrefix = 'ratelimit:token:'
    } = config;

    const key = `${keyPrefix}${identifier}`;
    const now = Math.floor(Date.now() / 1000);

    try {
      // 使用 Redis Hash 存储令牌桶状态
      const bucketData = await this.cache.hgetall('tokenBucket', key);
      
      let tokens = parseFloat(bucketData.tokens) || capacity;
      let lastRefill = parseInt(bucketData.lastRefill) || now;

      // 计算新令牌
      const timePassed = now - lastRefill;
      const newTokens = Math.min(capacity, tokens + timePassed * refillRate);

      if (newTokens >= 1) {
        // 消耗一个令牌
        await this.cache.hset('tokenBucket', key, 'tokens', newTokens - 1);
        await this.cache.hset('tokenBucket', key, 'lastRefill', now);

        return {
          allowed: true,
          remaining: Math.floor(newTokens - 1),
          resetTime: (now + 1) * 1000
        };
      } else {
        return {
          allowed: false,
          remaining: 0,
          resetTime: (now + Math.ceil((1 - newTokens) / refillRate)) * 1000
        };
      }
    } catch (error) {
      console.error('Token bucket check error:', error);
      return { allowed: true, remaining: 0, resetTime: Date.now() };
    }
  }

  // ============================================
  // 中间件封装
  // ============================================

  middleware(type = 'api', options = {}) {
    const {
      keyGenerator = (req) => req.ip,
      skipSuccessfulRequests = false,
      handler = null
    } = options;

    return async (req, res, next) => {
      try {
        const identifier = keyGenerator(req);
        const result = await this.checkLimit(identifier, type);

        // 设置响应头
        res.setHeader('X-RateLimit-Limit', RATE_LIMIT_CONFIG[type].maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, result.remaining));
        res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000));

        if (!result.allowed) {
          if (handler) {
            return handler(req, res, next);
          }

          return res.status(429).json({
            error: '请求过于频繁，请稍后再试',
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
          });
        }

        // 记录原始 json 方法
        const originalJson = res.json.bind(res);
        
        // 重写 json 方法以捕获响应
        res.json = (data) => {
          // 如果请求成功且配置了跳过成功请求，不记录
          if (skipSuccessfulRequests && res.statusCode < 400) {
            // 从列表中移除最后一个请求记录
            // 这里简化处理，实际实现需要更复杂的逻辑
          }
          return originalJson(data);
        };

        next();
      } catch (error) {
        console.error('Rate limit middleware error:', error);
        next();
      }
    };
  }

  // ============================================
  // 管理接口
  // ============================================

  async resetLimit(identifier, type = 'api') {
    const config = RATE_LIMIT_CONFIG[type];
    const key = `${config.keyPrefix}${identifier}`;
    
    await this.cache.delete('rateLimit', key);
    await this.cache.delete('rateLimit', `${identifier}:blocked`);
  }

  async getLimitStatus(identifier, type = 'api') {
    const config = RATE_LIMIT_CONFIG[type];
    const key = `${config.keyPrefix}${identifier}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    try {
      const requests = await this.cache.lrange('rateLimit', key, 0, -1);
      const validRequests = requests.filter(timestamp => timestamp > windowStart);
      const isBlocked = await this.cache.get('rateLimit', `${identifier}:blocked`);

      return {
        identifier,
        type,
        totalRequests: validRequests.length,
        remaining: Math.max(0, config.maxRequests - validRequests.length),
        limit: config.maxRequests,
        windowMs: config.windowMs,
        isBlocked: !!isBlocked,
        blockExpires: isBlocked ? new Date(isBlocked) : null,
        resetTime: validRequests.length > 0 
          ? new Date(validRequests[0] + config.windowMs)
          : new Date(now + config.windowMs)
      };
    } catch (error) {
      console.error('Get limit status error:', error);
      return null;
    }
  }
}

// ============================================
// 单例模式
// ============================================

let rateLimiter = null;

export const getRateLimiter = async () => {
  if (!rateLimiter) {
    rateLimiter = new RateLimiter();
    await rateLimiter.init();
  }
  return rateLimiter;
};

export const initRateLimiter = async () => {
  return await getRateLimiter();
};

export default {
  getRateLimiter,
  initRateLimiter,
  RATE_LIMIT_CONFIG
};
