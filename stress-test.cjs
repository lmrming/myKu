/**
 * 快速压力测试 - 精简版
 * 4级并发 x 6端点 = 24项测试，每项10秒
 */
const autocannon = require('autocannon')
const os = require('os')
const fs = require('fs')
const path = require('path')

const BASE = process.env.BASE_URL || 'http://localhost:3001'
const FRONT = process.env.FRONTEND_URL || 'http://localhost:3002'
const REPORT_DIR = path.join(__dirname, 'stress-test-reports')

const LEVELS = [
  { name: '轻载50', conn: 50, sec: 10 },
  { name: '中载100', conn: 100, sec: 10 },
  { name: '重载200', conn: 200, sec: 10 },
  { name: '极限500', conn: 500, sec: 8 }
]

const ENDPOINTS = [
  { name: '首页', url: FRONT, method: 'GET' },
  { name: '健康检查', url: `${BASE}/api/health`, method: 'GET' },
  { name: '待办API', url: `${BASE}/api/todos?user_id=9`, method: 'GET' },
  { name: '备忘录API', url: `${BASE}/api/notes?user_id=9`, method: 'GET' },
  { name: '习惯API', url: `${BASE}/api/habits?user_id=9`, method: 'GET' },
  { name: '登录API', url: `${BASE}/api/login`, method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'test', password: 'test' }) }
]

function pct(arr, p) {
  if (!arr || !arr.length) return 0
  const s = [...arr].sort((a, b) => a - b)
  return s[Math.max(0, Math.ceil(s.length * p / 100) - 1)]
}

function fmtMs(v) {
  if (v < 1) return `${(v * 1000).toFixed(0)}μs`
  if (v < 1000) return `${v.toFixed(1)}ms`
  return `${(v / 1000).toFixed(2)}s`
}

function fmtBytes(b) {
  if (b < 1024) return `${b.toFixed(0)}B`
  if (b < 1048576) return `${(b / 1024).toFixed(1)}KB`
  return `${(b / 1048576).toFixed(1)}MB`
}

function cpuUsage() {
  const cpus = os.cpus()
  let idle = 0, total = 0
  cpus.forEach(c => { for (const t in c.times) { total += c.times[t]; idle += c.times.idle } })
  return Math.round(((total - idle) / total) * 100)
}

function memUsage() {
  const total = os.totalmem(), free = os.freemem()
  return Math.round(((total - free) / total) * 100)
}

