/*
 * ========================================
 *  网络请求封装
 *  封装 wx.request，提供统一的 Token、Loading、错误处理
 * ========================================
 */

const BASE_URL = '' // 如果使用自建后端可配置

/**
 * 基础请求
 * @param {Object} options - { url, method, data, header, showLoading }
 */
const request = (options) => {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token')

    if (options.showLoading !== false) {
      wx.showLoading({ title: '加载中...', mask: true })
    }

    wx.request({
      url: `${BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.header,
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else if (res.statusCode === 401) {
          // Token 过期，清除缓存后由调用方处理
          wx.removeStorageSync('token')
          reject(new Error('登录已过期，请重新登录'))
        } else {
          const message = (res.data && res.data.message) || `请求失败 (${res.statusCode})`
          reject(new Error(message))
        }
      },
      fail: () => {
        reject(new Error('网络异常，请检查网络连接'))
      },
      complete: () => {
        if (options.showLoading !== false) {
          wx.hideLoading()
        }
      },
    })
  })
}

/**
 * GET 请求
 */
const get = (url, data = {}, options = {}) => {
  return request({ url, method: 'GET', data, ...options })
}

/**
 * POST 请求
 */
const post = (url, data = {}, options = {}) => {
  return request({ url, method: 'POST', data, ...options })
}

/**
 * 云函数调用封装（附带错误处理）
 */
const callCloudFunction = async (name, data = {}) => {
  try {
    const res = await wx.cloud.callFunction({ name, data })
    if (res.result && res.result.code === 0) {
      return res.result.data
    }
    throw new Error((res.result && res.result.message) || '云函数调用失败')
  } catch (err) {
    console.error(`[CloudFunc:${name}]`, err)
    throw err
  }
}

module.exports = { request, get, post, callCloudFunction }
