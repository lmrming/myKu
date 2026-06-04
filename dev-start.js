#!/usr/bin/env node

/**
 * 开发环境自动化启动脚本
 * 功能：自动启动前端和后端服务，支持跨平台运行
 * 
 * 使用方法：
 *   node dev-start.js              # 使用默认配置
 *   node dev-start.js --config     # 显示当前配置
 *   node dev-start.js --help       # 显示帮助信息
 */

import { spawn, spawn as spawnSync, execFile, exec } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 颜色代码（跨平台支持）
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// 日志工具类
class Logger {
  constructor(useColors = true, level = 'info') {
    this.useColors = useColors && process.stdout.isTTY;
    this.level = level;
    this.levels = { verbose: 0, info: 1, error: 2 };
  }

  colorize(text, color) {
    if (!this.useColors) return text;
    return `${colors[color] || ''}${text}${colors.reset}`;
  }

  log(level, message, data = null) {
    if (this.levels[level] < this.levels[this.level]) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      verbose: this.colorize(' [VERB]', 'dim'),
      info: this.colorize(' [INFO]', 'cyan'),
      error: this.colorize(' [ERR ]', 'red')
    };

    console.log(`${this.colorize(timestamp, 'dim')}${prefix[level]} ${message}`);
    
    if (data && this.level === 'verbose') {
      console.log(this.colorize(`       ${JSON.stringify(data, null, 2)}`, 'dim'));
    }
  }

  verbose(message, data) { this.log('verbose', message, data); }
  info(message, data) { this.log('info', message, data); }
  error(message, data) { this.log('error', message, data); }
  
  success(message) {
    this.info(this.colorize(`✓ ${message}`, 'green'));
  }
  
  warning(message) {
    this.info(this.colorize(`⚠ ${message}`, 'yellow'));
  }
  
  fail(message) {
    this.error(this.colorize(`✗ ${message}`, 'red'));
  }

  header(title) {
    const line = '═'.repeat(60);
    console.log('\n' + this.colorize(line, 'cyan'));
    console.log(this.colorize(`  ${title}`, 'bright'));
    console.log(this.colorize(line, 'cyan') + '\n');
  }

  section(title) {
    console.log('\n' + this.colorize(`▶ ${title}`, 'yellow'));
  }
}

// 进程管理器类
class ProcessManager {
  constructor(logger, config) {
    this.logger = logger;
    this.config = config;
    this.processes = {};
    this.cleanupInProgress = false;
  }

  // 检查端口是否在监听
  async checkPort(port, maxAttempts = 10, interval = 500) {
    const net = await import('net');
    
    for (let i = 0; i < maxAttempts; i++) {
      // 尝试 IPv4 和 IPv6
      const hosts = ['127.0.0.1', '::1'];
      
      for (const host of hosts) {
        const isAvailable = await new Promise((resolve) => {
          const socket = new net.default.Socket();
          const timeout = setTimeout(() => {
            destroySocket();
            resolve(false);
          }, 200);

          const destroySocket = () => {
            clearTimeout(timeout);
            socket.destroy();
          };

          socket.once('connect', () => {
            destroySocket();
            resolve(true);
          });

          socket.once('error', () => {
            destroySocket();
            resolve(false);
          });

          socket.connect(port, host);
        });

        if (isAvailable) {
          return true;
        }
      }

      await this.sleep(interval);
    }

    return false;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 启动进程
  async start(name, options) {
    this.logger.verbose(`正在启动 ${name}...`, options);
    
    const cwd = resolve(__dirname, options.cwd || '.');
    
    // Windows 特殊处理：使用 cmd.exe
    let command, args;
    if (process.platform === 'win32' && options.command === 'npm') {
      command = 'cmd.exe';
      args = ['/c', options.command, ...options.args];
    } else {
      command = options.command;
      args = options.args || [];
    }

    this.logger.verbose(`执行命令: ${command} ${args.join(' ')}`, { cwd });

    // 使用 detached 模式启动子进程
    const childProcess = spawn(command, args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
      env: { ...process.env },
      detached: true,  // 让子进程独立于父进程
      windowsHide: true
    });

    // 取消父进程与子进程的引用，让子进程完全独立
    childProcess.unref();

    let output = '';
    let errorOutput = '';

    // 监听 stdout（用于日志记录）
    childProcess.stdout?.on('data', (data) => {
      const text = data.toString();
      output += text;
      
      const lines = text.split('\n').filter(line => line.trim());
      lines.forEach(line => {
        this.logger.verbose(`  [${name}] ${line.trim()}`);
      });
    });

    // 监听 stderr
    childProcess.stderr?.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      
      const lines = text.split('\n').filter(line => line.trim());
      lines.forEach(line => {
        this.logger.warning(`  [${name}] ${line.trim()}`);
      });
    });

    // 存储进程引用
    this.processes[name] = childProcess;

    // 通过端口检测来确认服务启动成功
    if (options.port) {
      this.logger.verbose(`等待端口 ${options.port} 就绪...`);
      
      const isReady = await this.checkPort(
        options.port,
        Math.ceil((options.timeout || 15000) / 500),
        500
      );

      if (!isReady) {
        delete this.processes[name];
        throw new Error(`${name} 启动超时 (${options.timeout}ms)，端口 ${options.port} 未监听`);
      }
    } else {
      // 如果没有配置端口，等待一段时间后认为成功
      await this.sleep(2000);
    }

    return { process, output };
  }

  // 停止所有进程
  async stopAll() {
    if (this.cleanupInProgress) return;
    this.cleanupInProgress = true;

    this.logger.section('正在停止所有服务...');

    if (this.redisInstaller) {
      try {
        await this.redisInstaller.stop();
      } catch (err) {
        this.logger.warning(`停止 Redis 失败: ${err.message}`);
      }
    }
    
    const names = Object.keys(this.processes);
    
    for (const name of names) {
      const process = this.processes[name];
      if (process && !process.killed) {
        try {
          this.logger.verbose(`正在停止 ${name}...`);
          
          // 优雅关闭（Windows 兼容）
          if (process.platform === 'win32') {
            spawnSync('taskkill', ['/pid', process.pid, '/f', '/t'], {
              shell: true,
              stdio: 'ignore'
            });
          } else {
            process.kill('SIGTERM');
          }
          
          this.logger.success(`${name} 已停止`);
        } catch (err) {
          this.logger.fail(`停止 ${name} 失败: ${err.message}`);
        }
      }
    }

    this.processes = {};
    this.logger.success('所有服务已停止\n');
    
    // 退出主进程
    setTimeout(() => process.exit(0), 500);
  }

  // 获取进程状态
  getStatus() {
    return {
      running: Object.keys(this.processes),
      count: Object.keys(this.processes).length
    };
  }
}

