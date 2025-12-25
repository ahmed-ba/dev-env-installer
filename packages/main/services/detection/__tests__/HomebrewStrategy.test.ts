import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { HomebrewStrategy } from '../HomebrewStrategy';
import type { PackageDetectionConfig } from '../types';
import * as fsSync from 'node:fs';
import * as childProcess from 'node:child_process';
import { promisify } from 'node:util';

// Mock modules
vi.mock('node:fs', () => ({
    existsSync: vi.fn()
}));

vi.mock('node:child_process', () => ({
    exec: vi.fn()
}));

describe('HomebrewStrategy', () => {
    let strategy: HomebrewStrategy;
    const mockExistsSync = vi.mocked(fsSync.existsSync);
    const mockExec = vi.mocked(childProcess.exec);

    beforeEach(() => {
        strategy = new HomebrewStrategy();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('findBrewPath', () => {
        it('should return /opt/homebrew/bin/brew for Apple Silicon', () => {
            mockExistsSync.mockImplementation((path) => path === '/opt/homebrew/bin/brew');

            const result = strategy.findBrewPath();

            expect(result).toBe('/opt/homebrew/bin/brew');
        });

        it('should return /usr/local/bin/brew for Intel', () => {
            mockExistsSync.mockImplementation((path) => path === '/usr/local/bin/brew');

            const result = strategy.findBrewPath();

            expect(result).toBe('/usr/local/bin/brew');
        });

        it('should return null when brew is not installed', () => {
            mockExistsSync.mockReturnValue(false);

            const result = strategy.findBrewPath();

            expect(result).toBeNull();
        });

        it('should prefer Apple Silicon path over Intel path', () => {
            mockExistsSync.mockReturnValue(true);

            const result = strategy.findBrewPath();

            expect(result).toBe('/opt/homebrew/bin/brew');
        });
    });

    describe('checkBrewList', () => {
        it('should return true when brew list succeeds', async () => {
            mockExec.mockImplementation((_cmd, _opts, callback) => {
                if (typeof callback === 'function') {
                    callback(null, { stdout: 'package info', stderr: '' } as any);
                }
                return {} as any;
            });

            const result = await strategy.checkBrewList('/opt/homebrew/bin/brew', 'node');

            expect(result).toBe(true);
        });

        it('should return false when brew list fails', async () => {
            mockExec.mockImplementation((_cmd, _opts, callback) => {
                if (typeof callback === 'function') {
                    callback(new Error('Package not found'), { stdout: '', stderr: '' } as any);
                }
                return {} as any;
            });

            const result = await strategy.checkBrewList('/opt/homebrew/bin/brew', 'nonexistent');

            expect(result).toBe(false);
        });

        it('should use --cask flag for cask packages', async () => {
            let executedCmd = '';
            mockExec.mockImplementation((cmd, _opts, callback) => {
                executedCmd = cmd as string;
                if (typeof callback === 'function') {
                    callback(null, { stdout: '', stderr: '' } as any);
                }
                return {} as any;
            });

            await strategy.checkBrewList('/opt/homebrew/bin/brew', 'docker', true);

            expect(executedCmd).toContain('--cask');
        });
    });

    describe('detect', () => {
        it('should return not installed when brew is not found', async () => {
            mockExistsSync.mockReturnValue(false);

            const config: PackageDetectionConfig = { brewName: 'node' };
            const result = await strategy.detect('node', config);

            expect(result.installed).toBe(false);
        });

        it('should return installed when package is in brew list', async () => {
            mockExistsSync.mockImplementation((path) => path === '/opt/homebrew/bin/brew');
            mockExec.mockImplementation((cmd, _opts, callback) => {
                const cmdStr = cmd as string;
                if (cmdStr.includes('list')) {
                    if (typeof callback === 'function') {
                        callback(null, { stdout: 'node', stderr: '' } as any);
                    }
                } else if (cmdStr.includes('info')) {
                    if (typeof callback === 'function') {
                        callback(null, {
                            stdout: JSON.stringify({ formulae: [{ versions: { stable: '20.0.0' } }] }),
                            stderr: ''
                        } as any);
                    }
                }
                return {} as any;
            });

            const config: PackageDetectionConfig = { brewName: 'node' };
            const result = await strategy.detect('node', config);

            expect(result.installed).toBe(true);
            expect(result.source).toBe('homebrew');
            expect(result.version).toBe('20.0.0');
        });

        it('should return not installed when package is not in brew list', async () => {
            mockExistsSync.mockImplementation((path) => path === '/opt/homebrew/bin/brew');
            mockExec.mockImplementation((_cmd, _opts, callback) => {
                if (typeof callback === 'function') {
                    callback(new Error('Not found'), { stdout: '', stderr: '' } as any);
                }
                return {} as any;
            });

            const config: PackageDetectionConfig = { brewName: 'nonexistent' };
            const result = await strategy.detect('nonexistent', config);

            expect(result.installed).toBe(false);
        });

        it('should use packageName when brewName is not provided', async () => {
            let executedCmd = '';
            mockExistsSync.mockImplementation((path) => path === '/opt/homebrew/bin/brew');
            mockExec.mockImplementation((cmd, _opts, callback) => {
                executedCmd = cmd as string;
                if (typeof callback === 'function') {
                    callback(null, { stdout: '', stderr: '' } as any);
                }
                return {} as any;
            });

            const config: PackageDetectionConfig = {};
            await strategy.detect('git', config);

            expect(executedCmd).toContain('git');
        });
    });

    /**
     * Property-Based Tests
     * Feature: software-detection-improvement, Property 3: Homebrew Command Result Interpretation
     * Validates: Requirements 2.3, 2.4
     */
    describe('Property 3: Homebrew Command Result Interpretation', () => {
        // Generate valid package names
        const packageNameArb = fc.stringMatching(/^[a-z][a-z0-9\-]*$/).filter(s => s.length >= 2 && s.length <= 30);

        it('should return installed=true when brew list returns exit code 0', async () => {
            await fc.assert(
                fc.asyncProperty(
                    packageNameArb,
                    fc.boolean(), // isCask
                    async (packageName, isCask) => {
                        // Setup: brew exists and list command succeeds
                        mockExistsSync.mockImplementation((path) => path === '/opt/homebrew/bin/brew');
                        mockExec.mockImplementation((cmd, _opts, callback) => {
                            const cmdStr = cmd as string;
                            if (cmdStr.includes('list')) {
                                // Simulate successful brew list (exit code 0)
                                if (typeof callback === 'function') {
                                    callback(null, { stdout: packageName, stderr: '' } as any);
                                }
                            } else if (cmdStr.includes('info')) {
                                if (typeof callback === 'function') {
                                    const response = isCask
                                        ? { casks: [{ version: '1.0.0' }] }
                                        : { formulae: [{ versions: { stable: '1.0.0' } }] };
                                    callback(null, { stdout: JSON.stringify(response), stderr: '' } as any);
                                }
                            }
                            return {} as any;
                        });

                        const config: PackageDetectionConfig = { brewName: packageName, isCask };
                        const result = await strategy.detect(packageName, config);

                        // Property: exit code 0 means installed
                        expect(result.installed).toBe(true);
                        expect(result.source).toBe('homebrew');
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should return installed=false when brew list returns non-zero exit code', async () => {
            await fc.assert(
                fc.asyncProperty(
                    packageNameArb,
                    fc.boolean(), // isCask
                    async (packageName, isCask) => {
                        // Setup: brew exists but list command fails
                        mockExistsSync.mockImplementation((path) => path === '/opt/homebrew/bin/brew');
                        mockExec.mockImplementation((_cmd, _opts, callback) => {
                            // Simulate failed brew list (non-zero exit code)
                            if (typeof callback === 'function') {
                                callback(new Error('Error: No such keg'), { stdout: '', stderr: '' } as any);
                            }
                            return {} as any;
                        });

                        const config: PackageDetectionConfig = { brewName: packageName, isCask };
                        const result = await strategy.detect(packageName, config);

                        // Property: non-zero exit code means not installed
                        expect(result.installed).toBe(false);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should correctly interpret brew list result regardless of package name', async () => {
            await fc.assert(
                fc.asyncProperty(
                    packageNameArb,
                    fc.boolean(), // isInstalled
                    fc.boolean(), // isCask
                    async (packageName, isInstalled, isCask) => {
                        mockExistsSync.mockImplementation((path) => path === '/opt/homebrew/bin/brew');
                        mockExec.mockImplementation((cmd, _opts, callback) => {
                            const cmdStr = cmd as string;
                            if (cmdStr.includes('list')) {
                                if (isInstalled) {
                                    if (typeof callback === 'function') {
                                        callback(null, { stdout: packageName, stderr: '' } as any);
                                    }
                                } else {
                                    if (typeof callback === 'function') {
                                        callback(new Error('Not found'), { stdout: '', stderr: '' } as any);
                                    }
                                }
                            } else if (cmdStr.includes('info') && isInstalled) {
                                if (typeof callback === 'function') {
                                    const response = isCask
                                        ? { casks: [{ version: '1.0.0' }] }
                                        : { formulae: [{ versions: { stable: '1.0.0' } }] };
                                    callback(null, { stdout: JSON.stringify(response), stderr: '' } as any);
                                }
                            }
                            return {} as any;
                        });

                        const config: PackageDetectionConfig = { brewName: packageName, isCask };
                        const result = await strategy.detect(packageName, config);

                        // Property: result.installed should match isInstalled
                        expect(result.installed).toBe(isInstalled);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});
