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
      
      // 跳转到对应页面
      wx.switchTab({
        url: path,
        success: function() {
          console.log('切换到页面:', path);
        },
        fail: function(error) {
          console.error('页面跳转失败:', error);
          // 如果switchTab失败，尝试使用navigateTo
          wx.navigateTo({
            url: path
          });
        }
      });
    }
  }
});

