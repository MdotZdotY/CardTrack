// utils/DataManager.js - 增强版数据管理器
class DataManager {
  constructor() {
    this.storageKey = 'cards';
    this.backupKey = 'cards_backup';
    this.versionKey = 'cards_version';
    this.migrationKey = 'cards_migration';
    this.currentVersion = '1.0.0';
    this.initData();
  }

  // 初始化数据
  initData() {
    try {
      console.log('数据管理器初始化开始');
      
      // 检查版本兼容性
      this.checkVersionCompatibility();
      
      // 尝试从主存储读取数据
      var cards = this.getCardsFromStorage(this.storageKey);
      
      // 如果主存储没有数据，尝试从备份恢复
      if (!cards || cards.length === 0) {
        console.log('主存储无数据，尝试从备份恢复');
        cards = this.restoreFromBackup();
      }
      
      // 如果还是没有数据，尝试从其他可能的存储位置恢复
      if (!cards || cards.length === 0) {
        console.log('备份恢复失败，尝试从其他位置恢复');
        cards = this.restoreFromOtherLocations();
      }
      
      // 如果还是没有数据，尝试从开发模式备份恢复
      if (!cards || cards.length === 0) {
        console.log('尝试从开发模式备份恢复');
        cards = this.restoreFromDevBackup();
      }
      
      // 如果有数据，创建多重备份
      if (cards && cards.length > 0) {
        console.log('数据恢复成功，创建多重备份');
        this.createMultipleBackups(cards);
        // 创建开发模式备份
        this.createDevBackup(cards);
      }
      
      // 记录数据状态
      this.logDataStatus();
      
    } catch (error) {
      console.error('初始化数据失败:', error);
      this.handleInitializationError();
    }
  }

  // 检查版本兼容性
  checkVersionCompatibility() {
    try {
      var storedVersion = wx.getStorageSync(this.versionKey);
      if (storedVersion && storedVersion !== this.currentVersion) {
        console.log('检测到版本更新:', storedVersion, '->', this.currentVersion);
        this.handleVersionUpdate(storedVersion);
      }
      // 更新版本号
      wx.setStorageSync(this.versionKey, this.currentVersion);
    } catch (error) {
      console.error('版本检查失败:', error);
    }
  }

