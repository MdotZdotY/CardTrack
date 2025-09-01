// pages/settings/settings.js
Page({
  data: {
    statistics: {
      totalCards: 0,
      activeCards: 0,
      expiringCards: 0,
      totalRemainingCount: 0
    }
  },

  onLoad() {
    console.log('设置页面加载');
  },

  onShow() {
    // 每次显示页面时刷新统计数据
    this.loadStatistics();
  },

  // 加载统计数据
  async loadStatistics() {
    try {
      const app = getApp();
      const cardService = app.getCardService();
      
      const statistics = await cardService.getStatistics();
      
      this.setData({
        statistics: {
          totalCards: statistics.totalCards,
          activeCards: statistics.activeCards,
          expiringCards: statistics.expiringCards,
          totalRemainingCount: statistics.totalRemainingCount
        }
      });
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
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

  // 数据备份
  async backupData() {
    try {
      const app = getApp();
      const storageManager = app.getStorageManager();
      const notificationManager = app.getNotificationManager();
      
      notificationManager.showLoading('备份中...');
      
      const result = await storageManager.backup();
      
      notificationManager.hideLoading();
      
      if (result.success) {
        wx.showModal({
          title: '备份成功',
          content: '数据已成功备份到本地',
          showCancel: false,
          confirmText: '知道了'
        });
      } else {
        notificationManager.showError('备份失败');
      }
    } catch (error) {
      console.error('数据备份失败:', error);
      const app = getApp();
      const notificationManager = app.getNotificationManager();
      notificationManager.hideLoading();
      notificationManager.showError('备份失败');
    }
  },

  // 数据恢复
  async restoreData() {
    const app = getApp();
    const notificationManager = app.getNotificationManager();
    
    notificationManager.showConfirm(
      '数据恢复',
      '确定要恢复数据吗？这将覆盖当前的所有数据。',
      '恢复',
      '取消'
    ).then(confirmed => {
      if (confirmed) {
        this.confirmRestore();
      }
    });
  },

  // 确认恢复
  async confirmRestore() {
    try {
      const app = getApp();
      const storageManager = app.getStorageManager();
      const notificationManager = app.getNotificationManager();
      
      notificationManager.showLoading('恢复中...');
      
      // 这里应该从用户选择的位置恢复数据
      // 目前只是示例，实际实现需要用户选择备份文件
      const result = await storageManager.restore({});
      
      notificationManager.hideLoading();
      
      if (result.success) {
        notificationManager.showSuccess('数据恢复成功');
        // 刷新统计数据
        this.loadStatistics();
      } else {
        notificationManager.showError('恢复失败');
      }
    } catch (error) {
      console.error('数据恢复失败:', error);
      const app = getApp();
      const notificationManager = app.getNotificationManager();
      notificationManager.hideLoading();
      notificationManager.showError('恢复失败');
    }
  },

  // 导出数据
  exportData() {
    wx.showModal({
      title: '导出数据',
      content: '此功能将在后续版本中开放',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 查看关于
  viewAbout() {
    wx.showModal({
      title: '关于卡点',
      content: '卡点是一款专门为个人消费者管理各类多次消费套餐卡的微信小程序，解决用户忘记使用次数和过期浪费的痛点。\n\n版本：v1.0.0\n开发者：卡点团队',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 查看帮助
  viewHelp() {
    wx.showModal({
      title: '使用帮助',
      content: '1. 添加套餐卡：点击首页的"+"按钮\n2. 记录使用：在卡片上点击"记录使用"\n3. 查看详情：点击卡片上的"详情"按钮\n4. 撤销使用：长按卡片或点击"撤销使用"\n5. 到期提醒：系统会自动提醒即将到期的卡片',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 意见反馈
  viewFeedback() {
    wx.showModal({
      title: '意见反馈',
      content: '如有问题或建议，请通过以下方式联系我们：\n\n邮箱：feedback@cardpoint.com\n微信：CardPoint_Support',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 清空数据
  clearData() {
    const app = getApp();
    const notificationManager = app.getNotificationManager();
    
    notificationManager.showConfirm(
      '清空数据',
      '确定要清空所有数据吗？此操作不可恢复！',
      '清空',
      '取消'
    ).then(confirmed => {
      if (confirmed) {
        this.confirmClearData();
      }
    });
  },

  // 确认清空数据
  async confirmClearData() {
    try {
      const app = getApp();
      const storageManager = app.getStorageManager();
      const notificationManager = app.getNotificationManager();
      
      notificationManager.showLoading('清空中...');
      
      const result = await storageManager.clear();
      
      notificationManager.hideLoading();
      
      if (result.success) {
        notificationManager.showSuccess('数据已清空');
        // 刷新统计数据
        this.loadStatistics();
      } else {
        notificationManager.showError('清空失败');
      }
    } catch (error) {
      console.error('清空数据失败:', error);
      const app = getApp();
      const notificationManager = app.getNotificationManager();
      notificationManager.hideLoading();
      notificationManager.showError('清空失败');
    }
  },

  // 重置应用
  resetApp() {
    const app = getApp();
    const notificationManager = app.getNotificationManager();
    
    notificationManager.showConfirm(
      '重置应用',
      '确定要重置应用吗？这将清空所有数据并恢复默认设置。',
      '重置',
      '取消'
    ).then(confirmed => {
      if (confirmed) {
        this.confirmResetApp();
      }
    });
  },

  // 确认重置应用
  async confirmResetApp() {
    try {
      const app = getApp();
      const storageManager = app.getStorageManager();
      const notificationManager = app.getNotificationManager();
      
      notificationManager.showLoading('重置中...');
      
      // 清空数据
      await storageManager.clear();
      
      notificationManager.hideLoading();
      
      notificationManager.showSuccess('应用已重置');
      
      // 刷新统计数据
      this.loadStatistics();
      
    } catch (error) {
      console.error('重置应用失败:', error);
      const app = getApp();
      const notificationManager = app.getNotificationManager();
      notificationManager.hideLoading();
      notificationManager.showError('重置失败');
    }
  },

  // 分享应用
  shareApp() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 分享给朋友
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
