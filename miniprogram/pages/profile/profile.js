const app=getApp()
Page({data:{sH:0,stats:{designs:0,tryons:0,favs:0}},
onShow(){this.setData({sH:app.globalData.sH||20});const d=wx.getStorageSync('myDesigns')||[],t=wx.getStorageSync('tryonHistory')||[],f=wx.getStorageSync('favs')||[];this.setData({stats:{designs:d.length,tryons:t.length,favs:f.length}})},
onNav(e){const p=e.currentTarget.dataset.p;if(p==='designs')wx.navigateTo({url:'/pages/designs/designs'});else if(p==='history'){const h=wx.getStorageSync('tryonHistory')||[];if(!h.length){wx.showToast({title:'暂无记录',icon:'none'});return};wx.showModal({title:'试戴记录',content:'共 '+h.length+' 条记录\n可在试戴页查看',showCancel:!1})}else if(p==='favs'){const f=wx.getStorageSync('favs')||[];if(!f.length){wx.showToast({title:'暂无收藏',icon:'none'});return};wx.showModal({title:'我的收藏',content:'共 '+f.length+' 款收藏',showCancel:!1})}},
onAbout(){wx.showModal({title:'RealNail',content:'AI全自动美甲试戴\nApple极简设计\n一拍即合',showCancel:!1})}})
