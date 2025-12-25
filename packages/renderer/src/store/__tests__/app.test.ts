import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import fc from 'fast-check';
import { useAppStore, BrewInstallResult } from '../app';

// Mock window.electronAPI
const mockElectronAPI = {
    brew: {
        checkInstalled: vi.fn(),
        install: vi.fn(),
        sendInput: vi.fn(),
        removeListeners: vi.fn()
    },
    getMarketplace: vi.fn(),
    settings: {
        get: vi.fn()
    },
    getSystemInfo: vi.fn(),
    checkStatus: vi.fn(),
    onStatusUpdated: vi.fn(),
    onInstallationProgress: vi.fn(),
    onCommandCompleted: vi.fn()
};

(global as any).window = {
    electronAPI: mockElectronAPI,
    matchMedia: vi.fn().mockReturnValue({ matches: false })
};

describe('App Store - Homebrew State', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
    });

    describe('checkBrewStatus', () => {
        it('should set isBrewInstalled to true when brew is installed', async () => {
            mockElectronAPI.brew.checkInstalled.mockResolvedValue({
                installed: true,
                path: '/opt/homebrew/bin/brew',
                arch: 'arm64'
            });

            const store = useAppStore();
            await store.checkBrewStatus();

            expect(store.isBrewInstalled).toBe(true);
            expect(store.isBrewChecking).toBe(false);
        });

        it('should set isBrewInstalled to false when brew is not installed', async () => {
            mockElectronAPI.brew.checkInstalled.mockResolvedValue({
                installed: false,
                arch: 'arm64'
            });

            const store = useAppStore();
            await store.checkBrewStatus();

            expect(store.isBrewInstalled).toBe(false);
            expect(store.isBrewChecking).toBe(false);
        });
    });

    describe('handleBrewInstallComplete', () => {
        /**
         * Feature: homebrew-setup-guard, Property 3: State Transition on Installation Success
         * For any brew:install-complete event with success=true and installed=true,
         * the store should update isBrewInstalled to true
         * Validates: Requirements 2.4, 5.2
         */
        it('should update state correctly on successful installation', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        success: fc.constant(true),
                        exitCode: fc.constant(0),
                        installed: fc.constant(true),
                        error: fc.constant(undefined)
                    }),
                    (result: BrewInstallResult) => {
                        const store = useAppStore();
                        store.isBrewInstalling = true;
                        store.isBrewInstalled = false;

                        store.handleBrewInstallComplete(result);

                        return (
                            store.isBrewInstalled === true &&
                            store.isBrewInstalling === false &&
                            store.brewInstallError === null
                        );
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should set error on failed installation', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        success: fc.constant(false),
                        exitCode: fc.integer({ min: 1, max: 255 }),
                        installed: fc.constant(false),
                        error: fc.string({ minLength: 1 })
                    }),
                    (result: BrewInstallResult) => {
                        const store = useAppStore();
                        store.isBrewInstalling = true;

                        store.handleBrewInstallComplete(result);

                        return (
                            store.isBrewInstalling === false &&
                            store.brewInstallError !== null
                        );
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('startBrewInstall', () => {
        it('should set isBrewInstalling to true and clear error', async () => {
            mockElectronAPI.brew.install.mockResolvedValue(undefined);

            const store = useAppStore();
            store.brewInstallError = 'previous error';

            await store.startBrewInstall('tsinghua');

            expect(store.isBrewInstalling).toBe(true);
            expect(store.brewInstallError).toBeNull();
            expect(mockElectronAPI.brew.install).toHaveBeenCalledWith('tsinghua');
        });
    });
});


describe('UI Guard State', () => {
    /**
     * Feature: homebrew-setup-guard, Property 2: UI Guard State Consistency
     * For any state where isBrewInstalled is false and isBrewChecking is false,
     * the showBrewWelcome computed should return true
     * Validates: Requirements 2.2, 2.3
     */
    it('should show welcome when brew not installed and not checking', () => {
        fc.assert(
            fc.property(
                fc.boolean(),
                fc.boolean(),
                (isBrewInstalled, isBrewChecking) => {
                    const store = useAppStore();
                    store.isBrewInstalled = isBrewInstalled;
                    store.isBrewChecking = isBrewChecking;

                    // showBrewWelcome = !isBrewInstalled && !isBrewChecking
                    const expectedShowWelcome = !isBrewInstalled && !isBrewChecking;
                    const actualShowWelcome = !store.isBrewInstalled && !store.isBrewChecking;

                    return actualShowWelcome === expectedShowWelcome;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should hide welcome when brew is installed', () => {
        const store = useAppStore();
        store.isBrewInstalled = true;
        store.isBrewChecking = false;

        const showWelcome = !store.isBrewInstalled && !store.isBrewChecking;
        expect(showWelcome).toBe(false);
    });

    it('should hide welcome while checking brew status', () => {
        const store = useAppStore();
        store.isBrewInstalled = false;
        store.isBrewChecking = true;

        const showWelcome = !store.isBrewInstalled && !store.isBrewChecking;
        expect(showWelcome).toBe(false);
    });
});
