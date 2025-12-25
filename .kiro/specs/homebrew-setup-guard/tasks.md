# Implementation Plan: Homebrew Setup Guard

## Overview

本实现计划将 Homebrew 检查与强制安装流程的设计转化为可执行的编码任务。任务按照依赖关系排序，确保每个步骤都能在前一步的基础上构建。实现使用 TypeScript，前端使用 Vue 3 + Pinia。

## Tasks

- [x] 1. 添加 node-pty 依赖并配置
  - [x] 1.1 安装 node-pty 依赖
    - 运行 `pnpm add node-pty`
    - 确保 electron-builder 配置正确处理 native 模块
    - _Requirements: 4.1_
  - [x] 1.2 更新 vite.config.ts 配置
    - 确保 node-pty 被正确排除在 renderer bundle 之外
    - 配置 electron main 进程正确加载 native 模块
    - _Requirements: 4.1_

- [x] 2. 实现 HomebrewService 核心功能
  - [x] 2.1 创建 HomebrewService.ts 文件
    - 在 `packages/main/services/` 目录下创建
    - 定义 `BrewCheckResult`、`MirrorSource`、`BrewInstallResult` 接口
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 2.2 实现 checkInstalled 方法
    - 检查 `/opt/homebrew/bin/brew` (Apple Silicon)
    - 检查 `/usr/local/bin/brew` (Intel Mac)
    - 返回 `BrewCheckResult` 对象
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [x] 2.3 编写 checkInstalled 属性测试
    - **Property 1: Brew Path Detection Correctness**
    - **Validates: Requirements 1.3, 1.4**
  - [x] 2.4 实现 buildInstallCommand 方法
    - 支持 official、tsinghua、ustc 三种源
    - 为镜像源设置正确的环境变量
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 2.5 编写 buildInstallCommand 属性测试
    - **Property 4: Mirror Source Command Generation**
    - **Validates: Requirements 3.4**

- [x] 3. 实现 PTY 交互式安装
  - [x] 3.1 实现 startInstall 方法
    - 使用 node-pty 创建交互式终端会话
    - 配置正确的环境变量和终端参数
    - 转发 PTY 输出到渲染进程
    - _Requirements: 4.1, 4.2, 4.6_
  - [x] 3.2 实现 sendInput 方法
    - 接收渲染进程的用户输入
    - 转发到 PTY 进程
    - _Requirements: 4.3, 4.4, 4.5_
  - [x] 3.3 实现 killInstall 方法
    - 终止 PTY 进程
    - 清理资源
    - _Requirements: 5.4_
  - [x] 3.4 编写 PTY 数据转发属性测试
    - **Property 5: PTY Data Forwarding**
    - **Validates: Requirements 4.2**

- [x] 4. Checkpoint - 确保主进程 HomebrewService 功能正常
  - 手动测试 checkInstalled 方法
  - 如有问题请询问用户

- [x] 5. 配置 IPC 通道
  - [x] 5.1 在主进程注册 IPC handlers
    - 注册 `brew:check-installed` handler
    - 注册 `brew:install` handler
    - 注册 `brew:input` handler
    - _Requirements: 7.1, 7.2, 7.4_
  - [x] 5.2 更新 preload 脚本
    - 暴露 `checkBrewInstalled()` 方法
    - 暴露 `installBrew(source)` 方法
    - 暴露 `sendBrewInput(data)` 方法
    - 暴露 `onBrewInstallData(callback)` 监听器
    - 暴露 `onBrewInstallComplete(callback)` 监听器
    - 暴露 `removeBrewListeners()` 清理方法
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 6. 扩展 System Store
  - [x] 6.1 添加 Homebrew 相关状态
    - 添加 `isBrewInstalled: boolean`
    - 添加 `isBrewChecking: boolean`
    - 添加 `isBrewInstalling: boolean`
    - 添加 `brewInstallError: string | null`
    - _Requirements: 2.1_
  - [x] 6.2 实现 checkBrewStatus action
    - 调用 `checkBrewInstalled()` IPC
    - 更新 `isBrewInstalled` 状态
    - _Requirements: 2.1_
  - [x] 6.3 实现 startBrewInstall action
    - 调用 `installBrew(source)` IPC
    - 更新 `isBrewInstalling` 状态
    - _Requirements: 2.5_
  - [x] 6.4 实现 handleBrewInstallComplete action
    - 处理安装完成事件
    - 更新状态并处理错误
    - _Requirements: 5.2, 5.4_
  - [x] 6.5 编写状态转换属性测试
    - **Property 3: State Transition on Installation Success**
    - **Validates: Requirements 2.4, 5.2**

