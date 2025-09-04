// pages/settings/settings.js
Page({
  data: {
    // 页面数据
  },

  onLoad: function() {
    console.log('设置页面加载');
  },

  onShow: function() {
    console.log('设置页面显示');
  },

  // 跳转到提醒设置页面
  goToReminderSettings: function() {
    console.log('跳转到提醒设置页面');
    wx.navigateTo({
      url: '/pages/reminder-settings/reminder-settings'
    });
  },

  // 数据管理
  backupData: function() {
    var that = this;
    var app = getApp();
    var backupManager = app.getBackupManager();
    
    if (backupManager) {
      wx.showModal({
        title: '创建备份',
        content: '确定要创建当前数据的备份吗？',
        confirmText: '创建备份',
        cancelText: '取消',
        success: function(res) {
          if (res.confirm) {
            wx.showLoading({
              title: '创建备份中...'
            });
            
            try {
              var backupKey = backupManager.createManualBackup('手动备份');
              if (backupKey) {
                wx.hideLoading();
                wx.showToast({
                  title: '备份创建成功',
                  icon: 'success',
                  duration: 2000
                });
              } else {
                throw new Error('备份创建失败');
              }
            } catch (error) {
              wx.hideLoading();
              wx.showModal({
                title: '备份失败',
                content: '创建备份时出现错误：' + error.message,
                showCancel: false,
                confirmText: '知道了'
              });
            }
          }
        }
      });
    } else {
      wx.showModal({
        title: '功能不可用',
        content: '备份管理器未初始化，请重启小程序后重试',
        showCancel: false,
        confirmText: '知道了'
      });
    }
  },

  restoreData: function() {
    var that = this;
    var app = getApp();
    var backupManager = app.getBackupManager();
    
    if (backupManager) {
      var backupList = backupManager.getBackupList();
      
      if (backupList.length === 0) {
        wx.showModal({
          title: '没有备份',
          content: '当前没有可用的备份数据',
          showCancel: false,
          confirmText: '知道了'
        });
        return;
      }
      
      // 显示备份列表供用户选择
      var backupItems = backupList.map(function(backup) {
        var date = new Date(backup.timestamp);
        var dateStr = date.getFullYear() + '-' + 
                     String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(date.getDate()).padStart(2, '0') + ' ' +
                     String(date.getHours()).padStart(2, '0') + ':' + 
                     String(date.getMinutes()).padStart(2, '0');
        
        return {
          name: backup.description + ' (' + dateStr + ') - ' + backup.count + '张卡片',
          value: backup.key
        };
      });
      
      wx.showActionSheet({
        itemList: backupItems.map(function(item) { return item.name; }),
        success: function(res) {
          var selectedBackup = backupItems[res.tapIndex];
          
          wx.showModal({
            title: '确认恢复',
            content: '确定要从备份恢复数据吗？当前数据将被覆盖！',
            confirmText: '确认恢复',
            cancelText: '取消',
            success: function(modalRes) {
              if (modalRes.confirm) {
                wx.showLoading({
                  title: '恢复数据中...'
                });
                
                try {
                  var success = backupManager.restoreFromBackup(selectedBackup.value);
                  if (success) {
                    wx.hideLoading();
                    wx.showToast({
                      title: '数据恢复成功',
                      icon: 'success',
                      duration: 2000
                    });
                  } else {
                    throw new Error('数据恢复失败');
                  }
                } catch (error) {
                  wx.hideLoading();
                  wx.showModal({
                    title: '恢复失败',
                    content: '恢复数据时出现错误：' + error.message,
                    showCancel: false,
                    confirmText: '知道了'
                  });
                }
              }
            }
          });
        }
      });
    } else {
      wx.showModal({
        title: '功能不可用',
        content: '备份管理器未初始化，请重启小程序后重试',
        showCancel: false,
        confirmText: '知道了'
      });
    }
  },

  exportData: function() {
    var app = getApp();
    var dataManager = app.getDataManager();
    
    if (dataManager) {
      try {
        var exportData = dataManager.exportData();
        if (exportData) {
          // 复制到剪贴板（微信小程序限制，实际可能需要其他方式）
          wx.setClipboardData({
            data: exportData,
            success: function() {
              wx.showModal({
                title: '导出成功',
                content: '数据已复制到剪贴板，请保存到安全的地方。\n\n注意：请妥善保管此数据，避免泄露个人信息。',
                showCancel: false,
                confirmText: '知道了'
              });
            },
            fail: function() {
              wx.showModal({
                title: '导出失败',
                content: '无法复制到剪贴板，请手动保存以下数据：\n\n' + exportData.substring(0, 200) + '...',
                showCancel: false,
                confirmText: '知道了'
              });
            }
          });
        } else {
          throw new Error('导出数据失败');
        }
      } catch (error) {
        wx.showModal({
          title: '导出失败',
          content: '导出数据时出现错误：' + error.message,
          showCancel: false,
          confirmText: '知道了'
        });
      }
    } else {
      wx.showModal({
        title: '功能不可用',
        content: '数据管理器未初始化，请重启小程序后重试',
        showCancel: false,
        confirmText: '知道了'
      });
    }
  },

  importData: function() {
    var that = this;
    var app = getApp();
    var dataManager = app.getDataManager();
    
    if (dataManager) {
      wx.showModal({
        title: '导入数据',
        content: '请将之前导出的数据粘贴到输入框中，然后点击确认导入。\n\n注意：导入会合并现有数据，重复的卡片将被跳过。',
        editable: true,
        placeholderText: '粘贴导出的JSON数据',
        confirmText: '导入',
        cancelText: '取消',
        success: function(res) {
          if (res.confirm && res.content) {
            wx.showLoading({
              title: '导入数据中...'
            });
            
            try {
              var success = dataManager.importData(res.content);
              if (success) {
                wx.hideLoading();
                wx.showToast({
                  title: '数据导入成功',
                  icon: 'success',
                  duration: 2000
                });
              } else {
                throw new Error('数据导入失败');
              }
            } catch (error) {
              wx.hideLoading();
              wx.showModal({
                title: '导入失败',
                content: '导入数据时出现错误：' + error.message,
                showCancel: false,
                confirmText: '知道了'
              });
            }
          }
        }
      });
    } else {
      wx.showModal({
        title: '功能不可用',
        content: '数据管理器未初始化，请重启小程序后重试',
        showCancel: false,
        confirmText: '知道了'
      });
    }
  },

  viewBackupList: function() {
    var app = getApp();
    var backupManager = app.getBackupManager();
    
    if (backupManager) {
      var backupList = backupManager.getBackupList();
      var storageUsage = backupManager.getStorageUsage();
      
      if (backupList.length === 0) {
        wx.showModal({
          title: '备份列表',
          content: '当前没有可用的备份数据',
          showCancel: false,
          confirmText: '知道了'
        });
        return;
      }
      
      var content = '备份列表：\n\n';
      for (var i = 0; i < backupList.length; i++) {
        var backup = backupList[i];
        var date = new Date(backup.timestamp);
        var dateStr = date.getFullYear() + '-' + 
                     String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(date.getDate()).padStart(2, '0') + ' ' +
                     String(date.getHours()).padStart(2, '0') + ':' + 
                     String(date.getMinutes()).padStart(2, '0');
        
        content += (i + 1) + '. ' + backup.description + '\n';
        content += '   时间：' + dateStr + '\n';
        content += '   卡片：' + backup.count + '张\n';
        content += '   类型：' + (backup.type === 'auto' ? '自动' : '手动') + '\n\n';
      }
      
      content += '存储使用情况：\n';
      content += '总键数：' + storageUsage.totalKeys + '\n';
      content += '卡片相关键：' + storageUsage.cardKeys + '\n';
      content += '数据大小：' + Math.round(storageUsage.totalSize / 1024) + 'KB\n';
      content += '存储限制：' + Math.round(storageUsage.limitSize / 1024) + 'KB';
      
      wx.showModal({
        title: '备份信息',
        content: content,
        showCancel: false,
        confirmText: '知道了'
      });
    } else {
      wx.showModal({
        title: '功能不可用',
        content: '备份管理器未初始化，请重启小程序后重试',
        showCancel: false,
        confirmText: '知道了'
      });
    }
  },

  optimizeStorage: function() {
    var that = this;
    var app = getApp();
    var backupManager = app.getBackupManager();
    
    if (backupManager) {
      wx.showModal({
        title: '优化存储',
        content: '确定要优化存储空间吗？这将清理重复备份和压缩旧备份。',
        confirmText: '开始优化',
        cancelText: '取消',
        success: function(res) {
          if (res.confirm) {
            wx.showLoading({
              title: '优化存储中...'
            });
            
            try {
              backupManager.optimizeStorage();
              
              setTimeout(function() {
                wx.hideLoading();
                wx.showToast({
                  title: '存储优化完成',
                  icon: 'success',
                  duration: 2000
                });
              }, 1500);
            } catch (error) {
              wx.hideLoading();
              wx.showModal({
                title: '优化失败',
                content: '优化存储时出现错误：' + error.message,
                showCancel: false,
                confirmText: '知道了'
              });
            }
          }
        }
      });
    } else {
      wx.showModal({
        title: '功能不可用',
        content: '备份管理器未初始化，请重启小程序后重试',
        showCancel: false,
        confirmText: '知道了'
      });
    }
  },

  // 显示数据导出
  showDataExport: function() {
    wx.showModal({
      title: '数据导出',
      content: '此功能将在后续版本中开放',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 显示数据导入
  showDataImport: function() {
    wx.showModal({
      title: '数据导入',
      content: '此功能将在后续版本中开放',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 清空数据
  clearData: function() {
    wx.showModal({
      title: '确认清空',
      content: '此操作将删除所有套餐卡数据，无法恢复。确定要继续吗？',
      confirmText: '清空',
      confirmColor: '#FCC96E',
      cancelText: '取消',
      success: function(res) {
        if (res.confirm) {
          try {
            // 清空本地存储
            wx.removeStorageSync('cards');
            wx.removeStorageSync('reminderSettings');
            
            wx.showToast({
              title: '数据已清空',
              icon: 'success',
              duration: 2000
            });
          } catch (error) {
            console.error('清空数据失败:', error);
            wx.showModal({
              title: '操作失败',
              content: '清空数据时出现错误，请重试',
              showCancel: false,
              confirmText: '知道了'
            });
          }
        }
      }
    });
  },

  // 重置应用
  resetApp: function() {
    wx.showModal({
      title: '确认重置',
      content: '此操作将恢复所有默认设置，确定要继续吗？',
      confirmText: '重置',
      confirmColor: '#FCC96E',
      cancelText: '取消',
      success: function(res) {
        if (res.confirm) {
          try {
            // 清空所有本地存储
            wx.clearStorageSync();
            
            wx.showToast({
              title: '应用已重置',
              icon: 'success',
              duration: 2000
            });
          } catch (error) {
            console.error('重置应用失败:', error);
            wx.showModal({
              title: '操作失败',
              content: '重置应用时出现错误，请重试',
              showCancel: false,
              confirmText: '知道了'
            });
          }
        }
      }
    });
  },

  // 显示关于信息
  showAbout: function() {
    wx.showModal({
      title: '关于卡点时光',
      content: '卡点时光 v1.0.0\n\n让每一次消费都有记录\n\n卡点时光团队倾情打造',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 显示意见反馈
  showFeedback: function() {
    wx.showModal({
      title: '意见反馈',
      content: '感谢您的使用！\n\n如有建议或问题，请通过以下方式联系我们：\n\n邮箱：feedback@cardpoint.com\n\n我们会认真考虑您的每一条建议！',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 显示分享
  showShare: function() {
    wx.showModal({
      title: '分享应用',
      content: '感谢您喜欢卡点时光！\n\n请点击右上角分享按钮，将应用推荐给您的朋友。\n\n让更多人享受便捷的套餐卡管理体验！',
      showCancel: false,
      confirmText: '知道了'
    });
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
  }
});