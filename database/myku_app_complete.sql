-- ============================================
-- MyWedShe 应用数据库 - 完整SQL脚本
-- 数据库名称: myku_app
-- 版本: 2.0
-- 描述: 优化后的数据库结构，包含完整约束、索引、视图和存储过程
-- ============================================

-- 设置字符集和排序规则
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 1. 删除现有表（如果存在）
-- ============================================
DROP TABLE IF EXISTS `habit_logs`;
DROP TABLE IF EXISTS `habits`;
DROP TABLE IF EXISTS `notes`;
DROP TABLE IF EXISTS `todos`;
DROP TABLE IF EXISTS `users`;

-- ============================================
-- 2. 创建用户表
-- ============================================
CREATE TABLE `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `password` VARCHAR(255) NOT NULL COMMENT '密码（加密存储）',
  `email` VARCHAR(100) DEFAULT NULL COMMENT '邮箱地址',
  `avatar` VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
  `gender` TINYINT(1) DEFAULT 0 COMMENT '性别：0-保密，1-男，2-女',
  `age` TINYINT UNSIGNED DEFAULT NULL COMMENT '年龄',
  `birth` DATE DEFAULT NULL COMMENT '出生日期',
  `address` VARCHAR(200) DEFAULT NULL COMMENT '地址',
  `hobbies` JSON DEFAULT NULL COMMENT '兴趣爱好（JSON数组）',
  `status` TINYINT(1) DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
  `last_login_at` DATETIME DEFAULT NULL COMMENT '最后登录时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_email` (`email`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================
-- 3. 创建待办事项表
-- ============================================
CREATE TABLE `todos` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '待办ID',
  `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
  `task` VARCHAR(255) NOT NULL COMMENT '任务内容',
  `completed` TINYINT(1) DEFAULT 0 COMMENT '是否完成：0-未完成，1-已完成',
  `priority` ENUM('low', 'medium', 'high') DEFAULT 'medium' COMMENT '优先级',
  `category` VARCHAR(50) DEFAULT NULL COMMENT '分类',
  `due_date` DATETIME DEFAULT NULL COMMENT '截止日期',
  `tags` JSON DEFAULT NULL COMMENT '标签（JSON数组）',
  `sort_order` INT DEFAULT 0 COMMENT '排序顺序',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `completed_at` DATETIME DEFAULT NULL COMMENT '完成时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_completed` (`completed`),
  KEY `idx_priority` (`priority`),
  KEY `idx_due_date` (`due_date`),
  KEY `idx_category` (`category`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_user_completed` (`user_id`, `completed`),
  CONSTRAINT `fk_todos_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='待办事项表';

-- ============================================
-- 4. 创建备忘录表
-- ============================================
CREATE TABLE `notes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '备忘录ID',
  `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
  `title` VARCHAR(200) NOT NULL COMMENT '标题',
  `content` TEXT COMMENT '内容',
  `category` VARCHAR(50) DEFAULT NULL COMMENT '分类',
  `tags` JSON DEFAULT NULL COMMENT '标签（JSON数组）',
  `is_pinned` TINYINT(1) DEFAULT 0 COMMENT '是否置顶：0-否，1-是',
  `color` VARCHAR(20) DEFAULT NULL COMMENT '颜色标记',
  `sort_order` INT DEFAULT 0 COMMENT '排序顺序',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_category` (`category`),
  KEY `idx_is_pinned` (`is_pinned`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_user_pinned` (`user_id`, `is_pinned`),
  CONSTRAINT `fk_notes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='备忘录表';

-- ============================================
-- 5. 创建习惯表
-- ============================================
CREATE TABLE `habits` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '习惯ID',
  `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
  `name` VARCHAR(100) NOT NULL COMMENT '习惯名称',
  `description` TEXT COMMENT '习惯描述',
  `frequency` ENUM('daily', 'weekly', 'monthly', 'custom') DEFAULT 'daily' COMMENT '频率',
  `target_days` INT UNSIGNED DEFAULT 1 COMMENT '目标天数（每周/每月）',
  `reminder_time` TIME DEFAULT NULL COMMENT '提醒时间',
  `reminder_days` JSON DEFAULT NULL COMMENT '提醒日期（JSON数组，如[1,3,5]表示周一三五）',
  `color` VARCHAR(20) DEFAULT '#4CAF50' COMMENT '颜色标记',
  `icon` VARCHAR(50) DEFAULT 'star' COMMENT '图标',
  `is_active` TINYINT(1) DEFAULT 1 COMMENT '是否激活：0-暂停，1-激活',
  `streak_days` INT UNSIGNED DEFAULT 0 COMMENT '连续完成天数',
  `total_completions` INT UNSIGNED DEFAULT 0 COMMENT '总完成次数',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_frequency` (`frequency`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_user_active` (`user_id`, `is_active`),
  CONSTRAINT `fk_habits_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='习惯表';

-- ============================================
-- 6. 创建习惯打卡记录表
-- ============================================
CREATE TABLE `habit_logs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '打卡ID',
  `habit_id` INT UNSIGNED NOT NULL COMMENT '习惯ID',
  `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
  `completed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '打卡时间',
  `note` VARCHAR(255) DEFAULT NULL COMMENT '打卡备注',
  `mood` TINYINT DEFAULT NULL COMMENT '心情评分（1-5）',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_habit_date` (`habit_id`, `completed_at`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_completed_at` (`completed_at`),
  KEY `idx_user_date` (`user_id`, `completed_at`),
  CONSTRAINT `fk_habit_logs_habit` FOREIGN KEY (`habit_id`) REFERENCES `habits` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_habit_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='习惯打卡记录表';

-- ============================================
-- 7. 创建视图
-- ============================================

-- 7.1 用户统计视图
CREATE OR REPLACE VIEW `v_user_stats` AS
SELECT 
  u.id AS user_id,
  u.username,
  u.email,
  u.avatar,
  u.created_at,
  u.last_login_at,
  COUNT(DISTINCT t.id) AS total_todos,
  SUM(CASE WHEN t.completed = 1 THEN 1 ELSE 0 END) AS completed_todos,
  COUNT(DISTINCT n.id) AS total_notes,
  COUNT(DISTINCT h.id) AS total_habits,
  COUNT(DISTINCT CASE WHEN h.is_active = 1 THEN h.id END) AS active_habits
FROM users u
LEFT JOIN todos t ON u.id = t.user_id
LEFT JOIN notes n ON u.id = n.user_id
LEFT JOIN habits h ON u.id = h.user_id
WHERE u.status = 1
GROUP BY u.id, u.username, u.email, u.avatar, u.created_at, u.last_login_at;

-- 7.2 今日待办视图
CREATE OR REPLACE VIEW `v_today_todos` AS
SELECT 
  t.*,
  u.username
FROM todos t
JOIN users u ON t.user_id = u.id
WHERE t.completed = 0
  AND (t.due_date IS NULL OR DATE(t.due_date) >= CURDATE())
ORDER BY t.priority DESC, t.created_at DESC;

-- 7.3 习惯统计视图
CREATE OR REPLACE VIEW `v_habit_stats` AS
SELECT 
  h.id AS habit_id,
  h.user_id,
  h.name AS habit_name,
  h.frequency,
  h.is_active,
  h.streak_days,
  h.total_completions,
  COUNT(hl.id) AS this_month_completions,
  MAX(hl.completed_at) AS last_completed_at
FROM habits h
LEFT JOIN habit_logs hl ON h.id = hl.habit_id 
  AND hl.completed_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
GROUP BY h.id, h.user_id, h.name, h.frequency, h.is_active, h.streak_days, h.total_completions;

-- 7.4 每周习惯完成率视图
CREATE OR REPLACE VIEW `v_weekly_habit_completion` AS
SELECT 
  h.id AS habit_id,
  h.user_id,
  h.name AS habit_name,
  h.target_days,
  COUNT(hl.id) AS completed_days,
  ROUND(COUNT(hl.id) / h.target_days * 100, 2) AS completion_rate
FROM habits h
LEFT JOIN habit_logs hl ON h.id = hl.habit_id 
  AND hl.completed_at >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
  AND hl.completed_at < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 7 DAY)
WHERE h.frequency = 'weekly'
GROUP BY h.id, h.user_id, h.name, h.target_days;

-- ============================================
-- 8. 创建存储过程
-- ============================================

DELIMITER //

-- 8.1 用户注册存储过程
CREATE PROCEDURE `sp_user_register`(
  IN p_username VARCHAR(50),
  IN p_password VARCHAR(255),
  IN p_email VARCHAR(100)
)
BEGIN
  DECLARE v_count INT;
  
  -- 检查用户名是否已存在
  SELECT COUNT(*) INTO v_count FROM users WHERE username = p_username;
  IF v_count > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '用户名已存在';
  END IF;
  
  -- 检查邮箱是否已存在
  IF p_email IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count FROM users WHERE email = p_email;
    IF v_count > 0 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '邮箱已被注册';
    END IF;
  END IF;
  
  -- 插入新用户
  INSERT INTO users (username, password, email, created_at, updated_at)
  VALUES (p_username, p_password, p_email, NOW(), NOW());
  
  SELECT LAST_INSERT_ID() AS user_id;
END //

-- 8.2 更新习惯连续天数存储过程
CREATE PROCEDURE `sp_update_habit_streak`(
  IN p_habit_id INT UNSIGNED
)
BEGIN
  DECLARE v_user_id INT UNSIGNED;
  DECLARE v_last_date DATE;
  DECLARE v_current_streak INT DEFAULT 0;
  DECLARE v_frequency VARCHAR(20);
  
  SELECT user_id, frequency INTO v_user_id, v_frequency 
  FROM habits WHERE id = p_habit_id;
  
  IF v_frequency = 'daily' THEN
    -- 计算连续天数
    SELECT DATE(completed_at) INTO v_last_date
    FROM habit_logs
    WHERE habit_id = p_habit_id
    ORDER BY completed_at DESC
    LIMIT 1;
    
    IF v_last_date = CURDATE() THEN
      SET v_current_streak = 1;
      SELECT COUNT(*) INTO v_current_streak
      FROM (
        SELECT DATE(completed_at) as log_date,
               @row_num := @row_num + 1 as row_num,
               DATEDIFF(CURDATE(), DATE(completed_at)) as date_diff
        FROM habit_logs, (SELECT @row_num := 0) r
        WHERE habit_id = p_habit_id
        ORDER BY completed_at DESC
      ) streak_calc
      WHERE row_num = date_diff + 1;
    END IF;
  END IF;
  
  UPDATE habits 
  SET streak_days = v_current_streak,
      total_completions = (SELECT COUNT(*) FROM habit_logs WHERE habit_id = p_habit_id),
      updated_at = NOW()
  WHERE id = p_habit_id;
  
  SELECT v_current_streak AS streak_days;
END //

-- 8.3 批量完成待办事项存储过程
CREATE PROCEDURE `sp_batch_complete_todos`(
  IN p_user_id INT UNSIGNED,
  IN p_todo_ids JSON
)
BEGIN
  DECLARE v_count INT DEFAULT 0;
  
  UPDATE todos 
  SET completed = 1,
      completed_at = NOW()
  WHERE user_id = p_user_id
    AND JSON_CONTAINS(p_todo_ids, CAST(id AS JSON));
  
  SET v_count = ROW_COUNT();
  
  SELECT v_count AS completed_count;
END //

-- 8.4 获取用户活动摘要存储过程
CREATE PROCEDURE `sp_get_user_activity_summary`(
  IN p_user_id INT UNSIGNED,
  IN p_days INT DEFAULT 7
)
BEGIN
  SELECT 
    p_user_id AS user_id,
    (SELECT COUNT(*) FROM todos 
     WHERE user_id = p_user_id 
     AND created_at >= DATE_SUB(CURDATE(), INTERVAL p_days DAY)) AS new_todos,
    (SELECT COUNT(*) FROM todos 
     WHERE user_id = p_user_id 
     AND completed = 1 
     AND completed_at >= DATE_SUB(CURDATE(), INTERVAL p_days DAY)) AS completed_todos,
    (SELECT COUNT(*) FROM notes 
     WHERE user_id = p_user_id 
     AND created_at >= DATE_SUB(CURDATE(), INTERVAL p_days DAY)) AS new_notes,
    (SELECT COUNT(*) FROM habit_logs 
     WHERE user_id = p_user_id 
     AND completed_at >= DATE_SUB(CURDATE(), INTERVAL p_days DAY)) AS habit_checkins;
END //

-- 8.5 数据同步存储过程（用于localStorage到数据库的同步）
CREATE PROCEDURE `sp_sync_user_data`(
  IN p_user_id INT UNSIGNED,
  IN p_todos JSON,
  IN p_notes JSON,
  IN p_habits JSON
)
BEGIN
  DECLARE v_todo_count INT DEFAULT 0;
  DECLARE v_note_count INT DEFAULT 0;
  DECLARE v_habit_count INT DEFAULT 0;
  
  -- 同步待办事项
  IF p_todos IS NOT NULL THEN
    INSERT INTO todos (user_id, task, completed, priority, category, due_date, tags, created_at, completed_at)
    SELECT 
      p_user_id,
      JSON_UNQUOTE(JSON_EXTRACT(jt, '$.task')),
      COALESCE(JSON_EXTRACT(jt, '$.completed'), 0),
      COALESCE(JSON_UNQUOTE(JSON_EXTRACT(jt, '$.priority')), 'medium'),
      JSON_UNQUOTE(JSON_EXTRACT(jt, '$.category')),
      STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(jt, '$.dueDate')), '%Y-%m-%d %H:%i:%s'),
      JSON_EXTRACT(jt, '$.tags'),
      COALESCE(STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(jt, '$.createdAt')), '%Y-%m-%d %H:%i:%s'), NOW()),
      STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(jt, '$.completedAt')), '%Y-%m-%d %H:%i:%s')
    FROM JSON_TABLE(p_todos, '$[*]' COLUMNS (jt JSON PATH '$')) AS jt
    ON DUPLICATE KEY UPDATE
      task = VALUES(task),
      completed = VALUES(completed),
      completed_at = VALUES(completed_at);
    
    SET v_todo_count = ROW_COUNT();
  END IF;
  
  -- 同步备忘录
  IF p_notes IS NOT NULL THEN
    INSERT INTO notes (user_id, title, content, category, tags, created_at, updated_at)
    SELECT 
      p_user_id,
      JSON_UNQUOTE(JSON_EXTRACT(jn, '$.title')),
      JSON_UNQUOTE(JSON_EXTRACT(jn, '$.content')),
      JSON_UNQUOTE(JSON_EXTRACT(jn, '$.category')),
      JSON_EXTRACT(jn, '$.tags'),
      COALESCE(STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(jn, '$.createdAt')), '%Y-%m-%d %H:%i:%s'), NOW()),
      COALESCE(STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(jn, '$.updatedAt')), '%Y-%m-%d %H:%i:%s'), NOW())
    FROM JSON_TABLE(p_notes, '$[*]' COLUMNS (jn JSON PATH '$')) AS jn
    ON DUPLICATE KEY UPDATE
      title = VALUES(title),
      content = VALUES(content),
      updated_at = VALUES(updated_at);
    
    SET v_note_count = ROW_COUNT();
  END IF;
  
  -- 同步习惯
  IF p_habits IS NOT NULL THEN
    INSERT INTO habits (user_id, name, description, frequency, reminder_time, created_at)
    SELECT 
      p_user_id,
      JSON_UNQUOTE(JSON_EXTRACT(jh, '$.name')),
      JSON_UNQUOTE(JSON_EXTRACT(jh, '$.description')),
      COALESCE(JSON_UNQUOTE(JSON_EXTRACT(jh, '$.frequency')), 'daily'),
      JSON_UNQUOTE(JSON_EXTRACT(jh, '$.reminderTime')),
      COALESCE(STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(jh, '$.createdAt')), '%Y-%m-%d %H:%i:%s'), NOW())
    FROM JSON_TABLE(p_habits, '$[*]' COLUMNS (jh JSON PATH '$')) AS jh
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      description = VALUES(description),
      updated_at = NOW();
    
    SET v_habit_count = ROW_COUNT();
  END IF;
  
  SELECT v_todo_count AS synced_todos, v_note_count AS synced_notes, v_habit_count AS synced_habits;
