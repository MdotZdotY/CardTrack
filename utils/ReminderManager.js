// utils/ReminderManager.js
class ReminderManager {
  constructor() {
    this.reminderSettings = null;
    this._isShowingModal = false; // 防止并发弹窗
    this._anyReminderShownToday = !!wx.getStorageSync('anyReminderShown_' + new Date().toDateString());
    this.loadSettings();
  }

  // 加载提醒设置
  loadSettings() {
    try {
      this.reminderSettings = wx.getStorageSync('reminderSettings') || this.getDefaultSettings();
    } catch (error) {
      console.error('加载提醒设置失败:', error);
      this.reminderSettings = this.getDefaultSettings();
    }
  }

  // 获取默认设置
  getDefaultSettings() {
    return {
      expireReminder: true,
      usageReminder: true,
      runningOutReminder: true, // 新增：即将用完提醒独立设置
      statsReminder: false,
      reminderTime: '09:00',
      popupReminder: true,
      vibrateReminder: false,
      advanceDays: 7,
      unusedThreshold: 30
    };
  }

  // 检查到期提醒
  checkExpireReminders(cards) {
    if (!this.reminderSettings.expireReminder) {
      return [];
    }

    var expiringCards = [];
    var now = new Date();
    var advanceDays = this.reminderSettings.advanceDays;

    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      if (card.expireDate) {
        var expireDate = new Date(card.expireDate);
        var daysUntilExpire = Math.ceil((expireDate - now) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpire <= advanceDays && daysUntilExpire > 0) {
          expiringCards.push({
            card: card,
            daysUntilExpire: daysUntilExpire
          });
        }
      }
    }

