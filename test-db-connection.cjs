/**
 * 数据库连接测试脚本
 * 测试 MySQL 数据库连接状态
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'myku_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

console.log('========================================');
console.log('     数据库连接测试报告');
console.log('========================================\n');

console.log('【配置信息】');
console.log(`  主机地址: ${dbConfig.host}`);
console.log(`  用户名: ${dbConfig.user}`);
console.log(`  数据库名: ${dbConfig.database}`);
console.log(`  密码: ${dbConfig.password ? '已设置' : '未设置'}\n`);

async function testConnection() {
  let connection;
  
  try {
    console.log('【连接测试】');
    console.log('  正在尝试连接 MySQL 服务器...');
    
    // 测试基础连接（不指定数据库）
    connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });
    
    console.log('  ✓ 服务器连接成功\n');
    
    // 测试数据库存在性
    console.log('【数据库检查】');
    const [rows] = await connection.execute(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
      [dbConfig.database]
    );
    
    if (rows.length > 0) {
      console.log(`  ✓ 数据库 "${dbConfig.database}" 存在\n`);
    } else {
      console.log(`  ⚠ 数据库 "${dbConfig.database}" 不存在，需要创建\n`);
    }
    
    // 关闭当前连接，使用完整配置重新连接
    await connection.end();
    
    // 测试数据库连接（使用完整配置）
    console.log('【数据库连接测试】');
    connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database
    });
    
    const [result] = await connection.execute('SELECT 1 as test');
    console.log('  ✓ 数据库连接成功');
    console.log(`  ✓ 测试查询结果: ${result[0].test}\n`);
    
    // 检查表结构
    console.log('【表结构检查】');
    const [tables] = await connection.execute(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?`,
      [dbConfig.database]
    );
    
    if (tables.length > 0) {
      console.log(`  ✓ 发现 ${tables.length} 个数据表:`);
      tables.forEach((table, index) => {
        console.log(`    ${index + 1}. ${table.TABLE_NAME}`);
      });
    } else {
      console.log('  ⚠ 数据库中暂无数据表');
    }
    
    console.log('\n========================================');
    console.log('     ✅ 所有测试通过');
    console.log('     数据库连接正常');
    console.log('========================================');
    
    return true;
    
  } catch (error) {
    console.log('\n【错误信息】');
    console.log(`  错误代码: ${error.code || 'N/A'}`);
    console.log(`  错误信息: ${error.message}\n`);
    
    console.log('========================================');
    console.log('     ❌ 连接测试失败');
    console.log('========================================');
    
    // 提供解决方案
    console.log('\n【可能的解决方案】');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('  1. MySQL 服务未启动');
      console.log('     - Windows:  services.msc 中找到 MySQL 并启动');
      console.log('     - 或运行: net start MySQL');
      console.log('  2. 端口号错误（默认 3306）');
      console.log('  3. 防火墙阻止了连接');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('  1. 用户名或密码错误');
      console.log('  2. 检查 .env 文件中的 DB_USER 和 DB_PASSWORD');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('  1. 数据库不存在');
      console.log('  2. 运行服务器会自动创建数据库');
      console.log('     命令: npm run server');
    } else if (error.code === 'ENOTFOUND') {
      console.log('  1. 主机地址无法解析');
      console.log('  2. 检查 .env 文件中的 DB_HOST');
    }
    
    return false;
    
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n  连接已关闭');
    }
  }
}

// 运行测试
testConnection().then(success => {
  process.exit(success ? 0 : 1);
});
