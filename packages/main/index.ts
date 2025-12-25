import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { MARKETPLACE_PACKAGES } from './config';
import { BrewCommandExecutor } from './services/BrewCommandExecutor';
import { ShellConfigManager } from './services/ShellConfigManager';
import { SettingsService } from './services/SettingsService';
import { HomebrewService, MirrorSource } from './services/HomebrewService';
import { AppPackage, SystemInfo, AppSettings, BrewSearchResult } from './types';

const execAsync = promisify(exec);

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#09090b'
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.send('app:ready');
  });
}

ipcMain.handle('app:get-marketplace', () => {
  return MARKETPLACE_PACKAGES;
});

ipcMain.handle('app:get-system-info', async () => {
  const info: SystemInfo = {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    brewVersion: await BrewCommandExecutor.getBrewVersion() || undefined,
    installedCount: 0,
    totalPackages: MARKETPLACE_PACKAGES.length
  };

  for (const pkg of MARKETPLACE_PACKAGES) {
    const isInstalled = await BrewCommandExecutor.checkInstalled(pkg.name, pkg.isCask);
    if (isInstalled) info.installedCount++;
  }

  return info;
});

ipcMain.handle('app:check-status', async (_event, packageName?: string) => {
  const list = packageName
    ? MARKETPLACE_PACKAGES.filter(p => p.name === packageName)
    : MARKETPLACE_PACKAGES;

  const results: Record<string, any> = {};

  for (const pkg of list) {
    try {
      const isInstalled = await BrewCommandExecutor.checkInstalled(pkg.name, pkg.isCask);
      const version = isInstalled ? await BrewCommandExecutor.getInstalledVersion(pkg.name, pkg.isCask) : null;

      results[pkg.name] = {
        status: isInstalled ? 'installed' : 'missing',
        version
      };
    } catch {
      results[pkg.name] = { status: 'missing' };
    }
  }

  return results;
});

ipcMain.handle('app:install', async (event, packageName: string) => {
  const pkg = MARKETPLACE_PACKAGES.find(p => p.name === packageName);
  if (!pkg || !mainWindow) return false;

  mainWindow.webContents.send('status:updated', {
    id: packageName,
    status: 'processing'
  });

  const result = await BrewCommandExecutor.install(
    mainWindow,
    pkg.name,
    pkg.isCask || false,
    packageName
  );

  // Invalidate cache after installation
  BrewCommandExecutor.invalidateCache(packageName);

  return result.success;
});

