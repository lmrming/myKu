const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// ==================== 全局错误处理 ====================
process.on('uncaughtException', (err) => {
  console.error('[FATAL] 未捕获异常:', err.message);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[WARN] 未处理的 Promise 拒绝:', reason);
});

// ==================== 请求超时中间件 ====================
const REQUEST_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT || '15000', 10);
app.use((req, res, next) => {
  req.setTimeout(REQUEST_TIMEOUT_MS, () => {
    if (!res.headersSent) {
      res.status(504).json({ error: '请求超时' });
    }
  });
  next();
});

// 中间件
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'dist')));

// 数据库连接（WAL 模式 + 并发安全）
const DB_PATH = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('数据库连接失败:', err);
  } else {
    console.log('成功连接到 SQLite 数据库');
    initDatabase();
  }
});

// 启用 WAL 模式（读写不阻塞）
db pragma('journal_mode = WAL');
// 外键约束
db pragma('foreign_keys = ON');
// 同步模式：NORMAL（平衡性能与安全）
db pragma('synchronous = NORMAL');
// 缓存大小：-2000 = 2MB
db pragma('cache_size = -2000');
// 忙超时：5000ms（写锁等待时间）
db pragma('busy_timeout = 5000');

// 写操作序列化队列（防止并发写入冲突）
let writeQueue = Promise.resolve();
const _originalRun = db.run.bind(db);
db.run = function(...args) {
  const hasCallback = typeof args[args.length - 1] === 'function';
  
  return new Promise((resolve, reject) => {
    const cbArgs = hasCallback ? args.slice(0, -1) : args;
    
    writeQueue = writeQueue.then(() => new Promise((res, rej) => {
      _originalRun.call(db, ...cbArgs, function(err) {
        if (err) { rej(err); } else { res(this); }
      });
    })).then(resolve).catch(reject);
    
    if (hasCallback) {
      const originalCb = args[args.length - 1];
      writeQueue = writeQueue.then(
        result => { originalCb(null, result); return result; },
        err => { originalCb(err); throw err; }
      );
    }
  });
};

