# 套餐卡管理小程序产品需求文档（PRD）

## 1. 产品概述

### 1.1 产品名称
**卡点**

### 1.2 产品定位
专门为个人消费者管理各类多次消费套餐卡的微信小程序，解决用户忘记使用次数和过期浪费的痛点。

### 1.3 目标用户
- 主要用户：25-45岁有一定消费能力的城市白领、宝妈群体
- 使用场景：美容院、健身房、培训机构、儿童教育等套餐卡消费

### 1.4 核心价值
- 精准记录套餐卡使用情况
- 智能到期提醒，避免浪费
- 简单易用，专注解决单一痛点

## 2. 用户需求分析

### 2.1 用户痛点
| 痛点 | 具体表现 | 影响程度 |
|------|----------|----------|
| 忘记使用次数 | 不记得已经用了几次，心里没数 | 高 |
| 套餐过期浪费 | 忙碌中忘记到期时间，钱白花 | 高 |
| 管理混乱 | 多张卡片管理困难，找不到 | 中 |
| 缺乏提醒 | 没有主动提醒机制 | 高 |

### 2.2 用户故事
- 作为一个忙碌的上班族，我希望能随时查看我的美容院护肤卡还剩几次，这样我可以合理安排使用
- 作为一个宝妈，我希望在孩子的游泳课套餐快到期时收到提醒，避免浪费钱
- 作为一个健身爱好者，我希望能统一管理我的各种健身卡和课程包

## 3. 产品功能规划

### 3.1 MVP版本功能清单

#### 3.1.1 核心功能
**套餐卡管理**
- 新增套餐卡
  - 输入：卡片名称、商家名称、总次数、已用次数、购买日期、到期日期
  - 支持拍照上传卡片图片（可选）
- 编辑套餐卡信息
- 删除套餐卡

**使用记录**
- 一键记录使用（+1次）
- 撤销上次记录（容错机制）
- 使用历史记录查看

**提醒系统**
- 到期前30天/15天/7天/1天提醒
- 剩余次数少于3次时提醒
- 微信小程序消息推送

#### 3.1.2 基础功能
**首页展示**
- 套餐卡列表展示
- 快到期卡片优先显示（红色标识）
- 剩余次数一目了然
- 使用进度条显示

**分类管理**
- 预设分类：美容美发、健身运动、教育培训、餐饮娱乐、其他
- 支持自定义分类

### 3.2 V1.1版本规划功能
- 使用统计图表
- 分享给家人功能
- 数据导出功能
- 更丰富的提醒设置

### 3.3 V2.0版本规划功能
- 附近商家推荐
- 团购功能集成
- 社交分享功能

## 4. 产品架构设计

### 4.1 信息架构
```
首页
├── 快到期提醒区域
├── 套餐卡列表
│   ├── 按分类筛选
│   ├── 按状态筛选（进行中/即将到期/已过期）
│   └── 搜索功能
├── 新增按钮（+）
└── 我的
    ├── 设置
    ├── 提醒设置
    ├── 数据统计
    └── 关于我们
```

### 4.2 数据结构设计
```json
PackageCard {
  id: string,
  name: string,          // 套餐名称
  merchant: string,      // 商家名称
  category: string,      // 分类
  totalCount: number,    // 总次数
  usedCount: number,     // 已使用次数
  purchaseDate: date,    // 购买日期
  expireDate: date,      // 到期日期
  imageUrl: string,      // 卡片图片（可选）
  notes: string,         // 备注
  createdAt: date,
  updatedAt: date
}

UsageRecord {
  id: string,
  cardId: string,        // 关联套餐卡ID
  usageDate: date,       // 使用日期
  notes: string,         // 使用备注
  createdAt: date
}
```

## 5. 用户体验设计

### 5.1 品牌视觉设计

#### 5.1.1 配色系统
**主色调：#FCC96E（姜黄色）**
- 应用于：头部导航、主要按钮、进度条、活跃状态
- 寓意：积极、温暖、活力，体现记录每一次消费的正面态度

**辅色1：#FFF2DF（浅姜黄色）**
- 应用于：整体背景、卡片背景、按钮文字
- 寓意：简洁、纯净，营造舒适的使用体验

