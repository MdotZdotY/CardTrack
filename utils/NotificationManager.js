// utils/NotificationManager.js
// 提供一个基础的通知管理器，当前为空实现，避免因模块缺失导致应用无法启动。

class NotificationManager {
  constructor() {
    // 预留：未来可在此加载通知相关设置
  }

  // 检查并发送通知（空实现，确保不会抛错）
  checkAndSendNotifications(cards) {
    try {
      // 预留：未来可实现服务通知/本地消息聚合
      // 目前不做任何事，保证兼容
      return;
    } catch (error) {
      console.error('发送通知失败:', error);
    }
  }
}

module.exports = NotificationManager;



