/*
 * ========================================
 *  款式图库 — 浏览、筛选、搜索、收藏
 *  使用瀑布流布局展示美甲款式
 * ========================================
 */

const { generateMockStyles, categories } = require('../../utils/mock')
const { debounce, toast } = require('../../utils/util')

Page({
  data: {
    // Tab 切换
    activeTab: 'all',      // all | hot | new | following

    // 分类
    categories: categories,
    activeCategory: 'all',

    // 排序
    sortBy: 'latest',      // latest | popular
    sortOptions: [
      { id: 'latest', label: '最新' },
      { id: 'popular', label: '最热' },
    ],

    // 款式列表
    styles: [],
    leftColumn: [],
    rightColumn: [],
    loading: false,
    hasMore: true,
    page: 1,

    // 搜索
    searchValue: '',
    showSearch: false,
  },

  onLoad(options) {
    // 从首页跳转带参数
    if (options.tab) {
      this.setData({ activeTab: options.tab })
    }
    this.loadStyles()
  },

  onPullDownRefresh() {
    this.setData({ page: 1, leftColumn: [], rightColumn: [], hasMore: true })
    this.loadStyles().then(() => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadStyles()
    }
  },

  /**
   * 加载款式数据
   */
  async loadStyles() {
    if (this.data.loading) return
    this.setData({ loading: true })

    try {
      await new Promise((r) => setTimeout(r, 400))

      const { page, activeCategory } = this.data
      let allStyles = generateMockStyles(40)

      // 按分类过滤
      if (activeCategory !== 'all') {
        allStyles = allStyles.filter((s) => s.category === activeCategory)
      }

      // 排序
      if (this.data.sortBy === 'popular') {
        allStyles.sort((a, b) => b.likes - a.likes)
      }

      const pageSize = 20
      const start = (page - 1) * pageSize
      const batch = allStyles.slice(start, start + pageSize)

      // 瀑布流分配（模拟高度差）
      const { leftColumn, rightColumn } = this.data
      const newLeft = [...(page === 1 ? [] : leftColumn)]
      const newRight = [...(page === 1 ? [] : rightColumn)]

      batch.forEach((style, i) => {
        if (i % 2 === 0) {
          newLeft.push({ ...style })
        } else {
          newRight.push({ ...style })
        }
      })

      this.setData({
        leftColumn: newLeft,
        rightColumn: newRight,
        hasMore: start + pageSize < allStyles.length,
        page: page + 1,
        loading: false,
      })
    } catch (err) {
      this.setData({ loading: false })
      toast.error('加载失败')
    }
  },

  /**
   * Tab 切换
   */
  onTabChange(e) {
    const { tab } = e.currentTarget.dataset
    this.setData({
      activeTab: tab,
      leftColumn: [],
      rightColumn: [],
      page: 1,
      hasMore: true,
    })
    this.loadStyles()
  },

  /**
   * 分类切换
   */
  onCategoryChange(e) {
    const { category } = e.currentTarget.dataset
    this.setData({
      activeCategory: category,
      leftColumn: [],
      rightColumn: [],
      page: 1,
      hasMore: true,
    })
    this.loadStyles()
  },

  /**
   * 排序切换
   */
  onSortChange(e) {
    const { sort } = e.currentTarget.dataset
    this.setData({
      sortBy: sort,
      leftColumn: [],
      rightColumn: [],
      page: 1,
      hasMore: true,
    })
    this.loadStyles()
  },

  /**
   * 搜索
   */
  onSearchToggle() {
    this.setData({ showSearch: !this.data.showSearch })
  },

  onSearchInput: debounce(function (e) {
    const value = e.detail.value.trim()
    this.setData({ searchValue: value })

    if (!value) {
      this.setData({ page: 1, leftColumn: [], rightColumn: [], hasMore: true })
      this.loadStyles()
      return
    }

    // 本地搜索
    const allStyles = generateMockStyles(40)
    const filtered = allStyles.filter(
      (s) => s.name.includes(value) || s.tags.some((t) => t.includes(value))
    )
    const left = []
    const right = []
    filtered.forEach((s, i) => {
      if (i % 2 === 0) left.push({ ...s })
      else right.push({ ...s })
    })

    this.setData({ leftColumn: left, rightColumn: right, hasMore: false })
  }, 300),

  /**
   * 款式详情
   */
  onStyleTap(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/style-detail/style-detail?id=${id}` })
  },

  /**
   * 收藏
   */
  onFavorite(e) {
    const { id } = e.currentTarget.dataset
    // 切换收藏状态（本地模拟）
    const updateColumn = (col) =>
      col.map((s) => (s._id === id ? { ...s, favorited: !s.favorited } : s))

    this.setData({
      leftColumn: updateColumn(this.data.leftColumn),
      rightColumn: updateColumn(this.data.rightColumn),
    })

    const target = [...this.data.leftColumn, ...this.data.rightColumn].find((s) => s._id === id)
    if (target) {
      toast.success(target.favorited ? '已收藏' : '已取消收藏')
    }
  },

  onShareAppMessage() {
    return {
      title: '美甲DIY款式图库 - 发现你的专属风格',
      path: '/pages/gallery/gallery',
    }
  },
})
