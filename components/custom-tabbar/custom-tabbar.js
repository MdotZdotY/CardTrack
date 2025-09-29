// components/custom-tabbar/custom-tabbar.js
Component({
  properties: {
    currentTab: {
      type: Number,
      value: 0
    }
  },

  data: {
    // 组件数据
  },

  methods: {
    // 切换标签页
    switchTab: function(e) {
      var index = e.currentTarget.dataset.index;
      var path = e.currentTarget.dataset.path;
      
      // 如果点击的是当前页面，不执行跳转
      if (index === this.data.currentTab) {
        return;
      }
      
      // 跳转到对应页面（自定义 tabbar 不使用 switchTab）
      var url = path && path.startsWith('/') ? path : ('/' + path);
      wx.reLaunch({
        url: url,
        success: function() {
        },
        fail: function(error) {
          console.error('页面跳转失败:', error);
          // 兜底再尝试 redirectTo（不入栈）
          wx.redirectTo({ url: url });
        }
      });
    },

    // 添加卡片
    addCard: function() {
      wx.navigateTo({
        url: '/pages/add-card/add-card',
        success: function() {
        },
        fail: function(error) {
          console.error('跳转添加卡片页面失败:', error);
        }
      });
    }
  }
});

