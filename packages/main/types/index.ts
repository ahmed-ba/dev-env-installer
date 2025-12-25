export type PackageStatus = 'installed' | 'missing' | 'processing' | 'uninstalling';

export type PackageCategory = 'language' | 'database' | 'ide' | 'tool' | 'cask';

export interface AppPackage {
  name: string;
  description: string;
  category: PackageCategory;
  installCmd: string;
  uninstallCmd: string;
  checkCmd: string;
  status: PackageStatus;
  version?: string;
  homepage?: string;
  isCask?: boolean;
  icon?: string;
}

export interface BrewSearchResult {
  name: string;
  description: string;
  version?: string;
  installed: boolean;
  installedVersion?: string;
  isCask: boolean;
}

export interface TerminalMessage {
  id: string;
  text: string;
  time: string;
  isError?: boolean;
  type?: 'stdout' | 'stderr';
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  brewMirror?: string;
  autoSourceShell: boolean;
}

export interface SystemInfo {
  platform: string;
  arch: string;
  nodeVersion?: string;
  brewVersion?: string;
  installedCount: number;
  totalPackages: number;
}

// Homebrew installation types
export type MirrorSource = 'official' | 'tsinghua' | 'ustc';

export interface BrewCheckResult {
  installed: boolean;
  path?: string;
  arch: 'arm64' | 'x64';
}

export interface BrewInstallOptions {
  source: MirrorSource;
}

export interface BrewInstallResult {
  success: boolean;
  exitCode: number | null;
  installed: boolean;
  error?: string;
}
