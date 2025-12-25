# Requirements Document

## Introduction

本功能旨在改进开发环境安装器的软件检测逻辑。当前系统仅通过 `brew list` 命令检测软件安装状态，这导致以下问题：

1. 通过其他方式安装的软件（如 FNM 管理的 Node.js）无法被正确识别
2. Homebrew 本身的检测在 Electron 环境中可能因 PATH 问题而失败
3. 用户看到已安装的软件显示为"未安装"，造成困惑

本功能将实现多策略软件检测机制，支持检测通过不同方式安装的软件。

## Glossary

- **Software_Detector**: 软件检测服务，负责判断软件是否已安装
- **Detection_Strategy**: 检测策略，定义如何检测特定软件的安装状态
- **Homebrew_Strategy**: 通过 `brew list` 命令检测 Homebrew 安装的软件
- **Binary_Strategy**: 通过检查可执行文件路径来检测软件
- **Command_Strategy**: 通过执行命令（如 `node -v`）来检测软件
- **FNM**: Fast Node Manager，一种流行的 Node.js 版本管理器
- **NVM**: Node Version Manager，另一种 Node.js 版本管理器

## Requirements

### Requirement 1: 多策略软件检测

**User Story:** As a 用户, I want 系统能够通过多种方式检测软件安装状态, so that 无论软件是通过 Homebrew、版本管理器还是其他方式安装的都能被正确识别。

#### Acceptance Criteria

1. THE Software_Detector SHALL support multiple Detection_Strategy types for each software package
2. WHEN checking software installation status, THE Software_Detector SHALL try each configured strategy in order until one succeeds
3. WHEN any Detection_Strategy returns installed, THE Software_Detector SHALL report the software as installed
4. WHEN all Detection_Strategy attempts fail, THE Software_Detector SHALL report the software as not installed

### Requirement 2: Homebrew 检测策略

**User Story:** As a 用户, I want Homebrew 安装的软件能被正确检测, so that 我可以看到通过 Homebrew 安装的软件状态。

#### Acceptance Criteria

1. THE Homebrew_Strategy SHALL use `brew list <package>` command to check installation
2. WHEN the brew command is not in PATH, THE Homebrew_Strategy SHALL use the full path `/opt/homebrew/bin/brew` or `/usr/local/bin/brew`
3. WHEN `brew list` returns exit code 0, THE Homebrew_Strategy SHALL return installed status
4. WHEN `brew list` returns non-zero exit code, THE Homebrew_Strategy SHALL return not installed status

### Requirement 3: 可执行文件路径检测策略

**User Story:** As a 用户, I want 系统能够通过检查可执行文件路径来检测软件, so that 通过非 Homebrew 方式安装的软件也能被识别。

#### Acceptance Criteria

1. THE Binary_Strategy SHALL check for executable files at configured paths
2. WHEN checking Node.js, THE Binary_Strategy SHALL check common paths including FNM (`~/.fnm`), NVM (`~/.nvm`), and system paths
3. WHEN checking Homebrew, THE Binary_Strategy SHALL check `/opt/homebrew/bin/brew` and `/usr/local/bin/brew`
4. WHEN an executable file exists at any configured path, THE Binary_Strategy SHALL return installed status
5. WHEN no executable file exists at any configured path, THE Binary_Strategy SHALL return not installed status

### Requirement 4: 命令执行检测策略

**User Story:** As a 用户, I want 系统能够通过执行版本命令来检测软件, so that 只要软件可用就能被识别。

#### Acceptance Criteria

1. THE Command_Strategy SHALL execute a version command (e.g., `node -v`) to check installation
2. WHEN the command executes successfully with exit code 0, THE Command_Strategy SHALL return installed status with version info
3. WHEN the command fails or times out, THE Command_Strategy SHALL return not installed status
4. THE Command_Strategy SHALL set a timeout of 5 seconds for command execution
5. WHEN executing commands, THE Command_Strategy SHALL use a shell environment that includes common PATH locations

### Requirement 5: Node.js 版本管理器支持

**User Story:** As a 用户, I want 通过 FNM 或 NVM 安装的 Node.js 能被正确检测, so that 我使用版本管理器管理 Node.js 时不会看到错误的安装状态。

#### Acceptance Criteria

1. WHEN checking Node.js installation, THE Software_Detector SHALL check FNM installation at `~/.fnm`
2. WHEN checking Node.js installation, THE Software_Detector SHALL check NVM installation at `~/.nvm`
3. WHEN checking Node.js installation, THE Software_Detector SHALL execute `node -v` with proper shell initialization
4. WHEN Node.js is installed via any version manager, THE Software_Detector SHALL report it as installed
5. THE Software_Detector SHALL extract and display the installed Node.js version regardless of installation method

### Requirement 6: Homebrew 自身检测改进

**User Story:** As a 用户, I want Homebrew 的安装状态能在 Electron 应用中被正确检测, so that 我不会看到已安装的 Homebrew 显示为未安装。

#### Acceptance Criteria

1. WHEN checking Homebrew installation, THE Software_Detector SHALL first check file existence at known paths
2. THE Software_Detector SHALL check `/opt/homebrew/bin/brew` for Apple Silicon Macs
3. THE Software_Detector SHALL check `/usr/local/bin/brew` for Intel Macs
4. WHEN the brew executable exists at any known path, THE Software_Detector SHALL report Homebrew as installed
5. IF the file check fails, THEN THE Software_Detector SHALL fall back to command execution check

### Requirement 7: 检测结果缓存

**User Story:** As a 用户, I want 软件检测结果能被缓存, so that 应用响应更快且不会重复执行检测命令。

#### Acceptance Criteria

1. THE Software_Detector SHALL cache detection results for a configurable duration
2. WHEN a cached result exists and is not expired, THE Software_Detector SHALL return the cached result
3. WHEN a software is installed or uninstalled, THE Software_Detector SHALL invalidate the cache for that software
4. THE Software_Detector SHALL provide a method to manually refresh the cache for specific software
5. THE default cache duration SHALL be 60 seconds
