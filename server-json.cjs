const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'dist')));

// 确保数据目录存在
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('创建数据目录失败:', err);
  }
}

// 读取JSON文件
async function readJsonFile(filename) {
  const filepath = path.join(DATA_DIR, filename);
  try {
    const data = await fs.readFile(filepath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return [];
    }
    throw err;
  }
}

// 写入JSON文件
async function writeJsonFile(filename, data) {
  const filepath = path.join(DATA_DIR, filename);
  await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf8');
}

// 生成ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ==================== 用户相关 API ====================

// 注册
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, email, gender, age, birth, address, hobbies } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const users = await readJsonFile('users.json');
    
    // 检查用户名是否已存在
    if (users.find(u => u.username === username)) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    const newUser = {
      id: generateId(),
      username,
      password,
      email,
      gender,
      age,
      birth,
      address,
      hobbies: hobbies || [],
      created_at: new Date().toISOString()
    };

    users.push(newUser);
    await writeJsonFile('users.json', users);

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = newUser;
    res.json({ message: '注册成功', user: userWithoutPassword });
  } catch (err) {
    console.error('注册错误:', err);
    res.status(500).json({ error: '注册失败: ' + err.message });
  }
});

// 登录
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const users = await readJsonFile('users.json');
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user;
    res.json({ message: '登录成功', user: userWithoutPassword });
  } catch (err) {
    console.error('登录错误:', err);
    res.status(500).json({ error: '登录失败: ' + err.message });
  }
});

// 获取用户信息
app.get('/api/users/:id', async (req, res) => {
  try {
    const users = await readJsonFile('users.json');
    const user = users.find(u => u.id === req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 更新用户信息
app.put('/api/users/:id', async (req, res) => {
  try {
    const users = await readJsonFile('users.json');
    const index = users.findIndex(u => u.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const { email, gender, age, birth, address, hobbies } = req.body;
    users[index] = { 
      ...users[index], 
      email, 
      gender, 
      age, 
      birth, 
      address, 
      hobbies,
      updated_at: new Date().toISOString()
    };
    
    await writeJsonFile('users.json', users);
    res.json({ message: '更新成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== 待办事项 API ====================

// 获取所有待办
app.get('/api/todos', async (req, res) => {
  try {
    const userId = req.query.user_id;
    let todos = await readJsonFile('todos.json');
    
    if (userId) {
      todos = todos.filter(t => t.user_id === userId);
    }
    
    // 按创建时间倒序
    todos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    res.json(todos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 创建待办
app.post('/api/todos', async (req, res) => {
  try {
    const { user_id, task, priority, category, due_date, tags } = req.body;
    
    const todos = await readJsonFile('todos.json');
    
    const newTodo = {
      id: generateId(),
      user_id,
      task,
      completed: false,
      priority: priority || 'medium',
      category: category || '其他',
      due_date,
      tags: tags || [],
      created_at: new Date().toISOString()
    };

    todos.push(newTodo);
    await writeJsonFile('todos.json', todos);

    res.json(newTodo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 更新待办
app.put('/api/todos/:id', async (req, res) => {
  try {
    const todos = await readJsonFile('todos.json');
    const index = todos.findIndex(t => t.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: '待办不存在' });
    }

    todos[index] = { ...todos[index], ...req.body };
    await writeJsonFile('todos.json', todos);
    
    res.json({ message: '更新成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 删除待办
app.delete('/api/todos/:id', async (req, res) => {
  try {
    let todos = await readJsonFile('todos.json');
    todos = todos.filter(t => t.id !== req.params.id);
    await writeJsonFile('todos.json', todos);
    
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== 备忘录 API ====================

// 获取所有备忘录
app.get('/api/notes', async (req, res) => {
  try {
    const userId = req.query.user_id;
    let notes = await readJsonFile('notes.json');
    
    if (userId) {
      notes = notes.filter(n => n.user_id === userId);
    }
    
    // 按更新时间倒序
    notes.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 创建备忘录
app.post('/api/notes', async (req, res) => {
  try {
    const { user_id, title, content, category, tags } = req.body;
    
    const notes = await readJsonFile('notes.json');
    
    const newNote = {
      id: generateId(),
      user_id,
      title,
      content,
      category: category || '其他',
      tags: tags || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    notes.push(newNote);
    await writeJsonFile('notes.json', notes);

    res.json(newNote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 更新备忘录
app.put('/api/notes/:id', async (req, res) => {
  try {
    const notes = await readJsonFile('notes.json');
    const index = notes.findIndex(n => n.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: '备忘录不存在' });
    }

    notes[index] = { 
      ...notes[index], 
      ...req.body,
      updated_at: new Date().toISOString()
    };
    await writeJsonFile('notes.json', notes);
    
    res.json({ message: '更新成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 删除备忘录
app.delete('/api/notes/:id', async (req, res) => {
  try {
    let notes = await readJsonFile('notes.json');
    notes = notes.filter(n => n.id !== req.params.id);
    await writeJsonFile('notes.json', notes);
    
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== 习惯 API ====================

// 获取所有习惯
app.get('/api/habits', async (req, res) => {
  try {
    const userId = req.query.user_id;
    let habits = await readJsonFile('habits.json');
    
    if (userId) {
      habits = habits.filter(h => h.user_id === userId);
    }
    
    res.json(habits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 创建习惯
app.post('/api/habits', async (req, res) => {
  try {
    const { user_id, name, description, frequency, reminder_time } = req.body;
    
    const habits = await readJsonFile('habits.json');
    
    const newHabit = {
      id: generateId(),
      user_id,
      name,
      description,
      frequency: frequency || 'daily',
      reminder_time,
      created_at: new Date().toISOString()
    };

    habits.push(newHabit);
    await writeJsonFile('habits.json', habits);

    res.json(newHabit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 更新习惯
app.put('/api/habits/:id', async (req, res) => {
  try {
    const habits = await readJsonFile('habits.json');
    const index = habits.findIndex(h => h.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: '习惯不存在' });
    }

    habits[index] = { ...habits[index], ...req.body };
    await writeJsonFile('habits.json', habits);
    
    res.json({ message: '更新成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 删除习惯
app.delete('/api/habits/:id', async (req, res) => {
  try {
    let habits = await readJsonFile('habits.json');
    habits = habits.filter(h => h.id !== req.params.id);
    await writeJsonFile('habits.json', habits);
    
    // 同时删除打卡记录
    let logs = await readJsonFile('habit_logs.json');
    logs = logs.filter(l => l.habit_id !== req.params.id);
    await writeJsonFile('habit_logs.json', logs);
    
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 习惯打卡
app.post('/api/habits/:id/checkin', async (req, res) => {
  try {
    const { user_id } = req.body;
    
    const logs = await readJsonFile('habit_logs.json');
    
    const newLog = {
      id: generateId(),
      habit_id: req.params.id,
      user_id,
      completed_at: new Date().toISOString()
    };

    logs.push(newLog);
    await writeJsonFile('habit_logs.json', logs);

    res.json({ message: '打卡成功', log: newLog });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取习惯打卡记录
app.get('/api/habits/:id/logs', async (req, res) => {
  try {
    const logs = await readJsonFile('habit_logs.json');
    const habitLogs = logs
      .filter(l => l.habit_id === req.params.id)
      .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
    
    res.json(habitLogs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
async function startServer() {
  await ensureDataDir();
  
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
}

startServer();
