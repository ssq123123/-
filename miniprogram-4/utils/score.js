module.exports = {
    calculateSelfDraw: function (num) {
      return (num + 1) * 3 + 3;
    },
  
    calculateKong: function (type, player) {
      if (type === '直杠') {
        return player === '东' ? 3 : -3;
      }
      if (type === '暗杠') {
        return player === '东' ? 6 : -2;
      }
      if (type === '补杠') {
        return player === '东' ? 3 : -1;
      }
      if (type === '抢杠') {
        return player === '西' ? 18 : -15;
      }
      if (type === '杠开') {
        return player === '东' ? 21 : -21;
      }
      return 0;
    }
  }
  