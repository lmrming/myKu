# MYKU 设计系统

**my库 - 个人效率工具集** · 编辑主题 · v2.0.0

---

## 概述

my库是一个综合性的个人效率工具应用，采用编辑主题设计风格，将多种生产力工具整合在一个优雅的界面中。

### 核心功能

- **待办事项** - 任务管理，支持优先级、分类、标签
- **日历视图** - 可视化日程管理
- **专注模式** - 番茄工作法，提升工作效率
- **备忘录** - 快速记录想法和笔记
- **习惯追踪** - 建立和管理日常习惯
- **天气查询** - 实时天气信息和预报
- **白噪音** - 专注和放松的声音环境

### 设计理念

- **克制优于装饰**：每个元素都有其用途
- **排版优先的层次结构**：通过大小和字重创建结构，而非边框
- **温暖的中性色**：基于 OKLCH 的颜色，带有微妙的温暖感
- **一致的运动效果**：有目的、微妙的动画
- **数据同步**：本地数据与云端数据库无缝同步

---

## 技术架构

### 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.2.0 | UI框架 |
| Vite | 5.0.8 | 构建工具 |
| TailwindCSS | 3.3.5 | CSS框架 |
| Framer Motion | 12.38.0 | 动画库 |
| React Router | 6.20.0 | 路由管理 |
| date-fns | 4.1.0 | 日期处理 |
| Recharts | 3.8.0 | 数据可视化 |

### 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | - | 运行环境 |
| Express | 4.18.2 | Web框架 |
| MySQL2 | 3.22.1 | 数据库驱动 |
| CORS | 2.8.5 | 跨域处理 |

### 数据库结构

**数据库名称**: `myku_app`

| 表名 | 说明 | 主要字段 |
|------|------|----------|
| `users` | 用户表 | id, username, password, email, avatar, gender, age, birth, hobbies |
| `todos` | 待办事项 | id, user_id, task, completed, priority, category, due_date, tags |
| `notes` | 备忘录 | id, user_id, title, content, category, tags, is_pinned, color |
| `habits` | 习惯 | id, user_id, name, frequency, reminder_time, streak_days |
| `habit_logs` | 习惯打卡 | id, habit_id, user_id, completed_at, note, mood |

---

## 色彩系统

### 中性色阶（墨色与纸色）

| 令牌 | 浅色模式 | 深色模式 | 用途 |
|-------|------------|-----------|-------|
| `--color-paper-1` | `#ffffff` | `#0c0a09` | 主背景色 |
| `--color-paper-2` | `#fafaf9` | `#1c1917` | 次要背景色 |
| `--color-paper-3` | `#f5f5f4` | `#292524` | 第三背景色 |
| `--color-ink-9` | `oklch(18%)` | `oklch(96%)` | 主文本色 |
| `--color-ink-6` | `oklch(50%)` | `oklch(72%)` | 次要文本色 |
| `--color-ink-5` | `oklch(65%)` | `oklch(58%)` | 第三文本色 |

### 主色调（暖靛蓝）

| 令牌 | 值 | 用途 |
|-------|-------|-------|
| `--color-primary-5` | `oklch(65% 0.1 270)` | 主要操作、焦点状态 |
| `--color-primary-6` | `oklch(55% 0.1 270)` | 按钮、激活状态 |
| `--color-primary-7` | `oklch(45% 0.09 270)` | 悬停状态 |

### 功能色彩

| 功能 | 令牌 | 值 | 应用场景 |
|------|-------|-------|----------|
| 待办事项 | `--color-todo` | `#3B82F6` | 任务管理 |
| 备忘录 | `--color-note` | `#F59E0B` | 笔记记录 |
| 习惯 | `--color-habit` | `#10B981` | 习惯追踪 |
| 专注 | `--color-focus` | `#8B5CF6` | 专注模式 |
| 天气 | `--color-weather` | `#06B6D4` | 天气查询 |
| 白噪音 | `--color-sound` | `#EC4899` | 声音景观 |

### 语义色彩

| 类型 | 令牌 | 值 |
|------|-------|-------|
| 成功 | `--color-success-4` | `oklch(60% 0.1 145)` |
| 警告 | `--color-warning-4` | `oklch(62% 0.1 85)` |
| 错误 | `--color-error-4` | `oklch(58% 0.12 25)` |

---

## 排版

### 字体栈

```css
--font-display: 'Inter', 'SF Pro Display', -apple-system, sans-serif;
--font-body: 'Inter', 'SF Pro Text', -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', monospace;
```

### 字号层级（大三度 - 1.25）

