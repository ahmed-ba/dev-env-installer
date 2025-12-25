import { defineStore } from 'pinia';
import type { AppPackage, PackageStatus, SystemInfo, AppSettings, BrewSearchResult } from '../../../main/types/index';

export type MirrorSource = 'official' | 'tsinghua' | 'ustc';

export interface BrewCheckResult {
  installed: boolean;
  path?: string;
  arch: 'arm64' | 'x64';
}

export interface BrewInstallResult {
  success: boolean;
  exitCode: number | null;
  installed: boolean;
  error?: string;
}

// 缓存配置
const CACHE_KEY = 'dev-installer-cache';
const CACHE_TTL = 5 * 60 * 1000; // 5分钟

interface CacheData {
  statuses: Record<string, string>;
  versions: Record<string, string>;
  timestamp: number;
}

// 错误信息接口
export interface ErrorInfo {
  type: 'network' | 'permission' | 'notfound' | 'unknown';
  message: string;
  retryable: boolean;
}

// 缓存读取
function loadFromCache(): CacheData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CacheData;
  } catch {
    return null;
  }
}

// 缓存保存
function saveToCache(statuses: Record<string, string>, versions: Record<string, string>): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      statuses,
      versions,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn('缓存保存失败:', e);
  }
}

// 强制深色模式
function forceeDarkMode(): void {
  document.documentElement.classList.remove('light');
  document.documentElement.classList.add('dark');
}

