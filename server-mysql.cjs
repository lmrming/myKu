require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ============ 性能优化中间件 ============

// 优化1: gzip/brotli 压缩（吞吐量提升3-5倍）
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false
    return compression.filter(req, res)
  }
}));

// 优化4: API限流（防止恶意请求耗尽资源）
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '请求过于频繁，请稍后再试' },
  skip: (req) => {
    // 豁免健康检查和同步相关接口
    const skipPaths = ['/api/health', '/api/todos', '/api/notes', '/api/habits'];
    return skipPaths.some(p => req.path.startsWith(p) && req.method === 'GET');
  }
});
app.use('/api/', apiLimiter);

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'dist')));

// MySQL 连接配置
// 优化5: 数据库连接池配置（pool size = CPU核心数 × 2 + 磁盘数）
const os = require('os');
const cpuCount = os.cpus().length;
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'myku_app',
  waitForConnections: true,
  connectionLimit: Math.min(cpuCount * 2 + 1, 30),
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// 创建连接池
let pool;

async function initDatabase() {
  try {
    // 先创建连接（不指定数据库）来创建数据库
    const tempPool = mysql.createPool({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      waitForConnections: true,
      connectionLimit: 1
    });

    // 创建数据库（如果不存在）
    await tempPool.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`数据库 ${dbConfig.database} 已就绪`);
    await tempPool.end();

    // 创建连接池
    pool = mysql.createPool(dbConfig);

    // 创建表
    await createTables();
    console.log('数据库表初始化完成');
  } catch (err) {
    console.error('数据库初始化失败:', err);
    process.exit(1);
  }
}

async function createTables() {
  // 用户表
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      email VARCHAR(100),
      gender VARCHAR(10),
      age INT,
      birth DATE,
      address TEXT,
      hobbies JSON,
      status TINYINT(1) DEFAULT 1,
      last_login_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await ensureColumn('users', 'status', 'status TINYINT(1) DEFAULT 1');
  await ensureColumn('users', 'last_login_at', 'last_login_at TIMESTAMP NULL');

  // 待办事项表
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS todos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      task VARCHAR(255) NOT NULL,
      completed BOOLEAN DEFAULT FALSE,
      priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
      category VARCHAR(50) DEFAULT '其他',
      due_date DATE,
      tags JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 备忘录表
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS notes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      title VARCHAR(255) NOT NULL,
      content TEXT,
      category VARCHAR(50) DEFAULT '其他',
      tags JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 习惯表
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS habits (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      frequency ENUM('daily', 'weekly', 'monthly') DEFAULT 'daily',
      reminder_time TIME,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 习惯打卡记录表
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS habit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      habit_id INT,
      user_id INT,
      completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 优化2: 添加数据库索引（提升查询性能）
  const indexes = [
    { table: 'todos', name: 'idx_todos_user_id', column: 'user_id' },
    { table: 'todos', name: 'idx_todos_completed', column: 'completed' },
    { table: 'todos', name: 'idx_todos_created_at', column: 'created_at' },
    { table: 'notes', name: 'idx_notes_user_id', column: 'user_id' },
    { table: 'notes', name: 'idx_notes_updated_at', column: 'updated_at' },
    { table: 'habits', name: 'idx_habits_user_id', column: 'user_id' },
    { table: 'habit_logs', name: 'idx_habit_logs_habit_id', column: 'habit_id' },
    { table: 'habit_logs', name: 'idx_habit_logs_user_id', column: 'user_id' },
    { table: 'users', name: 'idx_users_username', column: 'username' },
  ];

  for (const idx of indexes) {
    try {
      await pool.execute(`CREATE INDEX ${idx.name} ON ${idx.table} (${idx.column})`);
      console.log(`已创建索引 ${idx.name}`);
    } catch (e) {
      if (e.code === 'ER_DUP_KEYNAME' || e.message?.includes('Duplicate')) {
        // 索引已存在，跳过
      } else {
        console.warn(`创建索引 ${idx.name} 失败:`, e.message);
      }
    }
  }
}

async function ensureColumn(tableName, columnName, columnDefinition) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS count
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [dbConfig.database, tableName, columnName]
  );

  if (Number(rows[0]?.count || 0) === 0) {
    await pool.execute(`ALTER TABLE \`${tableName}\` ADD COLUMN ${columnDefinition}`);
    console.log(`已补齐字段 ${tableName}.${columnName}`);
  }
}