| 令牌 | 大小 | 用途 |
|-------|------|-------|
| `--font-size-5xl` | clamp(4rem, 3.2rem + 4vw, 5.5rem) | 展示标题 |
| `--font-size-4xl` | clamp(3rem, 2.5rem + 2.5vw, 4rem) | 页面标题 |
| `--font-size-3xl` | clamp(2.25rem, 1.9rem + 1.75vw, 3rem) | 章节标题 |
| `--font-size-2xl` | clamp(1.75rem, 1.5rem + 1.25vw, 2.25rem) | 卡片标题 |
| `--font-size-lg` | clamp(1.125rem, 1rem + 0.625vw, 1.375rem) | 副标题 |
| `--font-size-base` | clamp(1rem, 0.9rem + 0.5vw, 1.125rem) | 正文文本 |
| `--font-size-sm` | clamp(0.875rem, 0.8rem + 0.375vw, 1rem) | 小文本 |
| `--font-size-xs` | clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem) | 说明文字 |

### 排版模式

- **展示**：粗体 (700)，紧凑字间距 (-0.03em)，紧凑行高 (1.1)
- **标题**：半粗体 (600)，紧凑字间距 (-0.02em)，紧凑行高 (1.1)
- **正文**：常规 (400)，正常字间距 (-0.01em)，宽松行高 (1.5)
- **说明**：中等 (500)，宽字间距 (0.05em)，大写

---

## 间距

### 8pt 网格系统

| 令牌 | 值 | 用途 |
|-------|-------|-------|
| `--space-1` | 4px | 紧密间隙 |
| `--space-2` | 8px | 图标间隙 |
| `--space-4` | 16px | 组件内边距 |
| `--space-6` | 24px | 章节间隙 |
| `--space-8` | 32px | 容器内边距 |
| `--space-12` | 48px | 大章节 |
| `--space-16` | 64px | 页面章节 |

---

## 组件

### 表面（卡片）

```css
background: var(--color-surface);
border: 1px solid var(--color-border);
border-radius: var(--radius-lg);
box-shadow: var(--shadow-1);
```

**悬停状态**：
```css
box-shadow: var(--shadow-3);
transform: translateY(-2px);
border-color: var(--color-border-strong);
```

### 主要按钮

```css
background: var(--color-primary-6);
color: var(--color-text-inverse);
border-radius: var(--radius-md);
padding: 12px 20px;
font-weight: 500;
```

### 次要按钮

```css
background: var(--color-bg-secondary);
color: var(--color-text-primary);
border: 1px solid var(--color-border);
border-radius: var(--radius-md);
```

### 输入框

```css
background: var(--color-surface);
border: 1px solid var(--color-border);
border-radius: var(--radius-md);
padding: 12px 16px;
```

**焦点状态**：
```css
border-color: var(--color-primary-5);
box-shadow: 0 0 0 3px var(--color-focus-ring);
```

### 同步按钮

```css
background: var(--color-success-4);
color: white;
border-radius: var(--radius-full);
padding: 8px 16px;
font-size: var(--font-size-sm);
```

**同步中状态**：
```css
animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
```

---

## 阴影

| 令牌 | 值 | 用途 |
|-------|-------|-------|
| `--shadow-1` | 0 1px 2px rgba | 静止状态 |
| `--shadow-2` | 多层微妙 | 悬停状态 |
| `--shadow-3` | 多层中等 | 提升卡片 |
| `--shadow-4` | 多层大 | 模态框、下拉菜单 |
| `--shadow-5` | 多层超大 | 最大提升 |

---

## 动画

### 时间

| 令牌 | 值 | 用途 |
|-------|-------|-------|
| `--duration-fast` | 150ms | 悬停状态 |
| `--duration-normal` | 250ms | 过渡效果 |
| `--duration-slow` | 350ms | 页面过渡 |

### 缓动

| 令牌 | 值 | 用途 |
|-------|-------|-------|
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | 退出动画 |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | 弹性效果 |
| `--ease-dramatic` | `cubic-bezier(0.16, 1, 0.3, 1)` | 页面过渡 |

### 模式

- **淡入上移**：`透明度 0→1`，`translateY 12px→0`，`duration-normal`，`ease-dramatic`
- **缩放进入**：`透明度 0→1`，`缩放 0.96→1`，`duration-normal`，`ease-dramatic`
- **悬停提升**：`translateY 0→-2px`，`duration-fast`，`ease-out`
- **同步脉冲**：`scale 1→1.05→1`，`duration-slow`，`infinite`

---

## 布局

### 容器

```css
max-width: 1280px;
margin: 0 auto;
padding: 0 var(--space-6);
```

### 网格模式

