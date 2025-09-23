// pages/index/index.js
Page({
  data: {
    totalCards: 0,
    expiringSoon: 0,
    runningOut: 0,
    currentFilter: 'all',
    cards: [],
    filteredCards: [],
    refreshing: false,
    // 记录使用弹窗相关数据
    showRecordModal: false,
    selectedCard: null,
    recordForm: {
      useDate: '',
      useCount: ''
    },
    isRecordFormValid: false,
    // 记录使用日期选择器相关
    showRecordDatePicker: false,
    recordDatePickerValue: [5, 8, 18], // 默认选择2025年9月19日
    recordYears: [],
    recordMonths: [],
    recordDays: []
  },

  onLoad: function() {
    console.log('首页加载');
    this.loadCardData();
    this.initRecordDatePickerData();
  },

  onShow: function() {
    console.log('首页显示');
    this.loadCardData();
  },


  onPullDownRefresh: function() {
    this.loadCardData();
  },

  // 初始化记录使用日期选择器数据
  initRecordDatePickerData: function() {
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
    
    // 生成日期数组
    var days = [];
    for (var i = 1; i <= 31; i++) {
      days.push(i);
    }
    
    this.setData({
      recordYears: years,
      recordMonths: months,
      recordDays: days
    });
  },

  // 加载卡片数据
  loadCardData: function() {
    try {
      console.log('开始加载卡片数据');
      
      // 从数据管理器获取卡片数据
      var app = getApp();
      var dataManager = app.getDataManager();
      var cards = [];
      
      if (dataManager) {
        // 使用数据管理器获取数据
        cards = dataManager.getCards();
        console.log('从数据管理器获取到卡片数据:', cards);
      } else {
        // 降级到直接存储
        cards = wx.getStorageSync('cards') || [];
        console.log('从本地存储获取到卡片数据(降级方案):', cards);
      }
      
      // 计算统计信息
      var totalCards = cards.length;
      var expiringCards = 0;
      var runningOutCards = 0;
      
      for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        
        // 统计即将到期的卡片（距离到期时间少于一个月）
        if (card.expireDate) {
          var expireDate = new Date(card.expireDate);
          var now = new Date();
          var daysUntilExpire = Math.ceil((expireDate - now) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpire <= 30 && daysUntilExpire > 0) {
            expiringCards++;
          }
        }
        
        // 统计即将用完的卡片
        // 条件1：剩余次数 ≤ 2次
        // 条件2：剩余次数百分比 < 10%
        // 对于不限次数的卡片，不进行次数统计
        if (typeof card.totalCount === 'number' && card.totalCount > 0) {
          var remainingCount = card.totalCount - card.usedCount;
          var remainingPercentage = (remainingCount / card.totalCount) * 100;
          
          // 双重判断：剩余次数≤2次 或 剩余百分比<10%
          if ((remainingCount <= 2 && remainingCount > 0) || 
              (remainingPercentage < 10 && remainingCount > 0)) {
            runningOutCards++;
          }
        }
      }
      
      // 转换为显示数据
      var displayCards = cards.map(function(card) {
        // 处理不限次数卡片
        var isUnlimited = typeof card.totalCount !== 'number';
        var progress = 0;
        var remainingCount = 0;
        var isUsedUp = false;
        
        if (isUnlimited) {
          // 不限次数卡片，进度显示为已使用次数
          progress = 0; // 不限次数卡片不显示进度条
          remainingCount = '不限';
          isUsedUp = false; // 不限次数卡片永远不会用完
        } else {
          // 有限次数卡片
          progress = card.totalCount > 0 ? Math.round((card.usedCount / card.totalCount) * 100) : 0;
          remainingCount = card.totalCount - card.usedCount;
          isUsedUp = remainingCount <= 0;
        }
        
        var isExpiring = false;
        var isExpired = false;
        var isRunningOut = false;
        var expireText = '';
        
        // 检查是否即将到期
        if (card.expireDate) {
          var expireDate = new Date(card.expireDate);
          var now = new Date();
          var daysUntilExpire = Math.ceil((expireDate - now) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpire <= 30 && daysUntilExpire > 0) {
            isExpiring = true;
            expireText = '还有' + daysUntilExpire + '天到期';
          } else if (daysUntilExpire <= 0) {
            isExpired = true;
            expireText = '已过期';
          } else {
            expireText = '还有' + daysUntilExpire + '天到期';
          }
        }
        
        // 检查是否即将用完（仅限有限次数卡片）
        if (!isUnlimited && typeof card.totalCount === 'number' && card.totalCount > 0) {
          var remainingCount = card.totalCount - card.usedCount;
          var remainingPercentage = (remainingCount / card.totalCount) * 100;
          
          // 双重判断：剩余次数≤2次 或 剩余百分比<10%
          if ((remainingCount <= 2 && remainingCount > 0) || 
              (remainingPercentage < 10 && remainingCount > 0)) {
            isRunningOut = true;
          }
        }
        
        return {
          ...card,
          progress: progress,
          isExpiring: isExpiring,
          isExpired: isExpired,
          isRunningOut: isRunningOut,
          expireText: expireText,
          // 仅当未过期且（不限次数或剩余次数>0）才可使用
          canUse: !isExpired && (isUnlimited || remainingCount > 0),
          remainingCount: remainingCount,
          isUsedUp: isUsedUp,
          isUnlimited: isUnlimited
        };
      });
      
      // 对卡片进行排序：未用完的在上，已用完的在下
      displayCards.sort(function(a, b) {
        // 如果一个是已用完，一个不是，已用完的排在后面
        if (a.isUsedUp && !b.isUsedUp) {
          return 1;
        }
        if (!a.isUsedUp && b.isUsedUp) {
          return -1;
        }
        // 如果都是已用完或都不是已用完，按创建时间排序（新的在前）
        return new Date(b.createdAt || b.updatedAt) - new Date(a.createdAt || a.updatedAt);
      });
      
      // 设置数据
      this.setData({
        totalCards: totalCards,
        expiringSoon: expiringCards,
        runningOut: runningOutCards,
        cards: displayCards,
        filteredCards: displayCards
      });
      
      // 停止下拉刷新
      if (this.data.refreshing) {
        this.setData({ refreshing: false });
        wx.stopPullDownRefresh();
      }
      
      // 检查提醒
      this.checkReminders(displayCards);
      
    } catch (error) {
      console.error('加载卡片数据失败:', error);
      this.setDefaultData();
    }
  },

  // 检查提醒
  checkReminders: function(cards) {
    try {
      var app = getApp();
      if (app && app.getReminderManager) {
        var reminderManager = app.getReminderManager();
        if (reminderManager) {
          reminderManager.checkAndShowReminders(cards);
        }
      }
    } catch (error) {
      console.error('检查提醒失败:', error);
    }
  },

  // 设置默认数据
  setDefaultData: function() {
    this.setData({
      totalCards: 0,
      expiringSoon: 0,
      runningOut: 0,
      cards: [],
      filteredCards: []
    });
  },

  // 记录使用
  recordUsage: function(e) {
    var cardId = e.currentTarget.dataset.id;
    console.log('记录使用:', cardId);
    
    // 找到对应的卡片
    var selectedCard = this.data.cards.find(function(card) {
      return card.id === cardId;
    });
    
    if (!selectedCard) {
      wx.showToast({
        title: '卡片不存在',
        icon: 'error'
      });
      return;
    }
    
    // 检查卡片是否还能使用
    if (!selectedCard.canUse) {
      wx.showModal({
        title: '无法使用',
        content: '该卡片已用完或已过期',
        showCancel: false,
        confirmText: '知道了'
      });
      return;
    }
    
    // 设置默认使用日期为今天
    var today = new Date();
    var todayStr = today.getFullYear() + '-' + 
                   String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(today.getDate()).padStart(2, '0');
    
    // 显示记录使用弹窗
    this.setData({
      showRecordModal: true,
      selectedCard: selectedCard,
      recordForm: {
        useDate: todayStr,
        useCount: '1'
      },
      isRecordFormValid: true
    });
  },

  // 编辑卡片
  editCard: function(e) {
    var cardId = e.currentTarget.dataset.id;
    console.log('编辑卡片:', cardId);
    
    // 找到对应卡片并校验是否允许编辑
    var target = this.data.cards.find(function(card) { return card.id === cardId; });
    if (target && (target.isUsedUp || target.isExpired)) {
      wx.showToast({
        title: '已用完或已过期不可编辑',
        icon: 'none'
      });
      return;
    }

    wx.navigateTo({
      url: '/pages/add-card/add-card?cardId=' + cardId,
      success: function() {
        console.log('跳转到编辑卡片页面');
      },
      fail: function(error) {
        console.error('跳转编辑卡片页面失败:', error);
      }
    });
  },

  // 查看详情
  viewDetail: function(e) {
    var cardId = e.currentTarget.dataset.id;
    console.log('查看详情:', cardId);
    
    wx.showModal({
      title: '查看详情',
      content: '此功能将在后续版本中开放',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 阻止事件冒泡
  stopPropagation: function(e) {
    // 阻止事件冒泡，防止触发卡片的点击事件
    e.stopPropagation && e.stopPropagation();
  },


  // 显示搜索
  showSearch: function() {
    wx.showModal({
      title: '搜索功能',
      content: '此功能将在后续版本中开放',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 筛选卡片
  filterCards: function(e) {
    var filter = e.currentTarget.dataset.filter;
    var cards = this.data.cards;
    
    var filteredCards = cards;
    
    switch (filter) {
      case 'expiring':
        filteredCards = cards.filter(function(card) {
          return card.isExpiring;
        });
        break;
      case 'active':
        filteredCards = cards.filter(function(card) {
          return card.canUse;
        });
        break;
      default:
        filteredCards = cards;
    }
    
    this.setData({
      currentFilter: filter,
      filteredCards: filteredCards
    });
  },

  // 下拉刷新
  onRefresh: function() {
    var that = this;
    this.setData({ refreshing: true });
    this.loadCardData();
    
    setTimeout(function() {
      that.setData({ refreshing: false });
      wx.stopPullDownRefresh();
    }, 1000);
  },

  // 分享功能
  onShareAppMessage: function() {
    return {
      title: '卡点时光 - 让每一次消费都有记录',
      path: '/pages/index/index'
    };
  },

  // 分享到朋友圈
  onShareTimeline: function() {
    return {
      title: '卡点时光 - 让每一次消费都有记录'
    };
  },

  // 弹窗相关事件处理
  // 关闭记录使用弹窗
  closeRecordModal: function() {
    this.setData({
      showRecordModal: false,
      selectedCard: null,
      recordForm: {
        useDate: '',
        useCount: ''
      },
      isRecordFormValid: false
    });
  },

  // 阻止事件冒泡
  stopPropagation: function() {
    // 阻止点击弹窗内容时关闭弹窗
  },

  // 阻止触摸滑动事件冒泡
  preventTouchMove: function() {
    // 阻止滑动事件冒泡，防止底层页面滑动
    return false;
  },


  // 使用次数输入
  onUseCountInput: function(e) {
    var useCount = e.detail.value;
    this.setData({
      'recordForm.useCount': useCount
    });
    this.checkRecordFormValidity();
  },

  // 检查表单有效性
  checkRecordFormValidity: function() {
    var recordForm = this.data.recordForm;
    var selectedCard = this.data.selectedCard;
    
    var isValid = recordForm.useDate.trim() !== '' && 
                  recordForm.useCount.trim() !== '' &&
                  parseInt(recordForm.useCount) > 0 &&
                  selectedCard;
    
    // 对于不限次数卡片，不检查使用次数限制
    if (isValid && !selectedCard.isUnlimited) {
      isValid = parseInt(recordForm.useCount) <= (selectedCard.totalCount - selectedCard.usedCount);
    }
    
    this.setData({
      isRecordFormValid: isValid
    });
  },

  // 确认记录使用
  confirmRecordUsage: function() {
    var recordForm = this.data.recordForm;
    var selectedCard = this.data.selectedCard;
    
    if (!this.data.isRecordFormValid) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'error'
      });
      return;
    }
    
    var useCount = parseInt(recordForm.useCount);
    
    // 对于不限次数卡片，不检查使用次数限制
    if (!selectedCard.isUnlimited) {
      var remainingCount = selectedCard.totalCount - selectedCard.usedCount;
      
      // 验证使用次数
      if (useCount > remainingCount) {
        wx.showModal({
          title: '输入错误',
          content: '使用次数不能超过剩余次数',
          showCancel: false,
          confirmText: '知道了'
        });
        return;
      }
    }
    
    if (useCount <= 0) {
      wx.showModal({
        title: '输入错误',
        content: '使用次数必须大于0',
        showCancel: false,
        confirmText: '知道了'
      });
      return;
    }
    
    // 更新卡片数据
    try {
      var app = getApp();
      var dataManager = app.getDataManager();
      
      if (dataManager) {
        // 使用数据管理器更新
        var success = dataManager.recordUsage(selectedCard.id, useCount, recordForm.useDate);
        if (success) {
          console.log('记录使用成功');
          
          // 显示成功提示
          wx.showToast({
            title: '记录成功',
            icon: 'success',
            duration: 2000
          });
          
          // 关闭弹窗
          this.closeRecordModal();
          
          // 重新加载数据
          this.loadCardData();
        } else {
          throw new Error('数据管理器更新失败');
        }
      } else {
        // 降级到直接存储
        var cards = wx.getStorageSync('cards') || [];
        var cardIndex = cards.findIndex(function(card) {
          return card.id === selectedCard.id;
        });
        
        if (cardIndex !== -1) {
          cards[cardIndex].usedCount += useCount;
          cards[cardIndex].lastUsedDate = recordForm.useDate;
          cards[cardIndex].updatedAt = new Date().toISOString();
          
          wx.setStorageSync('cards', cards);
          
          console.log('记录使用成功(降级方案)');
          
          // 显示成功提示
          wx.showToast({
            title: '记录成功',
            icon: 'success',
            duration: 2000
          });
          
          // 关闭弹窗
          this.closeRecordModal();
          
          // 重新加载数据
          this.loadCardData();
        } else {
          throw new Error('卡片不存在');
        }
      }
      
    } catch (error) {
      console.error('记录使用失败:', error);
      wx.showModal({
        title: '记录失败',
        content: '数据保存失败，请重试',
        showCancel: false,
        confirmText: '知道了'
      });
    }
  },

  // 显示记录使用日期选择器
  showRecordDatePicker: function() {
    var currentDate = this.data.recordForm.useDate;
    
    // 设置默认值 - 默认选择当前日期
    var today = new Date();
    var currentYear = today.getFullYear();
    var currentMonth = today.getMonth() + 1; // getMonth() 返回 0-11
    var currentDay = today.getDate();
    
    var defaultValue = [5, currentMonth - 1, currentDay - 1]; // 默认选择当前年份、当前月、当前日
    
    if (currentDate) {
      var date = new Date(currentDate);
      var yearIndex = this.data.recordYears.indexOf(date.getFullYear());
      var monthIndex = date.getMonth();
      var dayIndex = date.getDate() - 1;
      
      if (yearIndex !== -1) defaultValue[0] = yearIndex;
      if (monthIndex >= 0 && monthIndex < 12) defaultValue[1] = monthIndex;
      if (dayIndex >= 0 && dayIndex < 31) defaultValue[2] = dayIndex;
    }
    
    // 确保默认值在有效范围内
    if (defaultValue[0] >= this.data.recordYears.length) defaultValue[0] = this.data.recordYears.length - 1;
    if (defaultValue[1] >= this.data.recordMonths.length) defaultValue[1] = this.data.recordMonths.length - 1;
    if (defaultValue[2] >= this.data.recordDays.length) defaultValue[2] = this.data.recordDays.length - 1;
    
    this.setData({
      showRecordDatePicker: true,
      recordDatePickerValue: defaultValue
    });
  },

  // 隐藏记录使用日期选择器
  hideRecordDatePicker: function() {
    this.setData({
      showRecordDatePicker: false
    });
  },

  // 记录使用日期选择器变化
  onRecordDatePickerChange: function(e) {
    console.log('记录使用日期选择器变化:', e.detail.value);
    this.setData({
      recordDatePickerValue: e.detail.value
    });
  },

  // 确认记录使用日期选择
  confirmRecordDateSelection: function() {
    var value = this.data.recordDatePickerValue;
    var year = this.data.recordYears[value[0]];
    var month = this.data.recordMonths[value[1]];
    var day = this.data.recordDays[value[2]];
    
    // 格式化日期
    var dateStr = year + '-' + 
                  String(month).padStart(2, '0') + '-' + 
                  String(day).padStart(2, '0');
    
    // 更新表单数据
    this.setData({
      'recordForm.useDate': dateStr,
      showRecordDatePicker: false
    });
    
    this.checkRecordFormValidity();
  },

});