// 初始化数据库表
function initDatabase() {
  // 用户表
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT,
    gender TEXT,
    age INTEGER,
    birth TEXT,
    address TEXT,
    hobbies TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 待办事项表
  db.run(`CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    task TEXT NOT NULL,
    completed BOOLEAN DEFAULT 0,
    priority TEXT DEFAULT 'medium',
    category TEXT DEFAULT '其他',
    due_date TEXT,
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // 备忘录表
  db.run(`CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT NOT NULL,
    content TEXT,
    category TEXT DEFAULT '其他',
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // 习惯表
  db.run(`CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    description TEXT,
    frequency TEXT DEFAULT 'daily',
    reminder_time TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // 习惯打卡记录表
  db.run(`CREATE TABLE IF NOT EXISTS habit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER,
    user_id INTEGER,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (habit_id) REFERENCES habits(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  console.log('数据库表初始化完成');
}

// ==================== 用户相关 API ====================

// 注册
app.post('/api/register', (req, res) => {
  const { username, password, email, gender, age, birth, address, hobbies } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  const sql = `INSERT INTO users (username, password, email, gender, age, birth, address, hobbies) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [username, password, email, gender, age, birth, address, JSON.stringify(hobbies || [])], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: '用户名已存在' });
      }
      return res.status(500).json({ error: '注册失败: ' + err.message });
    }
    
    res.json({ 
      message: '注册成功', 
      user: { 
        id: this.lastID, 
        username, 
        email, 
        gender, 
        age, 
        birth, 
        address, 
        hobbies 
      } 
    });
  });

// 登录
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  const sql = `SELECT * FROM users WHERE username = ? AND password = ?`;
  
  db.get(sql, [username, password], (err, row) => {
    if (err) {
      return res.status(500).json({ error: '登录失败: ' + err.message });
    }
    
    if (!row) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    const user = {
      id: row.id,
      username: row.username,
      email: row.email,
      gender: row.gender,
      age: row.age,
      birth: row.birth,
      address: row.address,
      hobbies: JSON.parse(row.hobbies || '[]')
    };
    
    res.json({ message: '登录成功', user });
  });
});

// 获取用户信息
app.get('/api/users/:id', (req, res) => {
  const sql = `SELECT id, username, email, gender, age, birth, address, hobbies, created_at FROM users WHERE id = ?`;
  
  db.get(sql, [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    row.hobbies = JSON.parse(row.hobbies || '[]');
    res.json(row);
  });
});

// 更新用户信息
app.put('/api/users/:id', (req, res) => {
  const { email, gender, age, birth, address, hobbies } = req.body;
  
  const sql = `UPDATE users SET email = ?, gender = ?, age = ?, birth = ?, address = ?, hobbies = ? WHERE id = ?`;
  
  db.run(sql, [email, gender, age, birth, address, JSON.stringify(hobbies || []), req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: '更新成功' });
  });
});

// ==================== 待办事项 API ====================

// 获取所有待办
app.get('/api/todos', (req, res) => {
  const userId = req.query.user_id;
  let sql = `SELECT * FROM todos`;
  let params = [];
  
  if (userId) {
    sql += ` WHERE user_id = ?`;
    params.push(userId);
  }
  
  sql += ` ORDER BY created_at DESC`;
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const todos = rows.map(row => ({
      ...row,
      tags: JSON.parse(row.tags || '[]')
    }));
    
    res.json(todos);
  });
});

// 创建待办
app.post('/api/todos', (req, res) => {
  const { user_id, task, priority, category, due_date, tags } = req.body;
  
  const sql = `INSERT INTO todos (user_id, task, priority, category, due_date, tags) 
               VALUES (?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [user_id, task, priority, category, due_date, JSON.stringify(tags || [])], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.json({
      id: this.lastID,
      user_id,
      task,
      completed: false,
      priority,
      category,
      due_date,
      tags: tags || [],
      created_at: new Date().toISOString()
    });
  });
});

// 更新待办
app.put('/api/todos/:id', (req, res) => {
  const { task, completed, priority, category, due_date, tags, completed_at } = req.body;
  
  const sql = `UPDATE todos SET 
    task = COALESCE(?, task),
    completed = COALESCE(?, completed),
    priority = COALESCE(?, priority),
    category = COALESCE(?, category),
    due_date = COALESCE(?, due_date),
    tags = COALESCE(?, tags),
    completed_at = COALESCE(?, completed_at)
    WHERE id = ?`;
  
  db.run(sql, [task, completed, priority, category, due_date, 
               tags ? JSON.stringify(tags) : null, completed_at, req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: '更新成功' });
  });
});

// 删除待办
app.delete('/api/todos/:id', (req, res) => {
  const sql = `DELETE FROM todos WHERE id = ?`;
  
  db.run(sql, [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: '删除成功' });
  });
});

// ==================== 备忘录 API ====================

// 获取所有备忘录
app.get('/api/notes', (req, res) => {
  const userId = req.query.user_id;
  let sql = `SELECT * FROM notes`;
  let params = [];
  
  if (userId) {
    sql += ` WHERE user_id = ?`;
    params.push(userId);
  }
  
  sql += ` ORDER BY updated_at DESC`;
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const notes = rows.map(row => ({
      ...row,
      tags: JSON.parse(row.tags || '[]')
    }));
    
    res.json(notes);
  });
});

// 创建备忘录
app.post('/api/notes', (req, res) => {
  const { user_id, title, content, category, tags } = req.body;
  
  const sql = `INSERT INTO notes (user_id, title, content, category, tags) 
               VALUES (?, ?, ?, ?, ?)`;
  
  db.run(sql, [user_id, title, content, category, JSON.stringify(tags || [])], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.json({
      id: this.lastID,
      user_id,
      title,
      content,
      category,
      tags: tags || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  });
});

// 更新备忘录
app.put('/api/notes/:id', (req, res) => {
  const { title, content, category, tags } = req.body;
  
  const sql = `UPDATE notes SET 
    title = COALESCE(?, title),
    content = COALESCE(?, content),
    category = COALESCE(?, category),
    tags = COALESCE(?, tags),
    updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`;
  
  db.run(sql, [title, content, category, tags ? JSON.stringify(tags) : null, req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: '更新成功' });
  });
});