// ============================================
// Redis 安装检测与自动启动管理器
// ============================================

class RedisInstaller {
  constructor(logger, config) {
    this.logger = logger;
    this.config = config?.redis;
    this.process = null;
    this.startMethod = null;
    this.platform = process.platform;
  }

  // ------------------------------------------
  // 1. 安装状态检测（跨平台）
  // ------------------------------------------

  async detectInstallation() {
    const results = {
      docker: await this._checkDocker(),
      native: await this._checkNativeRedis(),
      platform: this.platform
    };

    this.logger.verbose('Redis 安装检测结果:', results);
    return results;
  }

  async _checkDocker() {
    return new Promise((resolve) => {
      const cmd = this.platform === 'win32' ? 'docker.exe' : 'docker';
      execFile(cmd, ['--version'], { timeout: 5000 }, (err, stdout) => {
        if (err) {
          this.logger.verbose(`Docker 未安装或未运行: ${err.message}`);
          resolve({ available: false, version: null, error: err.message });
          return;
        }
        const versionMatch = stdout.match(/version\s+([\d.]+)/i);
        const version = versionMatch ? versionMatch[1] : 'unknown';

        execFile(cmd, ['compose', 'version'], { timeout: 5000 }, (err2, stdout2) => {
          const composeAvailable = !err2;
          const composeVersion = composeAvailable
            ? (stdout2.match(/v?([\d.]+)/)?.[1] || 'unknown')
            : null;

          resolve({
            available: true,
            version,
            composeAvailable,
            composeVersion
          });
        });
      });
    });
  }

  async _checkNativeRedis() {
    const candidates = this._getRedisBinaries();

    for (const binary of candidates) {
      try {
        const result = await this._execCommand(binary, ['--version']);
        if (result.code === 0 && result.stdout) {
          const versionMatch = result.stdout.match(/v=([\d.]+)/i);
          return {
            available: true,
            binary,
            path: binary,
            version: versionMatch ? versionMatch[1] : 'unknown'
          };
        }
      } catch {
        continue;
      }
    }

    return { available: false, binary: null, path: null, version: null };
  }

