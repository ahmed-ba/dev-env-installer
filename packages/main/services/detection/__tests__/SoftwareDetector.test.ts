import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { SoftwareDetector, resetDetector } from '../SoftwareDetector';
import type { DetectionResult, DetectionStrategy, PackageDetectionConfig } from '../types';

// Mock strategy for testing
class MockStrategy implements DetectionStrategy {
    name: string;
    detectFn: (packageName: string, config: PackageDetectionConfig) => Promise<DetectionResult>;
    callCount = 0;

    constructor(name: string, detectFn: (packageName: string, config: PackageDetectionConfig) => Promise<DetectionResult>) {
        this.name = name;
        this.detectFn = detectFn;
    }

    async detect(packageName: string, config: PackageDetectionConfig): Promise<DetectionResult> {
        this.callCount++;
        return this.detectFn(packageName, config);
    }

    reset() {
        this.callCount = 0;
    }
}

describe('SoftwareDetector', () => {
    let detector: SoftwareDetector;

    beforeEach(() => {
        detector = new SoftwareDetector(60);
        resetDetector();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('constructor', () => {
        it('should create detector with default strategies', () => {
            const strategies = detector.getStrategies();

            expect(strategies).toHaveLength(3);
            expect(strategies[0].name).toBe('binary');
            expect(strategies[1].name).toBe('homebrew');
            expect(strategies[2].name).toBe('command');
        });

        it('should accept custom cache TTL', () => {
            const customDetector = new SoftwareDetector(120);
            expect(customDetector).toBeDefined();
        });
    });

    describe('setPackageConfig', () => {
        it('should store and retrieve package config', () => {
            const config: PackageDetectionConfig = {
                binaryPaths: ['/usr/bin/node'],
                versionCommand: 'node -v'
            };

            detector.setPackageConfig('node', config);
            const retrieved = detector.getPackageConfig('node');

            expect(retrieved).toEqual(config);
        });

        it('should return empty config for unknown package', () => {
            const config = detector.getPackageConfig('unknown');
            expect(config).toEqual({});
        });
    });

    describe('setPackageConfigs', () => {
        it('should set multiple configs at once', () => {
            const configs = {
                node: { versionCommand: 'node -v' },
                git: { versionCommand: 'git --version' }
            };

            detector.setPackageConfigs(configs);

            expect(detector.getPackageConfig('node')).toEqual(configs.node);
            expect(detector.getPackageConfig('git')).toEqual(configs.git);
        });
    });

    describe('cache operations', () => {
        it('should invalidate cache for specific package', async () => {
            // First detection
            const result1 = await detector.detect('test-package');
            expect(detector.isCached('test-package')).toBe(true);

            // Invalidate
            detector.invalidateCache('test-package');
            expect(detector.isCached('test-package')).toBe(false);
        });

        it('should clear all cache', async () => {
            await detector.detect('package1');
            await detector.detect('package2');

            detector.clearCache();

            expect(detector.isCached('package1')).toBe(false);
            expect(detector.isCached('package2')).toBe(false);
        });
    });

    describe('detectMany', () => {
        it('should detect multiple packages', async () => {
            const results = await detector.detectMany(['package1', 'package2']);

            expect(results).toHaveProperty('package1');
            expect(results).toHaveProperty('package2');
        });
    });

    /**
     * Property-Based Tests
     * Feature: software-detection-improvement
     * Property 1: Detection Result Aggregation
     * Property 2: Strategy Execution Order
     * Validates: Requirements 1.2, 1.3, 1.4
     */
    describe('Property 1 & 2: Detection Result Aggregation and Strategy Execution Order', () => {
        const packageNameArb = fc.stringMatching(/^[a-z][a-z0-9\-]*$/)
            .filter(s => s.length >= 2 && s.length <= 30);

        it('should return installed=true if any strategy returns installed', async () => {
            await fc.assert(
                fc.asyncProperty(
                    packageNameArb,
                    fc.integer({ min: 0, max: 2 }), // which strategy succeeds (0=binary, 1=homebrew, 2=command)
                    async (packageName, successIndex) => {
                        // Create mock strategies
                        const strategies: MockStrategy[] = [
                            new MockStrategy('binary', async () => ({ installed: successIndex === 0 })),
                            new MockStrategy('homebrew', async () => ({ installed: successIndex === 1 })),
                            new MockStrategy('command', async () => ({ installed: successIndex === 2 }))
                        ];

                        // Create detector with mock strategies
                        const testDetector = new SoftwareDetector();
                        (testDetector as any).strategies = strategies;

                        const result = await testDetector.detect(packageName);

                        // Property: if any strategy returns installed, result should be installed
                        expect(result.installed).toBe(true);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should return installed=false if all strategies return not installed', async () => {
            await fc.assert(
                fc.asyncProperty(
                    packageNameArb,
                    async (packageName) => {
                        // Create mock strategies that all return not installed
                        const strategies: MockStrategy[] = [
                            new MockStrategy('binary', async () => ({ installed: false })),
                            new MockStrategy('homebrew', async () => ({ installed: false })),
                            new MockStrategy('command', async () => ({ installed: false }))
                        ];

                        const testDetector = new SoftwareDetector();
                        (testDetector as any).strategies = strategies;

                        const result = await testDetector.detect(packageName);

                        // Property: if all strategies return not installed, result should be not installed
                        expect(result.installed).toBe(false);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should stop at first successful strategy', async () => {
            await fc.assert(
                fc.asyncProperty(
                    packageNameArb,
                    fc.integer({ min: 0, max: 2 }), // which strategy succeeds first
                    async (packageName, successIndex) => {
                        const callOrder: string[] = [];

                        // Create mock strategies that track call order
                        const strategies: MockStrategy[] = [
                            new MockStrategy('binary', async () => {
                                callOrder.push('binary');
                                return { installed: successIndex === 0 };
                            }),
                            new MockStrategy('homebrew', async () => {
                                callOrder.push('homebrew');
                                return { installed: successIndex === 1 };
                            }),
                            new MockStrategy('command', async () => {
                                callOrder.push('command');
                                return { installed: successIndex === 2 };
                            })
                        ];

                        const testDetector = new SoftwareDetector();
                        (testDetector as any).strategies = strategies;
                        testDetector.clearCache(); // Ensure no cache

                        await testDetector.detect(packageName);

                        // Property: should stop after first successful strategy
                        expect(callOrder.length).toBe(successIndex + 1);

                        // Property: strategies should be called in order
                        const expectedOrder = ['binary', 'homebrew', 'command'].slice(0, successIndex + 1);
                        expect(callOrder).toEqual(expectedOrder);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should use cached result on subsequent calls', async () => {
            await fc.assert(
                fc.asyncProperty(
                    packageNameArb,
                    async (packageName) => {
                        let callCount = 0;

                        const strategies: MockStrategy[] = [
                            new MockStrategy('binary', async () => {
                                callCount++;
                                return { installed: true, version: '1.0.0' };
                            }),
                            new MockStrategy('homebrew', async () => ({ installed: false })),
                            new MockStrategy('command', async () => ({ installed: false }))
                        ];

                        const testDetector = new SoftwareDetector();
                        (testDetector as any).strategies = strategies;

                        // First call
                        const result1 = await testDetector.detect(packageName);
                        const callsAfterFirst = callCount;

                        // Second call (should use cache)
                        const result2 = await testDetector.detect(packageName);

                        // Property: second call should not invoke strategies
                        expect(callCount).toBe(callsAfterFirst);

                        // Property: both results should be the same
                        expect(result1).toEqual(result2);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should re-detect after cache invalidation', async () => {
            await fc.assert(
                fc.asyncProperty(
                    packageNameArb,
                    async (packageName) => {
                        let callCount = 0;

                        const strategies: MockStrategy[] = [
                            new MockStrategy('binary', async () => {
                                callCount++;
                                return { installed: true };
                            }),
                            new MockStrategy('homebrew', async () => ({ installed: false })),
                            new MockStrategy('command', async () => ({ installed: false }))
                        ];

                        const testDetector = new SoftwareDetector();
                        (testDetector as any).strategies = strategies;

                        // First call
                        await testDetector.detect(packageName);
                        const callsAfterFirst = callCount;

                        // Invalidate cache
                        testDetector.invalidateCache(packageName);

                        // Second call (should re-detect)
                        await testDetector.detect(packageName);

                        // Property: after invalidation, strategies should be called again
                        expect(callCount).toBe(callsAfterFirst + 1);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});