- [x] 7. Checkpoint - 确保 Store 和 IPC 功能正常
  - 验证状态更新正确
  - 如有问题请询问用户

- [x] 8. 创建 HomebrewWelcome 组件
  - [x] 8.1 创建组件基础结构
    - 在 `packages/renderer/src/components/` 创建 `HomebrewWelcome.vue`
    - 实现全屏居中布局
    - 添加欢迎标题和说明文字
    - _Requirements: 6.1, 6.2, 6.7_
  - [x] 8.2 实现源选择器
    - 添加 Radio Group 组件
    - 支持 Official、Tsinghua、USTC 三个选项
    - 默认选中 Tsinghua（国内用户推荐）
    - _Requirements: 6.3_
  - [x] 8.3 实现安装按钮
    - 添加 "Install Homebrew" 按钮
    - 点击时调用 store.startBrewInstall()
    - 安装中显示 loading 状态
    - _Requirements: 6.4, 6.6_
  - [x] 8.4 集成 Xterm 终端
    - 安装开始后显示终端区域
    - 监听 `onBrewInstallData` 写入终端
    - 监听终端输入并调用 `sendBrewInput`
    - _Requirements: 6.5, 4.2, 4.3_
  - [x] 8.5 实现安装完成处理
    - 监听 `onBrewInstallComplete` 事件
    - 成功时显示成功消息
    - 失败时显示错误消息和重试按钮
    - _Requirements: 5.3, 5.4, 5.5_

- [x] 9. 实现 App.vue 守卫逻辑
  - [x] 9.1 修改 App.vue 模板
    - 添加条件渲染逻辑
    - 当 `!isBrewInstalled && !isBrewChecking` 时显示 HomebrewWelcome
    - 否则显示正常的侧边栏和主内容
    - _Requirements: 2.2, 2.3_
  - [x] 9.2 修改 init 流程
    - 在 `store.init()` 开始时调用 `checkBrewStatus()`
    - 只有 `isBrewInstalled` 为 true 时才继续初始化其他内容
    - _Requirements: 2.1_
  - [x] 9.3 编写 UI 守卫属性测试
    - **Property 2: UI Guard State Consistency**
    - **Validates: Requirements 2.2, 2.3**

- [x] 10. Checkpoint - 确保完整流程正常
  - 测试 Homebrew 未安装时的引导流程
  - 测试安装完成后的自动跳转
  - 如有问题请询问用户

- [x] 11. 清理和优化
  - [x] 11.1 添加类型定义
    - 更新 `electron-api.d.ts` 添加新的 API 类型
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  - [x] 11.2 添加组件卸载清理
    - 在 HomebrewWelcome 的 `onBeforeUnmount` 中调用 `removeBrewListeners()`
    - _Requirements: 7.5_

- [x] 12. Final Checkpoint - 完整功能验证
  - 确保所有测试通过
  - 验证完整的用户流程
  - 如有问题请询问用户

## Notes

- 每个任务都引用了具体的需求条款以便追溯
- Checkpoint 任务用于阶段性验证，确保增量开发的稳定性
- 属性测试使用 fast-check 库，每个测试至少运行 100 次迭代
- node-pty 是 native 模块，需要确保 electron-builder 正确处理
