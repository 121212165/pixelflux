# 检查清单

## 测试基础设施
- [x] Vitest 配置正确创建并可运行
- [x] 测试脚本 `npm test` 可正常执行
- [x] 所有测试依赖正确安装

## 工具函数测试
- [x] utils.test.ts 存在且测试通过
- [x] formatRelativeTime 函数被正确测试

## Provider 测试
- [x] fal.test.ts 存在且测试通过
- [x] FalProvider.generate 方法被正确测试
- [x] FalProvider.checkStatus 方法被正确测试
- [x] Mock 模式被正确测试

## Generation Store 测试
- [x] generation-store.test.ts 存在且测试通过
- [x] createGeneration 功能被正确测试
- [x] getGeneration 功能被正确测试
- [x] updateGeneration 功能被正确测试
- [x] listGenerations 分页功能被正确测试
- [x] deleteGeneration 功能被正确测试

## Hook 测试
- [x] use-generation.test.tsx 存在且测试通过
- [x] useGenerate mutation 成功时设置 activeId
- [x] useGenerationPoll 正确处理 refetchInterval
- [x] API 调用被正确 mock

## 组件测试
- [x] generate/page.test.tsx 存在且测试通过
- [x] 模型选择器正确渲染
- [x] Prompt 输入框正确渲染
- [x] 参数控制（时长、比例、风格）正确渲染
- [x] 空状态正确显示
- [x] 生成状态正确显示
- [x] 按钮交互正确响应

## 代码质量
- [x] 所有测试通过（48 个测试，0 个失败）
- [x] 没有 TypeScript 类型错误
- [x] 测试覆盖率合理（核心业务逻辑已覆盖）
