/*
 * ========================================
 *  云函数：getStyles
 *  获取美甲款式列表，支持分页、分类、排序
 * ========================================
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const {
    category = 'all',
    sortBy = 'latest',
    page = 1,
    pageSize = 20,
    keyword = '',
  } = event

  try {
    let query = db.collection('nail_styles')

    // 分类过滤
    if (category !== 'all') {
      query = query.where({ category })
    }

    // 关键词搜索
    if (keyword) {
      query = query.where(
        _.or([
          { name: db.RegExp({ regexp: keyword, options: 'i' }) },
          { tags: db.RegExp({ regexp: keyword, options: 'i' }) },
        ])
      )
    }

    // 排序
    if (sortBy === 'popular') {
      query = query.orderBy('likes', 'desc')
    } else {
      query = query.orderBy('createdAt', 'desc')
    }

    // 分页
    const total = await query.count()
    const styles = await query
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    return {
      code: 0,
      data: {
        list: styles.data,
        total: total.total,
        page,
        pageSize,
        hasMore: page * pageSize < total.total,
      },
      message: 'ok',
    }
  } catch (err) {
    return {
      code: -1,
      data: null,
      message: err.message || '查询失败',
    }
  }
}
