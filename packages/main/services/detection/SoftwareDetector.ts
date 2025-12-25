import type { DetectionStrategy, DetectionResult, PackageDetectionConfig } from './types';
import { BinaryStrategy } from './BinaryStrategy';
import { HomebrewStrategy } from './HomebrewStrategy';
import { CommandStrategy } from './CommandStrategy';
import { DetectionCache } from './DetectionCache';

/**
 * Default package detection configurations
 */
const DEFAULT_CONFIGS: Record<string, PackageDetectionConfig> = {};

/**
 * SoftwareDetector - Main service for detecting software installation
 * 
 * This service coordinates multiple detection strategies to determine
 * if software is installed. It tries strategies in order (Binary → Homebrew → Command)
 * and returns as soon as one succeeds.
 */
export class SoftwareDetector {
    private strategies: DetectionStrategy[];
    private cache: DetectionCache;
    private configs: Record<string, PackageDetectionConfig>;

    /**
     * Create a new SoftwareDetector
     * @param cacheTtlSeconds - Cache TTL in seconds (default: 60)
     */
    constructor(cacheTtlSeconds: number = 60) {
        this.strategies = [
            new BinaryStrategy(),
            new HomebrewStrategy(),
            new CommandStrategy()
        ];
        this.cache = new DetectionCache(cacheTtlSeconds);
        this.configs = { ...DEFAULT_CONFIGS };
    }

    /**
     * Detect if a software package is installed
     * @param packageName - Name of the package to detect
     * @returns Detection result
     */
    async detect(packageName: string): Promise<DetectionResult> {
        // Check cache first
        const cached = this.cache.get(packageName);
        if (cached) {
            return cached;
        }

        const config = this.getPackageConfig(packageName);

        // Try each strategy in order
        for (const strategy of this.strategies) {
            try {
                const result = await strategy.detect(packageName, config);
                if (result.installed) {
                    this.cache.set(packageName, result);
                    return result;
                }
            } catch {
                // Strategy failed, try next one
                continue;
            }
        }

        // No strategy found the software installed
        const notInstalled: DetectionResult = { installed: false };
        this.cache.set(packageName, notInstalled);
        return notInstalled;
    }

    /**
     * Detect multiple packages
     * @param packageNames - Names of packages to detect
     * @returns Map of package names to detection results
     */
    async detectMany(packageNames: string[]): Promise<Record<string, DetectionResult>> {
        const results: Record<string, DetectionResult> = {};

        for (const name of packageNames) {
            results[name] = await this.detect(name);
        }

        return results;
    }

    /**
     * Get the detection configuration for a package
     * @param packageName - Name of the package
     * @returns Package detection configuration
     */
    getPackageConfig(packageName: string): PackageDetectionConfig {
        return this.configs[packageName] || {};
    }

    /**
     * Set the detection configuration for a package
     * @param packageName - Name of the package
     * @param config - Detection configuration
     */
    setPackageConfig(packageName: string, config: PackageDetectionConfig): void {
        this.configs[packageName] = config;
    }

    /**
     * Set detection configurations for multiple packages
     * @param configs - Map of package names to configurations
     */
    setPackageConfigs(configs: Record<string, PackageDetectionConfig>): void {
        this.configs = { ...this.configs, ...configs };
    }

    /**
     * Invalidate the cache for a specific package
     * @param packageName - Name of the package
     */
    invalidateCache(packageName: string): void {
        this.cache.delete(packageName);
    }

    /**
     * Refresh the cache for a specific package (invalidate and re-detect)
     * @param packageName - Name of the package
     * @returns Fresh detection result
     */
    async refreshCache(packageName: string): Promise<DetectionResult> {
        this.cache.delete(packageName);
        return this.detect(packageName);
    }

    /**
     * Clear all cached detection results
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Get the list of registered strategies
     */
    getStrategies(): DetectionStrategy[] {
        return [...this.strategies];
    }

    /**
     * Check if a result is cached for a package
     * @param packageName - Name of the package
     */
    isCached(packageName: string): boolean {
        return this.cache.has(packageName);
    }
}

// Singleton instance for global use
let detectorInstance: SoftwareDetector | null = null;

/**
 * Get the global SoftwareDetector instance
 */
export function getDetector(): SoftwareDetector {
    if (!detectorInstance) {
        detectorInstance = new SoftwareDetector();
    }
    return detectorInstance;
}

/**
 * Reset the global SoftwareDetector instance (mainly for testing)
 */
export function resetDetector(): void {
    detectorInstance = null;
}