**辅色2：#156D57（深绿色）**
- 应用于：文字和强调色、按钮文字、重要信息、导航栏标题
- 寓意：稳重、可靠，与姜黄色形成良好对比

**字体色：#020100（深黑色）**
- 应用于：标题、正文、重要信息
- 优势：与浅姜黄背景形成高对比度，确保最佳可读性

**警示色：#FF4444（红色）**
- 应用于：到期提醒、重要警告信息
- 功能：引起用户注意，避免套餐浪费

#### 5.1.2 视觉风格
- **现代简约**：采用渐变色和玻璃质感，体现现代设计趋势
- **温暖亲和**：姜黄色系配色降低使用门槛，增加产品亲和力
- **层次分明**：通过透明度和阴影营造空间层次感
- **品牌识别**：独特的姜黄色主色调增强品牌记忆点
- **对比鲜明**：深绿色强调色与姜黄色形成良好对比，提升可读性

### 5.2 界面布局设计

#### 5.2.1 首页布局结构
```
┌─────────────────────────────────────┐
│           状态栏（姜黄色渐变）           │
├─────────────────────────────────────┤
│              头部区域                │
│  ┌─────────────────────────────────┐ │
│  │   Logo + 搜索   │   品牌标语     │ │
│  ├─────────────────────────────────┤ │
│  │           统计卡片              │ │
│  │   总卡片 | 即将到期 | 剩余次数    │ │
│  └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│              快捷操作区               │
│  [添加] [拍照] [提醒] [统计]         │
├─────────────────────────────────────┤
│              卡片列表区               │
│  筛选标签: [全部] [即将到期] [美容]   │
│  ┌─────────────────────────────────┐ │
│  │        套餐卡片项目1             │ │
│  │  卡片信息 + 进度条 + 操作按钮     │ │
│  ├─────────────────────────────────┤ │
│  │        套餐卡片项目2             │ │
│  └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│          浮动添加按钮 (+)            │
│          底部导航栏                 │
└─────────────────────────────────────┘
```

#### 5.2.2 关键组件设计

**统计卡片**
- 半透明玻璃质感背景
- 三等分布局：总卡片数 | 即将到期 | 剩余次数
- 大号数字 + 小号标签的信息层次

**套餐卡片项目**
- 圆角矩形卡片设计
- 左侧信息区 + 右侧分类标签
- 进度条可视化使用情况
- 底部双按钮操作区

**快捷操作按钮**
- 4×1网格布局
- 图标 + 文字标签组合
- 姜黄色系渐变图标背景
- 悬停微动画效果

### 5.3 交互体验设计

#### 5.3.1 关键页面流程
1. **新增套餐卡流程**：
   - 点击浮动按钮(+) → 填写表单页面 → 可选拍照上传 → 确认保存
   - 交互反馈：表单验证、保存成功提示、返回首页刷新

2. **记录使用流程**：
   - 卡片上点击"记录使用" → 按钮变绿显示"已记录" → 1秒后恢复 → 数据更新
   - 支持撤销：长按按钮可撤销最近一次记录

3. **查看详情流程**：
   - 点击卡片或"详情"按钮 → 详情页面 → 显示完整信息和使用历史

#### 5.3.2 界面交互细节

**微动画设计**
- 卡片悬停时轻微上浮(translateY(-1px))
- 按钮点击时下沉效果和阴影变化
- 进度条填充动画(0.3s缓动)
- 页面切换时淡入淡出效果

**状态反馈**
- 即将到期卡片：红色左边框 + 渐变背景警示
- 使用记录成功：按钮变绿 + 文字变化
- 数据加载：骨架屏占位 + 加载动画
- 网络错误：友好错误提示 + 重试按钮

**手势操作**
- 下拉刷新：更新卡片数据
- 上拉加载：支持大量卡片分页加载
- 左滑操作：快速删除或编辑卡片(V1.1功能)

### 5.4 响应式设计

#### 5.4.1 屏幕适配
- **主要适配**：iPhone标准尺寸 375×812px
- **兼容性**：支持安卓主流分辨率自动缩放
- **安全区域**：考虑刘海屏和底部手势条适配

