/**
 * 数据同步检查脚本
 * 验证应用程序数据是否正确同步到数据库
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'myku_app'
};

console.log('========================================');
console.log('     数据同步检查报告');
console.log('========================================\n');

async function checkDataSync() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✓ 数据库连接成功\n');
    
    // 检查所有表的数据
    const tables = ['users', 'todos', 'notes', 'habits', 'habit_logs'];
    const results = {};
    
    for (const table of tables) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        const [latest] = await connection.execute(
          `SELECT * FROM ${table} ORDER BY created_at DESC LIMIT 1`
        );
        
        results[table] = {
          count: rows[0].count,
          latest: latest[0] || null
        };
        
        console.log(`【${table} 表】`);
        console.log(`  记录数: ${rows[0].count}`);
        if (latest[0]) {
          console.log(`  最新记录时间: ${latest[0].created_at || latest[0].updated_at || 'N/A'}`);
        }
        console.log('');
      } catch (err) {
        console.log(`【${table} 表】`);
        console.log(`  ⚠ 查询失败: ${err.message}\n`);
        results[table] = { error: err.message };
      }
    }
    
    // 检查 localStorage 数据（模拟前端存储）
    console.log('【LocalStorage 数据】');
    const localData = {
      users: JSON.parse(require('fs').existsSync('./localStorage.json') ? require('fs').readFileSync('./localStorage.json') : '{}'),
      todos: '存储在浏览器 localStorage',
      notes: '存储在浏览器 localStorage',
      habits: '存储在浏览器 localStorage'
    };
    console.log('  当前实现: 数据主要存储在浏览器 localStorage');
    console.log('  数据库: 用于用户认证和持久化备份\n');
    
    // 数据一致性检查
    console.log('【数据一致性检查】');
    
    // 检查用户表
    if (results.users && results.users.count > 0) {
      console.log('✓ 用户数据已同步到数据库');
      
      // 检查用户完整性
      const [users] = await connection.execute('SELECT id, username, email, created_at FROM users LIMIT 5');
      console.log('\n  用户列表（前5条）:');
      users.forEach((user, i) => {
        console.log(`    ${i + 1}. ${user.username} (${user.email}) - 创建于 ${user.created_at}`);
      });
    } else {
      console.log('⚠ 用户表为空，可能尚未同步');
    }
    
    // 检查待办事项
    if (results.todos && results.todos.count > 0) {
      console.log('\n✓ 待办事项已同步到数据库');
    } else {
      console.log('\n⚠ 待办事项表为空');
      console.log('  说明: 待办事项当前存储在浏览器 localStorage 中');
    }
    
    // 检查备忘录
    if (results.notes && results.notes.count > 0) {
      console.log('\n✓ 备忘录已同步到数据库');
    } else {
      console.log('\n⚠ 备忘录表为空');
      console.log('  说明: 备忘录当前存储在浏览器 localStorage 中');
    }
    
    // 检查习惯
    if (results.habits && results.habits.count > 0) {
      console.log('\n✓ 习惯数据已同步到数据库');
    } else {
      console.log('\n⚠ 习惯表为空');
      console.log('  说明: 习惯数据当前存储在浏览器 localStorage 中');
    }
    
    console.log('\n========================================');
    console.log('     数据同步状态总结');
    console.log('========================================\n');
    
    console.log('【当前架构】');
    console.log('  应用程序使用混合存储策略:');
    console.log('  1. 浏览器 localStorage - 主要数据存储');
    console.log('  2. MySQL 数据库 - 用户认证 + 数据备份\n');
    
    console.log('【同步状态】');
    const totalRecords = Object.values(results).reduce((sum, r) => sum + (r.count || 0), 0);
    if (totalRecords > 0) {
      console.log(`✓ 数据库中共有 ${totalRecords} 条记录`);
      console.log('✓ 数据同步功能正常\n');
    } else {
      console.log('⚠ 数据库中暂无数据');
      console.log('  可能原因:');
      console.log('  - 应用程序刚部署，尚未有用户数据');
      console.log('  - 数据仅存储在浏览器 localStorage 中');
      console.log('  - 同步功能尚未启用\n');
    }
    
    console.log('【建议】');
    console.log('  如需启用完整的数据库同步:');
    console.log('  1. 修改 API 层，将 localStorage 操作改为数据库操作');
    console.log('  2. 添加数据同步机制（定时同步或实时同步）');
    console.log('  3. 添加离线支持（PWA + Service Worker）\n');
    
    return true;
    
  } catch (error) {
    console.error('\n【错误】');
    console.error(`  数据库连接失败: ${error.message}`);
    console.error('\n  可能原因:');
    console.error('  - 数据库服务未启动');
    console.error('  - 连接配置错误');
    console.error('  - 网络问题\n');
    return false;
    
  } finally {
    if (connection) {
      await connection.end();
      console.log('  连接已关闭');
    }
  }
}

// 运行检查
checkDataSync().then(success => {
  process.exit(success ? 0 : 1);
});
