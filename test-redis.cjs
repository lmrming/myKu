/**
 * Redis 连接测试脚本
 * 验证 Redis 环境配置是否正确
 */

const { createClient } = require('redis');
require('dotenv').config();

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`)
};

// Redis 配置
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  database: parseInt(process.env.REDIS_DB) || 0,
  socket: {
    connectTimeout: 5000,
    keepAlive: 30000
  }
};

async function testRedis() {
  console.log('\n========================================');
  console.log('     Redis 环境配置验证测试');
  console.log('========================================\n');

  let client = null;

  try {
    // 1. 显示配置信息
    log.info('Redis 配置信息:');
    console.log(`  主机: ${redisConfig.host}`);
    console.log(`  端口: ${redisConfig.port}`);
    console.log(`  密码: ${redisConfig.password ? '已设置' : '未设置'}`);
    console.log(`  数据库: ${redisConfig.database}`);
    console.log('');

    // 2. 创建客户端
    log.info('正在创建 Redis 客户端...');
    client = createClient(redisConfig);

    // 监听事件
    client.on('error', (err) => {
      log.error(`Redis 错误: ${err.message}`);
    });

    client.on('connect', () => {
      log.success('Redis 客户端已连接');
    });

    client.on('ready', () => {
      log.success('Redis 客户端已就绪');
    });

    // 3. 连接 Redis
    log.info('正在连接 Redis 服务器...');
    await client.connect();

    // 4. 测试 Ping
    log.info('测试 Ping 命令...');
    const pingResult = await client.ping();
    if (pingResult === 'PONG') {
      log.success('Ping 测试通过');
    } else {
      log.error('Ping 测试失败');
      return;
    }

    // 5. 测试基本操作
    log.info('测试基本读写操作...');
    const testKey = 'test:connection';
    const testValue = { message: 'Redis 连接成功', timestamp: new Date().toISOString() };

    // 写入
    await client.setEx(testKey, 60, JSON.stringify(testValue));
    log.success('写入测试数据成功');

    // 读取
    const readValue = await client.get(testKey);
    if (readValue) {
      const parsed = JSON.parse(readValue);
      log.success('读取测试数据成功');
      console.log(`  数据: ${JSON.stringify(parsed, null, 2)}`);
    } else {
      log.error('读取测试数据失败');
    }

    // 删除
    await client.del(testKey);
    log.success('清理测试数据成功');

    // 6. 测试哈希操作
    log.info('测试哈希操作...');
    const hashKey = 'test:hash';
    await client.hSet(hashKey, 'field1', 'value1');
    await client.hSet(hashKey, 'field2', 'value2');
    
    const hashValue = await client.hGetAll(hashKey);
    if (Object.keys(hashValue).length === 2) {
      log.success('哈希操作测试通过');
    } else {
      log.error('哈希操作测试失败');
    }
    
    await client.del(hashKey);

    // 7. 测试列表操作
    log.info('测试列表操作...');
    const listKey = 'test:list';
    await client.lPush(listKey, 'item1');
    await client.lPush(listKey, 'item2');
    
    const listLength = await client.lLen(listKey);
    if (listLength === 2) {
      log.success('列表操作测试通过');
    } else {
      log.error('列表操作测试失败');
    }
    
    await client.del(listKey);

    // 8. 获取服务器信息
    log.info('获取 Redis 服务器信息...');
    const info = await client.info('server');
    const version = info.match(/redis_version:(.+)/);
    if (version) {
      log.success(`Redis 版本: ${version[1].trim()}`);
    }

    const memory = await client.info('memory');
    const usedMemory = memory.match(/used_memory_human:(.+)/);
    if (usedMemory) {
      log.success(`内存使用: ${usedMemory[1].trim()}`);
    }

    // 9. 测试 TTL
    log.info('测试过期时间...');
    const ttlKey = 'test:ttl';
    await client.setEx(ttlKey, 10, 'test-value');
    const ttl = await client.ttl(ttlKey);
    if (ttl > 0 && ttl <= 10) {
      log.success(`TTL 测试通过 (剩余 ${ttl} 秒)`);
    } else {
      log.error('TTL 测试失败');
    }
    await client.del(ttlKey);

    // 10. 总结
    console.log('\n========================================');
    log.success('所有测试通过！Redis 环境配置正确。');
    console.log('========================================\n');

  } catch (error) {
    console.log('\n========================================');
    log.error('Redis 连接测试失败！');
    console.log('========================================\n');
    
    log.error(`错误信息: ${error.message}`);
    
    if (error.message.includes('ECONNREFUSED')) {
      log.warning('无法连接到 Redis 服务器，请检查:');
      console.log('  1. Redis 服务是否已启动');
      console.log('  2. 主机地址和端口是否正确');
      console.log('  3. 防火墙是否允许连接');
      console.log('');
      log.info('启动 Redis 的方法:');
      console.log('  - Docker: docker run -d -p 6379:6379 redis:7-alpine');
      console.log('  - macOS: brew services start redis');
      console.log('  - Ubuntu: sudo systemctl start redis-server');
    }
    
    if (error.message.includes('WRONGPASS')) {
      log.warning('密码验证失败，请检查 REDIS_PASSWORD 配置');
    }

    process.exit(1);
  } finally {
    if (client) {
      await client.quit();
      log.info('Redis 连接已关闭');
    }
  }
}

// 运行测试
testRedis();