#### 5.4.2 字体和间距系统
```css
/* 字体大小系统 */
.text-xs    { font-size: 11px; }  /* 辅助文字 */
.text-sm    { font-size: 12px; }  /* 标签文字 */
.text-base  { font-size: 14px; }  /* 正文 */
.text-lg    { font-size: 16px; }  /* 标题 */
.text-xl    { font-size: 18px; }  /* 大标题 */
.text-2xl   { font-size: 24px; }  /* 统计数字 */

/* 间距系统 */
.space-xs   { margin: 4px; }
.space-sm   { margin: 8px; }
.space-md   { margin: 16px; }
.space-lg   { margin: 20px; }
.space-xl   { margin: 24px; }
```

### 5.5 无障碍设计

#### 5.5.1 可访问性考虑
- **颜色对比度**：主要文字与背景对比度 > 4.5:1
- **字体大小**：最小字体不低于11px，重要信息不低于14px
- **点击区域**：按钮最小点击区域44×44px
- **语义化**：重要信息提供语音朗读支持

#### 5.5.2 特殊场景适配
- **弱视用户**：支持系统字体大小调整
- **老年用户**：简化操作流程，重要按钮突出显示
- **单手操作**：重要功能位于拇指可达区域

## 6. 技术实现方案

### 6.1 技术栈
- **前端**：微信小程序原生开发
- **数据存储**：V1.0本地存储 → V1.1混合存储（本地+云端）
- **后端**：V1.1版本使用 Node.js + Express 或 Python + FastAPI
- **数据库**：V1.1版本使用 MongoDB 或 MySQL
- **云服务**：腾讯云或阿里云

### 6.2 渐进式架构设计

#### 6.2.1 设计理念
采用**策略模式 + 分层架构**设计，确保V1.0快速上线，V1.1无缝升级：

**核心原则：**
- 存储抽象化：业务逻辑与存储方式解耦
- 策略可切换：不同版本使用不同存储策略
- 数据格式统一：本地与云端数据结构完全兼容
- 渐进式升级：用户无感知的功能扩展

#### 6.2.2 架构分层

```
┌─────────────────────────────────────┐
│           用户界面层 (UI)            │
├─────────────────────────────────────┤
│          业务逻辑层 (Service)         │
├─────────────────────────────────────┤
│           数据模型层 (Model)          │
├─────────────────────────────────────┤
│         存储抽象层 (Storage)          │
├─────────────────────────────────────┤
│      存储策略层 (Strategy Pattern)     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│  │ 本地存储 │ │ 云端存储 │ │ 混合存储 │ │
│  └─────────┘ └─────────┘ └─────────┘ │
└─────────────────────────────────────┘
```

#### 6.2.3 存储策略设计

**V1.0版本：LocalStorageStrategy**
```javascript
class LocalStorageStrategy {
  async save(key, data) {
    wx.setStorageSync(key, JSON.stringify(data));
  }
  
  async load(key) {
    return JSON.parse(wx.getStorageSync(key) || 'null');
  }
}
```

**V1.1版本：HybridStorageStrategy**
```javascript
class HybridStorageStrategy {
  constructor(localStrategy, cloudStrategy) {
    this.local = localStrategy;
    this.cloud = cloudStrategy;
  }
  
  async save(key, data) {
    // 本地优先，云端备份
    await this.local.save(key, data);
    if (this.syncEnabled) {
      await this.cloud.save(key, data);
    }
  }
}
```

#### 6.2.4 数据模型设计

**Card 数据模型：**
```javascript
class Card {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.name = data.name || '';
    this.merchant = data.merchant || '';
    this.category = data.category || '其他';
    this.totalCount = data.totalCount || 0;
    this.usedCount = data.usedCount || 0;
    this.purchaseDate = data.purchaseDate || new Date().toISOString();
    this.expireDate = data.expireDate || '';
    this.imageUrl = data.imageUrl || '';
    this.notes = data.notes || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }
  
  // 业务方法
  getRemainingCount() { return this.totalCount - this.usedCount; }
  getProgress() { return (this.usedCount / this.totalCount) * 100; }
  isExpiringSoon(days = 30) { /* 实现逻辑 */ }
  use() { /* 使用次数+1 */ }
  undoUse() { /* 撤销使用 */ }
}
```

#### 6.2.5 服务层设计

