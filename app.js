// app.js - 小程序入口文件
var ReminderManager = require('./utils/ReminderManager.js');
var NotificationManager = require('./utils/NotificationManager.js');
var DataManager = require('./utils/DataManager.js');
var DataBackupManager = require('./utils/DataBackupManager.js');

App({
  globalData: {
    userInfo: null
  },

  onLaunch: function() {
    console.log('卡点时光小程序启动');
    this.initDataManager();
    this.initBackupManager();
    this.initReminderManager();
    this.initNotificationManager();
  },

  onShow: function() {
    console.log('小程序显示');
    // 只在应用启动时检查提醒，避免重复弹窗
    if (!this.hasCheckedReminders) {
      this.checkReminders();
      this.hasCheckedReminders = true;
    }
    this.checkDataIntegrity();
  },

  onHide: function() {
    console.log('小程序隐藏，创建自动备份');
    this.createAutoBackup();
  },

  // 初始化数据管理器
  initDataManager: function() {
    try {
      this.dataManager = new DataManager();
      console.log('数据管理器初始化完成');
    } catch (error) {
      console.error('数据管理器初始化失败:', error);
    }
  },

  // 初始化备份管理器
  initBackupManager: function() {
    try {
      this.backupManager = new DataBackupManager();
      console.log('备份管理器初始化完成');
    } catch (error) {
      console.error('备份管理器初始化失败:', error);
    }
  },

  // 初始化提醒管理器
  initReminderManager: function() {
    try {
      this.reminderManager = new ReminderManager();
      console.log('提醒管理器初始化完成');
    } catch (error) {
      console.error('提醒管理器初始化失败:', error);
    }
  },

  // 初始化通知管理器
  initNotificationManager: function() {
    try {
      this.notificationManager = new NotificationManager();
      console.log('通知管理器初始化完成');
    } catch (error) {
      console.error('通知管理器初始化失败:', error);
    }
  },

  // 检查提醒
  checkReminders: function() {
    try {
      if (this.reminderManager && this.dataManager) {
        // 获取套餐卡数据
        var cards = this.dataManager.getCards();
        if (cards.length > 0) {
          // 使用基础提醒管理器
          this.reminderManager.checkAndShowReminders(cards);
          
          // 使用高级通知管理器
          if (this.notificationManager) {
            this.notificationManager.checkAndSendNotifications(cards);
          }
        }
      }
    } catch (error) {
      console.error('检查提醒失败:', error);
    }
  },

  // 检查数据完整性
  checkDataIntegrity: function() {
    try {
      if (this.dataManager) {
        var integrity = this.dataManager.checkDataIntegrity();
        if (!integrity.isValid) {
          console.warn('数据完整性检查发现问题:', integrity.issues);
          // 可以在这里添加用户提示
        }
      }
    } catch (error) {
      console.error('检查数据完整性失败:', error);
    }
  },

  // 创建自动备份
  createAutoBackup: function() {
    try {
      if (this.backupManager) {
        this.backupManager.createAutoBackup();
      }
    } catch (error) {
      console.error('创建自动备份失败:', error);
    }
  },

  // 获取数据管理器
  getDataManager: function() {
    return this.dataManager;
  },

  // 获取备份管理器
  getBackupManager: function() {
    return this.backupManager;
  },

  // 获取提醒管理器
  getReminderManager: function() {
    return this.reminderManager;
  },

  // 获取通知管理器
  getNotificationManager: function() {
    return this.notificationManager;
  },

  // 重置提醒检查状态（用于测试或特殊情况）
  resetReminderCheck: function() {
    this.hasCheckedReminders = false;
    if (this.reminderManager) {
      this.reminderManager.clearTodayReminderFlags();
    }
  }
});
