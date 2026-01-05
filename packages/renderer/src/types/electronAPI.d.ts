// Electron API 类型定义

export interface InstallationProgress {
  id: string;
  status: 'idle' | 'downloading' | 'installing' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  message?: string;
}

export interface InstallationLog {
  id: string;
  text: string;
  type: 'stdout' | 'stderr';
  timestamp: number;
}

export interface InstallationError {
  id: string;
  type: 'network' | 'permission' | 'notfound' | 'unknown';
  message: string;
  retryable: boolean;
}

export interface StatusUpdate {
  id: string;
  status: 'missing' | 'installed' | 'processing' | 'uninstalling';
}

export interface ShellConfigResult {
  success: boolean;
  message: string;
}

export interface BrewInstallResult {
  success: boolean;
  exitCode: number | null;
  installed: boolean;
  error?: string;
}

export interface PackageSearchResult {
  name: string;
  description: string;
  version: string;
  installed: boolean;
  installedVersion?: string;
  isCask: boolean;
}

export interface SettingsData {
  // Add settings properties here
  brewMirror?: string;
  [key: string]: unknown;
}

export interface BrewCheckResult {
  installed: boolean;
  path?: string;
  arch: 'arm64' | 'x64';
}

export interface ShellAPI {
  detect: () => Promise<'zsh' | 'bash' | 'fish' | 'unknown'>;
  getConfigPath: () => Promise<string>;
  addPath: (path: string) => Promise<ShellConfigResult>;
  removePath: (path: string) => Promise<ShellConfigResult>;
  configureHomebrew: () => Promise<ShellConfigResult>;
  configureNode: () => Promise<ShellConfigResult>;
  configureGo: () => Promise<ShellConfigResult>;
  configurePython: () => Promise<ShellConfigResult>;
  configureAll: () => Promise<ShellConfigResult>;
  getSourceCommand: () => Promise<string>;
}

export interface SettingsAPI {
  get: () => Promise<SettingsData>;
  set: (settings: Partial<SettingsData>) => Promise<SettingsData>;
}

export interface BrewAPI {
  checkInstalled: () => Promise<BrewCheckResult>;
  install: (source: string) => Promise<void>;
  sendInput: (data: string) => void;
  resize: (cols: number, rows: number) => void;
  kill: () => Promise<void>;
  isInstalling: () => Promise<boolean>;
  onInstallData: (callback: (data: string) => void) => void;
  onInstallComplete: (callback: (result: BrewInstallResult) => void) => void;
  removeListeners: () => void;
}

export interface ElectronAPI {
  // Package status
  getConfig: () => Promise<unknown>;
  checkStatus: (id?: string) => Promise<Record<string, { status: string; version?: string }>>;
  install: (id: string) => Promise<boolean>;

  // Event listeners
  onTerminalData: (callback: (data: InstallationLog) => void) => void;
  onStatusUpdated: (callback: (data: StatusUpdate) => void) => void;
  onInstallationProgress: (callback: (data: InstallationProgress) => void) => void;
  onInstallationError: (callback: (data: InstallationError) => void) => void;
  onCommandCompleted: (callback: (data: { id: string; success: boolean }) => void) => void;
  onAppReady: (callback: () => void) => void;
  removeListeners: () => void;

  // Package management
  getMarketplace: () => Promise<unknown[]>;
  getSystemInfo: () => Promise<unknown>;
  installPackage: (name: string) => Promise<boolean>;
  uninstallPackage: (name: string) => Promise<boolean>;
  cancelInstall: (name: string) => Promise<boolean>;
  searchPackages: (keyword: string, isCask?: boolean) => Promise<PackageSearchResult[]>;
  getPackageInfo: (name: string, isCask?: boolean) => Promise<PackageSearchResult | null>;
  installAll: () => Promise<boolean>;
  uninstallAll: () => Promise<boolean>;

  // Shell configuration
  shell: ShellAPI;
  injectEnv: (path: string) => Promise<ShellConfigResult>;

  // Settings
  settings: SettingsAPI;

  // Homebrew
  brew: BrewAPI;
}

// 扩展 Window 接口
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
