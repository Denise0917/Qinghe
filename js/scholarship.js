/* =========================
 * scholarship.js - 奖学金申报与评定（仅学生账号可见）
 * ========================= */

(function(){
  const $  = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));

  // ------- 奖学金数据（按账号 ID） -------
  // 账号 ID 必须和 auth.js 里保持一致：U-GDM / U-LL / U-CSY / U-PLAYER 等
  const SCH_DATA = {
    // 玩家（妹妹）账号：普通学生，给一点背景就好
    'U-PLAYER': [
    ],

    // 顾岱明：国家奖学金 + 校级高额奖学金
    'U-GDM': [
      {
        year: '2024–2025',
        type: '国家奖学金',
        amount: 20000,
        status: '通过',
        reason: '综合测评排名专业第 1；以第一作者在 CCF 推荐期刊发表论文 2 篇，获得省级程序设计竞赛团体一等奖，经导师及学院推荐通过评审。'
      },
      {
        year: '2023–2024',
        type: '学校优秀奖学金',
        amount: 10000,
        status: '通过',
        reason: '在清河市获取“优秀学生”称号'
      },
      {
        year: '2022–2023',
        type: '学校“卓越创新”奖学金',
        amount: 15000,
        status: '通过',
        reason: '在“结构化记忆检索”相关项目中担任核心成员，完成关键算法模块，实现系统原型落地。'
      },
      {
        year: '2021–2022',
        type: '国家奖学金',
        amount: 20000,
        status: '通过',
        reason: '课程成绩优异，多门专业核心课成绩 90 分以上，担任算法训练营主力队员。'
      }
    ],

    // 林澜：校级一等奖 + 科研奖学金，原因里强调沈的项目
    'U-LL': [
      {
        year: '2024–2025',
        type: '学校综合一等奖学金',
        amount: 15000,
        status: '通过',
        reason: '综合测评排名专业前 3；参与“记忆可视化接口”实践项目并获省级优秀实践项目，由导师沈以航推荐。'
      },
      {
        year: '2024–2025',
        type: '科研创新专项奖学金',
        amount: 15000,
        status: '通过',
        reason: '以第二作者身份参与发表多模态交互可靠性验证方向论文，完成大部分实验数据标注与日志整理工作。'
      },
      {
        year: '2023–2024',
        type: '学校学业奖学金',
        amount: 10000,
        status: '通过',
        reason: '课程平均绩点优秀，长期担任实验课助教，课堂表现和综合素质评价良好。'
      }
    ],

    // 陈思芸：多次申请均未通过，理由很“官方”
    'U-CSY': [
      {
        year: '2024–2025',
        type: '学校综合一等奖学金',
        amount: 6000,
        status: '未通过',
        reason: '综合测评排名未进入学院前 20%；科研竞赛成果栏为空，导师推荐意见为“暂不建议申报综合一等奖学金”。'
      },
      {
        year: '2024–2025',
        type: '学校“卓越创新”奖学金',
        amount: 5000,
        status: '未通过',
        reason: '未提交可佐证的科研创新成果材料，项目经历与奖项要求不完全匹配。'
      },
      {
        year: '2023–2024',
        type: '学院奖学金',
        amount: 8000,
        status: '未通过',
        reason: '导师评审未通过'
      },
      {
        year: '2022–2023',
        type: '学校学业奖学金',
        amount: 10000,
        status: '未通过',
        reason: '同专业申请人数较多，按评定细则优先支持有竞赛和科研成果的同学，本人加分项较少。'
      },
      {
        year: '2021–2022',
        type: '国家奖学金',
        amount: 20000,
        status: '未通过',
        reason: '同专业申请人数较多，按评定细则优先选择排名靠前的同学。'
      }
    ],

    // 其他学生（如果有）可以按需再加
    // …… 
  };

  function statusClass(st){
    if(st === '通过') return 'status-ok';
    if(st === '未通过') return 'status-fail';
    return 'status-pending';
  }

  // ------- 渲染表格 -------
  function renderTableFor(uid){
    const tbody = $('#schTableBody');
    if(!tbody) return;
    const list = (SCH_DATA[uid] || []).slice().sort((a,b)=> b.year.localeCompare(a.year));
    if(!list.length){
      tbody.innerHTML = `<tr><td colspan="5" class="muted small">当前账号暂无奖学金申请记录。</td></tr>`;
      return;
    }
    tbody.innerHTML = list.map(r=>`
      <tr>
        <td>${r.year}</td>
        <td>${r.type}</td>
        <td>${r.amount.toLocaleString()}</td>
        <td class="${statusClass(r.status)}">${r.status}</td>
        <td><div class="reason">${r.reason}</div></td>
      </tr>
    `).join('');
  }

  // ------- 访问控制 & 初始化 -------
  let lastAuthId = null;

  function applyAccess(){
    const accessCard = $('#schAccessCard');
    const mainCard   = $('#schMainCard');
    const accessMsg  = $('#schAccessMsg');
    const btnLogin   = $('#schBtnLogin');
    const userSpan   = $('#schUser');
    const roleTag    = $('#schRoleTag');

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

    // 已登录，但非学生
    if(auth.role !== 'student'){
      accessCard && accessCard.classList.remove('hidden');
      mainCard   && mainCard.classList.add('hidden');
      if(accessMsg){
        accessMsg.innerHTML = `
          当前账号：<strong>${auth.email}</strong><br/>
          身份：<strong>${auth.role || '非学生'}</strong>。本系统仅向在校学生开放，您暂无查看权限。
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
    setInterval(watchAuth, 800);   // 登录 / 切换账号后自动刷新视图
  });

})();