// ============ 优化3: 内存缓存机制 ============
const apiCache = new Map();
const CACHE_TTL = 5000; // 5秒缓存

function getCache(key) {
  const entry = apiCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.time > CACHE_TTL) {
    apiCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  // 防止缓存无限增长
  if (apiCache.size > 500) {
    const oldestKey = apiCache.keys().next().value;
    apiCache.delete(oldestKey);
  }
  apiCache.set(key, { data, time: Date.now() });
}

function invalidateCache(prefix) {
  for (const key of apiCache.keys()) {
    if (key.startsWith(prefix)) apiCache.delete(key);
  }
}

// ==================== 用户相关 API ====================

// 注册
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, email, gender, age, birth, address, hobbies } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    // 转换 gender 为数字：0=保密, 1=男, 2=女
    let genderValue = 0;
    if (gender === '男' || gender === 'male' || gender === 1) {
      genderValue = 1;
    } else if (gender === '女' || gender === 'female' || gender === 2) {
      genderValue = 2;
    }

    const [result] = await pool.execute(
      `INSERT INTO users (username, password, email, gender, age, birth, address, hobbies) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, password, email, genderValue, age, birth, address, JSON.stringify(hobbies || [])]
    );

    const [rows] = await pool.execute(
      'SELECT id, username, email, gender, age, birth, address, hobbies, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    const user = rows[0];
    
    // 安全解析 hobbies
    try {
      user.hobbies = user.hobbies ? JSON.parse(user.hobbies) : [];
    } catch (e) {
      user.hobbies = [];
    }
    
    // 转换 gender 数字为字符串
    const genderMap = { 0: '保密', 1: '男', 2: '女' };
    user.gender = genderMap[user.gender] || '保密';
    
    res.json({ message: '注册成功', user });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: '用户名已存在' });
    }
    console.error('注册错误:', err);
    res.status(500).json({ error: '注册失败: ' + err.message });
  }
});

// 登录
app.post('/api/login', async (req, res) => {
  try {
    const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
    const { password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const [rows] = await pool.execute(
      `SELECT id, username, password, email, gender, age, birth, address, hobbies, status, last_login_at, created_at 
       FROM users WHERE username = ?`,
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const userRecord = rows[0];
    if (userRecord.password !== password) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    if (Number(userRecord.status) === 0) {
      return res.status(403).json({ error: '账户已禁用，请联系管理员' });
    }

    await pool.execute(
      'UPDATE users SET last_login_at = NOW() WHERE id = ?',
      [userRecord.id]
    );

    const { password: _password, ...user } = userRecord;
    user.last_login_at = new Date().toISOString();
    
    // 安全解析 hobbies
    try {
      user.hobbies = user.hobbies ? JSON.parse(user.hobbies) : [];
    } catch (e) {
      user.hobbies = [];
    }
    
    // 转换 gender 数字为字符串
    const genderMap = { 0: '保密', 1: '男', 2: '女' };
    user.gender = genderMap[user.gender] || '保密';
    
    res.json({ message: '登录成功', user });
  } catch (err) {
    console.error('登录错误:', err);
    res.status(500).json({ error: '登录失败: ' + err.message });
  }
});

// 获取用户列表（支持按 username 查询）
app.get('/api/users', async (req, res) => {
  try {
    const { username, email } = req.query;
    
    let sql = `SELECT id, username, email, avatar, gender, age, birth, address, hobbies, created_at FROM users`;
    const params = [];
    
    if (username) {
      sql += ` WHERE username = ?`;
      params.push(username);
    } else if (email) {
      sql += ` WHERE email = ?`;
      params.push(email);
    }
    
    const [rows] = await pool.execute(sql, params);

    const users = rows.map(user => {
      // 安全解析 hobbies
      let hobbies = [];
      try {
        hobbies = user.hobbies ? JSON.parse(user.hobbies) : [];
      } catch (e) {
        hobbies = [];
      }
      
      // 转换 gender 数字为字符串
      const genderMap = { 0: '保密', 1: '男', 2: '女' };
      
      return {
        ...user,
        hobbies,
        gender: genderMap[user.gender] || '保密'
      };
    });
    
    // 如果是单条查询，返回对象；否则返回数组
    if (username || email) {
      if (users.length === 0) {
        return res.status(404).json({ error: '用户不存在' });
      }
      return res.json(users[0]);
    }
    
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取单个用户信息（按 ID）
app.get('/api/users/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, username, email, avatar, gender, age, birth, address, hobbies, created_at FROM users WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const user = rows[0];
    
    // 安全解析 hobbies
    try {
      user.hobbies = user.hobbies ? JSON.parse(user.hobbies) : [];
    } catch (e) {
      user.hobbies = [];
    }
    
    // 转换 gender 数字为字符串
    const genderMap = { 0: '保密', 1: '男', 2: '女' };
    user.gender = genderMap[user.gender] || '保密';
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 更新用户信息
app.put('/api/users/:id', async (req, res) => {
  try {
    const { username, email, gender, age, birth, address, hobbies, avatar } = req.body;
    
    // 构建动态更新语句
    const updates = [];
    const values = [];
    
    if (username !== undefined) { updates.push('username = ?'); values.push(username); }
    if (email !== undefined) { updates.push('email = ?'); values.push(email); }
    if (gender !== undefined) { updates.push('gender = ?'); values.push(gender); }
    if (age !== undefined) { updates.push('age = ?'); values.push(age); }
    if (birth !== undefined) { updates.push('birth = ?'); values.push(birth); }
    if (address !== undefined) { updates.push('address = ?'); values.push(address); }
    if (hobbies !== undefined) { updates.push('hobbies = ?'); values.push(JSON.stringify(hobbies)); }
    if (avatar !== undefined) { updates.push('avatar = ?'); values.push(avatar); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: '没有要更新的字段' });
    }
    
    values.push(req.params.id);
    
    await pool.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // 返回更新后的用户数据
    const [rows] = await pool.execute('SELECT id, username, email, avatar FROM users WHERE id = ?', [req.params.id]);
    
    res.json({ 
      message: '更新成功', 
      user: rows[0] 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== 待办事项 API ====================

// 获取所有待办
app.get('/api/todos', async (req, res) => {
  try {
    const userId = req.query.user_id;
    const cacheKey = `todos:${userId || 'all'}`;
    
    // 检查缓存
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);
    
    let sql = `SELECT * FROM todos`;
    let params = [];
    
    if (userId) {
      sql += ` WHERE user_id = ?`;
      params.push(userId);
    }
    
    sql += ` ORDER BY created_at DESC`;
    
    const [rows] = await pool.execute(sql, params);
    
    const todos = rows.map(row => {
      try {
        return {
          ...row,
          tags: row.tags ? JSON.parse(row.tags) : []
        };
      } catch (e) {
        return { ...row, tags: [] };
      }
    });
    
    setCache(cacheKey, todos);
    res.json(todos);
  } catch (err) {
    console.error('获取待办失败:', err);
    res.status(500).json({ error: '获取待办失败', message: err.message });
  }
});

// 创建待办
app.post('/api/todos', async (req, res) => {
  try {
    const { user_id, task, priority, category, due_date, tags, completed, completed_at } = req.body;
    
    if (!user_id || !task) {
      return res.status(400).json({ error: '缺少必要字段: user_id 和 task' });
    }
    
    // 确保所有参数都不是 undefined
    const safeUserId = user_id || null;
    const safeTask = task || '';
    const safePriority = priority || 'medium';
    const safeCategory = category !== undefined ? category : null;
    const safeDueDate = due_date !== undefined ? due_date : null;
    const safeTags = JSON.stringify(tags || []);
    const safeCompleted = completed !== undefined ? (completed ? 1 : 0) : 0;
    const safeCompletedAt = completed_at !== undefined ? completed_at : null;
    
    const [result] = await pool.execute(
      `INSERT INTO todos (user_id, task, priority, category, due_date, tags, completed, completed_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [safeUserId, safeTask, safePriority, safeCategory, safeDueDate, safeTags, safeCompleted, safeCompletedAt]
    );

    const [rows] = await pool.execute('SELECT * FROM todos WHERE id = ?', [result.insertId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: '创建待办后未找到记录' });
    }
    
    const todo = rows[0];
    try {
      todo.tags = todo.tags ? JSON.parse(todo.tags) : [];
    } catch (e) {
      todo.tags = [];
    }
    
    res.json(todo);
    invalidateCache('todos:');
  } catch (err) {
    console.error('创建待办失败:', err);
    res.status(500).json({ error: '创建待办失败', message: err.message });
  }
});