  _getRedisBinaries() {
    switch (this.platform) {
      case 'win32':
        return [
          'redis-server',
          'redis-server.exe',
          'C:\\Program Files\\Redis\\redis-server.exe',
          `${process.env.LOCALAPPDATA}\\Redis\\redis-server.exe`,
          `${process.env.ProgramFiles}\\Redis\\redis-server.exe`
        ].filter(Boolean);

      case 'darwin':
        return [
          '/opt/homebrew/bin/redis-server',
          '/usr/local/bin/redis-server',
          '/usr/bin/redis-server',
          'redis-server'
        ];

      default:
        return [
          '/usr/bin/redis-server',
          '/usr/local/bin/redis-server',
          'redis-server'
        ];
    }
  }

  _execCommand(command, args) {
    return new Promise((resolve, reject) => {
      execFile(command, args, { timeout: 5000 }, (err, stdout, stderr) => {
        if (err) {
          reject({ code: err.code || 1, error: err.message, stdout, stderr });
          return;
        }
        resolve({ code: 0, stdout, stderr });
      }).on('error', (err) => {
        reject({ code: -1, error: err.message, stdout: '', stderr: '' });
      });
    });
  }

  // ------------------------------------------
  // 2. 检查 Redis 是否已在运行
  // ------------------------------------------

  async isRunning(port) {
    port = port || this.config?.port || 6379;

    try {
      const net = await import('net');
      const isListening = await new Promise((resolve) => {
        const socket = new net.default.Socket();
        const timer = setTimeout(() => { socket.destroy(); resolve(false); }, 1500);
        socket.once('connect', () => { clearTimeout(timer); socket.destroy(); resolve(true); });
        socket.once('error', () => { clearTimeout(timer); resolve(false); });
        socket.connect(port, '127.0.0.1');
      });

      if (isListening) {
        this.logger.info(`端口 ${port} 已有服务在监听，Redis 可能已运行`);
      }

      return isListening;
    } catch {
      return false;
    }
  }

  // ------------------------------------------
  // 3. 选择启动方式并启动 Redis
  // ------------------------------------------

  async start() {
    if (!this.config?.enabled) {
      this.logger.info('Redis 自动启动已禁用（配置中 redis.enabled = false）');
      return { started: false, reason: 'disabled' };
    }

    this.logger.section('步骤 0/3: 检测并启动 Redis 服务');

    const port = this.config.port || 6379;

    const alreadyRunning = await this.isRunning(port);
    if (alreadyRunning) {
      this.logger.success(`Redis 已在端口 ${port} 上运行`);
      return { started: true, method: 'already-running', port };
    }

    const detection = await this.detectInstallation();

    const preference = this.config.startPreference || ['docker', 'native'];

    for (const method of preference) {
      if (method === 'docker' && detection.docker.available) {
        try {
          const result = await this._startViaDocker(detection);
          if (result.started) {
            this.startMethod = 'docker';
            return result;
          }
        } catch (err) {
          this.logger.warning(`Docker 启动失败: ${err.message}，尝试下一种方式...`);
        }
      }

      if (method === 'native' && detection.native.available) {
        try {
          const result = await this._startViaNative(detection.native);
          if (result.started) {
            this.startMethod = 'native';
            return result;
          }
        } catch (err) {
          this.logger.warning(`原生 Redis 启动失败: ${err.message}，尝试下一种方式...`);
        }
      }
    }

    throw this._buildStartupError(detection);
  }

  _startViaDocker(detection) {
    return new Promise((resolve, reject) => {
      const port = this.config.port || 6379;
      const composeFile = this.config.dockerComposeFile || 'docker-compose.redis.yml';
      const composePath = resolve(__dirname, composeFile);

      if (!existsSync(composePath)) {
        reject(new Error(`Docker Compose 文件不存在: ${composePath}`));
        return;
      }

      this.logger.verbose(`使用 Docker Compose 启动 Redis...`);
      this.logger.verbose(`  Compose 文件: ${composePath}`);
      this.logger.verbose(`  Docker 版本: ${detection.docker.version}`);
      if (detection.docker.composeVersion) {
        this.logger.verbose(`  Compose 版本: v${detection.docker.composeVersion}`);
      }

      const cmd = this.platform === 'win32' ? 'docker-compose.exe' : 'docker-compose';
      const args = ['-f', composePath, 'up', '-d'];

      this.logger.info(`执行: ${cmd} ${args.join(' ')}`);

      const child = spawn(cmd, args, {
        cwd: __dirname,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: this.platform === 'win32',
        windowsHide: true
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        const text = data.toString();
        stdout += text;
        text.split('\n').filter(l => l.trim()).forEach(l => this.logger.verbose(`  [docker] ${l.trim()}`));
      });

      child.stderr.on('data', (data) => {
        const text = data.toString();
        stderr += text;
        text.split('\n').filter(l => l.trim()).forEach(l => this.logger.warning(`  [docker] ${l.trim()}`));
      });

      child.on('error', (err) => {
        reject(new Error(`无法执行 Docker Compose: ${err.message}`));
      });

      child.on('close', async (code) => {
        if (code !== 0) {
          reject(new Error(`Docker Compose 退出码 ${code}: ${(stderr || stdout).trim()}`));
          return;
        }

        this.logger.verbose('Docker Compose 执行成功，等待 Redis 端口就绪...');

        const ready = await this._waitForPort(port, this.config.timeout || 10000);
        if (!ready) {
          reject(new Error(`Redis 容器已创建但端口 ${port} 未在超时时间内就绪`));
          return;
        }

        this.process = child;
        resolve({ started: true, method: 'docker', port, composeFile });
      });
    });
  }

