import type { PackageDetectionConfig } from './types';

/**
 * Package Detection Configurations
 * 
 * This file contains detection configurations for all supported software packages.
 * Each configuration specifies how to detect if the software is installed using
 * multiple strategies (binary paths, homebrew, command execution).
 */
export const PACKAGE_DETECTION_CONFIGS: Record<string, PackageDetectionConfig> = {
    // Homebrew itself
    'homebrew': {
        binaryPaths: [
            '/opt/homebrew/bin/brew',
            '/usr/local/bin/brew'
        ],
        versionCommand: 'brew --version',
        versionRegex: /Homebrew (\d+\.\d+\.\d+)/
    },

    // Node.js (supports FNM, NVM, Homebrew, and system installations)
    'node@20': {
        binaryPaths: [
            // FNM paths
            '~/.fnm/aliases/default/bin/node',
            '~/.fnm/node-versions/v20.*/installation/bin/node',
            // NVM paths
            '~/.nvm/versions/node/v20.*/bin/node',
            '~/.nvm/alias/default/bin/node',
            // Homebrew paths
            '/opt/homebrew/opt/node@20/bin/node',
            '/usr/local/opt/node@20/bin/node',
            // System paths
            '/usr/local/bin/node',
            '/usr/bin/node'
        ],
        brewName: 'node@20',
        versionCommand: 'node -v',
        versionRegex: /v(\d+\.\d+\.\d+)/
    },

    // Git
    'git': {
        binaryPaths: [
            '/opt/homebrew/bin/git',
            '/usr/local/bin/git',
            '/usr/bin/git'
        ],
        brewName: 'git',
        versionCommand: 'git --version',
        versionRegex: /git version (\d+\.\d+\.\d+)/
    },

    // Docker (Cask)
    'docker': {
        binaryPaths: [
            '/Applications/Docker.app/Contents/Resources/bin/docker',
            '/usr/local/bin/docker'
        ],
        brewName: 'docker',
        isCask: true,
        versionCommand: 'docker --version',
        versionRegex: /Docker version (\d+\.\d+\.\d+)/
    },

    // Visual Studio Code (Cask)
    'visual-studio-code': {
        binaryPaths: [
            '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code',
            '/usr/local/bin/code'
        ],
        brewName: 'visual-studio-code',
        isCask: true,
        versionCommand: 'code --version',
        versionRegex: /^(\d+\.\d+\.\d+)/
    },

    // Go
    'go': {
        binaryPaths: [
            '/opt/homebrew/bin/go',
            '/usr/local/go/bin/go',
            '/usr/local/bin/go',
            '~/go/bin/go'
        ],
        brewName: 'go',
        versionCommand: 'go version',
        versionRegex: /go(\d+\.\d+\.\d+)/
    },

    // Python 3.11
    'python@3.11': {
        binaryPaths: [
            '/opt/homebrew/opt/python@3.11/bin/python3.11',
            '/usr/local/opt/python@3.11/bin/python3.11',
            '/usr/local/bin/python3.11',
            '/usr/bin/python3.11',
            // pyenv paths
            '~/.pyenv/versions/3.11.*/bin/python3.11'
        ],
        brewName: 'python@3.11',
        versionCommand: 'python3.11 --version',
        versionRegex: /Python (\d+\.\d+\.\d+)/
    },

    // Java (OpenJDK 17)
    'java': {
        binaryPaths: [
            '/opt/homebrew/opt/openjdk@17/bin/java',
            '/usr/local/opt/openjdk@17/bin/java',
            '/Library/Java/JavaVirtualMachines/openjdk-17.jdk/Contents/Home/bin/java',
            '/usr/bin/java'
        ],
        brewName: 'openjdk@17',
        versionCommand: 'java -version 2>&1',
        versionRegex: /version "(\d+\.\d+\.\d+)/
    },

    // Rust
    'rust': {
        binaryPaths: [
            '~/.cargo/bin/rustc',
            '/opt/homebrew/bin/rustc',
            '/usr/local/bin/rustc'
        ],
        brewName: 'rust',
        versionCommand: 'rustc --version',
        versionRegex: /rustc (\d+\.\d+\.\d+)/
    },

    // PostgreSQL 15
    'postgresql@15': {
        binaryPaths: [
            '/opt/homebrew/opt/postgresql@15/bin/postgres',
            '/usr/local/opt/postgresql@15/bin/postgres',
            '/usr/local/bin/postgres'
        ],
        brewName: 'postgresql@15',
        versionCommand: 'postgres --version',
        versionRegex: /postgres \(PostgreSQL\) (\d+\.\d+)/
    },

    // Redis
    'redis': {
        binaryPaths: [
            '/opt/homebrew/bin/redis-server',
            '/usr/local/bin/redis-server'
        ],
        brewName: 'redis',
        versionCommand: 'redis-server --version',
        versionRegex: /v=(\d+\.\d+\.\d+)/
    },

    // MongoDB Community
    'mongodb-community': {
        binaryPaths: [
            '/opt/homebrew/bin/mongod',
            '/usr/local/bin/mongod'
        ],
        brewName: 'mongodb-community',
        versionCommand: 'mongod --version',
        versionRegex: /db version v(\d+\.\d+\.\d+)/
    },

    // MySQL
    'mysql': {
        binaryPaths: [
            '/opt/homebrew/bin/mysql',
            '/usr/local/bin/mysql',
            '/usr/local/mysql/bin/mysql'
        ],
        brewName: 'mysql',
        versionCommand: 'mysql --version',
        versionRegex: /mysql\s+Ver\s+(\d+\.\d+\.\d+)/
    },

    // WebStorm (Cask)
    'webstorm': {
        binaryPaths: [
            '/Applications/WebStorm.app/Contents/MacOS/webstorm'
        ],
        brewName: 'webstorm',
        isCask: true
    },

    // IntelliJ IDEA CE (Cask)
    'intellij-idea-ce': {
        binaryPaths: [
            '/Applications/IntelliJ IDEA CE.app/Contents/MacOS/idea'
        ],
        brewName: 'intellij-idea-ce',
        isCask: true
    },

    // Sublime Text (Cask)
    'sublime-text': {
        binaryPaths: [
            '/Applications/Sublime Text.app/Contents/MacOS/sublime_text',
            '/usr/local/bin/subl'
        ],
        brewName: 'sublime-text',
        isCask: true,
        versionCommand: 'subl --version',
        versionRegex: /Build (\d+)/
    },

    // Figma (Cask)
    'figma': {
        binaryPaths: [
            '/Applications/Figma.app/Contents/MacOS/Figma'
        ],
        brewName: 'figma',
        isCask: true
    },

    // Postman (Cask)
    'postman': {
        binaryPaths: [
            '/Applications/Postman.app/Contents/MacOS/Postman'
        ],
        brewName: 'postman',
        isCask: true
    },

    // Slack (Cask)
    'slack': {
        binaryPaths: [
            '/Applications/Slack.app/Contents/MacOS/Slack'
        ],
        brewName: 'slack',
        isCask: true
    },

    // iTerm2 (Cask)
    'iterm2': {
        binaryPaths: [
            '/Applications/iTerm.app/Contents/MacOS/iTerm2'
        ],
        brewName: 'iterm2',
        isCask: true
    }
};

/**
 * Get detection config for a package
 * @param packageName - Name of the package
 * @returns Detection configuration or empty object if not found
 */
export function getPackageDetectionConfig(packageName: string): PackageDetectionConfig {
    return PACKAGE_DETECTION_CONFIGS[packageName] || {};
}

/**
 * Check if a package has a detection config
 * @param packageName - Name of the package
 */
export function hasPackageDetectionConfig(packageName: string): boolean {
    return packageName in PACKAGE_DETECTION_CONFIGS;
}
