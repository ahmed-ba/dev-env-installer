import { spawn, ChildProcess } from 'node:child_process';
import { BrowserWindow } from 'electron';
import { promisify } from 'node:util';
import { exec as execCallback } from 'node:child_process';
import treeKill from 'tree-kill';
import { getDetector, PACKAGE_DETECTION_CONFIGS } from './detection';

const execAsync = promisify(execCallback);

// Initialize detector with package configs
const detector = getDetector();
detector.setPackageConfigs(PACKAGE_DETECTION_CONFIGS);

export type BrewCommandType = 'install' | 'uninstall' | 'search' | 'info' | 'list' | 'version';

export interface BrewCommandOptions {
  type: BrewCommandType;
  packageName?: string;
  isCask?: boolean;
  onProgress?: (data: string) => void;
  onError?: (data: string) => void;
}

export interface BrewCommandResult {
  success: boolean;
  exitCode: number | null;
  output: string;
  error?: string;
}

export type InstallationStatus = 'idle' | 'downloading' | 'installing' | 'completed' | 'failed' | 'cancelled';

export interface InstallationProgress {
  id: string;
  status: InstallationStatus;
  progress?: number;
  message?: string;
}

export type ErrorType = 'network' | 'permission' | 'notfound' | 'unknown';

export interface ErrorInfo {
  type: ErrorType;
  message: string;
  retryable: boolean;
}

export class BrewCommandExecutor {
  private static readonly BREW_PATHS = ['/opt/homebrew/bin/brew', '/usr/local/bin/brew'];
  
  // 追踪正在运行的进程，用于取消操作
  private static runningProcesses: Map<string, ChildProcess> = new Map();

  /**
   * Get the full path to brew executable
   * This is necessary because Electron apps don't have the full PATH
   */
  private static getBrewPath(): string {
    const { existsSync } = require('node:fs');
    for (const path of this.BREW_PATHS) {
      if (existsSync(path)) {
        return path;
      }
    }
    // Fallback to 'brew' and hope PATH is set
    return 'brew';
  }

