/*
 * RealNail — AI全自动试戴
 */
App({
  onLaunch(){
    if(wx.cloud){wx.cloud.init({env:'realnail-prod',traceUser:true});this.g.cReady=true}
    const s=wx.getSystemInfoSync()
    this.g.sH=s.statusBarHeight; this.g.sW=s.screenWidth; this.g.sH2=s.screenHeight
    this.g.dpr=s.pixelRatio||2; this.g.safeB=s.screenHeight-(s.safeArea?s.safeArea.bottom:s.screenHeight)
    const u=wx.getStorageSync('user')||{}; if(u.openid)this.g.user=u
    this.g.tryonStyle=null
  },
  track(e,d={}){
    if(!this._q)this._q=[]
    this._q.push({event:e,data:d,time:Date.now()})
    if(this._q.length>=5)this.flush()
  },
  flush(){
    if(!this._q||!this._q.length||!this.g.cReady)return
    const b=this._q.splice(0)
    wx.cloud.callFunction({name:'track',data:{events:b}}).catch(()=>{})
  },
  g:{cReady:false,user:{},sH:0,sW:375,sH2:667,dpr:2,safeB:0,tryonStyle:null}
})
