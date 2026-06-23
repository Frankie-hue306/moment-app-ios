const app=getApp(),DB=require('../../utils/data'),{toast}=require('../../utils/util')
Page({data:{list:[]},
onShow(){const d=wx.getStorageSync('myDesigns')||[];const shapes=DB.diy.shapes;const list=d.map(x=>{const sh=shapes.find(s=>s.k===x.shape);return{...x,shapeR:sh?sh.r:'44% 44% 34% 34%/14% 14% 22% 22%'}});this.setData({list})},
onTryon(e){const d=this.data.list[e.currentTarget.dataset.i];app.globalData.tryonStyle={name:d.shapeName+' · '+d.decorName,c:[d.color]};wx.navigateTo({url:'/pages/tryon/tryon'})},
onDel(e){const _=this;wx.showModal({title:'删除',content:'确定删除这个设计？',success(r){if(r.confirm){let d=wx.getStorageSync('myDesigns')||[];d.splice(e.currentTarget.dataset.i,1);wx.setStorageSync('myDesigns',d);_.onShow();toast.ok('已删除')}}})}})
