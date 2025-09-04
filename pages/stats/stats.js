// pages/stats/stats.js
Page({
  data: {
    totalCards: 0,
    totalUsage: 0,
    totalValue: 0,
    categoryStats: [],
    usageFrequency: [],
    expiringCards: []
  },

  onLoad: function() {
    console.log('统计页面加载');
    this.loadStatsData();
  },

  onShow: function() {
    console.log('统计页面显示');
    this.loadStatsData();
  },

  onPullDownRefresh: function() {
    this.loadStatsData();
  },

  // 加载统计数据
  loadStatsData: function() {
    try {
      console.log('开始加载统计数据');
      
      // 从本地存储获取卡片数据
      var cards = wx.getStorageSync('cards') || [];
      console.log('获取到卡片数据:', cards);
      
      if (cards.length === 0) {
        this.setDefaultData();
        return;
      }
      
      // 计算基础统计
      var totalCards = cards.length;
      var totalUsage = 0;
      var totalValue = 0;
      
      // 分类统计
      var categoryMap = {};
      
      // 使用频率统计
      var usageFrequency = [];
      
      // 即将到期的卡片
      var expiringCards = [];
      var now = new Date();
      
      for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        
        // 累计使用次数
        totalUsage += card.usedCount;
        
        // 累计总价值（这里用总次数代替，实际项目中可能需要价格字段）
        totalValue += card.totalCount;
        
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
        categoryMap[category].totalCount += card.totalCount;
        categoryMap[category].usedCount += card.usedCount;
        
        // 使用频率（按使用率排序）
        var usageRate = card.totalCount > 0 ? Math.round((card.usedCount / card.totalCount) * 100) : 0;
        usageFrequency.push({
          cardId: card.id,
          name: card.name,
          merchant: card.merchant,
          usageCount: card.usedCount,
          totalCount: card.totalCount,
          usageRate: usageRate
        });
        
        // 检查是否即将到期
        if (card.expireDate) {
          var expireDate = new Date(card.expireDate);
          var daysUntilExpire = Math.ceil((expireDate - now) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpire <= 30 && daysUntilExpire > 0) {
            expiringCards.push({
              id: card.id,
              name: card.name,
              merchant: card.merchant,
              daysLeft: daysUntilExpire,
              remainingCount: card.totalCount - card.usedCount
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
      
      // 使用频率排序（按使用率从高到低）
      usageFrequency.sort(function(a, b) {
        return b.usageRate - a.usageRate;
      });
      
      // 到期提醒排序（按剩余天数从少到多）
      expiringCards.sort(function(a, b) {
        return a.daysLeft - b.daysLeft;
      });
      
      // 设置数据
      this.setData({
        totalCards: totalCards,
        totalUsage: totalUsage,
        totalValue: totalValue,
        categoryStats: categoryStats,
        usageFrequency: usageFrequency,
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
      totalUsage: 0,
      totalValue: 0,
      categoryStats: [],
      usageFrequency: [],
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