**CardService 业务服务：**
```javascript
class CardService {
  constructor(storageManager) {
    this.storage = storageManager; // 存储抽象，支持策略切换
  }
  
  async addCard(cardData) { /* 添加卡片逻辑 */ }
  async updateCard(cardId, updates) { /* 更新卡片逻辑 */ }
  async recordUsage(cardId) { /* 记录使用逻辑 */ }
  async getExpiringSoonCards() { /* 获取即将到期卡片 */ }
}
```

#### 6.2.6 版本升级策略

**V1.0 → V1.1 升级实现：**
```javascript
// app.js - 只需修改初始化代码
initStorage() {
  const localStrategy = new LocalStorageStrategy();
  
  // V1.0版本
  this.storageManager = new StorageManager(localStrategy);
  
  // V1.1版本升级时，只需添加以下代码：
  // const cloudStrategy = new CloudStorageStrategy(apiClient);
  // const hybridStrategy = new HybridStorageStrategy(localStrategy, cloudStrategy);
  // this.storageManager.setStrategy(hybridStrategy);
}
```

### 6.3 关键技术实现

#### 6.3.1 数据存储方案
**V1.0本地存储：**
- 使用微信小程序 `wx.setStorageSync/wx.getStorageSync`
- 数据格式：JSON字符串存储
- 存储键值：cards、usage_records、user_settings

**V1.1混合存储：**
- 本地存储作为缓存层，确保离线可用
- 云端存储作为备份层，支持多设备同步
- 冲突解决策略：本地优先/云端优先/智能合并

#### 6.3.2 提醒系统设计
```javascript
// 提醒管理器
class NotificationManager {
  async scheduleExpireReminder(card) {
    const expireDate = new Date(card.expireDate);
    const reminderDates = [
      new Date(expireDate.getTime() - 30 * 24 * 60 * 60 * 1000), // 30天前
      new Date(expireDate.getTime() - 7 * 24 * 60 * 60 * 1000),  // 7天前
      new Date(expireDate.getTime() - 1 * 24 * 60 * 60 * 1000)   // 1天前
    ];
    
    // 设置本地通知
    reminderDates.forEach(date => {
      wx.scheduleNotification({
        id: `expire_${card.id}_${date.getTime()}`,
        title: '卡点提醒',
        content: `您的${card.name}即将到期，请及时使用`,
        trigger: { type: 'timer', delay: date.getTime() - Date.now() }
      });
    });
  }
}
```

#### 6.3.3 数据迁移方案
```javascript
// 版本升级时的数据迁移
class DataMigration {
  async migrateToV11() {
    // 读取V1.0本地数据
    const localCards = await localStrategy.load('cards');
    const localUsage = await localStrategy.load('usage_records');
    
    // 上传到云端
    if (localCards) await cloudStrategy.save('cards', localCards);
    if (localUsage) await cloudStrategy.save('usage_records', localUsage);
    
    return { success: true, message: '数据迁移完成' };
  }
}
```

### 6.4 开发配置管理

```javascript
// config/app.js - 应用配置
const AppConfig = {
  version: '1.0.0',
  storage: {
    strategy: 'local', // V1.1改为'hybrid'
    keys: {
      cards: 'cards',
      usage: 'usage_records',
      settings: 'user_settings'
    }
  },
  
  features: {
    cloudSync: false,      // V1.1改为true
    socialShare: false,    // V1.2功能
    statistics: false      // V1.2功能
  },
  
  notifications: {
    expireReminders: [30, 7, 1], // 到期前提醒天数
    lowCountReminder: 3           // 剩余次数少于N次提醒
  }
};
```

## 7. 运营策略

### 7.1 推广策略
- 目标用户群体的微信群精准投放
- 与相关商家合作推广
- 朋友圈分享激励机制

### 7.2 留存策略
- 提醒功能增强用户粘性
- 简单易用降低使用门槛
- 定期功能更新

## 8. 成功指标

### 8.1 核心指标
- **用户数量**：注册用户数、活跃用户数
- **使用频率**：人均套餐卡数量、记录使用频次
- **功能效果**：提醒点击率、过期浪费减少率

### 8.2 用户体验指标
- 应用崩溃率 < 0.1%
- 页面加载速度 < 2秒
- 用户满意度评分 > 4.5/5

## 9. 风险评估

