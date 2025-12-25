# Implementation Plan: Software Detection Improvement

## Overview

本实现计划将多策略软件检测机制分解为可执行的编码任务。实现顺序遵循自底向上的原则：先实现基础策略，再实现检测器，最后集成到现有系统。

## Tasks

- [x] 1. 创建检测策略接口和类型定义
  - 在 `packages/main/services/detection/` 目录下创建类型定义文件
  - 定义 `DetectionResult`、`DetectionStrategy`、`PackageDetectionConfig` 接口
  - _Requirements: 1.1_

- [x] 2. 实现 BinaryStrategy
  - [x] 2.1 创建 `BinaryStrategy` 类实现文件存在检测
    - 实现 `detect()` 方法检查配置的路径
    - 实现路径展开（~ 替换为 HOME）
    - 实现文件可执行权限检查
    - _Requirements: 3.1, 3.4, 3.5_
  
  - [x] 2.2 编写 BinaryStrategy 属性测试
    - **Property 4: Binary Existence Detection**
    - **Validates: Requirements 3.4, 3.5**

- [x] 3. 实现 HomebrewStrategy
  - [x] 3.1 创建 `HomebrewStrategy` 类实现 Homebrew 检测
    - 实现 brew 路径查找（/opt/homebrew/bin/brew, /usr/local/bin/brew）
    - 实现 `brew list` 命令执行
    - 实现版本信息提取
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 6.2, 6.3_
  
  - [x] 3.2 编写 HomebrewStrategy 属性测试
    - **Property 3: Homebrew Command Result Interpretation**
    - **Validates: Requirements 2.3, 2.4**

- [x] 4. 实现 CommandStrategy
  - [x] 4.1 创建 `CommandStrategy` 类实现命令执行检测
    - 实现带扩展 PATH 的命令执行
    - 实现 5 秒超时处理
    - 实现版本正则提取
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [x] 4.2 编写 CommandStrategy 属性测试
    - **Property 5: Command Execution Result Interpretation**
    - **Validates: Requirements 4.2, 4.3**

- [x] 5. 实现 DetectionCache
  - [x] 5.1 创建 `DetectionCache` 类实现缓存机制
    - 实现带 TTL 的缓存存取
    - 实现缓存失效方法
    - 默认 TTL 60 秒
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [x] 5.2 编写 DetectionCache 属性测试
    - **Property 8: Cache Behavior**
    - **Validates: Requirements 7.1, 7.2**

- [x] 6. 实现 SoftwareDetector 主服务
  - [x] 6.1 创建 `SoftwareDetector` 类协调多策略检测
    - 实现策略注册和执行顺序
    - 实现缓存集成
    - 实现软件包配置管理
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [x] 6.2 编写 SoftwareDetector 属性测试
    - **Property 1: Detection Result Aggregation**
    - **Property 2: Strategy Execution Order**
    - **Validates: Requirements 1.2, 1.3, 1.4**

- [x] 7. Checkpoint - 确保所有测试通过
  - 运行所有单元测试和属性测试
  - 确保所有测试通过，如有问题请询问用户

- [x] 8. 创建软件包检测配置
  - [x] 8.1 创建 `PackageDetectionConfigs` 配置文件
    - 配置 Homebrew 检测路径
    - 配置 Node.js 检测路径（包括 FNM、NVM）
    - 配置其他软件包的检测路径和命令
    - _Requirements: 3.2, 3.3, 5.1, 5.2, 5.3, 6.1_

- [x] 9. 集成到现有系统
  - [x] 9.1 修改 `BrewCommandExecutor.checkInstalled()` 使用新检测器
    - 替换原有的 `brew list` 检测逻辑
    - 保持 API 兼容性
    - _Requirements: 1.1, 1.2_
  
  - [x] 9.2 修改 IPC handlers 集成缓存失效
    - 在安装/卸载完成后失效缓存
    - _Requirements: 7.3_

- [x] 10. 更新 Homebrew 自身检测
  - [x] 10.1 修改 `HomebrewService.checkInstalled()` 使用新检测器
    - 确保 Homebrew 检测优先使用文件路径检查
    - _Requirements: 6.1, 6.4, 6.5_

- [x] 11. Final Checkpoint - 确保所有测试通过
  - 运行完整测试套件
  - 手动验证应用商店显示正确的安装状态
  - 确保所有测试通过，如有问题请询问用户

## Notes

- 所有任务都是必须完成的，包括测试任务
- 每个任务都引用了具体的需求以便追溯
- 检查点任务用于确保增量验证
- 属性测试验证通用正确性属性
- 单元测试验证具体示例和边界情况
