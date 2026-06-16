Page({
  data: {
    stockCode: '',
    stockName: '',
    stockData: { price: '--', change: '0', open: '--', high: '--', low: '--', volume: '--', pe: '--', mcap: '--' },
    analysis: '加载中...'
  },

  onLoad(options) {
    const { code, name } = options
    this.setData({ stockCode: code, stockName: name })
    this.loadStockData(code)
  },

  loadStockData(code) {
    const prefix = code.startsWith('6') ? 'sh' : 'sz'
    wx.request({
      url: `https://qt.gtimg.cn/q=${prefix}${code}`,
      success: (res) => {
        const f = res.data.split('~')
        if (f.length > 40) {
          this.setData({
            stockData: {
              price: f[3],
              change: f[32],
              open: f[5],
              high: f[33],
              low: f[34],
              volume: f[6],
              pe: f[39] || '--',
              mcap: f[45] || '--'
            },
            analysis: this.generateAnalysis(f, code)
          })
        }
      }
    })
  },

  generateAnalysis(f, code) {
    const name = f[1]
    const pe = parseFloat(f[39]) || 0
    const change = parseFloat(f[32]) || 0
    let analysis = `【${name} 快速研判】\n\n`

    if (pe > 0 && pe < 25) analysis += `PE ${pe.toFixed(1)} 处于历史低位，格雷厄姆安全边际充足。\n`
    else if (pe > 50) analysis += `PE ${pe.toFixed(1)} 偏高，费城半导体联动需谨慎。\n`
    else analysis += `PE ${pe.toFixed(1)} 处于合理区间。\n`

    if (change > 2) analysis += '今日涨幅较大，短线获利盘积累，追高需谨慎。\n'
    else if (change < -2) analysis += '今日跌幅较大，马克斯逆向框架提示关注左侧机会。\n'
    else analysis += '今日波动温和，趋势延续中。\n'

    analysis += '\n⚠️ 以上为AI框架分析，不构成投资建议'
    return analysis
  }
})
