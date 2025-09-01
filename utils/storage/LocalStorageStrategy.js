// utils/storage/LocalStorageStrategy.js - 本地存储策略
export class LocalStorageStrategy {
  constructor() {
    this.storageKeys = {
      cards: 'cards',
      usageRecords: 'usage_records',
      settings: 'user_settings',
      notifications: 'notifications'
    };
  }
  
  // 保存数据到本地存储
  async save(key, data) {
    return new Promise((resolve, reject) => {
      try {
        const jsonData = JSON.stringify(data);
        wx.setStorageSync(key, jsonData);
        resolve({ success: true, message: '保存成功' });
      } catch (error) {
        console.error('本地存储保存失败:', error);
        reject(error);
      }
    });
  }
  
  // 从本地存储加载数据
  async load(key) {
    return new Promise((resolve, reject) => {
      try {
        const data = wx.getStorageSync(key);
        if (data) {
          const parsedData = JSON.parse(data);
          resolve(parsedData);
        } else {
          resolve(null);
        }
      } catch (error) {
        console.error('本地存储加载失败:', error);
        reject(error);
      }
    });
  }
  
  // 删除本地存储数据
  async remove(key) {
    return new Promise((resolve, reject) => {
      try {
        wx.removeStorageSync(key);
        resolve({ success: true, message: '删除成功' });
      } catch (error) {
        console.error('本地存储删除失败:', error);
        reject(error);
      }
    });
  }
  
  // 清空所有本地存储
  async clear() {
    return new Promise((resolve, reject) => {
      try {
        wx.clearStorageSync();
        resolve({ success: true, message: '清空成功' });
      } catch (error) {
        console.error('本地存储清空失败:', error);
        reject(error);
      }
    });
  }
  
  // 本地存储无需同步
  async sync() {
    return { success: true, message: '本地存储无需同步' };
  }
  
  // 获取本地存储信息
  async getInfo() {
    return new Promise((resolve, reject) => {
      try {
        const info = wx.getStorageInfoSync();
        resolve({
          type: 'local',
          keys: info.keys,
          currentSize: info.currentSize,
          limitSize: info.limitSize
        });
      } catch (error) {
        console.error('获取本地存储信息失败:', error);
        reject(error);
      }
    });
  }
  
  // 检查存储空间
  async checkStorageSpace() {
    try {
      const info = await this.getInfo();
      const usagePercent = (info.currentSize / info.limitSize) * 100;
      return {
        available: usagePercent < 80,
        usagePercent: usagePercent,
        currentSize: info.currentSize,
        limitSize: info.limitSize
      };
    } catch (error) {
      console.error('检查存储空间失败:', error);
      return { available: true, usagePercent: 0 };
    }
  }
  
  // 备份数据
  async backup() {
    try {
      const backup = {};
      for (const [key, storageKey] of Object.entries(this.storageKeys)) {
        const data = await this.load(storageKey);
        if (data) {
          backup[key] = data;
        }
      }
      return { success: true, data: backup };
    } catch (error) {
      console.error('备份数据失败:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 恢复数据
  async restore(backupData) {
    try {
      for (const [key, data] of Object.entries(backupData)) {
        const storageKey = this.storageKeys[key];
        if (storageKey) {
          await this.save(storageKey, data);
        }
      }
      return { success: true, message: '数据恢复成功' };
    } catch (error) {
      console.error('恢复数据失败:', error);
      return { success: false, error: error.message };
    }
  }
}