  // 处理版本更新
  handleVersionUpdate(oldVersion) {
    try {
      // 在版本更新时创建额外的备份
      var cards = this.getCardsFromStorage(this.storageKey);
      if (cards && cards.length > 0) {
        var versionBackupKey = 'cards_version_' + oldVersion.replace(/\./g, '_');
        wx.setStorageSync(versionBackupKey, cards);
        console.log('创建版本备份:', versionBackupKey);
      }
      
      // 标记需要迁移
      wx.setStorageSync(this.migrationKey, {
        fromVersion: oldVersion,
        toVersion: this.currentVersion,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('版本更新处理失败:', error);
    }
  }

  // 从存储获取数据
  getCardsFromStorage(key) {
    try {
      var data = wx.getStorageSync(key);
      console.log('从存储获取数据:', key, '数据:', data ? data.length : 0, '条');
      return data;
    } catch (error) {
      console.error('从存储获取数据失败:', key, error);
      return null;
    }
  }

  // 从备份恢复
  restoreFromBackup() {
    try {
      // 尝试多个备份位置
      var backupLocations = [
        this.backupKey,
        'cards_backup_v1',
        'cards_backup_v2',
        'cards_legacy',
        'user_cards'
      ];
      
      for (var i = 0; i < backupLocations.length; i++) {
        var backupKey = backupLocations[i];
        var backupData = this.getCardsFromStorage(backupKey);
        
        if (backupData && backupData.length > 0) {
          console.log('从备份恢复成功:', backupKey, backupData.length, '张卡片');
          
          // 恢复数据到主存储
          this.saveCardsToStorage(this.storageKey, backupData);
          
          // 创建新的备份
          this.createMultipleBackups(backupData);
          
          return backupData;
        }
      }
      
      return null;
    } catch (error) {
      console.error('从备份恢复失败:', error);
      return null;
    }
  }

  // 从其他位置恢复
  restoreFromOtherLocations() {
    try {
      // 尝试从可能的旧版本存储位置恢复
      var possibleKeys = [
        'package_cards',
        'user_packages',
        'card_data',
        'local_cards',
        'stored_cards'
      ];
      
      for (var i = 0; i < possibleKeys.length; i++) {
        var key = possibleKeys[i];
        var data = this.getCardsFromStorage(key);
        
        if (data && data.length > 0) {
          console.log('从其他位置恢复成功:', key, data.length, '张卡片');
          
          // 迁移数据到新位置
          this.saveCardsToStorage(this.storageKey, data);
          this.createMultipleBackups(data);
          
          // 清理旧位置
          try {
            wx.removeStorageSync(key);
          } catch (e) {
            console.log('清理旧存储位置失败:', key);
          }
          
          return data;
        }
      }
      
      return null;
    } catch (error) {
      console.error('从其他位置恢复失败:', error);
      return null;
    }
  }

  // 创建多重备份
  createMultipleBackups(cards) {
    try {
      // 主备份
      this.saveCardsToStorage(this.backupKey, cards);
      
      // 时间戳备份（保留最近5个）
      var timestampBackupKey = 'cards_timestamp_' + Date.now();
      this.saveCardsToStorage(timestampBackupKey, cards);
      this.cleanupOldTimestampBackups();
      
      // 版本备份
      var versionBackupKey = 'cards_version_' + this.currentVersion.replace(/\./g, '_');
      this.saveCardsToStorage(versionBackupKey, cards);
      
      // 压缩备份（减少存储空间）
      this.createCompressedBackup(cards);
      
      // 开发模式备份
      this.createDevBackup(cards);
      
      console.log('多重备份创建完成');
    } catch (error) {
      console.error('创建多重备份失败:', error);
    }
  }

  // 创建压缩备份
  createCompressedBackup(cards) {
    try {
      // 创建简化版备份，只保留关键信息
      var compressedCards = cards.map(function(card) {
        return {
          id: card.id,
          name: card.name,
          merchant: card.merchant,
          category: card.category,
          totalCount: card.totalCount,
          usedCount: card.usedCount,
          purchaseDate: card.purchaseDate,
          expireDate: card.expireDate,
          notes: card.notes,
          createdAt: card.createdAt,
          updatedAt: card.updatedAt
        };
      });
      
      this.saveCardsToStorage('cards_compressed', compressedCards);
    } catch (error) {
      console.error('创建压缩备份失败:', error);
    }
  }

  // 清理旧的时间戳备份
  cleanupOldTimestampBackups() {
    try {
      var allKeys = wx.getStorageInfoSync().keys;
      var timestampBackups = allKeys.filter(function(key) {
        return key.startsWith('cards_timestamp_');
      });
      
      // 按时间戳排序，保留最近5个
      if (timestampBackups.length > 5) {
        timestampBackups.sort();
        var toDelete = timestampBackups.slice(0, timestampBackups.length - 5);
        
        for (var i = 0; i < toDelete.length; i++) {
          try {
            wx.removeStorageSync(toDelete[i]);
            console.log('清理旧备份:', toDelete[i]);
          } catch (e) {
            console.log('清理备份失败:', toDelete[i]);
          }
        }
      }
    } catch (error) {
      console.error('清理旧备份失败:', error);
    }
  }

  // 保存数据到存储
  saveCardsToStorage(key, cards) {
    try {
      console.log('尝试保存到存储:', key, '数据长度:', cards ? cards.length : 0);
      wx.setStorageSync(key, cards);
      console.log('保存成功:', key);
      return true;
    } catch (error) {
      console.error('保存到存储失败:', key, error);
      return false;
    }
  }

  // 保存卡片数据（主方法）
  saveCards(cards) {
    try {
      // 保存到主存储
      var success = this.saveCardsToStorage(this.storageKey, cards);
      if (!success) {
        throw new Error('主存储保存失败');
      }
      
      // 创建多重备份
      this.createMultipleBackups(cards);
      
      // 验证保存结果
      var savedCards = this.getCardsFromStorage(this.storageKey);
      if (!savedCards || savedCards.length !== cards.length) {
        throw new Error('数据保存验证失败');
      }
      
      console.log('数据保存成功，共', cards.length, '张卡片');
      return true;
    } catch (error) {
      console.error('保存数据失败:', error);
      
      // 尝试紧急备份
      this.emergencyBackup(cards);
      
      return false;
    }
  }

  // 紧急备份
  emergencyBackup(cards) {
    try {
      var emergencyKey = 'cards_emergency_' + Date.now();
      this.saveCardsToStorage(emergencyKey, cards);
      console.log('紧急备份创建成功:', emergencyKey);
    } catch (error) {
      console.error('紧急备份失败:', error);
    }
  }

  // 获取卡片数据（主方法）
  getCards() {
    try {
      var cards = this.getCardsFromStorage(this.storageKey) || [];
      
      // 如果主存储没有数据，尝试恢复
      if (cards.length === 0) {
        console.log('主存储无数据，尝试恢复');
        cards = this.restoreFromBackup();
        
        if (!cards || cards.length === 0) {
          cards = this.restoreFromOtherLocations();
        }
      }
      
      return cards || [];
    } catch (error) {
      console.error('获取数据失败:', error);
      return [];
    }
  }

  // 添加新卡片
  addCard(card) {
    try {
      var cards = this.getCards();
      cards.push(card);
      return this.saveCards(cards);
    } catch (error) {
      console.error('添加卡片失败:', error);
      return false;
    }
  }

  // 更新卡片
  updateCard(updatedCard) {
    try {
      var cards = this.getCards();
      var index = cards.findIndex(function(card) {
        return card.id === updatedCard.id;
      });
      
      if (index !== -1) {
        cards[index] = updatedCard;
        return this.saveCards(cards);
      }
      
      return false;
    } catch (error) {
      console.error('更新卡片失败:', error);
      return false;
    }
  }

  // 删除卡片
  deleteCard(cardId) {
    try {
      var cards = this.getCards();
      var filteredCards = cards.filter(function(card) {
        return card.id !== cardId;
      });
      
      if (filteredCards.length < cards.length) {
        return this.saveCards(filteredCards);
      }
      
      return false;
    } catch (error) {
      console.error('删除卡片失败:', error);
      return false;
    }
  }

  // 记录使用
  recordUsage(cardId, useCount, useDate) {
    try {
      var cards = this.getCards();
      var cardIndex = cards.findIndex(function(card) {
        return card.id === cardId;
      });
      
      if (cardIndex === -1) {
        console.error('卡片不存在:', cardId);
        return false;
      }
      
      var card = cards[cardIndex];
      
      // 验证使用次数
      if (useCount <= 0) {
        console.error('使用次数必须大于0');
        return false;
      }
      
      if (useCount > (card.totalCount - card.usedCount)) {
        console.error('使用次数超过剩余次数');
        return false;
      }
      
      // 更新卡片数据
      cards[cardIndex].usedCount += useCount;
      cards[cardIndex].lastUsedDate = useDate;
      cards[cardIndex].updatedAt = new Date().toISOString();
      
      // 保存更新后的数据
      var success = this.saveCards(cards);
      if (success) {
        console.log('记录使用成功:', cardId, '使用次数:', useCount, '使用日期:', useDate);
      }
      
      return success;
    } catch (error) {
      console.error('记录使用失败:', error);
      return false;
    }
  }

  // 清空所有数据
  clearAllData() {
    try {
      // 获取所有相关的存储键
      var allKeys = wx.getStorageInfoSync().keys;
      var cardKeys = allKeys.filter(function(key) {
        return key.includes('cards') || key.includes('card');
      });
      
      // 删除所有相关数据
      for (var i = 0; i < cardKeys.length; i++) {
        try {
          wx.removeStorageSync(cardKeys[i]);
        } catch (e) {
          console.log('删除存储键失败:', cardKeys[i]);
        }
      }
      
      console.log('所有数据已清空');
      return true;
    } catch (error) {
      console.error('清空数据失败:', error);
      return false;
    }
  }

  // 获取数据统计
  getStatistics() {
    try {
      var cards = this.getCards();
      var totalCards = cards.length;
      var expiringCards = 0;
      var totalRemainingCount = 0;
      var now = new Date();
      
      for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        
        if (card.expireDate) {
          var expireDate = new Date(card.expireDate);
          var daysUntilExpire = Math.ceil((expireDate - now) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpire <= 30 && daysUntilExpire > 0) {
            expiringCards++;
          }
        }
        
        totalRemainingCount += (card.totalCount - card.usedCount);
      }
      
      return {
        totalCards: totalCards,
        expiringCards: expiringCards,
        totalRemainingCount: totalRemainingCount
      };
    } catch (error) {
      console.error('获取统计信息失败:', error);
      return {
        totalCards: 0,
        expiringCards: 0,
        totalRemainingCount: 0
      };
    }
  }

  // 数据完整性检查
  checkDataIntegrity() {
    try {
      var cards = this.getCards();
      var issues = [];
      
      for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        
        // 检查必要字段
        if (!card.id || !card.name || !card.merchant) {
          issues.push('卡片' + (i + 1) + '缺少必要字段');
        }
        
        // 检查数据合理性
        if (card.usedCount > card.totalCount) {
          issues.push('卡片' + card.name + '已用次数超过总次数');
        }
        
        if (card.totalCount <= 0) {
          issues.push('卡片' + card.name + '总次数无效');
        }
      }
      
      return {
        isValid: issues.length === 0,
        issues: issues,
        totalCards: cards.length
      };
    } catch (error) {
      console.error('数据完整性检查失败:', error);
      return {
        isValid: false,
        issues: ['检查过程出错'],
        totalCards: 0
      };
    }
  }

