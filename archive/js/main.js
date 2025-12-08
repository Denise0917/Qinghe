/* =========================
 * main.js - 通用脚本：UI / 登录 / 顶栏 / 管理员拦截 / 首页
 * ========================= */

/* ---------- UI：Toast ---------- */
function ensureToastHost(){
  let host = document.querySelector('.qh-toast-wrap');
  if(!host){
    host = document.createElement('div');
    host.className = 'qh-toast-wrap';
    host.style.cssText = 'position:fixed;left:0;right:0;top:18px;display:flex;justify-content:center;z-index:9999;pointer-events:none';
    document.body.appendChild(host);
  }
  return host;
}
function showToast(msg, {type='info', timeout=2400} = {}){
  const host = ensureToastHost();
  const el = document.createElement('div');
  el.className = `qh-toast ${type}`;
  el.style.cssText = 'pointer-events:auto;background:#141c2a;border:1px solid #223048;border-radius:10px;padding:8px 12px;color:#e8eaee;box-shadow:0 10px 24px rgba(0,0,0,.3);';
  el.innerHTML = `<span>${msg}</span>`;
  host.appendChild(el);
  if(timeout>0){
    setTimeout(()=>{ if(el.parentNode) host.removeChild(el); }, timeout);
  }
}

/* ---------- UI：Modal ---------- */
function openNotice({title='提示', html='', okText='确定', onOk=null, cancelText=null, onCancel=null}={}){
  const mask = document.createElement('div');
  mask.className = 'qh-mask';
  mask.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:9998';
  mask.innerHTML = `
    <div class="qh-modal" role="dialog" aria-modal="true" style="width:460px;background:#141822;border:1px solid #202636;border-radius:12px;padding:14px">
      <div class="hd" style="font-weight:700;margin-bottom:8px">${title}</div>
      <div class="bd" style="color:#dbe1ea">${html}</div>
      <div class="ft" style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
        ${cancelText ? `<button class="btn" data-k="cancel">`+cancelText+`</button>`:''}
        <button class="btn primary" data-k="ok">${okText}</button>
      </div>
    </div>
  `;
  function close(){ if(mask.parentNode) document.body.removeChild(mask); }
  mask.addEventListener('click', (e)=>{ if(e.target===mask) close(); });
  mask.querySelector('[data-k="ok"]').onclick = ()=>{ close(); onOk && onOk(); };
  const btnCancel = mask.querySelector('[data-k="cancel"]');
  if(btnCancel) btnCancel.onclick = ()=>{ close(); onCancel && onCancel(); };
  document.body.appendChild(mask);
}

