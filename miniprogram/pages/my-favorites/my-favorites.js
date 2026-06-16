/*
 * ========================================
 *  我的收藏页
 *  展示用户收藏的美甲款式
 * ========================================
 */

const { generateMockStyles } = require('../../utils/mock')
const { toast, confirm } = require('../../utils/util')

Page({
  data: {
    favorites: [],
    loading: true,
    isEmpty: false,
    editMode: false,
    selectedIds: [],
  },

  onLoad() {
    this.loadFavorites()
  },

  onShow() {
    this.loadFavorites()
  },

  onPullDownRefresh() {
    this.loadFavorites().then(() => wx.stopPullDownRefresh())
  },

  /**
   * 加载收藏列表
   */
  async loadFavorites() {
    this.setData({ loading: true })

    try {
      // TODO: 从云数据库加载 user_favorites
      const cached = wx.getStorageSync('myFavorites') || []

      // 补充完整数据
      const mockData = generateMockStyles(20)
      const favorites = cached.map((f) => {
        const full = mockData.find((s) => s._id === f._id)
        return full ? { ...full, favorited: true, favoritedAt: f.favoritedAt } : f
      })

      this.setData({
        favorites,
        isEmpty: favorites.length === 0,
        loading: false,
      })
    } catch (err) {
      this.setData({ loading: false })
      toast.error('加载失败')
    }
  },

  /**
   * 浏览图库
   */
  onBrowseGallery() {
    wx.switchTab({ url: '/pages/gallery/gallery' })
  },

  /**
   * 查看详情
   */
  onViewDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/style-detail/style-detail?id=${id}` })
  },

  /**
   * 切换编辑模式
   */
  onToggleEdit() {
    this.setData({
      editMode: !this.data.editMode,
      selectedIds: [],
    })
  },

  /**
   * 选择/取消
   */
  onSelectItem(e) {
    const { id } = e.currentTarget.dataset
    let selected = [...this.data.selectedIds]
    const idx = selected.indexOf(id)
    if (idx > -1) {
      selected.splice(idx, 1)
    } else {
      selected.push(id)
    }
    this.setData({ selectedIds: selected })
  },

  /**
   * 取消收藏选中
   */
  async onRemoveSelected() {
    if (this.data.selectedIds.length === 0) {
      return toast.info('请先选择要取消的收藏')
    }

    const ok = await confirm(`确定取消 ${this.data.selectedIds.length} 个收藏？`)
    if (!ok) return

    let cached = wx.getStorageSync('myFavorites') || []
    cached = cached.filter((f) => !this.data.selectedIds.includes(f._id))
    wx.setStorageSync('myFavorites', cached)

    const favorites = this.data.favorites.filter(
      (f) => !this.data.selectedIds.includes(f._id)
    )

    this.setData({
      favorites,
      isEmpty: favorites.length === 0,
      editMode: false,
      selectedIds: [],
    })
    toast.success('已取消收藏')
  },

  /**
   * 快速取消收藏
   */
  onQuickUnfavorite(e) {
    const { id } = e.currentTarget.dataset
    let cached = wx.getStorageSync('myFavorites') || []
    cached = cached.filter((f) => f._id !== id)
    wx.setStorageSync('myFavorites', cached)

    const favorites = this.data.favorites.filter((f) => f._id !== id)
    this.setData({
      favorites,
      isEmpty: favorites.length === 0,
    })
    toast.success('已取消收藏')
  },
})
