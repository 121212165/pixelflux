# 项目测试规格

## 为什么
Pixelflux 是一个 AI 视频生成平台，需要确保核心功能的稳定性。目前项目缺少测试覆盖，无法保证代码质量和功能正确性。

## 改动内容
- 引入测试框架（Vitest）
- 配置 React Testing Library
- 为核心组件和功能编写测试
- 确保 API 路由正确性

## 影响
- 受影响的规格：所有核心功能
- 受影响的代码：
  - `src/lib/providers/` - Provider 逻辑
  - `src/hooks/use-generation.ts` - 状态管理
  - `src/app/generate/page.tsx` - 生成页面组件
  - API 路由

## 新增需求
### 需求：单元测试
系统应提供核心业务逻辑的单元测试。

#### 场景：Provider 生成逻辑测试
- **给定** FalProvider 配置正确
- **当** 调用 generate 方法时
- **则** 应返回 jobId 并正确记录任务状态

#### 场景：Generation Store 测试
- **给定** 新的生成记录
- **当** 调用 createGeneration 时
- **则** 应正确存储并可通过 getGeneration 检索

#### 场景：Hook 测试
- **给定** useGenerate hook
- **当** mutation 成功时
- **则** 应设置 activeId 为返回的生成 ID

### 需求：组件测试
系统应提供关键 UI 组件的渲染测试。

#### 场景：生成页面渲染
- **给定** 用户访问 /generate
- **则** 应显示模型选择器、Prompt 输入框和参数控制

#### 场景：空状态显示
- **给定** 没有 activeId 和 mutation 未进行
- **则** 应显示"输入 prompt 开始"的提示

## 修改需求
无

## 移除需求
无