  _startViaNative(nativeInfo) {
    return new Promise((resolve, reject) => {
      const port = this.config.port || 6379;
      const configFile = this.config.configFile || 'redis.conf';
      const configPath = resolve(__dirname, configFile);

      const binary = nativeInfo.binary;
      const args = existsSync(configPath)
        ? [configPath]
        : [];

      this.logger.verbose(`使用原生 redis-server 启动 Redis...`);
      this.logger.verbose(`  二进制路径: ${binary}`);
      this.logger.verbose(`  版本: ${nativeInfo.version || 'unknown'}`);
      if (existsSync(configPath)) {
        this.logger.verbose(`  配置文件: ${configPath}`);
      } else {
        this.logger.warning(`  配置文件不存在 (${configPath})，将使用默认配置`);
      }

      this.logger.info(`执行: ${binary} ${args.join(' ')}`);

      const child = spawn(binary, args, {
        cwd: __dirname,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: this.platform === 'win32',
        detached: true,
        windowsHide: true
      });

      child.unref();

      let stdout = '';
      let stderr = '';
      let readyDetected = false;

      child.stdout.on('data', (data) => {
        const text = data.toString();
        stdout += text;
        text.split('\n').filter(l => l.trim()).forEach(l => this.logger.verbose(`  [redis] ${l.trim()}`));

        if (text.includes('Ready to accept connections') || text.includes('ready to accept')) {
          readyDetected = true;
        }
      });

      child.stderr.on('data', (data) => {
        const text = data.toString();
        stderr += text;
        text.split('\n').filter(l => l.trim()).forEach(l => this.logger.warning(`  [redis] ${l.trim()}`));
      });

      child.on('error', (err) => {
        reject(new Error(`无法启动 redis-server: ${err.message}`));
      });

      child.on('close', (code) => {
        if (code !== 0 && !readyDetected) {
          reject(new Error(`redis-server 异常退出 (code=${code}): ${(stderr || stdout).trim()}`));
        }
      });

      (async () => {
        const timeout = this.config.timeout || 10000;
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
          if (readyDetected) break;
          const portReady = await this._isPortOpen(port);
          if (portReady) break;
          await this._sleep(500);
        }

        const finalReady = await this._waitForPort(port, 3000);
        if (!finalReady) {
          try { child.kill(); } catch {}
          reject(new Error(`redis-server 启动后端口 ${port} 未在 ${timeout}ms 内就绪`));
          return;
        }

        this.process = child;
        resolve({ started: true, method: 'native', port, binary });
      })();
    });
  }

  // ------------------------------------------
  // 4. 停止 Redis
  // ------------------------------------------

  async stop() {
    if (this.startMethod === 'docker') {
      await this._stopDocker();
    } else if (this.startMethod === 'native') {
      await this._stopNative();
    }
    this.process = null;
    this.startMethod = null;
  }

  async _stopDocker() {
    const composeFile = this.config.dockerComposeFile || 'docker-compose.redis.yml';
    const composePath = resolve(__dirname, composeFile);
    const cmd = this.platform === 'win32' ? 'docker-compose.exe' : 'docker-compose';

    return new Promise((resolve) => {
      this.logger.verbose('正在停止 Docker Redis 容器...');
      const child = spawn(cmd, ['-f', composePath, 'down'], {
        cwd: __dirname,
        stdio: 'ignore',
        shell: this.platform === 'win32',
        windowsHide: true
      });

      child.on('close', (code) => {
        if (code === 0) {
          this.logger.success('Docker Redis 容器已停止');
        } else {
          this.logger.warning(`Docker Compose down 退出码: ${code}`);
        }
        resolve();
      });

      child.on('error', () => resolve());
    });
  }

  async _stopNative() {
    if (this.process && !this.process.killed) {
      try {
        if (this.platform === 'win32') {
          spawnSync('taskkill', ['/pid', this.process.pid, '/f', '/t'], {
            shell: true, stdio: 'ignore'
          });
        } else {
          this.process.kill('SIGTERM');
        }
        this.logger.success('原生 Redis 进程已停止');
      } catch (err) {
        this.logger.warning(`停止 Redis 进程失败: ${err.message}`);
      }
    }
  }

  // ------------------------------------------
  // 5. 健康检查与确认
  // ------------------------------------------

  async healthCheck(port) {
    port = port || this.config?.port || 6379;

    try {
      const net = await import('net');
      const result = await new Promise((resolve) => {
        const socket = new net.default.Socket();
        const timer = setTimeout(() => { socket.destroy(); resolve({ ok: false, latency: -1 }); }, 3000);
        const start = Date.now();

        socket.once('connect', () => {
          const latency = Date.now() - start;
          clearTimeout(timer);
          socket.destroy();
          resolve({ ok: true, latency });
        });

        socket.once('error', (err) => {
          clearTimeout(timer);
          socket.destroy();
          resolve({ ok: false, latency: -1, error: err.message });
        });

        socket.connect(port, '127.0.0.1');
      });

      if (result.ok) {
        this.logger.success(`Redis 健康检查通过! (延迟: ${result.latency}ms, 端口: ${port})`);
      } else {
        this.logger.fail(`Redis 健康检查失败: ${result.error || '连接被拒绝'}`);
      }

      return result;
    } catch (err) {
      this.logger.fail(`Redis 健康检查异常: ${err.message}`);
      return { ok: false, latency: -1, error: err.message };
    }
  }

  // ------------------------------------------
  // 6. 构建详细错误信息（用于故障排查）
  // ------------------------------------------

  _buildStartupError(detection) {
    const lines = [
      'Redis 启动失败 — 所有启动方式均不可用',
      '',
      '--- 环境诊断 ---',
      `  操作系统: ${this.platform}`,
      '',
      '--- Docker 状态 ---',
      detection.docker.available
        ? `  ✓ Docker 已安装 (v${detection.docker.version})`
        : '  ✗ Docker 未安装或未运行',
      detection.docker.composeAvailable
        ? `  ✓ Docker Compose 可用 (v${detection.docker.composeVersion})`
        : '  ✗ Docker Compose 不可用',
      '',
      '--- 原生 Redis 状态 ---',
      detection.native.available
        ? `  ✓ redis-server 已安装 (${detection.native.path}, v${detection.native.version})`
        : '  ✗ 未找到 redis-server 二进制文件',
      '',
      '--- 排查建议 ---'
    ];

    if (this.platform === 'win32') {
      lines.push(
        '  [Windows] 方案 A — 安装 Docker Desktop:',
        '    1. 访问 https://www.docker.com/products/docker-desktop/',
        '    2. 安装并启动 Docker Desktop',
        '    3. 确保 "docker --version" 和 "docker-compose version" 均可正常执行',
        '',
        '  [Windows] 方案 B — 安装 Memurai/Redis for Windows:',
        '    1. 访问 https://www.memurai.com/get-memurai (推荐, 免费版可用)',
        '    2. 或访问 https://github.com/tporadowski/redis/releases',
        '    3. 安装后将 redis-server 加入 PATH',
        '',
        '  [Windows] 方案 C — 使用 WSL2 + Linux Redis:',
        '    1. 启用 WSL2: wsl --install',
        '    2. 在 WSL 中安装: sudo apt install redis-server',
        '    3. 在 dev.config.js 中设置 redis.enabled = false 并手动在 WSL 中启动'
      );
    } else if (this.platform === 'darwin') {
      lines.push(
        '  [macOS] 方案 A — 使用 Homebrew 安装:',
        '    brew install redis',
        '',
        '  [macOS] 方案 B — 安装 Docker Desktop for Mac:',
        '    1. 访问 https://www.docker.com/products/docker-desktop/',
        '    2. 安装并确保 Docker 正在运行',
        '',
        '  [macOS] 方案 C — 手动启动 Redis (如果已通过 brew 安装):',
        '    brew services start redis'
      );
    } else {
      lines.push(
        '  [Linux] 方案 A — 使用包管理器安装:',
        '    Debian/Ubuntu: sudo apt update && sudo apt install redis-server',
        '    Fedora:       sudo dnf install redis',
        '    Arch Linux:   sudo pacman -S redis',
        '',
        '  [Linux] 方案 B — 安装 Docker:',
        '    curl -fsSL https://get.docker.com | sh',
        '    sudo usermod -aG docker $USER',
        '',
        '  [Linux] 方案 C — 手动启动 systemd 服务:',
        '    sudo systemctl start redis-server'
      );
    }

    lines.push(
      '',
      '  [通用] 如需跳过 Redis 自动启动，可在 dev.config.js 中设置:',
      '    redis.enabled = false',
      '',
      '  [通用] 或手动启动 Redis 后再运行此脚本:'
    );

    if (detection.docker.available && detection.docker.composeAvailable) {
      lines.push('    docker-compose -f docker-compose.redis.yml up -d');
    } else if (detection.native.available) {
      lines.push(`    ${detection.native.binary} redis.conf`);
    }

    return new Error(lines.join('\n'));
  }

  // ------------------------------------------
  // 工具方法
  // ------------------------------------------

  _sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  async _waitForPort(port, timeoutMs) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (await this._isPortOpen(port)) return true;
      await this._sleep(300);
    }
    return false;
  }

  _isPortOpen(port) {
    return new Promise((resolve) => {
      const importNet = async () => {
        const net = await import('net');
        const socket = new net.default.Socket();
        const timer = setTimeout(() => { socket.destroy(); resolve(false); }, 1000);
        socket.once('connect', () => { clearTimeout(timer); socket.destroy(); resolve(true); });
        socket.once('error', () => { clearTimeout(timer); resolve(false); });
        socket.connect(port, '127.0.0.1');
      };
      importNet();
    });
  }
}

