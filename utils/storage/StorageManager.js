// utils/storage/StorageManager.js - 存储管理器
export class StorageManager {
  constructor(strategy) {
    this.strategy = strategy;
  }
  
  // 设置存储策略
  setStrategy(strategy) {
    this.strategy = strategy;
  }
  
  // 保存数据
  async save(key, data) {
    try {
      return await this.strategy.save(key, data);
    } catch (error) {
      console.error('存储数据失败:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 加载数据
  async load(key) {
    try {
      return await this.strategy.load(key);
    } catch (error) {
      console.error('加载数据失败:', error);
      return null;
    }
  }
  
  // 删除数据
  async remove(key) {
    try {
      return await this.strategy.remove(key);
    } catch (error) {
      console.error('删除数据失败:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 清空所有数据
  async clear() {
    try {
      return await this.strategy.clear();
    } catch (error) {
      console.error('清空数据失败:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 同步数据（用于混合存储）
  async sync() {
    try {
      return await this.strategy.sync();
    } catch (error) {
      console.error('同步数据失败:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 获取存储信息
  async getInfo() {
    try {
      return await this.strategy.getInfo();
    } catch (error) {
      console.error('获取存储信息失败:', error);
      return null;
    }
  }
}
