/*
 * ========================================
 *  款式详情页
 *  展示款式信息、配色、难度、相似推荐
 * ========================================
 */

const { generateMockStyles } = require('../../utils/mock')
const { toast, previewImage, createShareConfig } = require('../../utils/util')

Page({
  data: {
    styleId: '',
    style: null,
    isFavorited: false,

    // 相似推荐
    similarStyles: [],
  },

  onLoad(options) {
    const { id } = options
    this.setData({ styleId: id })
    this.loadStyleDetail(id)
    this.loadSimilar()
    this.checkFavorite(id)
  },

  /**
   * 加载款式详情
   */
  loadStyleDetail(id) {
    // TODO: 替换为云数据库查询
    // db.collection('nail_styles').doc(id).get()
    const allStyles = generateMockStyles(22)
    const style = allStyles.find((s) => s._id === id) || allStyles[0]

    // 补充详情字段 — 扩展颜色用于 Hero 色板展示
    style.detailColors = [...style.colors, ...style.colors.slice(0, 1)]
    style.steps = style.difficulty === 'easy' ? 3 : style.difficulty === 'medium' ? 4 : 5
    style.timeEstimate = style.difficulty === 'easy' ? '30分钟' : style.difficulty === 'medium' ? '45分钟' : '60分钟'

    this.setData({ style })
  },

  /**
   * 加载相似推荐
   */
  loadSimilar() {
    const similar = generateMockStyles(6)
    this.setData({ similarStyles: similar })
  },

  /**
   * 检查收藏状态
   */
  checkFavorite(id) {
    const favorites = wx.getStorageSync('myFavorites') || []
    const isFavorited = favorites.some((f) => f._id === id)
    this.setData({ isFavorited })
  },

  /**
   * 收藏/取消收藏
   */
  onToggleFavorite() {
    const { styleId, style, isFavorited } = this.data
    let favorites = wx.getStorageSync('myFavorites') || []

    if (isFavorited) {
      favorites = favorites.filter((f) => f._id !== styleId)
      toast.success('已取消收藏')
    } else {
      favorites.push({
        _id: styleId,
        name: style.name,
        emoji: style.emoji,
        primaryColor: style.primaryColor,
        colors: style.colors,
        tags: style.tags,
        favoritedAt: new Date().toISOString(),
      })
      toast.success('已加入收藏')
    }

    wx.setStorageSync('myFavorites', favorites)
    this.setData({ isFavorited: !isFavorited })
  },

  /**
   * 开始试戴（跳转试戴页）
   */
  onTryOn() {
    const { style } = this.data
    wx.switchTab({ url: '/pages/tryon/tryon' })
    // TODO: 传递当前款式信息到试戴页
  },

  /**
   * 跳转DIY（以此为灵感）
   */
  onStartDIY() {
    wx.switchTab({ url: '/pages/diy/diy' })
  },

  /**
   * 相似款式点击
   */
  onSimilarTap(e) {
    const { id } = e.currentTarget.dataset
    wx.redirectTo({ url: `/pages/style-detail/style-detail?id=${id}` })
  },

  /**
   * 预览大图
   */
  onPreviewImage() {
    previewImage('')
    toast.info('图片加载中（开发阶段演示）')
  },

  onShareAppMessage() {
    const { style } = this.data
    return createShareConfig(
      style ? `美甲DIY - ${style.name}` : '美甲DIY款式详情',
      `/pages/style-detail/style-detail?id=${this.data.styleId}`
    )
  },
})
