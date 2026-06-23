/*
 * RealNail 工具
 */
const toast={ok:m=>wx.showToast({title:m,icon:'success'}),err:m=>wx.showToast({title:m,icon:'none'}),info:m=>wx.showToast({title:m,icon:'none',duration:2000})}
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6)
const saveImg=async p=>{try{const a=await wx.getSetting();if(!a.authSetting['scope.writePhotosAlbum'])await wx.authorize({scope:'scope.writePhotosAlbum'});await wx.saveImageToPhotosAlbum({filePath:p});toast.ok('已保存')}catch(e){toast.info('请开启相册权限')}}
module.exports={toast,uid,saveImg}