### 9.1 技术风险
- 微信小程序政策变化
- 消息推送限制
- 数据安全和隐私保护

### 9.2 市场风险
- 用户习惯培养难度
- 竞品出现
- 商业化模式不清晰

## 10. 开发时间规划

### 10.1 V1.0版本开发时间线
- **需求确认与架构设计**：1周
- **UI/UX设计**：2周  
- **核心功能开发**：4周
  - Week 1: 存储抽象层 + 数据模型
  - Week 2: 核心业务逻辑 + 服务层
  - Week 3: 页面开发 + 交互实现
  - Week 4: 提醒系统 + 功能完善
- **测试优化**：1.5周
- **上线发布**：0.5周

### 10.2 V1.1版本升级时间线（预估）
- **云端后台开发**：2周
- **混合存储策略实现**：1周
- **数据迁移功能**：0.5周
- **用户登录授权**：0.5周
- **测试与发布**：1周

### 10.3 开发里程碑
- **Week 1**: 架构设计确认，技术方案评审
- **Week 3**: UI设计稿确认，开发环境搭建
- **Week 5**: 核心功能Demo完成
- **Week 7**: MVP功能开发完成
- **Week 8**: 内测版本发布，收集反馈
- **Week 8.5**: 正式版本上线

### 10.4 开发优先级排序

**P0 - 核心功能（必须有）**
- 套餐卡增删改查
- 使用次数记录
- 本地数据存储
- 基础列表展示

**P1 - 重要功能（应该有）**
- 到期提醒推送
- 分类管理
- 使用历史记录
- 进度可视化

**P2 - 优化功能（可以有）**
- 图片上传
- 数据统计
- 搜索过滤
- 主题设置

## 13. 附录：首页UI设计实现

### 13.1 HTML结构示例

```html
<!-- 小程序页面结构 -->
<view class="container">
  <!-- 头部区域 -->
  <view class="header">
    <view class="header-top">
      <view class="logo-section">
        <text class="logo-title">卡点</text>
        <text class="logo-subtitle">让每一次消费都有记录</text>
      </view>
      <image class="search-icon" src="/images/search.png" />
    </view>
    
    <!-- 统计卡片 -->
    <view class="stats-card">
      <view class="stat-item">
        <text class="stat-number">{{totalCards}}</text>
        <text class="stat-label">总卡片</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-number">{{expiringSoon}}</text>
        <text class="stat-label">即将到期</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-number">{{remainingCount}}</text>
        <text class="stat-label">剩余次数</text>
      </view>
    </view>
  </view>
  
  <!-- 快捷操作区 -->
  <view class="quick-actions">
    <text class="section-title">快捷操作</text>
    <view class="actions-grid">
      <view class="action-item" bindtap="addCard">
        <view class="action-icon action-add">+</view>
        <text class="action-label">添加卡片</text>
      </view>
      <view class="action-item" bindtap="scanCard">
        <view class="action-icon action-scan">📷</view>
        <text class="action-label">拍照录入</text>
      </view>
      <view class="action-item" bindtap="setReminder">
        <view class="action-icon action-remind">🔔</view>
        <text class="action-label">提醒设置</text>
      </view>
      <view class="action-item" bindtap="viewStats">
        <view class="action-icon action-stats">📊</view>
        <text class="action-label">使用统计</text>
      </view>
    </view>
  </view>
  
  <!-- 卡片列表区 -->
  <view class="cards-section">
    <view class="section-header">
      <text class="section-title">我的卡片</text>
      <view class="filter-tabs">
        <text class="filter-tab {{currentFilter === 'all' ? 'active' : ''}}" 
              bindtap="filterCards" data-filter="all">全部</text>
        <text class="filter-tab {{currentFilter === 'expiring' ? 'active' : ''}}" 
              bindtap="filterCards" data-filter="expiring">即将到期</text>
        <text class="filter-tab {{currentFilter === 'beauty' ? 'active' : ''}}" 
              bindtap="filterCards" data-filter="beauty">美容</text>
      </view>
    </view>
    
    <!-- 卡片列表 -->
    <scroll-view class="cards-list" scroll-y="true">
      <view wx:for="{{filteredCards}}" wx:key="id" 
            class="card-item {{item.isExpiring ? 'expiring' : ''}}">
        <view class="card-header">
          <view class="card-info">
            <text class="card-name">{{item.name}}</text>
            <text class="card-merchant">{{item.merchant}}</text>
          </view>
          <view class="card-category">{{item.category}}</view>
        </view>
        
        <view class="card-progress">
          <view class="progress-info">
            <text class="usage-count">已用 {{item.usedCount}}/{{item.totalCount}} 次</text>
            <text class="expire-info {{item.isExpiring ? 'expire-warning' : ''}}">
              {{item.expireText}}
            </text>
          </view>
          <view class="progress-bar">
            <view class="progress-fill {{item.isExpiring ? 'warning' : ''}}" 
                  style="width: {{item.progress}}%"></view>
          </view>
        </view>
        
        <view class="card-actions">
          <button class="btn-use" bindtap="recordUsage" data-id="{{item.id}}" 
                  disabled="{{item.usedCount >= item.totalCount}}">
            记录使用
          </button>
          <button class="btn-detail" bindtap="viewDetail" data-id="{{item.id}}">
            详情
          </button>
        </view>
      </view>
    </scroll-view>
  </view>
  
  <!-- 浮动添加按钮 -->
  <view class="fab" bindtap="addCard">+</view>
</view>
```

