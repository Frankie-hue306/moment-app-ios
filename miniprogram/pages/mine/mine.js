/*
 * ========================================
 *  我的页 — 个人中心
 *  模块：用户信息 / 统计卡片 / 功能入口 / 设置
 * ========================================
 */

const app = getApp()
const { toast } = require('../../utils/util')

Page({
  data: {
    statusBarHeight: 0,
    navbarHeight: 88,

    // 用户信息
    userInfo: null,
    isLogin: false,

    // 统计数据
    stats: {
      designs: 0,
      favorites: 0,
      tryons: 0,
    },

    // 功能入口
    menuGroups: [
      {
        title: '我的创作',
        items: [
          { id: 'designs', icon: '🎨', label: '我的设计', desc: '查看已保存的设计作品', path: '/pages/my-designs/my-designs' },
          { id: 'favorites', icon: '❤️', label: '我的收藏', desc: '收藏的款式和灵感', path: '/pages/my-favorites/my-favorites' },
          { id: 'tryons', icon: '✨', label: '试戴记录', desc: '试戴历史和对比', path: '' },
        ],
      },
      {
        title: '其他',
        items: [
          { id: 'share', icon: '📤', label: '分享给朋友', desc: '', openType: 'share' },
          { id: 'feedback', icon: '💬', label: '意见反馈', desc: '', path: '' },
          { id: 'about', icon: 'ℹ️', label: '关于美甲DIY', desc: 'v1.0.0', path: '' },
        ],
      },
    ],
  },

  onLoad() {
    const { statusBarHeight, userInfo, isLogin } = app.globalData
    this.setData({
      statusBarHeight,
      navbarHeight: statusBarHeight + 44,
      userInfo,
      isLogin,
    })
    this.loadStats()
  },

  onShow() {
    // 每次显示时刷新统计数据
    this.loadStats()
  },

  /**
   * 加载统计数据
   */
  loadStats() {
    // TODO: 从云数据库加载
    // 开发阶段从本地缓存读取
    const designs = wx.getStorageSync('myDesigns') || []
    const favorites = wx.getStorageSync('myFavorites') || []
    this.setData({
      stats: {
        designs: designs.length,
        favorites: favorites.length,
        tryons: 3, // 模拟
      },
    })
  },

  /**
   * 获取用户信息（微信头像昵称）
   */
  onGetUserInfo(e) {
    if (e.detail.userInfo) {
      const userInfo = e.detail.userInfo
      this.setData({ userInfo, isLogin: true })
      wx.setStorageSync('userInfo', userInfo)
      app.globalData.userInfo = userInfo
      app.globalData.isLogin = true
    }
  },

  /**
   * 菜单项点击
   */
  onMenuTap(e) {
    const { path, id } = e.currentTarget.dataset
    if (!path) {
      if (id === 'tryons') {
        toast.info('试戴记录功能开发中')
      } else if (id === 'feedback') {
        toast.info('感谢反馈！请联系客服')
      } else if (id === 'about') {
        wx.showModal({
          title: '关于美甲DIY',
          content: '版本 1.0.0\n一款专注于美甲设计的小程序\n支持虚拟试戴、DIY创作、款式浏览',
          showCancel: false,
        })
      }
      return
    }
    wx.navigateTo({ url: path })
  },

  /**
   * 获取手机号（微信开放能力）
   */
  onGetPhoneNumber(e) {
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      // TODO: 将加密数据传给云函数解密
      toast.success('手机号已绑定')
    }
  },

  onShareAppMessage() {
    return {
      title: '美甲DIY - 超好用的小程序！',
      path: '/pages/index/index',
    }
  },
})
