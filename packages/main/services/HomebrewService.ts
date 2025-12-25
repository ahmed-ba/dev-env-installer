import { existsSync } from 'node:fs';
import { BrowserWindow } from 'electron';
import * as pty from 'node-pty';
import { BinaryStrategy } from './detection/BinaryStrategy';

// Types
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

// Mirror configurations
const MIRROR_CONFIGS: Record<MirrorSource, {
    installScript: string;
    brewGitRemote?: string;
    coreGitRemote?: string;
}> = {
    official: {
        installScript: 'https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh'
    },
    tsinghua: {
        installScript: 'https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/install/raw/HEAD/install.sh',
        brewGitRemote: 'https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/brew.git',
        coreGitRemote: 'https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/homebrew-core.git'
    },
    ustc: {
        installScript: 'https://mirrors.ustc.edu.cn/misc/brew-install.sh',
        brewGitRemote: 'https://mirrors.ustc.edu.cn/brew.git',
        coreGitRemote: 'https://mirrors.ustc.edu.cn/homebrew-core.git'
    }
};

// Homebrew paths for different architectures
const BREW_PATHS = {
    arm64: '/opt/homebrew/bin/brew',
    x64: '/usr/local/bin/brew'
};

// Binary strategy instance for path checking
const binaryStrategy = new BinaryStrategy();

export class HomebrewService {
    private static ptyProcess: pty.IPty | null = null;
    private static currentWindow: BrowserWindow | null = null;

    /**
     * Check if Homebrew is installed by checking known paths
     * Uses BinaryStrategy for consistent file existence checking
     * Does NOT rely on `which brew` due to incomplete PATH in Electron
     */
    static checkInstalled(): BrewCheckResult {
        const arch = process.arch as 'arm64' | 'x64';

        // Check primary path for current architecture first
        const primaryPath = BREW_PATHS[arch];
        if (primaryPath && existsSync(primaryPath)) {
            return { installed: true, path: primaryPath, arch };
        }

        // Check secondary path (for Rosetta 2 compatibility on Apple Silicon)
        const secondaryArch = arch === 'arm64' ? 'x64' : 'arm64';
        const secondaryPath = BREW_PATHS[secondaryArch];
        if (secondaryPath && existsSync(secondaryPath)) {
            return { installed: true, path: secondaryPath, arch };
        }

        return { installed: false, arch };
    }

    /**
     * Async version of checkInstalled using BinaryStrategy
     * Provides more thorough checking with executable permission verification
     */
    static async checkInstalledAsync(): Promise<BrewCheckResult> {
        const arch = process.arch as 'arm64' | 'x64';

        const result = await binaryStrategy.detect('homebrew', {
            binaryPaths: [
                BREW_PATHS.arm64,
                BREW_PATHS.x64
            ]
        });

        if (result.installed && result.path) {
            return { installed: true, path: result.path, arch };
        }

        return { installed: false, arch };
    }

    /**
     * Get the Homebrew executable path if installed
     */
    static getBrewPath(): string | null {
        const result = this.checkInstalled();
        return result.path || null;
    }

    /**
     * Build the installation command for the specified mirror source
     */
    static buildInstallCommand(source: MirrorSource): string {
        const config = MIRROR_CONFIGS[source];

        let envVars = '';
        if (config.brewGitRemote) {
            envVars += `HOMEBREW_BREW_GIT_REMOTE="${config.brewGitRemote}" `;
        }
        if (config.coreGitRemote) {
            envVars += `HOMEBREW_CORE_GIT_REMOTE="${config.coreGitRemote}" `;
        }

        return `${envVars}/bin/bash -c "$(curl -fsSL ${config.installScript})"`;
    }


    /**
     * Start interactive Homebrew installation using PTY
     */
    static startInstall(window: BrowserWindow, options: BrewInstallOptions): void {
        // Kill any existing installation process
        this.killInstall();

        this.currentWindow = window;
        const command = this.buildInstallCommand(options.source);

        try {
            // Create PTY process for interactive installation
            this.ptyProcess = pty.spawn('/bin/bash', ['-c', command], {
                name: 'xterm-256color',
                cols: 120,
                rows: 30,
                cwd: process.env.HOME || '/',
                env: {
                    ...process.env,
                    TERM: 'xterm-256color',
                    LANG: 'en_US.UTF-8',
                    LC_ALL: 'en_US.UTF-8'
                }
            });

            // Forward PTY output to renderer process
            this.ptyProcess.onData((data) => {
                if (this.currentWindow && !this.currentWindow.isDestroyed()) {
                    this.currentWindow.webContents.send('brew:install-data', data);
                }
            });

            // Handle PTY exit
            this.ptyProcess.onExit(({ exitCode }) => {
                // Re-check if Homebrew is now installed
                const checkResult = this.checkInstalled();

                const result: BrewInstallResult = {
                    success: exitCode === 0 && checkResult.installed,
                    exitCode,
                    installed: checkResult.installed,
                    error: exitCode !== 0 && !checkResult.installed
                        ? `Installation exited with code ${exitCode}`
                        : undefined
                };

                if (this.currentWindow && !this.currentWindow.isDestroyed()) {
                    this.currentWindow.webContents.send('brew:install-complete', result);
                }

                this.ptyProcess = null;
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            if (this.currentWindow && !this.currentWindow.isDestroyed()) {
                this.currentWindow.webContents.send('brew:install-complete', {
                    success: false,
                    exitCode: -1,
                    installed: false,
                    error: `Failed to start installation: ${errorMessage}`
                });
            }
        }
    }

    /**
     * Send user input to the PTY process
     */
    static sendInput(data: string): void {
        if (this.ptyProcess) {
            this.ptyProcess.write(data);
        }
    }

    /**
     * Resize the PTY terminal
     */
    static resize(cols: number, rows: number): void {
        if (this.ptyProcess) {
            this.ptyProcess.resize(cols, rows);
        }
    }

    /**
     * Kill the installation process
     */
    static killInstall(): void {
        if (this.ptyProcess) {
            this.ptyProcess.kill();
            this.ptyProcess = null;
        }
        this.currentWindow = null;
    }

    /**
     * Check if installation is in progress
     */
    static isInstalling(): boolean {
        return this.ptyProcess !== null;
    }
}
