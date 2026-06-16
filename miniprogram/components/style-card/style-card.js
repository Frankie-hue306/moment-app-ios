/*
 * ========================================
 *  款式卡片组件
 *  可复用的款式展示卡片，支持多种模式
 * ========================================
 */

Component({
  properties: {
    // 款式数据
    style: {
      type: Object,
      value: {},
    },
    // 卡片模式：grid | list | compact
    mode: {
      type: String,
      value: 'grid',
    },
    // 是否显示收藏按钮
    showFavorite: {
      type: Boolean,
      value: true,
    },
    // 是否已收藏
    favorited: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    // 组件内部数据
  },

  methods: {
    /**
     * 卡片点击
     */
    onTap() {
      this.triggerEvent('tap', { style: this.data.style })
    },

    /**
     * 收藏按钮点击（阻止事件冒泡）
     */
    onFavorite() {
      this.triggerEvent('favorite', {
        style: this.data.style,
        favorited: !this.data.favorited,
      })
    },
  },
})