export const useAppStore = defineStore('app', {
  state: () => ({
    currentPage: 'dashboard',
    marketplace: [] as AppPackage[],
    systemInfo: null as SystemInfo | null,
    statuses: {} as Record<string, PackageStatus>,
    versions: {} as Record<string, string>,
    searchResults: [] as BrewSearchResult[],
    isSearching: false,
    isGlobalInstalling: false,
    settings: null as AppSettings | null,
    // 安装进度状态
    installProgress: {} as Record<string, { status: string; progress?: number; message?: string }>,
    // 错误状态
    errors: {} as Record<string, ErrorInfo>,
    // 初始化状态
    isInitializing: true,
    isInitialized: false,
    // 刷新状态
    isRefreshing: false,
    lastCacheTime: 0,
    // Homebrew 状态
    isBrewInstalled: true, // 默认 true，避免闪烁
    isBrewChecking: true,
    isBrewInstalling: false,
    brewInstallError: null as string | null
  }),

  getters: {
    // 当前镜像源名称
    currentMirrorName(): string {
      const mirror = this.settings?.brewMirror || '';
      if (!mirror) return '官方源';
      if (mirror.includes('tsinghua')) return '清华大学';
      if (mirror.includes('aliyun')) return '阿里云';
      if (mirror.includes('ustc')) return '中科大';
      return '自定义源';
    }
  },

  actions: {
    async checkBrewStatus() {
      this.isBrewChecking = true;
      try {
        const result: BrewCheckResult = await (window as any).electronAPI.brew.checkInstalled();
        this.isBrewInstalled = result.installed;
      } catch (error) {
        console.error('Failed to check Homebrew status:', error);
        this.isBrewInstalled = false;
      } finally {
        this.isBrewChecking = false;
      }
    },

    async startBrewInstall(source: MirrorSource) {
      this.isBrewInstalling = true;
      this.brewInstallError = null;
      await (window as any).electronAPI.brew.install(source);
    },

    handleBrewInstallComplete(result: BrewInstallResult) {
      this.isBrewInstalling = false;
      if (result.success && result.installed) {
        this.isBrewInstalled = true;
        this.brewInstallError = null;
      } else {
        this.brewInstallError = result.error || '安装失败，请重试';
      }
    },

    async init() {
      this.isInitializing = true;
      this.isInitialized = false;

      try {
        // First check if Homebrew is installed
        await this.checkBrewStatus();

        // If Homebrew is not installed, stop initialization here
        if (!this.isBrewInstalled) {
          this.isInitializing = false;
          return;
        }

        this.marketplace = await (window as any).electronAPI.getMarketplace();
        this.settings = await (window as any).electronAPI.settings.get();

        // 强制深色模式
        forceeDarkMode();

        // 先从缓存加载，实现“秒开”
        const cache = loadFromCache();
        if (cache) {
          Object.keys(cache.statuses).forEach(key => {
            this.statuses[key] = cache.statuses[key] as PackageStatus;
          });
          Object.keys(cache.versions).forEach(key => {
            this.versions[key] = cache.versions[key];
          });
          this.lastCacheTime = cache.timestamp;
        }

        await this.refreshSystemInfo();
        
        // 检查缓存是否过期，决定是否需要刷新
        const needsRefresh = !cache || Date.now() - cache.timestamp > CACHE_TTL;
        if (needsRefresh) {
          // 确保刷新完成后再继续
          await this.refreshStatuses({ force: true, silent: !cache });
        }

        (window as any).electronAPI.onStatusUpdated((data: any) => {
          this.statuses[data.id] = data.status;
        });

        (window as any).electronAPI.onInstallationProgress((data: any) => {
          // 保存进度状态
          this.installProgress[data.id] = {
            status: data.status,
            progress: data.progress,
            message: data.message
          };

          if (data.status === 'completed') {
            // 根据操作类型设置正确的状态
            // 如果之前是 uninstalling 状态，完成后应该是 missing
            if (this.statuses[data.id] === 'uninstalling') {
              this.statuses[data.id] = 'missing';
            } else {
              this.statuses[data.id] = 'installed';
            }
            // 完成后清除进度状态
            setTimeout(() => {
              delete this.installProgress[data.id];
            }, 2000);
          } else if (data.status === 'failed') {
            // 失败时恢复之前的状态
            if (this.statuses[data.id] === 'uninstalling') {
              this.statuses[data.id] = 'installed'; // 卸载失败，保持已安装
            } else {
              this.statuses[data.id] = 'missing'; // 安装失败，保持未安装
            }
            // 失败后保留进度状态一段时间
            setTimeout(() => {
              delete this.installProgress[data.id];
            }, 5000);
          } else if (data.status === 'cancelled') {
            // 取消状态
            this.statuses[data.id] = 'missing';
            delete this.installProgress[data.id];
          }
        });

        // 监听错误事件
        (window as any).electronAPI.onInstallationError((data: any) => {
          this.errors[data.id] = {
            type: data.type,
            message: data.message,
            retryable: data.retryable
          };
        });

        (window as any).electronAPI.onCommandCompleted((data: any) => {
          if (data.success) {
            this.statuses[data.id] = 'installed';
          } else {
            this.statuses[data.id] = 'missing';
          }
          this.refreshStatuses();
        });

        this.isInitialized = true;
      } finally {
        this.isInitializing = false;
      }
    },

    async refreshSystemInfo() {
      this.systemInfo = await (window as any).electronAPI.getSystemInfo();
    },

    async refreshStatuses(options?: { force?: boolean; silent?: boolean }) {
      // 如果不是强制刷新且缓存未过期，则跳过
      if (!options?.force && Date.now() - this.lastCacheTime < CACHE_TTL) {
        return;
      }

      if (!options?.silent) {
        this.isRefreshing = true;
      }
      
      try {
        const results = await (window as any).electronAPI.checkStatus();
        Object.keys(results).forEach(key => {
          this.statuses[key] = results[key].status;
          if (results[key].version) {
            this.versions[key] = results[key].version;
          }
        });
        
        // 保存到缓存
        this.lastCacheTime = Date.now();
        saveToCache(this.statuses, this.versions);
      } finally {
        this.isRefreshing = false;
      }
    },

    async installPackage(name: string) {
      this.statuses[name] = 'processing';
      // 设置初始安装进度
      this.installProgress[name] = {
        status: 'downloading',
        progress: undefined,
        message: '准备安装...'
      };
      await (window as any).electronAPI.installPackage(name);
    },

    async uninstallPackage(name: string) {
      this.statuses[name] = 'uninstalling';
      // 设置初始卸载进度
      this.installProgress[name] = {
        status: 'installing',
        progress: 0,
        message: '准备卸载...'
      };
      await (window as any).electronAPI.uninstallPackage(name);
    },

    async searchPackages(keyword: string, isCask: boolean = false) {
      if (!keyword.trim()) {
        this.searchResults = [];
        return;
      }

      this.isSearching = true;
      try {
        this.searchResults = await (window as any).electronAPI.searchPackages(keyword, isCask);
      } catch (error) {
        this.searchResults = [];
      } finally {
        this.isSearching = false;
      }
    },

    async installAll() {
      if (this.isGlobalInstalling) return;
      this.isGlobalInstalling = true;

      const uninstalled = this.marketplace.filter((p: AppPackage) => this.statuses[p.name] === 'missing');
      for (const pkg of uninstalled) {
        await this.installPackage(pkg.name);
      }

      this.isGlobalInstalling = false;
    },

    async uninstallAll() {
      const installed = this.marketplace.filter((p: AppPackage) => this.statuses[p.name] === 'installed');
      for (const pkg of installed) {
        await this.uninstallPackage(pkg.name);
      }
    },

    setPage(page: string) {
      this.currentPage = page;
    },

    async configureShell(type: 'all' | 'homebrew' | 'node' | 'go' | 'python') {
      switch (type) {
        case 'all':
          return await (window as any).electronAPI.shell.configureAll();
        case 'homebrew':
          return await (window as any).electronAPI.shell.configureHomebrew();
        case 'node':
          return await (window as any).electronAPI.shell.configureNode();
        case 'go':
          return await (window as any).electronAPI.shell.configureGo();
        case 'python':
          return await (window as any).electronAPI.shell.configurePython();
      }
    },

    async updateSettings(settings: Partial<AppSettings>) {
      await (window as any).electronAPI.settings.set(settings);
      this.settings = { ...this.settings, ...settings } as AppSettings;
      // 主题切换已移除，强制深色模式
    },

    // 取消安装/卸载
    async cancelInstall(name: string) {
      const success = await (window as any).electronAPI.cancelInstall(name);
      if (success) {
        this.statuses[name] = 'missing';
        delete this.installProgress[name];
      }
      return success;
    },

    // 清除错误状态
    clearError(name: string) {
      delete this.errors[name];
    }
  }
});