### 13.2 WXSS样式实现

```css
/* 主要样式定义 */
.container {
  background: #FFF2DF;
  min-height: 100vh;
}

.header {
  background: linear-gradient(135deg, #FCC96E 0%, #FDD89A 100%);
  padding: 20rpx 40rpx 60rpx;
  color: #156D57;
}

.logo-title {
  font-size: 56rpx;
  font-weight: bold;
}

.logo-subtitle {
  font-size: 28rpx;
  opacity: 0.9;
}

.stats-card {
  background: rgba(255,251,240,0.2);
  backdrop-filter: blur(20rpx);
  border-radius: 32rpx;
  padding: 40rpx;
  display: flex;
  justify-content: space-between;
  border: 2rpx solid rgba(255,251,240,0.3);
  margin-top: 40rpx;
}

.stat-number {
  font-size: 48rpx;
  font-weight: bold;
  color: #156D57;
}

.quick-actions {
  padding: 40rpx;
  background: #FFF2DF;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 30rpx;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30rpx 16rpx;
  background: rgba(255,138,0,0.05);
  border-radius: 24rpx;
  border: 2rpx solid rgba(255,138,0,0.1);
}

.action-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: #156D57;
  margin-bottom: 16rpx;
}

.action-add { 
  background: linear-gradient(135deg, #FCC96E, #FDD89A); 
}

.card-item {
  background: rgba(255,251,240,0.8);
  border-radius: 32rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 24rpx rgba(255,138,0,0.08);
  border: 2rpx solid rgba(255,138,0,0.1);
}

.card-item.expiring {
  border-left: 8rpx solid #FF4444;
  background: linear-gradient(90deg, #FFF0F0 0%, rgba(255,251,240,0.9) 20%);
}

.btn-use {
  background: linear-gradient(135deg, #FCC96E 0%, #FDD89A 100%);
  color: #156D57;
  border: none;
  border-radius: 16rpx;
  padding: 16rpx 32rpx;
  font-size: 26rpx;
  font-weight: 500;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FCC96E, #FDD89A);
  border-radius: 6rpx;
  transition: width 0.3s;
}

.fab {
  position: fixed;
  bottom: 60rpx;
  right: 60rpx;
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #FCC96E, #FDD89A);
  color: #156D57;
  font-size: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16rpx 50rpx rgba(255,138,0,0.3);
}
```

### 13.3 JavaScript交互逻辑

