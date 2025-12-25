import { existsSync } from 'node:fs';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type { DetectionStrategy, DetectionResult, PackageDetectionConfig } from './types';

const execAsync = promisify(exec);

/**
 * HomebrewStrategy - Detects software by checking Homebrew installation
 * 
 * This strategy uses `brew list` command to check if a package is installed.
 * It handles the PATH issue in Electron by using full paths to brew executable.
 */
export class HomebrewStrategy implements DetectionStrategy {
    readonly name = 'homebrew';

    private static readonly BREW_PATHS = [
        '/opt/homebrew/bin/brew',  // Apple Silicon
        '/usr/local/bin/brew'       // Intel
    ];

    private static readonly COMMAND_TIMEOUT = 5000; // 5 seconds

    /**
     * Detect if software is installed via Homebrew
     */
    async detect(packageName: string, config: PackageDetectionConfig): Promise<DetectionResult> {
        const brewPath = this.findBrewPath();
        if (!brewPath) {
            return { installed: false };
        }

        const brewName = config.brewName || packageName;

        try {
            const isInstalled = await this.checkBrewList(brewPath, brewName, config.isCask);

            if (isInstalled) {
                const version = await this.getVersion(brewPath, brewName, config.isCask);
                return {
                    installed: true,
                    version,
                    path: brewPath,
                    source: 'homebrew'
                };
            }

            return { installed: false };
        } catch {
            return { installed: false };
        }
    }

    /**
     * Find the Homebrew executable path
     */
    findBrewPath(): string | null {
        for (const path of HomebrewStrategy.BREW_PATHS) {
            if (existsSync(path)) {
                return path;
            }
        }
        return null;
    }

    /**
     * Check if package is in brew list
     */
    async checkBrewList(brewPath: string, packageName: string, isCask?: boolean): Promise<boolean> {
        const cmd = isCask
            ? `"${brewPath}" list --cask "${packageName}" 2>/dev/null`
            : `"${brewPath}" list "${packageName}" 2>/dev/null`;

        try {
            await execAsync(cmd, { timeout: HomebrewStrategy.COMMAND_TIMEOUT });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get installed version from brew info
     */
    async getVersion(brewPath: string, packageName: string, isCask?: boolean): Promise<string | undefined> {
        try {
            const cmd = isCask
                ? `"${brewPath}" info --cask --json=v2 "${packageName}"`
                : `"${brewPath}" info --json=v2 "${packageName}"`;

            const { stdout } = await execAsync(cmd, { timeout: HomebrewStrategy.COMMAND_TIMEOUT });
            const data = JSON.parse(stdout);

            if (isCask && data.casks && data.casks[0]) {
                return data.casks[0].version || undefined;
            } else if (!isCask && data.formulae && data.formulae[0]) {
                return data.formulae[0].versions?.stable || data.formulae[0].version || undefined;
            }

            return undefined;
        } catch {
            return undefined;
        }
    }
}
