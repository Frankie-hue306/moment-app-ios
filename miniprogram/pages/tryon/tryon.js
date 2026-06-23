const app=getApp(),DB=require('../../utils/data'),{toast,saveImg,uid}=require('../../utils/util')

Page({data:{
  sH:0,hand:'',selStyle:null,selColor:'#DDBEA9',
  colors:['#DDBEA9','#F5EDE6','#FFB3C1','#FF6B8A','#E05575','#D4A9AD','#A855F7','#C084FC','#1B2838','#722F37','#1B4D3E','#C0C0C0','#D4AF37','#8B1A2B','#A8BFCF','#FFD700'],
  nails:[
    {id:'thumb',name:'拇指',x:20,y:58,s:1,r:-5,c:'#DDBEA9',v:1},
    {id:'index',name:'食指',x:32,y:30,s:1,r:-2,c:'#DDBEA9',v:1},
    {id:'middle',name:'中指',x:44,y:20,s:1,r:0,c:'#DDBEA9',v:1},
    {id:'ring',name:'无名',x:56,y:24,s:1,r:3,c:'#DDBEA9',v:1},
    {id:'pinky',name:'小指',x:68,y:38,s:1,r:8,c:'#DDBEA9',v:1},
  ],
  detected:!1,status:'',result:'',
},
onLoad(opts){
  this.setData({sH:app.globalData.sH||20})
  if(app.globalData.tryonStyle){const s=app.globalData.tryonStyle;this.setData({selStyle:s,selColor:s.c[0],nails:this.data.nails.map(n=>({...n,c:s.c[0]}))});app.globalData.tryonStyle=null}
},

async onCamera(){
  try{
    const r=await wx.chooseImage({count:1,sizeType:['compressed'],sourceType:['camera']})
    this.setData({hand:r.tempFilePaths[0],detected:!1,result:'',status:'🔍 正在检测指甲...'})
    setTimeout(()=>this.onDetect(),600)
    app.track('tryon_photo')
  }catch(e){if(!(e.errMsg&&e.errMsg.includes('cancel')))toast.err('拍照失败')}
},

onDetect(){
  this.setData({status:'🔍 AR检测中...'})
  // 尝试VKSession
  try{
    const s=wx.createVKSession({track:{hand:{mode:1}}})
    let done=!1
    const t=setTimeout(()=>{if(!done){s.destroy();this.tmplDetect()}},4000)
    s.on('updateAnchors',(a)=>{
      if(done||!a||!a.length)return;const h=a[0]
      if(!h.points||h.points.length<21)return;done=!0;clearTimeout(t);s.destroy()
      const ms=[[4,3],[8,7],[12,11],[16,15],[20,19]]
      const nails=[...this.data.nails];let ok=0
      ms.forEach(([ti,di],i)=>{
        const tp=h.points[ti],dp=h.points[di];if(!tp||!dp)return
        nails[i].x=Math.round(((tp.x+dp.x)/2)*100);nails[i].y=Math.round(((tp.y+dp.y)/2)*100)
        nails[i].r=Math.round(Math.atan2(tp.y-dp.y,tp.x-dp.x)*180/Math.PI-90)
        const len=Math.sqrt((tp.x-dp.x)**2+(tp.y-dp.y)**2)
        nails[i].s=+Math.max(.6,Math.min(2,len*12)).toFixed(2);ok++
      })
      this.setData({nails,detected:!0,status:'✅ AR检测完成 ('+ok+'/5)'})})
    s.on('error',()=>{clearTimeout(t);if(!done){s.destroy();this.tmplDetect()}})
    s.start().catch(()=>{if(!done)this.tmplDetect()})
  }catch(e){this.tmplDetect()}
},

tmplDetect(){
  const t=[{x:18,y:60,s:.88,r:-6},{x:30,y:32,s:.95,r:-2},{x:42,y:22,s:1,r:0},{x:54,y:27,s:.93,r:3},{x:68,y:40,s:.82,r:8}]
  const c=this.data.selColor;const nails=t.map((p,i)=>({...this.data.nails[i],...p,c}))
  this.setData({nails,detected:!0,status:'📐 模板定位完成'})
},

onColor(e){const c=e.currentTarget.dataset.c;this.setData({selColor:c,nails:this.data.nails.map(n=>({...n,c}))})},

onComposite(){
  if(!this.data.hand)return toast.info('请先拍照')
  wx.showLoading({title:'合成中...'});const _=this
  wx.createSelectorQuery().select('#tc').fields({node:!0,size:!0}).exec((res)=>{
    if(!res||!res[0]||!res[0].node){wx.hideLoading();return toast.info('请截屏')}
    const cv=res[0].node,ctx=cv.getContext('2d'),dpr=app.globalData.dpr||2
    cv.width=375*dpr;cv.height=500*dpr;ctx.scale(dpr,dpr)
    const im=cv.createImage()
    im.onload=()=>{
      const iw=375,ih=(im.height/im.width)*375;ctx.drawImage(im,0,0,iw,ih)
      _.data.nails.forEach(n=>{
        if(!n.v)return;ctx.save()
        const cx=(n.x/100)*iw,cy=(n.y/100)*ih,nw=iw*.08*n.s,nh=ih*.12*n.s
        ctx.translate(cx,cy);ctx.rotate((n.r*Math.PI)/180)
        const x=-nw/2,y=-nh/2,r=nw*.45
        ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+nw-r,y)
        ctx.arcTo(x+nw,y,x+nw,y+r,r);ctx.lineTo(x+nw,y+nh-r*1.3)
        ctx.arcTo(x+nw,y+nh,x+nw-r,y+nh,r*1.3);ctx.lineTo(x+r,y+nh)
        ctx.arcTo(x,y+nh,x,y+nh-r*1.3,r*1.3);ctx.lineTo(x,y+r);ctx.arcTo(x,y,x+r,y,r)
        ctx.closePath();ctx.fillStyle=n.c+'CC';ctx.fill()
        const g=ctx.createLinearGradient(x,y,x+nw*.6,y+nh*.5)
        g.addColorStop(0,'rgba(255,255,255,.4)');g.addColorStop(.5,'rgba(255,255,255,.05)');g.addColorStop(1,'rgba(255,255,255,0)')
        ctx.fillStyle=g;ctx.fill();ctx.restore()
      })
      wx.canvasToTempFilePath({canvas:cv,x:0,y:0,width:cv.width,height:cv.height,destWidth:750,destHeight:1000,success(r2){
        wx.hideLoading();_.setData({result:r2.tempFilePath})
        const h=wx.getStorageSync('tryonHistory')||[]
        h.unshift({_id:uid(),resultImage:r2.tempFilePath,styleName:_.data.selStyle?.name||'自定义',colors:_.data.nails.map(n=>n.c).filter((_,i)=>i<3),createdAt:new Date().toLocaleString()})
        if(h.length>30)h.length=30;wx.setStorageSync('tryonHistory',h)
      },fail(){wx.hideLoading();toast.info('请截屏')}})
    };im.onerror=()=>{wx.hideLoading();toast.err('图片加载失败，请重拍')};im.src=_.data.hand
  })
},

onSave(){if(this.data.result)saveImg(this.data.result)},
onRetry(){this.setData({result:'',hand:'',detected:!1,status:''})},
onBack(){wx.switchTab({url:'/pages/home/home'})},
onShareAppMessage(){return{title:'RealNail AI试戴',path:'/pages/tryon/tryon'}},
})