async function runTest(ep, level) {
  const cpuBefore = cpuUsage()
  const memBefore = memUsage()

  try {
    const result = await autocannon({
      url: ep.url,
      method: ep.method || 'GET',
      connections: level.conn,
      duration: level.sec,
      headers: ep.headers || {},
      body: ep.body || undefined,
      timeout: 8,
      pipelining: 1
    })

    const cpuAfter = cpuUsage()
    const memAfter = memUsage()

    return {
      ok: true,
      endpoint: ep.name,
      level: level.name,
      conn: level.conn,
      rps: result.requests.average,
      latency: {
        avg: result.latency.average,
        p50: result.latency.p50,
        p90: result.latency.p90,
        p95: result.latency.p95,
        p99: result.latency.p99,
        max: result.latency.max
      },
      throughput: result.throughput.average,
      errors: result.errors,
      timeouts: result.timeouts,
      statusCodes: result.statusCodeStats || {},
      cpu: { before: cpuBefore, after: cpuAfter, peak: Math.max(cpuBefore, cpuAfter) },
      mem: { before: memBefore, after: memAfter, peak: Math.max(memBefore, memAfter) }
    }
  } catch (err) {
    return { ok: false, endpoint: ep.name, level: level.name, conn: level.conn, error: err.message }
  }
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════╗')
  console.log('║        首页全面压力测试 - 开始执行                  ║')
  console.log('╠══════════════════════════════════════════════════════╣')
  console.log(`║  后端: ${BASE.padEnd(44)}║`)
  console.log(`║  前端: ${FRONT.padEnd(44)}║`)
  console.log(`║  级别: ${LEVELS.map(l => l.conn).join('/').padEnd(44)}║`)
  console.log(`║  端点: ${String(ENDPOINTS.length).padEnd(44)}║`)
  console.log('╚══════════════════════════════════════════════════════╝\n')

  // 预检
  try {
    await autocannon({ url: `${BASE}/api/health`, connections: 1, duration: 2 })
    console.log('[预检] 后端服务正常\n')
  } catch (e) {
    console.error(`[预检] 后端不可用: ${e.message}\n请先启动: npm run server`)
    process.exit(1)
  }

  const results = []
  const total = LEVELS.length * ENDPOINTS.length
  let n = 0

  for (const level of LEVELS) {
    console.log(`${'═'.repeat(56)}`)
    console.log(`  📊 ${level.name} (${level.conn}并发, ${level.sec}秒)`)
    console.log(`${'═'.repeat(56)}`)

    for (const ep of ENDPOINTS) {
      n++
      process.stdout.write(`  [${n}/${total}] ${ep.name}...`)
      const r = await runTest(ep, level)
      results.push(r)

      if (r.ok) {
        console.log(` ✅ RPS:${r.rps} 延迟:${fmtMs(r.latency.avg)} P99:${fmtMs(r.latency.p99)} 错误:${r.errors}`)
      } else {
        console.log(` ❌ ${r.error}`)
      }

      // 间隔2秒
      await new Promise(r => setTimeout(r, 2000))
    }
  }

  // ============ 生成报告 ============
  const okResults = results.filter(r => r.ok)
  const failResults = results.filter(r => !r.ok)

  const lines = []
  const sep = '═'.repeat(78)

  lines.push('')
  lines.push(sep)
  lines.push('                        首页压力测试报告')
  lines.push(sep)
  lines.push(`  测试时间: ${new Date().toLocaleString('zh-CN')}`)
  lines.push(`  后端地址: ${BASE}`)
  lines.push(`  前端地址: ${FRONT}`)
  lines.push(`  系统信息: ${os.platform()} ${os.arch()} | ${os.cpus().length}核 | ${(os.totalmem()/1073741824).toFixed(1)}GB`)
  lines.push('')

  // 一、响应时间汇总
  lines.push(`${'─'.repeat(78)}`)
  lines.push('  一、响应时间与吞吐量汇总')
  lines.push(`${'─'.repeat(78)}`)
  lines.push(`${'端点'.padEnd(10)}${'并发'.padEnd(8)}${'平均延迟'.padEnd(12)}${'P50'.padEnd(12)}${'P95'.padEnd(12)}${'P99'.padEnd(12)}${'RPS'.padEnd(10)}${'错误'.padEnd(6)}`)
  lines.push(`${'─'.repeat(78)}`.substring(0, 78))

  for (const r of okResults) {
    lines.push(
      `${r.endpoint.padEnd(10)}${String(r.conn).padEnd(8)}` +
      `${fmtMs(r.latency.avg).padEnd(12)}${fmtMs(r.latency.p50).padEnd(12)}` +
      `${fmtMs(r.latency.p95).padEnd(12)}${fmtMs(r.latency.p99).padEnd(12)}` +
      `${String(r.rps).padEnd(10)}${String(r.errors).padEnd(6)}`
    )
  }
  if (failResults.length) {
    lines.push('')
    for (const r of failResults) {
      lines.push(`${r.endpoint.padEnd(10)}${String(r.conn).padEnd(8)}失败: ${r.error}`)
    }
  }

  // 二、错误率统计
  lines.push('')
  lines.push(`${'─'.repeat(78)}`)
  lines.push('  二、错误率统计')
  lines.push(`${'─'.repeat(78)}`)

  const errorResults = okResults.filter(r => r.errors > 0 || r.timeouts > 0)
  if (errorResults.length === 0) {
    lines.push('  ✅ 所有测试均无错误和超时')
  } else {
    lines.push(`${'端点'.padEnd(10)}${'并发'.padEnd(8)}${'错误数'.padEnd(10)}${'超时数'.padEnd(10)}${'状态码分布'.padEnd(30)}`)
    for (const r of errorResults) {
      const sc = Object.entries(r.statusCodes || {}).map(([k, v]) => `${k}:${v}`).join(' ')
      lines.push(`${r.endpoint.padEnd(10)}${String(r.conn).padEnd(8)}${String(r.errors).padEnd(10)}${String(r.timeouts).padEnd(10)}${sc}`)
    }
  }

  // 三、服务器资源
  lines.push('')
  lines.push(`${'─'.repeat(78)}`)
  lines.push('  三、服务器资源监控')
  lines.push(`${'─'.repeat(78)}`)
  lines.push(`${'端点'.padEnd(10)}${'并发'.padEnd(8)}${'CPU峰值%'.padEnd(12)}${'内存峰值%'.padEnd(12)}${'吞吐量'.padEnd(15)}`)
  for (const r of okResults) {
    lines.push(
      `${r.endpoint.padEnd(10)}${String(r.conn).padEnd(8)}` +
      `${String(r.cpu.peak).padEnd(12)}${String(r.mem.peak).padEnd(12)}` +
      `${fmtBytes(r.throughput)}/s`
    )
  }

  // 四、性能拐点分析
  lines.push('')
  lines.push(`${'─'.repeat(78)}`)
  lines.push('  四、性能拐点分析')
  lines.push(`${'─'.repeat(78)}`)

  const groups = {}
  for (const r of okResults) {
    if (!groups[r.endpoint]) groups[r.endpoint] = []
    groups[r.endpoint].push(r)
  }

  for (const [name, group] of Object.entries(groups)) {
    lines.push(`\n  📈 ${name}:`)
    const sorted = group.sort((a, b) => a.conn - b.conn)
    let prev = 0
    let inflection = false

    for (const r of sorted) {
      const lat = r.latency.avg
      const growth = prev > 0 ? ((lat - prev) / prev * 100).toFixed(1) : '-'
      const mark = prev > 0 && (lat - prev) / prev > 0.5 ? ' ⚠️拐点!' : ''
      if (mark) inflection = true
      lines.push(`     ${String(r.conn).padStart(3)}并发: ${fmtMs(lat).padStart(10)}  增长: ${growth !== '-' ? growth + '%' : growth}${mark}`)
      prev = lat
    }
    if (!inflection) lines.push('     ✅ 测试范围内无明显拐点')
  }

  // 五、功能完整性
  lines.push('')
  lines.push(`${'─'.repeat(78)}`)
  lines.push('  五、高负载下功能完整性验证')
  lines.push(`${'─'.repeat(78)}`)

  const highLoad = okResults.filter(r => r.conn >= 200)
  const funcOk = highLoad.filter(r => r.errors === 0 && r.timeouts === 0)
  const funcFail = highLoad.filter(r => r.errors > 0 || r.timeouts > 0)

  if (funcFail.length === 0) {
    lines.push('  ✅ 200+并发下所有端点功能完整，无错误无超时')
  } else {
    lines.push('  ⚠️ 高负载下以下端点出现异常:')
    for (const r of funcFail) {
      lines.push(`     - ${r.endpoint} (${r.conn}并发): ${r.errors}错误, ${r.timeouts}超时`)
    }
  }

  // 六、优化建议
  lines.push('')
  lines.push(`${'─'.repeat(78)}`)
  lines.push('  六、性能优化建议')
  lines.push(`${'─'.repeat(78)}`)

  const suggestions = []

  const slowEndpoints = okResults.filter(r => r.latency.avg > 100)
  if (slowEndpoints.length > 0) {
    suggestions.push('🔴 高延迟端点 (>100ms):')
    slowEndpoints.forEach(r => suggestions.push(`   - ${r.endpoint} (${r.conn}并发): ${fmtMs(r.latency.avg)}`))
    suggestions.push('   → 建议: 添加数据库索引、启用查询缓存、优化SQL语句')
  }

  const errEndpoints = okResults.filter(r => r.errors > 0)
  if (errEndpoints.length > 0) {
    suggestions.push('\n🔴 高错误率端点:')
    errEndpoints.forEach(r => suggestions.push(`   - ${r.endpoint} (${r.conn}并发): ${r.errors}错误`))
    suggestions.push('   → 建议: 增加连接池、添加限流、检查服务配置')
  }

  const cpuHigh = okResults.filter(r => r.cpu.peak > 70)
  if (cpuHigh.length > 0) {
    suggestions.push('\n🔴 CPU瓶颈 (>70%):')
    suggestions.push('   → 建议: 启用Node.js集群模式、使用Worker线程、减少同步计算')
  }

  const memHigh = okResults.filter(r => r.mem.peak > 80)
  if (memHigh.length > 0) {
    suggestions.push('\n🔴 内存压力 (>80%):')
    suggestions.push('   → 建议: 检查内存泄漏、优化数据结构、增加服务器内存')
  }

  suggestions.push('\n🟢 通用优化建议:')
  suggestions.push('   1. 启用 gzip/brotli 压缩中间件 (compression)')
  suggestions.push('   2. 添加 Redis 缓存热点API数据')
  suggestions.push('   3. 使用 CDN 分发前端静态资源')
  suggestions.push('   4. 数据库连接池: pool size = CPU核心数 × 2 + 磁盘数')
  suggestions.push('   5. 添加 express-rate-limit 防止恶意请求')
  suggestions.push('   6. 启用 HTTP Keep-Alive 减少TCP握手开销')
  suggestions.push('   7. 考虑 PM2 集群模式利用多核CPU')

  if (suggestions.length <= 8) {
    lines.push('  ✅ 所有指标在正常范围内，系统性能良好！')
  } else {
    lines.push(suggestions.join('\n'))
  }

  lines.push('')
  lines.push(sep)
  lines.push('                          报告结束')
  lines.push(sep)

  // 输出
  const textReport = lines.join('\n')
  console.log('\n' + textReport)

  // 保存文件
  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true })
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  fs.writeFileSync(path.join(REPORT_DIR, `report-${ts}.txt`), textReport, 'utf-8')
  fs.writeFileSync(path.join(REPORT_DIR, `report-${ts}.json`), JSON.stringify({ results, generatedAt: new Date().toISOString() }, null, 2), 'utf-8')

  console.log(`\n📄 报告已保存至: ${REPORT_DIR}`)
}

main().catch(err => { console.error('测试失败:', err); process.exit(1) })