// 更新待办
app.put('/api/todos/:id', async (req, res) => {
  try {
    const { task, completed, priority, category, due_date, tags, completed_at } = req.body;

    // ISO 8601 → MySQL DATETIME 格式转换
    const toMysqlDate = (isoStr) => {
      if (!isoStr) return null;
      try {
        const d = new Date(isoStr);
        return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 19).replace('T', ' ');
      } catch { return null; }
    };

    await pool.execute(
      `UPDATE todos SET 
        task = COALESCE(?, task),
        completed = COALESCE(?, completed),
        priority = COALESCE(?, priority),
        category = COALESCE(?, category),
        due_date = COALESCE(?, due_date),
        tags = COALESCE(?, tags),
        completed_at = COALESCE(?, completed_at)
       WHERE id = ?`,
      [task ?? null, completed ?? null, priority ?? null, category ?? null,
       toMysqlDate(due_date), tags ? JSON.stringify(tags) : null, toMysqlDate(completed_at), req.params.id]
    );

    res.json({ message: '更新成功' });
    invalidateCache('todos:');
  } catch (err) {
    console.error('更新待办失败:', err);
    res.status(500).json({ error: '更新待办失败', message: err.message });
  }
});

// 删除待办
app.delete('/api/todos/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM todos WHERE id = ?', [req.params.id]);
    res.json({ message: '删除成功' });
    invalidateCache('todos:');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== 备忘录 API ====================

