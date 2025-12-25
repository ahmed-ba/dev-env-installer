# Requirements Document

## Introduction

本文档定义了 macOS 开发环境管理工具的 Homebrew 检查与强制安装流程。由于应用的所有功能都依赖 Homebrew，必须在应用启动时检测 Homebrew 是否已安装。如果未安装，应阻止用户进入主界面，并提供一个引导页面让用户一键安装 Homebrew。

## Glossary

- **Homebrew_Service**: 主进程中负责检测和安装 Homebrew 的服务模块
- **Homebrew_Welcome**: 全屏引导组件，在 Homebrew 未安装时显示
- **System_Store**: Pinia store，管理系统级状态包括 Homebrew 安装状态
- **Brew_Path**: Homebrew 可执行文件的路径，Apple Silicon 为 `/opt/homebrew/bin/brew`，Intel Mac 为 `/usr/local/bin/brew`
- **Mirror_Source**: Homebrew 安装镜像源，包括官方源和国内镜像源（清华、中科大等）
- **PTY_Session**: 伪终端会话，用于支持交互式安装过程
- **Xterm_Terminal**: 基于 xterm.js 的终端组件，用于显示安装日志和接收用户输入

## Requirements

### Requirement 1: Homebrew 安装状态检测

**User Story:** As a user, I want the app to detect whether Homebrew is installed on my system, so that I can be guided to install it if missing.

#### Acceptance Criteria

1. WHEN the Homebrew_Service checks for Homebrew installation, THE Homebrew_Service SHALL check the Apple Silicon path `/opt/homebrew/bin/brew` first
2. WHEN the Apple Silicon path does not exist, THE Homebrew_Service SHALL check the Intel Mac path `/usr/local/bin/brew`
3. WHEN either path contains a valid brew executable, THE Homebrew_Service SHALL return `true` for installation status
4. WHEN neither path contains a valid brew executable, THE Homebrew_Service SHALL return `false` for installation status
5. THE Homebrew_Service SHALL NOT rely solely on `which brew` or `command -v brew` due to incomplete PATH in Electron environment

### Requirement 2: 应用启动守卫

**User Story:** As a user, I want to be blocked from using the main app until Homebrew is installed, so that I don't encounter errors when trying to install packages.

#### Acceptance Criteria

1. WHEN the application starts, THE System_Store SHALL call `checkBrewStatus()` action before rendering the main interface
2. WHEN `isBrewInstalled` is `false`, THE App SHALL render the Homebrew_Welcome component instead of the main interface
3. WHEN `isBrewInstalled` is `false`, THE App SHALL hide the sidebar navigation and header
4. WHEN `isBrewInstalled` becomes `true`, THE App SHALL automatically transition to the main interface
5. WHILE Homebrew is being installed, THE App SHALL prevent navigation away from the Homebrew_Welcome component

### Requirement 3: Homebrew 安装命令构建

**User Story:** As a user, I want to choose between official and mirror sources for Homebrew installation, so that I can get faster download speeds in China.

#### Acceptance Criteria

1. THE Homebrew_Service SHALL support building installation commands for official source
2. THE Homebrew_Service SHALL support building installation commands for Chinese mirror sources (Tsinghua, USTC)
3. WHEN official source is selected, THE Homebrew_Service SHALL use the official installation script URL `https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh`
4. WHEN mirror source is selected, THE Homebrew_Service SHALL set appropriate environment variables for HOMEBREW_BREW_GIT_REMOTE and HOMEBREW_CORE_GIT_REMOTE
5. THE installation command SHALL be constructed to work with interactive terminal sessions

### Requirement 4: 交互式终端安装

**User Story:** As a user, I want to see the installation progress in a terminal and be able to interact with it, so that I can respond to prompts like password requests.

#### Acceptance Criteria

1. WHEN the user clicks "Install Homebrew" button, THE Homebrew_Service SHALL spawn an interactive PTY_Session
2. THE PTY_Session SHALL forward all stdout data to the Xterm_Terminal component in real-time
3. THE Xterm_Terminal SHALL accept keyboard input from the user and forward it to the PTY_Session
4. WHEN the installation script prompts for user input (e.g., "Press RETURN to continue"), THE user SHALL be able to respond via the Xterm_Terminal
5. WHEN the installation script requires sudo password, THE user SHALL be able to enter it securely via the Xterm_Terminal
6. THE Xterm_Terminal SHALL preserve ANSI color codes for proper formatting

### Requirement 5: 安装完成检测与状态更新

**User Story:** As a user, I want the app to automatically detect when Homebrew installation is complete, so that I can proceed to use the app without manual refresh.

#### Acceptance Criteria

1. WHEN the PTY_Session exits with code 0, THE Homebrew_Service SHALL re-check the Brew_Path to confirm installation
2. WHEN Homebrew is confirmed installed after PTY_Session exits, THE System_Store SHALL update `isBrewInstalled` to `true`
3. WHEN `isBrewInstalled` changes to `true`, THE App SHALL display a success message for 2 seconds before transitioning
4. WHEN the PTY_Session exits with non-zero code, THE Homebrew_Welcome SHALL display an error message with retry option
5. IF installation fails, THEN THE user SHALL be able to click "Retry" to attempt installation again

### Requirement 6: 引导界面设计

**User Story:** As a user, I want a clear and modern welcome screen that guides me through Homebrew installation, so that I understand what's happening and what I need to do.

#### Acceptance Criteria

1. THE Homebrew_Welcome SHALL display a centered card with title "Welcome to Mac Dev Setup"
2. THE Homebrew_Welcome SHALL display explanatory text about why Homebrew is needed
3. THE Homebrew_Welcome SHALL provide a radio group for selecting installation source (Official / Mirror)
4. THE Homebrew_Welcome SHALL display a prominent "Install Homebrew" button
5. WHEN installation starts, THE Homebrew_Welcome SHALL expand to show the Xterm_Terminal component
6. WHILE installation is in progress, THE "Install Homebrew" button SHALL be disabled and show loading state
7. THE Homebrew_Welcome SHALL match the app's dark theme design (background #09090b)

### Requirement 7: IPC 通道配置

**User Story:** As a developer, I want well-defined IPC channels for Homebrew detection and installation, so that the main and renderer processes communicate reliably.

#### Acceptance Criteria

1. THE preload script SHALL expose `checkBrewInstalled()` method for invoking `brew:check-installed` IPC handler
2. THE preload script SHALL expose `installBrew(source: string)` method for invoking `brew:install` IPC handler
3. THE preload script SHALL expose `onBrewInstallData(callback)` for receiving PTY output from `brew:install-data` channel
4. THE preload script SHALL expose `sendBrewInput(data: string)` method for sending user input to PTY via `brew:input` channel
5. THE preload script SHALL expose `onBrewInstallComplete(callback)` for receiving installation result from `brew:install-complete` channel
