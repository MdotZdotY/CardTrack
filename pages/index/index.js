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

  onLoad() {
    console.log('首页加载');
    this.loadCardData();
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.loadCardData();
  },

  onPullDownRefresh() {
    this.loadCardData();
  },

  // 加载卡片数据
  async loadCardData() {
    try {
      const app = getApp();
      const cardService = app.getCardService();
      const notificationManager = app.getNotificationManager();
      
      notificationManager.showLoading('加载中...');
      
      // 获取所有卡片
      const cards = await cardService.getAllCards();
      
      // 获取统计信息
      const statistics = await cardService.getStatistics();
      
      // 转换为显示数据
      const displayCards = cards.map(card => ({
        ...card.toStorage(),
        progress: card.getProgress(),
        isExpiring: card.isExpiringSoon(30),
        expireText: card.getExpireText(),
        canUse: card.canUse(),
        remainingCount: card.getRemainingCount()
      }));
      
      this.setData({
        totalCards: statistics.totalCards,
        expiringSoon: statistics.expiringCards,
        remainingCount: statistics.totalRemainingCount,
        cards: displayCards,
        filteredCards: displayCards
      });
      
      notificationManager.hideLoading();
      
      // 检查是否有即将到期的卡片
      const expiringCards = cards.filter(card => card.isExpiringSoon(7));
      if (expiringCards.length > 0) {
        notificationManager.showExpireReminder(expiringCards);
      }
      
    } catch (error) {
      console.error('加载卡片数据失败:', error);
      const app = getApp();
      const notificationManager = app.getNotificationManager();
      notificationManager.hideLoading();
      notificationManager.showError('数据加载失败');
    }
  },

  // 记录使用
  async recordUsage(e) {
    const cardId = e.currentTarget.dataset.id;
    const app = getApp();
    const cardService = app.getCardService();
    const notificationManager = app.getNotificationManager();
    
    try {
      const result = await cardService.recordUsage(cardId);
      
      if (result.success) {
        notificationManager.showUsageSuccess(result.card, result.remainingCount);
        
        // 刷新数据
        setTimeout(() => {
          this.loadCardData();
        }, 1000);
      } else {
        notificationManager.showError(result.error || '记录失败');
      }
    } catch (error) {
      console.error('记录使用失败:', error);
      notificationManager.showError('操作失败');
    }
  },

  // 查看详情
  viewDetail(e) {
    const cardId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/card-detail/card-detail?id=${cardId}`
    });
  },

  // 添加卡片
  addCard() {
    wx.navigateTo({
      url: '/pages/add-card/add-card'
    });
  },

  // 拍照录入
  scanCard() {
    wx.showModal({
      title: '拍照录入',
      content: '此功能将在后续版本中开放',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 提醒设置
  setReminder() {
    wx.showModal({
      title: '提醒设置',
      content: '此功能将在后续版本中开放',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 查看统计
  viewStats() {
    wx.showModal({
      title: '使用统计',
      content: '此功能将在后续版本中开放',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 显示搜索
  showSearch() {
    wx.showModal({
      title: '搜索功能',
      content: '此功能将在后续版本中开放',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 筛选卡片
  filterCards(e) {
    const filter = e.currentTarget.dataset.filter;
    const { cards } = this.data;
    
    let filteredCards = cards;
    
    switch (filter) {
      case 'expiring':
        filteredCards = cards.filter(card => card.isExpiring);
        break;
      case 'active':
        filteredCards = cards.filter(card => card.canUse);
        break;
      default:
        filteredCards = cards;
    }
    
    this.setData({
      currentFilter: filter,
      filteredCards
    });
  },

  // 下拉刷新
  onRefresh() {
    this.setData({ refreshing: true });
    this.loadCardData().finally(() => {
      this.setData({ refreshing: false });
      wx.stopPullDownRefresh();
    });
  },

  // 长按撤销使用
  onLongPressCard(e) {
    const cardId = e.currentTarget.dataset.id;
    const app = getApp();
    const notificationManager = app.getNotificationManager();
    
    notificationManager.showConfirm(
      '撤销使用',
      '确定要撤销最近一次使用记录吗？',
      '撤销',
      '取消'
    ).then(confirmed => {
      if (confirmed) {
        this.undoUsage(cardId);
      }
    });
  },

  // 撤销使用
  async undoUsage(cardId) {
    const app = getApp();
    const cardService = app.getCardService();
    const notificationManager = app.getNotificationManager();
    
    try {
      const result = await cardService.undoUsage(cardId);
      
      if (result.success) {
        notificationManager.showUndoSuccess(result.card, result.remainingCount);
        
        // 刷新数据
        setTimeout(() => {
          this.loadCardData();
        }, 1000);
      } else {
        notificationManager.showError(result.error || '撤销失败');
      }
    } catch (error) {
      console.error('撤销使用失败:', error);
      notificationManager.showError('操作失败');
    }
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: '卡点 - 让每一次消费都有记录',
      path: '/pages/index/index',
      imageUrl: '/images/share-cover.png'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '卡点 - 让每一次消费都有记录',
      imageUrl: '/images/share-cover.png'
    };
  }
});
