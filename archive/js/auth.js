/* ===========================================
 * auth.js - 站点统一登录 / 鉴权
 *  - 支持邮箱或学号登录
 *  - 提供 getAuth / loginWith / logout / authSummary
 *  - 角色：student / teacher / staff / admin
 *  - 林澜账号封存：存在档案，但需“家属核验码”解锁后才能登录
 * =========================================== */

(function () {
  const STORAGE_KEY = 'qh_auth_v1';

  // 家属解锁标记：解锁页面验证成功后执行：
  // localStorage.setItem('qh_ll_family_unlock', '1');
  const LINLAN_UNLOCK_KEY = 'qh_ll_family_unlock';

  /* ---------- 用户表 ---------- */
  /** 统一用户库（关键：id 要和各 JS 中的 U-XXX 对上） */
  const USERS = [
    /* ===== 学生账号 ===== */
    {
      id: 'U-PLAYER',
      name: '林镜',                // 玩家（林澜妹妹）
      email: 'linjing@stu.qh.edu',
      sno: '2025A0917',
      role: 'student',
      password: 'qh-2025',
      major: '信息学部 · 人机交互方向（2025级）'
    },

    {
      id: 'U-LL',
      name: '林澜',
      email: 'lin.lan@stu.qh.edu',
      sno: '2021A0831',
      role: 'student',
      password: 'qh-2021',
      major: '信息学部 · 人机交互与认知计算（2021级）',
      loginDisabled: true    // 封存：默认不可登录（需家属解锁）
    },
    {
      id: 'U-GDM',
      name: '顾岱明',
      email: 'gdm@stu.qh.edu',
      sno: '2021D0001',
      role: 'student',
      password: 'Top12024',
      major: '信息学部 · 直博生（结构化记忆检索）'
    },
    {
      id: 'U-CSY',
      name: '陈思芸',
      email: 'chen.siyun@stu.qh.edu',
      sno: '2021A0421',
      role: 'student',
      password: 'psm2021A0421',
      major: '信息学部 · 本科生'
    },
    {
      id: 'U-CSY-ALT',            // 新邮箱账号
      name: '陈思芸（新邮箱）',
      email: 'chen_new@qh.com',
      sno: null,                  // 没有学号也可以
      role: 'student',
      password: 'psm2021A0421',
      locked: false               // 目前可正常登录
    },

    /* ===== 教师 / 职员 ===== */
    {
      id: 'U-SYH',
      name: '沈以航',
      email: 'shen.yh@qh.edu',
      role: 'teacher',
      password: 'MemViz404',
      dept: '信息学部 · 智能感知与交互实验室'
    },


    /* ===== 管理 / 运维账号（admin 权限） ===== */
    {
      id: 'U-ZGQ',
      name: '张国权',
      email: 'zhang.gq@qh.edu',
      role: 'admin',
      password: 'B-420190807',
      dept: '后勤保卫处 · B-4 楼管理员'
    },
  ];
  /** 检查封存账号是否允许临时解封（目前只对 U-LL 生效） */
  function canUseFrozenAccount(user) {
    if (!user || !user.loginDisabled) return true;

    // 目前只有林澜支持“家属核验码解封”
    if (user.id === 'U-LL') {
      try {
        return localStorage.getItem('qh_ll_family_unlock') === '1';
      } catch (e) {
        return false;
      }
    }
    // 其他封存账号一律不允许登录
    return false;
  }

  /** 方便按 email / 学号 快速查找 */
  const INDEX = {
    byEmail: {},
    bySno: {}
  };

  USERS.forEach(u => {
    if (u.email) INDEX.byEmail[u.email.toLowerCase()] = u;
    if (u.sno)   INDEX.bySno[(u.sno || '').toLowerCase()] = u;
  });

  /* ---------- 林澜账号：是否已家属解锁 ---------- */

  function isLinLanUnlocked() {
    try {
      return localStorage.getItem(LINLAN_UNLOCK_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  /* ---------- 基础存取 ---------- */

  function saveAuth(user) {
    if (!user) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        })
      );
    }
  }

  function getAuth() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);

      // 如果当前是林澜账号，但家属解锁标记已经不存在了，就视为已登出
      if (parsed && parsed.id === 'U-LL' && !isLinLanUnlocked()) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return parsed || null;
    } catch (e) {
      console.error('getAuth parse error', e);
      return null;
    }
  }

  function logout() {
    saveAuth(null);
  }

  function authSummary() {
    const a = getAuth();
    if (!a) return '未登录';
    return `${a.name || a.email}（${a.role || '未知角色'}）`;
  }

  /* ---------- 登录逻辑：邮箱 or 学号 ---------- */

  /**
   * identifier: 邮箱 或 学号（不区分大小写）
   * password  : 明文（演示版统一个 qh-2025）
   * 返回 { ok: boolean, msg?: string }
   */
  function loginWith(identifier, password) {
  const id  = (identifier || '').trim().toLowerCase();
  const pwd = (password   || '').trim();

  if (!id || !pwd) {
    return { ok: false, msg: '请输入账号和密码。' };
  }

  let user = INDEX.byEmail[id] || INDEX.bySno[id];
  if (!user) {
    return { ok: false, msg: '账号不存在，请检查邮箱或学号。' };
  }

  // ---------- 封存账号处理：目前只有林澜 ----------
  if (user.id === 'U-LL') {
    // 封存账号逻辑：默认不准登陆，除非通过“家属解封”标记放行
    if (user.loginDisabled && !canUseFrozenAccount(user)) {
      return {
        ok: false,
        msg: '该账号已按规定进行封存，如为家属，请先按规则生成核验码，在指定入口完成解锁后再登录。'
      };
    }
    // 如果已经通过 family-unlock 解封，则继续往下走（正常密码校验）
  } else {
    // 其他账号如将来也用 loginDisabled，则直接拦截
    if (user.loginDisabled) {
      return { ok: false, msg: '该账号已被禁用，无法登录。' };
    }
  }

  // ---------- 密码错误：在这里加“解谜提示” ----------
  if (user.password !== pwd) {
    let base  = '密码错误，请重试。';
    let extra = '';

    switch (user.id) {
      case 'U-GDM':
        // 顾岱明：引导想到“排名 + 某一年”
        extra = ' 提示：有的人最注重排名，只有第一才能够满足他';
        break;

      case 'U-CSY':
        // 陈思芸：引导想到“失败次数 + 自己的编号”
        extra = ' 提示：也有人喜欢把说的最多的话和自己的学号拼在一起当密码。';
        break;

      case 'U-SYH':
        // 沈以航：引导想到“项目简称 + 教室房间号”
        extra = ' 提示：实验室里常见的弱密码，是用最重要的项目简称再加上房间号。';
        break;

      case 'U-ZGQ':
        // 张国权：引导想到“自己值守的楼栋/位置 + 某个日子”
        extra = ' 提示：有些人会拿自己常值守的地点和某个重要的日子凑成密码。';
        break;

      default:
        extra = '';
    }

    return { ok: false, msg: base + extra };
  }

  // ---------- 密码正确：登录成功，增加登录计数 ----------
  try {
    const k   = 'qh_login_count_' + user.id;
    const cur = Number(localStorage.getItem(k) || '0');
    localStorage.setItem(k, String(cur + 1));
  } catch (e) {
    console.warn('login count save error', e);
  }

  // 登录成功：只保存必要字段
  saveAuth(user);
  return { ok: true };
}


  /* ---------- 对外暴露 ---------- */
  window.getAuth = getAuth;
  window.loginWith = loginWith;
  window.logout = logout;
  window.authSummary = authSummary;

})();