// 获取所有备忘录
app.get('/api/notes', async (req, res) => {
  try {
    const userId = req.query.user_id;
    const cacheKey = `notes:${userId || 'all'}`;
    
    // 检查缓存
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);
    
    let sql = `SELECT * FROM notes`;
    let params = [];
    
    if (userId) {
      sql += ` WHERE user_id = ?`;
      params.push(userId);
    }
    
    sql += ` ORDER BY updated_at DESC`;
    
    const [rows] = await pool.execute(sql, params);
    
    const notes = rows.map(row => {
      try {
        return {
          ...row,
          tags: row.tags ? JSON.parse(row.tags) : []
        };
      } catch (e) {
        return { ...row, tags: [] };
      }
    });
    
    setCache(cacheKey, notes);
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 创建备忘录
app.post('/api/notes', async (req, res) => {
  try {
    const { user_id, title, content, category, tags } = req.body;
    
    if (!user_id || !title) {
      return res.status(400).json({ error: '缺少必要字段: user_id 和 title' });
    }
    
    const [result] = await pool.execute(
      `INSERT INTO notes (user_id, title, content, category, tags) 
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, title || '', content || '', category ?? null, JSON.stringify(tags || [])]
    );

    const [rows] = await pool.execute('SELECT * FROM notes WHERE id = ?', [result.insertId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: '创建备忘录后未找到记录' });
    }
    
    const note = rows[0];
    try {
      note.tags = JSON.parse(note.tags || '[]');
    } catch (e) {
      note.tags = [];
    }
    
    res.json(note);
    invalidateCache('notes:');
  } catch (err) {
    console.error('创建备忘录失败:', err);
    res.status(500).json({ error: '创建备忘录失败', message: err.message });
  }
});

// 更新备忘录
app.put('/api/notes/:id', async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    
    await pool.execute(
      `UPDATE notes SET 
        title = COALESCE(?, title),
        content = COALESCE(?, content),
        category = COALESCE(?, category),
        tags = COALESCE(?, tags)
       WHERE id = ?`,
      [title ?? null, content ?? null, category ?? null, tags ? JSON.stringify(tags) : null, req.params.id]
    );

    const [rows] = await pool.execute('SELECT * FROM notes WHERE id = ?', [req.params.id]);
    res.json(rows[0] || { message: '更新成功' });
    invalidateCache('notes:');
  } catch (err) {
    console.error('更新备忘录失败:', err);
    res.status(500).json({ error: '更新备忘录失败', message: err.message });
  }
});

// 删除备忘录
app.delete('/api/notes/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM notes WHERE id = ?', [req.params.id]);
    res.json({ message: '删除成功' });
    invalidateCache('notes:');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== 习惯 API ====================

// 获取所有习惯
app.get('/api/habits', async (req, res) => {
  try {
    const userId = req.query.user_id;
    const cacheKey = `habits:${userId || 'all'}`;
    
    // 检查缓存
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);
    
    let sql = `SELECT * FROM habits`;
    let params = [];
    
    if (userId) {
      sql += ` WHERE user_id = ?`;
      params.push(userId);
    }
    
    const [rows] = await pool.execute(sql, params);
    setCache(cacheKey, rows);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 创建习惯
app.post('/api/habits', async (req, res) => {
  try {
    const { user_id, name, description, frequency, reminder_time } = req.body;
    
    if (!user_id || !name) {
      return res.status(400).json({ error: '缺少必要字段: user_id 和 name' });
    }
    
    const [result] = await pool.execute(
      `INSERT INTO habits (user_id, name, description, frequency, reminder_time) 
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, name, description ?? '', frequency ?? 'daily', reminder_time ?? null]
    );

    const [rows] = await pool.execute('SELECT * FROM habits WHERE id = ?', [result.insertId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: '创建习惯后未找到记录' });
    }
    
    res.json(rows[0]);
    invalidateCache('habits:');
  } catch (err) {
    console.error('创建习惯失败:', err);
    res.status(500).json({ error: '创建习惯失败', message: err.message });
  }
});