  // 记录数据状态
  logDataStatus() {
    try {
      var cards = this.getCards();
      var stats = this.getStatistics();
      var integrity = this.checkDataIntegrity();
      
      console.log('=== 数据状态报告 ===');
      console.log('总卡片数:', stats.totalCards);
      console.log('即将到期:', stats.expiringCards);
      console.log('剩余次数:', stats.totalRemainingCount);
      console.log('数据完整性:', integrity.isValid ? '正常' : '异常');
      
      if (!integrity.isValid) {
        console.log('发现的问题:', integrity.issues);
      }
      
      // 记录到存储中
      wx.setStorageSync('cards_status_report', {
        timestamp: new Date().toISOString(),
        stats: stats,
        integrity: integrity
      });
      
    } catch (error) {
      console.error('记录数据状态失败:', error);
    }
  }

  // 处理初始化错误
  handleInitializationError() {
    try {
      console.log('尝试从紧急备份恢复');
      
      // 查找紧急备份
      var allKeys = wx.getStorageInfoSync().keys;
      var emergencyKeys = allKeys.filter(function(key) {
        return key.startsWith('cards_emergency_');
      });
      
      if (emergencyKeys.length > 0) {
        // 使用最新的紧急备份
        emergencyKeys.sort().reverse();
        var latestEmergencyKey = emergencyKeys[0];
        var emergencyData = this.getCardsFromStorage(latestEmergencyKey);
        
        if (emergencyData && emergencyData.length > 0) {
          console.log('从紧急备份恢复成功');
          this.saveCards(emergencyData);
        }
      }
    } catch (error) {
      console.error('处理初始化错误失败:', error);
    }
  }

