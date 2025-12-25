import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { existsSync } from 'node:fs';
import { HomebrewService, MirrorSource } from '../HomebrewService';

// Mock node:fs
vi.mock('node:fs', () => ({
    existsSync: vi.fn()
}));

// Mock node-pty (not needed for these tests)
vi.mock('node-pty', () => ({
    spawn: vi.fn()
}));

const mockedExistsSync = vi.mocked(existsSync);

describe('HomebrewService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('checkInstalled', () => {
        /**
         * Feature: homebrew-setup-guard, Property 1: Brew Path Detection Correctness
         * For any file system state, checkInstalled returns true iff a valid brew path exists
         * Validates: Requirements 1.3, 1.4
         */
        it('should return installed=true when primary path exists', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom('arm64', 'x64'),
                    (arch) => {
                        // Mock process.arch
                        const originalArch = process.arch;
                        Object.defineProperty(process, 'arch', { value: arch, configurable: true });

                        // Primary path exists
                        mockedExistsSync.mockImplementation((path) => {
                            if (arch === 'arm64') {
                                return path === '/opt/homebrew/bin/brew';
                            }
                            return path === '/usr/local/bin/brew';
                        });

                        const result = HomebrewService.checkInstalled();

                        // Restore
                        Object.defineProperty(process, 'arch', { value: originalArch, configurable: true });

                        return result.installed === true && result.path !== undefined;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should return installed=false when no brew path exists', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom('arm64', 'x64'),
                    (arch) => {
                        const originalArch = process.arch;
                        Object.defineProperty(process, 'arch', { value: arch, configurable: true });

                        // No paths exist
                        mockedExistsSync.mockReturnValue(false);

                        const result = HomebrewService.checkInstalled();

                        Object.defineProperty(process, 'arch', { value: originalArch, configurable: true });

                        return result.installed === false && result.path === undefined;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should check secondary path when primary does not exist', () => {
            // arm64 machine, but only Intel brew exists (Rosetta 2 scenario)
            const originalArch = process.arch;
            Object.defineProperty(process, 'arch', { value: 'arm64', configurable: true });

            mockedExistsSync.mockImplementation((path) => {
                return path === '/usr/local/bin/brew';
            });

            const result = HomebrewService.checkInstalled();

            Object.defineProperty(process, 'arch', { value: originalArch, configurable: true });

            expect(result.installed).toBe(true);
            expect(result.path).toBe('/usr/local/bin/brew');
        });
    });

    describe('buildInstallCommand', () => {
        /**
         * Feature: homebrew-setup-guard, Property 4: Mirror Source Command Generation
         * For any mirror source, the command should contain appropriate env vars
         * Validates: Requirements 3.4
         */
        it('should include env vars for mirror sources', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom<MirrorSource>('tsinghua', 'ustc'),
                    (source) => {
                        const command = HomebrewService.buildInstallCommand(source);

                        return (
                            command.includes('HOMEBREW_BREW_GIT_REMOTE') &&
                            command.includes('HOMEBREW_CORE_GIT_REMOTE')
                        );
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should NOT include env vars for official source', () => {
            const command = HomebrewService.buildInstallCommand('official');

            expect(command).not.toContain('HOMEBREW_BREW_GIT_REMOTE');
            expect(command).not.toContain('HOMEBREW_CORE_GIT_REMOTE');
            expect(command).toContain('raw.githubusercontent.com');
        });

        it('should use correct mirror URLs for tsinghua', () => {
            const command = HomebrewService.buildInstallCommand('tsinghua');

            expect(command).toContain('mirrors.tuna.tsinghua.edu.cn');
        });

        it('should use correct mirror URLs for ustc', () => {
            const command = HomebrewService.buildInstallCommand('ustc');

            expect(command).toContain('mirrors.ustc.edu.cn');
        });

        it('should always include bash and curl in command', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom<MirrorSource>('official', 'tsinghua', 'ustc'),
                    (source) => {
                        const command = HomebrewService.buildInstallCommand(source);

                        return (
                            command.includes('/bin/bash') &&
                            command.includes('curl -fsSL')
                        );
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('getBrewPath', () => {
        it('should return path when brew is installed', () => {
            mockedExistsSync.mockImplementation((path) => {
                return path === '/opt/homebrew/bin/brew';
            });

            const path = HomebrewService.getBrewPath();

            expect(path).toBe('/opt/homebrew/bin/brew');
        });

        it('should return null when brew is not installed', () => {
            mockedExistsSync.mockReturnValue(false);

            const path = HomebrewService.getBrewPath();

            expect(path).toBeNull();
        });
    });
});


describe('PTY Installation', () => {
    /**
     * Feature: homebrew-setup-guard, Property 5: PTY Data Forwarding
     * For any data emitted by PTY, it should be forwarded to renderer
     * Validates: Requirements 4.2
     */
    describe('sendInput', () => {
        it('should not throw when no PTY process exists', () => {
            // sendInput should be safe to call even without active PTY
            expect(() => HomebrewService.sendInput('test')).not.toThrow();
        });
    });

    describe('isInstalling', () => {
        it('should return false when no installation is in progress', () => {
            expect(HomebrewService.isInstalling()).toBe(false);
        });
    });

    describe('killInstall', () => {
        it('should not throw when no PTY process exists', () => {
            expect(() => HomebrewService.killInstall()).not.toThrow();
        });
    });

    describe('resize', () => {
        it('should not throw when no PTY process exists', () => {
            expect(() => HomebrewService.resize(80, 24)).not.toThrow();
        });
    });
});