// 主应用类
class DevStarter {
  constructor() {
    this.logger = null;
    this.config = null;
    this.processManager = null;
    this.redisInstaller = null;
  }

  // 加载配置
  async loadConfig() {
    const configPath = resolve(__dirname, 'dev.config.js');
    
    // Windows 路径转换为 file:// URL
    const configUrl = process.platform === 'win32'
      ? `file:///${configPath.replace(/\\/g, '/')}`
      : `file://${configPath}`;
    
    if (!existsSync(configPath)) {
      throw new Error(`配置文件不存在: ${configPath}`);
    }

    try {
      const configModule = await import(configUrl);
      this.config = configModule.default || configModule;
      this.logger = new Logger(
        this.config.global?.colors !== false,
        this.config.global?.logLevel || 'info'
      );
      this.processManager = new ProcessManager(this.logger, this.config);
      this.redisInstaller = new RedisInstaller(this.logger, this.config);
      
      this.logger.verbose('配置加载成功', this.config);
      return true;
    } catch (err) {
      throw new Error(`加载配置失败: ${err.message}`);
    }
  }

  // 显示配置
  showConfig() {
    console.log('\n📋 当前开发环境配置:\n');
    console.log(`  前端服务:`);
    console.log(`    - 名称: ${this.config.frontend.name}`);
    console.log(`    - 命令: ${this.config.frontend.command} ${this.config.frontend.args.join(' ')}`);
    console.log(`    - 端口: ${this.config.frontend.port}`);
    console.log(`    - 目录: ${resolve(__dirname, this.config.frontend.cwd)}`);
    console.log(`\n  后端服务:`);
    console.log(`    - 名称: ${this.config.backend.name}`);
    console.log(`    - 命令: ${this.config.backend.command} ${this.config.backend.args.join(' ')}`);
    console.log(`    - 端口: ${this.config.backend.port}`);
    console.log(`    - 延迟: ${this.config.backend.delay}ms`);
    console.log(`    - 目录: ${resolve(__dirname, this.config.backend.cwd)}`);
    console.log(`  全局设置:`);
    console.log(`    - 日志级别: ${this.config.global?.logLevel || 'info'}`);
    console.log(`    - 自动关闭后端: ${this.config.global?.killBackendOnExit !== false ? '是' : '否'}`);
    if (this.config.redis) {
      console.log(`\n  Redis 服务:`);
      console.log(`    - 自动启动: ${this.config.redis.enabled ? '是' : '否'}`);
      console.log(`    - 端口: ${this.config.redis.port}`);
      console.log(`    - 启动优先级: ${this.config.redis.startPreference.join(' > ')}`);
      console.log(`    - Docker Compose: ${this.config.redis.dockerComposeFile}`);
      console.log(`    - 配置文件: ${this.config.redis.configFile}`);
      console.log(`    - 超时时间: ${this.config.redis.timeout}ms`);
    }
    console.log('');
  }

