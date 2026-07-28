# 任务列表

- [x] 任务 1：安装测试依赖
  - [x] 1.1 添加 Vitest、React Testing Library 等依赖
  - [x] 1.2 创建 vitest.config.ts 配置文件
  - [x] 1.3 在 package.json 添加 test 脚本

- [x] 任务 2：创建工具函数测试
  - [x] 2.1 创建 utils.test.ts 测试 formatRelativeTime 函数

- [x] 任务 3：创建 Provider 测试
  - [x] 3.1 创建 fal.test.ts 测试 FalProvider
  - [x] 3.2 测试 generate 方法返回正确的 jobId
  - [x] 3.3 测试 checkStatus 方法

- [x] 任务 4：创建 Generation Store 测试
  - [x] 4.1 创建 generation-store.test.ts
  - [x] 4.2 测试 createGeneration 和 getGeneration
  - [x] 4.3 测试 updateGeneration 功能
  - [x] 4.4 测试 listGenerations 分页

- [x] 任务 5：创建 Hook 测试
  - [x] 5.1 创建 use-generation.test.tsx
  - [x] 5.2 测试 useGenerate mutation 逻辑
  - [x] 5.3 测试 useGenerationPoll 轮询逻辑

- [x] 任务 6：创建组件测试
  - [x] 6.1 创建 generate/page.test.tsx
  - [x] 6.2 测试组件渲染
  - [x] 6.3 测试用户交互（模型选择、Prompt 输入）
  - [x] 6.4 测试状态显示（空状态、生成中、完成）

# 任务依赖
- 任务 1 必须在所有其他任务之前完成
- 任务 2、3、4 可以并行进行（都依赖任务 1）
- 任务 5 依赖任务 3 和 4（因为 Hook 依赖这些功能）
- 任务 6 依赖任务 5
