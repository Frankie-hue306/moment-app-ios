/*
 * ========================================
 *  我的设计页
 *  展示用户保存的 DIY 设计作品
 * ========================================
 */

const { toast, confirm } = require('../../utils/util')

Page({
  data: {
    designs: [],
    loading: true,
    isEmpty: false,
    editMode: false,
    selectedIds: [],
  },

  onLoad() {
    this.loadDesigns()
  },

  onShow() {
    this.loadDesigns()
  },

  onPullDownRefresh() {
    this.loadDesigns().then(() => wx.stopPullDownRefresh())
  },

  /**
   * 加载设计列表
   */
  async loadDesigns() {
    this.setData({ loading: true })

    try {
      // TODO: 从云数据库加载 user_designs
      // db.collection('user_designs').orderBy('createdAt', 'desc').get()

      // 开发阶段从本地缓存读取
      const cached = wx.getStorageSync('myDesigns') || []

      // 模拟一些示例数据
      const mockDesigns = [
        {
          _id: 'design_1',
          name: '樱花粉雾',
          thumbnail: '',
          baseColor: '#FFB3C6',
          elementCount: 5,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          _id: 'design_2',
          name: '几何线条',
          thumbnail: '',
          baseColor: '#F5F5F5',
          elementCount: 3,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          _id: 'design_3',
          name: '星空梦幻',
          thumbnail: '',
          baseColor: '#2D2D3F',
          elementCount: 8,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
        },
      ]

      const designs = cached.length > 0 ? cached : mockDesigns

      this.setData({
        designs,
        isEmpty: designs.length === 0,
        loading: false,
      })
    } catch (err) {
      this.setData({ loading: false })
      toast.error('加载失败')
    }
  },

  /**
   * 新建设计 → 跳转 DIY
   */
  onCreateNew() {
    wx.switchTab({ url: '/pages/diy/diy' })
  },

  /**
   * 打开设计 → 跳转 DIY（加载设计数据）
   */
  onOpenDesign(e) {
    const { id } = e.currentTarget.dataset
    // TODO: 将设计数据传递给 DIY 页面
    wx.switchTab({ url: '/pages/diy/diy' })
        toast.info('加载设计中...（v2 将支持编辑已有设计）')
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
   * 选择/取消选择
   */
  onSelectDesign(e) {
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
   * 删除选中的设计
   */
  async onDeleteSelected() {
    if (this.data.selectedIds.length === 0) {
      return toast.info('请先选择要删除的设计')
    }

    const ok = await confirm(`确定删除 ${this.data.selectedIds.length} 个设计？`)
    if (!ok) return

    const designs = this.data.designs.filter(
      (d) => !this.data.selectedIds.includes(d._id)
    )
    wx.setStorageSync('myDesigns', designs)
    this.setData({
      designs,
      isEmpty: designs.length === 0,
      editMode: false,
      selectedIds: [],
    })
    toast.success('已删除')
  },

  /**
   * 格式化时间
   */
  formatTime(isoStr) {
    const d = new Date(isoStr)
    const now = new Date()
    const diff = now - d
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    return `${d.getMonth() + 1}/${d.getDate()}`
  },
})
