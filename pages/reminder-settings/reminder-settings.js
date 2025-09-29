// pages/reminder-settings/reminder-settings.js
Page({
  data: {
    // 提醒设置
    reminderSettings: {
      expireReminder: true,        // 到期提醒开关
      usageReminder: true,         // 使用频率提醒开关
      statsReminder: false,        // 统计提醒开关
      reminderTime: '09:00',       // 提醒时间
      popupReminder: true,         // 弹窗提醒开关
      vibrateReminder: false,      // 震动提醒开关
      advanceDays: 7,              // 提前提醒天数
      unusedThreshold: 30          // 未使用天数阈值
    },
    
    // 选择器数据
    reminderDays: [1, 3, 7, 14, 30],
    reminderDaysIndex: 2,         // 默认选择7天
    unusedDays: [7, 15, 30, 60, 90],
    unusedDaysIndex: 2            // 默认选择30天
  },

  onLoad: function(options) {
    this.loadReminderSettings();
  },

  onShow: function() {
  },

  // 加载提醒设置
  loadReminderSettings: function() {
    try {
      var settings = wx.getStorageSync('reminderSettings');
      if (settings) {
        this.setData({
          reminderSettings: settings
        });
        
        // 设置选择器索引
        var advanceDaysIndex = this.data.reminderDays.indexOf(settings.advanceDays);
        var unusedDaysIndex = this.data.unusedDays.indexOf(settings.unusedThreshold);
        
        this.setData({
          reminderDaysIndex: advanceDaysIndex >= 0 ? advanceDaysIndex : 2,
          unusedDaysIndex: unusedDaysIndex >= 0 ? unusedDaysIndex : 2
        });
      }
    } catch (error) {
      console.error('加载提醒设置失败:', error);
    }
  },

  // 到期提醒开关变化
  onExpireReminderChange: function(e) {
    this.setData({
      'reminderSettings.expireReminder': e.detail.value
    });
  },

  // 使用频率提醒开关变化
  onUsageReminderChange: function(e) {
    this.setData({
      'reminderSettings.usageReminder': e.detail.value
    });
  },

  // 统计提醒开关变化
  onStatsReminderChange: function(e) {
    this.setData({
      'reminderSettings.statsReminder': e.detail.value
    });
  },

  // 弹窗提醒开关变化
  onPopupReminderChange: function(e) {
    this.setData({
      'reminderSettings.popupReminder': e.detail.value
    });
  },

  // 震动提醒开关变化
  onVibrateReminderChange: function(e) {
    this.setData({
      'reminderSettings.vibrateReminder': e.detail.value
    });
  },

  // 提前提醒天数变化
  onReminderDaysChange: function(e) {
    var index = e.detail.value;
    var days = this.data.reminderDays[index];
    
    this.setData({
      reminderDaysIndex: index,
      'reminderSettings.advanceDays': days
    });
  },

  // 提醒时间变化
  onReminderTimeChange: function(e) {
    this.setData({
      'reminderSettings.reminderTime': e.detail.value
    });
  },

  // 未使用天数阈值变化
  onUnusedDaysChange: function(e) {
    var index = e.detail.value;
    var days = this.data.unusedDays[index];
    
    this.setData({
      unusedDaysIndex: index,
      'reminderSettings.unusedThreshold': days
    });
  },

  // 测试提醒功能
  testReminder: function() {
    var settings = this.data.reminderSettings;
    
    // 震动提醒
    if (settings.vibrateReminder) {
      wx.vibrateShort({
        type: 'medium'
      });
    }
    
    // 弹窗提醒
    if (settings.popupReminder) {
      wx.showModal({
        title: '提醒测试',
        content: '这是一个测试提醒，验证提醒功能是否正常工作。',
        showCancel: false,
        confirmText: '知道了'
      });
    }
    
    // 显示成功提示
    wx.showToast({
      title: '提醒测试完成',
      icon: 'success',
      duration: 2000
    });
  },

  // 恢复默认设置
  resetSettings: function() {
    wx.showModal({
      title: '恢复默认',
      content: '确定要恢复默认提醒设置吗？',
      confirmText: '确定',
      cancelText: '取消',
      success: function(res) {
        if (res.confirm) {
          this.resetToDefault();
        }
      }.bind(this)
    });
  },

  // 重置为默认设置
  resetToDefault: function() {
    var defaultSettings = {
      expireReminder: true,
      usageReminder: true,
      statsReminder: false,
      reminderTime: '09:00',
      popupReminder: true,
      vibrateReminder: false,
      advanceDays: 7,
      unusedThreshold: 30
    };
    
    this.setData({
      reminderSettings: defaultSettings,
      reminderDaysIndex: 2,
      unusedDaysIndex: 2
    });
    
    wx.showToast({
      title: '已恢复默认设置',
      icon: 'success'
    });
  },

  // 保存设置
  saveSettings: function() {
    try {
      var settings = this.data.reminderSettings;
      
      // 保存到本地存储
      wx.setStorageSync('reminderSettings', settings);
      
      // 显示成功提示
      wx.showToast({
        title: '设置已保存',
        icon: 'success',
        duration: 2000
      });
      
      // 延迟返回上一页
      setTimeout(function() {
        wx.navigateBack();
      }, 2000);
      
    } catch (error) {
      console.error('保存提醒设置失败:', error);
      wx.showToast({
        title: '保存失败',
        icon: 'error'
      });
    }
  }
});

