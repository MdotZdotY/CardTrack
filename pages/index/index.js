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
    recordDatePickerValue: [5, 8, 17], // 默认选择2025年9月18日（避免31日问题）
    recordYears: [],
    recordMonths: [],
    recordDays: [],
    // 卡片详情月历相关数据
    showDetailModal: false,
    selectedCardDetail: null,
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    calendarDays: [],
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    monthlyUsageCount: 0,
    // 编辑模式相关数据
    isEditingMode: false,
    originalUsageRecords: [],
    editedUsageRecords: []
  },

  onLoad: function() {
    try {
      this.loadCardData();
      this.initRecordDatePickerData();
    } catch (error) {
      console.error('首页加载失败:', error);
    }
  },

  onShow: function() {
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
    
    // 生成日期数组（根据当前年月动态生成）
    var now = new Date();
    var currentMonth = now.getMonth() + 1;
    var currentYear = now.getFullYear();
    var days = this.generateDaysForMonth(currentYear, currentMonth);
    
    this.setData({
      recordYears: years,
      recordMonths: months,
      recordDays: days
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

  // 加载卡片数据
  loadCardData: function() {
    try {
      
      // 从数据管理器获取卡片数据
      var app = getApp();
      var dataManager = app.getDataManager();
      var cards = [];
      
      if (dataManager) {
        // 使用数据管理器获取数据
        cards = dataManager.getCards();
      } else {
        // 降级到直接存储
        cards = wx.getStorageSync('cards') || [];
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
        
        // 计算单价（总价值 / 已使用次数）
        var unitPrice = 0;
        var unitPriceText = '';
        if (card.totalAmount && card.usedCount > 0) {
          unitPrice = parseFloat(card.totalAmount) / card.usedCount;
        }
        
        if (isUnlimited) {
          // 不限次数卡片，进度显示为时间进度
          progress = 0; // 默认值，后面会根据时间进度更新
          remainingCount = '不限';
          isUsedUp = false; // 不限次数卡片永远不会用完（仅从次数角度）
          // 不限次数卡片文案
          unitPriceText = unitPrice > 0 ? unitPrice.toFixed(2) + '元/次（多用 才划算）' : '多用 才划算';
        } else {
          // 有限次数卡片
          progress = card.totalCount > 0 ? Math.round((card.usedCount / card.totalCount) * 100) : 0;
          remainingCount = card.totalCount - card.usedCount;
          isUsedUp = remainingCount <= 0;
          // 有限次数卡片文案
          unitPriceText = unitPrice > 0 ? unitPrice.toFixed(2) + '元/次（快用 别浪费）' : '快用 别浪费';
        }
        
        var isExpiring = false;
        var isExpired = false;
        var isRunningOut = false;
        var expireText = '';
        var dateProgress = 0; // 日期进度条百分比
        var dateProgressText = ''; // 日期进度条文字
        
        // 计算日期进度条
        if (card.expireDate && card.purchaseDate) {
          var expireDate = new Date(card.expireDate);
          var purchaseDate = new Date(card.purchaseDate);
          var now = new Date();
          
          // 计算总有效天数（购买日期到到期日期）
          var totalValidDays = Math.ceil((expireDate - purchaseDate) / (1000 * 60 * 60 * 24));
          
          // 计算已过天数（购买日期到今天）
          var passedDays = Math.ceil((now - purchaseDate) / (1000 * 60 * 60 * 24));
          
          // 计算剩余天数
          var daysUntilExpire = Math.ceil((expireDate - now) / (1000 * 60 * 60 * 24));
          
          
          // 确保数据合理性
          if (totalValidDays > 0 && passedDays >= 0) {
            // 计算进度百分比（已过天数 / 总有效天数）
            dateProgress = Math.min(Math.max((passedDays / totalValidDays) * 100, 0), 100);
            
            // 设置进度条文字
            if (daysUntilExpire <= 0) {
              isExpired = true;
              dateProgressText = '已过期';
              dateProgress = 100; // 过期时进度条满格
            } else if (daysUntilExpire <= 30 && daysUntilExpire > 0) {
              isExpiring = true;
              dateProgressText = '还有' + daysUntilExpire + '天到期';
            } else {
              dateProgressText = '还有' + daysUntilExpire + '天到期';
            }
            
            // 确保过期卡片的进度为100
            if (isExpired) {
              dateProgress = 100;
            }
          } else {
            dateProgressText = '日期信息异常';
          }
        } else {
          dateProgressText = '无日期信息';
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
        
        // 对于不限次数的卡片，使用时间进度作为显示进度
        if (isUnlimited && card.expireDate) {
          progress = Math.round(dateProgress);
        }
        
        // 确保dateProgress有值，如果没有则使用progress
        if (!dateProgress && progress) {
          dateProgress = progress;
        }
        
        
        return {
          ...card,
          progress: progress,
          isExpiring: isExpiring,
          isExpired: isExpired,
          isRunningOut: isRunningOut,
          expireText: expireText,
          // 日期进度条相关数据
          dateProgress: dateProgress,
          dateProgressText: dateProgressText,
          dateProgressFixed: (dateProgress || 0).toFixed(2),
          // 使用次数进度条相关数据
          progressFixed: progress.toFixed(2),
          // 单价相关数据
          unitPrice: unitPrice,
          unitPriceText: unitPriceText,
          // 仅当未过期且（不限次数或剩余次数>0）才可使用
          canUse: !isExpired && (isUnlimited || remainingCount > 0),
          remainingCount: remainingCount,
          isUsedUp: isUsedUp,
          isUnlimited: isUnlimited
        };
      });
      
      // 对卡片进行排序：未用完的在上，已用完/过期的在下
      displayCards.sort(function(a, b) {
        var aIsFinished = a.isUsedUp || a.isExpired;
        var bIsFinished = b.isUsedUp || b.isExpired;
        
        // 如果一个是已用完/过期，一个不是，已用完/过期的排在后面
        if (aIsFinished && !bIsFinished) {
          return 1;
        }
        if (!aIsFinished && bIsFinished) {
          return -1;
        }
        // 如果都是已用完/过期或都不是，按创建时间排序（新的在前）
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
      },
      fail: function(error) {
        console.error('跳转编辑卡片页面失败:', error);
      }
    });
  },

  // 查看详情
  viewDetail: function(e) {
    var cardId = e.currentTarget.dataset.id;
    
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
    
    // 找到当前年份在年份数组中的索引
    var yearIndex = this.data.recordYears.indexOf(currentYear);
    if (yearIndex === -1) yearIndex = 5; // 如果找不到，使用默认值5
    
    var defaultValue = [yearIndex, currentMonth - 1, currentDay - 1]; // 默认选择当前年份、当前月、当前日
    
    if (currentDate) {
      var date = new Date(currentDate);
      var yearIndex = this.data.recordYears.indexOf(date.getFullYear());
      var monthIndex = date.getMonth();
      var dayIndex = date.getDate() - 1;
      
      if (yearIndex !== -1) defaultValue[0] = yearIndex;
      if (monthIndex >= 0 && monthIndex < 12) defaultValue[1] = monthIndex;
      
      // 根据选择的年月动态调整日期范围
      var selectedYear = this.data.recordYears[defaultValue[0]];
      var selectedMonth = this.data.recordMonths[defaultValue[1]];
      var maxDays = this.generateDaysForMonth(selectedYear, selectedMonth).length;
      
      if (dayIndex >= 0 && dayIndex < maxDays) {
        defaultValue[2] = dayIndex;
      } else {
        // 如果日期超出范围，设置为该月的最后一天
        defaultValue[2] = maxDays - 1;
      }
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
    var value = e.detail.value;
    
    // 获取当前选择的年月
    var year = this.data.recordYears[value[0]];
    var month = this.data.recordMonths[value[1]];
    var day = this.data.recordDays[value[2]];
    
    // 检查年月是否发生变化
    var currentYear = this.data.recordYears[this.data.recordDatePickerValue[0]];
    var currentMonth = this.data.recordMonths[this.data.recordDatePickerValue[1]];
    
    // 如果年月发生变化，重新生成日期数组
    if (year !== currentYear || month !== currentMonth) {
      var newDays = this.generateDaysForMonth(year, month);
      
      // 如果当前选择的日期超出了新月份的天数，调整为该月的最后一天
      var maxDay = newDays.length;
      if (day > maxDay) {
        day = maxDay;
        value[2] = maxDay - 1; // 数组索引从0开始
      }
      
      this.setData({
        recordDatePickerValue: value,
        recordDays: newDays
      });
    } else {
      this.setData({
        recordDatePickerValue: value
      });
    }
    
    // 格式化日期
    var dateStr = year + '-' + 
                  String(month).padStart(2, '0') + '-' + 
                  String(day).padStart(2, '0');
    
    
    // 更新表单数据
    this.setData({
      'recordForm.useDate': dateStr
    });
    
    // 检查表单有效性
    this.checkRecordFormValidity();
  },

  // 确认记录使用日期选择
  confirmRecordDateSelection: function() {
    console.log('确认日期选择被调用');
    
    // 由于日期选择器已经自动更新了表单数据，这里只需要关闭选择器
    this.setData({
      showRecordDatePicker: false
    });
    
  },

  // 分享卡片功能
  shareCard: function(e) {
    var cardId = e.currentTarget.dataset.id;
    var card = this.data.cards.find(function(item) {
      return item.id === cardId;
    });
    
    if (!card) {
      wx.showToast({
        title: '卡片不存在',
        icon: 'error'
      });
      return;
    }
    
    // 生成分享图片
    this.generateShareImage(card);
  },

  // 生成分享图片
  generateShareImage: function(card) {
    var that = this;
    
    // 显示加载提示
    wx.showLoading({
      title: '生成分享图片中...'
    });
    
    // 获取系统信息
    wx.getSystemInfo({
      success: function(res) {
        var screenWidth = res.screenWidth;
        var screenHeight = res.screenHeight;
        
        // 创建canvas上下文
        var ctx = wx.createCanvasContext('shareCanvas', that);
        
        // 设置画布尺寸
        var canvasWidth = 750; // 设计稿宽度
        var canvasHeight = 1334; // 设计稿高度
        
        // 渐变背景
        var gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
        gradient.addColorStop(0, '#F8F9FA');
        gradient.addColorStop(0.3, '#E8F5E8');
        gradient.addColorStop(0.7, '#D4EDDA');
        gradient.addColorStop(1, '#C3E6CB');
        ctx.setFillStyle(gradient);
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // 添加几何装饰图案
        ctx.setFillStyle('rgba(21, 109, 87, 0.1)');
        // 左上角装饰
        ctx.beginPath();
        ctx.arc(100, 100, 80, 0, Math.PI * 2);
        ctx.fill();
        
        // 右上角装饰
        ctx.beginPath();
        ctx.arc(canvasWidth - 100, 100, 60, 0, Math.PI * 2);
        ctx.fill();
        
        // 左下角装饰
        ctx.beginPath();
        ctx.arc(80, canvasHeight - 150, 70, 0, Math.PI * 2);
        ctx.fill();
        
        // 右下角装饰
        ctx.beginPath();
        ctx.arc(canvasWidth - 80, canvasHeight - 200, 50, 0, Math.PI * 2);
        ctx.fill();
        
        // 添加线条装饰
        ctx.setStrokeStyle('rgba(21, 109, 87, 0.2)');
        ctx.setLineWidth(2);
        ctx.beginPath();
        ctx.moveTo(0, 300);
        ctx.lineTo(canvasWidth, 300);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, canvasHeight - 400);
        ctx.lineTo(canvasWidth, canvasHeight - 400);
        ctx.stroke();
        
        // 添加标题背景
        ctx.setFillStyle('rgba(21, 109, 87, 0.1)');
        ctx.fillRect(canvasWidth / 2 - 150, 150, 300, 80);
        
        // 第一行：小程序名 - 卡点时光（粗体）
        ctx.setFillStyle('#156D57');
        ctx.setFontSize(56);
        ctx.setTextAlign('center');
        ctx.font = 'bold 56px sans-serif';
        ctx.fillText('卡点时光', canvasWidth / 2, 200);
        
        // 添加卡片信息背景框
        ctx.setFillStyle('rgba(255, 255, 255, 0.8)');
        ctx.fillRect(50, 250, canvasWidth - 100, 280);
        
        // 添加边框
        ctx.setStrokeStyle('#156D57');
        ctx.setLineWidth(3);
        ctx.strokeRect(50, 250, canvasWidth - 100, 280);
        
        // 卡片使用情况信息
        ctx.setFillStyle('#156D57'); // 改为墨绿色
        ctx.setFontSize(32);
        ctx.font = 'bold 32px sans-serif'; // 改为粗体
        
        // 消费卡名称
        ctx.fillText(card.name, canvasWidth / 2, 320);
        
        // 购买日期
        var purchaseDate = card.purchaseDate ? that.formatDate(card.purchaseDate) : '未知';
        ctx.fillText(purchaseDate + '购买', canvasWidth / 2, 360);
        
        // 最后使用日期或到期日期
        var lastUseDate = '';
        if (card.isExpired && card.expireDate) {
          lastUseDate = that.formatDate(card.expireDate) + '到期';
        } else if (card.lastUsedDate) {
          lastUseDate = that.formatDate(card.lastUsedDate) + '用完';
        } else {
          lastUseDate = '未知时间用完';
        }
        ctx.fillText(lastUseDate, canvasWidth / 2, 400);
        
        // 累计使用次数
        ctx.fillText('累计使用' + card.usedCount + '次', canvasWidth / 2, 440);
        
        // 平均单价
        var avgPrice = 0;
        if (card.totalAmount && card.usedCount > 0) {
          avgPrice = parseFloat(card.totalAmount) / card.usedCount;
        }
        ctx.fillText('平均' + avgPrice.toFixed(2) + '元/次', canvasWidth / 2, 480);
        
        // 添加宣传语背景
        ctx.setFillStyle('rgba(21, 109, 87, 0.1)');
        ctx.fillRect(50, 600, canvasWidth - 100, 150);
        
        // 宣传语两行
        ctx.setFillStyle('#156D57');
        ctx.setFontSize(28);
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText('榨干每一张消费卡的"剩余价值"', canvasWidth / 2, 680);
        ctx.fillText('让买卡的每一分钱都"死得其所"', canvasWidth / 2, 730);
        
        // 绘制小程序码
        var qrCodeSize = 200;
        var qrCodeX = (canvasWidth - qrCodeSize) / 2;
        var qrCodeY = canvasHeight - 300;
        
        // 绘制小程序码背景（带阴影效果）
        ctx.setFillStyle('rgba(21, 109, 87, 0.1)');
        ctx.fillRect(qrCodeX - 30, qrCodeY - 30, qrCodeSize + 60, qrCodeSize + 60);
        
        // 绘制小程序码白色背景
        ctx.setFillStyle('#FFFFFF');
        ctx.fillRect(qrCodeX - 20, qrCodeY - 20, qrCodeSize + 40, qrCodeSize + 40);
        
        // 添加边框
        ctx.setStrokeStyle('#156D57');
        ctx.setLineWidth(3);
        ctx.strokeRect(qrCodeX - 20, qrCodeY - 20, qrCodeSize + 40, qrCodeSize + 40);
        
        // 加载小程序码图片
        wx.getImageInfo({
          src: '/images/小程序码8cm.jpg',
          success: function(imageInfo) {
            // 绘制小程序码图片
            ctx.drawImage('/images/小程序码8cm.jpg', qrCodeX, qrCodeY, qrCodeSize, qrCodeSize);
            
            // 绘制完成
            ctx.draw(false, function() {
              // 导出图片
              wx.canvasToTempFilePath({
                canvasId: 'shareCanvas',
                success: function(res) {
                  wx.hideLoading();
                  
                  // 保存图片到相册
                  wx.saveImageToPhotosAlbum({
                    filePath: res.tempFilePath,
                    success: function() {
                      wx.showToast({
                        title: '分享图片已保存到相册',
                        icon: 'success'
                      });
                    },
                    fail: function() {
                      wx.showModal({
                        title: '保存失败',
                        content: '请允许访问相册权限',
                        showCancel: false
                      });
                    }
                  });
                },
                fail: function(error) {
                  wx.hideLoading();
                  console.error('生成分享图片失败:', error);
                  wx.showToast({
                    title: '生成失败',
                    icon: 'error'
                  });
                }
              }, that);
            });
          },
          fail: function() {
            // 如果小程序码图片加载失败，使用文字代替
            ctx.setFillStyle('#156D57');
            ctx.setFontSize(24);
            ctx.setTextAlign('center');
            ctx.fillText('小程序码', canvasWidth / 2, qrCodeY + qrCodeSize / 2);
            
            // 绘制完成
            ctx.draw(false, function() {
              // 导出图片
              wx.canvasToTempFilePath({
                canvasId: 'shareCanvas',
                success: function(res) {
                  wx.hideLoading();
                  
                  // 保存图片到相册
                  wx.saveImageToPhotosAlbum({
                    filePath: res.tempFilePath,
                    success: function() {
                      wx.showToast({
                        title: '分享图片已保存到相册',
                        icon: 'success'
                      });
                    },
                    fail: function() {
                      wx.showModal({
                        title: '保存失败',
                        content: '请允许访问相册权限',
                        showCancel: false
                      });
                    }
                  });
                },
                fail: function(error) {
                  wx.hideLoading();
                  console.error('生成分享图片失败:', error);
                  wx.showToast({
                    title: '生成失败',
                    icon: 'error'
                  });
                }
              }, that);
            });
          }
        });
      }
    });
  },

  // 格式化日期
  formatDate: function(dateStr) {
    var date = new Date(dateStr);
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');
    return year + '.' + month + '.' + day;
  },

  // 显示卡片详情
  showCardDetail: function(e) {
    var cardId = e.currentTarget.dataset.id;
    console.log('显示卡片详情:', cardId);
    
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
    
    // 设置当前年月为当前月份
    var now = new Date();
    this.setData({
      showDetailModal: true,
      selectedCardDetail: selectedCard,
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1
    });
    
    // 生成月历数据
    this.generateCalendar();
  },

  // 关闭详情弹窗
  closeDetailModal: function() {
    this.setData({
      showDetailModal: false,
      selectedCardDetail: null,
      isEditingMode: false,
      editedUsageRecords: []
    });
  },

  // 生成月历数据
  generateCalendar: function() {
    var year = this.data.currentYear;
    var month = this.data.currentMonth;
    var selectedCard = this.data.selectedCardDetail;
    
    if (!selectedCard) return;
    
    // 在编辑模式下使用编辑后的使用记录
    var usageRecords = this.data.isEditingMode ? this.data.editedUsageRecords : (selectedCard.usageRecords || []);
    
    console.log('生成月历数据:', {
      isEditingMode: this.data.isEditingMode,
      usageRecords: usageRecords,
      editedUsageRecords: this.data.editedUsageRecords
    });
    
    // 获取当月第一天和最后一天
    var firstDay = new Date(year, month - 1, 1);
    var lastDay = new Date(year, month, 0);
    var firstDayOfWeek = firstDay.getDay(); // 0-6，0是周日
    
    var calendarDays = [];
    var monthlyUsageCount = 0;
    
    // 添加上个月的日期（用于填充第一周）
    var prevMonth = month === 1 ? 12 : month - 1;
    var prevYear = month === 1 ? year - 1 : year;
    var prevMonthLastDay = new Date(prevYear, prevMonth, 0).getDate();
    
    for (var i = firstDayOfWeek - 1; i >= 0; i--) {
      var day = prevMonthLastDay - i;
      calendarDays.push({
        day: day,
        date: prevYear + '-' + String(prevMonth).padStart(2, '0') + '-' + String(day).padStart(2, '0'),
        isOtherMonth: true,
        isUsed: false,
        isToday: false,
        usageCount: 0
      });
    }
    
    // 添加当月的日期
    for (var day = 1; day <= lastDay.getDate(); day++) {
      var dateStr = year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
      var isToday = this.isToday(dateStr);
      
      // 直接使用当前的使用记录计算使用次数
      var usageCount = 0;
      for (var i = 0; i < usageRecords.length; i++) {
        if (usageRecords[i].date === dateStr) {
          usageCount += usageRecords[i].count || 1;
        }
      }
      var isUsed = usageCount > 0;
      
      if (isUsed) {
        monthlyUsageCount += usageCount;
      }
      
      calendarDays.push({
        day: day,
        date: dateStr,
        isOtherMonth: false,
        isUsed: isUsed,
        isToday: isToday,
        usageCount: usageCount
      });
      
      // 调试信息：记录有使用次数的日期
      if (usageCount > 0) {
        console.log('月历日期数据:', {
          date: dateStr,
          usageCount: usageCount,
          isUsed: isUsed
        });
      }
    }
    
    // 添加下个月的日期（用于填充最后一周）
    var nextMonth = month === 12 ? 1 : month + 1;
    var nextYear = month === 12 ? year + 1 : year;
    var remainingDays = 42 - calendarDays.length; // 6周 * 7天 = 42天
    
    for (var day = 1; day <= remainingDays; day++) {
      calendarDays.push({
        day: day,
        date: nextYear + '-' + String(nextMonth).padStart(2, '0') + '-' + String(day).padStart(2, '0'),
        isOtherMonth: true,
        isUsed: false,
        isToday: false,
        usageCount: 0
      });
    }
    
    this.setData({
      calendarDays: calendarDays,
      monthlyUsageCount: monthlyUsageCount
    });
  },

  // 判断是否为今天
  isToday: function(dateStr) {
    var today = new Date();
    var todayStr = today.getFullYear() + '-' + 
                   String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(today.getDate()).padStart(2, '0');
    return dateStr === todayStr;
  },

  // 获取指定日期的使用次数
  getUsageCountForDate: function(card, dateStr) {
    // 在编辑模式下使用编辑后的使用记录
    var usageRecords = this.data.isEditingMode ? this.data.editedUsageRecords : (card.usageRecords || []);
    
    // 检查是否有使用记录
    if (!usageRecords || !Array.isArray(usageRecords)) {
      return 0;
    }
    
    var count = 0;
    for (var i = 0; i < usageRecords.length; i++) {
      if (usageRecords[i].date === dateStr) {
        count += usageRecords[i].count || 1;
      }
    }
    
    return count;
  },

  // 获取卡片的使用记录
  getUsageRecordsForCard: function(card) {
    // 返回卡片的真实使用记录，如果没有则返回空数组
    return card.usageRecords || [];
  },

  // 上一个月
  prevMonth: function() {
    var year = this.data.currentYear;
    var month = this.data.currentMonth;
    
    if (month === 1) {
      year--;
      month = 12;
    } else {
      month--;
    }
    
    this.setData({
      currentYear: year,
      currentMonth: month
    });
    
    this.generateCalendar();
  },

  // 下一个月
  nextMonth: function() {
    var year = this.data.currentYear;
    var month = this.data.currentMonth;
    
    if (month === 12) {
      year++;
      month = 1;
    } else {
      month++;
    }
    
    this.setData({
      currentYear: year,
      currentMonth: month
    });
    
    this.generateCalendar();
  },

  // 切换日期使用状态
  toggleDayUsage: function(e) {
    var date = e.currentTarget.dataset.date;
    var isUsed = e.currentTarget.dataset.isUsed === 'true';
    var currentCount = parseInt(e.currentTarget.dataset.usageCount) || 0;
    
    
    // 强制进入编辑模式
    if (!this.data.isEditingMode) {
      this.enterEditMode();
    }
    
    // 直接处理，不使用异步
    this.processDayToggle(date, isUsed, currentCount);
  },

  // 处理日期切换逻辑
  processDayToggle: function(date, isUsed, currentCount) {
    
    // 更新编辑后的使用记录
    var editedRecords = [...this.data.editedUsageRecords]; // 创建副本
    var recordIndex = editedRecords.findIndex(function(record) {
      return record.date === date;
    });
    
    
    // 重新设计逻辑：基于当前使用次数进行智能切换
    if (recordIndex !== -1) {
      // 如果找到记录，说明该日期有使用记录
      var record = editedRecords[recordIndex];
      var currentUsageCount = record.count || 1;
      
      if (currentUsageCount > 1) {
        // 如果使用次数大于1，则减少1次
        record.count = currentUsageCount - 1;
      } else {
        // 如果使用次数为1，则完全移除该记录
        editedRecords.splice(recordIndex, 1);
      }
    } else {
      // 如果没有找到记录，说明该日期没有使用记录，添加1次
      editedRecords.push({
        date: date,
        count: 1,
        timestamp: new Date().toISOString()
      });
    }
    
    this.setData({
      editedUsageRecords: editedRecords
    });
    
    // 重新生成月历以反映变化
    this.generateCalendar();
  },

  // 长按增加使用次数
  increaseDayUsage: function(e) {
    var date = e.currentTarget.dataset.date;
    var currentCount = parseInt(e.currentTarget.dataset.usageCount) || 0;
    
    
    // 如果不在编辑模式，先进入编辑模式
    if (!this.data.isEditingMode) {
      this.enterEditMode();
    }
    
    // 更新编辑后的使用记录
    var editedRecords = [...this.data.editedUsageRecords];
    var recordIndex = editedRecords.findIndex(function(record) {
      return record.date === date;
    });
    
    if (recordIndex !== -1) {
      // 如果找到记录，增加使用次数
      var record = editedRecords[recordIndex];
      record.count = (record.count || 1) + 1;
    } else {
      // 如果没有找到记录，添加2次记录（长按默认增加2次）
      editedRecords.push({
        date: date,
        count: 2,
        timestamp: new Date().toISOString()
      });
    }
    
    this.setData({
      editedUsageRecords: editedRecords
    });
    
    // 重新生成月历以反映变化
    this.generateCalendar();
    
    // 显示提示
    wx.showToast({
      title: '使用次数+1',
      icon: 'success',
      duration: 1000
    });
  },

  // 进入编辑模式
  enterEditMode: function() {
    var selectedCard = this.data.selectedCardDetail;
    if (!selectedCard) return;
    
    // 保存原始使用记录
    var originalRecords = selectedCard.usageRecords ? [...selectedCard.usageRecords] : [];
    
    this.setData({
      isEditingMode: true,
      originalUsageRecords: originalRecords,
      editedUsageRecords: [...originalRecords]
    });
  },

  // 取消编辑
  cancelEdit: function() {
    this.setData({
      isEditingMode: false,
      editedUsageRecords: []
    });
    
    // 重新生成月历以恢复原始状态
    this.generateCalendar();
    
    // 关闭月历视图，返回主页面
    setTimeout(() => {
      this.closeDetailModal();
    }, 500); // 延迟0.5秒让用户看到取消操作
  },

  // 保存编辑
  saveEdit: function() {
    var selectedCard = this.data.selectedCardDetail;
    if (!selectedCard) return;
    
    try {
      var app = getApp();
      var dataManager = app.getDataManager();
      
      if (dataManager) {
        // 更新卡片的使用记录
        var updatedCard = {
          ...selectedCard,
          usageRecords: this.data.editedUsageRecords,
          usedCount: this.calculateTotalUsedCount(this.data.editedUsageRecords),
          updatedAt: new Date().toISOString()
        };
        
        var success = dataManager.updateCard(updatedCard);
        if (success) {
          wx.showToast({
            title: '保存成功',
            icon: 'success'
          });
          
          this.setData({
            isEditingMode: false,
            selectedCardDetail: updatedCard
          });
          
          // 重新生成月历以反映保存后的数据
          this.generateCalendar();
          
          // 更新主页面的卡片数据，避免被重新加载覆盖
          this.updateCardInList(updatedCard);
          
          // 关闭月历视图，返回主页面
          setTimeout(() => {
            this.closeDetailModal();
          }, 1000); // 延迟1秒让用户看到保存成功的提示
        } else {
          throw new Error('保存失败');
        }
      }
    } catch (error) {
      console.error('保存编辑失败:', error);
      wx.showToast({
        title: '保存失败',
        icon: 'error'
      });
    }
  },

  // 计算总使用次数
  calculateTotalUsedCount: function(usageRecords) {
    var totalCount = 0;
    for (var i = 0; i < usageRecords.length; i++) {
      totalCount += usageRecords[i].count || 1;
    }
    return totalCount;
  },

  // 更新主页面卡片列表中的卡片数据
  updateCardInList: function(updatedCard) {
    var cards = this.data.cards || [];
    var filteredCards = this.data.filteredCards || [];
    
    // 更新主卡片列表
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].id === updatedCard.id) {
        // 重新计算显示数据
        var displayCard = this.convertCardToDisplayData(updatedCard);
        cards[i] = displayCard;
        break;
      }
    }
    
    // 更新过滤后的卡片列表
    for (var i = 0; i < filteredCards.length; i++) {
      if (filteredCards[i].id === updatedCard.id) {
        // 重新计算显示数据
        var displayCard = this.convertCardToDisplayData(updatedCard);
        filteredCards[i] = displayCard;
        break;
      }
    }
    
    // 更新统计数据
    var totalCards = cards.length;
    var expiringCards = 0;
    var runningOutCards = 0;
    
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      
      // 统计即将到期的卡片
      if (card.expireDate) {
        var expireDate = new Date(card.expireDate);
        var now = new Date();
        var daysUntilExpire = Math.ceil((expireDate - now) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpire <= 30 && daysUntilExpire > 0) {
          expiringCards++;
        }
      }
      
      // 统计即将用完的卡片
      if (typeof card.totalCount === 'number' && card.totalCount > 0) {
        var remainingCount = card.totalCount - card.usedCount;
        var remainingPercentage = (remainingCount / card.totalCount) * 100;
        
        if ((remainingCount <= 2 && remainingCount > 0) || 
            (remainingPercentage < 10 && remainingCount > 0)) {
          runningOutCards++;
        }
      }
    }
    
    this.setData({
      cards: cards,
      filteredCards: filteredCards,
      totalCards: totalCards,
      expiringSoon: expiringCards,
      runningOut: runningOutCards
    });
  },

  // 将卡片数据转换为显示数据
  convertCardToDisplayData: function(card) {
    // 处理不限次数卡片
    var isUnlimited = typeof card.totalCount !== 'number';
    var progress = 0;
    var remainingCount = 0;
    var isUsedUp = false;
    
    // 计算单价（总价值 / 已使用次数）
    var unitPrice = 0;
    var unitPriceText = '';
    if (card.totalAmount && card.usedCount > 0) {
      unitPrice = parseFloat(card.totalAmount) / card.usedCount;
    }
    
    if (isUnlimited) {
      // 不限次数卡片，进度显示为时间进度
      progress = 0;
      remainingCount = '不限';
      isUsedUp = false;
      unitPriceText = unitPrice > 0 ? unitPrice.toFixed(2) + '元/次（多用 才划算）' : '多用 才划算';
    } else {
      // 有限次数卡片
      progress = card.totalCount > 0 ? Math.round((card.usedCount / card.totalCount) * 100) : 0;
      remainingCount = card.totalCount - card.usedCount;
      isUsedUp = remainingCount <= 0;
      unitPriceText = unitPrice > 0 ? unitPrice.toFixed(2) + '元/次（快用 别浪费）' : '快用 别浪费';
    }
    
    var isExpiring = false;
    var isExpired = false;
    var isRunningOut = false;
    var expireText = '';
    var dateProgress = 0;
    var dateProgressText = '';
    
    // 计算日期进度条
    if (card.expireDate && card.purchaseDate) {
      var expireDate = new Date(card.expireDate);
      var purchaseDate = new Date(card.purchaseDate);
      var now = new Date();
      
      var totalValidDays = Math.ceil((expireDate - purchaseDate) / (1000 * 60 * 60 * 24));
      var passedDays = Math.ceil((now - purchaseDate) / (1000 * 60 * 60 * 24));
      var daysUntilExpire = Math.ceil((expireDate - now) / (1000 * 60 * 60 * 24));
      
      if (totalValidDays > 0 && passedDays >= 0) {
        dateProgress = Math.min(Math.max((passedDays / totalValidDays) * 100, 0), 100);
        
        if (daysUntilExpire <= 0) {
          isExpired = true;
          dateProgressText = '已过期';
          dateProgress = 100;
        } else if (daysUntilExpire <= 30 && daysUntilExpire > 0) {
          isExpiring = true;
          dateProgressText = '还有' + daysUntilExpire + '天到期';
        } else {
          dateProgressText = '还有' + daysUntilExpire + '天到期';
        }
        
        if (isExpired) {
          dateProgress = 100;
        }
      } else {
        dateProgressText = '日期信息异常';
      }
    } else {
      dateProgressText = '无日期信息';
    }
    
    // 检查是否即将用完（仅限有限次数卡片）
    if (!isUnlimited && typeof card.totalCount === 'number' && card.totalCount > 0) {
      var remainingCount = card.totalCount - card.usedCount;
      var remainingPercentage = (remainingCount / card.totalCount) * 100;
      
      if ((remainingCount <= 2 && remainingCount > 0) || 
          (remainingPercentage < 10 && remainingCount > 0)) {
        isRunningOut = true;
      }
    }
    
    // 对于不限次数的卡片，使用时间进度作为显示进度
    if (isUnlimited && card.expireDate) {
      progress = Math.round(dateProgress);
    }
    
    if (!dateProgress && progress) {
      dateProgress = progress;
    }
    
    // 计算是否可以使用
    var canUse = !isExpired && (isUnlimited || remainingCount > 0);
    
    return {
      ...card,
      progress: progress,
      isExpiring: isExpiring,
      isExpired: isExpired,
      isRunningOut: isRunningOut,
      expireText: expireText,
      dateProgress: dateProgress,
      dateProgressText: dateProgressText,
      dateProgressFixed: (dateProgress || 0).toFixed(2),
      remainingCount: remainingCount,
      isUsedUp: isUsedUp,
      unitPrice: unitPrice,
      unitPriceText: unitPriceText,
      canUse: canUse
    };
  }

});
