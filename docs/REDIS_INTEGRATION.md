# Redis 集成指南

本文档详细说明如何在 myku 项目中集成和使用 Redis。

## 目录

1. [快速开始](#快速开始)
2. [架构设计](#架构设计)
3. [配置说明](#配置说明)
4. [使用示例](#使用示例)
5. [性能优化](#性能优化)
6. [监控告警](#监控告警)
7. [故障排查](#故障排查)

---

## 快速开始

### 1. 安装 Redis

#### 使用 Docker（推荐开发环境）

```bash
# 启动 Redis 服务
docker-compose -f docker-compose.redis.yml up -d

# 查看 Redis 状态
docker ps | grep redis

# 访问 Redis 管理界面
open http://localhost:8081
```

#### 本地安装

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Windows (WSL2)
sudo apt-get install redis-server
sudo service redis-server start
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 到 `.env` 并配置 Redis 连接信息：

```bash
cp .env.example .env
```

编辑 `.env`：

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### 4. 验证安装

```bash
# 启动开发服务器
npm run dev

# 在浏览器控制台查看 Redis 连接状态
```

---

## 架构设计

### 整体架构

```
┌─────────────────┐
│   React 前端    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Express 后端   │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐  ┌────────┐
│ MySQL │  │ Redis  │
│(主存储)│  │(缓存层)│
└───────┘  └────────┘
```

### Redis 使用场景

| 场景 | 数据类型 | TTL | 说明 |
|------|----------|-----|------|
| 用户会话 | String | 24h | JWT Token 黑名单 |
| 用户数据 | String | 30min | 用户信息缓存 |
| 待办列表 | String | 5min | 待办事项缓存 |
| 习惯统计 | String | 1min | 频繁更新的统计 |
| API 响应 | String | 1min | 接口结果缓存 |
| 速率限制 | List | 1min | 滑动窗口计数 |
| 实时计数 | String | - | 在线用户数等 |

### 缓存策略

```
┌─────────────┐
│  请求到达   │
└──────┬──────┘
       ▼
┌─────────────┐
│ 检查 Redis  │
└──────┬──────┘
   命中 │ 未命中
   ┌───┘     └───┐
   ▼             ▼
┌───────┐   ┌───────────┐
│返回缓存│   │ 查询 MySQL │
└───────┘   └─────┬─────┘
                  ▼
            ┌───────────┐
            │ 写入 Redis │
            └─────┬─────┘
                  ▼
            ┌───────────┐
            │ 返回数据  │
            └───────────┘
```

---

## 配置说明

### 基础配置 (`src/config/redis.config.js`)

```javascript
export const REDIS_CONFIG = {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    database: parseInt(process.env.REDIS_DB) || 0,
    socket: {
      connectTimeout: 5000,
      keepAlive: 30000,
      reconnectStrategy: (retries) => Math.min(retries * 50, 30000)
    }
  }
}
```

### 缓存策略配置

```javascript
export const CACHE_STRATEGY = {
  strategies: {
    user: {
      ttl: 1800,           // 30 分钟
      keyPrefix: 'user:',
      invalidateOn: ['user:update', 'user:delete']
    },
    todo: {
      ttl: 300,            // 5 分钟
      keyPrefix: 'todo:',
      invalidateOn: ['todo:create', 'todo:update', 'todo:delete']
    }
    // ... 更多配置
  }
}
```

### 防护配置

```javascript
export const CACHE_PROTECTION = {
  penetration: {
    enabled: true,
    emptyValueTTL: 60       // 空值缓存 60 秒
  },
  breakdown: {
    enabled: true,
    lockTTL: 10             // 互斥锁 10 秒
  },
  avalanche: {
    enabled: true,
    randomRange: 30         // 随机偏移 30 秒
  }
}
```

---

## 使用示例

### 基础缓存操作

```javascript
import { getCacheManager } from '../services/redis.service.js';

const cache = await getCacheManager();

// 写入缓存
await cache.set('user', userId, userData);

// 读取缓存
const user = await cache.get('user', userId);

// 删除缓存
await cache.delete('user', userId);

// 批量操作
await cache.mset('user', [
  ['user1', data1],
  ['user2', data2]
]);
```

### 缓存 Aside 模式（推荐）

```javascript
// 自动处理缓存未命中
const user = await cache.getOrSet(
  'user',
  userId,
  async () => {
    // 从数据库查询
    return await db.query('SELECT * FROM users WHERE id = ?', [userId]);
  }
);
```

### 在 API 中使用

```javascript
app.get('/api/users/:id', async (req, res) => {
  const cache = await getCacheManager();
  const userId = req.params.id;
  
  try {
    // 尝试从缓存获取
    let user = await cache.get('user', userId);
    
    if (!user) {
      // 缓存未命中，查询数据库
      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );
      
      user = rows[0];
      
      if (user) {
        // 写入缓存
        await cache.set('user', userId, user);
      }
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 速率限制

```javascript
import { getRateLimiter } from '../services/rateLimiter.service.js';

const rateLimiter = await getRateLimiter();

// 应用限流中间件
app.use('/api/', rateLimiter.middleware('api'));
app.use('/api/login', rateLimiter.middleware('login'));

// 自定义限流
app.post('/api/sensitive', async (req, res) => {
  const result = await rateLimiter.checkLimit(req.ip, 'api');
  
  if (!result.allowed) {
    return res.status(429).json({
      error: '请求过于频繁',
      retryAfter: result.resetTime
    });
  }
  
  // 处理请求...
});
```

### 缓存失效

```javascript
// 更新用户时失效缓存
app.put('/api/users/:id', async (req, res) => {
  const cache = await getCacheManager();
  const userId = req.params.id;
  
  // 更新数据库
  await pool.execute(
    'UPDATE users SET ... WHERE id = ?',
    [..., userId]
  );
  
  // 失效缓存
  await cache.delete('user', userId);
  
  res.json({ message: '更新成功' });
});
```

---

## 性能优化

### 1. 连接池优化

Redis 客户端自动管理连接池，无需额外配置。关键参数：

- `connectTimeout`: 5000ms（连接超时）
- `keepAlive`: 30000ms（TCP 保活）
- `reconnectStrategy`: 指数退避重连

### 2. 序列化优化

```javascript
// 大数据启用压缩
export const SERIALIZATION = {
  compression: {
    enabled: true,
    threshold: 1024  // 超过 1KB 压缩
  }
}
```

### 3. 批量操作

```javascript
// 使用 pipeline 批量写入
await cache.mset('user', users.map(u => [u.id, u]));

// 批量读取
const users = await cache.mget('user', userIds);
```

### 4. 内存管理

```bash
# 查看内存使用
redis-cli INFO memory

# 设置最大内存
maxmemory 256mb
maxmemory-policy allkeys-lru
```

---

## 监控告警

### 1. 内置监控

```javascript
// 获取缓存统计
const stats = await cache.getStats();
console.log('缓存命中率:', stats.stats.keyspace_hits);
console.log('缓存未命中:', stats.stats.keyspace_misses);
```

### 2. 健康检查

```javascript
// 健康检查端点
app.get('/health', async (req, res) => {
  const cache = await getCacheManager();
  const health = await cache.health();
  
  res.json({
    status: health.status,
    redis: health.connected,
    timestamp: new Date().toISOString()
  });
});
```

### 3. 慢查询监控

```bash
# 查看慢查询
redis-cli SLOWLOG GET 10

# 配置慢查询阈值
slowlog-log-slower-than 10000  # 10ms
```

### 4. 关键指标

| 指标 | 告警阈值 | 说明 |
|------|----------|------|
| 内存使用率 | > 80% | 内存不足风险 |
| 连接数 | > 80% | 连接池耗尽 |
| 命中率 | < 80% | 缓存效果差 |
| 慢查询 | > 100ms | 性能问题 |

---

## 故障排查

### 常见问题

#### 1. 连接失败

```bash
# 检查 Redis 服务状态
docker ps | grep redis

# 测试连接
redis-cli ping

# 查看日志
docker logs myku-redis
```

#### 2. 内存不足

```bash
# 查看内存使用
redis-cli INFO memory

# 清理过期键
redis-cli EVAL "return redis.call('del', unpack(redis.call('keys', 'user:*')))" 0

# 增加内存限制
# 修改 redis.conf: maxmemory 512mb
```

#### 3. 缓存未生效

```javascript
// 检查缓存键
const keys = await cache.client.keys('user:*');
console.log('缓存键:', keys);

// 检查 TTL
const ttl = await cache.client.ttl('user:123');
console.log('剩余时间:', ttl);
```

#### 4. 性能问题

```bash
# 监控实时命令
redis-cli MONITOR

# 查看慢查询
redis-cli SLOWLOG GET

# 统计命令频率
redis-cli INFO commandstats
```

### 调试工具

```bash
# Redis CLI
redis-cli

# 图形化管理
open http://localhost:8081  # Redis Commander

# 性能测试
redis-benchmark -n 100000 -c 50
```

---

## 生产环境部署

### 1. 高可用架构

```
┌─────────────┐
│  Application │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   HAProxy   │
└──────┬──────┘
       │
   ┌───┴───┐
   ▼       ▼
┌──────┐ ┌──────┐
│Redis │ │Redis │
│Master│ │Slave │
└──┬───┘ └──────┘
   │
   ▼
┌──────┐
│  AOF │
│  RDB │
└──────┘
```

### 2. 配置建议

```conf
# redis.conf 生产环境配置

# 内存
maxmemory 1gb
maxmemory-policy allkeys-lru

# 持久化
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec

# 安全
requirepass your_strong_password
rename-command FLUSHDB ""
rename-command FLUSHALL ""

# 性能
tcp-keepalive 60
timeout 0
```

### 3. 备份策略

```bash
# 自动备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
redis-cli BGSAVE
sleep 5
cp /data/dump.rdb /backup/redis/dump_$DATE.rdb
find /backup/redis -name "dump_*.rdb" -mtime +7 -delete
```

---

## 总结

Redis 集成后预期收益：

- **响应时间**: 减少 50-80%
- **数据库负载**: 减少 60-90%
- **并发能力**: 提升 3-5 倍
- **用户体验**: 显著提升

更多问题请参考：
- [Redis 官方文档](https://redis.io/documentation)
- [ioredis 文档](https://github.com/redis/ioredis)
- 项目 Issues
