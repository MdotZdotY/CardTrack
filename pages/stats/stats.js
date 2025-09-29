// pages/stats/stats.js
Page({
  data: {
    totalCards: 0,
    effectiveCards: 0,
    expiredCards: 0,
    usedUpCards: 0,
    totalUsage: 0,
    totalValue: 0,
    categoryStats: [],
    expiringCards: [],
    safeTopPx: 0,
    headerStyle: ''
  },

  onLoad: function() {
    try {
      const info = wx.getSystemInfoSync();
      const menu = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null;
      const statusBar = info.statusBarHeight || 0;
      // 以状态栏高度 + 44px 导航高度作为安全上边距，若存在胶囊则与其对齐
      let safeTop = statusBar + 44;
      if (menu && menu.top) {
        safeTop = Math.max(safeTop, menu.top);
      }
      // 计算与首页一致的头部样式（顶铺姜黄色 + 深绿文字）
      const headerStyle = `background: linear-gradient(135deg, #FCC96E 0%, #FDD89A 100%); color: #156D57; padding: 88rpx 40rpx 40rpx; padding-top: ${safeTop}px;`;
      this.setData({ safeTopPx: safeTop, headerStyle });
    } catch (e) {
      const headerStyleFallback = 'background: linear-gradient(135deg, #FCC96E 0%, #FDD89A 100%); color: #156D57; padding: 88rpx 40rpx 40rpx; padding-top: 88px;';
      this.setData({ safeTopPx: 88, headerStyle: headerStyleFallback });
    }
    this.loadStatsData();
  },

  onShow: function() {
    // 再次进入时重算安全区与头部样式，防止刷新后样式回退
    try {
      const info = wx.getSystemInfoSync();
      const menu = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null;
      const statusBar = info.statusBarHeight || 0;
      let safeTop = statusBar + 44;
      if (menu && menu.top) {
        safeTop = Math.max(safeTop, menu.top);
      }
      const headerStyle = `background: linear-gradient(135deg, #FCC96E 0%, #FDD89A 100%); color: #156D57; padding: 88rpx 40rpx 40rpx; padding-top: ${safeTop}px;`;
      this.setData({ safeTopPx: safeTop, headerStyle });
    } catch (e) {}
    this.loadStatsData();
  },

  onPullDownRefresh: function() {
    this.loadStatsData();
  },

  // 加载统计数据
  loadStatsData: function() {
    try {
      
      // 从数据管理器获取卡片数据
      var app = getApp();
      var dataManager = app.getDataManager();
      var cards = [];
      
      if (dataManager) {
        // 使用数据管理器获取数据
        cards = dataManager.getCards();
      } else {
        // 降级到直接存储
        cards = wx.getStorageSync('cards') || [];
      }
      
      if (cards.length === 0) {
        this.setDefaultData();
        return;
      }
      
      // 计算基础统计
      var totalCards = cards.length;
      var totalUsage = 0;
      var totalValue = 0;
      var effectiveCards = 0;
      var expiredCards = 0;
      var usedUpCards = 0;
      
      // 分类统计
      var categoryMap = {};
      
      
      // 即将到期的卡片
      var expiringCards = [];
      var now = new Date();
      
      for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        
        // 累计使用次数
        totalUsage += card.usedCount;
        
        // 累计总价值（所有卡片的金额总和）
        if (card.totalAmount && !isNaN(card.totalAmount)) {
          totalValue += parseFloat(card.totalAmount);
        }
        // 计算是否过期
        var isExpired = false;
        if (card.expireDate) {
          var expireDateForValid = new Date(card.expireDate);
          if (Math.ceil((expireDateForValid - now) / (1000 * 60 * 60 * 24)) <= 0) {
            isExpired = true;
          }
        }
        if (isExpired) {
          expiredCards++;
        }

        // 计算是否可用（不限次数或剩余次数>0）且未过期
        var isUnlimited = typeof card.totalCount !== 'number';
        var remaining = typeof card.totalCount === 'number' ? (card.totalCount - card.usedCount) : null;
        var hasRemaining = isUnlimited || (typeof card.totalCount === 'number' && remaining > 0);
        if (!isUnlimited && typeof remaining === 'number' && remaining <= 0) {
          usedUpCards++;
        }
        if (!isExpired && hasRemaining) {
          effectiveCards++;
        }

        // 分类统计
        var category = card.category || '其他';
        if (!categoryMap[category]) {
          categoryMap[category] = {
            category: category,
            count: 0,
            totalCount: 0,
            usedCount: 0
          };
        }
        categoryMap[category].count++;
        // 对于不限次数卡片，不累计到总次数中
        if (typeof card.totalCount === 'number') {
          categoryMap[category].totalCount += card.totalCount;
        }
        categoryMap[category].usedCount += card.usedCount;
        
        
        // 检查是否即将到期
        if (card.expireDate) {
          var expireDate = new Date(card.expireDate);
          var daysUntilExpire = Math.ceil((expireDate - now) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpire <= 30 && daysUntilExpire > 0) {
            // 计算剩余次数，不限次数卡片显示为"不限"
            var remainingCount = typeof card.totalCount === 'number' ? 
              (card.totalCount - card.usedCount) : '不限';
            
            expiringCards.push({
              id: card.id,
              name: card.name,
              merchant: card.merchant,
              daysLeft: daysUntilExpire,
              remainingCount: remainingCount
            });
          }
        }
      }
      
      // 处理分类统计
      var categoryStats = [];
      for (var category in categoryMap) {
        var categoryData = categoryMap[category];
        var percentage = Math.round((categoryData.count / totalCards) * 100);
        
        categoryStats.push({
          category: categoryData.category,
          count: categoryData.count,
          totalCount: categoryData.totalCount,
          usedCount: categoryData.usedCount,
          percentage: percentage
        });
      }
      
      // 按数量排序
      categoryStats.sort(function(a, b) {
        return b.count - a.count;
      });
      
      
      // 到期提醒排序（按剩余天数从少到多）
      expiringCards.sort(function(a, b) {
        return a.daysLeft - b.daysLeft;
      });
      
      // 设置数据
      this.setData({
        totalCards: totalCards,
        effectiveCards: effectiveCards,
        expiredCards: expiredCards,
        usedUpCards: usedUpCards,
        totalUsage: totalUsage,
        totalValue: (totalValue / 10000).toFixed(2), // 转换为万元，保留2位小数
        categoryStats: categoryStats,
        expiringCards: expiringCards
      });
      
      // 停止下拉刷新
      wx.stopPullDownRefresh();
      
    } catch (error) {
      console.error('加载统计数据失败:', error);
      this.setDefaultData();
    }
  },

  // 设置默认数据
  setDefaultData: function() {
    this.setData({
      totalCards: 0,
      effectiveCards: 0,
      expiredCards: 0,
      usedUpCards: 0,
      totalUsage: 0,
      totalValue: '0.00', // 万元单位，保留2位小数
      categoryStats: [],
      expiringCards: []
    });
  },

  // 分享功能
  onShareAppMessage: function() {
    return {
      title: '卡点时光 - 使用统计',
      path: '/pages/stats/stats'
    };
  },

  // 分享到朋友圈
  onShareTimeline: function() {
    return {
      title: '卡点时光 - 使用统计'
    };
  }
});

