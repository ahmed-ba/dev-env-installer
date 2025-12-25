import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

export class ShellConfigManager {
  private static readonly HOME_DIR = homedir();
  private static readonly ZSHRC_PATH = join(this.HOME_DIR, '.zshrc');
  private static readonly BASH_PROFILE_PATH = join(this.HOME_DIR, '.bash_profile');
  private static readonly BASHRC_PATH = join(this.HOME_DIR, '.bashrc');

  private static readonly BREW_PATHS = [
    '/opt/homebrew/bin',
    '/usr/local/bin',
    '/opt/homebrew/sbin',
    '/usr/local/sbin'
  ];

  private static readonly NODE_PATHS = [
    '/opt/homebrew/opt/node@20/bin',
    '/usr/local/opt/node@20/bin'
  ];

  private static readonly GO_PATHS = [
    join(this.HOME_DIR, 'go/bin'),
    '/usr/local/go/bin'
  ];

  private static readonly PYTHON_PATHS = [
    join(this.HOME_DIR, '.local/bin'),
    '/opt/homebrew/opt/python/libexec/bin'
  ];

  static detectShell(): 'zsh' | 'bash' | 'fish' | 'unknown' {
    const shell = process.env.SHELL || '';
    if (shell.includes('zsh')) return 'zsh';
    if (shell.includes('bash')) return 'bash';
    if (shell.includes('fish')) return 'fish';
    return 'unknown';
  }

  static getConfigPath(): string {
    const shell = this.detectShell();
    switch (shell) {
      case 'zsh':
        return this.ZSHRC_PATH;
      case 'bash':
        return existsSync(this.BASH_PROFILE_PATH) ? this.BASH_PROFILE_PATH : this.BASHRC_PATH;
      default:
        return this.ZSHRC_PATH;
    }
  }

  static getConfigContent(): string {
    const configPath = this.getConfigPath();
    if (existsSync(configPath)) {
      return readFileSync(configPath, 'utf-8');
    }
    return '';
  }

  static pathExistsInConfig(path: string): boolean {
    const content = this.getConfigContent();
    const normalizedPath = path.replace(/\/$/, '');
    return content.includes(`export PATH="${normalizedPath}:$PATH"`) ||
           content.includes(`export PATH="$PATH:${normalizedPath}"`) ||
           content.includes(`:${normalizedPath}:`) ||
           content.includes(`:${normalizedPath}"`);
  }

  static addPathToConfig(path: string): { success: boolean; message: string } {
    const configPath = this.getConfigPath();
    
    if (this.pathExistsInConfig(path)) {
      return { success: true, message: `Path ${path} already exists in config` };
    }

    const exportLine = `\n# Added by Dev Env Installer\nexport PATH="${path}:$PATH"\n`;
    
    try {
      if (!existsSync(configPath)) {
        writeFileSync(configPath, exportLine, 'utf-8');
      } else {
        appendFileSync(configPath, exportLine, 'utf-8');
      }
      return { success: true, message: `Successfully added ${path} to ${configPath}` };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to add path: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  static removePathFromConfig(path: string): { success: boolean; message: string } {
    const configPath = this.getConfigPath();
    
    if (!existsSync(configPath)) {
      return { success: true, message: 'Config file does not exist' };
    }

    try {
      let content = readFileSync(configPath, 'utf-8');
      const lines = content.split('\n');
      const filteredLines = lines.filter(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('# Added by Dev Env Installer')) return false;
        if (trimmed.includes(`export PATH="${path}:$PATH"`)) return false;
        if (trimmed.includes(`export PATH="$PATH:${path}"`)) return false;
        if (trimmed.includes(`:${path}:`) || trimmed.includes(`:${path}"`)) return false;
        return true;
      });
      
      writeFileSync(configPath, filteredLines.join('\n'), 'utf-8');
      return { success: true, message: `Successfully removed ${path} from ${configPath}` };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to remove path: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  static configureHomebrew(): { success: boolean; message: string } {
    let result = { success: true, message: '' };
    
    for (const path of this.BREW_PATHS) {
      const r = this.addPathToConfig(path);
      if (!r.success) {
        result = r;
        break;
      }
      result.message += `${r.message}\n`;
    }
    
    return result;
  }

  static configureNode(): { success: boolean; message: string } {
    let result = { success: true, message: '' };
    
    for (const path of this.NODE_PATHS) {
      const r = this.addPathToConfig(path);
      if (!r.success) {
        result = r;
        break;
      }
      result.message += `${r.message}\n`;
    }
    
    return result;
  }

  static configureGo(): { success: boolean; message: string } {
    let result = { success: true, message: '' };
    
    for (const path of this.GO_PATHS) {
      const r = this.addPathToConfig(path);
      if (!r.success) {
        result = r;
        break;
      }
      result.message += `${r.message}\n`;
    }
    
    return result;
  }

  static configurePython(): { success: boolean; message: string } {
    let result = { success: true, message: '' };
    
    for (const path of this.PYTHON_PATHS) {
      const r = this.addPathToConfig(path);
      if (!r.success) {
        result = r;
        break;
      }
      result.message += `${r.message}\n`;
    }
    
    return result;
  }

  static configureAll(): { success: boolean; message: string } {
    const results = [
      this.configureHomebrew(),
      this.configureNode(),
      this.configureGo(),
      this.configurePython()
    ];

    const allSuccess = results.every(r => r.success);
    const combinedMessage = results.map(r => r.message).join('\n');
    
    return {
      success: allSuccess,
      message: combinedMessage
    };
  }

  static getSourceCommand(): string {
    const shell = this.detectShell();
    const configPath = this.getConfigPath();
    
    switch (shell) {
      case 'zsh':
        return `source ${configPath}`;
      case 'bash':
        return `source ${configPath}`;
      case 'fish':
        return `source ${configPath}`;
      default:
        return `source ${configPath}`;
    }
  }

  static async reloadShell(): Promise<{ success: boolean; message: string }> {
    const sourceCmd = this.getSourceCommand();
    return {
      success: true,
      message: `Please run the following command in your terminal:\n${sourceCmd}`
    };
  }
}