  static async execute(
    window: BrowserWindow,
    options: BrewCommandOptions,
    packageId: string = 'unknown'
  ): Promise<BrewCommandResult> {
    const { type, packageName, isCask, onProgress, onError } = options;

    const commandParts = this.buildCommand(type, packageName, isCask);
    const brewPath = this.getBrewPath();

    // 发送初始进度状态
    const isUninstall = type === 'uninstall';
    window.webContents.send('installation:progress', {
      id: packageId,
      status: isUninstall ? 'installing' : 'downloading',
      progress: 0,
      message: isUninstall ? '开始卸载...' : '开始安装...'
    });

    return new Promise((resolve) => {
      // Build full command with brew path
      const fullCommand = [brewPath, ...commandParts.slice(1)].join(' ');

      const child = spawn(fullCommand, [], {
        shell: true,
        env: {
          ...process.env,
          FORCE_COLOR: 'true',
          HOMEBREW_NO_AUTO_UPDATE: '1',
          // Ensure PATH includes common locations
          PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH || ''}`
        },
        stdio: ['ignore', 'pipe', 'pipe']
      });

      // 保存进程引用以支持取消操作
      this.runningProcesses.set(packageId, child);

      let outputBuffer = '';
      let errorBuffer = '';

      child.stdout.on('data', (data) => {
        const text = data.toString();
        outputBuffer += text;

        window.webContents.send('installation:log', {
          id: packageId,
          text,
          type: 'stdout',
          timestamp: Date.now()
        });

        const progress = this.parseProgress(text, packageId);
        if (progress) {
          window.webContents.send('installation:progress', progress);
        }

        if (onProgress) onProgress(text);
      });

      child.stderr.on('data', (data) => {
        const text = data.toString();
        errorBuffer += text;

        window.webContents.send('installation:log', {
          id: packageId,
          text,
          type: 'stderr',
          timestamp: Date.now()
        });

        if (text.toLowerCase().includes('error')) {
          window.webContents.send('installation:progress', {
            id: packageId,
            status: 'failed',
            message: text.trim().split('\n')[0]
          });
        }

        if (onError) onError(text);
      });

      child.on('close', (code: number | null) => {
        // 清理进程引用
        this.runningProcesses.delete(packageId);
        
        const success = code === 0;
        const isUninstallOp = type === 'uninstall';

        // 如果有错误信息，解析并发送友好提示
        if (!success && errorBuffer) {
          const errorInfo = this.parseError(errorBuffer);
          window.webContents.send('installation:error', {
            id: packageId,
            ...errorInfo
          });
        }

        window.webContents.send('installation:progress', {
          id: packageId,
          status: success ? 'completed' : 'failed',
          progress: success ? 100 : 0,
          message: success
            ? (isUninstallOp ? '卸载完成' : '安装完成')
            : (isUninstallOp ? '卸载失败' : '安装失败')
        });

        resolve({
          success,
          exitCode: code,
          output: outputBuffer,
          error: errorBuffer || undefined
        });
      });

      child.on('error', (err: Error) => {
        window.webContents.send('installation:log', {
          id: packageId,
          text: `Command Error: ${err.message}`,
          type: 'stderr',
          timestamp: Date.now()
        });

        window.webContents.send('installation:progress', {
          id: packageId,
          status: 'failed',
          message: err.message
        });

        resolve({
          success: false,
          exitCode: -1,
          output: '',
          error: err.message
        });
      });
    });
  }

  static parseProgress(text: string, packageId: string): InstallationProgress | null {
    const lowerText = text.toLowerCase();

    // 卸载状态
    if (lowerText.includes('uninstalling') || lowerText.includes('removing')) {
      return {
        id: packageId,
        status: 'installing', // 使用 installing 状态表示进行中
        progress: 50,
        message: '卸载中...'
      };
    }

    if (lowerText.includes('unlinking')) {
      return {
        id: packageId,
        status: 'installing',
        progress: 75,
        message: '解除链接中...'
      };
    }

    // 下载状态
    if (lowerText.includes('downloading') || lowerText.includes('fetching')) {
      const percentMatch = text.match(/(\d+)%/);
      return {
        id: packageId,
        status: 'downloading',
        progress: percentMatch ? parseInt(percentMatch[1]) : undefined,
        message: '下载中...'
      };
    }

    // 安装状态
    if (lowerText.includes('installing') || lowerText.includes('pouring') || lowerText.includes('pour')) {
      return {
        id: packageId,
        status: 'installing',
        progress: 50,
        message: '安装中...'
      };
    }

    if (lowerText.includes('unpacking') || lowerText.includes('extracting')) {
      return {
        id: packageId,
        status: 'installing',
        progress: 75,
        message: '解压中...'
      };
    }

    if (lowerText.includes('linking') || lowerText.includes('symlinking')) {
      return {
        id: packageId,
        status: 'installing',
        progress: 90,
        message: '链接中...'
      };
    }

    return null;
  }

  /**
   * 解析错误信息，提取友好的用户提示
   */
  static parseError(stderr: string): ErrorInfo {
    const lowerStderr = stderr.toLowerCase();
    
    // 网络超时错误
    if (lowerStderr.includes('etimedout') || lowerStderr.includes('fetch failed') || 
        lowerStderr.includes('connection timed out') || lowerStderr.includes('network is unreachable')) {
      return { 
        type: 'network', 
        message: '网络连接超时，请尝试切换镜像源或检查网络连接', 
        retryable: true 
      };
    }
    
    // 权限不足错误
    if (lowerStderr.includes('permission denied') || lowerStderr.includes('operation not permitted') ||
        lowerStderr.includes('access denied')) {
      return { 
        type: 'permission', 
        message: '权限不足，请尝试以管理员身份运行或检查 sudo 密码', 
        retryable: false 
      };
    }
    
    // 资源不存在错误
    if (lowerStderr.includes('404') || lowerStderr.includes('not found') || 
        lowerStderr.includes('no such file') || lowerStderr.includes('no available formula')) {
      return { 
        type: 'notfound', 
        message: '资源不存在，可能已从源中移除或名称有误', 
        retryable: false 
      };
    }
    
    // 未知错误，取第一行作为消息
    return { 
      type: 'unknown', 
      message: stderr.split('\n')[0].trim() || '安装过程中发生未知错误', 
      retryable: true 
    };
  }

  /**
   * 取消正在运行的安装/卸载进程
   * 使用 tree-kill 确保彻底终止子进程树（包括 brew 启动的 git 等子进程）
   */
  static async cancelProcess(packageId: string): Promise<boolean> {
    const child = this.runningProcesses.get(packageId);
    if (!child || !child.pid) {
      return false;
    }

    return new Promise((resolve) => {
      treeKill(child.pid!, 'SIGKILL', (err) => {
        this.runningProcesses.delete(packageId);
        if (err) {
          console.error(`取消进程 ${packageId} 失败:`, err);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  /**
   * 检查是否有进程正在运行
   */
  static isProcessRunning(packageId: string): boolean {
    return this.runningProcesses.has(packageId);
  }

  static async install(
    window: BrowserWindow,
    packageName: string,
    isCask: boolean = false,
    packageId: string = packageName
  ): Promise<BrewCommandResult> {
    return this.execute(window, {
      type: 'install',
      packageName,
      isCask
    }, packageId);
  }

  static async uninstall(
    window: BrowserWindow,
    packageName: string,
    isCask: boolean = false,
    packageId: string = packageName
  ): Promise<BrewCommandResult> {
    return this.execute(window, {
      type: 'uninstall',
      packageName,
      isCask
    }, packageId);
  }

  static async search(
    window: BrowserWindow,
    keyword: string,
    isCask: boolean = false,
    packageId: string = 'search'
  ): Promise<BrewCommandResult> {
    return this.execute(window, {
      type: 'search',
      packageName: keyword,
      isCask
    }, packageId);
  }

  static async info(
    window: BrowserWindow,
    packageName: string,
    isCask: boolean = false,
    packageId: string = packageName
  ): Promise<BrewCommandResult> {
    return this.execute(window, {
      type: 'info',
      packageName,
      isCask
    }, packageId);
  }

  static async list(
    window: BrowserWindow,
    isCask: boolean = false,
    packageId: string = 'list'
  ): Promise<BrewCommandResult> {
    return this.execute(window, {
      type: 'list',
      isCask
    }, packageId);
  }

  static async checkInstalled(packageName: string, isCask: boolean = false): Promise<boolean> {
    try {
      // Use the new multi-strategy detector
      const result = await detector.detect(packageName);
      return result.installed;
    } catch {
      return false;
    }
  }

  static async getInstalledVersion(packageName: string, isCask: boolean = false): Promise<string | null> {
    try {
      // Use the new multi-strategy detector
      const result = await detector.detect(packageName);
      if (result.installed && result.version) {
        return result.version;
      }

      // Fallback to brew info if detector didn't get version
      const brewPath = this.getBrewPath();
      const cmd = isCask
        ? `"${brewPath}" info --cask --json=v2 ${packageName}`
        : `"${brewPath}" info --json=v2 ${packageName}`;
      const { stdout } = await execAsync(cmd, {
        env: {
          ...process.env,
          PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH || ''}`
        }
      });
      const data = JSON.parse(stdout);

      if (isCask && data.casks && data.casks[0]) {
        return data.casks[0].version || null;
      } else if (!isCask && data.formulae && data.formulae[0]) {
        return data.formulae[0].versions?.stable || data.formulae[0].version || null;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Invalidate detection cache for a package (call after install/uninstall)
   */
  static invalidateCache(packageName: string): void {
    detector.invalidateCache(packageName);
  }

  static async searchPackages(keyword: string, isCask: boolean = false): Promise<string[]> {
    try {
      const brewPath = this.getBrewPath();
      const cmd = isCask
        ? `"${brewPath}" search --cask ${keyword}`
        : `"${brewPath}" search ${keyword}`;
      const { stdout } = await execAsync(cmd, {
        env: {
          ...process.env,
          PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH || ''}`
        }
      });

      const lines = stdout.trim().split('\n');
      const packages: string[] = [];

      for (const line of lines) {
        if (line.includes('==>')) continue;
        const items = line.split(/\s+/).filter(Boolean);
        packages.push(...items);
      }

      return [...new Set(packages)];
    } catch {
      return [];
    }
  }

  static async getPackageInfo(packageName: string, isCask: boolean = false): Promise<any> {
    try {
      const brewPath = this.getBrewPath();
      const cmd = isCask
        ? `"${brewPath}" info --cask --json=v2 ${packageName}`
        : `"${brewPath}" info --json=v2 ${packageName}`;
      const { stdout } = await execAsync(cmd, {
        env: {
          ...process.env,
          PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH || ''}`
        }
      });
      const data = JSON.parse(stdout);

      if (isCask && data.casks && data.casks[0]) {
        return {
          name: data.casks[0].token,
          description: data.casks[0].desc || 'No description',
          version: data.casks[0].version,
          homepage: data.casks[0].homepage,
          isCask: true
        };
      } else if (!isCask && data.formulae && data.formulae[0]) {
        return {
          name: data.formulae[0].name,
          description: data.formulae[0].desc || 'No description',
          version: data.formulae[0].versions?.stable || data.formulae[0].version,
          homepage: data.formulae[0].homepage,
          isCask: false
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  static async getBrewVersion(): Promise<string | null> {
    try {
      // Use full path to brew to avoid PATH issues in Electron
      const brewPaths = ['/opt/homebrew/bin/brew', '/usr/local/bin/brew'];
      for (const brewPath of brewPaths) {
        try {
          const { stdout } = await execAsync(`"${brewPath}" --version`);
          return stdout.split('\n')[0].trim();
        } catch {
          continue;
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  static async isBrewInstalled(): Promise<boolean> {
    try {
      // Check for brew at known paths instead of relying on PATH
      const { existsSync } = require('node:fs');
      for (const path of this.BREW_PATHS) {
        if (existsSync(path)) {
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  private static buildCommand(type: BrewCommandType, packageName?: string, isCask?: boolean): string[] {
    const parts: string[] = ['brew']; // This will be replaced with full path in execute()

    switch (type) {
      case 'install':
        parts.push('install');
        if (isCask) parts.push('--cask');
        if (packageName) parts.push(packageName);
        break;

      case 'uninstall':
        parts.push('uninstall');
        if (isCask) parts.push('--cask');
        if (packageName) parts.push(packageName);
        break;

      case 'search':
        parts.push('search');
        if (isCask) parts.push('--cask');
        if (packageName) parts.push(packageName);
        break;

      case 'info':
        parts.push('info');
        if (isCask) parts.push('--cask');
        if (packageName) parts.push(packageName);
        break;

      case 'list':
        parts.push('list');
        if (isCask) parts.push('--cask');
        break;

      case 'version':
        parts.push('--version');
        break;
    }

    return parts;
  }
}
