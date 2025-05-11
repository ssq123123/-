// pages/index/index.js
const DEFAULT_SCORE = 100;
const POSITION_NAMES = {
  east: '东',
  south: '南',
  west: '西',
  north: '北'
};

Page({
  data: {
    positionSet: false,
    myPosition: '',
    positions: {},
    scores: {
      east: DEFAULT_SCORE,
      south: DEFAULT_SCORE,
      west: DEFAULT_SCORE,
      north: DEFAULT_SCORE
    },
    messageLog: [],
    stats: {
      east: { win: 0, lose: 0, kong: 0 },
      south: { win: 0, lose: 0, kong: 0 },
      west: { win: 0, lose: 0, kong: 0 },
      north: { win: 0, lose: 0, kong: 0 }
    },
    currentAction: null,
    currentTarget: null,
    currentPlayer: null,
    scrollTop: 0,
    autoScroll: true,
    countdown: '04:00:00',
    timer: null,
    gameNumber: 1,
    lastSelfWinTime: { east: 0, south: 0, west: 0, north: 0 },
    totalCodes: { east: 0, south: 0, west: 0, north: 0 },
    selfWinDuration: { east: 0, south: 0, west: 0, north: 0 },
    formattedSelfWinTimes: { east: '00:00', south: '00:00', west: '00:00', north: '00:00' },
    updateInterval: null,
    showSettingsModal: false,
    settings: {
      waterValue: 2,
      baseScore: 100,
      fontSize: 26
    },
    autoWaterEnabled: false,
    totalAutoWater: 0,
    showAutoWaterSettingsModal: false,
    autoWaterSettings: {
      totalRounds: 10,
      waterPerRound: 2,
      remainingRounds: 0
    }
  },

  onLoad() {
    this.actionModal = this.selectComponent('#actionModal');
    this.numberModal = this.selectComponent('#numberModal');
    this.playerModal = this.selectComponent('#playerModal');
    
    const savedSettings = wx.getStorageSync('gameSettings');
    if (savedSettings) {
      this.setData({ settings: savedSettings });
    }
    
    const autoWaterStatus = wx.getStorageSync('autoWaterStatus');
    if (autoWaterStatus !== undefined) {
      this.setData({ autoWaterEnabled: autoWaterStatus });
    }

    const savedAutoWaterSettings = wx.getStorageSync('autoWaterSettings');
    if (savedAutoWaterSettings) {
      this.setData({ 
        autoWaterSettings: {
          ...savedAutoWaterSettings,
          remainingRounds: savedAutoWaterSettings.remainingRounds
        }
      });
    }
  },

  onScroll(e) {
    const { scrollHeight, scrollTop, height } = e.detail;
    this.setData({
      autoScroll: (scrollHeight - scrollTop - height) < 50
    });
  },

  scrollToBottom() {
    this.setData({
      scrollTop: 999999,
      autoScroll: true
    });
  },

  setPosition(e) {
    const myPosition = e.currentTarget.dataset.position;
    const positions = this.calculatePositions(myPosition);
    const baseScore = this.data.settings.baseScore;
    const now = Date.now();

    this.setData({
      myPosition,
      positions,
      positionSet: true,
      scores: {
        east: baseScore,
        south: baseScore,
        west: baseScore,
        north: baseScore
      },
      messageLog: [
        `🎲【牌桌定位完成】`,
        `🗺️ 方位图鉴：`,
        `[👑主人] ${positions[myPosition]} ➜ 当前分数：💰${baseScore}`,
        `[🔼上家] ${positions[this.getRelativePosition(myPosition, 'up')]} ➜ 当前分数：💰${baseScore}`,
        `[⏹对家] ${positions[this.getRelativePosition(myPosition, 'opposite')]} ➜ 当前分数：💰${baseScore}`,
        `[🔽下家] ${positions[this.getRelativePosition(myPosition, 'down')]} ➜ 当前分数：💰${baseScore}`,
        `🪄小精灵：牌局已初始化完成，祝主人旗开得胜！✨`
      ],
      lastSelfWinTime: {
        east: now,
        south: now,
        west: now,
        north: now
      },
      formattedSelfWinTimes: {
        east: '00:00',
        south: '00:00',
        west: '00:00',
        north: '00:00'
      },
      totalAutoWater: 0
    }, () => {
      this.startCountdown();
      this.startUpdateInterval();
      this.scrollToBottom();
    });
  },

  startCountdown() {
    let seconds = 4 * 3600;
    if (this.data.timer) clearInterval(this.data.timer);

    this.data.timer = setInterval(() => {
      seconds--;
      const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
      const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
      const s = (seconds % 60).toString().padStart(2, '0');
      this.setData({ countdown: `${h}:${m}:${s}` });

      if (seconds <= 0) clearInterval(this.data.timer);
    }, 1000);
  },

  startUpdateInterval() {
    if (this.data.updateInterval) clearInterval(this.data.updateInterval);
    this.data.updateInterval = setInterval(() => {
      this.updateSelfWinDuration();
    }, 1000);
    this.updateSelfWinDuration();
  },

  updateSelfWinDuration() {
    const now = Date.now();
    const durations = {};
    const formattedTimes = {};

    ['east', 'south', 'west', 'north'].forEach(position => {
      const durationMs = now - this.data.lastSelfWinTime[position];
      const minutes = Math.floor(durationMs / 60000);
      const seconds = Math.floor((durationMs % 60000) / 1000);

      durations[position] = durationMs;
      formattedTimes[position] = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    });

    this.setData({
      selfWinDuration: durations,
      formattedSelfWinTimes: formattedTimes
    });
  },

  calculatePositions(myPosition) {
    const positions = {};
    const positionOrder = ['east', 'south', 'west', 'north'];
    const myIndex = positionOrder.indexOf(myPosition);

    positions[myPosition] = POSITION_NAMES[myPosition];
    positions[positionOrder[(myIndex + 1) % 4]] = POSITION_NAMES[positionOrder[(myIndex + 1) % 4]];
    positions[positionOrder[(myIndex + 2) % 4]] = POSITION_NAMES[positionOrder[(myIndex + 2) % 4]];
    positions[positionOrder[(myIndex + 3) % 4]] = POSITION_NAMES[positionOrder[(myIndex + 3) % 4]];

    return positions;
  },

  getRelativePosition(position, relation) {
    const positionOrder = ['east', 'south', 'west', 'north'];
    const index = positionOrder.indexOf(position);

    switch (relation) {
      case 'up': return positionOrder[(index + 3) % 4];
      case 'opposite': return positionOrder[(index + 2) % 4];
      case 'down': return positionOrder[(index + 1) % 4];
      default: return position;
    }
  },

  showActionModal(e) {
    const target = e.currentTarget.dataset.target;
    this.setData({ currentTarget: target });

    this.actionModal.show({
      title: `选择${this.data.positions[target]}家的操作`,
      actions: [
        { name: 'selfWin', text: '自摸' },
        { name: 'directKong', text: '直杠' },
        { name: 'hiddenKong', text: '暗杠' },
        { name: 'addedKong', text: '补杠' },
        { name: 'robbedKong', text: '抢杠' },
        { name: 'kongWin', text: '直杠杠开' },
        { name: 'water', text: '抽水' }
      ]
    });
  },

  handleAction(e) {
    const action = e.detail;
    this.setData({ currentAction: action });

    switch (action) {
      case 'selfWin':
        this.numberModal.show({
          title: '选择自摸的码数',
          numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        });
        break;
      case 'directKong':
      case 'kongWin':
      case 'robbedKong':
        this.showPlayerSelection();
        break;
      default:
        this.executeAction(action);
    }
  },

  showPlayerSelection() {
    this.playerModal.show({
      title: '选择被杠/抢杠的玩家',
      players: ['east', 'south', 'west', 'north']
        .filter(p => p !== this.data.currentTarget)
        .map(p => ({ name: p, text: this.data.positions[p] }))
    });
  },

  handlePlayerConfirm(e) {
    const player = e.detail;
    this.setData({ currentPlayer: player });

    if (['robbedKong', 'kongWin'].includes(this.data.currentAction)) {
      this.numberModal.show({
        title: '选择中码数量',
        numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      });
    } else {
      this.executeAction(this.data.currentAction, null, player);
    }
  },

  handleNumberConfirm(e) {
    const number = e.detail;
    this.executeAction(this.data.currentAction, number, this.data.currentPlayer);
  },

  executeAction(action, number = null, player = null) {
    if (['robbedKong', 'kongWin', 'directKong'].includes(action) && !player) {
      wx.showToast({ title: '请选择目标玩家', icon: 'error' });
      return;
    }

    const that = this;
    const { currentTarget, positions, scores, stats, settings } = that.data;
    const newScores = { ...scores };
    const newStats = JSON.parse(JSON.stringify(stats));
    let message = '';
    let scoreChange = {};
    const otherPlayers = ['east', 'south', 'west', 'north'].filter(p => p !== currentTarget);

    if (['selfWin', 'kongWin', 'robbedKong'].includes(action)) {
      that.setData({ gameNumber: that.data.gameNumber + 1 });
    }

    switch (action) {
      case 'selfWin':
        const winScore = (1 + (number || 0)) * 3;
        newScores[currentTarget] += winScore;
        scoreChange[currentTarget] = winScore;
        otherPlayers.forEach(p => {
          newScores[p] -= winScore / 3;
          scoreChange[p] = -winScore / 3;
          newStats[p].lose += 1;
        });
        newStats[currentTarget].win += 1;
        message = `🀄【自摸捷报】\n🏆 ${positions[currentTarget]}家自摸中${number}码（1+${number}）×3=+${winScore}分\n\n💹 分数变动：\n`;
        break;

      case 'directKong':
        newScores[currentTarget] += 3;
        newScores[player] -= 3;
        scoreChange[currentTarget] = 3;
        scoreChange[player] = -3;
        newStats[currentTarget].kong += 1;
        message = `🎎【直杠交锋】\n🔥 ${positions[currentTarget]}家直杠${positions[player]}家\n\n💸 即时结算：\n`;
        break;

      case 'hiddenKong':
        newScores[currentTarget] += 6;
        scoreChange[currentTarget] = 6;
        otherPlayers.forEach(p => {
          newScores[p] -= 2;
          scoreChange[p] = -2;
        });
        newStats[currentTarget].kong += 1;
        message = `🕶️【暗藏玄机】\n🌑 ${positions[currentTarget]}家发动暗杠\n\n📉 全桌结算：\n`;
        break;

      case 'addedKong':
        newScores[currentTarget] += 3;
        scoreChange[currentTarget] = 3;
        otherPlayers.forEach(p => {
          newScores[p] -= 1;
          scoreChange[p] = -1;
        });
        newStats[currentTarget].kong += 1;
        message = `🎭【补杠风云】\n🛠️ ${positions[currentTarget]}家完成补杠\n\n📌 全局影响：\n`;
        break;

      case 'robbedKong':
        const robbedScore = (1 + (number || 0)) * 3;
        newScores[currentTarget] += robbedScore;
        newScores[player] = Math.max(0, newScores[player] - robbedScore);
        scoreChange[currentTarget] = robbedScore;
        scoreChange[player] = -robbedScore;
        newStats[currentTarget].win += 1;
        newStats[player].lose += 1;
        message = `⚡【惊天逆转】\n💥 ${positions[currentTarget]}家抢杠${positions[player]}家！中${number}码\n\n🔄 分数重算：\n`;
        break;

      case 'kongWin':
        const kongWinScore = (1 + (number || 0)) * 3;
        newScores[currentTarget] += kongWinScore;
        newScores[player] = Math.max(0, newScores[player] - kongWinScore);
        scoreChange[currentTarget] = kongWinScore;
        scoreChange[player] = -kongWinScore;
        newStats[currentTarget].win += 1;
        newStats[player].lose += 1;
        message = `🌀【杠上开花】\n🌸 ${positions[currentTarget]}家直杠${positions[player]}家后杠开！中${number}码\n\n💥 超级结算：\n`;
        break;

      case 'water':
        const waterValue = settings.waterValue;
        newScores[currentTarget] -= waterValue;
        scoreChange[currentTarget] = -waterValue;
        message = `💧【手动抽水】\n🚰 ${positions[currentTarget]}家被抽水${waterValue}分\n\n📌 分数变动：\n`;
        break;
    }

    if (
      this.data.autoWaterEnabled &&
      ['selfWin', 'robbedKong', 'kongWin'].includes(action) &&
      this.data.autoWaterSettings.remainingRounds > 0
    ) {
      const { waterPerRound } = this.data.autoWaterSettings;
      const remaining = this.data.autoWaterSettings.remainingRounds - 1;

      newScores[currentTarget] -= waterPerRound;
      scoreChange[currentTarget] -= waterPerRound;
      
      message += `\n💧【自动抽水】${positions[currentTarget]}被扣${waterPerRound}分（剩余${remaining}局）`;

      this.setData({
        totalAutoWater: this.data.totalAutoWater + waterPerRound,
        'autoWaterSettings.remainingRounds': remaining
      });

      if (remaining === 0) {
        this.setData({ autoWaterEnabled: false });
        wx.showToast({ title: '✅ 自动抽水已完成', icon: 'none' });
      }
    }

    Object.entries(scoreChange).forEach(([p, change]) => {
      message += `${positions[p]} ${change > 0 ? '➕' : '➖'}${Math.abs(change)}（现💰${newScores[p]}）`;
      if (action === 'selfWin') {
        const total = newStats[p].win + newStats[p].lose;
        message += ` 累计胡牌${newStats[p].win}局，胡牌率${total > 0 ? (newStats[p].win / total * 100).toFixed(1) : 0}%`;
      }
      message += '\n';
    });

    this.setData({
      scores: newScores,
      stats: newStats,
      messageLog: [...that.data.messageLog, message],
      currentAction: null,
      currentTarget: null,
      currentPlayer: null
    }, () => {
      that.scrollToBottom();
    });

    this.hideAllModals();
  },

  toggleAutoWater() {
    const enabled = !this.data.autoWaterEnabled;
    const settings = this.data.autoWaterSettings;
    
    if (enabled) {
      settings.remainingRounds = settings.totalRounds;
    }

    this.setData({
      autoWaterEnabled: enabled,
      'autoWaterSettings.remainingRounds': settings.remainingRounds
    });
    
    wx.setStorageSync('autoWaterStatus', enabled);
    wx.showToast({
      title: enabled ? `🔛 自动抽水已开启（剩余${settings.remainingRounds}局）` : '🔴 自动抽水已关闭',
      icon: 'none',
      duration: 1500
    });
  },

  hideAllModals() {
    this.actionModal.hide();
    this.numberModal.hide();
    this.playerModal.hide();
  },

  showSettings() {
    this.setData({ showSettingsModal: true });
  },

  hideSettings() {
    this.setData({ showSettingsModal: false });
  },

  onFontSizeChange(e) {
    const fontSize = e.detail.value;
    this.setData({
      'settings.fontSize': fontSize
    });
  },

  saveSettings(e) {
    const that = this;
    const formData = e.detail.value;

    const newSettings = {
      waterValue: Math.max(0, parseInt(formData.waterValue) || 2),
      baseScore: Math.max(0, parseInt(formData.baseScore) || 100),
      fontSize: parseInt(formData.fontSize) || that.data.settings.fontSize
    };

    that.setData({
      settings: newSettings,
      showSettingsModal: false
    }, () => {
      wx.setStorageSync('gameSettings', newSettings);
      wx.showToast({
        title: '设置已保存',
        icon: 'success',
        duration: 2000
      });
    });
  },

  resetGame() {
    wx.showModal({
      title: '确认重置',
      content: '确定要重置当前游戏吗？所有分数和记录将被清除。',
      success: (res) => {
        if (res.confirm) {
          if (this.data.timer) clearInterval(this.data.timer);
          if (this.data.updateInterval) clearInterval(this.data.updateInterval);
          const baseScore = this.data.settings.baseScore;
          this.setData({
            positionSet: false,
            myPosition: '',
            positions: {},
            scores: {
              east: baseScore,
              south: baseScore,
              west: baseScore,
              north: baseScore
            },
            messageLog: [],
            stats: {
              east: { win: 0, lose: 0, kong: 0 },
              south: { win: 0, lose: 0, kong: 0 },
              west: { win: 0, lose: 0, kong: 0 },
              north: { win: 0, lose: 0, kong: 0 }
            },
            scrollTop: 0,
            autoScroll: true,
            countdown: '04:00:00',
            gameNumber: 1,
            lastSelfWinTime: { east: 0, south: 0, west: 0, north: 0 },
            totalCodes: { east: 0, south: 0, west: 0, north: 0 },
            selfWinDuration: { east: 0, south: 0, west: 0, north: 0 },
            formattedSelfWinTimes: { east: '00:00', south: '00:00', west: '00:00', north: '00:00' },
            totalAutoWater: 0,
            'autoWaterSettings.remainingRounds': this.data.autoWaterSettings.totalRounds
          });
        }
      }
    });
  },

  showAutoWaterSettings() {
    this.setData({ showAutoWaterSettingsModal: true });
  },

  hideAutoWaterSettings() {
    this.setData({ showAutoWaterSettingsModal: false });
  },

  saveAutoWaterSettings(e) {
    const formData = e.detail.value;
    const newSettings = {
      totalRounds: parseInt(formData.totalRounds) || 10,
      waterPerRound: parseInt(formData.waterPerRound) || 2,
      remainingRounds: parseInt(formData.totalRounds) || 10
    };

    this.setData({
      autoWaterSettings: newSettings,
      showAutoWaterSettingsModal: false
    }, () => {
      wx.setStorageSync('autoWaterSettings', newSettings);
      wx.showToast({
        title: '自动抽水设置已保存',
        icon: 'success',
        duration: 2000
      });
    });
  }
});