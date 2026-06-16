/*
 * ========================================
 *  DIY 设计工具 — 空白指甲画布自由创作
 *  功能：涂色 / 贴纸 / 花纹 / 装饰元素 / 导出
 * ========================================
 */

const app = getApp()
const { generateId, toast, saveToAlbum, createShareConfig } = require('../../utils/util')

Page({
  data: {
    // 画布状态
    canvasWidth: 340,
    canvasHeight: 480,
    nailShape: 'oval',      // oval | square | almond | stiletto | coffin
    nailShapes: [
      { id: 'oval', name: '椭圆', emoji: '🥚' },
      { id: 'square', name: '方形', emoji: '◼️' },
      { id: 'almond', name: '杏仁', emoji: '🌰' },
      { id: 'stiletto', name: '尖形', emoji: '💎' },
      { id: 'coffin', name: '芭蕾', emoji: '🩰' },
    ],

    // 底色
    baseColor: '#FFF5F5',

    // 工具模式
    tool: 'paint',          // paint | sticker | pattern | decor | eraser
    tools: [
      { id: 'paint',   icon: '🎨', label: '涂色' },
      { id: 'sticker', icon: '⭐', label: '贴纸' },
      { id: 'pattern', icon: '🔷', label: '花纹' },
      { id: 'decor',   icon: '💎', label: '装饰' },
      { id: 'eraser',  icon: '🧹', label: '擦除' },
    ],

    // 颜色选择
    currentColor: '#FF6B8A',
    recentColors: ['#FF6B8A', '#A855F7', '#FFD93D', '#84CC9A'],
    colorPalettes: [
      {
        name: '甜美粉',
        colors: ['#FF6B8A', '#FF3355', '#FFB3C6', '#FFD9E2', '#FF4D6A', '#FF8A9E', '#FFC2D1', '#FFE5EC'],
      },
      {
        name: '梦幻紫',
        colors: ['#A855F7', '#7C3AED', '#C084FC', '#E0C3FC', '#9333EA', '#C084FC', '#DDD6FE', '#F3E8FF'],
      },
      {
        name: '活力系',
        colors: ['#FFD93D', '#FF9500', '#FFE97F', '#FFB800', '#F59E0B', '#FCD34D', '#FEF3C7', '#FFFBEB'],
      },
      {
        name: '自然绿',
        colors: ['#84CC9A', '#60B87A', '#BBF7D0', '#D9F99D', '#34D399', '#6EE7B7', '#A7F3D0', '#ECFDF5'],
      },
      {
        name: '高级灰',
        colors: ['#1C1C1E', '#2D2D3F', '#636366', '#AEAEB2', '#E5E5EA', '#F2F2F7', '#FAFAFA', '#FFFFFF'],
      },
      {
        name: '闪亮金属',
        colors: ['#FFD700', '#C0C0C0', '#E8B4B8', '#D4AF37', '#B8860B', '#CFB53B', '#F5DEB3', '#FFFACD'],
      },
    ],

    // 贴纸库
    stickers: [
      { id: 'star',    emoji: '⭐', name: '星星' },
      { id: 'heart',   emoji: '❤️', name: '爱心' },
      { id: 'flower',  emoji: '🌸', name: '花朵' },
      { id: 'diamond', emoji: '💎', name: '钻石' },
      { id: 'butterfly', emoji: '🦋', name: '蝴蝶' },
      { id: 'moon',    emoji: '🌙', name: '月亮' },
      { id: 'sparkle', emoji: '✨', name: '闪光' },
      { id: 'cherry',  emoji: '🍒', name: '樱桃' },
      { id: 'rainbow', emoji: '🌈', name: '彩虹' },
      { id: 'crown',   emoji: '👑', name: '皇冠' },
      { id: 'pearl',   emoji: '⚪', name: '珍珠' },
      { id: 'ribbon',  emoji: '🎀', name: '蝴蝶结' },
    ],

    // 花纹库
    patterns: [
      { id: 'dots',     name: '圆点',   icon: '🔵' },
      { id: 'stripes',  name: '条纹',   icon: '📏' },
      { id: 'marble',   name: '大理石',  icon: '🪨' },
      { id: 'gradient', name: '渐变',    icon: '🌈' },
      { id: 'checker',  name: '棋盘格',  icon: '🏁' },
      { id: 'wave',     name: '波浪',    icon: '🌊' },
      { id: 'crack',    name: '裂纹',    icon: '⚡' },
      { id: 'glitter',  name: '闪粉',    icon: '✨' },
    ],

    // 装饰元素
    decors: [
      { id: 'gem',     emoji: '💠', name: '宝石' },
      { id: 'chain',   emoji: '⛓️', name: '链条' },
      { id: 'ring',    emoji: '💍', name: '戒指' },
      { id: 'lace',    emoji: '🕸️', name: '蕾丝' },
      { id: 'bead',    emoji: '📿', name: '串珠' },
      { id: 'foil',    emoji: '🔶', name: '金箔' },
      { id: 'feather', emoji: '🪶', name: '羽毛' },
      { id: 'leaf',    emoji: '🍃', name: '叶片' },
    ],

    // 放置在画布上的元素
    elements: [],

    // 历史记录（撤销用）
    history: [],
    maxHistory: 20,

    // UI 状态
    showExportOptions: false,
    hasDraft: false,
    designName: '',
  },

  onLoad() {
    // 加载草稿
    const draft = wx.getStorageSync('diy_draft')
    if (draft) {
      this.setData({
        baseColor: draft.baseColor || '#FFF5F5',
        nailShape: draft.nailShape || 'oval',
        elements: draft.elements || [],
        hasDraft: true,
      })
    }
  },

  /**
   * 保存草稿
   */
  saveDraft() {
    const { baseColor, nailShape, elements } = this.data
    wx.setStorageSync('diy_draft', { baseColor, nailShape, elements })
  },

  /**
   * 切换工具
   */
  onToolChange(e) {
    const { tool } = e.currentTarget.dataset
    this.setData({ tool })
  },

  /**
   * 选择底色
   */
  onBaseColorPick(e) {
    const { color } = e.currentTarget.dataset
    this.saveState()
    this.setData({ baseColor: color, hasDraft: true })
  },

  /**
   * 选择当前色
   */
  onColorPick(e) {
    const { color } = e.currentTarget.dataset
    // 更新最近颜色
    let recent = [color, ...this.data.recentColors.filter((c) => c !== color)].slice(0, 6)
    this.setData({ currentColor: color, recentColors: recent })
  },

  /**
   * 选择指甲形状
   */
  onShapeChange(e) {
    const { shape } = e.currentTarget.dataset
    this.setData({ nailShape: shape, hasDraft: true })
  },

  /**
   * 添加贴纸
   */
  onAddSticker(e) {
    const { id, emoji } = e.currentTarget.dataset
    this.saveState()
    const elements = [...this.data.elements]
    elements.push({
      id: generateId(),
      type: 'sticker',
      content: emoji,
      stickerId: id,
      x: 170 + Math.random() * 40,
      y: 200 + Math.random() * 60,
      scale: 1,
      rotate: 0,
    })
    this.setData({ elements, hasDraft: true })
    this.saveDraft()
  },

  /**
   * 添加花纹
   */
  onAddPattern(e) {
    const { id } = e.currentTarget.dataset
    this.saveState()
    const elements = [...this.data.elements]
    elements.push({
      id: generateId(),
      type: 'pattern',
      patternId: id,
      color: this.data.currentColor,
      scale: 1,
    })
    this.setData({ elements, hasDraft: true })
    this.saveDraft()
  },

  /**
   * 添加装饰
   */
  onAddDecor(e) {
    const { id, emoji } = e.currentTarget.dataset
    this.saveState()
    const elements = [...this.data.elements]
    elements.push({
      id: generateId(),
      type: 'decor',
      content: emoji,
      decorId: id,
      x: 170 + Math.random() * 30,
      y: 250 + Math.random() * 40,
      scale: 1,
    })
    this.setData({ elements, hasDraft: true })
    this.saveDraft()
  },

  /**
   * 清除画布
   */
  onClearCanvas() {
    wx.showModal({
      title: '清除确认',
      content: '确定要清空画布吗？此操作不可撤销。',
      success: (res) => {
        if (res.confirm) {
          this.saveState()
          this.setData({ elements: [], baseColor: '#FFF5F5', hasDraft: false })
          wx.removeStorageSync('diy_draft')
        }
      },
    })
  },

  /**
   * 撤销
   */
  onUndo() {
    const { history } = this.data
    if (history.length === 0) return

    const prevState = history[history.length - 1]
    this.setData({
      elements: prevState.elements,
      baseColor: prevState.baseColor,
      history: history.slice(0, -1),
    })
  },

  /**
   * 保存当前状态到历史
   */
  saveState() {
    const { elements, baseColor, history } = this.data
    const state = { elements: [...elements], baseColor }
    history.push(state)
    if (history.length > this.data.maxHistory) {
      history.shift()
    }
    this.setData({ history })
  },

  /**
   * 导出设计
   */
  onExport() {
    this.setData({ showExportOptions: true })
  },

  onCloseExport() {
    this.setData({ showExportOptions: false })
  },

  async onSaveAsImage() {
    toast.info('请截屏保存当前设计')
    // v2: 使用 canvas 导出高清图
  },

  onSaveDesign() {
    const { designName } = this.data
    const name = designName || `我的设计 ${new Date().toLocaleDateString()}`
    // TODO: 保存到云数据库
    // db.collection('user_designs').add({ data: {...} })
    toast.success('设计已保存')
    this.setData({ showExportOptions: false })
  },

  onDesignNameInput(e) {
    this.setData({ designName: e.detail.value })
  },

  onShareAppMessage() {
    return createShareConfig('看看我在美甲DIY设计的作品！')
  },
})
