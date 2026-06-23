const app=getApp(),DB=require('../../utils/data')
Page({data:{sH:0,ac:'all',cats:DB.cats,L:[],R:[]},
  onLoad(){this.setData({sH:app.globalData.sH||20});if(app.globalData.galleryCat){this.setData({ac:app.globalData.galleryCat});app.globalData.galleryCat=null};this.load()},
  load(){let l=this.data.ac==='all'?DB.all():DB.filter({s:this.data.ac});const a=[],b=[];l.forEach((s,i)=>(i%2===0?a:b).push(s));this.setData({L:a,R:b})},
  onCat(e){this.setData({ac:e.currentTarget.dataset.k},()=>this.load())},
  onTap(e){wx.navigateTo({url:'/pages/detail/detail?id='+e.currentTarget.dataset.id})},
  onShareAppMessage(){return{title:'RealNail 款式库',path:'/pages/gallery/gallery'}}})
