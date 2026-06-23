const cloud=require('wx-server-sdk');cloud.init({env:cloud.DYNAMIC_CURRENT_ENV});const db=cloud.database()
exports.main=async(e)=>{const{events}=e;if(!events||!events.length)return{ok:!1};try{for(const ev of events)await db.collection('analytics').add({data:ev});return{ok:!0,count:events.length}}catch(err){return{ok:!1,err:err.message}}}
