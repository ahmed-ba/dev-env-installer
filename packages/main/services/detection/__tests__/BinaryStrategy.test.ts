import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { BinaryStrategy } from '../BinaryStrategy';
import type { PackageDetectionConfig } from '../types';
import * as fs from 'node:fs/promises';
import * as fsSync from 'node:fs';

// Mock fs modules
vi.mock('node:fs/promises', () => ({
    access: vi.fn(),
    constants: { X_OK: 1 }
}));

vi.mock('node:fs', () => ({
    existsSync: vi.fn(),
    constants: { X_OK: 1 }
}));

describe('BinaryStrategy', () => {
    let strategy: BinaryStrategy;
    const mockAccess = vi.mocked(fs.access);
    const mockExistsSync = vi.mocked(fsSync.existsSync);

    beforeEach(() => {
        strategy = new BinaryStrategy();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('expandPath', () => {
        it('should expand ~ to HOME directory', () => {
            const originalHome = process.env.HOME;
            process.env.HOME = '/Users/testuser';

            expect(strategy.expandPath('~/.fnm/bin/node')).toBe('/Users/testuser/.fnm/bin/node');
            expect(strategy.expandPath('~/bin/brew')).toBe('/Users/testuser/bin/brew');

            process.env.HOME = originalHome;
        });

        it('should not modify paths without ~', () => {
            expect(strategy.expandPath('/usr/local/bin/node')).toBe('/usr/local/bin/node');
            expect(strategy.expandPath('/opt/homebrew/bin/brew')).toBe('/opt/homebrew/bin/brew');
        });

        it('should handle empty HOME', () => {
            const originalHome = process.env.HOME;
            process.env.HOME = '';

            expect(strategy.expandPath('~/.fnm/bin/node')).toBe('/.fnm/bin/node');

            process.env.HOME = originalHome;
        });
    });

    describe('fileExists', () => {
        it('should return true when file exists and is executable', async () => {
            mockExistsSync.mockReturnValue(true);
            mockAccess.mockResolvedValue(undefined);

            const result = await strategy.fileExists('/usr/local/bin/node');

            expect(result).toBe(true);
            expect(mockExistsSync).toHaveBeenCalledWith('/usr/local/bin/node');
        });

        it('should return false when file does not exist', async () => {
            mockExistsSync.mockReturnValue(false);

            const result = await strategy.fileExists('/nonexistent/path');

            expect(result).toBe(false);
            expect(mockAccess).not.toHaveBeenCalled();
        });

        it('should return false when file exists but is not executable', async () => {
            mockExistsSync.mockReturnValue(true);
            mockAccess.mockRejectedValue(new Error('EACCES'));

            const result = await strategy.fileExists('/some/file');

            expect(result).toBe(false);
        });
    });

    describe('detect', () => {
        it('should return installed when binary exists at first path', async () => {
            mockExistsSync.mockReturnValue(true);
            mockAccess.mockResolvedValue(undefined);

            const config: PackageDetectionConfig = {
                binaryPaths: ['/opt/homebrew/bin/brew', '/usr/local/bin/brew']
            };

            const result = await strategy.detect('homebrew', config);

            expect(result.installed).toBe(true);
            expect(result.path).toBe('/opt/homebrew/bin/brew');
            expect(result.source).toBe('binary');
        });

        it('should return installed when binary exists at second path', async () => {
            mockExistsSync
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(true);
            mockAccess.mockResolvedValue(undefined);

            const config: PackageDetectionConfig = {
                binaryPaths: ['/opt/homebrew/bin/brew', '/usr/local/bin/brew']
            };

            const result = await strategy.detect('homebrew', config);

            expect(result.installed).toBe(true);
            expect(result.path).toBe('/usr/local/bin/brew');
        });

        it('should return not installed when no binary exists', async () => {
            mockExistsSync.mockReturnValue(false);

            const config: PackageDetectionConfig = {
                binaryPaths: ['/opt/homebrew/bin/brew', '/usr/local/bin/brew']
            };

            const result = await strategy.detect('homebrew', config);

            expect(result.installed).toBe(false);
            expect(result.path).toBeUndefined();
        });

        it('should return not installed when binaryPaths is empty', async () => {
            const config: PackageDetectionConfig = {
                binaryPaths: []
            };

            const result = await strategy.detect('test', config);

            expect(result.installed).toBe(false);
        });

        it('should return not installed when binaryPaths is undefined', async () => {
            const config: PackageDetectionConfig = {};

            const result = await strategy.detect('test', config);

            expect(result.installed).toBe(false);
        });
    });

    /**
     * Property-Based Tests
     * Feature: software-detection-improvement, Property 4: Binary Existence Detection
     * Validates: Requirements 3.4, 3.5
     */
    describe('Property 4: Binary Existence Detection', () => {
        // Generate valid file paths without glob characters (*, ?, [)
        const validPathArb = fc.array(
            fc.stringMatching(/^[a-z][a-z0-9]*$/),
            { minLength: 2, maxLength: 5 }
        ).map(parts => '/' + parts.join('/'));

        it('should return installed=true if any configured path has an executable file', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.array(validPathArb, { minLength: 1, maxLength: 5 }),
                    fc.nat(),
                    async (paths, existingIndex) => {
                        const normalizedIndex = existingIndex % paths.length;

                        mockExistsSync.mockImplementation((path) => {
                            return path === paths[normalizedIndex];
                        });
                        mockAccess.mockResolvedValue(undefined);

                        const config: PackageDetectionConfig = { binaryPaths: paths };
                        const result = await strategy.detect('test-package', config);

                        expect(result.installed).toBe(true);
                        expect(result.source).toBe('binary');
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should return installed=false if no configured path has an executable file', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.array(validPathArb, { minLength: 0, maxLength: 5 }),
                    async (paths) => {
                        mockExistsSync.mockReturnValue(false);

                        const config: PackageDetectionConfig = { binaryPaths: paths };
                        const result = await strategy.detect('test-package', config);

                        expect(result.installed).toBe(false);
                        expect(result.path).toBeUndefined();
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should check paths in order and return first existing path', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.uniqueArray(validPathArb, { minLength: 2, maxLength: 5 }),
                    fc.nat(),
                    async (paths, firstExistingIndex) => {
                        const normalizedIndex = firstExistingIndex % paths.length;

                        mockExistsSync.mockImplementation((path) => {
                            const pathIndex = paths.indexOf(path as string);
                            return pathIndex >= normalizedIndex;
                        });
                        mockAccess.mockResolvedValue(undefined);

                        const config: PackageDetectionConfig = { binaryPaths: paths };
                        const result = await strategy.detect('test-package', config);

                        expect(result.installed).toBe(true);
                        expect(result.path).toBe(paths[normalizedIndex]);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});