  // 启动 Redis
  async startRedis() {
    try {
      const result = await this.redisInstaller.start();

      if (result.started) {
        const port = this.config.redis.port || 6379;
        const methodLabel = {
          'docker': 'Docker Compose',
          'native': '原生 redis-server',
          'already-running': '已在运行'
        }[result.method] || result.method;

        this.logger.success(`${this.config.redis.name} 就绪!`);
        this.logger.info(`  📍 地址: localhost:${port}`);
        this.logger.info(`  🔧 方式: ${methodLabel}`);

        const health = await this.redisInstaller.healthCheck(port);
        if (!health.ok) {
          this.logger.warning('健康检查未通过，但端口已监听 — Redis 可能需要认证');
        }

        return result;
      } else {
        this.logger.warning(`Redis 未启动: ${result.reason}`);
        return result;
      }
    } catch (err) {
      this.logger.fail(`Redis 启动失败:\n${err.message}`);
      throw err;
    }
  }

  // 启动前端
  async startFrontend() {
    this.logger.section('步骤 1/3: 启动前端服务');
    
    try {
      const result = await this.processManager.start(
        this.config.frontend.name,
        this.config.frontend
      );
      
      this.logger.success(`${this.config.frontend.name} 启动成功!`);
      this.logger.info(`  📍 地址: http://localhost:${this.config.frontend.port}/`);
      this.logger.info(`  ⏱️  耗时: <${this.config.frontend.timeout}ms`);
      
      return result;
    } catch (err) {
      this.logger.fail(`前端启动失败: ${err.message}`);
      this.logger.error('\n可能的原因:');
      this.logger.error('  1. 端口被占用 - 请检查端口 ' + this.config.frontend.port + ' 是否被其他程序占用');
      this.logger.error('  2. 依赖未安装 - 请运行 npm install');
      this.logger.error('  3. 配置错误 - 请检查 dev.config.js 中的 frontend 配置');
      throw err;
    }
  }

