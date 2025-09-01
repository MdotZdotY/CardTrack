// services/CardService.js - 套餐卡业务服务
import { Card } from '../models/Card.js';
import { UsageRecord } from '../models/UsageRecord.js';

export class CardService {
  constructor(storageManager) {
    this.storage = storageManager;
    this.STORAGE_KEYS = {
      cards: 'cards',
      usageRecords: 'usage_records'
    };
  }
  
  // 获取所有卡片
  async getAllCards() {
    try {
      const cardsData = await this.storage.load(this.STORAGE_KEYS.cards) || [];
      return cardsData.map(data => Card.fromStorage(data));
    } catch (error) {
      console.error('获取所有卡片失败:', error);
      return [];
    }
  }
  
  // 根据ID获取卡片
  async getCardById(cardId) {
    try {
      const cards = await this.getAllCards();
      return cards.find(card => card.id === cardId) || null;
    } catch (error) {
      console.error('根据ID获取卡片失败:', error);
      return null;
    }
  }
  
  // 添加新卡片
  async addCard(cardData) {
    try {
      const newCard = new Card(cardData);
      
      // 验证数据
      const validation = newCard.validate();
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }
      
      const cards = await this.getAllCards();
      cards.push(newCard);
      
      const saveResult = await this.storage.save(
        this.STORAGE_KEYS.cards, 
        cards.map(card => card.toStorage())
      );
      
      if (saveResult.success) {
        return { success: true, card: newCard };
      } else {
        return { success: false, error: '保存失败' };
      }
    } catch (error) {
      console.error('添加卡片失败:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 更新卡片
  async updateCard(cardId, updates) {
    try {
      const cards = await this.getAllCards();
      const cardIndex = cards.findIndex(card => card.id === cardId);
      
      if (cardIndex === -1) {
        return { success: false, error: '卡片不存在' };
      }
      
      // 更新卡片数据
      const updatedCard = new Card({
        ...cards[cardIndex].toStorage(),
        ...updates,
        updatedAt: new Date().toISOString()
      });
      
      // 验证数据
      const validation = updatedCard.validate();
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }
      
      cards[cardIndex] = updatedCard;
      
      const saveResult = await this.storage.save(
        this.STORAGE_KEYS.cards, 
        cards.map(card => card.toStorage())
      );
      
      if (saveResult.success) {
        return { success: true, card: updatedCard };
      } else {
        return { success: false, error: '保存失败' };
      }
    } catch (error) {
      console.error('更新卡片失败:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 删除卡片
  async deleteCard(cardId) {
    try {
      const cards = await this.getAllCards();
      const filteredCards = cards.filter(card => card.id !== cardId);
      
      if (filteredCards.length === cards.length) {
        return { success: false, error: '卡片不存在' };
      }
      
      const saveResult = await this.storage.save(
        this.STORAGE_KEYS.cards, 
        filteredCards.map(card => card.toStorage())
      );
      
      if (saveResult.success) {
        // 同时删除相关的使用记录
        await this.deleteUsageRecordsByCardId(cardId);
        return { success: true };
      } else {
        return { success: false, error: '删除失败' };
      }
    } catch (error) {
      console.error('删除卡片失败:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 记录使用
  async recordUsage(cardId, notes = '') {
    try {
      const cards = await this.getAllCards();
      const card = cards.find(c => c.id === cardId);
      
      if (!card) {
        return { success: false, error: '卡片不存在' };
      }
      
      if (!card.canUse()) {
        return { success: false, error: '卡片无法使用' };
      }
      
      // 记录使用
      const useResult = card.use(notes);
      if (!useResult.success) {
        return useResult;
      }
      
      // 保存卡片数据
      const saveResult = await this.storage.save(
        this.STORAGE_KEYS.cards, 
        cards.map(c => c.toStorage())
      );
      
      if (!saveResult.success) {
        return { success: false, error: '保存失败' };
      }
      
      // 创建使用记录
      const usageRecord = new UsageRecord({
        cardId: cardId,
        notes: notes
      });
      
      await this.addUsageRecord(usageRecord);
      
      return { 
        success: true, 
        card: card,
        usageRecord: usageRecord,
        remainingCount: useResult.remainingCount,
        progress: useResult.progress
      };
    } catch (error) {
      console.error('记录使用失败:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 撤销使用
  async undoUsage(cardId) {
    try {
      const cards = await this.getAllCards();
      const card = cards.find(c => c.id === cardId);
      
      if (!card) {
        return { success: false, error: '卡片不存在' };
      }
      
      if (!card.canUndo()) {
        return { success: false, error: '无法撤销使用' };
      }
      
      // 撤销使用
      const undoResult = card.undoUse();
      if (!undoResult.success) {
        return undoResult;
      }
      
      // 保存卡片数据
      const saveResult = await this.storage.save(
        this.STORAGE_KEYS.cards, 
        cards.map(c => c.toStorage())
      );
      
      if (!saveResult.success) {
        return { success: false, error: '保存失败' };
      }
      
      // 删除最近的使用记录
      await this.deleteLastUsageRecord(cardId);
      
      return { 
        success: true, 
        card: card,
        remainingCount: undoResult.remainingCount,
        progress: undoResult.progress
      };
    } catch (error) {
      console.error('撤销使用失败:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 获取即将到期的卡片
  async getExpiringSoonCards(days = 30) {
    try {
      const cards = await this.getAllCards();
      return cards.filter(card => card.isExpiringSoon(days));
    } catch (error) {
      console.error('获取即将到期卡片失败:', error);
      return [];
    }
  }
  
  // 根据分类获取卡片
  async getCardsByCategory(category) {
    try {
      const cards = await this.getAllCards();
      return cards.filter(card => card.category === category);
    } catch (error) {
      console.error('根据分类获取卡片失败:', error);
      return [];
    }
  }
  
  // 搜索卡片
  async searchCards(keyword) {
    try {
      const cards = await this.getAllCards();
      const lowerKeyword = keyword.toLowerCase();
      
      return cards.filter(card => 
        card.name.toLowerCase().includes(lowerKeyword) ||
        card.merchant.toLowerCase().includes(lowerKeyword) ||
        card.notes.toLowerCase().includes(lowerKeyword)
      );
    } catch (error) {
      console.error('搜索卡片失败:', error);
      return [];
    }
  }
  
  // 获取统计信息
  async getStatistics() {
    try {
      const cards = await this.getAllCards();
      
      const totalCards = cards.length;
      const activeCards = cards.filter(card => card.canUse()).length;
      const expiringCards = cards.filter(card => card.isExpiringSoon(30)).length;
      const expiredCards = cards.filter(card => card.isExpired()).length;
      const totalRemainingCount = cards.reduce((sum, card) => sum + card.getRemainingCount(), 0);
      
      const categoryStats = {};
      cards.forEach(card => {
        if (!categoryStats[card.category]) {
          categoryStats[card.category] = 0;
        }
        categoryStats[card.category]++;
      });
      
      return {
        totalCards,
        activeCards,
        expiringCards,
        expiredCards,
        totalRemainingCount,
        categoryStats
      };
    } catch (error) {
      console.error('获取统计信息失败:', error);
      return {
        totalCards: 0,
        activeCards: 0,
        expiringCards: 0,
        expiredCards: 0,
        totalRemainingCount: 0,
        categoryStats: {}
      };
    }
  }
  
  // 添加使用记录
  async addUsageRecord(usageRecord) {
    try {
      const records = await this.getUsageRecords();
      records.push(usageRecord);
      
      const saveResult = await this.storage.save(
        this.STORAGE_KEYS.usageRecords,
        records.map(record => record.toStorage())
      );
      
      return saveResult;
    } catch (error) {
      console.error('添加使用记录失败:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 获取使用记录
  async getUsageRecords(cardId = null) {
    try {
      const recordsData = await this.storage.load(this.STORAGE_KEYS.usageRecords) || [];
      const records = recordsData.map(data => UsageRecord.fromStorage(data));
      
      if (cardId) {
        return records.filter(record => record.cardId === cardId);
      }
      
      return records;
    } catch (error) {
      console.error('获取使用记录失败:', error);
      return [];
    }
  }
  
  // 删除指定卡片的使用记录
  async deleteUsageRecordsByCardId(cardId) {
    try {
      const records = await this.getUsageRecords();
      const filteredRecords = records.filter(record => record.cardId !== cardId);
      
      const saveResult = await this.storage.save(
        this.STORAGE_KEYS.usageRecords,
        filteredRecords.map(record => record.toStorage())
      );
      
      return saveResult;
    } catch (error) {
      console.error('删除使用记录失败:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 删除最近的使用记录
  async deleteLastUsageRecord(cardId) {
    try {
      const records = await this.getUsageRecords(cardId);
      if (records.length === 0) {
        return { success: false, error: '没有使用记录' };
      }
      
      // 按时间排序，删除最新的记录
      records.sort((a, b) => new Date(b.usageDate) - new Date(a.usageDate));
      const latestRecord = records[0];
      
      const allRecords = await this.getUsageRecords();
      const filteredRecords = allRecords.filter(record => record.id !== latestRecord.id);
      
      const saveResult = await this.storage.save(
        this.STORAGE_KEYS.usageRecords,
        filteredRecords.map(record => record.toStorage())
      );
      
      return saveResult;
    } catch (error) {
      console.error('删除最近使用记录失败:', error);
      return { success: false, error: error.message };
    }
  }
}
