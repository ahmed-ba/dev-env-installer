interface LogEntry {
  text: string;
  time: string;
  isError?: boolean;
}

interface InstallationProgress {
  id: string;
  status: 'idle' | 'downloading' | 'installing' | 'completed' | 'failed';
  progress?: number;
  message?: string;
}

declare global {
  interface Window {
    electronAPI: {
      getConfig: () => Promise<any>;
      checkStatus: (id?: string) => Promise<any>;
      install: (id: string) => Promise<boolean>;
      
      onTerminalData: (callback: (data: LogEntry) => void) => void;
      onStatusUpdated: (callback: (data: any) => void) => void;
      onInstallationProgress: (callback: (data: InstallationProgress) => void) => void;
      
      removeListeners: () => void;
      
      getMarketplace: () => Promise<any>;
      getSystemInfo: () => Promise<any>;
      installPackage: (name: string) => Promise<boolean>;
      uninstallPackage: (name: string) => Promise<boolean>;
      searchPackages: (keyword: string, isCask?: boolean) => Promise<any>;
      getPackageInfo: (name: string, isCask?: boolean) => Promise<any>;
      installAll: () => Promise<any>;
      uninstallAll: () => Promise<any>;
      
      onCommandCompleted: (callback: (data: any) => void) => void;
      
      shell: {
        detect: () => Promise<any>;
        getConfigPath: () => Promise<any>;
        addPath: (path: string) => Promise<boolean>;
        removePath: (path: string) => Promise<boolean>;
        configureHomebrew: () => Promise<any>;
        configureNode: () => Promise<any>;
        configureGo: () => Promise<any>;
        configurePython: () => Promise<any>;
        configureAll: () => Promise<any>;
        getSourceCommand: () => Promise<any>;
      };
      
      settings: {
        get: () => Promise<any>;
        set: (settings: any) => Promise<any>;
      };
      
      injectEnv: (path: string) => Promise<{ success: boolean; message: string }>;
      
      onAppReady: (callback: () => void) => void;
    };
  }
}

export {};