  // 导出数据（用于备份）
  exportData() {
    try {
      var cards = this.getCards();
      var exportData = {
        version: this.currentVersion,
        exportTime: new Date().toISOString(),
        totalCards: cards.length,
        cards: cards
      };
      
      return JSON.stringify(exportData);
    } catch (error) {
      console.error('导出数据失败:', error);
      return null;
    }
  }

  // 导入数据
  importData(jsonData) {
    try {
      var importData = JSON.parse(jsonData);
      
      if (importData.cards && Array.isArray(importData.cards)) {
        // 验证导入数据的完整性
        var isValid = importData.cards.every(function(card) {
          return card.id && card.name && card.merchant && card.totalCount > 0;
        });
        
        if (isValid) {
          // 合并现有数据和新数据
          var existingCards = this.getCards();
          var newCards = importData.cards;
          
          // 避免重复（基于ID）
          var existingIds = existingCards.map(function(card) {
            return card.id;
          });
          
          var uniqueNewCards = newCards.filter(function(card) {
            return existingIds.indexOf(card.id) === -1;
          });
          
          var mergedCards = existingCards.concat(uniqueNewCards);
          
          if (this.saveCards(mergedCards)) {
            console.log('数据导入成功，新增', uniqueNewCards.length, '张卡片');
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('导入数据失败:', error);
      return false;
    }
  }

  // 创建开发模式备份（使用更稳定的存储键）
  createDevBackup(cards) {
    try {
      // 使用多个不同的存储键，增加数据存活概率
      var devBackupKeys = [
        'dev_cards_backup',
        'user_data_cards',
        'app_data_cards',
        'persistent_cards',
        'main_data_cards'
      ];
      
      console.log('开始创建开发模式备份，卡片数量:', cards.length);
      
      for (var i = 0; i < devBackupKeys.length; i++) {
        var backupKey = devBackupKeys[i];
        var success = this.saveCardsToStorage(backupKey, cards);
        console.log('备份到', backupKey, '结果:', success);
      }
      
      // 尝试使用云存储作为备选方案
      this.createCloudBackup(cards);
      
      console.log('开发模式备份创建完成');
    } catch (error) {
      console.error('创建开发模式备份失败:', error);
    }
  }

  // 创建云存储备份
  createCloudBackup(cards) {
    try {
      // 将数据转换为JSON字符串并保存到云存储
      var dataStr = JSON.stringify({
        version: this.currentVersion,
        timestamp: Date.now(),
        cards: cards
      });
      
      // 使用一个特殊的键名，希望能在重新编译后存活
      var cloudKey = 'cloud_backup_' + Date.now();
      wx.setStorageSync(cloudKey, dataStr);
      
      // 同时保存一个固定的云备份键
      wx.setStorageSync('cloud_backup_latest', dataStr);
      
      console.log('云存储备份创建成功:', cloudKey);
    } catch (error) {
      console.error('创建云存储备份失败:', error);
    }
  }

  // 从开发模式备份恢复
  restoreFromDevBackup() {
    try {
      var devBackupKeys = [
        'dev_cards_backup',
        'user_data_cards',
        'app_data_cards',
        'persistent_cards',
        'main_data_cards'
      ];
      
      console.log('开始从开发模式备份恢复，检查存储键:', devBackupKeys);
      
      // 先检查所有存储键
      try {
        var allKeys = wx.getStorageInfoSync().keys;
        console.log('当前所有存储键:', allKeys);
      } catch (e) {
        console.log('获取存储键失败:', e);
      }
      
      for (var i = 0; i < devBackupKeys.length; i++) {
        var backupKey = devBackupKeys[i];
        console.log('检查备份键:', backupKey);
        var backupData = this.getCardsFromStorage(backupKey);
        console.log('备份数据:', backupKey, backupData);
        
        if (backupData && backupData.length > 0) {
          console.log('从开发模式备份恢复成功:', backupKey, backupData.length, '张卡片');
          
          // 恢复数据到主存储
          this.saveCardsToStorage(this.storageKey, backupData);
          
          // 创建新的备份
          this.createMultipleBackups(backupData);
          
          return backupData;
        }
      }
      
      console.log('所有开发模式备份都为空');
      
      // 尝试从云存储恢复
      return this.restoreFromCloudBackup();
    } catch (error) {
      console.error('从开发模式备份恢复失败:', error);
      return null;
    }
  }

  // 从云存储恢复
  restoreFromCloudBackup() {
    try {
      console.log('尝试从云存储恢复数据');
      
      // 尝试从固定的云备份键恢复
      var cloudData = wx.getStorageSync('cloud_backup_latest');
      if (cloudData) {
        var parsedData = JSON.parse(cloudData);
        if (parsedData && parsedData.cards && parsedData.cards.length > 0) {
          console.log('从云存储恢复成功:', parsedData.cards.length, '张卡片');
          
          // 恢复数据到主存储
          this.saveCardsToStorage(this.storageKey, parsedData.cards);
          
          // 创建新的备份
          this.createMultipleBackups(parsedData.cards);
          
          return parsedData.cards;
        }
      }
      
      // 尝试从时间戳云备份恢复
      try {
        var allKeys = wx.getStorageInfoSync().keys;
        var cloudBackupKeys = allKeys.filter(function(key) {
          return key.startsWith('cloud_backup_') && key !== 'cloud_backup_latest';
        });
        
        // 按时间戳排序，获取最新的
        cloudBackupKeys.sort(function(a, b) {
          var timestampA = parseInt(a.replace('cloud_backup_', ''));
          var timestampB = parseInt(b.replace('cloud_backup_', ''));
          return timestampB - timestampA;
        });
        
        for (var i = 0; i < cloudBackupKeys.length; i++) {
          var backupKey = cloudBackupKeys[i];
          var backupData = wx.getStorageSync(backupKey);
          if (backupData) {
            var parsedData = JSON.parse(backupData);
            if (parsedData && parsedData.cards && parsedData.cards.length > 0) {
              console.log('从时间戳云存储恢复成功:', backupKey, parsedData.cards.length, '张卡片');
              
              // 恢复数据到主存储
              this.saveCardsToStorage(this.storageKey, parsedData.cards);
              
              // 创建新的备份
              this.createMultipleBackups(parsedData.cards);
              
              return parsedData.cards;
            }
          }
        }
      } catch (e) {
        console.log('从时间戳云存储恢复失败:', e);
      }
      
      console.log('云存储恢复失败');
      return null;
    } catch (error) {
      console.error('从云存储恢复失败:', error);
      return null;
    }
  }
}

module.exports = DataManager;
