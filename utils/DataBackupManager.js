// utils/DataBackupManager.js - 数据备份和恢复管理器
class DataBackupManager {
  constructor() {
    this.backupPrefix = 'cards_backup_';
    this.maxBackups = 10;
    this.autoBackupInterval = 24 * 60 * 60 * 1000; // 24小时
    this.lastBackupTime = 0;
    this.init();
  }

  // 初始化
  init() {
    try {
      // 检查是否需要自动备份
      this.checkAutoBackup();
      
      // 清理过期备份
      this.cleanupExpiredBackups();
      
      console.log('数据备份管理器初始化完成');
    } catch (error) {
      console.error('数据备份管理器初始化失败:', error);
    }
  }

  // 检查自动备份
  checkAutoBackup() {
    try {
      var now = Date.now();
      var lastBackup = wx.getStorageSync('last_auto_backup') || 0;
      
      if (now - lastBackup > this.autoBackupInterval) {
        console.log('执行自动备份');
        this.createAutoBackup();
        wx.setStorageSync('last_auto_backup', now);
      }
    } catch (error) {
      console.error('检查自动备份失败:', error);
    }
  }

  // 创建自动备份
  createAutoBackup() {
    try {
      var cards = wx.getStorageSync('cards') || [];
      if (cards.length > 0) {
        var backupKey = this.backupPrefix + 'auto_' + Date.now();
        wx.setStorageSync(backupKey, {
          type: 'auto',
          timestamp: new Date().toISOString(),
          data: cards,
          count: cards.length
        });
        
        console.log('自动备份创建成功:', backupKey);
      }
    } catch (error) {
      console.error('创建自动备份失败:', error);
    }
  }

  // 创建手动备份
  createManualBackup(description) {
    try {
      var cards = wx.getStorageSync('cards') || [];
      if (cards.length > 0) {
        var backupKey = this.backupPrefix + 'manual_' + Date.now();
        var backupData = {
          type: 'manual',
          description: description || '手动备份',
          timestamp: new Date().toISOString(),
          data: cards,
          count: cards.length,
          version: '1.0.0'
        };
        
        wx.setStorageSync(backupKey, backupData);
        
        // 更新备份列表
        this.updateBackupList(backupKey, backupData);
        
        console.log('手动备份创建成功:', backupKey);
        return backupKey;
      }
      
      return null;
    } catch (error) {
      console.error('创建手动备份失败:', error);
      return null;
    }
  }

