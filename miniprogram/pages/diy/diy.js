const app=getApp(),DB=require('../../utils/data'),{toast,uid}=require('../../utils/util')

Page({data:{
  sH:0,step:1,
  shapes:DB.diy.shapes,selShape:'oval',shape:DB.diy.shapes.find(s=>s.k==='oval'),
  palette:DB.diy.colors,selColor:'#DDBEA9',
  decorKeys:Object.keys(DB.diy.decors),decorCat:'gem',decorData:DB.diy.decors,selDecor:null,
},
onLoad(){this.setData({sH:app.globalData.sH||20})},

onShape(e){const k=e.currentTarget.dataset.k;const s=DB.diy.shapes.find(x=>x.k===k);this.setData({selShape:k,shape:s})},
onColor(e){this.setData({selColor:e.currentTarget.dataset.c})},
onDecorCat(e){this.setData({decorCat:e.currentTarget.dataset.k})},
onDecor(e){const d=e.currentTarget.dataset.d;this.setData({selDecor:this.data.selDecor&&this.data.selDecor.id===d.id?null:d})},

onNext(){
  if(this.data.step<3){this.setData({step:this.data.step+1})}
  else{
    // 完成设计 → 保存到"我的设计"
    const designs=wx.getStorageSync('myDesigns')||[]
    designs.unshift({
      _id:uid(),shape:this.data.selShape,color:this.data.selColor,
      decor:this.data.selDecor,createdAt:new Date().toLocaleString(),
      shapeName:this.data.shape.n,decorName:this.data.selDecor?.n||'无',
    })
    wx.setStorageSync('myDesigns',designs)
    toast.ok('设计已保存')
    app.track('diy_complete',{shape:this.data.selShape,color:this.data.selColor})
  }
},
onPrev(){this.setData({step:Math.max(1,this.data.step-1)})},
onShareAppMessage(){return{title:'RealNail DIY工坊',path:'/pages/diy/diy'}},
})
