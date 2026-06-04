# MyWedShe 数据库迁移指南

## 数据库信息

- **数据库名称**: `myku_app`（保持不变）
- **版本**: 2.0
- **字符集**: utf8mb4
- **排序规则**: utf8mb4_unicode_ci

## 主要优化内容

### 1. 表结构优化

#### users 表
- ✅ 保留所有原有字段
- ✅ 新增 `status` 字段（用户状态管理）
- ✅ 新增 `last_login_at` 字段（最后登录时间）
- ✅ 优化索引：添加 `idx_status`、`idx_created_at`

#### todos 表
- ✅ 保留所有原有字段
- ✅ 新增 `sort_order` 字段（排序支持）
- ✅ 优化索引：添加复合索引 `idx_user_completed`
- ✅ 外键约束：级联删除

#### notes 表
- ✅ 保留所有原有字段
- ✅ 新增 `is_pinned` 字段（置顶功能）
- ✅ 新增 `color` 字段（颜色标记）
- ✅ 新增 `sort_order` 字段（排序支持）
- ✅ 优化索引：添加复合索引 `idx_user_pinned`

#### habits 表
- ✅ 保留所有原有字段
- ✅ 新增 `target_days` 字段（目标天数）
- ✅ 新增 `reminder_days` 字段（提醒日期JSON）
- ✅ 新增 `color` 字段（颜色标记）
- ✅ 新增 `icon` 字段（图标）
- ✅ 新增 `is_active` 字段（激活状态）
- ✅ 新增 `streak_days` 字段（连续天数）
- ✅ 新增 `total_completions` 字段（总完成次数）

#### habit_logs 表
- ✅ 保留所有原有字段
- ✅ 新增 `note` 字段（打卡备注）
- ✅ 新增 `mood` 字段（心情评分）
- ✅ 添加唯一约束 `uk_habit_date`（防止重复打卡）

### 2. 新增表

#### user_login_logs 表
- 记录用户登录历史
- 支持安全审计

### 3. 视图（Views）

#### v_user_stats
用户统计视图，包含：
- 待办总数和完成数
- 备忘录总数
- 习惯总数和活跃数

#### v_today_todos
今日待办视图，自动筛选：
- 未完成的待办
- 截止日期为今天或未来的待办

#### v_habit_stats
习惯统计视图，包含：
- 本月完成次数
- 最后打卡时间

#### v_weekly_habit_completion
每周习惯完成率视图

### 4. 存储过程（Stored Procedures）

#### sp_user_register
用户注册，包含：
- 用户名重复检查
- 邮箱重复检查
- 自动返回新用户ID

#### sp_update_habit_streak
更新习惯连续天数

#### sp_batch_complete_todos
批量完成待办事项

#### sp_get_user_activity_summary
获取用户活动摘要（最近N天）

#### sp_sync_user_data
数据同步存储过程（localStorage → 数据库）

### 5. 触发器（Triggers）

#### trg_user_login
用户登录时自动记录登录日志

## 迁移步骤

### 步骤 1: 备份现有数据
```bash
mysqldump -u root -p myku_app > myku_app_backup_$(date +%Y%m%d_%H%M%S).sql
```

### 步骤 2: 执行新SQL脚本
```bash
mysql -u root -p myku_app < database/myku_app_complete.sql
```

### 步骤 3: 验证数据
```sql
-- 检查表结构
SHOW TABLES;

-- 检查用户数据
SELECT * FROM users;

-- 检查视图
SHOW FULL TABLES WHERE Table_type = 'VIEW';

-- 检查存储过程
SHOW PROCEDURE STATUS WHERE Db = 'myku_app';
```

## 兼容性说明

### 向后兼容
- ✅ 所有原有字段保持不变
- ✅ 原有API无需修改
- ✅ 新增字段均有默认值

### 应用程序适配
以下API端点可继续使用：
- `GET /api/users/:id`
- `GET /api/users?username=xxx`
- `POST /api/users`（注册）
- `PUT /api/users/:id`（更新）
- `GET /api/todos?userId=xxx`
- `POST /api/todos`
- `PUT /api/todos/:id`
- `DELETE /api/todos/:id`
- `GET /api/notes?userId=xxx`
- `POST /api/notes`
- `PUT /api/notes/:id`
- `DELETE /api/notes/:id`
- `GET /api/habits?userId=xxx`
- `POST /api/habits`
- `PUT /api/habits/:id`
- `DELETE /api/habits/:id`
- `GET /api/habit-logs?habitId=xxx`
- `POST /api/habit-logs`

### 新增API建议
可以考虑添加以下API以利用新功能：
- `GET /api/users/:id/stats` - 使用 v_user_stats 视图
- `GET /api/todos/today` - 使用 v_today_todos 视图
- `GET /api/habits/:id/stats` - 使用 v_habit_stats 视图
- `POST /api/sync` - 使用 sp_sync_user_data 存储过程

## 测试验证

### 1. 基础功能测试
```sql
-- 测试用户注册
CALL sp_user_register('newuser', 'hashedpassword', 'new@example.com');

-- 测试数据同步
CALL sp_sync_user_data(1, 
  '[{"task": "测试待办", "completed": 0}]',
  '[{"title": "测试笔记", "content": "内容"}]',
  '[{"name": "测试习惯", "frequency": "daily"}]'
);

-- 测试视图
SELECT * FROM v_user_stats WHERE user_id = 1;
SELECT * FROM v_today_todos;
```

### 2. 约束测试
```sql
-- 测试唯一约束（应该失败）
INSERT INTO users (username, password) VALUES ('admin', 'test');

-- 测试外键约束（应该失败）
INSERT INTO todos (user_id, task) VALUES (999, '测试');
```

### 3. 触发器测试
```sql
-- 更新登录时间
UPDATE users SET last_login_at = NOW() WHERE id = 1;

-- 检查登录日志
SELECT * FROM user_login_logs WHERE user_id = 1;
```

## 回滚方案

如需回滚到旧版本：
```bash
mysql -u root -p myku_app < myku_app_backup_YYYYMMDD_HHMMSS.sql
```

## 注意事项

1. **执行前务必备份数据**
2. **建议在测试环境先验证**
3. **JSON字段需要MySQL 5.7+**
4. **存储过程需要相应权限**
5. **生产环境建议在低峰期执行**