// 删除备忘录
app.delete('/api/notes/:id', (req, res) => {
  const sql = `DELETE FROM notes WHERE id = ?`;
  
  db.run(sql, [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: '删除成功' });
  });
});

// ==================== 习惯 API ====================

// 获取所有习惯
app.get('/api/habits', (req, res) => {
  const userId = req.query.user_id;
  let sql = `SELECT * FROM habits`;
  let params = [];
  
  if (userId) {
    sql += ` WHERE user_id = ?`;
    params.push(userId);
  }
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// 创建习惯
app.post('/api/habits', (req, res) => {
  const { user_id, name, description, frequency, reminder_time } = req.body;
  
  const sql = `INSERT INTO habits (user_id, name, description, frequency, reminder_time) 
               VALUES (?, ?, ?, ?, ?)`;
  
  db.run(sql, [user_id, name, description, frequency, reminder_time], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.json({
      id: this.lastID,
      user_id,
      name,
      description,
      frequency,
      reminder_time,
      created_at: new Date().toISOString()
    });
  });
});

// 更新习惯
app.put('/api/habits/:id', (req, res) => {
  const { name, description, frequency, reminder_time } = req.body;
  
  const sql = `UPDATE habits SET 
    name = COALESCE(?, name),
    description = COALESCE(?, description),
    frequency = COALESCE(?, frequency),
    reminder_time = COALESCE(?, reminder_time)
    WHERE id = ?`;
  
  db.run(sql, [name, description, frequency, reminder_time, req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: '更新成功' });
  });
});

// 删除习惯
app.delete('/api/habits/:id', (req, res) => {
  const sql = `DELETE FROM habits WHERE id = ?`;
  
  db.run(sql, [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: '删除成功' });
  });
});

// 习惯打卡
app.post('/api/habits/:id/checkin', (req, res) => {
  const { user_id } = req.body;
  
  const sql = `INSERT INTO habit_logs (habit_id, user_id) VALUES (?, ?)`;
  
  db.run(sql, [req.params.id, user_id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: '打卡成功', id: this.lastID });
  });
});

// 获取习惯打卡记录
app.get('/api/habits/:id/logs', (req, res) => {
  const sql = `SELECT * FROM habit_logs WHERE habit_id = ? ORDER BY completed_at DESC`;
  
  db.all(sql, [req.params.id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 处理前端路由
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log('API 文档:');
  console.log('  POST /api/register     - 注册');
  console.log('  POST /api/login        - 登录');
  console.log('  GET  /api/todos        - 获取待办');
  console.log('  POST /api/todos        - 创建待办');
  console.log('  PUT  /api/todos/:id    - 更新待办');
  console.log('  DELETE /api/todos/:id  - 删除待办');
  console.log('  GET  /api/notes        - 获取备忘录');
  console.log('  GET  /api/habits       - 获取习惯');
});

// 优雅关闭
let isShuttingDown = false;
function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n[SHUTDOWN] 收到 ${signal}，正在优雅关闭...`);
  
  server.close(() => {
    console.log('[SHUTDOWN] HTTP 服务已停止');
    db.close((err) => {
      if (err) console.error('关闭数据库时出错:', err);
      else console.log('[SHUTDOWN] 数据库连接已关闭');
      process.exit(0);
    });
    setTimeout(() => { console.warn('[SHUTDOWN] 强制退出'); process.exit(1); }, 5000);
  });
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// 内存监控（每 60 秒）
const MEM_CHECK_INTERVAL = parseInt(process.env.MEM_CHECK_INTERVAL || '60000', 10);
if (MEM_CHECK_INTERVAL > 0) {
  setInterval(() => {
    const mem = process.memoryUsage();
    const mb = n => (n / 1024 / 1024).toFixed(1);
    const heapUsedMB = mb(mem.heapUsed);
    const heapTotalMB = mb(mem.heapTotal);
    const rssMB = mb(mem.rss);
    
    if (mem.heapUsed > 200 * 1024 * 1024) {
      console.warn(`[MEM] 堆内存偏高: ${heapUsedMB}MB / ${heapTotalMB}MB (RSS: ${rssMB}MB)`);
      global.gc && global.gc();
    }
  }, MEM_CHECK_INTERVAL).unref();
}