    return expiringCards;
  }

  // 检查使用频率提醒
  checkUsageReminders(cards) {
    if (!this.reminderSettings.usageReminder) {
      return [];
    }

    var unusedCards = [];
    var now = new Date();
    var threshold = this.reminderSettings.unusedThreshold;

    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      if (card.lastUsedDate) {
        var lastUsed = new Date(card.lastUsedDate);
        var daysSinceLastUse = Math.ceil((now - lastUsed) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastUse >= threshold) {
          unusedCards.push({
            card: card,
            daysSinceLastUse: daysSinceLastUse
          });
        }
      }
    }

    return unusedCards;
  }

  // 检查即将用完提醒
  checkRunningOutReminders(cards) {
    if (!this.reminderSettings.runningOutReminder) {
      return [];
    }

    var runningOutCards = [];

    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      
      // 只检查有限次数的卡片
      if (typeof card.totalCount === 'number' && card.totalCount > 0) {
        var remainingCount = card.totalCount - card.usedCount;
        var remainingPercentage = (remainingCount / card.totalCount) * 100;
        
        // 双重判断：剩余次数≤2次 或 剩余百分比<10%
        if ((remainingCount <= 2 && remainingCount > 0) || 
            (remainingPercentage < 10 && remainingCount > 0)) {
          runningOutCards.push({
            card: card,
            remainingCount: remainingCount,
            remainingPercentage: Math.round(remainingPercentage * 10) / 10
          });
        }
      }
    }

    return runningOutCards;
  }

  // 显示到期提醒
  showExpireReminders(expiringCards) {
    if (expiringCards.length === 0) {
      return;
    }

    // 检查是否已经显示过提醒（本次启动）
    var sessionKey = 'expireReminderShown_' + new Date().toDateString();
    if (wx.getStorageSync(sessionKey) || this._isShowingModal || this._anyReminderShownToday) {
      return;
    }

    // 立刻标记，避免后续调用重复入队
    this._isShowingModal = true;
    wx.setStorageSync(sessionKey, true);
    wx.setStorageSync('anyReminderShown_' + new Date().toDateString(), true);
    this._anyReminderShownToday = true;

    var message = '以下套餐卡即将到期：\n';
    for (var i = 0; i < expiringCards.length; i++) {
      var item = expiringCards[i];
      message += `• ${item.card.name}：还有${item.daysUntilExpire}天到期\n`;
    }

    // 震动提醒
    if (this.reminderSettings.vibrateReminder) {
      wx.vibrateShort({
        type: 'medium'
      });
    }

    // 弹窗提醒
    if (this.reminderSettings.popupReminder) {
      wx.showModal({
        title: '到期提醒',
        content: message,
        confirmText: '知道了',
        cancelText: '不再提醒',
        showCancel: true,
        success: (res) => {
          if (res.cancel) {
            // 用户点击"不再提醒"
            this.disableReminderType('expire');
            wx.showToast({
              title: '已关闭到期提醒',
              icon: 'success'
            });
          }
        },
        complete: () => {
          this._isShowingModal = false;
        }
      });
    }
  }

  // 显示使用频率提醒
  showUsageReminders(unusedCards) {
    if (unusedCards.length === 0) {
      return;
    }

    // 检查是否已经显示过提醒（本次启动）
    var sessionKey = 'usageReminderShown_' + new Date().toDateString();
    if (wx.getStorageSync(sessionKey) || this._isShowingModal || this._anyReminderShownToday) {
      return;
    }

    // 立刻标记，避免后续调用重复入队
    this._isShowingModal = true;
    wx.setStorageSync(sessionKey, true);
    wx.setStorageSync('anyReminderShown_' + new Date().toDateString(), true);
    this._anyReminderShownToday = true;

    var message = '以下套餐卡很久未使用：\n';
    for (var i = 0; i < unusedCards.length; i++) {
      var item = unusedCards[i];
      message += `• ${item.card.name}：${item.daysSinceLastUse}天未使用\n`;
    }

    // 震动提醒
    if (this.reminderSettings.vibrateReminder) {
      wx.vibrateShort({
        type: 'medium'
      });
    }

    // 弹窗提醒
    if (this.reminderSettings.popupReminder) {
      wx.showModal({
        title: '使用提醒',
        content: message,
        confirmText: '知道了',
        cancelText: '不再提醒',
        showCancel: true,
        success: (res) => {
          if (res.cancel) {
            // 用户点击"不再提醒"
            this.disableReminderType('usage');
            wx.showToast({
              title: '已关闭使用提醒',
              icon: 'success'
            });
          }
        },
        complete: () => {
          this._isShowingModal = false;
        }
      });
    }
  }

  // 显示即将用完提醒
  showRunningOutReminders(runningOutCards) {
    if (runningOutCards.length === 0) {
      return;
    }

    // 检查是否已经显示过提醒（本次启动）
    var sessionKey = 'runningOutReminderShown_' + new Date().toDateString();
    if (wx.getStorageSync(sessionKey) || this._isShowingModal || this._anyReminderShownToday) {
      return;
    }

    // 立刻标记，避免后续调用重复入队
    this._isShowingModal = true;
    wx.setStorageSync(sessionKey, true);
    wx.setStorageSync('anyReminderShown_' + new Date().toDateString(), true);
    this._anyReminderShownToday = true;

    var message = '以下套餐卡即将用完：\n';
    for (var i = 0; i < runningOutCards.length; i++) {
      var item = runningOutCards[i];
      message += `• ${item.card.name}：剩余${item.remainingCount}次（${item.remainingPercentage}%）\n`;
    }

    // 震动提醒
    if (this.reminderSettings.vibrateReminder) {
      wx.vibrateShort({
        type: 'heavy'
      });
    }

    // 弹窗提醒
    if (this.reminderSettings.popupReminder) {
      wx.showModal({
        title: '即将用完提醒',
        content: message,
        confirmText: '知道了',
        cancelText: '不再提醒',
        showCancel: true,
        success: (res) => {
          if (res.cancel) {
            // 用户点击"不再提醒"
            this.disableReminderType('runningOut');
            wx.showToast({
              title: '已关闭即将用完提醒',
              icon: 'success'
            });
          }
        },
        complete: () => {
          this._isShowingModal = false;
        }
      });
    }
  }

  // 检查并显示所有提醒
  checkAndShowReminders(cards) {
    // 优先级：到期 > 即将用完 > 使用频率；每次启动仅显示一种
    if (this._anyReminderShownToday || this._isShowingModal) {
      return;
    }

    var expiringCards = this.checkExpireReminders(cards);
    if (expiringCards.length > 0) {
      this.showExpireReminders(expiringCards);
      return;
    }

    var runningOutCards = this.checkRunningOutReminders(cards);
    if (runningOutCards.length > 0) {
      this.showRunningOutReminders(runningOutCards);
      return;
    }

    var unusedCards = this.checkUsageReminders(cards);
    if (unusedCards.length > 0) {
      this.showUsageReminders(unusedCards);
      return;
    }
  }

  // 禁用特定类型的提醒
  disableReminderType(type) {
    try {
      var settings = this.reminderSettings;
      switch (type) {
        case 'expire':
          settings.expireReminder = false;
          break;
        case 'runningOut':
          settings.runningOutReminder = false;
          break;
        case 'usage':
          settings.usageReminder = false;
          break;
      }
      
      // 保存设置
      wx.setStorageSync('reminderSettings', settings);
      this.reminderSettings = settings;
      
      console.log('已禁用提醒类型:', type);
    } catch (error) {
      console.error('禁用提醒类型失败:', error);
    }
  }

  // 启用特定类型的提醒
  enableReminderType(type) {
    try {
      var settings = this.reminderSettings;
      switch (type) {
        case 'expire':
          settings.expireReminder = true;
          break;
        case 'runningOut':
          settings.runningOutReminder = true;
          break;
        case 'usage':
          settings.usageReminder = true;
          break;
      }
      
      // 保存设置
      wx.setStorageSync('reminderSettings', settings);
      this.reminderSettings = settings;
      
      console.log('已启用提醒类型:', type);
    } catch (error) {
      console.error('启用提醒类型失败:', error);
    }
  }

  // 清除当天的提醒显示记录（用于测试）
  clearTodayReminderFlags() {
    try {
      var today = new Date().toDateString();
      wx.removeStorageSync('expireReminderShown_' + today);
      wx.removeStorageSync('runningOutReminderShown_' + today);
      wx.removeStorageSync('usageReminderShown_' + today);
      wx.removeStorageSync('anyReminderShown_' + today);
      console.log('已清除今天的提醒显示记录');
    } catch (error) {
      console.error('清除提醒显示记录失败:', error);
    }
  }

  // 刷新设置
  refreshSettings() {
    this.loadSettings();
  }
}

module.exports = ReminderManager;

