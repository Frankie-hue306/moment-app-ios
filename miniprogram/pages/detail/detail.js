const app=getApp(),DB=require('../../utils/data'),{toast}=require('../../utils/util')
Page({data:{s:null,sim:[]},
onLoad(opts){const s=DB.get(opts.id);if(!s){toast.err('款式不存在');return};this.setData({s,sim:DB.similar(opts.id,8)})},
onTryon(){app.globalData.tryonStyle=this.data.s;wx.navigateTo({url:'/pages/tryon/tryon'});app.track('tryon_from_detail',{id:this.data.s.id})},
onGet(){wx.showActionSheet({itemList:['复制客服微信号','前往购买'],success:({tapIndex})=>{if(tapIndex===0){wx.setClipboardData({data:DB.shop.wechat,success:()=>toast.ok('已复制')})}else{toast.info('购买链接开发中')}}})},
onSim(e){wx.navigateTo({url:'/pages/detail/detail?id='+e.currentTarget.dataset.id})},
onShareAppMessage(){return{title:this.data.s?this.data.s.name:'RealNail',path:'/pages/detail/detail?id='+(this.data.s?this.data.s.id:'')}}})