/* ---------- 登录模态：复用页面已有的 #loginMask，如无则创建 ---------- */
function ensureLoginModal(){
  let wrap = document.getElementById('loginMask');
  if(!wrap){
    wrap = document.createElement('div');
    wrap.id = 'loginMask';
    wrap.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);display:none;align-items:center;justify-content:center;z-index:9999';
    wrap.innerHTML = `
      <div class="box" style="width:380px;background:#141822;border:1px solid #202636;border-radius:12px;padding:16px">
        <h3 style="margin:0 0 8px">账号登录</h3>
        <p class="small">示例：林镜 <code>linjing@stu.qh.edu</code>　密码 <code>qh-2025</code></p>
        <label class="small">邮箱</label>
        <input id="inpUser" class="input" placeholder="linjing@stu.qh.edu 或 2025X0001"/>
        <label class="small" style="margin-top:8px;display:block">密码</label>
        <input id="inpPass" type="password" class="input" placeholder="请输入密码"/>
        <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end">
          <button class="btn" data-k="cancel">取消</button>
          <button class="btn primary" data-k="ok">登录</button>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);
  }
  const cancel = wrap.querySelector('[data-k="cancel"]');
  const ok = wrap.querySelector('[data-k="ok"]');
  if (cancel && !cancel._bind){ cancel._bind = true; cancel.onclick = closeLogin; }
  if (ok && !ok._bind){ ok._bind = true; ok.onclick = doLogin; }
  return wrap;
}
function openLogin(){
  const m = ensureLoginModal();
  m.style.display = 'flex';
}
function closeLogin(){
  const m = document.getElementById('loginMask');
  if(!m) return;
  m.style.display = 'none';
}

/* ---------- 登录逻辑 ---------- */
function doLogin(){
  const uEl = document.getElementById('inpUser');
  const pEl = document.getElementById('inpPass');
  if(!uEl || !pEl){
    showToast('登录表单未就绪，请稍后再试', {type:'warn'});
    return;
  }
  const u = uEl.value.trim();
  const p = pEl.value.trim();
  if(!u || !p){
    showToast('请输入账号和密码', {type:'warn'});
    return;
  }
  if(typeof loginWith !== 'function'){
    alert('登录系统未加载（auth.js）');
    return;
  }
  const res = loginWith(u, p);
  if(!res || !res.ok){
    alert((res && res.msg) || '登录失败，请检查账号密码');
    return;
  }

  // 登录成功：清掉旧未读缓存（防止账号串）
  if(typeof getAuth === 'function'){
    const auth = getAuth();
    if(auth) setCachedUnread(auth.id, 0);
  }

  closeLogin();
  refreshUserBar();
  if(typeof authSummary === 'function'){
    showToast('登录成功：' + authSummary(), {type:'info', timeout:2200});
  }else{
    showToast('登录成功', {type:'info', timeout:2200});
  }
}

/* ==== 未读缓存工具（由 inbox.js 写入，这里读取） ==== */
const UNREAD_CACHE_KEY = (uid)=> `qh_unread_cache_${uid}`;
function getCachedUnread(uid){
  const n = Number(localStorage.getItem(UNREAD_CACHE_KEY(uid)));
  return Number.isFinite(n) ? n : 0;
}
function setCachedUnread(uid, n){
  localStorage.setItem(UNREAD_CACHE_KEY(uid), String(Math.max(0, Number(n)||0)));
}

/* 顶栏刷新：只看缓存（由 inbox.js 负责写） */
function refreshUserBar(){
  if (typeof getAuth !== 'function') return;
  const auth = getAuth();
  const nameEl   = document.getElementById('userName');
  const btnLogin = document.getElementById('btnLogin');
  const btnLogout= document.getElementById('btnLogout');
  const link     = document.getElementById('inboxLink');
  if(!nameEl || !link) return;

  if(auth){
    nameEl.textContent = auth.email;
    btnLogin && btnLogin.classList.add('hidden');
    btnLogout && btnLogout.classList.remove('hidden');

    const n = getCachedUnread(auth.id);
    link.innerHTML = n > 0
      ? `收件箱 <span class="badge-u red" id="inboxBadgeTop">${n}</span>`
      : '收件箱';
  }else{
    nameEl.textContent = '未登录';
    btnLogin && btnLogin.classList.remove('hidden');
    btnLogout && btnLogout.classList.add('hidden');
    link.innerHTML = '收件箱';
  }
}

/* inbox.js 会触发该事件 → 顶栏立即更新 */
window.addEventListener('qh-unread-updated', ()=>{ try{ refreshUserBar(); }catch(e){} });

/* ---------- 管理员跳转前拦截：data-requires="admin" ---------- */
function setupAdminLinkGuard() {
  document.addEventListener('click', function (e) {
    const a = e.target.closest('a[href][data-requires="admin"]');
    if (!a) return;

    e.preventDefault();
    const auth = (typeof getAuth === 'function') ? getAuth() : null;

    if (!auth) {
      openNotice({
        title:'访问受限',
        html: `
          <p style="color:#ff6b6b">该内容仅向 <strong>管理员</strong> 开放。</p>
          <p>请使用管理员账号登录后再试。</p>
        `,
        okText:'去登录',
        cancelText:'取消',
        onOk:()=> openLogin()
      });
      return;
    }

    if (auth.role !== 'admin') {
      openNotice({
        title:'权限不足',
        html: `
          <p style="color:#ff6b6b">当前账号权限不足，无法访问管理员材料。</p>
          <p class="muted small">如需查看，请使用管理员账号（示例：zhang.gq@qh.edu，密码 qh-2025）。</p>
        `,
        okText:'切换账号',
        cancelText:'返回',
        onOk:()=> openLogin()
      });
      return;
    }

    location.href = a.getAttribute('href');
  }, { capture: true });
}

/* ---------- 首页：新闻渲染（从 window.NEWS_DATA 读取） ---------- */
function escapeHtml(s){return (s||"").replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));}
function renderNews(limit = 7){
  const list = document.getElementById("newsList");
  if(!list) return;
  const NEWS = (window.NEWS_DATA || []).slice();
  const items = NEWS.sort((a,b)=> (b.urgent===a.urgent ? b.date.localeCompare(a.date) : (b.urgent?1:-1)));
  const show = typeof limit === "number" ? items.slice(0, limit) : items;
  list.innerHTML = show.map(n => `
    <li class="news-item" data-urgent="${!!n.urgent}" title="${escapeHtml(n.title)}">
      <div class="news-tag-wrap">
        <span class="news-dot"></span>
        ${n.tag ? `<span class="news-tag">${escapeHtml(n.tag)}</span>` : ""}
        ${n.adminOnly ? `<span class="news-tag" title="仅管理员">管理员</span>` : ""}
      </div>
      <div class="news-title">
        <a href="${n.href}" ${n.adminOnly ? 'data-requires="admin"' : ''}>${escapeHtml(n.title)}</a>
      </div>
      <div class="news-date">${n.date}</div>
    </li>
  `).join("");
}

/* ---------- 首页：考试安排弹窗 ---------- */
function showExamNotice(){
  openNotice({
    title: '教务系统提示',
    html: `
      <p>当前尚未到达考试周，<strong>期末考试安排暂未开放</strong>。</p>
      <p>请同学们留意后续教务系统通知或关注“清河大学教务处”公告。</p>
      <p class="muted small">开放时间预计：<strong>2025 年 12 月中旬</strong></p>
    `,
    okText: '我知道了'
  });
}
function setupGlobalTriggers(){
  document.addEventListener('click', (e)=>{
    const el = e.target.closest('[data-action="showExamNotice"]');
    if(!el) return;
    e.preventDefault();
    showExamNotice();
  });
}

/* ---------- 顶部导航搜索框：跳转到 search.html?q=xxx ---------- */
function setupGlobalSearchBar(){
  const form = document.getElementById('siteSearchForm');
  const input = document.getElementById('siteSearchInput');
  if(!form || !input) return;   // 某些页面没这个 DOM 就直接返回

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const kw = input.value.trim();
    if(!kw){
      // 可选：给个小提示
      if(typeof showToast === 'function'){
        showToast('请输入要搜索的内容', {type:'warn'});
      }
      input.focus();
      return;
    }
    // 跳转到统一的搜索结果页
    const q = encodeURIComponent(kw);
    window.location.href = `search.html?q=${q}`;
  });
}

/* --------- 全站：导航搜索框统一跳转 /search.html --------- */
function setupGlobalNavSearch(){
  // 找到所有 class="nav-search" 的表单（比如你 search.html、dorm 页面导航里的那个）
  const forms = document.querySelectorAll('form.nav-search');
  if(!forms.length) return;

  forms.forEach(form=>{
    const input = form.querySelector('input[name="q"], input[type="text"]');
    if(!input) return;

    form.addEventListener('submit', function(e){
      e.preventDefault(); // 阻止默认提交（防止 /archive/search.html 这种相对路径）

      const kw = (input.value || '').trim();
      const target = '/search.html' + (kw ? ('?q=' + encodeURIComponent(kw)) : '');
      window.location.href = target;   // 永远跳到根目录的 /search.html
    });
  });
}

// ========== 最终内部通知解锁逻辑（动态日期 + 全站弹窗） ==========

// 1）辅助：读登录次数（auth.js 里已经在 loginWith 时 +1 了）
function qhGetLoginCount(uid){
  try{
    return Number(localStorage.getItem('qh_login_count_' + uid) || '0') || 0;
  }catch(e){
    return 0;
  }
}

// 2）辅助：顾岱明心理记录加锁备注是否已被解锁（由 counseling.js 写入）
function qhHasUnlockedGdmNote(){
  return localStorage.getItem('qh_flag_counsel_gdm_unlock') === '1';
}

// 3）辅助：林澜账号是否已按“家属核验码”解封（由解锁页写入）
function qhHasUnlockedLL(){
  return localStorage.getItem('qh_ll_family_unlock') === '1';
}

// 4）日期格式：YYYY-MM-DD
function qhTodayStr(){
  var d  = new Date();
  var y  = d.getFullYear();
  var m  = String(d.getMonth() + 1).padStart(2, '0');
  var dd = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + dd;
}

// 5）总条件：是否满足解锁“内部归档说明”的条件
function qhCanShowFinalNotice(){
  // 顾 / 陈 / 沈 / 张 四个账号，每个登录次数 ≥ 3
  var ids = ['U-GDM','U-CSY','U-SYH','U-ZGQ'];
  var all3 = ids.every(function(id){
    return qhGetLoginCount(id) >= 3;
  });

  var llOk   = qhHasUnlockedLL();      // 家属解封
  var noteOk = qhHasUnlockedGdmNote(); // 顾的加密 note 已看

  return all3 && llOk && noteOk;
}

// 6）更新首页通知栏里的“内部归档说明”那一条
function qhUpdateFinalNotice(){
  var li = document.getElementById('liFinalNotice');
  if(!li) return; // 非首页直接略过

  var dateSpan = li.querySelector('span.muted');
  var can = qhCanShowFinalNotice();

  if(can){
    li.classList.remove('hidden');

    // 日期：优先用第一次解锁时记下的日期
    var storedDate = localStorage.getItem('qh_final_notice_date');
    if(!storedDate){
      storedDate = qhTodayStr();
      localStorage.setItem('qh_final_notice_date', storedDate);
    }
    if(dateSpan){
      dateSpan.textContent = storedDate;
    }
  }else{
    li.classList.add('hidden');
  }
}

// 7）右下角弹窗
function qhShowFinalToast(){
  if(document.getElementById('qhFinalToast')) return;

  var box = document.createElement('div');
  box.id = 'qhFinalToast';
  box.style.cssText = [
    'position:fixed',
    'right:24px',
    'bottom:24px',
    'z-index:9999',
    'background:#141822',
    'border:1px solid #2a3347',
    'border-radius:12px',
    'padding:12px 14px',
    'max-width:320px',
    'box-shadow:0 10px 30px rgba(0,0,0,.55)',
    'font-size:13px',
  ].join(';');

  box.innerHTML = [
    '<div style="font-weight:600;margin-bottom:4px;">清河大学官网有一条重要通知更新</div>',
    '<div style="color:#cfd3e1;margin-bottom:8px;">',
      '关于 2025-05-17 事件的后续说明已发布，可在首页“通知公告”中查看「',
      '关于 2025-05-17 事件相关资料归档说明（内部）」。',
    '</div>',
    '<div style="display:flex;justify-content:flex-end;gap:8px;">',
      '<a href="/index.html#noticeList" ',
         'style="padding:4px 10px;border-radius:999px;',
                'border:1px solid #3b82f6;background:#1f2937;',
                'color:#e8efff;text-decoration:none;font-size:12px;">前往查看</a>',
      '<button type="button" ',
         'style="background:transparent;border:none;',
                'color:#9aa7b7;font-size:12px;cursor:pointer;">关闭</button>',
    '</div>'
  ].join('');

  var btnClose = box.querySelector('button');
  btnClose.addEventListener('click', function(){
    if(box && box.parentNode) box.parentNode.removeChild(box);
  });

  document.body.appendChild(box);

  // 12 秒后自动消失
  setTimeout(function(){
    if(box && box.parentNode) box.parentNode.removeChild(box);
  }, 12000);
}

// 8）全站解锁检查：第一次满足条件时记日期 + 弹窗
function qhCheckFinalUnlock(){
  if(!qhCanShowFinalNotice()) return;

  // 只在“第一次满足条件”的那一刻触发
  var already = localStorage.getItem('qh_final_notice_unlocked');
  if(already === '1') {
    // 但仍然要确保首页那条通知的日期是稳定的
    qhUpdateFinalNotice();
    return;
  }

  // 第一次解锁：记下当天日期 & 标记已解锁
  var today = qhTodayStr();
  localStorage.setItem('qh_final_notice_unlocked', '1');
  localStorage.setItem('qh_final_notice_date', today);

  // 更新首页通知（如果当前正好在首页）
  qhUpdateFinalNotice();

  // 在当前页面弹出右下角提示
  qhShowFinalToast();
}

// 9）在页面加载时调用一次（所有引入 main.js 的页面都会执行）
document.addEventListener('DOMContentLoaded', function(){
  qhUpdateFinalNotice();   // 如果是首页，就更新那条 li 的显示和日期
  qhCheckFinalUnlock();    // 检查是否刚刚达成条件，需要弹窗
});

// 暴露给其他脚本用（例如 counseling.js 解锁顾的 note 后可以主动调用）
window.qhCheckFinalUnlock = qhCheckFinalUnlock;


/* ---------- 退出按钮兜底 ---------- */
function bindLogoutFallback(){
  const el = document.getElementById('btnLogout');
  if(!el) return;
  el.addEventListener('click', (ev)=>{
    ev.preventDefault();
    if(typeof logout === 'function') logout();
    if(typeof getAuth === 'function'){
      const a = getAuth();
      if(a) setCachedUnread(a.id, 0);
    }
    location.reload();
  });
}

/* ---------- 监听账号变化（跨页同步顶栏） ---------- */
let __lastAuthId = null;
function watchAuthChange(){
  if(typeof getAuth !== 'function') return;
  const a = getAuth();
  const cur = a ? a.id : null;
  if(cur !== __lastAuthId){
    __lastAuthId = cur;
    refreshUserBar();
  }
}

/* ---------- 绑定登录按钮（关键！） ---------- */
function bindLoginButton(){
  const btn = document.getElementById('btnLogin');
  if(!btn) return;
  btn.addEventListener('click', (e)=>{
    e.preventDefault();
    openLogin();
  });
}

/* ---------- 启动 ---------- */
document.addEventListener('DOMContentLoaded', ()=>{
  refreshUserBar();
  bindLoginButton();          // ← 这里把“学生登录”连上了
  bindLogoutFallback();
  setupAdminLinkGuard();
  setupGlobalTriggers();
  setupGlobalSearchBar();   // ★ 新增：绑定导航搜索框
  setupGlobalNavSearch();  // ✅ 全站导航搜索统一处理
  renderNews();
  setInterval(watchAuthChange, 800);
});
