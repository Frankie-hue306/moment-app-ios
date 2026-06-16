/*
 * ========================================
 *  美甲 DIY 小程序 — 应用入口
 * ========================================
 */

App({
  /**
   * 应用启动
   */
  onLaunch() {
    // 初始化云开发环境（无云环境时自动降级为本地Mock模式）
    if (wx.cloud) {
      try {
        wx.cloud.init({
          env: 'nail-art-0g6k9',      // TODO: 替换为你的云环境ID
          traceUser: true,
        })
        this.globalData.cloudReady = true
        console.log('[Cloud] 云开发初始化成功')
      } catch (e) {
        this.globalData.cloudReady = false
        console.warn('[Cloud] 云开发未配置，使用本地Mock数据运行')
      }
    } else {
      this.globalData.cloudReady = false
      console.warn('[Cloud] 当前环境不支持云开发，使用本地Mock数据运行')
    }

    // 获取系统信息
    this.getSystemInfo()

    // 获取用户登录态
    this.getUserAuth()

    // 预加载款式数据缓存
    this.preloadCache()
  },

  /**
   * 获取系统信息
   */
  getSystemInfo() {
    try {
      const sysInfo = wx.getSystemInfoSync()
      this.globalData.systemInfo = sysInfo
      this.globalData.statusBarHeight = sysInfo.statusBarHeight
      this.globalData.screenWidth = sysInfo.screenWidth
      this.globalData.screenHeight = sysInfo.screenHeight
      this.globalData.isIOS = sysInfo.platform === 'ios'
      this.globalData.safeAreaBottom = sysInfo.safeArea
        ? (sysInfo.screenHeight - sysInfo.safeArea.bottom)
        : 0
    } catch (e) {
      console.error('[System] 获取系统信息失败', e)
    }
  },

  /**
   * 用户登录 / 获取 openid
   */
  async getUserAuth() {
    const cached = wx.getStorageSync('userInfo')
    if (cached) {
      this.globalData.userInfo = cached
      this.globalData.isLogin = true
      return
    }

    try {
      if (!wx.cloud) return

      const res = await wx.cloud.callFunction({
        name: 'login',
        data: {},
      })

      if (res.result && res.result.openid) {
        this.globalData.openid = res.result.openid
        this.globalData.isLogin = true
        console.log('[Auth] 登录成功, openid:', res.result.openid.substring(0, 8) + '...')
      }
    } catch (e) {
      console.error('[Auth] 登录失败，使用游客模式', e)
    }
  },

  /**
   * 预加载缓存数据（降低冷启动体感等待）
   */
  preloadCache() {
    const cachedStyles = wx.getStorageSync('hotStyles')
    if (cachedStyles) {
      this.globalData.hotStylesCache = cachedStyles
    }
  },

  /**
   * 全局共享数据
   */
  globalData: {
    // 用户信息
    userInfo: null,
    openid: '',
    isLogin: false,

    // 云开发状态
    cloudReady: false,

    // 系统信息
    systemInfo: null,
    statusBarHeight: 0,
    screenWidth: 375,
    screenHeight: 667,
    isIOS: false,
    safeAreaBottom: 0,

    // 缓存
    hotStylesCache: [],

    // 试戴模式状态
    tryonState: {
      handImagePath: '',
      currentStyle: null,
    },

    // 图标占位（开发阶段用 emoji/text 替代图片）
    tabBarIcons: {
      home: '🏠',
      tryon: '✨',
      diy: '🎨',
      gallery: '📸',
      mine: '👤',
    },
  },

  /**
   * 应用切到后台
   */
  onHide() {
    // 自动保存草稿
    const diyPage = this._diyPageInstance
    if (diyPage && diyPage.data.hasDraft) {
      diyPage.saveDraft()
      console.log('[DIY] 已自动保存草稿')
    }
  },

  /**
   * 全局错误处理
   */
  onError(err) {
    console.error('[App Error]', err)
  },
})
