/**
 * 同步功能诊断脚本
 * 检查所有可能导致同步失败的环节
 */

const http = require('http');
const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

console.log('========================================');
console.log('     同步功能诊断报告');
console.log('========================================\n');

async function diagnose() {
  const issues = [];
  const results = {};

  // 1. 检查 .env 配置
  console.log('【1/6】检查环境配置');
  try {
    const envPath = '.env';
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const hasDBConfig = envContent.includes('DB_HOST') && 
                          envContent.includes('DB_USER') && 
                          envContent.includes('DB_PASSWORD') && 
                          envContent.includes('DB_NAME');
      
      results.envConfig = {
        exists: true,
        hasDBConfig: hasDBConfig,
        port: process.env.PORT || '未设置',
        dbHost: process.env.DB_HOST || '未设置',
        dbName: process.env.DB_NAME || '未设置'
      };
      
      if (!hasDBConfig) {
        issues.push('.env 文件缺少数据库配置');
      }
      console.log(`  ✓ .env 文件存在`);
      console.log(`  ✓ 数据库: ${results.envConfig.dbHost}/${results.envConfig.dbName}`);
      console.log(`  ✓ 后端端口: ${results.envConfig.port}\n`);
    } else {
      issues.push('.env 文件不存在');
      console.log('  ✗ .env 文件不存在\n');
    }
  } catch (err) {
    issues.push(`读取 .env 失败: ${err.message}`);
    console.log(`  ✗ 错误: ${err.message}\n`);
  }

  // 2. 检查数据库连接
  console.log('【2/6】检查数据库连接');
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'myku_app'
    });
    
    await connection.execute('SELECT 1 as test');
    
    // 检查表是否存在
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'myku_app'}'
    `);
    
    results.database = {
      connected: true,
      tables: tables.map(t => t.TABLE_NAME)
    };
    
    console.log(`  ✓ 数据库连接成功`);
    console.log(`  ✓ 发现 ${tables.length} 个数据表\n`);
    
    await connection.end();
  } catch (err) {
    results.database = { connected: false, error: err.message };
    issues.push(`数据库连接失败: ${err.code || err.message}`);
    console.log(`  ✗ 数据库连接失败: ${err.code || err.message}\n`);
  }

  // 3. 检查后端服务器是否运行
  console.log('【3/6】检查后端服务器');
  const backendPort = process.env.PORT || 3000;
  
  try {
    const isRunning = await new Promise((resolve) => {
      const req = http.get(`http://localhost:${backendPort}/api/health`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({ running: true, status: res.statusCode, data });
        });
      }).on('error', (e) => {
        resolve({ running: false, error: e.message });
      });
      req.setTimeout(5000);
    });

    results.backend = isRunning;
    
    if (isRunning.running) {
      console.log(`  ✓ 后端服务器运行正常 (端口 ${backendPort})`);
      console.log(`  ✓ 健康检查响应: ${isRunning.data}\n`);
    } else {
      issues.push(`后端服务器未运行: ${isRunning.error}`);
      console.log(`  ✗ 后端服务器未运行: ${isRunning.error}`);
      console.log(`  解决方案: 运行 npm run server 或 node server-mysql.cjs\n`);
    }
  } catch (err) {
    issues.push(`检查后端服务器失败: ${err.message}`);
    console.log(`  ✗ 检查失败: ${err.message}\n`);
  }

  // 4. 检查前端开发服务器
  console.log('【4/6】检查前端开发服务器');
  const frontendPort = 3001;
  
  try {
    const isRunning = await new Promise((resolve) => {
      const req = http.get(`http://localhost:${frontendPort}`, (res) => {
        resolve({ running: true, status: res.statusCode });
      }).on('error', (e) => {
        resolve({ running: false, error: e.message });
      });
      req.setTimeout(5000);
    });

    results.frontend = isRunning;
    
    if (isRunning.running) {
      console.log(`  ✓ 前端开发服务器运行正常 (端口 ${frontendPort})\n`);
    } else {
      issues.push(`前端开发服务器未运行: ${isRunning.error}`);
      console.log(`  ✗ 前端开发服务器未运行: ${isRunning.error}\n`);
    }
  } catch (err) {
    issues.push(`检查前端服务器失败: ${err.message}`);
    console.log(`  ✗ 检查失败: ${err.message}\n`);
  }

  // 5. 检查 CORS 配置
  console.log('【5/6】检查 CORS 配置');
  try {
    const serverFile = fs.readFileSync('server-mysql.cjs', 'utf8');
    const hasCors = serverFile.includes("app.use(cors())") || serverFile.includes("cors()");
    
    results.cors = { configured: hasCors };
    
    if (hasCors) {
      console.log('  ✓ CORS 中间件已配置\n');
    } else {
      issues.push('CORS 未配置，可能导致跨域问题');
      console.log('  ⚠ CORS 未配置，可能需要添加 cors() 中间件\n');
    }
  } catch (err) {
    issues.push(`检查 CORS 失败: ${err.message}`);
    console.log(`  ✗ 检查失败: ${err.message}\n`);
  }

  // 6. 检查数据同步服务文件
  console.log('【6/6】检查同步服务文件');
  const syncFiles = [
    'src/services/dataSync.js',
    'src/components/SyncButton.jsx'
  ];
  
  for (const file of syncFiles) {
    if (fs.existsSync(file)) {
      console.log(`  ✓ ${file} 存在`);
    } else {
      issues.push(`${file} 不存在`);
      console.log(`  ✗ ${file} 缺失`);
    }
  }
  console.log('');

  // 输出诊断结果
  console.log('========================================');
  console.log('     诊断总结');
  console.log('========================================\n');

  if (issues.length === 0) {
    console.log('✓ 所有检查通过，系统应该可以正常同步\n');
    console.log('如果仍然失败，请检查:');
    console.log('  - 浏览器控制台的详细错误信息');
    console.log('  - 网络请求 (F12 → Network 标签)');
    console.log('  - 用户是否已登录 (需要 currentUser.id)');
  } else {
    console.log(`发现 ${issues.length} 个问题:\n`);
    issues.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue}`);
    });
    
    console.log('\n【解决方案】');
    
    if (issues.some(i => i.includes('后端服务器'))) {
      console.log('  1. 启动后端服务器:');
      console.log('     npm run server');
      console.log('     或');
      console.log('     node server-mysql.cjs');
    }
    
    if (issues.some(i => i.includes('前端开发服务器'))) {
      console.log('  2. 启动前端开发服务器:');
      console.log('     npm run dev');
    }
    
    if (issues.some(i => i.includes('数据库'))) {
      console.log('  3. 确保 MySQL 服务正在运行:');
      console.log('     Windows: services.msc → MySQL → 启动');
    }

    if (issues.some(i => i.includes('CORS'))) {
      console.log('  4. 确保后端已安装并配置 cors:');
      console.log('     npm install cors');
    }
  }

  return { success: issues.length === 0, issues, results };
}

// 运行诊断
diagnose().then(result => {
  process.exit(result.success ? 0 : 1);
});
