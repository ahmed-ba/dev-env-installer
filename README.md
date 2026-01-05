# 🚀 Dev-Env-Installer

> macOS 开发环境一键安装工具 - 让你的开发环境配置变得简单高效

[![Platform](https://img.shields.io/badge/Platform-macOS-blue.svg)](https://www.apple.com/macos/)
[![Electron](https://img.shields.io/badge/Electron-28.0-47848F.svg?logo=electron)](https://www.electronjs.org/)
[![Vue](https://img.shields.io/badge/Vue-3.4-4FC08D.svg?logo=vue.js)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6.svg?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📖 项目简介

**Dev-Env-Installer** 是一款基于 Electron + Vue 3 + TypeScript 构建的 macOS 桌面应用，旨在帮助开发者**一键配置开发环境**。

无论你是刚入职的新人、换了新电脑，还是想快速搭建统一的团队开发环境，这款工具都能帮你节省大量时间。

### ✨ 核心特性

- 🎯 **一键安装** - 勾选需要的软件，点击安装即可
- 📦 **软件市场** - 内置丰富的开发工具、编程语言、数据库等
- 🔍 **状态检测** - 自动检测已安装的软件
- 📝 **实时日志** - 安装过程实时显示，问题一目了然
- 🗑️ **卸载管理** - 支持一键卸载已安装的软件  
- ⚡ **并行安装** - 支持多个软件同时安装
- 🎨 **现代 UI** - 基于 Element Plus 的精美界面

---

## 📸 软件截图

<!-- 未来可添加软件截图 -->

---

## 🛠️ 支持的软件

### 🔧 基础工具
| 软件 | 描述 |
|------|------|
| Homebrew | macOS 必装软件包管理器 |
| Git | 现代版本控制系统 |
| Docker | 容器化开发与运行环境 |
| iTerm2 | 强大的终端模拟器 |
| Postman | API 开发和测试工具 |
| Figma | 协作式界面设计工具 |
| Slack | 团队协作和沟通工具 |

### 📝 编程语言
| 软件 | 描述 |
|------|------|
| Node.js 20 | JavaScript 运行时环境 (LTS) |
| Python 3.11 | Python 编程语言 |
| Go | Google 开发的编程语言 |
| Java (OpenJDK 17) | Java 开发工具包 |
| Rust | Rust 系统编程语言 |

### 🗄️ 数据库
| 软件 | 描述 |
|------|------|
| PostgreSQL 15 | PostgreSQL 关系型数据库 |
| MySQL | MySQL 关系型数据库 |
| Redis | Redis 内存数据库 |
| MongoDB | MongoDB NoSQL 数据库 |

### 💻 开发工具 (IDE)
| 软件 | 描述 |
|------|------|
| Visual Studio Code | 流行的代码编辑器 |
| WebStorm | JetBrains JavaScript IDE |
| IntelliJ IDEA CE | JetBrains Java IDE (社区版) |
| Sublime Text | Sublime Text 文本编辑器 |

---

## 🚀 快速开始

### 1. 前置要求

- **操作系统**: macOS (Intel 或 Apple Silicon)
- **Node.js**: v18.0.0 或更高版本
- **包管理器**: npm 或 pnpm (推荐)

### 2. 克隆项目

```bash
git clone https://github.com/Gary-zy/dev-env-installer.git
cd dev-env-installer
```

### 3. 安装依赖

```bash
# 使用 npm
npm install

# 或使用 pnpm (推荐)
pnpm install
```

### 4. 启动开发模式

```bash
npm run electron:dev
```

此命令会同时启动 Vite 开发服务器和 Electron 应用。

### 5. 构建生产版本

```bash
npm run build
```

构建完成后，安装包会生成在 `release/` 目录下。

---

## 📂 项目结构

```
dev-env-installer/
├── packages/
│   ├── main/           # Electron 主进程
│   │   ├── config.ts   # 软件配置列表
│   │   ├── index.ts    # 主进程入口
│   │   └── types.ts    # 类型定义
│   ├── preload/        # 预加载脚本 (IPC 桥接)
│   └── renderer/       # Vue 3 渲染进程 (UI)
│       ├── src/
│       │   ├── components/  # Vue 组件
│       │   ├── stores/      # Pinia 状态管理
│       │   └── App.vue      # 应用入口组件
│       └── index.html
├── dist/               # 编译产物
├── release/            # 打包后的安装包
├── electron-builder.json  # Electron 打包配置
├── vite.config.ts      # Vite 配置
├── tailwind.config.js  # Tailwind CSS 配置
└── package.json
```

---

## 🔧 技术栈

| 分类 | 技术 |
|------|------|
| **框架** | Electron 28 |
| **前端** | Vue 3 + TypeScript |
| **构建工具** | Vite 5 |
| **状态管理** | Pinia |
| **UI 组件** | Element Plus |
| **样式** | Tailwind CSS |
| **终端模拟** | xterm.js |
| **进程管理** | node-pty |
| **打包工具** | electron-builder |

---

## ⚙️ 自定义配置

### 添加新软件

编辑 `packages/main/config.ts` 文件，在 `MARKETPLACE_PACKAGES` 数组中添加新的软件配置：

```typescript
{
  name: 'your-package',           // 软件名称
  description: '软件描述',         // 软件描述
  category: 'tool',               // 分类: tool | language | database | ide
  installCmd: 'brew install xxx', // 安装命令
  uninstallCmd: 'brew uninstall xxx', // 卸载命令
  checkCmd: 'xxx --version',      // 检测命令
  status: 'missing',              // 默认状态
  isCask: false                   // 是否为 Cask 应用
}
```

### 软件分类

| 分类 | 说明 |
|------|------|
| `language` | 编程语言 |
| `database` | 数据库 |
| `ide` | 开发工具 |
| `tool` | 实用工具 |

---

## 📋 开发命令

```bash
# 启动开发模式
npm run electron:dev

# 仅启动 Vite 开发服务器
npm run dev

# 类型检查 + 构建
npm run build:check

# 构建生产版本
npm run build

# 预览 Vite 构建结果
npm run preview
```

---

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m '添加某个功能'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

---

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。

---

## 🙏 致谢

- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Homebrew](https://brew.sh/) - macOS 软件包管理器
- [Element Plus](https://element-plus.org/) - Vue 3 组件库

---

**由 [Gary-zy](https://github.com/Gary-zy) 开发维护** ❤️