  // 启动后端
  async startBackend() {
    // 等待延迟时间
    const delay = this.config.backend.delay || 1000;
    if (delay > 0) {
      this.logger.info(`⏳ 等待 ${delay}ms 后启动后端...`);
      await this.sleep(delay);
    }

    this.logger.section('步骤 2/3: 启动后端服务');

    try {
      const result = await this.processManager.start(
        this.config.backend.name,
        this.config.backend
      );

      this.logger.success(`${this.config.backend.name} 启动成功!`);
      this.logger.info(`  📍 地址: http://localhost:${this.config.backend.port}/`);
      this.logger.info(`  🔗 API:  http://localhost:${this.config.frontend.port}/api/* → :${this.config.backend.port}`);

      return result;
    } catch (err) {
      this.logger.fail(`后端启动失败: ${err.message}`);
      this.logger.error('\n可能的原因:');
      this.logger.error('  1. 数据库未启动 - 请确保 MySQL 服务正在运行');
      this.logger.error('  2. 端口被占用 - 请检查端口 ' + this.config.backend.port + ' 是否被占用');
      this.logger.error('  3. 环境变量缺失 - 请检查 .env 文件是否正确配置');
      this.logger.error('  4. 依赖未安装 - 请运行 npm install');
      throw err;
    }
  }

  // 显示启动完成信息
  showSuccess() {
    const redisPort = this.config.redis?.port || 6379;
    const redisEnabled = this.config.redis?.enabled !== false;

    this.logger.header('🎉 所有服务启动完成!');
    
    console.log(`
  ┌─────────────────────────────────────────────────────┐
  │                                                     │
  ${redisEnabled ? `  ${this.logger.colorize('Redis 服务', 'magenta')}  ${this.logger.colorize('localhost:' + redisPort, 'bright')}               │` : ''}
  │  ${this.logger.colorize('前端服务', 'green')}  ${this.logger.colorize('http://localhost:' + this.config.frontend.port + '/', 'bright')}         │
  │  ${this.logger.colorize('后端服务', 'blue')}  ${this.logger.colorize('http://localhost:' + this.config.backend.port + '/', 'bright')}         │
  │  ${this.logger.colorize('API 代理', 'cyan')}  /api/* → :${this.config.backend.port}               │
  │                                                     │
  └─────────────────────────────────────────────────────┘

  ${this.logger.colorize('快捷键:', 'yellow')}
    ${this.logger.colorize('Ctrl+C', 'bright')}  - 停止所有服务并退出
`);

    if (this.config.global?.killBackendOnExit !== false) {
      this.logger.info('💡 提示: 关闭此窗口将自动停止 Redis、前后端服务');
    }
  }

  // 注册信号处理
  registerSignalHandlers() {
    const cleanup = async () => {
      console.log('\n');
      this.logger.warning('接收到退出信号，正在清理...');
      await this.processManager.stopAll();
    };

    // Windows 支持
    if (process.platform === 'win32') {
      process.on('SIGINT', cleanup);
      process.on('SIGTERM', cleanup);
    } else {
      process.on('SIGINT', cleanup);
      process.on('SIGTERM', cleanup);
      process.on('SIGHUP', cleanup);
    }

    // 未捕获异常处理
    process.on('uncaughtException', async (err) => {
      this.logger.error(`未捕获的异常: ${err.message}`);
      await cleanup();
      process.exit(1);
    });

    process.on('unhandledRejection', async (reason) => {
      this.logger.error(`未处理的 Promise 拒绝: ${reason}`);
    });
  }