```javascript
// pages/index/index.js
Page({
  data: {
    totalCards: 0,
    expiringSoon: 0,
    remainingCount: 0,
    currentFilter: 'all',
    cards: [],
    filteredCards: []
  },

  onLoad() {
    this.loadCardData();
  },

  async loadCardData() {
    const app = getApp();
    const cardService = app.getCardService();
    
    try {
      const cards = await cardService.getAllCards();
      const expiring = await cardService.getExpiringSoonCards();
      
      // 计算统计数据
      const totalCards = cards.length;
      const expiringSoon = expiring.length;
      const remainingCount = cards.reduce((sum, card) => 
        sum + card.getRemainingCount(), 0
      );
      
      // 转换为显示数据
      const displayCards = cards.map(card => ({
        ...card.toStorage(),
        progress: card.getProgress(),
        isExpiring: card.isExpiringSoon(),
        expireText: this.formatExpireText(card)
      }));
      
      this.setData({
        totalCards,
        expiringSoon,
        remainingCount,
        cards: displayCards,
        filteredCards: displayCards
      });
      
    } catch (error) {
      wx.showToast({
        title: '数据加载失败',
        icon: 'error'
      });
    }
  },

  async recordUsage(e) {
    const cardId = e.currentTarget.dataset.id;
    const app = getApp();
    const cardService = app.getCardService();
    
    try {
      const result = await cardService.recordUsage(cardId);
      
      if (result.success) {
        // 更新按钮状态
        const button = e.currentTarget;
        button.style.background = 'linear-gradient(135deg, #4CAF50, #66BB6A)';
        button.innerText = '已记录';
        
        // 刷新数据
        setTimeout(() => {
          this.loadCardData();
        }, 1000);
        
        wx.showToast({
          title: '记录成功',
          icon: 'success'
        });
      } else {
        wx.showToast({
          title: result.error || '记录失败',
          icon: 'error'
        });
      }
    } catch (error) {
      wx.showToast({
        title: '操作失败',
        icon: 'error'
      });
    }
  },

  filterCards(e) {
    const filter = e.currentTarget.dataset.filter;
    const { cards } = this.data;
    
    let filteredCards = cards;
    
    switch (filter) {
      case 'expiring':
        filteredCards = cards.filter(card => card.isExpiring);
        break;
      case 'beauty':
        filteredCards = cards.filter(card => card.category === '美容');
        break;
      default:
        filteredCards = cards;
    }
    
    this.setData({
      currentFilter: filter,
      filteredCards
    });
  },

  addCard() {
    wx.navigateTo({
      url: '/pages/add-card/index'
    });
  },

  viewDetail(e) {
    const cardId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/card-detail/index?id=${cardId}`
    });
  },

  formatExpireText(card) {
    if (!card.expireDate) return '无到期日';
    
    const expireTime = new Date(card.expireDate).getTime();
    const now = Date.now();
    const diffDays = Math.ceil((expireTime - now) / (24 * 60 * 60 * 1000));
    
    if (diffDays < 0) return '已过期';
    if (diffDays === 0) return '今日到期';
    if (diffDays <= 7) return `${diffDays}天后到期`;
    if (diffDays <= 30) return `${diffDays}天后到期`;
    
    return `${Math.ceil(diffDays / 30)}个月后到期`;
  }
});
```

### 13.4 设计规范总结

**颜色使用规范：**
- 主色 #FCC96E：用于品牌标识、主要按钮、进度指示
- 辅色1 #FFF2DF：用于背景、卡片、按钮文字
- 辅色2 #156D57：用于文字和强调色、按钮文字、重要信息
- 文字色 #020100：用于标题、正文、重要信息
- 警示色 #FF4444：用于到期提醒、错误状态

**字体规范：**
- 主标题：28-32rpx，加粗
- 副标题：24-26rpx，中等
- 正文：22-24rpx，常规
- 辅助文字：20-22rpx，细体

**间距规范：**
- 页面边距：40rpx
- 组件间距：24-32rpx
- 内容间距：16-20rpx
- 元素间距：8-12rpx

### 12.1 存储抽象层实现

```javascript
// storage/StorageManager.js - 存储管理器
class StorageManager {
  constructor(strategy) {
    this.strategy = strategy;
  }
  
  setStrategy(strategy) {
    this.strategy = strategy;
  }
  
  async save(key, data) {
    return await this.strategy.save(key, data);
  }
  
  async load(key) {
    return await this.strategy.load(key);
  }
  
  async sync() {
    return await this.strategy.sync();
  }
}

