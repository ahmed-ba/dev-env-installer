import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { DetectionCache } from '../DetectionCache';
import type { DetectionResult } from '../types';

describe('DetectionCache', () => {
    let cache: DetectionCache;

    beforeEach(() => {
        cache = new DetectionCache(60); // 60 seconds TTL
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('constructor', () => {
        it('should use default TTL of 60 seconds', () => {
            const defaultCache = new DetectionCache();
            expect(defaultCache.ttlMs).toBe(60000);
        });

        it('should accept custom TTL', () => {
            const customCache = new DetectionCache(120);
            expect(customCache.ttlMs).toBe(120000);
        });
    });

    describe('set and get', () => {
        it('should store and retrieve detection result', () => {
            const result: DetectionResult = { installed: true, version: '1.0.0' };

            cache.set('node', result);
            const retrieved = cache.get('node');

            expect(retrieved).toEqual(result);
        });

        it('should return null for non-existent entry', () => {
            const result = cache.get('nonexistent');

            expect(result).toBeNull();
        });

        it('should overwrite existing entry', () => {
            const result1: DetectionResult = { installed: true, version: '1.0.0' };
            const result2: DetectionResult = { installed: true, version: '2.0.0' };

            cache.set('node', result1);
            cache.set('node', result2);

            expect(cache.get('node')).toEqual(result2);
        });
    });

    describe('TTL expiration', () => {
        it('should return cached result within TTL', () => {
            const result: DetectionResult = { installed: true };

            cache.set('node', result);
            vi.advanceTimersByTime(30000); // 30 seconds

            expect(cache.get('node')).toEqual(result);
        });

        it('should return null after TTL expires', () => {
            const result: DetectionResult = { installed: true };

            cache.set('node', result);
            vi.advanceTimersByTime(61000); // 61 seconds

            expect(cache.get('node')).toBeNull();
        });

        it('should delete expired entry on get', () => {
            const result: DetectionResult = { installed: true };

            cache.set('node', result);
            vi.advanceTimersByTime(61000);
            cache.get('node');

            expect(cache.size).toBe(0);
        });
    });

    describe('delete', () => {
        it('should remove cached entry', () => {
            const result: DetectionResult = { installed: true };

            cache.set('node', result);
            cache.delete('node');

            expect(cache.get('node')).toBeNull();
        });

        it('should not throw when deleting non-existent entry', () => {
            expect(() => cache.delete('nonexistent')).not.toThrow();
        });
    });

    describe('clear', () => {
        it('should remove all cached entries', () => {
            cache.set('node', { installed: true });
            cache.set('git', { installed: true });
            cache.set('docker', { installed: false });

            cache.clear();

            expect(cache.size).toBe(0);
            expect(cache.get('node')).toBeNull();
            expect(cache.get('git')).toBeNull();
            expect(cache.get('docker')).toBeNull();
        });
    });

    describe('has', () => {
        it('should return true for valid cached entry', () => {
            cache.set('node', { installed: true });

            expect(cache.has('node')).toBe(true);
        });

        it('should return false for non-existent entry', () => {
            expect(cache.has('nonexistent')).toBe(false);
        });

        it('should return false for expired entry', () => {
            cache.set('node', { installed: true });
            vi.advanceTimersByTime(61000);

            expect(cache.has('node')).toBe(false);
        });
    });

    describe('size', () => {
        it('should return number of cached entries', () => {
            cache.set('node', { installed: true });
            cache.set('git', { installed: true });

            expect(cache.size).toBe(2);
        });

        it('should include expired entries in size', () => {
            cache.set('node', { installed: true });
            vi.advanceTimersByTime(61000);

            // Size includes expired entries until they are accessed
            expect(cache.size).toBe(1);
        });
    });

    /**
     * Property-Based Tests
     * Feature: software-detection-improvement, Property 8: Cache Behavior
     * Validates: Requirements 7.1, 7.2
     */
    describe('Property 8: Cache Behavior', () => {
        // Generate valid package names
        const packageNameArb = fc.stringMatching(/^[a-z][a-z0-9\-]*$/)
            .filter(s => s.length >= 2 && s.length <= 30);

        // Generate detection results
        const detectionResultArb = fc.record({
            installed: fc.boolean(),
            version: fc.option(fc.stringMatching(/^\d+\.\d+\.\d+$/), { nil: undefined }),
            path: fc.option(fc.stringMatching(/^\/[a-z\/]+$/), { nil: undefined }),
            source: fc.option(fc.constantFrom('binary', 'homebrew', 'command') as fc.Arbitrary<'binary' | 'homebrew' | 'command'>, { nil: undefined })
        });

        it('should return cached result within TTL period', async () => {
            await fc.assert(
                fc.asyncProperty(
                    packageNameArb,
                    detectionResultArb,
                    fc.integer({ min: 0, max: 59 }), // seconds within TTL
                    async (packageName, result, secondsElapsed) => {
                        const testCache = new DetectionCache(60);
                        vi.useFakeTimers();

                        testCache.set(packageName, result);
                        vi.advanceTimersByTime(secondsElapsed * 1000);

                        const retrieved = testCache.get(packageName);

                        // Property: within TTL, should return cached result
                        expect(retrieved).toEqual(result);

                        vi.useRealTimers();
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should return null after TTL expires', async () => {
            await fc.assert(
                fc.asyncProperty(
                    packageNameArb,
                    detectionResultArb,
                    fc.integer({ min: 61, max: 300 }), // seconds after TTL
                    async (packageName, result, secondsElapsed) => {
                        const testCache = new DetectionCache(60);
                        vi.useFakeTimers();

                        testCache.set(packageName, result);
                        vi.advanceTimersByTime(secondsElapsed * 1000);

                        const retrieved = testCache.get(packageName);

                        // Property: after TTL, should return null
                        expect(retrieved).toBeNull();

                        vi.useRealTimers();
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should correctly cache and retrieve any valid detection result', async () => {
            await fc.assert(
                fc.asyncProperty(
                    packageNameArb,
                    detectionResultArb,
                    async (packageName, result) => {
                        const testCache = new DetectionCache(60);

                        testCache.set(packageName, result);
                        const retrieved = testCache.get(packageName);

                        // Property: immediately after set, get should return same result
                        expect(retrieved).toEqual(result);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should invalidate cache when delete is called', async () => {
            await fc.assert(
                fc.asyncProperty(
                    packageNameArb,
                    detectionResultArb,
                    async (packageName, result) => {
                        const testCache = new DetectionCache(60);

                        testCache.set(packageName, result);
                        testCache.delete(packageName);
                        const retrieved = testCache.get(packageName);

                        // Property: after delete, get should return null
                        expect(retrieved).toBeNull();
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});
