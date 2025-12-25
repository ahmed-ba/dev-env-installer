# Role
你是一名资深的桌面应用架构师和全栈开发者，精通 Electron, Vue 3, TypeScript 以及 macOS 系统底层命令。

# Goal
我要开发一个 macOS 平台的“开发环境一键安装工具”桌面应用。
请帮我设计项目结构、核心技术选型，并提供 MVP（最小可行性产品）的关键代码实现。

# Tech Stack
- **Core:** Electron (主进程，负责系统交互)
- **Renderer:** Vue 3 + Vite + TypeScript (渲染进程，负责 UI)
- **UI Framework:** Tailwind CSS + Element Plus (或 Ant Design Vue)
- **State Management:** Pinia
- **System Tools:** 使用 macOS 的 Shell 命令 (主要依赖 Homebrew)

# Requirements
该应用需要具备以下核心功能：

1. **软件清单配置化**：
   - 界面展示一系列开发工具（如：Homebrew, Git, Node.js, Docker, VS Code, iTerm2, Chrome）。
   - 每个工具有三种状态：`未安装` (Uninstalled), `已安装` (Installed), `安装中` (Installing)。
   - 需要一个 Config 文件（JSON或TS）来管理这些软件的名称、检测命令（check command）和安装命令（install command）。

2. **核心交互**：
   - **单选安装**：点击某个软件卡片后的“安装”按钮，单独安装该软件。
   - **一键安装**：有一个“一键配置所有环境”按钮，按顺序队列安装所有未安装的软件。

3. **终端日志输出 (Terminal Output)**：
   - 界面下方需要有一个类似“终端”的区域，实时显示正在执行的安装命令的 Stdout/Stderr 日志（例如 `brew install node` 的进度），让用户知道当前发生了什么。

4. **系统权限与检测**：
   - 应用启动时，自动运行检测脚本，扫描系统已安装的软件版本。
   - 考虑到某些安装需要 `sudo` 权限，请给出如何优雅处理 `sudo` 密码输入的方案（例如弹窗询问或调用系统授权）。

# Deliverables (请输出)
1. **项目目录结构**：展示 Electron + Vite + Vue3 的推荐目录结构。
2. **IPC 通信设计**：主进程（Main）和渲染进程（Renderer）如何通信（例如：如何把终端日志实时发回给 Vue 界面）。
3. **核心代码 - Config 定义**：软件列表的数据结构示例。
4. **核心代码 - 安装器服务 (Service)**：在 Node.js 环境下使用 `spawn` 执行 Shell 命令并流式回传日志的代码。
5. **核心代码 - Vue 组件**：前端如何展示软件列表和日志终端。