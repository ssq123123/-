// app.js
App({
    onLaunch() {
      // 初始化云开发
      if (wx.cloud) {
        wx.cloud.init({
          env: 'your-cloud-env-id',
          traceUser: true,
        });
      }
    },
    globalData: {
      userInfo: null,
      gameData: {
        positions: {},
        scores: {},
        stats: {}
      }
    }
  });