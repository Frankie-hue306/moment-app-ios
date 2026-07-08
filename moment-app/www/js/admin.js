/**
 * 此刻 Moment - 审核后台逻辑
 * 从 public/admin.html 拆分而来
 */
var API='';
var TOKEN='';
var page=1,totalPages=1;

// Get API base from localStorage (same as main app)
function init(){
  API=(localStorage.getItem('mv_api')||'').replace(/\/+$/,'')||(location.protocol==='https:'?'https://cikemoment.cn':'http://124.156.163.213:3000');
  var saved=localStorage.getItem('mv_auth');
  if(saved){
    try{
      var a=JSON.parse(saved);
      if(a.token&&a.userId===1){TOKEN=a.token;loadReview();return}
    }catch(e){}
  }
  document.getElementById('loginBlock').style.display='block';
}

function login(){
  var tok=document.getElementById('tokenInput').value.trim();
  if(!tok){document.getElementById('loginMsg').textContent=t('admin.invalidToken');return}
  TOKEN=tok;
  fetch(API+'/api/stats',{headers:{'x-auth-token':TOKEN}})
    .then(function(r){return r.json()})
    .then(function(d){
      if(d.error){document.getElementById('loginMsg').textContent=t('admin.invalidToken');return}
      document.getElementById('loginBlock').style.display='none';
      loadReview();
    })
    .catch(function(){document.getElementById('loginMsg').textContent=t('common.networkError')});
}

function loadReview(){
  document.getElementById('reviewBlock').style.display='block';
  document.getElementById('momentList').innerHTML='<div class="loading">'+t('admin.loading')+'</div>';

  fetch(API+'/api/admin/moments?page='+page+'&limit=20',{headers:{'x-auth-token':TOKEN}})
    .then(function(r){return r.json()})
    .then(function(d){
      if(d.error){alert(d.error);return}
      document.getElementById('statsBar').textContent=t('admin.pendingCount',{count:d.total});
      totalPages=Math.ceil(d.total/20)||1;

      if(!d.moments||d.moments.length===0){
        document.getElementById('momentList').innerHTML='';
        document.getElementById('emptyState').style.display='block';
        document.getElementById('pagination').innerHTML='';
        return;
      }

      document.getElementById('emptyState').style.display='none';
      var html='';
      d.moments.forEach(function(m){
        var img=m.imageUrl?API+m.imageUrl:'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect fill="#222" width="120" height="120"/><text fill="#555" x="60" y="65" text-anchor="middle" font-size="14">'+t('admin.noImage')+'</text></svg>');
        html+='<div class="card" id="card-'+m.id+'">';
        html+='<img src="'+img+'" loading="lazy">';
        html+='<div class="info">';
        html+='<div class="thought">'+(m.thought||t('gallery.noText'))+'</div>';
        html+='<div class="meta">'+t('admin.author')+': '+escHtml(m.author)+'</div>';
        html+='<div class="meta">'+t('admin.time')+': '+m.created_at+' · '+t('admin.status')+': '+m.status+'</div>';
        if(m.reportCount>0)html+='<div class="report-badge">'+t('admin.reportedTimes',{count:m.reportCount})+'</div>';
        html+='<div class="reject-reason" id="reason-'+m.id+'" style="display:none"><input id="reasonInput-'+m.id+'" placeholder="'+t('admin.rejectPlaceholder')+'"></div>';
        html+='</div>';
        html+='<div class="actions">';
        html+='<button class="btn btn-approve" onclick="approve('+m.id+')">'+t('admin.approve')+'</button>';
        html+='<button class="btn btn-reject" onclick="toggleReject('+m.id+')">'+t('admin.reject')+'</button>';
        html+='</div>';
        html+='</div>';
      });
      document.getElementById('momentList').innerHTML=html;
      renderPagination();
    })
    .catch(function(){document.getElementById('momentList').innerHTML='<div class="loading">'+t('admin.loadFailed')+'</div>'});
}

function renderPagination(){
  var html='';
  html+='<button '+(page<=1?'disabled':'')+' onclick="goPage('+(page-1)+')">'+t('admin.prevPage')+'</button>';
  html+='<span style="padding:8px 12px;color:var(--muted);font-size:13px">'+page+' / '+totalPages+'</span>';
  html+='<button '+(page>=totalPages?'disabled':'')+' onclick="goPage('+(page+1)+')">'+t('admin.nextPage')+'</button>';
  document.getElementById('pagination').innerHTML=html;
}

function goPage(p){page=p;loadReview();window.scrollTo(0,0)}

function approve(id){
  if(!confirm(t('admin.approveConfirm')))return;
  fetch(API+'/api/admin/moments/'+id+'/approve',{method:'POST',headers:{'x-auth-token':TOKEN,'Content-Type':'application/json'}})
    .then(function(r){return r.json()})
    .then(function(d){
      if(d.error){alert(d.error);return}
      var card=document.getElementById('card-'+id);
      if(card)card.style.opacity='.3';
      setTimeout(loadReview,500);
    })
    .catch(function(){alert(t('common.operationFailed'))});
}

var _rejectId=null;
function toggleReject(id){
  var el=document.getElementById('reason-'+id);
  if(_rejectId===id){
    var reason=document.getElementById('reasonInput-'+id).value||t('admin.defaultRejectReason');
    if(!confirm(t('admin.rejectConfirm',{reason:reason})))return;
    fetch(API+'/api/admin/moments/'+id+'/reject',{
      method:'POST',
      headers:{'x-auth-token':TOKEN,'Content-Type':'application/json'},
      body:JSON.stringify({reason:reason})
    })
      .then(function(r){return r.json()})
      .then(function(d){
        if(d.error){alert(d.error);return}
        var card=document.getElementById('card-'+id);
        if(card)card.style.opacity='.3';
        _rejectId=null;
        setTimeout(loadReview,500);
      })
      .catch(function(){alert(t('common.operationFailed'))});
  }else{
    if(_rejectId)document.getElementById('reason-'+_rejectId).style.display='none';
    el.style.display='block';
    document.getElementById('reasonInput-'+id).focus();
    _rejectId=id;
  }
}

function escHtml(s){if(!s)return'';return String(s).replace(/[&<>]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})}

init();
