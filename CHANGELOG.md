# CHANGELOG

本文件记录 myku 项目的所有重要变更。格式基于 [Keep a Changelog](https://keepachangelog.com/)。

---

## [2.1.0] - 2026-06-04

### 新增功能

#### 待办事项 - 完成即删除
- **描述**: 点击任务"完成"按钮时，系统立即标记为已完成并同步向后端发送 DELETE 请求永久删除该任务
- **行为**:
  - 点击完成 → 立即显示删除线 + 颜色变淡 + Spinner 加载遮罩
  - 后端删除成功 → 任务从列表淡出消失
  - 后端删除失败 → 自动回滚到未完成状态 + 红色 Toast 错误提示
- **涉及文件**:
  - `src/pages/Todo.jsx` — handleToggle 函数重构、deletingTodos 状态、error Toast、TaskCard 加载遮罩
  - `src/services/dataSync.js` — 新增 `deleteTodoFromDB()` API 函数（第1063-1113行）

#### 待办事项 - 批量操作增强
- **描述**: 批量完成和批量删除操作也接入了后端 API，支持乐观更新 + 错误回滚
- **涉及文件**: `src/pages/Todo.jsx` — handleBatchComplete / handleBatchDelete

#### 压力测试工具链
- **描述**: 新增完整的压力测试基础设施，支持多级并发自动化测试
- **新增文件**:
  - `stress-test.cjs` — 主测试脚本（4级并发 x 6端点 = 24项测试）
  - `stress-monitor.cjs` — 服务器资源监控模块（CPU/内存/网络）
  - `stress-test-reports/` — 测试报告输出目录
- **依赖**: autocannon (devDependency)
- **使用方式**: `node stress-test.cjs`

### Bug 修复

#### 备忘录页面数据闪现问题 (P0)
- **问题**: 进入备忘录页面时，旧数据短暂显示后恢复正常
- **根因**:
  1. 缺少 `isLoading` 状态管理，页面立即渲染空数组或旧缓存
  2. 双重数据源竞争条件（数据库 vs localStorage）
  3. dataSync.js 中错误回退直接返回可能过期的 localStorage 数据
- **修复方案**:
  - 添加 `isLoading` 状态控制，加载完成前不渲染内容
  - 新增骨架屏 UI（animate-pulse 动画），替代空白闪烁
  - 重构 loadData 函数：统一在结束时设置 `setIsLoading(false)`
  - 增强 loadNotesFromDB：区分错误类型（AbortError/network/fetch/404）、添加离线检测、本地缓存读取独立函数化
- **涉及文件**:
  - `src/pages/Notes.jsx` — isLoading 状态 + 骨架屏渲染
  - `src/services/dataSync.js` — loadNotesFromDB 增强版 + getLocalNotes 辅助函数

#### Notes.jsx 模块加载崩溃 (P0)
- **问题**: 6条级联错误导致整个页面白屏崩溃
  1. `ERR_ABORTED - Notes.jsx` 动态导入失败
  2. `TypeError: Failed to fetch dynamically imported module`
  3. React Lazy 组件无法挂载
  4. API请求被强制中止
  5. 同步系统部分失败
- **根因**: Vite HMR 热更新冲突 + 缺少错误边界保护
- **修复方案**:
  1. **新建 ErrorBoundary 组件** (`src/components/NotesErrorBoundary.jsx`)：捕获 Notes 页面所有渲染错误，提供友好错误界面（含重试按钮和技术详情展开）
  2. **Lazy 导入重试机制** (`src/App.jsx`)：Notes 组件动态导入失败后自动1秒重试
  3. **路由包装**: Notes 路由用 `<NotesErrorBoundary>` 包裹
  4. **dataSync.js 错误分类处理**: 区分 AbortError/network/fetch/404 等不同类型，给出对应降级策略
- **涉及文件**:
  - `src/components/NotesErrorBoundary.jsx` (**新建**)
  - `src/App.jsx` — 导入 EB + Lazy重试 + 路由包装
  - `src/services/dataSync.js` — loadNotesFromDB 增强错误处理

### 性能优化

#### 后端全面性能优化 (5项措施)
- **优化前基准**(50并发): 备忘录API 67.6ms/733RPS, 500并发时最差999ms
- **优化后结果**(50并发): 备忘录API 9.7ms/4920RPS, 500并发时129ms

| # | 措施 | 详情 | 效果 |
|---|------|------|------|
| 1 | **gzip/brotli 压缩** | compression中间件, level=6, threshold=1024B | 吞吐量+35% |
| 2 | **数据库索引(9个)** | todos/notes/habits/habit_logs/users 表的 user_id/created_at/updated_at 字段 | 备忘录500并发: 999ms→129ms (-87%) |
| 3 | **内存缓存机制** | 5秒TTL Map缓存, LRU淘汰(上限500条), 写操作自动失效, 覆盖GET /api/todos & /notes & /habits | RPS提升3-7倍 |
| 4 | **API限流** | express-rate-limit, 300req/min, 标准HTTP头, 健康检查豁免 | 防恶意请求 |
| 5 | **连接池优化** | connectionLimit: CPU×2+1(17), KeepAlive启用 | 高并发排队减少 |

- **涉及文件**: `server-mysql.cjs` (+120行代码)

#### 性能测试对比数据
详见 `stress-test-reports/` 目录下两份报告:
- `report-2026-06-04T06-38-01-939Z.txt` — **优化前基线**
- `report-2026-06-04T07-01-39-712Z.txt` — **优化后回归**

关键指标:
| 指标 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| 备忘录API 500并发延迟 | 999ms | 129ms | **-87.1%** |
| 平均API延迟(50并发) | 35ms | 9.4ms | **-73%** |
| 平均RPS(50并发) | 2249 | 4448 | **+98%** |
| 高延迟端点(>100ms)数 | 11个 | 7个 | **-36%** |
| 错误率/超时率 | 0%/0% | 0%/0% | 保持 |

### 依赖变更

#### 新增生产依赖
| 包名 | 版本 | 用途 |
|------|------|------|
| compression | latest | gzip/brotli 响应压缩 |
| express-rate-limit | latest | API 速率限制 |

#### 新增开发依赖
| 包名 | 版本 | 用途 |
|------|------|------|
| autocannon | latest | HTTP 基准测试/压力测试 |

### 测试情况

| 测试项 | 结果 | 备注 |
|--------|------|------|
| 单元测试 | 未运行 | 项目无配置单元测试框架 |
| 压力测试(24项) | 全部通过 | 0错误 0超时 |
| 功能回归(备忘录) | 通过 | 无数据闪现 |
| 功能回归(待办完成删除) | 通过 | 乐观更新+回滚正常 |
| ErrorBoundary 触发 | 通过 | 友好UI展示 |
| 后端服务启动 | 正常 | 9个索引创建成功 |

### 已知问题

1. **前端首页500并发瓶颈**: Vite dev server 在500并发下延迟1.53s，这是开发服务器限制，生产环境 build 后部署 Nginx/CDN 可解决
2. **rate-limit 固定阈值**: 当前300 req/min 对所有用户相同，生产环境建议根据用户等级动态调整
3. **缓存无持久化**: 进程重启后 Map 缓存丢失，后续可引入 Redis 替代
4. **单进程架构**: 当前仅利用1核CPU，8核机器可通过 PM2 cluster 模式进一步提升
5. **CPU监控异常**: Windows 下 os.cpus() 返回值导致显示 -354%，需适配 Windows 平台
6. **登录API POST 压测**: 使用固定 test/test 凭据，实际用户密码不同不影响压测结论

### 后续计划

- [ ] 引入 Redis 替代内存缓存，实现持久化和多进程共享
- [ ] 配置 PM2 cluster 模式，利用全部8核CPU
- [ ] 生产环境 Nginx 反向代理 + gzip + CDN 部署
- [ ] rate-limit 基于用户等级的动态限流策略
- [ ] 为核心功能补充单元测试（Jest/Vitest）
- [ ] CI/CD 流水线集成自动压测
- [ ] 修复 Windows 平台 CPU 监控兼容性问题

---

## [2.0.0] - 之前版本

### 功能
- 用户注册/登录/个人信息管理
- 待办事项 CRUD + 优先级/分类/标签/截止日期
- 备忘录 CRUD + 分类/标签
- 习惯追踪 + 打卡记录
- 日历视图
- 专注模式（番茄钟）
- 天气查询
- 白噪音播放
- 亮色/暗色主题切换
- 数据同步（localStorage + MySQL 双写）

---

## 版本规范

- **主版本(Major)**: 不兼容的 API 变更或重大架构重构
- **次版本(Minor)**: 向后兼容的功能新增
- **修订号(Patch)**: 向后兼容的 Bug 修复

## 更新类型标签

- **新增功能**: 新特性、新页面、新接口
- **Bug 修复**: 缺陷修复、异常处理
- **性能优化**: 响应速度提升、资源占用降低
- **安全加固**: 漏洞修复、权限增强
- **重构**: 代码结构调整（不改变行为）
- **文档**: 文档更新
- **依赖**: 第三方包版本变更
