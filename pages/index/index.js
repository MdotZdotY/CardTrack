// pages/index/index.js
Page({
  data: {
    totalCards: 0,
    expiringSoon: 0,
    remainingCount: 0,
    currentFilter: 'all',
    cards: [],
    filteredCards: [],
    refreshing: false
  },

  onLoad: function() {
    console.log('首页加载');
    this.loadCardData();
  },

  onShow: function() {
    console.log('首页显示');
    this.loadCardData();
  },

  onPullDownRefresh: function() {
    this.loadCardData();
  },

  // 加载卡片数据
  loadCardData: function() {
    try {
      console.log('开始加载卡片数据');
      
      // 从数据管理器获取卡片数据
      var app = getApp();
      var dataManager = app.getDataManager();
      var cards = [];
      
      if (dataManager) {
        // 使用数据管理器获取数据
        cards = dataManager.getCards();
        console.log('从数据管理器获取到卡片数据:', cards);
      } else {
        // 降级到直接存储
        cards = wx.getStorageSync('cards') || [];
        console.log('从本地存储获取到卡片数据(降级方案):', cards);
      }
      
      // 计算统计信息
      var totalCards = cards.length;
      var expiringCards = 0;
      var totalRemainingCount = 0;
      
      for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        if (card.expireDate) {
          var expireDate = new Date(card.expireDate);
          var now = new Date();
          var daysUntilExpire = Math.ceil((expireDate - now) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpire <= 30 && daysUntilExpire > 0) {
            expiringCards++;
          }
        }
        
        totalRemainingCount += (card.totalCount - card.usedCount);
      }
      
      // 转换为显示数据
      var displayCards = cards.map(function(card) {
        var progress = card.totalCount > 0 ? Math.round((card.usedCount / card.totalCount) * 100) : 0;
        var isExpiring = false;
        var expireText = '';
        
        if (card.expireDate) {
          var expireDate = new Date(card.expireDate);
          var now = new Date();
          var daysUntilExpire = Math.ceil((expireDate - now) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpire <= 30 && daysUntilExpire > 0) {
            isExpiring = true;
            expireText = '还有' + daysUntilExpire + '天到期';
          } else if (daysUntilExpire <= 0) {
            expireText = '已过期';
          } else {
            expireText = '还有' + daysUntilExpire + '天到期';
          }
        }
        
        return {
          ...card,
          progress: progress,
          isExpiring: isExpiring,
          expireText: expireText,
          canUse: (card.totalCount - card.usedCount) > 0,
          remainingCount: card.totalCount - card.usedCount
        };
      });
      
      // 设置数据
      this.setData({
        totalCards: totalCards,
        expiringSoon: expiringCards,
        remainingCount: totalRemainingCount,
        cards: displayCards,
        filteredCards: displayCards
      });
      
      // 停止下拉刷新
      if (this.data.refreshing) {
        this.setData({ refreshing: false });
        wx.stopPullDownRefresh();
      }
      
      // 检查提醒
      this.checkReminders(displayCards);
      
    } catch (error) {
      console.error('加载卡片数据失败:', error);
      this.setDefaultData();
    }
  },

  // 检查提醒
  checkReminders: function(cards) {
    try {
      var app = getApp();
      if (app && app.getReminderManager) {
        var reminderManager = app.getReminderManager();
        if (reminderManager) {
          reminderManager.checkAndShowReminders(cards);
        }
      }
    } catch (error) {
      console.error('检查提醒失败:', error);
    }
  },

  // 设置默认数据
  setDefaultData: function() {
    this.setData({
      totalCards: 0,
      expiringSoon: 0,
      remainingCount: 0,
      cards: [],
      filteredCards: []
    });
  },

  // 记录使用
  recordUsage: function(e) {
    var cardId = e.currentTarget.dataset.id;
    console.log('记录使用:', cardId);
    
    wx.showModal({
      title: '记录使用',
      content: '此功能将在后续版本中开放',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 查看详情
  viewDetail: function(e) {
    var cardId = e.currentTarget.dataset.id;
    console.log('查看详情:', cardId);
    
    wx.showModal({
      title: '查看详情',
      content: '此功能将在后续版本中开放',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 添加卡片
  addCard: function() {
    console.log('添加卡片');
    wx.navigateTo({
      url: '/pages/add-card/add-card'
    });
  },

  // 显示搜索
  showSearch: function() {
    wx.showModal({
      title: '搜索功能',
      content: '此功能将在后续版本中开放',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 筛选卡片
  filterCards: function(e) {
    var filter = e.currentTarget.dataset.filter;
    var cards = this.data.cards;
    
    var filteredCards = cards;
    
    switch (filter) {
      case 'expiring':
        filteredCards = cards.filter(function(card) {
          return card.isExpiring;
        });
        break;
      case 'active':
        filteredCards = cards.filter(function(card) {
          return card.canUse;
        });
        break;
      default:
        filteredCards = cards;
    }
    
    this.setData({
      currentFilter: filter,
      filteredCards: filteredCards
    });
  },

  // 下拉刷新
  onRefresh: function() {
    var that = this;
    this.setData({ refreshing: true });
    this.loadCardData();
    
    setTimeout(function() {
      that.setData({ refreshing: false });
      wx.stopPullDownRefresh();
    }, 1000);
  },

  // 分享功能
  onShareAppMessage: function() {
    return {
      title: '卡点时光 - 让每一次消费都有记录',
      path: '/pages/index/index'
    };
  },

  // 分享到朋友圈
  onShareTimeline: function() {
    return {
      title: '卡点时光 - 让每一次消费都有记录'
    };
  }
});