// storage/LocalStorageStrategy.js - V1.0本地存储策略
class LocalStorageStrategy {
  async save(key, data) {
    try {
      wx.setStorageSync(key, JSON.stringify(data));
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }
  
  async load(key) {
    try {
      const data = wx.getStorageSync(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  }
  
  async sync() {
    return { success: true, message: '本地存储无需同步' };
  }
}
```

### 12.2 数据模型实现

```javascript
// models/Card.js - 套餐卡数据模型
class Card {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.name = data.name || '';
    this.merchant = data.merchant || '';
    this.category = data.category || '其他';
    this.totalCount = data.totalCount || 0;
    this.usedCount = data.usedCount || 0;
    this.purchaseDate = data.purchaseDate || new Date().toISOString();
    this.expireDate = data.expireDate || '';
    this.notes = data.notes || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }
  
  generateId() {
    return 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  getRemainingCount() {
    return this.totalCount - this.usedCount;
  }
  
  getProgress() {
    return this.totalCount > 0 ? (this.usedCount / this.totalCount) * 100 : 0;
  }
  
  isExpiringSoon(days = 30) {
    if (!this.expireDate) return false;
    const expireTime = new Date(this.expireDate).getTime();
    const now = Date.now();
    const daysInMs = days * 24 * 60 * 60 * 1000;
    return expireTime - now <= daysInMs;
  }
  
  use() {
    if (this.usedCount < this.totalCount) {
      this.usedCount++;
      this.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }
  
  undoUse() {
    if (this.usedCount > 0) {
      this.usedCount--;
      this.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }
}
```

### 12.3 业务服务层实现

```javascript
// services/CardService.js - 套餐卡业务逻辑
class CardService {
  constructor(storageManager) {
    this.storage = storageManager;
    this.STORAGE_KEY = 'cards';
  }
  
  async getAllCards() {
    const cardsData = await this.storage.load(this.STORAGE_KEY) || [];
    return cardsData.map(data => new Card(data));
  }
  
  async addCard(cardData) {
    const cards = await this.getAllCards();
    const newCard = new Card(cardData);
    cards.push(newCard);
    
    const result = await this.storage.save(this.STORAGE_KEY, 
      cards.map(card => card.toStorage())
    );
    
    return { success: result.success, card: newCard };
  }
  
  async recordUsage(cardId, notes = '') {
    const cards = await this.getAllCards();
    const card = cards.find(c => c.id === cardId);
    
    if (!card || !card.use()) {
      return { success: false, error: '无法记录使用' };
    }
    
    const saveResult = await this.storage.save(this.STORAGE_KEY, 
      cards.map(c => c.toStorage())
    );
    
    return { success: saveResult.success, card };
  }
  
  async getExpiringSoonCards(days = 30) {
    const cards = await this.getAllCards();
    return cards.filter(card => card.isExpiringSoon(days));
  }
}
```

### 12.4 应用初始化

```javascript
// app.js - 小程序入口
App({
  onLaunch() {
    this.initStorage();
  },
  
  initStorage() {
    // V1.0版本：使用本地存储
    const localStrategy = new LocalStorageStrategy();
    this.storageManager = new StorageManager(localStrategy);
    this.cardService = new CardService(this.storageManager);
    
    // V1.1版本升级时的代码示例：
    // const cloudStrategy = new CloudStorageStrategy(apiClient);
    // const hybridStrategy = new HybridStorageStrategy(localStrategy, cloudStrategy);
    // this.storageManager.setStrategy(hybridStrategy);
  },
  
  getCardService() {
    return this.cardService;
  }
});
```

### 12.5 页面使用示例

```javascript
// pages/index/index.js - 首页逻辑
Page({
  data: {
    cards: []
  },
  
  onLoad() {
    this.loadCards();
  },
  
  async loadCards() {
    const app = getApp();
    const cardService = app.getCardService();
    const cards = await cardService.getAllCards();
    
    this.setData({
      cards: cards.map(card => ({
        ...card.toStorage(),
        remainingCount: card.getRemainingCount(),
        progress: card.getProgress(),
        isExpiring: card.isExpiringSoon()
      }))
    });
  },
  
  async recordUsage(e) {
    const cardId = e.currentTarget.dataset.id;
    const app = getApp();
    const cardService = app.getCardService();
    
    const result = await cardService.recordUsage(cardId);
    if (result.success) {
      this.loadCards();
      wx.showToast({ title: '记录成功' });
    } else {
      wx.showToast({ title: result.error, icon: 'error' });
    }
  }
});
```