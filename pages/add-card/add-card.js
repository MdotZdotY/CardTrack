// pages/add-card/add-card.js
Page({
  data: {
    formData: {
      name: '',
      merchant: '',
      category: '餐饮',
      totalCount: '不限',
      totalAmount: '',
      purchaseDate: '',
      expireDate: '',
      notes: ''
    },
    isUnlimitedCard: true, // 默认是不限次数卡片
    categories: ['餐饮', '出行', '休闲娱乐', '文体教育', '服饰美容', '生活日用', '医疗保健', '其它'],
    categoryIndex: 0,
    isFormValid: false,
    // 编辑模式相关
    isEditMode: false,
    editCardId: null,
    originalCard: null,
    // 分类选择器相关
    showCategoryPicker: false,
    tempCategoryIndex: 0,
    // 日期选择器相关
    showDatePicker: false,
    datePickerField: '',
    datePickerTitle: '',
    datePickerValue: [0, 0, 0],
    years: [],
    months: [],
    days: []
  },

  onLoad: function(options) {
    
    // 初始化日期选择器数据
    this.initDatePickerData();
    
    // 设置默认购买日期为今天
    this.setDefaultPurchaseDate();
    
    // 检查是否是编辑模式
    if (options && options.cardId) {
      this.loadCardForEdit(options.cardId);
    } else {
      this.checkFormValidity();
    }
  },

  // 初始化日期选择器数据
  initDatePickerData: function() {
    // 生成年份数组（当前年份前后5年）
    var currentYear = new Date().getFullYear();
    var years = [];
    for (var i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(i);
    }
    
    // 生成月份数组
    var months = [];
    for (var i = 1; i <= 12; i++) {
      months.push(i);
    }
    
    // 生成日期数组（根据当前年月动态生成）
    var now = new Date();
    var currentMonth = now.getMonth() + 1;
    var currentYear = now.getFullYear();
    var days = this.generateDaysForMonth(currentYear, currentMonth);
    
    this.setData({
      years: years,
      months: months,
      days: days
    });
  },

  // 根据年月生成对应的日期数组
  generateDaysForMonth: function(year, month) {
    // 获取该月的最后一天
    var lastDay = new Date(year, month, 0).getDate();
    var days = [];
    for (var i = 1; i <= lastDay; i++) {
      days.push(i);
    }
    return days;
  },

  // 设置默认购买日期为今天
  setDefaultPurchaseDate: function() {
    var today = new Date();
    var todayStr = today.getFullYear() + '-' + 
                   String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(today.getDate()).padStart(2, '0');
    
    this.setData({
      'formData.purchaseDate': todayStr
    });
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

  // 总次数输入处理方法
  onTotalCountInput: function(e) {
    var value = e.detail.value;
    
    // 判断是否为不限次数卡片
    var isUnlimited = value === '' || value === '不限' || isNaN(value);
    
    this.setData({
      'formData.totalCount': value,
      isUnlimitedCard: isUnlimited
    });
    
    this.checkFormValidity();
  },

  // 已使用次数输入处理方法（仅编辑模式可见）

  // 金额输入处理方法
  onAmountInput: function(e) {
    var value = e.detail.value;
    
    // 只允许数字和一个小数点
    var cleanValue = value.replace(/[^\d.]/g, '');
    
    // 确保只有一个小数点
    var parts = cleanValue.split('.');
    if (parts.length > 2) {
      cleanValue = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // 限制小数点后最多两位
    if (parts.length === 2 && parts[1].length > 2) {
      cleanValue = parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    this.setData({
      'formData.totalAmount': cleanValue
    });
    
    this.checkFormValidity();
  },

  // 金额失焦处理方法（添加.00后缀）
  onAmountBlur: function(e) {
    var value = this.data.formData.totalAmount;
    
    if (value && value.trim() !== '') {
      var numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue > 0) {
        // 如果是整数，添加.00后缀
        if (numValue % 1 === 0) {
          var formattedValue = numValue.toFixed(2);
          this.setData({
            'formData.totalAmount': formattedValue
          });
        }
      }
    }
  },

  // 通用日期选择处理方法
  onDateInputChange: function(e) {
    var field = e.currentTarget.dataset.field;
    var value = e.detail.value;
    
    this.setData({
      ['formData.' + field]: value
    });
    
    this.checkFormValidity();
  },

  // 选择分类（保留原方法以兼容）
  onCategoryChange: function(e) {
    var index = e.detail.value;
    this.setData({
      categoryIndex: index,
      'formData.category': this.data.categories[index]
    });
    
    this.checkFormValidity();
  },

  // 显示分类选择器
  showCategoryPicker: function() {
    this.setData({
      showCategoryPicker: true,
      tempCategoryIndex: this.data.categoryIndex
    });
  },

  // 隐藏分类选择器
  hideCategoryPicker: function() {
    this.setData({
      showCategoryPicker: false,
      tempCategoryIndex: this.data.categoryIndex  // 重置为当前选择
    });
  },

  // 选择分类项
  selectCategory: function(e) {
    var index = parseInt(e.currentTarget.dataset.index);
    this.setData({
      tempCategoryIndex: index
    });
  },

  // 确认分类选择
  confirmCategorySelection: function() {
    var index = this.data.tempCategoryIndex;
    this.setData({
      categoryIndex: index,
      'formData.category': this.data.categories[index],
      showCategoryPicker: false
    });
    
    this.checkFormValidity();
  },

  // 阻止事件冒泡
  stopPropagation: function() {
    // 阻止事件冒泡
  },

  // 加载卡片进行编辑
  loadCardForEdit: function(cardId) {
    try {
      
      // 从数据管理器获取卡片数据
      var app = getApp();
      var dataManager = app.getDataManager();
      var cards = [];
      
      if (dataManager) {
        cards = dataManager.getCards();
      } else {
        cards = wx.getStorageSync('cards') || [];
      }
      
      // 找到要编辑的卡片
      var cardToEdit = cards.find(function(card) {
        return card.id === cardId;
      });
      
      if (!cardToEdit) {
        wx.showModal({
          title: '错误',
          content: '卡片不存在',
          showCancel: false,
          confirmText: '知道了',
          success: function() {
            wx.navigateBack();
          }
        });
        return;
      }
      
      // 找到分类索引
      var categoryIndex = this.data.categories.indexOf(cardToEdit.category);
      if (categoryIndex === -1) {
        categoryIndex = this.data.categories.indexOf('其它');
      }
      
      // 判断是否为不限次数卡片
      var isUnlimited = typeof cardToEdit.totalCount !== 'number';
      
      // 设置编辑模式数据
      this.setData({
        isEditMode: true,
        editCardId: cardId,
        originalCard: cardToEdit,
        isUnlimitedCard: isUnlimited,
        formData: {
          name: cardToEdit.name || '',
          merchant: cardToEdit.merchant || '',
          category: cardToEdit.category || '其它',
          totalCount: cardToEdit.totalCount ? String(cardToEdit.totalCount) : '不限',
          totalAmount: cardToEdit.totalAmount ? cardToEdit.totalAmount.toString() : '',
          purchaseDate: cardToEdit.purchaseDate || '',
          expireDate: cardToEdit.expireDate || '',
          notes: cardToEdit.notes || ''
        },
        categoryIndex: categoryIndex
      });
      
      this.checkFormValidity();
      
    } catch (error) {
      console.error('加载卡片编辑失败:', error);
      wx.showModal({
        title: '错误',
        content: '加载卡片信息失败',
        showCancel: false,
        confirmText: '知道了',
        success: function() {
          wx.navigateBack();
        }
      });
    }
  },

  // 检查表单有效性
  checkFormValidity: function() {
    var formData = this.data.formData;
    var isUnlimitedCard = this.data.isUnlimitedCard;
    
    // 检查总次数是否有效（数字且大于0，或者是"不限"等非数字字符串）
    var isTotalCountValid = false;
    if (formData.totalCount !== null && formData.totalCount !== undefined && formData.totalCount !== '') {
      // 将totalCount转换为字符串进行处理
      var totalCountStr = String(formData.totalCount).trim();
      // 如果是数字，检查是否大于0
      if (!isNaN(totalCountStr) && parseFloat(totalCountStr) > 0) {
        isTotalCountValid = true;
      }
      // 如果是非数字字符串（如"不限"、"∞"等），也认为是有效的
      else if (isNaN(totalCountStr)) {
        isTotalCountValid = true;
      }
    }
    
    // 检查到期日期：不限次数卡片时必填，有限次数卡片时可选
    var isExpireDateValid = true;
    if (isUnlimitedCard) {
      isExpireDateValid = formData.expireDate && formData.expireDate.trim() !== '';
    }

    
    var isValid = formData.name.trim() !== '' && 
                  formData.merchant.trim() !== '' && 
                  isTotalCountValid &&
                  formData.totalAmount.trim() !== '' &&
                  parseFloat(formData.totalAmount) > 0 &&
                  isExpireDateValid;
    
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
      
      // 验证总次数
      var totalCountStr = String(formData.totalCount).trim();
      if (!totalCountStr) {
        wx.showModal({
          title: '输入错误',
          content: '总次数不能为空',
          showCancel: false,
          confirmText: '知道了'
        });
        return;
      }
      
      // 如果是数字，检查是否大于0
      if (!isNaN(totalCountStr) && parseFloat(totalCountStr) <= 0) {
        wx.showModal({
          title: '输入错误',
          content: '总次数必须大于0',
          showCancel: false,
          confirmText: '知道了'
        });
        return;
      }
      
      // 检查到期日期：不限次数卡片时必填
      if (this.data.isUnlimitedCard && (!formData.expireDate || formData.expireDate.trim() === '')) {
        wx.showModal({
          title: '输入错误',
          content: '不限次数卡片的到期日期为必填项',
          showCancel: false,
          confirmText: '知道了'
        });
        return;
      }
      
      // 验证总金额
      if (!formData.totalAmount.trim()) {
        wx.showModal({
          title: '输入错误',
          content: '总金额不能为空',
          showCancel: false,
          confirmText: '知道了'
        });
        return;
      }
      
      var totalAmount = parseFloat(formData.totalAmount);
      if (isNaN(totalAmount) || totalAmount <= 0) {
        wx.showModal({
          title: '输入错误',
          content: '总金额必须大于0',
          showCancel: false,
          confirmText: '知道了'
        });
        return;
      }
      
      // 创建或更新卡片对象
      var cardData;
      if (this.data.isEditMode) {
        // 编辑模式：保留原有数据，更新修改的字段
        cardData = {
          ...this.data.originalCard,
          name: formData.name.trim(),
          merchant: formData.merchant.trim(),
          category: formData.category,
          totalCount: isNaN(formData.totalCount) ? formData.totalCount : parseInt(formData.totalCount),
          usedCount: this.data.originalCard.usedCount || 0,
          totalAmount: parseFloat(formData.totalAmount),
          purchaseDate: formData.purchaseDate,
          expireDate: formData.expireDate,
          notes: formData.notes.trim(),
          updatedAt: new Date().toISOString()
        };
      } else {
        // 新增模式：创建新卡片
        cardData = {
          id: 'card_' + Date.now(),
          name: formData.name.trim(),
          merchant: formData.merchant.trim(),
          category: formData.category,
          totalCount: isNaN(formData.totalCount) ? formData.totalCount : parseInt(formData.totalCount),
          totalAmount: parseFloat(formData.totalAmount),
          usedCount: 0,
          usedAmount: 0,
          purchaseDate: formData.purchaseDate,
          expireDate: formData.expireDate,
          notes: formData.notes.trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastUsedDate: null
        };
      }
      
      // 保存到本地存储
      try {
        var app = getApp();
        var dataManager = app.getDataManager();
        
        if (dataManager) {
          // 使用数据管理器保存
          var success;
          if (this.data.isEditMode) {
            success = dataManager.updateCard(cardData);
          } else {
            success = dataManager.addCard(cardData);
          }
          
          if (success) {
            // 显示成功提示
            wx.showToast({
              title: this.data.isEditMode ? '修改成功' : '添加成功',
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
          
          if (this.data.isEditMode) {
            // 编辑模式：更新现有卡片
            var cardIndex = cards.findIndex(function(card) {
              return card.id === cardData.id;
            });
            if (cardIndex !== -1) {
              cards[cardIndex] = cardData;
            }
          } else {
            // 新增模式：添加新卡片
            cards.push(cardData);
          }
          
          wx.setStorageSync('cards', cards);
          
          // 显示成功提示
          wx.showToast({
            title: this.data.isEditMode ? '修改成功' : '添加成功',
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
    // 设置默认购买日期为今天
    var today = new Date();
    var todayStr = today.getFullYear() + '-' + 
                   String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(today.getDate()).padStart(2, '0');
    
    this.setData({
      formData: {
        name: '',
        merchant: '',
        category: '餐饮',
        totalCount: '不限',
        totalAmount: '',
        purchaseDate: todayStr,
        expireDate: '',
        notes: ''
      },
      isUnlimitedCard: true,
      categoryIndex: 0,
      isFormValid: false
    });
  },

  // 显示日期选择器
  showDatePicker: function(e) {
    var field = e.currentTarget.dataset.field;
    var title = field === 'purchaseDate' ? '选择购买日期' : '选择到期日期';
    var currentDate = this.data.formData[field];
    
    // 设置默认值
    var defaultValue = [5, 0, 0]; // 默认选择当前年份、1月、1日
    if (currentDate) {
      var date = new Date(currentDate);
      var yearIndex = this.data.years.indexOf(date.getFullYear());
      var monthIndex = date.getMonth();
      var dayIndex = date.getDate() - 1;
      
      if (yearIndex !== -1) defaultValue[0] = yearIndex;
      if (monthIndex >= 0 && monthIndex < 12) defaultValue[1] = monthIndex;
      
      // 根据选择的年月动态调整日期范围
      var selectedYear = this.data.years[defaultValue[0]];
      var selectedMonth = this.data.months[defaultValue[1]];
      var maxDays = this.generateDaysForMonth(selectedYear, selectedMonth).length;
      
      if (dayIndex >= 0 && dayIndex < maxDays) {
        defaultValue[2] = dayIndex;
      } else {
        // 如果日期超出范围，设置为该月的最后一天
        defaultValue[2] = maxDays - 1;
      }
    }
    
    // 确保默认值在有效范围内
    if (defaultValue[0] >= this.data.years.length) defaultValue[0] = this.data.years.length - 1;
    if (defaultValue[1] >= this.data.months.length) defaultValue[1] = this.data.months.length - 1;
    if (defaultValue[2] >= this.data.days.length) defaultValue[2] = this.data.days.length - 1;
    
    this.setData({
      showDatePicker: true,
      datePickerField: field,
      datePickerTitle: title,
      datePickerValue: defaultValue
    });
  },

  // 隐藏日期选择器
  hideDatePicker: function() {
    this.setData({
      showDatePicker: false
    });
  },

  // 日期选择器变化
  onDatePickerChange: function(e) {
    var value = e.detail.value;
    var year = this.data.years[value[0]];
    var month = this.data.months[value[1]];
    var day = this.data.days[value[2]];
    
    // 如果年月发生变化，重新生成日期数组
    var currentYear = this.data.years[this.data.datePickerValue[0]];
    var currentMonth = this.data.months[this.data.datePickerValue[1]];
    
    if (year !== currentYear || month !== currentMonth) {
      var newDays = this.generateDaysForMonth(year, month);
      
      // 如果当前选择的日期超出了新月份的天数，调整为该月的最后一天
      var maxDay = newDays.length;
      if (day > maxDay) {
        day = maxDay;
        value[2] = maxDay - 1; // 数组索引从0开始
      }
      
      this.setData({
        datePickerValue: value,
        days: newDays
      });
    } else {
      this.setData({
        datePickerValue: value
      });
    }
  },

  // 确认日期选择
  confirmDateSelection: function() {
    var value = this.data.datePickerValue;
    var year = this.data.years[value[0]];
    var month = this.data.months[value[1]];
    var day = this.data.days[value[2]];
    
    // 格式化日期
    var dateStr = year + '-' + 
                  String(month).padStart(2, '0') + '-' + 
                  String(day).padStart(2, '0');
    
    // 更新表单数据
    this.setData({
      ['formData.' + this.data.datePickerField]: dateStr,
      showDatePicker: false
    });
    
    this.checkFormValidity();
  },

  // 阻止触摸滑动事件冒泡
  preventTouchMove: function() {
    // 阻止滑动事件冒泡，防止底层页面滑动
    return false;
  },

});
