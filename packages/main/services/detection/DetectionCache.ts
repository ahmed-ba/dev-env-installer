import type { DetectionResult, CacheEntry } from './types';

/**
 * DetectionCache - Caches software detection results with TTL
 * 
 * This cache stores detection results to avoid repeated expensive
 * detection operations. Entries expire after a configurable TTL.
 */
export class DetectionCache {
    private cache: Map<string, CacheEntry> = new Map();
    private ttl: number;

    /**
     * Create a new DetectionCache
     * @param ttlSeconds - Time-to-live in seconds (default: 60)
     */
    constructor(ttlSeconds: number = 60) {
        this.ttl = ttlSeconds * 1000; // Convert to milliseconds
    }

    /**
     * Get a cached detection result
     * @param packageName - Name of the package
     * @returns Cached result or null if not found or expired
     */
    get(packageName: string): DetectionResult | null {
        const entry = this.cache.get(packageName);

        if (!entry) {
            return null;
        }

        // Check if entry has expired
        if (Date.now() - entry.timestamp > this.ttl) {
            this.cache.delete(packageName);
            return null;
        }

        return entry.result;
    }

    /**
     * Set a cached detection result
     * @param packageName - Name of the package
     * @param result - Detection result to cache
     */
    set(packageName: string, result: DetectionResult): void {
        this.cache.set(packageName, {
            result,
            timestamp: Date.now()
        });
    }

    /**
     * Delete a cached entry (invalidate cache for a package)
     * @param packageName - Name of the package
     */
    delete(packageName: string): void {
        this.cache.delete(packageName);
    }

    /**
     * Clear all cached entries
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Check if a package has a valid (non-expired) cache entry
     * @param packageName - Name of the package
     */
    has(packageName: string): boolean {
        return this.get(packageName) !== null;
    }

    /**
     * Get the number of cached entries (including expired ones)
     */
    get size(): number {
        return this.cache.size;
    }

    /**
     * Get the TTL in milliseconds
     */
    get ttlMs(): number {
        return this.ttl;
    }
}
