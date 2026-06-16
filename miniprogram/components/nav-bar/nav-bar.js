/*
 * ========================================
 *  自定义导航栏组件
 *  支持标题、返回按钮、透明模式
 * ========================================
 */

const app = getApp()

Component({
  properties: {
    // 标题文字
    title: {
      type: String,
      value: '美甲DIY',
    },
    // 是否显示返回按钮
    showBack: {
      type: Boolean,
      value: false,
    },
    // 是否为透明背景
    transparent: {
      type: Boolean,
      value: false,
    },
    // 自定义背景色
    bgColor: {
      type: String,
      value: '#FFFFFF',
    },
    // 文字颜色：black | white
    textColor: {
      type: String,
      value: 'black',
    },
  },

  data: {
    statusBarHeight: 0,
    navbarHeight: 88,
  },

  lifetimes: {
    attached() {
      const { statusBarHeight } = app.globalData
      this.setData({
        statusBarHeight,
        navbarHeight: statusBarHeight + 44,
      })
    },
  },

  methods: {
    /**
     * 返回上一页
     */
    onBack() {
      if (this.data.showBack) {
        wx.navigateBack({ delta: 1 })
      }
    },
  },
})
