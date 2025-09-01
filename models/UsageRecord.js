// models/UsageRecord.js - 使用记录数据模型
export class UsageRecord {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.cardId = data.cardId || '';
    this.usageDate = data.usageDate || new Date().toISOString();
    this.notes = data.notes || '';
    this.createdAt = data.createdAt || new Date().toISOString();
  }
  
  // 生成唯一ID
  generateId() {
    return 'usage_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  // 格式化使用日期
  getFormattedDate() {
    const date = new Date(this.usageDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
  
  // 获取相对时间描述
  getRelativeTime() {
    const now = new Date();
    const usageTime = new Date(this.usageDate);
    const diffMs = now.getTime() - usageTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) return '刚刚';
    if (diffMinutes < 60) return `${diffMinutes}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    
    return this.getFormattedDate();
  }
  
  // 验证数据完整性
  validate() {
    const errors = [];
    
    if (!this.cardId) {
      errors.push('卡片ID不能为空');
    }
    
    if (!this.usageDate) {
      errors.push('使用日期不能为空');
    }
    
    const usageTime = new Date(this.usageDate).getTime();
    if (isNaN(usageTime)) {
      errors.push('使用日期格式不正确');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
  
  // 转换为存储格式
  toStorage() {
    return {
      id: this.id,
      cardId: this.cardId,
      usageDate: this.usageDate,
      notes: this.notes,
      createdAt: this.createdAt
    };
  }
  
  // 从存储格式创建实例
  static fromStorage(data) {
    return new UsageRecord(data);
  }
}
