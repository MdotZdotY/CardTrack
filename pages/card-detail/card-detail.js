// pages/card-detail/card-detail.js
Page({
  data: {
    cardId: '',
    card: null,
    usageRecords: []
  },

  onLoad(options) {
    console.log('卡片详情页面加载', options);
    if (options.id) {
      this.setData({ cardId: options.id });
      this.loadCardData();
    }
  },

  onShow() {
    // 每次显示页面时刷新数据
    if (this.data.cardId) {
      this.loadCardData();
    }
  },

  // 加载卡片数据
  async loadCardData() {
    try {
      const app = getApp();
      const cardService = app.getCardService();
      const notificationManager = app.getNotificationManager();
      
      notificationManager.showLoading('加载中...');
      
      // 获取卡片信息
      const card = await cardService.getCardById(this.data.cardId);
      if (!card) {
        notificationManager.hideLoading();
        notificationManager.showError('卡片不存在');
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
        return;
      }
      
      // 获取使用记录
      const usageRecords = await cardService.getUsageRecords(this.data.cardId);
      
      // 转换为显示数据
      const displayCard = {
        ...card.toStorage(),
        progress: card.getProgress(),
        isExpiring: card.isExpiringSoon(30),
        expireText: card.getExpireText(),
        canUse: card.canUse(),
        canUndo: card.canUndo(),
        remainingCount: card.getRemainingCount(),
        statusText: card.getStatusText(),
        statusColor: card.getStatusColor(),
        purchaseDateText: this.formatDate(card.purchaseDate),
        expireDateText: card.expireDate ? this.formatDate(card.expireDate) : null
      };
      
      const displayRecords = usageRecords.map(record => ({
        ...record.toStorage(),
        formattedDate: record.getFormattedDate(),
        relativeTime: record.getRelativeTime()
      }));
      
      this.setData({
        card: displayCard,
        usageRecords: displayRecords
      });
      
      notificationManager.hideLoading();
      
    } catch (error) {
      console.error('加载卡片数据失败:', error);
      const app = getApp();
      const notificationManager = app.getNotificationManager();
      notificationManager.hideLoading();
      notificationManager.showError('数据加载失败');
    }
  },

  // 记录使用
  async recordUsage() {
    const app = getApp();
    const cardService = app.getCardService();
    const notificationManager = app.getNotificationManager();
    
    try {
      const result = await cardService.recordUsage(this.data.cardId);
      
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

  // 撤销使用
  async undoUsage() {
    const app = getApp();
    const cardService = app.getCardService();
    const notificationManager = app.getNotificationManager();
    
    try {
      const result = await cardService.undoUsage(this.data.cardId);
      
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

  // 编辑卡片
  editCard() {
    wx.showModal({
      title: '编辑功能',
      content: '此功能将在后续版本中开放',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 分享卡片
  shareCard() {
    const { card } = this.data;
    if (!card) return;
    
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 删除卡片
  deleteCard() {
    const app = getApp();
    const notificationManager = app.getNotificationManager();
    
    notificationManager.showConfirm(
      '删除卡片',
      '确定要删除这张卡片吗？删除后无法恢复，相关的使用记录也会被删除。',
      '删除',
      '取消'
    ).then(confirmed => {
      if (confirmed) {
        this.confirmDelete();
      }
    });
  },

  // 确认删除
  async confirmDelete() {
    const app = getApp();
    const cardService = app.getCardService();
    const notificationManager = app.getNotificationManager();
    
    try {
      notificationManager.showLoading('删除中...');
      
      const result = await cardService.deleteCard(this.data.cardId);
      
      notificationManager.hideLoading();
      
      if (result.success) {
        notificationManager.showOperationSuccess('delete');
        
        // 返回上一页并刷新数据
        setTimeout(() => {
          wx.navigateBack({
            success: () => {
              // 通知上一页刷新数据
              const pages = getCurrentPages();
              const prevPage = pages[pages.length - 2];
              if (prevPage && prevPage.loadCardData) {
                prevPage.loadCardData();
              }
            }
          });
        }, 1500);
      } else {
        notificationManager.showOperationError('delete', result.error);
      }
    } catch (error) {
      console.error('删除卡片失败:', error);
      notificationManager.hideLoading();
      notificationManager.showOperationError('delete', error.message);
    }
  },

  // 格式化日期
  formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  },

  // 分享功能
  onShareAppMessage() {
    const { card } = this.data;
    if (!card) return {};
    
    return {
      title: `我的${card.name}套餐卡`,
      path: `/pages/card-detail/card-detail?id=${card.id}`,
      imageUrl: '/images/share-cover.png'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    const { card } = this.data;
    if (!card) return {};
    
    return {
      title: `我的${card.name}套餐卡`,
      imageUrl: '/images/share-cover.png'
    };
  }
});
