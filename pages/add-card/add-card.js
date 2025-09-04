// pages/add-card/add-card.js
Page({
  data: {
    formData: {
      name: '',
      merchant: '',
      category: '其他',
      totalCount: 1,
      usedCount: 0,
      purchaseDate: '',
      expireDate: '',
      notes: ''
    },
    categories: ['其他', '餐饮', '美容', '健身', '购物', '娱乐', '教育', '医疗', '交通'],
    categoryIndex: 0,
    isFormValid: false
  },

  onLoad: function() {
    console.log('添加卡片页面加载');
    this.checkFormValidity();
  },

  // 通用输入处理方法
  onInputChange: function(e) {
    var field = e.currentTarget.dataset.field;
    var value = e.detail.value;
    
    this.setData({
      ['formData.' + field]: value
    });
    
    this.checkFormValidity();
  },

  // 通用日期选择处理方法
  onDateChange: function(e) {
    var field = e.currentTarget.dataset.field;
    var value = e.detail.value;
    
    this.setData({
      ['formData.' + field]: value
    });
    
    this.checkFormValidity();
  },

  // 选择分类
  onCategoryChange: function(e) {
    var index = e.detail.value;
    this.setData({
      categoryIndex: index,
      'formData.category': this.data.categories[index]
    });
    
    this.checkFormValidity();
  },

  // 检查表单有效性
  checkFormValidity: function() {
    var formData = this.data.formData;
    var isValid = formData.name.trim() !== '' && 
                  formData.merchant.trim() !== '' && 
                  formData.totalCount > 0;
    
    this.setData({
      isFormValid: isValid
    });
  },

  // 提交表单
  submitForm: function(e) {
    try {
      var formData = this.data.formData;
      
      // 验证必填字段
      if (!formData.name.trim()) {
        wx.showModal({
          title: '输入错误',
          content: '套餐名称不能为空',
          showCancel: false,
          confirmText: '知道了'
        });
        return;
      }
      
      if (!formData.merchant.trim()) {
        wx.showModal({
          title: '输入错误',
          content: '商家名称不能为空',
          showCancel: false,
          confirmText: '知道了'
        });
        return;
      }
      
      if (formData.totalCount <= 0) {
        wx.showModal({
          title: '输入错误',
          content: '总次数必须大于0',
          showCancel: false,
          confirmText: '知道了'
        });
        return;
      }
      
      // 验证已用次数不能超过总次数
      if (formData.usedCount > formData.totalCount) {
        wx.showModal({
          title: '输入错误',
          content: '已用次数不能超过总次数',
          showCancel: false,
          confirmText: '知道了'
        });
        return;
      }
      
      // 创建卡片对象
      var newCard = {
        id: 'card_' + Date.now(),
        name: formData.name.trim(),
        merchant: formData.merchant.trim(),
        category: formData.category,
        totalCount: parseInt(formData.totalCount),
        usedCount: parseInt(formData.usedCount) || 0,
        purchaseDate: formData.purchaseDate,
        expireDate: formData.expireDate,
        notes: formData.notes.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastUsedDate: null
      };
      
      // 保存到本地存储
      try {
        var app = getApp();
        var dataManager = app.getDataManager();
        
        if (dataManager) {
          // 使用数据管理器保存
          var success = dataManager.addCard(newCard);
          if (success) {
            console.log('卡片保存成功:', newCard);
            
            // 显示成功提示
            wx.showToast({
              title: '添加成功',
              icon: 'success',
              duration: 2000
            });
            
            // 延迟返回上一页
            setTimeout(function() {
              wx.navigateBack();
            }, 2000);
          } else {
            throw new Error('数据管理器保存失败');
          }
        } else {
          // 降级到直接存储
          var cards = wx.getStorageSync('cards') || [];
          cards.push(newCard);
          wx.setStorageSync('cards', cards);
          
          console.log('卡片保存成功(降级方案):', newCard);
          
          // 显示成功提示
          wx.showToast({
            title: '添加成功',
            icon: 'success',
            duration: 2000
          });
          
          // 延迟返回上一页
          setTimeout(function() {
            wx.navigateBack();
          }, 2000);
        }
        
      } catch (storageError) {
        console.error('保存卡片失败:', storageError);
        wx.showModal({
          title: '保存失败',
          content: '数据保存失败，请重试',
          showCancel: false,
          confirmText: '知道了'
        });
      }
      
    } catch (error) {
      console.error('添加卡片失败:', error);
      wx.showModal({
        title: '添加失败',
        content: '操作失败，请重试',
        showCancel: false,
        confirmText: '知道了'
      });
    }
  },

  // 取消操作
  cancel: function() {
    wx.navigateBack();
  },

  // 重置表单
  onReset: function() {
    this.setData({
      formData: {
        name: '',
        merchant: '',
        category: '其他',
        totalCount: 1,
        usedCount: 0,
        purchaseDate: '',
        expireDate: '',
        notes: ''
      },
      categoryIndex: 0,
      isFormValid: false
    });
  }
});