// 更新习惯
app.put('/api/habits/:id', async (req, res) => {
  try {
    const { name, description, frequency, reminder_time } = req.body;
    
    await pool.execute(
      `UPDATE habits SET 
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        frequency = COALESCE(?, frequency),
        reminder_time = COALESCE(?, reminder_time)
       WHERE id = ?`,
      [name ?? null, description ?? null, frequency ?? null, reminder_time ?? null, req.params.id]
    );

    res.json({ message: '更新成功' });
    invalidateCache('habits:');
  } catch (err) {
    console.error('更新习惯失败:', err);
    res.status(500).json({ error: '更新习惯失败', message: err.message });
  }
});

// 删除习惯
app.delete('/api/habits/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM habits WHERE id = ?', [req.params.id]);
    res.json({ message: '删除成功' });
    invalidateCache('habits:');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 习惯打卡
app.post('/api/habits/:id/checkin', async (req, res) => {
  try {
    const { user_id } = req.body;
    
    const [result] = await pool.execute(
      `INSERT INTO habit_logs (habit_id, user_id) VALUES (?, ?)`,
      [req.params.id, user_id]
    );

    res.json({ message: '打卡成功', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 取消习惯打卡
app.delete('/api/habits/:id/checkin', async (req, res) => {
  try {
    const { user_id, date } = req.body;
    
    // 删除指定日期的打卡记录
    const [result] = await pool.execute(
      `DELETE FROM habit_logs WHERE habit_id = ? AND user_id = ? AND DATE(completed_at) = ?`,
      [req.params.id, user_id, date]
    );

    res.json({ message: '取消打卡成功', affectedRows: result.affectedRows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取习惯打卡记录
app.get('/api/habits/:id/logs', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM habit_logs WHERE habit_id = ? ORDER BY completed_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 添加习惯打卡记录（同步接口使用）
app.post('/api/habits/:id/logs', async (req, res) => {
  try {
    const { completed_at, user_id } = req.body;
    if (!completed_at) {
      return res.status(400).json({ error: '缺少 completed_at 参数' });
    }

    // 将 ISO 8601 格式转换为 MySQL DATETIME 兼容格式
    let mysqlDatetime;
    try {
      const d = new Date(completed_at);
      if (isNaN(d.getTime())) {
        return res.status(400).json({ error: '无效的日期格式' });
      }
      mysqlDatetime = d.toISOString().slice(0, 19).replace('T', ' ');
    } catch (e) {
      return res.status(400).json({ error: '日期解析失败' });
    }

    // 检查是否已存在同日记录（防重复）
    const [existing] = await pool.execute(
      `SELECT id FROM habit_logs WHERE habit_id = ? AND DATE(completed_at) = DATE(?)`,
      [req.params.id, mysqlDatetime]
    );

    if (existing.length > 0) {
      return res.status(200).json({ message: '已存在', duplicate: true, id: existing[0].id });
    }

    const [result] = await pool.execute(
      `INSERT INTO habit_logs (habit_id, user_id, completed_at) VALUES (?, ?, ?)`,
      [req.params.id, user_id || null, mysqlDatetime]
    );

    invalidateCache('habits:');
    res.status(201).json({ id: result.insertId, habit_id: req.params.id, completed_at: mysqlDatetime });
  } catch (err) {
    console.error('添加习惯记录失败:', err);
    res.status(500).json({ error: err.message });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 全局错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({ 
    error: statusCode === 400 ? '请求格式错误' : '服务器内部错误', 
    message: err.message,
    path: req.path 
  });
});

// 处理前端路由
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 启动服务器
async function startServer() {
  await initDatabase();
  
  app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log('MySQL 数据库已连接');
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
}

startServer();
