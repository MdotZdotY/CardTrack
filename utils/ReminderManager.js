// utils/ReminderManager.js
class ReminderManager {
  constructor() {
    this.reminderSettings = null;
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

  // 显示到期提醒
  showExpireReminders(expiringCards) {
    if (expiringCards.length === 0) {
      return;
    }

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
        showCancel: false
      });
    }
  }

  // 显示使用频率提醒
  showUsageReminders(unusedCards) {
    if (unusedCards.length === 0) {
      return;
    }

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
        showCancel: false
      });
    }
  }

  // 检查并显示所有提醒
  checkAndShowReminders(cards) {
    // 检查到期提醒
    var expiringCards = this.checkExpireReminders(cards);
    if (expiringCards.length > 0) {
      this.showExpireReminders(expiringCards);
    }

    // 检查使用频率提醒
    var unusedCards = this.checkUsageReminders(cards);
    if (unusedCards.length > 0) {
      // 延迟显示，避免与到期提醒同时出现
      setTimeout(function() {
        this.showUsageReminders(unusedCards);
      }.bind(this), 2000);
    }
  }

  // 刷新设置
  refreshSettings() {
    this.loadSettings();
  }
}

module.exports = ReminderManager;

