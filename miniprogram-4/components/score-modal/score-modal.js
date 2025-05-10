// components/score-modal/score-modal.js
Component({
    properties: {
      type: {
        type: String,
        value: 'action' // action | number | player
      }
    },
  
    data: {
      show: false,
      title: '',
      actions: [],
      numbers: [],
      players: []
    },
  
    methods: {
      show(options) {
        this.setData({
          show: true,
          title: options.title,
          ...options
        });
      },
  
      hide() {
        this.setData({ show: false });
      },
  
      onConfirm(e) {
        this.triggerEvent('confirm', e.currentTarget.dataset.value);
        this.hide();
      },
  
      onCancel() {
        this.triggerEvent('cancel');
        this.hide();
      },
  
      stopPropagation() {
        // 阻止事件冒泡
      }
    }
  });