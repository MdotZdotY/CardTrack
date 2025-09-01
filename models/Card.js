// models/Card.js - 套餐卡数据模型
export class Card {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.name = data.name || '';
    this.merchant = data.merchant || '';
    this.category = data.category || '其他';
    this.totalCount = data.totalCount || 0;
    this.usedCount = data.usedCount || 0;
    this.purchaseDate = data.purchaseDate || new Date().toISOString();
    this.expireDate = data.expireDate || '';
    this.imageUrl = data.imageUrl || '';
    this.notes = data.notes || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }
  
  // 生成唯一ID
  generateId() {
    return 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  // 获取剩余次数
  getRemainingCount() {
    return Math.max(0, this.totalCount - this.usedCount);
  }
  
  // 获取使用进度百分比
  getProgress() {
    return this.totalCount > 0 ? Math.round((this.usedCount / this.totalCount) * 100) : 0;
  }
  
  // 检查是否即将到期
  isExpiringSoon(days = 30) {
    if (!this.expireDate) return false;
    const expireTime = new Date(this.expireDate).getTime();
    const now = Date.now();
    const daysInMs = days * 24 * 60 * 60 * 1000;
    return expireTime - now <= daysInMs && expireTime - now > 0;
  }
  
  // 检查是否已过期
  isExpired() {
    if (!this.expireDate) return false;
    const expireTime = new Date(this.expireDate).getTime();
    const now = Date.now();
    return expireTime - now < 0;
  }
  
  // 获取到期状态
  getExpireStatus() {
    if (!this.expireDate) return 'no-expire';
    if (this.isExpired()) return 'expired';
    if (this.isExpiringSoon(7)) return 'expiring-soon';
    if (this.isExpiringSoon(30)) return 'expiring';
    return 'normal';
  }
  
  // 获取到期剩余天数
  getExpireDays() {
    if (!this.expireDate) return null;
    const expireTime = new Date(this.expireDate).getTime();
    const now = Date.now();
    const diffMs = expireTime - now;
    return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  }
  
  // 格式化到期文本
  getExpireText() {
    if (!this.expireDate) return '无到期日';
    
    const days = this.getExpireDays();
    if (days < 0) return '已过期';
    if (days === 0) return '今日到期';
    if (days <= 7) return `${days}天后到期`;
    if (days <= 30) return `${days}天后到期`;
    
    const months = Math.ceil(days / 30);
    return `${months}个月后到期`;
  }
  
  // 记录使用（+1次）
  use(notes = '') {
    if (this.usedCount < this.totalCount) {
      this.usedCount++;
      this.updatedAt = new Date().toISOString();
      return {
        success: true,
        remainingCount: this.getRemainingCount(),
        progress: this.getProgress()
      };
    }
    return { success: false, error: '已用完所有次数' };
  }
  
  // 撤销使用（-1次）
  undoUse() {
    if (this.usedCount > 0) {
      this.usedCount--;
      this.updatedAt = new Date().toISOString();
      return {
        success: true,
        remainingCount: this.getRemainingCount(),
        progress: this.getProgress()
      };
    }
    return { success: false, error: '无法撤销，已无使用记录' };
  }
  
  // 检查是否可以记录使用
  canUse() {
    return this.usedCount < this.totalCount && !this.isExpired();
  }
  
  // 检查是否可以撤销
  canUndo() {
    return this.usedCount > 0;
  }
  
  // 获取状态描述
  getStatusText() {
    if (this.isExpired()) return '已过期';
    if (this.usedCount >= this.totalCount) return '已用完';
    if (this.isExpiringSoon(7)) return '即将到期';
    return '使用中';
  }
  
  // 获取状态颜色
  getStatusColor() {
    if (this.isExpired()) return '#FF4444';
    if (this.usedCount >= this.totalCount) return '#999999';
    if (this.isExpiringSoon(7)) return '#FF8A00';
    return '#4CAF50';
  }
  
  // 验证数据完整性
  validate() {
    const errors = [];
    
    if (!this.name.trim()) {
      errors.push('套餐名称不能为空');
    }
    
    if (!this.merchant.trim()) {
      errors.push('商家名称不能为空');
    }
    
    if (this.totalCount <= 0) {
      errors.push('总次数必须大于0');
    }
    
    if (this.usedCount < 0) {
      errors.push('已用次数不能为负数');
    }
    
    if (this.usedCount > this.totalCount) {
      errors.push('已用次数不能超过总次数');
    }
    
    if (this.expireDate) {
      const expireTime = new Date(this.expireDate).getTime();
      if (isNaN(expireTime)) {
        errors.push('到期日期格式不正确');
      }
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
      name: this.name,
      merchant: this.merchant,
      category: this.category,
      totalCount: this.totalCount,
      usedCount: this.usedCount,
      purchaseDate: this.purchaseDate,
      expireDate: this.expireDate,
      imageUrl: this.imageUrl,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
  
  // 从存储格式创建实例
  static fromStorage(data) {
    return new Card(data);
  }
  
  // 创建新卡片的默认值
  static getDefaultCard() {
    return new Card({
      name: '',
      merchant: '',
      category: '其他',
      totalCount: 1,
      usedCount: 0,
      purchaseDate: new Date().toISOString(),
      expireDate: '',
      notes: ''
    });
  }
}
