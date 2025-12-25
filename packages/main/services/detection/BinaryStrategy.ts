import { access, constants } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { glob } from 'glob';
import type { DetectionStrategy, DetectionResult, PackageDetectionConfig } from './types';

/**
 * BinaryStrategy - Detects software by checking for executable files at known paths
 * 
 * This strategy checks if executable files exist at configured paths.
 * It supports:
 * - Path expansion (~ for home directory)
 * - Glob patterns for version manager paths
 * - Executable permission checking
 */
export class BinaryStrategy implements DetectionStrategy {
    readonly name = 'binary';

    /**
     * Detect if software is installed by checking binary paths
     */
    async detect(packageName: string, config: PackageDetectionConfig): Promise<DetectionResult> {
        const paths = config.binaryPaths || [];

        for (const binaryPath of paths) {
            const expandedPath = this.expandPath(binaryPath);

            // Check if path contains glob patterns
            if (this.hasGlobPattern(expandedPath)) {
                const matchedPath = await this.findGlobMatch(expandedPath);
                if (matchedPath) {
                    return {
                        installed: true,
                        path: matchedPath,
                        source: 'binary'
                    };
                }
            } else {
                // Direct path check
                if (await this.fileExists(expandedPath)) {
                    return {
                        installed: true,
                        path: expandedPath,
                        source: 'binary'
                    };
                }
            }
        }

        return { installed: false };
    }

    /**
     * Expand ~ to home directory in path
     */
    expandPath(path: string): string {
        if (path.startsWith('~')) {
            const home = process.env.HOME || '';
            return path.replace(/^~/, home);
        }
        return path;
    }

    /**
     * Check if path contains glob patterns
     */
    private hasGlobPattern(path: string): boolean {
        return path.includes('*') || path.includes('?') || path.includes('[');
    }

    /**
     * Find first matching file using glob pattern
     */
    private async findGlobMatch(pattern: string): Promise<string | null> {
        try {
            const matches = await glob(pattern, {
                absolute: true,
                nodir: false
            });

            // Return first match that is executable
            for (const match of matches) {
                if (await this.fileExists(match)) {
                    return match;
                }
            }
            return null;
        } catch {
            return null;
        }
    }

    /**
     * Check if file exists and is executable
     */
    async fileExists(path: string): Promise<boolean> {
        try {
            // First check if file exists (faster than access check)
            if (!existsSync(path)) {
                return false;
            }

            // Then check if it's executable
            await access(path, constants.X_OK);
            return true;
        } catch {
            return false;
        }
    }
}
