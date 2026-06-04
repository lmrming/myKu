/**
 * 手动同步脚本 - 将 localStorage 数据同步到数据库
 * 用于一次性迁移数据
 */

const fs = require('fs');
const path = require('path');

// 模拟浏览器 localStorage
const localStorageData = {
  myku_todos: [],
  myku_notes: [],
  myku_habits: []
};

// 尝试读取本地存储文件（如果有的话）
const localStoragePath = path.join(__dirname, 'localStorage-backup.json');
if (fs.existsSync(localStoragePath)) {
  const data = JSON.parse(fs.readFileSync(localStoragePath, 'utf8'));
  Object.assign(localStorageData, data);
  console.log('✓ 已加载本地存储备份文件');
} else {
  console.log('⚠ 未找到本地存储备份文件，使用空数据');
  console.log('  提示: 在浏览器控制台运行以下命令导出数据:');
  console.log('  copy(JSON.stringify(localStorage))');
  console.log('  然后保存到 localStorage-backup.json\n');
}

require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'myku_app'
};

// 获取用户ID
const getUserId = async (pool) => {
  const [rows] = await pool.execute('SELECT id FROM users LIMIT 1');
  if (rows.length === 0) {
    throw new Error('数据库中没有用户，请先注册');
  }
  return rows[0].id;
};

async function syncData() {
  let pool;
  
  try {
    console.log('========================================');
    console.log('     LocalStorage → 数据库 同步');
    console.log('========================================\n');
    
    pool = mysql.createPool(dbConfig);
    console.log('✓ 数据库连接成功\n');
    
    const userId = await getUserId(pool);
    console.log(`✓ 目标用户 ID: ${userId}\n`);
    
    // 同步待办事项
    console.log('【同步待办事项】');
    const todos = localStorageData.myku_todos || [];
    console.log(`  本地待办数量: ${todos.length}`);
    
    let todoCreated = 0;
    for (const todo of todos) {
      try {
        await pool.execute(
          `INSERT INTO todos (user_id, task, completed, priority, category, due_date, tags, completed_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            todo.task || todo.title,
            todo.completed || false,
            todo.priority || 'medium',
            todo.category || '其他',
            todo.dueDate || null,
            JSON.stringify(todo.tags || []),
            todo.completedAt || null
          ]
        );
        todoCreated++;
      } catch (err) {
        console.log(`  ⚠ 跳过重复待办: ${todo.task || todo.title}`);
      }
    }
    console.log(`  ✓ 已同步: ${todoCreated} 条\n`);
    
    // 同步备忘录
    console.log('【同步备忘录】');
    const notes = localStorageData.myku_notes || [];
    console.log(`  本地备忘录数量: ${notes.length}`);
    
    let noteCreated = 0;
    for (const note of notes) {
      try {
        await pool.execute(
          `INSERT INTO notes (user_id, title, content, category, tags) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            userId,
            note.title || '无标题',
            note.content || '',
            note.category || '其他',
            JSON.stringify(note.tags || [])
          ]
        );
        noteCreated++;
      } catch (err) {
        console.log(`  ⚠ 跳过重复备忘录: ${note.title}`);
      }
    }
    console.log(`  ✓ 已同步: ${noteCreated} 条\n`);
    
    // 同步习惯
    console.log('【同步习惯】');
    const habits = localStorageData.myku_habits || [];
    console.log(`  本地习惯数量: ${habits.length}`);
    
    let habitCreated = 0;
    for (const habit of habits) {
      try {
        const [result] = await pool.execute(
          `INSERT INTO habits (user_id, name, description, frequency, reminder_time) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            userId,
            habit.name,
            habit.description || '',
            habit.frequency || 'daily',
            habit.reminderTime || null
          ]
        );
        
        // 同步打卡记录
        if (habit.checkIns && habit.checkIns.length > 0) {
          for (const checkIn of habit.checkIns) {
            await pool.execute(
              `INSERT INTO habit_logs (habit_id, user_id, completed_at) VALUES (?, ?, ?)`,
              [result.insertId, userId, new Date(checkIn)]
            );
          }
        }
        
        habitCreated++;
      } catch (err) {
        console.log(`  ⚠ 跳过重复习惯: ${habit.name}`);
      }
    }
    console.log(`  ✓ 已同步: ${habitCreated} 条\n`);
    
    // 同步统计
    console.log('========================================');
    console.log('     同步完成');
    console.log('========================================');
    console.log(`待办事项: ${todoCreated} 条`);
    console.log(`备忘录:   ${noteCreated} 条`);
    console.log(`习惯:     ${habitCreated} 条`);
    console.log(`总计:     ${todoCreated + noteCreated + habitCreated} 条\n`);
    
    return true;
    
  } catch (error) {
    console.error('\n【错误】');
    console.error(`  ${error.message}\n`);
    return false;
    
  } finally {
    if (pool) {
      await pool.end();
      console.log('  连接已关闭');
    }
  }
}

// 运行同步
syncData().then(success => {
  process.exit(success ? 0 : 1);
});
