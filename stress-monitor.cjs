/**
 * 服务器资源监控脚本
 * 在压力测试期间采集 CPU、内存、网络等指标
 */
const os = require('os')
const fs = require('fs')
const path = require('path')

class ServerMonitor {
  constructor(options = {}) {
    this.interval = options.interval || 1000
    this.samples = []
    this.timer = null
    this.startTime = null
    this.networkStats = { prevRx: 0, prevTx: 0, prevTime: 0 }
  }

  start() {
    this.startTime = Date.now()
    this.networkStats.prevTime = Date.now()

    // 初始化网络统计
    const netInfo = this._getNetworkInfo()
    this.networkStats.prevRx = netInfo.rxBytes
    this.networkStats.prevTx = netInfo.txBytes

    console.log('[Monitor] 开始监控服务器资源...')

    this.timer = setInterval(() => {
      const sample = this._collect()
      this.samples.push(sample)
    }, this.interval)
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    console.log(`[Monitor] 停止监控，共采集 ${this.samples.length} 个样本`)
    return this.getReport()
  }

  _collect() {
    const cpus = os.cpus()
    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const loadAvg = os.loadavg()

    // CPU 使用率计算
    const cpuUsage = this._calcCpuUsage()

    // 网络带宽
    const netInfo = this._getNetworkInfo()
    const now = Date.now()
    const elapsed = (now - this.networkStats.prevTime) / 1000
    const netBandwidth = {
      rxRate: Math.round((netInfo.rxBytes - this.networkStats.prevRx) / elapsed),
      txRate: Math.round((netInfo.txBytes - this.networkStats.prevTx) / elapsed),
      rxTotal: netInfo.rxBytes,
      txTotal: netInfo.txBytes
    }
    this.networkStats.prevRx = netInfo.rxBytes
    this.networkStats.prevTx = netInfo.txBytes
    this.networkStats.prevTime = now

    return {
      timestamp: Date.now(),
      elapsed: Math.round((Date.now() - this.startTime) / 1000),
      cpu: {
        usage: cpuUsage,
        loadAvg1: loadAvg[0],
        loadAvg5: loadAvg[1],
        loadAvg15: loadAvg[2],
        cores: cpus.length
      },
      memory: {
        total: totalMem,
        free: freeMem,
        used: totalMem - freeMem,
        usagePercent: Math.round(((totalMem - freeMem) / totalMem) * 100)
      },
      network: netBandwidth,
      os: {
        uptime: os.uptime(),
        platform: os.platform(),
        hostname: os.hostname()
      }
    }
  }

  _calcCpuUsage() {
    const cpus = os.cpus()
    let totalIdle = 0
    let totalTick = 0

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type]
      }
      totalIdle += cpu.times.idle
    })

    return Math.round(((totalTick - totalIdle) / totalTick) * 100)
  }

  _getNetworkInfo() {
    let rxBytes = 0
    let txBytes = 0
    try {
      const interfaces = os.networkInterfaces()
      for (const name in interfaces) {
        // 跳过回环地址
        if (name === 'Loopback Pseudo-Interface 1' || name === 'lo') continue
        for (const iface of interfaces[name]) {
          if (!iface.internal) {
            rxBytes += iface.rx_bytes || 0
            txBytes += iface.tx_bytes || 0
          }
        }
      }
    } catch (e) {
      // Windows 上 os.networkInterfaces 可能没有 rx_bytes
    }
    return { rxBytes, txBytes }
  }

  getReport() {
    if (this.samples.length === 0) return null

    const cpuUsages = this.samples.map(s => s.cpu.usage)
    const memUsages = this.samples.map(s => s.memory.usagePercent)

    return {
      duration: this.samples[this.samples.length - 1]?.elapsed || 0,
      sampleCount: this.samples.length,
      cpu: {
        avg: Math.round(cpuUsages.reduce((a, b) => a + b, 0) / cpuUsages.length),
        max: Math.max(...cpuUsages),
        min: Math.min(...cpuUsages),
        p95: this._percentile(cpuUsages, 95),
        p99: this._percentile(cpuUsages, 99)
      },
      memory: {
        avg: Math.round(memUsages.reduce((a, b) => a + b, 0) / memUsages.length),
        max: Math.max(...memUsages),
        min: Math.min(...memUsages),
        totalGB: Math.round(os.totalmem() / 1024 / 1024 / 1024 * 100) / 100
      },
      samples: this.samples
    }
  }

  _percentile(arr, p) {
    const sorted = [...arr].sort((a, b) => a - b)
    const idx = Math.ceil(sorted.length * p / 100) - 1
    return sorted[Math.max(0, idx)]
  }
}

module.exports = ServerMonitor
