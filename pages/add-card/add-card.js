// pages/add-card/add-card.js
import { Card } from '../../models/Card.js';

Page({
  data: {
    categories: ['美容美发', '健身运动', '教育培训', '餐饮娱乐', '其他'],
    categoryIndex: 0,
    formData: {
      name: '',
      merchant: '',
      category: '其他',
      totalCount: '',
      usedCount: '0',
      purchaseDate: '',
      expireDate: '',
      notes: ''
    },
    isFormValid: false
  },

  onLoad() {
    console.log('添加卡片页面加载');
    this.setDefaultDates();
  },

  // 设置默认日期
  setDefaultDates() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    this.setData({
      'formData.purchaseDate': todayStr
    });
  },

  // 输入框变化处理
  onInputChange(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    
    this.setData({
      [`formData.${field}`]: value
    });
    
    this.validateForm();
  },

  // 分类选择变化
  onCategoryChange(e) {
    const index = e.detail.value;
    const category = this.data.categories[index];
    
    this.setData({
      categoryIndex: index,
      'formData.category': category
    });
  },

  // 日期选择变化
  onDateChange(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    
    this.setData({
      [`formData.${field}`]: value
    });
  },

  // 表单验证
  validateForm() {
    const { formData } = this.data;
    const errors = [];
    
    // 验证必填字段
    if (!formData.name.trim()) {
      errors.push('套餐名称不能为空');
    }
    
    if (!formData.merchant.trim()) {
      errors.push('商家名称不能为空');
    }
    
    if (!formData.totalCount || formData.totalCount <= 0) {
      errors.push('总次数必须大于0');
    }
    
    // 验证已用次数
    if (formData.usedCount && formData.usedCount < 0) {
      errors.push('已用次数不能为负数');
    }
    
    if (formData.usedCount && formData.totalCount && 
        parseInt(formData.usedCount) > parseInt(formData.totalCount)) {
      errors.push('已用次数不能超过总次数');
    }
    
    // 验证日期
    if (formData.expireDate && formData.purchaseDate) {
      const purchaseDate = new Date(formData.purchaseDate);
      const expireDate = new Date(formData.expireDate);
      
      if (expireDate <= purchaseDate) {
        errors.push('到期日期必须晚于购买日期');
      }
    }
    
    this.setData({
      isFormValid: errors.length === 0
    });
    
    return errors;
  },

  // 提交表单
  async submitForm(e) {
    const formData = e.detail.value;
    
    // 合并表单数据
    const cardData = {
      ...this.data.formData,
      ...formData
    };
    
    // 验证表单
    const errors = this.validateForm();
    if (errors.length > 0) {
      wx.showModal({
        title: '表单验证失败',
        content: errors.join('\n'),
        showCancel: false,
        confirmText: '知道了'
      });
      return;
    }
    
    // 转换数据类型
    cardData.totalCount = parseInt(cardData.totalCount) || 0;
    cardData.usedCount = parseInt(cardData.usedCount) || 0;
    
    // 格式化日期
    if (cardData.purchaseDate) {
      cardData.purchaseDate = new Date(cardData.purchaseDate).toISOString();
    }
    if (cardData.expireDate) {
      cardData.expireDate = new Date(cardData.expireDate).toISOString();
    }
    
    try {
      const app = getApp();
      const cardService = app.getCardService();
      const notificationManager = app.getNotificationManager();
      
      notificationManager.showLoading('保存中...');
      
      const result = await cardService.addCard(cardData);
      
      notificationManager.hideLoading();
      
      if (result.success) {
        notificationManager.showOperationSuccess('add');
        
        // 返回上一页并刷新数据
        setTimeout(() => {
          wx.navigateBack({
            success: () => {
              // 通知上一页刷新数据
              const pages = getCurrentPages();
              const prevPage = pages[pages.length - 2];
              if (prevPage && prevPage.loadCardData) {
                prevPage.loadCardData();
              }
            }
          });
        }, 1500);
      } else {
        notificationManager.showOperationError('add', result.error);
      }
    } catch (error) {
      console.error('添加卡片失败:', error);
      const app = getApp();
      const notificationManager = app.getNotificationManager();
      notificationManager.hideLoading();
      notificationManager.showOperationError('add', error.message);
    }
  },

  // 取消操作
  cancel() {
    wx.showModal({
      title: '确认取消',
      content: '确定要取消添加吗？已填写的内容将丢失。',
      confirmText: '确定取消',
      cancelText: '继续编辑',
      success: (res) => {
        if (res.confirm) {
          wx.navigateBack();
        }
      }
    });
  },

  // 页面返回确认
  onUnload() {
    // 页面卸载时的清理工作
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: '卡点 - 添加套餐卡',
      path: '/pages/add-card/add-card'
    };
  }
});
