# Requirements Document

## Introduction

本文档定义了 macOS 开发环境管理工具的三个核心模块增强需求：真实终端集成、智能进度条和安装后环境注入。这些功能将提升用户在安装软件包时的交互体验，提供实时反馈和便捷的环境配置。

## Glossary

- **Terminal_Component**: 基于 xterm.js 的 Vue 组件，用于显示实时安装日志
- **Progress_Bar**: 状态机驱动的进度条组件，根据日志内容智能显示安装状态
- **Installer_Service**: 主进程中负责执行 brew 命令并流式传输日志的服务
- **IPC_Channel**: Electron 主进程与渲染进程之间的通信通道
- **Shell_Config_Manager**: 负责管理用户 shell 配置文件（.zshrc/.bash_profile）的服务
- **Env_Inject_Dialog**: 安装成功后提示用户配置环境变量的弹窗组件
- **ANSI_Escape_Code**: 用于在终端中显示颜色和格式的控制序列
- **Installation_Status**: 安装状态枚举，包括 idle、downloading、installing、completed、failed

## Requirements

### Requirement 1: 真实终端日志流式传输

**User Story:** As a developer, I want to see real-time installation logs in the terminal component, so that I can monitor the installation progress and troubleshoot issues.

#### Acceptance Criteria

1. WHEN the Installer_Service executes a brew command, THE Installer_Service SHALL spawn the process with stdout and stderr pipes
2. WHEN stdout or stderr emits data, THE Installer_Service SHALL send the data to the renderer process via the `installation:log` IPC_Channel
3. WHEN the Terminal_Component receives log data, THE Terminal_Component SHALL write the text to the xterm instance preserving ANSI_Escape_Code colors
4. WHEN the process environment is configured, THE Installer_Service SHALL set `FORCE_COLOR=true` to enable colored output from brew
5. WHEN stderr data is received, THE Terminal_Component SHALL display it with error styling (red color prefix)

### Requirement 2: 状态机驱动的智能进度条

**User Story:** As a user, I want to see a visual progress indicator during installation, so that I understand what stage the installation is at.

#### Acceptance Criteria

1. WHEN log text contains "Downloading" or "Fetching", THE Progress_Bar SHALL display "downloading" status with indeterminate animation
2. WHEN log text contains "Installing" or "Pouring", THE Progress_Bar SHALL display "installing" status at 50% progress
3. WHEN log text contains "Unpacking" or "Extracting", THE Progress_Bar SHALL display "installing" status at 75% progress
4. WHEN log text contains "Linking" or "Symlinking", THE Progress_Bar SHALL display "installing" status at 90% progress
5. WHEN the process exits with code 0, THE Progress_Bar SHALL display "completed" status at 100% with green color
6. WHEN the process exits with non-zero code, THE Progress_Bar SHALL display "failed" status with red color
7. WHEN a percentage pattern (e.g., "50%") is detected in download logs, THE Progress_Bar SHALL display the extracted percentage value

### Requirement 3: 安装后环境变量注入弹窗

**User Story:** As a developer, I want to be prompted to configure environment variables after successful installation, so that I can use the installed software immediately.

#### Acceptance Criteria

1. WHEN installation completes with exit code 0 AND the software has an envPath defined, THE Env_Inject_Dialog SHALL be displayed
2. WHEN the Env_Inject_Dialog is displayed, THE Env_Inject_Dialog SHALL show the software name and the path to be added
3. WHEN the user clicks "确认" button, THE Shell_Config_Manager SHALL add the path to the user's shell config file
4. IF the path already exists in the config file, THEN THE Shell_Config_Manager SHALL skip writing and return success with appropriate message
5. WHEN writing to the config file, THE Shell_Config_Manager SHALL add a comment marker "# Added by Dev Env Installer" before the export line
6. WHEN the user clicks "取消" button, THE Env_Inject_Dialog SHALL close without modifying any files
7. WHEN the injection succeeds, THE Env_Inject_Dialog SHALL display a success message and auto-close after 1.5 seconds

### Requirement 4: IPC 通道配置

**User Story:** As a developer, I want a well-defined IPC interface between main and renderer processes, so that the terminal and progress components receive data reliably.

#### Acceptance Criteria

1. THE preload script SHALL expose `onTerminalData` callback for receiving log data from `installation:log` channel
2. THE preload script SHALL expose `onInstallationProgress` callback for receiving progress updates from `installation:progress` channel
3. THE preload script SHALL expose `injectEnv` method for invoking `system:inject-env` IPC handler
4. THE preload script SHALL expose `removeListeners` method to clean up all installation-related listeners
5. WHEN the renderer component unmounts, THE useInstaller composable SHALL call removeListeners to prevent memory leaks

### Requirement 5: 终端组件配置

**User Story:** As a user, I want a well-configured terminal that displays logs clearly with proper formatting, so that I can read the output easily.

#### Acceptance Criteria

1. THE Terminal_Component SHALL use monospace font family (JetBrains Mono, Fira Code, or fallbacks)
2. THE Terminal_Component SHALL configure xterm theme with dark background (#09090b) matching the app design
3. THE Terminal_Component SHALL load FitAddon to auto-resize terminal on window resize
4. THE Terminal_Component SHALL load WebLinksAddon to make URLs clickable
5. WHEN the clear button is clicked, THE Terminal_Component SHALL clear the terminal buffer and display a "Terminal Cleared" message
6. THE Terminal_Component SHALL maintain a scrollback buffer of at least 1000 lines
