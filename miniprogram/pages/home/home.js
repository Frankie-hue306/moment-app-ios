const app=getApp(),DB=require('../../utils/data')
Page({data:{sH:0,rank:[],cats:DB.cats},onLoad(){this.setData({sH:app.globalData.sH||20,rank:DB.ranking(10)})},onShow(){this.setData({rank:DB.ranking(10)})},
  onTryon(){wx.navigateTo({url:'/pages/tryon/tryon'})},
  onDetail(e){wx.navigateTo({url:'/pages/detail/detail?id='+e.currentTarget.dataset.id})},
  onCat(e){wx.switchTab({url:'/pages/gallery/gallery'});app.globalData.galleryCat=e.currentTarget.dataset.k},
  onShareAppMessage(){return{title:'RealNail - AI试戴',path:'/pages/home/home'}}})
