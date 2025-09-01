// utils/NotificationManager.js - 通知管理器
export class NotificationManager {
  constructor() {
    this.reminderDays = [30, 15, 7, 1]; // 到期前提醒天数
    this.lowCountThreshold = 3; // 剩余次数少于N次时提醒
  }
  
  // 显示到期提醒
  showExpireReminder(expiringCards) {
    if (!expiringCards || expiringCards.length === 0) {
      return;
    }
    
    const cardNames = expiringCards.map(card => card.name).join('、');
    const message = `您有${expiringCards.length}张卡片即将到期：${cardNames}`;
    
    wx.showModal({
      title: '卡点提醒',
      content: message,
      confirmText: '查看详情',
      cancelText: '稍后提醒',
      success: (res) => {
        if (res.confirm) {
          // 跳转到卡片列表页面
          wx.switchTab({
            url: '/pages/index/index'
          });
        }
      }
    });
  }
  
  // 显示剩余次数提醒
  showLowCountReminder(card) {
    if (!card || card.getRemainingCount() >= this.lowCountThreshold) {
      return;
    }
    
    const remainingCount = card.getRemainingCount();
    const message = `您的${card.name}只剩${remainingCount}次了，请及时使用`;
    
    wx.showModal({
      title: '卡点提醒',
      content: message,
      confirmText: '立即使用',
      cancelText: '稍后提醒',
      success: (res) => {
        if (res.confirm) {
          // 跳转到卡片详情页面
          wx.navigateTo({
            url: `/pages/card-detail/card-detail?id=${card.id}`
          });
        }
      }
    });
  }
  
  // 显示使用成功提示
  showUsageSuccess(card, remainingCount) {
    wx.showToast({
      title: `使用成功，剩余${remainingCount}次`,
      icon: 'success',
      duration: 2000
    });
  }
  
  // 显示撤销成功提示
  showUndoSuccess(card, remainingCount) {
    wx.showToast({
      title: `撤销成功，剩余${remainingCount}次`,
      icon: 'success',
      duration: 2000
    });
  }
  
  // 显示错误提示
  showError(message) {
    wx.showToast({
      title: message,
      icon: 'error',
      duration: 2000
    });
  }
  
  // 显示成功提示
  showSuccess(message) {
    wx.showToast({
      title: message,
      icon: 'success',
      duration: 2000
    });
  }
  
  // 显示加载提示
  showLoading(title = '加载中...') {
    wx.showLoading({
      title: title,
      mask: true
    });
  }
  
  // 隐藏加载提示
  hideLoading() {
    wx.hideLoading();
  }
  
  // 显示确认对话框
  showConfirm(title, content, confirmText = '确定', cancelText = '取消') {
    return new Promise((resolve) => {
      wx.showModal({
        title: title,
        content: content,
        confirmText: confirmText,
        cancelText: cancelText,
        success: (res) => {
          resolve(res.confirm);
        }
      });
    });
  }
  
  // 显示操作成功提示
  showOperationSuccess(operation) {
    const messages = {
      add: '添加成功',
      update: '更新成功',
      delete: '删除成功',
      record: '记录成功',
      undo: '撤销成功'
    };
    
    const message = messages[operation] || '操作成功';
    this.showSuccess(message);
  }
  
  // 显示操作失败提示
  showOperationError(operation, error) {
    const messages = {
      add: '添加失败',
      update: '更新失败',
      delete: '删除失败',
      record: '记录失败',
      undo: '撤销失败'
    };
    
    const message = messages[operation] || '操作失败';
    this.showError(`${message}: ${error}`);
  }
  
  // 检查并设置提醒
  async checkAndSetReminders(card) {
    if (!card.expireDate) {
      return;
    }
    
    const expireTime = new Date(card.expireDate).getTime();
    const now = Date.now();
    
    for (const days of this.reminderDays) {
      const reminderTime = expireTime - (days * 24 * 60 * 60 * 1000);
      
      // 如果提醒时间在未来，设置提醒
      if (reminderTime > now) {
        await this.scheduleReminder(card, reminderTime, days);
      }
    }
  }
  
  // 设置定时提醒
  async scheduleReminder(card, reminderTime, days) {
    try {
      const delay = reminderTime - Date.now();
      
      // 使用微信小程序的定时器API（如果可用）
      if (wx.scheduleNotification) {
        wx.scheduleNotification({
          id: `expire_${card.id}_${days}`,
          title: '卡点提醒',
          content: `您的${card.name}将在${days}天后到期`,
          trigger: {
            type: 'timer',
            delay: delay
          }
        });
      }
    } catch (error) {
      console.error('设置提醒失败:', error);
    }
  }
  
  // 取消提醒
  async cancelReminders(cardId) {
    try {
      if (wx.cancelNotification) {
        for (const days of this.reminderDays) {
          wx.cancelNotification({
            id: `expire_${cardId}_${days}`
          });
        }
      }
    } catch (error) {
      console.error('取消提醒失败:', error);
    }
  }
  
  // 获取提醒设置
  getReminderSettings() {
    return {
      reminderDays: this.reminderDays,
      lowCountThreshold: this.lowCountThreshold
    };
  }
  
  // 更新提醒设置
  updateReminderSettings(settings) {
    if (settings.reminderDays) {
      this.reminderDays = settings.reminderDays;
    }
    if (settings.lowCountThreshold) {
      this.lowCountThreshold = settings.lowCountThreshold;
    }
  }
}
