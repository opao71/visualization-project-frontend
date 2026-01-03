# 登峰叙事页面使用指南

## 项目改造完成

已成功创建"登峰"主题的滚动叙事页面，使用 GSAP ScrollTrigger 实现动态效果。

## 页面结构

### 1. 路由配置
- **`/summit`** - 登峰叙事页（新页面，默认首页）
- **`/dashboard`** - 原仪表盘页面（保留）

### 2. 新增文件
- `src/router/index.js` - 路由配置
- `src/pages/SummitStory.vue` - 登峰滚动叙事页
- `src/pages/Dashboard.vue` - 原仪表盘页面（从 App.vue 迁移）

### 3. 修改文件
- `src/App.vue` - 改为路由容器，添加顶部导航
- `src/main.js` - 引入 vue-router

## 登峰叙事页面分段

### Section 0: Hero / Base Camp（开场）
- 大标题 + 副标题
- 3个统计卡片（当前海拔/稳定性/练习强度）
- 滚动提示动画

### Section 1: Route（登山路线）
- 复用 `GreenLarge` 组件（桑基图）
- 叙事：路线分流，从起点到各知识营地

### Section 2: Terrain（地形热力图）
- 复用 `PinkHeatmap` 组件
- 叙事：题目与知识点匹配度的地形分布

### Section 3: Cliffs（风险落石区）
- 复用 `PinkBubbles` 组件
- 叙事：题目综合表现，气泡大小=分值，颜色=提交量

### Section 4: Learning Mode（学习模式）
- 复用 `GreenBox2` 组件
- 叙事：不同维度的学习行为模式

### Section 5: Trends（攀登轨迹）
- 复用 `PinkStateTrends` 组件
- 叙事：答题状态变化趋势

### Section 6: Compass（能力罗盘）
- 复用 `BlueBox1` + `BlueBox2` 组件
- 叙事：多维度学习特征与时间分布

### Section 7: Summit Plan（登顶计划）
- 3个建议卡片：优先强化/稳定提升/持续攀登

## 视觉设计特点

### 配色方案
- **背景**：深蓝黑渐变 (`#0a0e27` → `#1a1f3a` → `#0f1419`)
- **主色**：冰蓝 (`#64b5f6`, `#42a5f5`)
- **文字**：浅灰 (`#e5e7eb`, `#9ca3af`)
- **卡片**：玻璃拟态（半透明 + 模糊 + 细边框）

### 动效实现
- **GSAP ScrollTrigger**：每个 section 进入视口时淡入 + 上移
- **Hero 动画**：开场内容渐显
- **控制栏**：滚动后背景加深
- **悬停效果**：卡片上移 + 边框高亮

## 使用方式

### 启动项目
```bash
cd visualization-project-frontend
npm install
npm run serve
```

### 访问页面
- 登峰叙事：http://localhost:8080/summit
- 原仪表盘：http://localhost:8080/dashboard

### 切换页面
点击顶部导航栏的"登峰叙事"或"仪表盘"按钮

## 技术栈

- **Vue 3** - 前端框架
- **Vue Router 4** - 路由管理
- **GSAP + ScrollTrigger** - 滚动动效
- **ECharts** - 图表库（复用现有组件）
- **Axios** - 数据请求

## 后续优化建议

1. **Hero 统计卡片数据**：接入真实 API 计算掌握度/稳定性/练习强度
2. **背景粒子效果**：可选添加 Canvas 粒子或 Three.js 山体模型
3. **图表主题统一**：为 ECharts 创建暗色主题配置
4. **响应式优化**：针对移动端调整布局
5. **加载动画**：添加页面级加载过渡效果

## 注意事项

- 确保后端 API 服务运行在 `http://localhost:5000`
- 图表组件需要 `className` 和 `studentId` 参数才能正确加载数据
- 滚动动效依赖 GSAP，首次加载可能需要等待库加载完成
