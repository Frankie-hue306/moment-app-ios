/*
 * ========================================
 *  虚拟试戴 — 上传手部照片，叠加指甲模板预览效果
 *  v1 版本：2D 叠加方式，手动拖拽/缩放
 * ========================================
 */

const app = getApp()
const { generateMockStyles } = require('../../utils/mock')
const { toast, saveToAlbum, createShareConfig } = require('../../utils/util')

Page({
  data: {
    // 步骤：1=上传照片 2=选择款式 3=调整位置 4=预览结果
    step: 1,
    steps: [
      { num: 1, label: '上传照片' },
      { num: 2, label: '选款式' },
      { num: 3, label: '调整位置' },
      { num: 4, label: '完成' },
    ],

    // 手部照片
    handImage: '',
    handImageWidth: 0,
    handImageHeight: 0,

    // 指甲覆盖层配置（5个指甲位）
    nails: [
      { id: 'thumb',  name: '拇指', x: 0, y: 0, scale: 1, rotate: 0, color: '#FF6B8A', visible: true },
      { id: 'index',  name: '食指', x: 0, y: 0, scale: 1, rotate: 0, color: '#FF6B8A', visible: true },
      { id: 'middle', name: '中指', x: 0, y: 0, scale: 1, rotate: 0, color: '#FF6B8A', visible: true },
      { id: 'ring',   name: '无名指', x: 0, y: 0, scale: 1, rotate: 0, color: '#FF6B8A', visible: true },
      { id: 'pinky',  name: '小指', x: 0, y: 0, scale: 1, rotate: 0, color: '#FF6B8A', visible: true },
    ],
    activeNailIndex: 0,

    // 款式选择
    currentStyle: null,
    styleList: [],
    selectedColor: '#FF6B8A',
    colorPalette: [
      '#FF6B8A', '#FF3355', '#FFB3C6', '#E55473', '#FFD9E2', // 粉
      '#A855F7', '#7C3AED', '#C084FC', '#E0C3FC', '#F3E8FF', // 紫
      '#FFD93D', '#FF9500', '#FFE97F', '#FFF0CC',            // 黄
      '#84CC9A', '#60B87A', '#BBF7D0', '#F0FDF4',            // 绿
      '#1C1C1E', '#636366', '#AEAEB2', '#E5E5EA',            // 灰
    ],

    // 调整模式
    adjustMode: 'move', // move | scale | rotate
    savedImage: '',
  },

  onLoad() {
    this.loadStyles()
  },

  /**
   * 加载推荐款式
   */
  loadStyles() {
    const styles = generateMockStyles(12)
    this.setData({ styleList: styles })
  },

  /**
   * 步骤 1：选择/拍摄手部照片
   */
  async onChoosePhoto() {
    try {
      const res = await new Promise((resolve, reject) => {
        wx.showActionSheet({
          itemList: ['从相册选择', '拍摄照片'],
          success: ({ tapIndex }) => resolve(tapIndex),
          fail: reject,
        })
      })

      const sourceType = res === 0 ? ['album'] : ['camera']
      const chooseRes = await wx.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType,
      })

      const tempPath = chooseRes.tempFilePaths[0]

      // 获取图片尺寸
      const imgInfo = await wx.getImageInfo({ src: tempPath })

      this.setData({
        handImage: tempPath,
        handImageWidth: imgInfo.width,
        handImageHeight: imgInfo.height,
        step: 2,
      })

      toast.success('照片已上传')
    } catch (err) {
      if (err.errMsg && err.errMsg.includes('cancel')) return
      toast.error('选择照片失败')
    }
  },

  /**
   * 步骤 2：选择款式/颜色
   */
  onSelectStyle(e) {
    const { id } = e.currentTarget.dataset
    const style = this.data.styleList.find((s) => s._id === id)
    if (!style) return

    // 更新所有指甲颜色
    const primaryColor = style.primaryColor || style.colors[0]
    const nails = this.data.nails.map((n) => ({
      ...n,
      color: primaryColor,
      styleId: id,
    }))

    this.setData({
      currentStyle: style,
      selectedColor: primaryColor,
      nails,
    })
  },

  /**
   * 手动选颜色
   */
  onColorPick(e) {
    const { color } = e.currentTarget.dataset
    const nails = this.data.nails.map((n) => ({ ...n, color }))
    this.setData({ selectedColor: color, nails })
  },

  /**
   * 步骤切换
   */
  onNextStep() {
    const { step } = this.data
    if (step === 1 && !this.data.handImage) {
      return toast.info('请先上传手部照片')
    }
    if (step === 2 && !this.data.currentStyle) {
      return toast.info('请选择一个款式或颜色')
    }
    this.setData({ step: Math.min(step + 1, 4) })
  },

  onPrevStep() {
    this.setData({ step: Math.max(this.data.step - 1, 1) })
  },

  /**
   * 步骤 3：选择要调整的指甲
   */
  onSelectNail(e) {
    const { index } = e.currentTarget.dataset
    this.setData({ activeNailIndex: index })
  },

  /**
   * 切换调整模式
   */
  onSwitchMode(e) {
    const { mode } = e.currentTarget.dataset
    this.setData({ adjustMode: mode })
  },

  /**
   * 指甲位置微调
   */
  onNailMove(e) {
    const { direction } = e.currentTarget.dataset
    const { activeNailIndex, nails } = this.data
    const step = this.data.adjustMode === 'scale' ? 0.05 : this.data.adjustMode === 'rotate' ? 5 : 5

    const nail = { ...nails[activeNailIndex] }
    switch (direction) {
      case 'up':    nail.y -= step; break
      case 'down':  nail.y += step; break
      case 'left':  nail.x -= step; break
      case 'right': nail.x += step; break
      case 'in':    nail.scale = Math.min(nail.scale + 0.05, 2); break
      case 'out':   nail.scale = Math.max(nail.scale - 0.05, 0.3); break
      case 'cw':    nail.rotate += 5; break
      case 'ccw':   nail.rotate -= 5; break
    }

    nails[activeNailIndex] = nail
    this.setData({ nails })
  },

  /**
   * 指甲可见性切换
   */
  onToggleNail(e) {
    const { index } = e.currentTarget.dataset
    const nails = [...this.data.nails]
    nails[index].visible = !nails[index].visible
    this.setData({ nails })
  },

  /**
   * 重置当前指甲
   */
  onResetNail() {
    const { activeNailIndex, nails } = this.data
    nails[activeNailIndex] = { ...nails[activeNailIndex], x: 0, y: 0, scale: 1, rotate: 0 }
    this.setData({ nails })
  },

  /**
   * 步骤 4：生成预览图（canvas 合成）
   */
  onGeneratePreview() {
    toast.info('预览图已生成（v2将实现真实合成）')
    this.setData({ step: 4 })
  },

  /**
   * 保存结果到相册
   */
  onSaveResult() {
    if (this.data.handImage) {
      saveToAlbum(this.data.handImage)
    } else {
      toast.info('请先生成预览图')
    }
  },

  /**
   * 重新开始
   */
  onRestart() {
    this.setData({
      step: 1,
      handImage: '',
      currentStyle: null,
      nails: this.data.nails.map((n) => ({
        ...n, x: 0, y: 0, scale: 1, rotate: 0, color: '#FF6B8A',
      })),
    })
  },

  onShareAppMessage() {
    return createShareConfig('我用美甲DIY试戴了新款式，太美了！')
  },
})
