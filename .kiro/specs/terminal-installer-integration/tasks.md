# Implementation Plan: Terminal Installer Integration

## Overview

本实现计划将三个核心模块（真实终端集成、智能进度条、安装后环境注入）的设计转化为可执行的编码任务。任务按照依赖关系排序，确保每个步骤都能在前一步的基础上构建。

## Tasks

- [x] 1. 增强 BrewCommandExecutor 的日志流式传输
  - [x] 1.1 确保 spawn 配置正确设置 FORCE_COLOR 和 stdio pipes
    - 验证 spawn 选项包含 `env: { ...process.env, FORCE_COLOR: 'true' }`
    - 验证 stdio 配置为 `['ignore', 'pipe', 'pipe']`
    - _Requirements: 1.1, 1.4_
  - [x] 1.2 优化 stdout/stderr 数据发送到 installation:log 通道
    - 确保 LogData 接口包含 id, text, type, timestamp 字段
    - 区分 stdout 和 stderr 的 type 值
    - _Requirements: 1.2, 1.5_
  - [ ]* 1.3 编写 Log Forwarding 属性测试
    - **Property 1: Log Data Forwarding**
    - **Validates: Requirements 1.2**

- [x] 2. 完善进度解析状态机
  - [x] 2.1 增强 parseProgress 函数支持所有关键词
    - 添加 "Fetching" 关键词支持（downloading 状态）
    - 确保 "Unpacking"/"Extracting" 返回 75% 进度
    - 确保 "Linking"/"Symlinking" 返回 90% 进度
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 2.2 实现百分比提取逻辑
    - 使用正则表达式 `/(\d+)%/` 提取百分比
    - 在 downloading 状态时返回提取的百分比值
    - _Requirements: 2.7_
  - [ ]* 2.3 编写 Progress Parsing 属性测试
    - **Property 2: Progress Parsing Consistency**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.7**

- [x] 3. Checkpoint - 确保主进程日志和进度功能正常
  - 运行现有测试确保无回归
  - 如有问题请询问用户

- [x] 4. 优化 useInstaller Composable
  - [x] 4.1 确保 onTerminalData 回调正确处理 LogData
    - 从 installation:log 通道接收数据
    - 转换为 LogEntry 格式（text, time, isError）
    - 根据 type === 'stderr' 设置 isError
    - _Requirements: 1.3, 1.5_
  - [x] 4.2 实现环境注入弹窗触发逻辑
    - 在 handleProgress 中检测 completed 状态
    - 检查 currentSoftware.envPath 是否存在
    - 设置 showEnvInjectDialog = true
    - _Requirements: 3.1_
  - [ ]* 4.3 编写 Env Dialog Trigger 属性测试
    - **Property 3: Env Dialog Trigger Condition**
    - **Validates: Requirements 3.1**

- [x] 5. 完善 XtermTerminal 组件
  - [x] 5.1 验证终端配置符合设计规范
    - 确认字体配置使用 JetBrains Mono 等 monospace 字体
    - 确认主题背景色为 #09090b
    - 确认 scrollback 至少 1000 行
    - 确认加载 FitAddon 和 WebLinksAddon
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6_
  - [x] 5.2 优化日志写入逻辑
    - 确保 ANSI 颜色代码被正确渲染
    - 为 stderr 日志添加红色前缀
    - _Requirements: 1.3, 1.5_
  - [x] 5.3 实现清除按钮功能
    - 调用 terminal.clear()
    - 显示 "Terminal Cleared" 消息
    - _Requirements: 5.5_

- [x] 6. 完善 ProgressBar 组件
  - [x] 6.1 确保状态样式正确映射
    - downloading: 蓝色 + indeterminate 动画
    - installing: 绿色 + 具体百分比
    - completed: 绿色 + 100%
    - failed: 红色
    - _Requirements: 2.1, 2.5, 2.6_
  - [x] 6.2 实现 indeterminate 动画
    - 当 progress 为 undefined 且状态为 downloading 时显示动画
    - 使用 CSS shimmer 动画效果
    - _Requirements: 2.1_

- [x] 7. Checkpoint - 确保前端组件功能正常
  - 运行现有测试确保无回归
  - 如有问题请询问用户

- [x] 8. 完善 ShellConfigManager 的幂等性
  - [x] 8.1 增强 pathExistsInConfig 检查逻辑
    - 检查多种 PATH 格式：`export PATH="path:$PATH"`, `export PATH="$PATH:path"`
    - 处理路径末尾斜杠的情况
    - _Requirements: 3.4_
  - [x] 8.2 确保 addPathToConfig 添加注释标记
    - 在 export 行前添加 `# Added by Dev Env Installer`
    - _Requirements: 3.5_
  - [ ]* 8.3 编写 Path Idempotency 属性测试
    - **Property 4: Path Idempotency**
    - **Validates: Requirements 3.4**

- [x] 9. 完善 EnvInjectDialog 组件
  - [x] 9.1 确保弹窗显示正确信息
    - 显示软件名称和路径
    - 显示操作结果消息
    - _Requirements: 3.2_
  - [x] 9.2 实现确认和取消按钮逻辑
    - 确认：调用 injectEnv IPC，成功后 1.5 秒自动关闭
    - 取消：直接关闭弹窗，不修改文件
    - _Requirements: 3.3, 3.6, 3.7_

- [x] 10. 验证 IPC 通道配置
  - [x] 10.1 确保 preload 脚本暴露所有必要 API
    - onTerminalData, onInstallationProgress, injectEnv, removeListeners
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 10.2 确保 useInstaller 正确清理监听器
    - 在 onBeforeUnmount 中调用 removeListeners
    - _Requirements: 4.5_

- [x] 11. Final Checkpoint - 完整功能验证
  - 确保所有测试通过
  - 如有问题请询问用户

## Notes

- 任务标记 `*` 的为可选测试任务，可跳过以加快 MVP 开发
- 每个任务都引用了具体的需求条款以便追溯
- Checkpoint 任务用于阶段性验证，确保增量开发的稳定性
- 属性测试使用 fast-check 库，每个测试至少运行 100 次迭代