ipcMain.handle('system:inject-env', async (_event, path: string) => {
  try {
    const result = ShellConfigManager.addPathToConfig(path);
    return result;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});

ipcMain.handle('app:uninstall', async (event, packageName: string) => {
  const pkg = MARKETPLACE_PACKAGES.find(p => p.name === packageName);
  if (!pkg || !mainWindow) return false;

  mainWindow.webContents.send('status:updated', {
    id: packageName,
    status: 'uninstalling'
  });

  const result = await BrewCommandExecutor.uninstall(
    mainWindow,
    pkg.name,
    pkg.isCask || false,
    packageName
  );

  // Invalidate cache after uninstallation
  BrewCommandExecutor.invalidateCache(packageName);

  return result.success;
});

// 取消安装/卸载进程
ipcMain.handle('app:cancel-install', async (_event, packageName: string) => {
  const success = await BrewCommandExecutor.cancelProcess(packageName);
  
  if (success && mainWindow) {
    // 发送取消状态到前端
    mainWindow.webContents.send('installation:progress', {
      id: packageName,
      status: 'cancelled',
      message: '已取消'
    });
    
    mainWindow.webContents.send('status:updated', {
      id: packageName,
      status: 'missing'  // 恢复为未安装状态
    });
  }
  
  return success;
});

ipcMain.handle('app:search', async (event, keyword: string, isCask: boolean = false) => {
  if (!mainWindow) return [];

  const packages = await BrewCommandExecutor.searchPackages(keyword, isCask);
  const results: BrewSearchResult[] = [];

  for (const pkgName of packages) {
    const info = await BrewCommandExecutor.getPackageInfo(pkgName, isCask);
    if (info) {
      const isInstalled = await BrewCommandExecutor.checkInstalled(pkgName, isCask);
      const version = isInstalled ? await BrewCommandExecutor.getInstalledVersion(pkgName, isCask) : null;

      results.push({
        name: info.name,
        description: info.description,
        version: info.version,
        installed: isInstalled,
        installedVersion: version || undefined,
        isCask
      });
    }
  }

  return results;
});

ipcMain.handle('app:get-package-info', async (_event, packageName: string, isCask: boolean = false) => {
  const info = await BrewCommandExecutor.getPackageInfo(packageName, isCask);
  if (!info) return null;

  const isInstalled = await BrewCommandExecutor.checkInstalled(packageName, isCask);
  const version = isInstalled ? await BrewCommandExecutor.getInstalledVersion(packageName, isCask) : null;

  return {
    ...info,
    installed: isInstalled,
    installedVersion: version
  };
});

ipcMain.handle('app:install-all', async (event) => {
  if (!mainWindow) return false;

  const uninstalled = MARKETPLACE_PACKAGES.filter(p => {
    const status = (event.sender as any).statusMap?.[p.name];
    return status === 'missing';
  });

  for (const pkg of uninstalled) {
    await ipcMain.emit('app:install', event, pkg.name);
  }

  return true;
});

ipcMain.handle('app:uninstall-all', async (event) => {
  if (!mainWindow) return false;

  const installed = MARKETPLACE_PACKAGES.filter(p => {
    const status = (event.sender as any).statusMap?.[p.name];
    return status === 'installed';
  });

  for (const pkg of installed) {
    await ipcMain.emit('app:uninstall', event, pkg.name);
  }

  return true;
});

ipcMain.handle('shell:detect', () => {
  return ShellConfigManager.detectShell();
});

ipcMain.handle('shell:get-config-path', () => {
  return ShellConfigManager.getConfigPath();
});

ipcMain.handle('shell:add-path', async (_event, path: string) => {
  return ShellConfigManager.addPathToConfig(path);
});

ipcMain.handle('shell:remove-path', async (_event, path: string) => {
  return ShellConfigManager.removePathFromConfig(path);
});

ipcMain.handle('shell:configure-homebrew', () => {
  return ShellConfigManager.configureHomebrew();
});

ipcMain.handle('shell:configure-node', () => {
  return ShellConfigManager.configureNode();
});

ipcMain.handle('shell:configure-go', () => {
  return ShellConfigManager.configureGo();
});

ipcMain.handle('shell:configure-python', () => {
  return ShellConfigManager.configurePython();
});

ipcMain.handle('shell:configure-all', () => {
  return ShellConfigManager.configureAll();
});

ipcMain.handle('shell:get-source-command', () => {
  return ShellConfigManager.getSourceCommand();
});

ipcMain.handle('settings:get', async (): Promise<AppSettings> => {
  return SettingsService.load();
});

ipcMain.handle('settings:set', async (_event, settings: Partial<AppSettings>): Promise<AppSettings> => {
  return SettingsService.set(settings);
});

// Homebrew detection and installation IPC handlers
ipcMain.handle('brew:check-installed', () => {
  return HomebrewService.checkInstalled();
});

ipcMain.handle('brew:install', async (_event, source: MirrorSource) => {
  if (!mainWindow) return;
  HomebrewService.startInstall(mainWindow, { source });
});

ipcMain.on('brew:input', (_event, data: string) => {
  HomebrewService.sendInput(data);
});

ipcMain.on('brew:resize', (_event, cols: number, rows: number) => {
  HomebrewService.resize(cols, rows);
});

ipcMain.handle('brew:kill', () => {
  HomebrewService.killInstall();
});

ipcMain.handle('brew:is-installing', () => {
  return HomebrewService.isInstalling();
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