  // 工具函数：延迟
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 主入口
  async run(args = []) {
    try {
      // 解析命令行参数
      if (args.includes('--help') || args.includes('-h')) {
        this.showHelp();
        return;
      }

      // 加载配置
      await this.loadConfig();

      // 显示配置
      if (args.includes('--config') || args.includes('-c')) {
        this.showConfig();
        return;
      }

      // 显示欢迎信息
      this.logger.header('🚀 开发环境启动器');

      this.logger.info('操作系统:', process.platform);
      this.logger.info('Node 版本:', process.version);
      this.logger.info('工作目录:', resolve(__dirname));

      // 注册信号处理
      this.registerSignalHandlers();

      // 启动 Redis（步骤 0）
      await this.startRedis();

      // 启动前端
      await this.startFrontend();

      // 启动后端
      await this.startBackend();

      // 显示成功信息
      this.showSuccess();

      // 保持进程运行
      await this.keepAlive();

    } catch (err) {
      console.error('\n❌ 致命错误:', err.message);
      if (this.logger) {
        await this.processManager?.stopAll();
      }
      process.exit(1);
    }
  }

  // 保持进程活跃
  async keepAlive() {
    this.logger.info('\n🔄 服务监控中... (按 Ctrl+C 停止所有服务)\n');
    
    return new Promise((resolve) => {
      // 持续检查子进程状态
      const checkInterval = setInterval(() => {
        const status = this.processManager.getStatus();
        
        if (status.count === 0) {
          this.logger.warning('所有子进程已退出');
          clearInterval(checkInterval);
          resolve();
        }
      }, 2000);

      // 防止 Node.js 进程因无事件而退出
      if (process.stdin.isTTY) {
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
      }

      // 注册清理函数
      this._cleanupInterval = checkInterval;
    });
  }

  // 显示帮助信息
  showHelp() {
    console.log(`
${colors.cyan}╔══════════════════════════════════════════════════════════╗${colors.reset}
${colors.cyan}║           开发环境自动化启动器 - 使用帮助                ║${colors.reset}
${colors.cyan}╚══════════════════════════════════════════════════════════╝${colors.reset}

${colors.bright}用法:${colors.reset}
  node dev-start.js [选项]

${colors.bright}选项:${colors.reset}
  --config, -c    显示当前配置信息
  --help, -h      显示帮助信息

${colors.bright}启动流程 (3 步):${colors.reset}
  步骤 0: 检测并启动 ${colors.magenta}Redis 服务${colors.reset}
           → 自动检测 Docker / 原生 redis-server
           → 跨平台支持 Windows/macOS/Linux
           → 端口就绪验证 + 健康检查确认
  步骤 1: 启动   ${colors.green}前端服务${colors.reset} (Vite)
  步骤 2: 启动   ${colors.blue}后端服务${colors.reset} (Express)

${colors.bright}示例:${colors.reset}
  node dev-start.js              # 使用默认配置启动全部服务
  node dev-start.js --config     # 查看当前配置
  node dev-start.js --help       # 显示帮助

${colors.bright}配置文件:${colors.reset}
  dev.config.js       - 主配置（前端/后端/Redis/全局）
  docker-compose.redis.yml - Redis Docker Compose 配置
  redis.conf           - Redis 服务端配置

${colors.bright}功能特性:${colors.reset}
  ✅ Redis 自动安装检测与启动（Docker / 原生二进制）
  ✅ 跨平台支持 (Windows/macOS/Linux)
  ✅ 自动回退：Docker 失败时尝试原生 Redis
  ✅ 端口就绪检测 + TCP 健康检查确认
  ✅ 详细错误诊断与平台专属排查建议
  ✅ 进程关联管理 (Ctrl+C 同时关闭所有服务)
  ✅ 彩色日志输出（verbose/info/error 三级）
  ✅ 可配置的启动参数

${colors.bright}Redis 启动方式优先级:${colors.reset}
  默认: Docker Compose → 原生 redis-server
  可在 dev.config.js 的 redis.startPreference 中调整

${colors.bright}快捷命令:${colors.reset}
  npm run dev:start             # 通过 package.json 启动
`);
  }
}

// 执行主程序
const starter = new DevStarter();
starter.run(process.argv.slice(2));
