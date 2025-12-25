import { spawn } from 'node:child_process';
import { BrowserWindow } from 'electron';

export type InstallationStatus = 'idle' | 'downloading' | 'installing' | 'completed' | 'failed';

export interface InstallationProgress {
  id: string;
  status: InstallationStatus;
  progress?: number;
  message?: string;
}

export class InstallerService {
  /**
   * 执行 Shell 命令并实时回传日志和状态
   * @param window 目标窗口，用于发送 IPC 消息
   * @param command 要执行的命令
   * @param softwareId 关联的软件 ID
   */
  static async runCommand(
    window: BrowserWindow,
    command: string,
    softwareId: string
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const child = spawn(command, {
        shell: true,
        env: { ...process.env, FORCE_COLOR: 'true' },
        stdio: ['ignore', 'pipe', 'pipe']
      });

      // 初始状态
      window.webContents.send('installation:progress', {
        id: softwareId,
        status: 'downloading' as InstallationStatus,
        message: '开始下载...'
      });

      child.stdout.on('data', (data) => {
        const text = data.toString();
        
        // 发送原始日志
        window.webContents.send('terminal:data', {
          id: softwareId,
          text,
          time: new Date().toLocaleTimeString()
        });

        // 解析状态
        const progress = this.parseProgress(text, softwareId);
        if (progress) {
          window.webContents.send('installation:progress', progress);
        }
      });

      child.stderr.on('data', (data) => {
        const text = data.toString();
        
        window.webContents.send('terminal:data', {
          id: softwareId,
          text,
          time: new Date().toLocaleTimeString(),
          isError: true
        });

        // 解析错误状态
        if (text.includes('Error') || text.includes('error')) {
          window.webContents.send('installation:progress', {
            id: softwareId,
            status: 'failed',
            message: text.trim()
          });
        }
      });

      child.on('close', (code: number | null) => {
        const success = code === 0;
        window.webContents.send('status:updated', {
          id: softwareId,
          status: success ? 'installed' : 'failed'
        });
        
        window.webContents.send('installation:progress', {
          id: softwareId,
          status: success ? 'completed' : 'failed',
          progress: success ? 100 : 0,
          message: success ? '安装完成' : '安装失败'
        });
        
        resolve(success);
      });

      child.on('error', (err: Error) => {
        window.webContents.send('terminal:data', {
          id: softwareId,
          text: `Error: ${err.message}`,
          time: new Date().toLocaleTimeString(),
          isError: true
        });
        
        window.webContents.send('installation:progress', {
          id: softwareId,
          status: 'failed',
          message: err.message
        });
        
        resolve(false);
      });
    });
  }

  /**
   * 解析命令输出，提取安装进度
   */
  private static parseProgress(text: string, softwareId: string): InstallationProgress | null {
    // 匹配下载进度
    const downloadMatch = text.match(/Downloading.*?(\d+)%/);
    if (downloadMatch) {
      return {
        id: softwareId,
        status: 'downloading',
        progress: parseInt(downloadMatch[1]),
        message: '下载中...'
      };
    }

    // 匹配安装状态
    if (text.includes('Installing') || text.includes('Pouring')) {
      return {
        id: softwareId,
        status: 'installing',
        progress: 50,
        message: '安装中...'
      };
    }

    // 匹配解压状态
    if (text.includes('Unpacking') || text.includes('Extracting')) {
      return {
        id: softwareId,
        status: 'installing',
        progress: 75,
        message: '解压中...'
      };
    }

    return null;
  }
}
