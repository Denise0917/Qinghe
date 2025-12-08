/* =========================
 * counseling.js - 学生心理中心预约（仅学生账号可见）
 * ========================= */

(function(){
  const $  = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));

  // ------- 预约记录数据（按账号 ID） -------
  // 账号 ID 与 auth.js 保持一致
  // 仅记录“时间 / 形式 / 状态 / 系统备注”，不写具体谈话内容
  const COUNSEL_DATA = {
    // 玩家（妹妹）账号
    'U-PLAYER': [

    ],

    // 林澜
    'U-LL': [
      {
        time: '2024-04-28 20:00',
        mode: '个体面谈（实验区学生专场）',
        status: '已完成',
        note: '主诉与科研进度、夜间实验节奏相关的疲惫感及对未来的不确定。辅导老师建议适度调整实验负荷、与导师沟通作息安排。'
      },
      {
        time: '2024-12-12 21:10',
        mode: '个体面谈',
        status: '已完成',
        note: '来访者宿舍关系不融洽。'
      },
      {
        time: '2025-05-12 21:10',
        mode: '个体面谈',
        status: '已完成',
        note: '来访者提出其导师对她进行 pua 压迫，想更换导师。'
      }
    ],

    // 顾岱明
    'U-GDM': [
      {
        time: '2025-05-10 18:30',
        mode: '个体面谈（预约）',
        status: '已完成',
        note:
          '会谈中多次提到一位实验室女同学，言语里带有“明明我已经够优秀了，她为什么还是不选我”“是不是所有人都只看表面成绩”之类的疑问，' +
          '伴随强烈的被比较感与委屈情绪。辅导老师引导其区分事实与猜测，识别“非黑即白”“只盯着输赢”的思维模式，' +
          '并建议通过规律作息、适度降低刷题与项目强度，尝试在宿舍和同学建立更多非竞赛话题的连接。'
      }
    ],

    // 陈思芸（含一条加锁记录）
    'U-CSY': [
      {
        time: '2025-05-14 16:00',
        mode: '个体面谈（预约）',
        status: '已完成',
        note: '因奖学金评定结果产生明显情绪波动。辅导老师建议增加情绪表达渠道并尝试与相关同学沟通。'
      },
      {
        time: '2025-05-19 16:00',
        mode: '个体面谈（预约）',
        status: '已完成',
        locked: true,          // 👈 加锁的那条
        passKey: '9958',       // 👈 解锁口令（玩家输入）
        note: '来访者自述：不是我推下去的，是他推的，是他，是他！不是我！我只是躲在旁边看到的！啊————'
      },
      {
        time: '2024-10-09 19:30',
        mode: '团体辅导（适应性工作坊）',
        status: '已完成',
        note: '参加“学业与自我期待”主题团体，能在小组讨论中分享观点，但对个人反馈较为敏感。'
      }
    ]

    // 若后面要给其他学生账号加记录，可以继续扩展…
  };

  function statusClass(status){
    switch(status){
      case '已完成': return 'status-finished';
      case '未到访': return 'status-cancel';
      default:       return 'status-booked';
    }
  }

  // ------- 渲染表格（含 🔐 按钮） -------
  function renderTableFor(uid){
    const tbody = $('#cTableBody');
    if(!tbody) return;

    const list = (COUNSEL_DATA[uid] || []).slice().sort((a,b)=> b.time.localeCompare(a.time));

    if(!list.length){
      tbody.innerHTML = `<tr><td colspan="4" class="muted small">当前账号暂无心理预约记录。如有需要，可通过本系统发起预约。</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(r=>{
      const statusCls = statusClass(r.status);
      const locked    = !!r.locked;

      let noteCellHtml;
      if (locked){
        // 🔐 加锁模式：渲染一个按钮，真正内容放在 data-note 里
        noteCellHtml = `
          <button
            type="button"
            class="btn small"
            data-action="unlock-note"
            data-key="${r.passKey || ''}"
            data-note="${encodeURIComponent(r.note || '')}"
          >🔐 点击解锁</button>
        `;
      } else {
        // 普通模式：直接显示备注
        noteCellHtml = `<div class="reason">${r.note || ''}</div>`;
      }

      return `
        <tr>
          <td>${r.time}</td>
          <td>${r.mode}</td>
          <td class="${statusCls}">${r.status}</td>
          <td>${noteCellHtml}</td>
        </tr>
      `;
    }).join('');
  }

  // ------- 访问控制 & 初始化 -------
  let lastAuthId = null;

  function applyAccess(){
    const accessCard = $('#cAccessCard');
    const mainCard   = $('#cMainCard');
    const accessMsg  = $('#cAccessMsg');
    const btnLogin   = $('#cBtnLogin');
    const userSpan   = $('#cUser');
    const roleTag    = $('#cRoleTag');

    const auth = (typeof getAuth === 'function') ? getAuth() : null;

    if(!auth){
      // 未登录
      accessCard && accessCard.classList.remove('hidden');
      mainCard   && mainCard.classList.add('hidden');
      if(accessMsg){
        accessMsg.textContent = '本系统仅向在校学生开放，请先登录学生账号。';
      }
      if(btnLogin && !btnLogin._bind){
        btnLogin._bind = true;
        btnLogin.addEventListener('click', ()=>{
          if(typeof openLogin === 'function') openLogin();
        });
      }
      return;
    }

    // 已登录但不是学生
    if(auth.role !== 'student'){
      accessCard && accessCard.classList.remove('hidden');
      mainCard   && mainCard.classList.add('hidden');
      if(accessMsg){
        accessMsg.innerHTML = `
          当前账号：<strong>${auth.email}</strong><br/>
          身份：<strong>${auth.role || '非学生'}</strong>。学生心理中心预约系统仅向在校学生开放。
        `;
      }
      if(btnLogin){
        btnLogin.textContent = '切换为学生账号';
        if(!btnLogin._bind){
          btnLogin._bind = true;
          btnLogin.addEventListener('click', ()=>{
            if(typeof openLogin === 'function') openLogin();
          });
        }
      }
      return;
    }

    // 学生账号 → 显示主界面
    accessCard && accessCard.classList.add('hidden');
    mainCard   && mainCard.classList.remove('hidden');

    if(userSpan) userSpan.textContent = auth.email;
    if(roleTag)  roleTag.textContent  = '在校学生';

    renderTableFor(auth.id);
  }

  function watchAuth(){
    const auth = (typeof getAuth === 'function') ? getAuth() : null;
    const cur = auth ? auth.id : null;
    if(cur !== lastAuthId){
      lastAuthId = cur;
      applyAccess();
    }
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    applyAccess();
    // 登录 / 切换账号后自动刷新视图
    setInterval(watchAuth, 800);
  });

  // ------- 解锁弹窗 & 按钮监听 -------

  // 简单的解锁弹窗（自己画一个小对话框）
  // expectedKey：正确口令
  // onSuccess：解锁成功后要做的事（回调）
  function showUnlockDialog(expectedKey, onSuccess){
    const mask = document.createElement('div');
    mask.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:9999;';
    mask.innerHTML = `
      <div style="width:360px;background:#141822;border:1px solid #202636;border-radius:12px;padding:16px;">
        <h3 style="margin:0 0 8px;">解锁记录</h3>
        <p class="small">此条记录为加锁备注，需要输入解锁口令。</p >
        <p class="small muted" style="margin:4px 0 8px;">提示：口令通常藏在邮件或其他线索中，为四位数字。</p >
        <input id="unlockInput" class="input" type="text" placeholder="请输入解锁口令（可见）"/>
        <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end;">
          <button class="btn" data-k="cancel">取消</button>
          <button class="btn primary" data-k="ok">解锁</button>
        </div>
      </div>
    `;

    document.body.appendChild(mask);

    const input     = mask.querySelector('#unlockInput');
    const btnOk     = mask.querySelector('[data-k="ok"]');
    const btnCancel = mask.querySelector('[data-k="cancel"]');

    function close(){
      if(mask && mask.parentNode){
        mask.parentNode.removeChild(mask);
      }
    }

    btnCancel.onclick = ()=> close();

    btnOk.onclick = ()=>{
      const val = (input.value || '').trim();

      const normVal = val.toLowerCase();
      const normKey = (expectedKey || '').trim().toLowerCase();

      if(!normKey || normVal === normKey){
        close();
        if(typeof onSuccess === 'function') onSuccess();
        if(typeof showToast === 'function'){
          showToast('记录已解锁',{type:'ok'});
        }
      }else{
        if(typeof showToast === 'function'){
          showToast('口令错误',{type:'warn'});
        }else{
          alert('口令错误');
        }
      }
    };
  }

  // 监听“🔐 点击解锁”按钮
  document.addEventListener('click', function(e){
    const btn = e.target.closest('[data-action="unlock-note"]');
    if(!btn) return;

    e.preventDefault();

    const key  = btn.dataset.key || '';
    const note = decodeURIComponent(btn.dataset.note || '');
    const cell = btn.parentElement;

    showUnlockDialog(key, function(){
      // ✅ 解锁成功：把按钮替换成真正的备注内容
      cell.innerHTML = `<div class="reason">${note}</div>`;

      // ✅ 这里记一个 flag，供 main.js 判定“最终结局条件”
      // 名字沿用之前的 qh_flag_counsel_gdm_unlock，避免你再去改 main.js
      try{
        localStorage.setItem('qh_flag_counsel_gdm_unlock', '1');
        if(typeof window.qhCheckFinalUnlock === 'function'){
          window.qhCheckFinalUnlock();
        }
      }catch(err){
        console.warn('set counsel unlock flag error', err);
      }
    });
  });

})();