END //

DELIMITER ;

-- ============================================
-- 9. 创建触发器
-- ============================================

DELIMITER //

-- 9.1 更新用户最后登录时间触发器
CREATE TRIGGER `trg_user_login`
AFTER UPDATE ON `users`
FOR EACH ROW
BEGIN
  IF OLD.last_login_at IS NULL OR NEW.last_login_at != OLD.last_login_at THEN
    -- 登录时间更新时的额外操作（如记录日志）
    INSERT INTO user_login_logs (user_id, login_time, ip_address)
    VALUES (NEW.id, NEW.last_login_at, NULL);
  END IF;
END //

DELIMITER ;

-- ============================================
-- 10. 插入初始数据
-- ============================================

-- 10.1 插入示例用户（密码: 123456，已加密）
INSERT INTO `users` (`username`, `password`, `email`, `avatar`, `gender`, `age`, `birth`, `address`, `hobbies`, `status`, `created_at`) VALUES
('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEsKYGs5q0Zz0xJvlG', 'admin@example.com', NULL, 0, NULL, NULL, NULL, '["阅读", "编程"]', 1, NOW()),
('test_user', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEsKYGs5q0Zz0xJvlG', 'test@example.com', NULL, 1, 25, '1999-05-15', '北京市', '["运动", "音乐"]', 1, NOW()),
('demo', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEsKYGs5q0Zz0xJvlG', 'demo@example.com', NULL, 2, 30, '1994-08-20', '上海市', '["旅行", "摄影"]', 1, NOW());

-- 10.2 插入示例待办事项
INSERT INTO `todos` (`user_id`, `task`, `completed`, `priority`, `category`, `due_date`, `tags`, `created_at`) VALUES
(1, '完成项目文档编写', 0, 'high', '工作', DATE_ADD(CURDATE(), INTERVAL 3 DAY), '["文档", "重要"]', NOW()),
(1, '回复客户邮件', 1, 'medium', '工作', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '["邮件"]', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(1, '购买生活用品', 0, 'low', '生活', DATE_ADD(CURDATE(), INTERVAL 5 DAY), '["购物"]', NOW()),
(2, '学习React新特性', 0, 'high', '学习', DATE_ADD(CURDATE(), INTERVAL 7 DAY), '["React", "前端"]', NOW()),
(2, '健身锻炼', 0, 'medium', '健康', CURDATE(), '["运动", "健康"]', NOW()),
(3, '准备周末聚会', 1, 'medium', '社交', DATE_SUB(CURDATE(), INTERVAL 1 DAY), '["聚会"]', DATE_SUB(NOW(), INTERVAL 2 DAY));

-- 10.3 插入示例备忘录
INSERT INTO `notes` (`user_id`, `title`, `content`, `category`, `tags`, `is_pinned`, `color`, `created_at`) VALUES
(1, '项目会议纪要', '1. 确定下周发布计划\n2. 分配开发任务\n3. 讨论技术方案', '工作', '["会议", "项目"]', 1, '#FFEB3B', NOW()),
(1, '学习笔记 - MySQL优化', '1. 使用索引优化查询\n2. 避免SELECT *\n3. 合理使用JOIN', '学习', '["MySQL", "数据库"]', 0, '#4CAF50', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(2, '旅行计划', '目的地：云南\n时间：下个月\n预算：5000元', '生活', '["旅行"]', 1, '#2196F3', NOW()),
(3, '读书笔记', '《深入理解计算机系统》\n第一章：计算机系统漫游', '学习', '["读书"]', 0, '#9C27B0', DATE_SUB(NOW(), INTERVAL 1 DAY));

-- 10.4 插入示例习惯
INSERT INTO `habits` (`user_id`, `name`, `description`, `frequency`, `target_days`, `reminder_time`, `reminder_days`, `color`, `icon`, `is_active`, `streak_days`, `total_completions`, `created_at`) VALUES
(1, '每日阅读', '每天阅读30分钟', 'daily', 7, '21:00:00', '[1,2,3,4,5,6,7]', '#4CAF50', 'book', 1, 5, 45, DATE_SUB(NOW(), INTERVAL 45 DAY)),
(1, '晨跑', '每天早上跑步5公里', 'daily', 5, '06:30:00', '[1,3,5]', '#FF5722', 'run', 1, 3, 28, DATE_SUB(NOW(), INTERVAL 30 DAY)),
(2, '背单词', '每天背诵20个英语单词', 'daily', 7, '08:00:00', '[1,2,3,4,5]', '#2196F3', 'language', 1, 12, 60, DATE_SUB(NOW(), INTERVAL 60 DAY)),
(2, '健身', '每周去健身房3次', 'weekly', 3, '18:00:00', '[2,4,6]', '#9C27B0', 'fitness', 1, 2, 15, DATE_SUB(NOW(), INTERVAL 20 DAY)),
(3, '冥想', '每天冥想15分钟', 'daily', 7, '07:00:00', '[1,2,3,4,5,6,7]', '#00BCD4', 'meditation', 0, 0, 10, DATE_SUB(NOW(), INTERVAL 15 DAY));

-- 10.5 插入示例习惯打卡记录
INSERT INTO `habit_logs` (`habit_id`, `user_id`, `completed_at`, `note`, `mood`) VALUES
(1, 1, CONCAT(CURDATE(), ' 21:15:00'), '读完了《原子习惯》第三章', 5),
(1, 1, CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 21:30:00'), '阅读技术博客', 4),
(1, 1, CONCAT(DATE_SUB(CURDATE(), INTERVAL 2 DAY), ' 21:00:00'), NULL, 4),
(2, 1, CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 06:45:00'), '跑了5.2公里', 5),
(3, 2, CONCAT(CURDATE(), ' 08:10:00'), '背了25个单词', 5),
(3, 2, CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 08:00:00'), NULL, 4),
(4, 2, CONCAT(DATE_SUB(CURDATE(), INTERVAL 2 DAY), ' 18:30:00'), '练了胸肌', 4);

-- ============================================
-- 11. 创建用户登录日志表（用于触发器）
-- ============================================
CREATE TABLE IF NOT EXISTS `user_login_logs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `login_time` DATETIME NOT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_login_time` (`login_time`),
  CONSTRAINT `fk_login_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户登录日志表';

-- ============================================
-- 12. 设置表注释和权限
-- ============================================

-- 重新启用外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- 添加表注释（如果支持）
-- 注意：MySQL 5.5+ 支持此语法

-- ============================================
-- 数据库初始化完成
-- ============================================
SELECT '数据库 myku_app 初始化完成！' AS message;
SELECT CONCAT('用户表: ', COUNT(*), ' 条记录') AS users_count FROM users;
SELECT CONCAT('待办表: ', COUNT(*), ' 条记录') AS todos_count FROM todos;
SELECT CONCAT('备忘录表: ', COUNT(*), ' 条记录') AS notes_count FROM notes;
SELECT CONCAT('习惯表: ', COUNT(*), ' 条记录') AS habits_count FROM habits;
SELECT CONCAT('习惯打卡表: ', COUNT(*), ' 条记录') AS habit_logs_count FROM habit_logs;
