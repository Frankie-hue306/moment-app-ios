/*
 * ========================================
 *  首页 — 发现美甲灵感
 *  模块：Hero Banner / 快捷入口 / 热门款式 / 分类浏览
 * ========================================
 */

const app = getApp()
const { generateMockStyles, categories } = require('../../utils/mock')
const { debounce } = require('../../utils/util')

Page({
  data: {
    // 状态栏适配
    statusBarHeight: 0,
    navbarHeight: 88,

    // Banner
    banners: [
      {
        id: 1,
        title: '夏日冰透美甲',
        subtitle: '清凉一夏 · 精选20款',
        gradient: 'linear-gradient(135deg, #FFB3C6 0%, #C084FC 100%)',
        emoji: '💅',
      },
      {
        id: 2,
        title: '法式新经典',
        subtitle: '简约不简单 · 日常百搭',
        gradient: 'linear-gradient(135deg, #FFE0E0 0%, #FFFAFA 100%)',
        emoji: '🤍',
      },
      {
        id: 3,
        title: '闪亮派对季',
        subtitle: '钻石光芒 · 闪耀全场',
        gradient: 'linear-gradient(135deg, #FFD93D 0%, #FF9500 100%)',
        emoji: '✨',
      },
    ],
    bannerCurrent: 0,

    // 快捷入口
    quickEntries: [
      { id: 'tryon', label: '虚拟试戴', icon: '✨', color: '#FF6B8A', path: '/pages/tryon/tryon' },
      { id: 'diy', label: '自由创作', icon: '🎨', color: '#A855F7', path: '/pages/diy/diy' },
      { id: 'gallery', label: '款式图库', icon: '📸', color: '#FFD93D', path: '/pages/gallery/gallery' },
      { id: 'trend', label: '热门排行', icon: '🔥', color: '#FF9500', path: '/pages/gallery/gallery?tab=hot' },
    ],

    // 分类标签
    categories: categories.slice(1),
    activeCategory: '',

    // 款式列表
    styles: [],
    hotStyles: [],
    loading: false,
    hasMore: true,
    page: 1,

    // 搜索
    searchValue: '',
    searchFocused: false,
    hotKeywords: ['渐变', '法式', '樱花', '闪粉', '极简', '花卉'],
    searchResults: [],
    showSearchResults: false,
  },

  onLoad() {
    const { statusBarHeight } = app.globalData
    this.setData({
      statusBarHeight,
      navbarHeight: statusBarHeight + 44,
    })
    this.loadHotStyles()
    this.loadStyles()
  },

  onPullDownRefresh() {
    this.setData({ page: 1, styles: [], hasMore: true })
    this.loadHotStyles()
    this.loadStyles().then(() => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadStyles()
    }
  },

  /**
   * 加载热门款式
   */
  loadHotStyles() {
    const hotStyles = generateMockStyles(8).map((s, i) => ({ ...s, isHot: true }))
    this.setData({ hotStyles })
    wx.setStorageSync('hotStyles', hotStyles)
  },

  /**
   * 加载款式列表（模拟分页）
   */
  async loadStyles() {
    if (this.data.loading) return
    this.setData({ loading: true })

    try {
      await new Promise((r) => setTimeout(r, 400))

      const { page, activeCategory } = this.data
      const allStyles = generateMockStyles(30)
      const filtered = activeCategory
        ? allStyles.filter((s) => s.category === activeCategory)
        : allStyles

      const pageSize = 10
      const start = (page - 1) * pageSize
      const batch = filtered.slice(start, start + pageSize)

      this.setData({
        styles: page === 1 ? batch : [...this.data.styles, ...batch],
        hasMore: start + pageSize < filtered.length,
        page: page + 1,
        loading: false,
      })
    } catch (err) {
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  /**
   * Banner 切换
   */
  onBannerChange(e) {
    this.setData({ bannerCurrent: e.detail.current })
  },

  /**
   * Banner 点击
   */
  onBannerTap() {
    wx.switchTab({ url: '/pages/gallery/gallery' })
  },

  /**
   * 快捷入口点击
   */
  onQuickEntry(e) {
    const { path } = e.currentTarget.dataset
    wx.switchTab({ url: path.split('?')[0] })
  },

  /**
   * 分类切换
   */
  onCategoryTap(e) {
    const { category } = e.currentTarget.dataset
    const newCat = this.data.activeCategory === category ? '' : category
    this.setData({ activeCategory: newCat, styles: [], page: 1, hasMore: true })
    this.loadStyles()
  },

  /**
   * 款式卡片点击
   */
  onStyleTap(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/style-detail/style-detail?id=${id}` })
  },

  /**
   * 搜索（防抖）
   */
  onSearchInput: debounce(function (e) {
    const value = e.detail.value.trim()
    if (!value) {
      this.setData({ searchResults: [], showSearchResults: false })
      return
    }
    const allStyles = generateMockStyles(30)
    const results = allStyles.filter(
      (s) => s.name.includes(value) || s.tags.some((t) => t.includes(value))
    )
    this.setData({ searchResults: results.slice(0, 8), showSearchResults: true })
  }, 300),

  onSearchFocus() {
    this.setData({ searchFocused: true })
  },

  onSearchBlur() {
    setTimeout(() => {
      this.setData({ searchFocused: false, showSearchResults: false })
    }, 200)
  },

  onKeywordTap(e) {
    const { keyword } = e.currentTarget.dataset
    this.setData({ searchValue: keyword })
    this.onSearchInput({ detail: { value: keyword } })
  },

  onShareAppMessage() {
    return {
      title: '美甲DIY - 发现你的专属美甲灵感',
      path: '/pages/index/index',
    }
  },
})
