import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { CommandStrategy } from '../CommandStrategy';
import type { PackageDetectionConfig } from '../types';
import * as childProcess from 'node:child_process';

// Mock child_process
vi.mock('node:child_process', () => ({
    exec: vi.fn()
}));

describe('CommandStrategy', () => {
    let strategy: CommandStrategy;
    const mockExec = vi.mocked(childProcess.exec);

    beforeEach(() => {
        strategy = new CommandStrategy();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('buildEnv', () => {
        it('should include common paths in PATH', () => {
            const env = strategy.buildEnv();

            expect(env.PATH).toContain('/opt/homebrew/bin');
            expect(env.PATH).toContain('/usr/local/bin');
            expect(env.PATH).toContain('/usr/bin');
        });

        it('should expand ~ to HOME directory', () => {
            const originalHome = process.env.HOME;
            process.env.HOME = '/Users/testuser';

            const env = strategy.buildEnv();

            expect(env.PATH).toContain('/Users/testuser/.fnm/aliases/default/bin');
            expect(env.PATH).toContain('/Users/testuser/.nvm/versions/node/default/bin');

            process.env.HOME = originalHome;
        });

        it('should preserve existing PATH', () => {
            const originalPath = process.env.PATH;
            process.env.PATH = '/custom/path';

            const env = strategy.buildEnv();

            expect(env.PATH).toContain('/custom/path');

            process.env.PATH = originalPath;
        });
    });

    describe('extractVersion', () => {
        it('should extract version with default regex', () => {
            expect(strategy.extractVersion('v20.10.0')).toBe('20.10.0');
            expect(strategy.extractVersion('node v18.17.1')).toBe('18.17.1');
            expect(strategy.extractVersion('1.2.3')).toBe('1.2.3');
        });

        it('should extract version with custom regex', () => {
            const regex = /Homebrew (\d+\.\d+\.\d+)/;
            expect(strategy.extractVersion('Homebrew 4.2.0', regex)).toBe('4.2.0');
        });

        it('should return undefined when no version found', () => {
            expect(strategy.extractVersion('no version here')).toBeUndefined();
        });

        it('should handle multiline output', () => {
            const output = 'Some header\nv20.10.0\nSome footer';
            expect(strategy.extractVersion(output)).toBe('20.10.0');
        });
    });

    describe('detect', () => {
        it('should return not installed when versionCommand is not provided', async () => {
            const config: PackageDetectionConfig = {};
            const result = await strategy.detect('test', config);

            expect(result.installed).toBe(false);
        });

        it('should return installed when command succeeds', async () => {
            mockExec.mockImplementation((_cmd, _opts, callback) => {
                if (typeof callback === 'function') {
                    callback(null, { stdout: 'v20.10.0', stderr: '' } as any);
                }
                return {} as any;
            });

            const config: PackageDetectionConfig = {
                versionCommand: 'node -v',
                versionRegex: /v(\d+\.\d+\.\d+)/
            };
            const result = await strategy.detect('node', config);

            expect(result.installed).toBe(true);
            expect(result.version).toBe('20.10.0');
            expect(result.source).toBe('command');
        });

        it('should return not installed when command fails', async () => {
            mockExec.mockImplementation((_cmd, _opts, callback) => {
                if (typeof callback === 'function') {
                    callback(new Error('Command not found'), { stdout: '', stderr: '' } as any);
                }
                return {} as any;
            });

            const config: PackageDetectionConfig = {
                versionCommand: 'nonexistent --version'
            };
            const result = await strategy.detect('nonexistent', config);

            expect(result.installed).toBe(false);
        });

        it('should use bash shell for command execution', async () => {
            let usedOptions: any = null;
            mockExec.mockImplementation((_cmd, opts, callback) => {
                usedOptions = opts;
                if (typeof callback === 'function') {
                    callback(null, { stdout: 'v1.0.0', stderr: '' } as any);
                }
                return {} as any;
            });

            const config: PackageDetectionConfig = { versionCommand: 'test --version' };
            await strategy.detect('test', config);

            expect(usedOptions.shell).toBe('/bin/bash');
        });

        it('should set timeout for command execution', async () => {
            let usedOptions: any = null;
            mockExec.mockImplementation((_cmd, opts, callback) => {
                usedOptions = opts;
                if (typeof callback === 'function') {
                    callback(null, { stdout: 'v1.0.0', stderr: '' } as any);
                }
                return {} as any;
            });

            const config: PackageDetectionConfig = { versionCommand: 'test --version' };
            await strategy.detect('test', config);

            expect(usedOptions.timeout).toBe(5000);
        });
    });

    /**
     * Property-Based Tests
     * Feature: software-detection-improvement, Property 5: Command Execution Result Interpretation
     * Validates: Requirements 4.2, 4.3
     */
    describe('Property 5: Command Execution Result Interpretation', () => {
        // Generate valid version strings
        const versionArb = fc.tuple(
            fc.integer({ min: 0, max: 99 }),
            fc.integer({ min: 0, max: 99 }),
            fc.integer({ min: 0, max: 99 })
        ).map(([major, minor, patch]) => `${major}.${minor}.${patch}`);

        // Generate valid command strings
        const commandArb = fc.stringMatching(/^[a-z][a-z0-9\-]* \-\-?[a-z]+$/)
            .filter(s => s.length >= 3 && s.length <= 30);

        it('should return installed=true with version when command succeeds', async () => {
            await fc.assert(
                fc.asyncProperty(
                    versionArb,
                    async (version) => {
                        mockExec.mockImplementation((_cmd, _opts, callback) => {
                            if (typeof callback === 'function') {
                                callback(null, { stdout: `v${version}`, stderr: '' } as any);
                            }
                            return {} as any;
                        });

                        const config: PackageDetectionConfig = {
                            versionCommand: 'test --version',
                            versionRegex: /v?(\d+\.\d+\.\d+)/
                        };
                        const result = await strategy.detect('test', config);

                        // Property: successful command means installed with version
                        expect(result.installed).toBe(true);
                        expect(result.version).toBe(version);
                        expect(result.source).toBe('command');
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should return installed=false when command fails', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.string({ minLength: 1, maxLength: 50 }), // error message
                    async (errorMessage) => {
                        mockExec.mockImplementation((_cmd, _opts, callback) => {
                            if (typeof callback === 'function') {
                                callback(new Error(errorMessage), { stdout: '', stderr: '' } as any);
                            }
                            return {} as any;
                        });

                        const config: PackageDetectionConfig = {
                            versionCommand: 'test --version'
                        };
                        const result = await strategy.detect('test', config);

                        // Property: failed command means not installed
                        expect(result.installed).toBe(false);
                        expect(result.version).toBeUndefined();
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should correctly interpret command result regardless of version format', async () => {
            await fc.assert(
                fc.asyncProperty(
                    versionArb,
                    fc.boolean(), // commandSucceeds
                    fc.constantFrom('v', '', 'version '), // version prefix
                    async (version, commandSucceeds, prefix) => {
                        mockExec.mockImplementation((_cmd, _opts, callback) => {
                            if (commandSucceeds) {
                                if (typeof callback === 'function') {
                                    callback(null, { stdout: `${prefix}${version}`, stderr: '' } as any);
                                }
                            } else {
                                if (typeof callback === 'function') {
                                    callback(new Error('Failed'), { stdout: '', stderr: '' } as any);
                                }
                            }
                            return {} as any;
                        });

                        const config: PackageDetectionConfig = {
                            versionCommand: 'test --version'
                        };
                        const result = await strategy.detect('test', config);

                        // Property: result.installed should match commandSucceeds
                        expect(result.installed).toBe(commandSucceeds);
                        if (commandSucceeds) {
                            expect(result.version).toBe(version);
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});
