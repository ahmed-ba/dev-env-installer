/**
 * Software Detection Types
 * 
 * This module defines the interfaces and types for the multi-strategy
 * software detection system.
 */

/**
 * Result of a software detection operation
 */
export interface DetectionResult {
    /** Whether the software is installed */
    installed: boolean;
    /** Version string if detected */
    version?: string;
    /** Path where the software was found */
    path?: string;
    /** Which detection strategy found the software */
    source?: 'binary' | 'homebrew' | 'command';
}

/**
 * Configuration for detecting a specific software package
 */
export interface PackageDetectionConfig {
    /** List of binary paths to check (supports ~ for home directory) */
    binaryPaths?: string[];
    /** Homebrew package name (if different from package name) */
    brewName?: string;
    /** Whether this is a Homebrew cask */
    isCask?: boolean;
    /** Command to execute to check version (e.g., 'node -v') */
    versionCommand?: string;
    /** Regex to extract version from command output */
    versionRegex?: RegExp;
}

/**
 * Interface for detection strategies
 */
export interface DetectionStrategy {
    /** Name of the strategy for logging/debugging */
    readonly name: string;

    /**
     * Detect if a software package is installed
     * @param packageName - Name of the package to detect
     * @param config - Detection configuration for the package
     * @returns Detection result
     */
    detect(packageName: string, config: PackageDetectionConfig): Promise<DetectionResult>;
}

/**
 * Cache entry for detection results
 */
export interface CacheEntry {
    /** The cached detection result */
    result: DetectionResult;
    /** Timestamp when the entry was cached */
    timestamp: number;
}
