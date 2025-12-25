import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type { DetectionStrategy, DetectionResult, PackageDetectionConfig } from './types';

const execAsync = promisify(exec);

/**
 * CommandStrategy - Detects software by executing version commands
 * 
 * This strategy executes a version command (e.g., `node -v`) to check
 * if software is installed and accessible. It uses an extended PATH
 * to find executables installed via version managers like FNM or NVM.
 */
export class CommandStrategy implements DetectionStrategy {
    readonly name = 'command';

    private static readonly COMMAND_TIMEOUT = 5000; // 5 seconds

    private static readonly COMMON_PATHS = [
        '/opt/homebrew/bin',
        '/opt/homebrew/sbin',
        '/usr/local/bin',
        '/usr/local/sbin',
        '/usr/bin',
        '/usr/sbin',
        '/bin',
        '/sbin',
        '~/.fnm/aliases/default/bin',
        '~/.nvm/versions/node/default/bin',
        '~/.local/bin',
        '~/.cargo/bin'
    ];

    /**
     * Detect if software is installed by executing a version command
     */
    async detect(packageName: string, config: PackageDetectionConfig): Promise<DetectionResult> {
        if (!config.versionCommand) {
            return { installed: false };
        }

        const env = this.buildEnv();

        try {
            const { stdout } = await execAsync(config.versionCommand, {
                timeout: CommandStrategy.COMMAND_TIMEOUT,
                env,
                shell: '/bin/bash'
            });

            const version = this.extractVersion(stdout, config.versionRegex);

            return {
                installed: true,
                version,
                source: 'command'
            };
        } catch {
            return { installed: false };
        }
    }

    /**
     * Build environment with extended PATH
     */
    buildEnv(): NodeJS.ProcessEnv {
        const home = process.env.HOME || '';
        const expandedPaths = CommandStrategy.COMMON_PATHS
            .map(p => p.replace(/^~/, home))
            .join(':');

        return {
            ...process.env,
            PATH: `${expandedPaths}:${process.env.PATH || ''}`
        };
    }

    /**
     * Extract version from command output using regex
     */
    extractVersion(output: string, regex?: RegExp): string | undefined {
        const pattern = regex || /v?(\d+\.\d+\.\d+)/;
        const match = output.match(pattern);

        if (match) {
            // Return the first capture group if available, otherwise the full match
            return match[1] || match[0];
        }

        return undefined;
    }
}