  // 更新备份列表
  updateBackupList(backupKey, backupData) {
    try {
      var backupList = wx.getStorageSync('backup_list') || [];
      
      // 添加新备份
      backupList.push({
        key: backupKey,
        type: backupData.type,
        description: backupData.description,
        timestamp: backupData.timestamp,
        count: backupData.count
      });
      
      // 按时间排序
      backupList.sort(function(a, b) {
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
      
      // 限制备份数量
      if (backupList.length > this.maxBackups) {
        backupList = backupList.slice(0, this.maxBackups);
      }
      
      wx.setStorageSync('backup_list', backupList);
    } catch (error) {
      console.error('更新备份列表失败:', error);
    }
  }

  // 获取备份列表
  getBackupList() {
    try {
      return wx.getStorageSync('backup_list') || [];
    } catch (error) {
      console.error('获取备份列表失败:', error);
      return [];
    }
  }

  // 从备份恢复
  restoreFromBackup(backupKey) {
    try {
      var backupData = wx.getStorageSync(backupKey);
      if (backupData && backupData.data) {
        // 验证备份数据
        if (this.validateBackupData(backupData)) {
          // 恢复数据
          wx.setStorageSync('cards', backupData.data);
          
          // 创建恢复记录
          this.logRestore(backupKey, backupData);
          
          console.log('从备份恢复成功:', backupKey, backupData.count, '张卡片');
          return true;
        } else {
          console.error('备份数据验证失败:', backupKey);
          return false;
        }
      }
      
      return false;
    } catch (error) {
      console.error('从备份恢复失败:', error);
      return false;
    }
  }

  // 验证备份数据
  validateBackupData(backupData) {
    try {
      if (!backupData.data || !Array.isArray(backupData.data)) {
        return false;
      }
      
      // 检查数据完整性
      for (var i = 0; i < backupData.data.length; i++) {
        var card = backupData.data[i];
        if (!card.id || !card.name || !card.merchant || !card.totalCount) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('验证备份数据失败:', error);
      return false;
    }
  }

  // 记录恢复操作
  logRestore(backupKey, backupData) {
    try {
      var restoreLog = wx.getStorageSync('restore_log') || [];
      
      restoreLog.push({
        backupKey: backupKey,
        restoreTime: new Date().toISOString(),
        backupTime: backupData.timestamp,
        cardCount: backupData.count,
        description: backupData.description || '未知'
      });
      
      // 限制日志数量
      if (restoreLog.length > 50) {
        restoreLog = restoreLog.slice(-50);
      }
      
      wx.setStorageSync('restore_log', restoreLog);
    } catch (error) {
      console.error('记录恢复日志失败:', error);
    }
  }

  // 删除备份
  deleteBackup(backupKey) {
    try {
      // 从存储中删除
      wx.removeStorageSync(backupKey);
      
      // 从备份列表中移除
      var backupList = this.getBackupList();
      var updatedList = backupList.filter(function(backup) {
        return backup.key !== backupKey;
      });
      
      wx.setStorageSync('backup_list', updatedList);
      
      console.log('备份删除成功:', backupKey);
      return true;
    } catch (error) {
      console.error('删除备份失败:', error);
      return false;
    }
  }

  // 清理过期备份
  cleanupExpiredBackups() {
    try {
      var backupList = this.getBackupList();
      var now = Date.now();
      var maxAge = 30 * 24 * 60 * 60 * 1000; // 30天
      
      for (var i = 0; i < backupList.length; i++) {
        var backup = backupList[i];
        var backupTime = new Date(backup.timestamp).getTime();
        
        if (now - backupTime > maxAge) {
          console.log('清理过期备份:', backup.key);
          this.deleteBackup(backup.key);
        }
      }
    } catch (error) {
      console.error('清理过期备份失败:', error);
    }
  }

  // 导出备份数据
  exportBackup(backupKey) {
    try {
      var backupData = wx.getStorageSync(backupKey);
      if (backupData) {
        return JSON.stringify(backupData);
      }
      return null;
    } catch (error) {
      console.error('导出备份失败:', error);
      return null;
    }
  }

  // 导入备份数据
  importBackup(jsonData) {
    try {
      var backupData = JSON.parse(jsonData);
      
      if (this.validateBackupData(backupData)) {
        var backupKey = this.backupPrefix + 'imported_' + Date.now();
        
        // 保存导入的备份
        wx.setStorageSync(backupKey, backupData);
        
        // 更新备份列表
        this.updateBackupList(backupKey, backupData);
        
        console.log('备份导入成功:', backupKey);
        return backupKey;
      }
      
      return null;
    } catch (error) {
      console.error('导入备份失败:', error);
      return null;
    }
  }

  // 获取存储使用情况
  getStorageUsage() {
    try {
      var storageInfo = wx.getStorageInfoSync();
      var cardKeys = storageInfo.keys.filter(function(key) {
        return key.includes('cards') || key.includes('card');
      });
      
      var totalSize = 0;
      for (var i = 0; i < cardKeys.length; i++) {
        try {
          var data = wx.getStorageSync(cardKeys[i]);
          if (data) {
            totalSize += JSON.stringify(data).length;
          }
        } catch (e) {
          // 忽略无法读取的键
        }
      }
      
      return {
        totalKeys: storageInfo.keys.length,
        cardKeys: cardKeys.length,
        totalSize: totalSize,
        limitSize: storageInfo.limitSize
      };
    } catch (error) {
      console.error('获取存储使用情况失败:', error);
      return {
        totalKeys: 0,
        cardKeys: 0,
        totalSize: 0,
        limitSize: 0
      };
    }
  }

  // 优化存储空间
  optimizeStorage() {
    try {
      console.log('开始优化存储空间');
      
      // 清理重复备份
      this.removeDuplicateBackups();
      
      // 压缩旧备份
      this.compressOldBackups();
      
      // 清理临时文件
      this.cleanupTempFiles();
      
      console.log('存储空间优化完成');
    } catch (error) {
      console.error('优化存储空间失败:', error);
    }
  }

  // 移除重复备份
  removeDuplicateBackups() {
    try {
      var backupList = this.getBackupList();
      var seen = {};
      var duplicates = [];
      
      for (var i = 0; i < backupList.length; i++) {
        var backup = backupList[i];
        var key = backup.timestamp + '_' + backup.count;
        
        if (seen[key]) {
          duplicates.push(backup.key);
        } else {
          seen[key] = true;
        }
      }
      
      // 删除重复备份
      for (var j = 0; j < duplicates.length; j++) {
        this.deleteBackup(duplicates[j]);
      }
      
      if (duplicates.length > 0) {
        console.log('删除了', duplicates.length, '个重复备份');
      }
    } catch (error) {
      console.error('移除重复备份失败:', error);
    }
  }

  // 压缩旧备份
  compressOldBackups() {
    try {
      var backupList = this.getBackupList();
      var now = Date.now();
      var compressAge = 7 * 24 * 60 * 60 * 1000; // 7天
      
      for (var i = 0; i < backupList.length; i++) {
        var backup = backupList[i];
        var backupTime = new Date(backup.timestamp).getTime();
        
        if (now - backupTime > compressAge) {
          this.compressBackup(backup.key);
        }
      }
    } catch (error) {
      console.error('压缩旧备份失败:', error);
    }
  }

  // 压缩单个备份
  compressBackup(backupKey) {
    try {
      var backupData = wx.getStorageSync(backupKey);
      if (backupData && backupData.data) {
        // 创建压缩版本
        var compressedData = {
          type: backupData.type + '_compressed',
          timestamp: backupData.timestamp,
          data: backupData.data.map(function(card) {
            return {
              id: card.id,
              name: card.name,
              merchant: card.merchant,
              category: card.category,
              totalCount: card.totalCount,
              usedCount: card.usedCount,
              purchaseDate: card.purchaseDate,
              expireDate: card.expireDate
            };
          }),
          count: backupData.count
        };
        
        // 保存压缩版本
        var compressedKey = backupKey + '_compressed';
        wx.setStorageSync(compressedKey, compressedData);
        
        // 删除原备份
        this.deleteBackup(backupKey);
        
        console.log('备份压缩完成:', backupKey, '->', compressedKey);
      }
    } catch (error) {
      console.error('压缩备份失败:', error);
    }
  }

  // 清理临时文件
  cleanupTempFiles() {
    try {
      var allKeys = wx.getStorageInfoSync().keys;
      var tempKeys = allKeys.filter(function(key) {
        return key.includes('temp') || key.includes('tmp');
      });
      
      for (var i = 0; i < tempKeys.length; i++) {
        try {
          wx.removeStorageSync(tempKeys[i]);
        } catch (e) {
          // 忽略删除失败的情况
        }
      }
      
      if (tempKeys.length > 0) {
        console.log('清理了', tempKeys.length, '个临时文件');
      }
    } catch (error) {
      console.error('清理临时文件失败:', error);
    }
  }
}

module.exports = DataBackupManager;