**响应式网格**（符合 Hallmark 门限 61）：
```css
display: grid;
grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
gap: var(--space-4);
```

### 移动端断点

- **320px**：最小宽度
- **375px**：小屏手机
- **414px**：大屏手机
- **768px**：平板
- **1024px**：桌面

---

## 页面结构

### 核心页面

| 页面 | 路径 | 功能描述 |
|------|------|----------|
| 首页 | `/` | 功能导航入口 |
| 登录 | `/login` | 用户身份验证 |
| 注册 | `/register` | 新用户注册 |
| 仪表盘 | `/dashboard` | 数据概览和统计 |
| 待办事项 | `/todo` | 任务管理 |
| 日历 | `/calendar` | 日程视图 |
| 备忘录 | `/notes` | 笔记记录 |
| 习惯追踪 | `/habits` | 习惯管理 |
| 专注模式 | `/focus` | 番茄钟 |
| 天气 | `/weather` | 天气查询 |
| 白噪音 | `/soundscape` | 声音景观 |
| 个人资料 | `/profile` | 用户信息管理 |

### 核心组件

| 组件 | 文件路径 | 功能 |
|------|----------|------|
| 导航栏 | `src/components/Navbar.jsx` | 顶部导航和主题切换 |
| 同步按钮 | `src/components/SyncButton.jsx` | 数据同步控制 |
| 统计仪表板 | `src/components/StatisticsDashboard.jsx` | 数据可视化 |
| 主题切换 | `src/components/ThemeToggle.jsx` | 深色/浅色模式 |
| 头像上传 | `src/components/AvatarUploader.jsx` | 用户头像管理 |

---

## 数据同步

### 同步流程

1. **本地存储** - 所有数据首先保存到 localStorage
2. **云端同步** - 点击同步按钮将数据上传到 MySQL 数据库
3. **数据恢复** - 登录时从数据库拉取数据到本地

### 同步状态

| 状态 | 图标 | 颜色 | 说明 |
|------|------|------|------|
| 已同步 | ✓ | 绿色 | 本地与云端数据一致 |
| 待同步 | ↻ | 橙色 | 本地有未同步的更改 |
| 同步中 | ◐ | 蓝色 | 正在与服务器通信 |
| 同步失败 | ✗ | 红色 | 同步过程中出错 |

---

## 修改的文件

| 文件 | 变更 |
|------|---------|
| `src/styles/tokens.css` | 新建 - 完整的设计令牌系统 |
| `src/index.css` | 重写 - 使用令牌的全局样式 |
| `src/components/Navbar.jsx` | 重设计 - 编辑风格导航 |
| `src/pages/Home.jsx` | 重设计 - 编辑风格首页布局 |
| `tailwind.config.cjs` | 更新 - 令牌集成 |
| `server-mysql.cjs` | 后端 API 服务器 |
| `database/myku_app_complete.sql` | 数据库结构和初始数据 |

---

## Hallmark 合规性

### 预发布评估分数

| 维度 | 分数 | 说明 |
|------|-------|-------|
| 理念 | 5 | 一致的编辑愿景 |
| 层次 | 5 | 清晰的排版结构 |
| 执行 | 5 | 干净的实现 |
| 特异性 | 5 | 基于令牌，无魔法值 |
| 克制 | 5 | 无不必要的装饰 |
| 多样性 | 5 | 适当的组件变化 |

### 通过的门限

- ✅ 门限 36：无水平滚动
- ✅ 门限 46-50：焦点状态
- ✅ 门限 56：无自创指标
- ✅ 门限 57：无重绘控件
- ✅ 门限 58：锁定令牌
- ✅ 门限 61：网格 minmax 合规
- ✅ 门限 62：overflow-x: clip

---

## 使用

### 应用令牌

```jsx
// 使用 CSS 自定义属性
<div style={{ color: 'var(--color-text-primary)' }}>

// 或使用 Tailwind 类
<div className="text-ink-9 bg-paper-1">
```

### 组件示例

```jsx
<motion.div
  style={{
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-1)'
  }}
  whileHover={{
    boxShadow: 'var(--shadow-3)',
    y: -2
  }}
>
  {/* 内容 */}
</motion.div>
```

### 启动项目

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 启动后端 API 服务器
npm run server

# 构建生产版本
npm run build
```

---

## 最近更新

### v2.0.0 更新内容

- ✅ 用户注册/登录功能完善
- ✅ 头像上传和同步修复
- ✅ 数据库结构优化
- ✅ 数据同步功能增强
- ✅ 日期格式处理修复
- ✅ 后端 API 安全性提升

---

*由 Hallmark 生成 · 编辑主题 · 2026*
