/*
 * ========================================
 *  通用工具函数
 * ========================================
 */

/**
 * 防抖
 */
const debounce = (fn, delay = 300) => {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

/**
 * 节流
 */
const throttle = (fn, delay = 300) => {
  let last = 0
  return function (...args) {
    const now = Date.now()
    if (now - last >= delay) {
      last = now
      fn.apply(this, args)
    }
  }
}

/**
 * 格式化时间
 * @param {Date|number} date
 * @param {string} format - 'YYYY-MM-DD HH:mm:ss'
 */
const formatTime = (date, format = 'YYYY-MM-DD HH:mm') => {
  if (!date) date = new Date()
  if (typeof date === 'number') date = new Date(date)

  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  const pad = (n) => (n < 10 ? '0' + n : n)

  return format
    .replace('YYYY', year)
    .replace('MM', pad(month))
    .replace('DD', pad(day))
    .replace('HH', pad(hour))
    .replace('mm', pad(minute))
    .replace('ss', pad(second))
}

/**
 * 获取随机 ID
 */
const generateId = (len = 8) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let id = ''
  for (let i = 0; i < len; i++) {
    id += chars[Math.floor(Math.random() * chars.length)]
  }
  return id + Date.now().toString(36)
}

/**
 * 预览图片
 */
const previewImage = (urls, current = 0) => {
  wx.previewImage({
    urls: Array.isArray(urls) ? urls : [urls],
    current: Array.isArray(urls) ? urls[current] : urls,
  })
}

/**
 * 保存图片到相册（带授权检查）
 */
const saveToAlbum = async (filePath) => {
  try {
    const auth = await new Promise((resolve) => {
      wx.getSetting({
        success: (res) => resolve(res.authSetting['scope.writePhotosAlbum']),
      })
    })

    if (auth === false) {
      await new Promise((resolve, reject) => {
        wx.openSetting({
          success: (res) => {
            res.authSetting['scope.writePhotosAlbum'] ? resolve() : reject()
          },
        })
      })
    }

    await wx.saveImageToPhotosAlbum({ filePath })
    wx.showToast({ title: '已保存到相册', icon: 'success' })
  } catch (err) {
    if (err.errMsg && err.errMsg.includes('auth deny')) {
      wx.showToast({ title: '需要相册权限才能保存', icon: 'none' })
    } else {
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  }
}

/**
 * 分享配置生成器
 */
const createShareConfig = (title, path, imageUrl) => ({
  title: title || '美甲DIY - 设计你的专属美甲',
  path: path || '/pages/index/index',
  imageUrl: imageUrl || '',
})

/**
 * Toast 快捷方法
 */
const toast = {
  success: (msg) => wx.showToast({ title: msg, icon: 'success' }),
  error: (msg) => wx.showToast({ title: msg, icon: 'none' }),
  info: (msg) => wx.showToast({ title: msg, icon: 'none', duration: 2000 }),
}

/**
 * 确认弹窗
 */
const confirm = (content, title = '提示') => {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      success: (res) => resolve(res.confirm),
    })
  })
}

module.exports = {
  debounce,
  throttle,
  formatTime,
  generateId,
  previewImage,
  saveToAlbum,
  createShareConfig,
  toast,
  confirm,
}
