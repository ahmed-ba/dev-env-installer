import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getConfig: () => ipcRenderer.invoke('app:get-config'),
  checkStatus: (id?: string) => ipcRenderer.invoke('app:check-status', id),
  install: (id: string) => ipcRenderer.invoke('app:install', id),

  onTerminalData: (callback: (data: any) => void) =>
    ipcRenderer.on('installation:log', (_event, value) => callback(value)),
  onStatusUpdated: (callback: (data: any) => void) =>
    ipcRenderer.on('status:updated', (_event, value) => callback(value)),
  onInstallationProgress: (callback: (data: any) => void) =>
    ipcRenderer.on('installation:progress', (_event, value) => callback(value)),

  removeListeners: () => {
    ipcRenderer.removeAllListeners('installation:log');
    ipcRenderer.removeAllListeners('status:updated');
    ipcRenderer.removeAllListeners('installation:progress');
    ipcRenderer.removeAllListeners('installation:error');
  },

  getMarketplace: () => ipcRenderer.invoke('app:get-marketplace'),
  getSystemInfo: () => ipcRenderer.invoke('app:get-system-info'),
  installPackage: (name: string) => ipcRenderer.invoke('app:install', name),
  uninstallPackage: (name: string) => ipcRenderer.invoke('app:uninstall', name),
  cancelInstall: (name: string) => ipcRenderer.invoke('app:cancel-install', name),
  searchPackages: (keyword: string, isCask?: boolean) =>
    ipcRenderer.invoke('app:search', keyword, isCask),
  getPackageInfo: (name: string, isCask?: boolean) =>
    ipcRenderer.invoke('app:get-package-info', name, isCask),
  installAll: () => ipcRenderer.invoke('app:install-all'),
  uninstallAll: () => ipcRenderer.invoke('app:uninstall-all'),

  // 错误事件监听
  onInstallationError: (callback: (data: any) => void) =>
    ipcRenderer.on('installation:error', (_event, value) => callback(value)),

  onCommandCompleted: (callback: (data: any) => void) =>
    ipcRenderer.on('command:completed', (_event, value) => callback(value)),

  shell: {
    detect: () => ipcRenderer.invoke('shell:detect'),
    getConfigPath: () => ipcRenderer.invoke('shell:get-config-path'),
    addPath: (path: string) => ipcRenderer.invoke('shell:add-path', path),
    removePath: (path: string) => ipcRenderer.invoke('shell:remove-path', path),
    configureHomebrew: () => ipcRenderer.invoke('shell:configure-homebrew'),
    configureNode: () => ipcRenderer.invoke('shell:configure-node'),
    configureGo: () => ipcRenderer.invoke('shell:configure-go'),
    configurePython: () => ipcRenderer.invoke('shell:configure-python'),
    configureAll: () => ipcRenderer.invoke('shell:configure-all'),
    getSourceCommand: () => ipcRenderer.invoke('shell:get-source-command')
  },

  injectEnv: (path: string) => ipcRenderer.invoke('system:inject-env', path),

  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (settings: any) => ipcRenderer.invoke('settings:set', settings)
  },

  onAppReady: (callback: () => void) =>
    ipcRenderer.on('app:ready', callback),

  // Homebrew detection and installation
  brew: {
    checkInstalled: () => ipcRenderer.invoke('brew:check-installed'),
    install: (source: string) => ipcRenderer.invoke('brew:install', source),
    sendInput: (data: string) => ipcRenderer.send('brew:input', data),
    resize: (cols: number, rows: number) => ipcRenderer.send('brew:resize', cols, rows),
    kill: () => ipcRenderer.invoke('brew:kill'),
    isInstalling: () => ipcRenderer.invoke('brew:is-installing'),

    onInstallData: (callback: (data: string) => void) =>
      ipcRenderer.on('brew:install-data', (_event, value) => callback(value)),
    onInstallComplete: (callback: (result: any) => void) =>
      ipcRenderer.on('brew:install-complete', (_event, value) => callback(value)),

    removeListeners: () => {
      ipcRenderer.removeAllListeners('brew:install-data');
      ipcRenderer.removeAllListeners('brew:install-complete');
    }
  }
});
