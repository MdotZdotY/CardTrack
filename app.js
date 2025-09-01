// app.js - 小程序入口文件
import { StorageManager } from './utils/storage/StorageManager.js';
import { LocalStorageStrategy } from './utils/storage/LocalStorageStrategy.js';
import { CardService } from './services/CardService.js';
import { NotificationManager } from './utils/NotificationManager.js';

App({
  globalData: {
    userInfo: null
  },

  onLaunch() {
    console.log('卡点小程序启动');
    this.initStorage();
    this.initServices();
  },

  onShow() {
    // 小程序显示时检查提醒
    this.checkNotifications();
  },

  // 初始化存储系统
  initStorage() {
    // V1.0版本：使用本地存储策略
    const localStrategy = new LocalStorageStrategy();
    this.storageManager = new StorageManager(localStrategy);
    
    console.log('存储系统初始化完成');
  },

  // 初始化业务服务
  initServices() {
    this.cardService = new CardService(this.storageManager);
    this.notificationManager = new NotificationManager();
    
    console.log('业务服务初始化完成');
  },

  // 获取卡片服务
  getCardService() {
    return this.cardService;
  },

  // 获取存储管理器
  getStorageManager() {
    return this.storageManager;
  },

  // 获取通知管理器
  getNotificationManager() {
    return this.notificationManager;
  },

  // 检查并发送提醒
  async checkNotifications() {
    try {
      const expiringCards = await this.cardService.getExpiringSoonCards();
      if (expiringCards.length > 0) {
        this.notificationManager.showExpireReminder(expiringCards);
      }
    } catch (error) {
      console.error('检查提醒失败:', error);
    }
  }
});
