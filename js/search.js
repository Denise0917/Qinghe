/* =========================
 * search.js - 站内搜索索引 + 简单搜索 + 结果密码弹窗验证
 * ========================= */

(function () {
  // ===== 1. 站内索引（除导航主栏目页之外） =====
  const INDEX = [
    {
      title: "关于 2025-05-17 事件的情况通报（最终）",
      url: "notices/20250518_notice.html",
      tags: ["通报", "B-4", "坠楼", "事件", "调查", "官方"],
      text: "清河大学就 2025 年 5 月 17 日发生在 B-4 楼的学生坠楼事件发布最终情况通报，概述公安机关调查结论、学校配合情况及后续工作安排，并再次提醒同学关注心理健康与安全规范。"
    },

    {
      title: "信息化中心：B-4 楼当晚维护日志（节选）",
      url: "it/maintenance_20250517_admin.html",
      tags: ["信息化中心", "维护日志", "B-4", "网络", "监控", "管理员"],
      text: "信息化中心值班工程师记录 2025-05-17 夜间 B-4 楼网络及监控系统维护情况，包括 21:30 左右监控中断、22:00 恢复、设备重启工单编号等，仅管理员账号可查看完整内容。"
    },

    {
      title: "保卫处：B-4 门禁刷卡记录（节选）",
      url: "security/access_20250517.html",
      tags: ["保卫处", "门禁", "刷卡记录", "B-4", "管理员", "安保"],
      text: "保卫处从门禁系统导出的 2025-05-17 B-4 楼部分刷卡记录，显示学生与管理员的进出时间，以及 22:19 由“主卡”开启 B-4-231 教室的操作信息，仅管理员账号可访问。"
    },

    {
      title: "清河大学 2025 级新生开学典礼举行",
      url: "notices/20250901_opening.html",
      tags: ["开学典礼", "新生", "沈以航", "顾岱明", "发言", "仪式"],
      text: "报告 2025 级新生开学典礼在清河大学举行的整体情况，校领导致辞、学院代表发言，沈以航作为教师代表讲话，顾岱明作为学生代表发言，提到科研训练、实验室文化与自我要求等内容。"
    },

    {
      title: "学生心理中心开通“心理支持专线”",
      url: "notices/20250519_counseling.html",
      tags: ["心理中心", "心理支持", "热线", "事件", "辅导"],
      text: "学生心理中心发布通知，面向全体学生开通心理支持专线和线上预约渠道，介绍服务时间、预约方式及保密原则，并附“学业与心理自助手册”下载链接。"
    },

    {
      title: "学业与心理自助手册（PDF）",
      url: "notices/files/QHU_SelfHelp_Manual_2025.pdf",
      tags: ["心理自助", "压力管理", "情绪", "睡眠", "学习方法"],
      text: "《清河大学学业与心理自助手册 2025》电子版，介绍常见学习压力与情绪反应，提供自我评估清单、呼吸放松训练、睡眠与作息调整建议以及寻求专业帮助的流程与校园资源。"
    },

    {
      title: "“记忆可视化接口”获优秀实践项目",
      url: "notices/memviz_interface.html",
      tags: ["项目", "记忆可视化接口", "沈以航", "实验室", "多模态交互"],
      text: "介绍由沈以航教授团队负责的“记忆可视化接口”实践项目，项目依托智能感知与交互实验室，在结构化记忆建模、多模态交互可视化方面取得阶段性成果，获得校级优秀实践项目。"
    },

    {
      title: "可信人机交互课程改革试点结题",
      url: "notices/trust_hci_course.html",
      tags: ["课程改革", "可信人机交互", "沈以航", "教学", "结题"],
      text: "教学改革项目结题介绍，围绕“可信人机交互”课程建设，说明课程内容更新、项目式教学设计、与实验室项目结合等改革措施，并提及参与学生在竞赛和论文上的成果。"
    },

    {
      title: "多项编程竞赛学生获奖",
      url: "notices/20250506_contest_award.html",
      tags: ["竞赛", "程序设计", "顾岱明", "林澜", "沈以航", "获奖"],
      text: "信息学部师生在多项编程与算法竞赛中取得佳绩，报道顾岱明、林澜等学生获奖情况，并提到指导教师沈以航在训练和选拔中的组织工作。"
    },

    {
      title: "清河大学与清河市政府签署战略合作协议",
      url: "notices/20250820_gov_coop.html",
      tags: ["合作", "政府", "战略协议", "产学研", "实践基地"],
      text: "学校与清河市政府签署战略合作协议，围绕城市数字化治理、智慧安防、青年实践基地等方向开展合作，提及信息学部在数据平台、城市感知项目中的参与。"
    },

    {
      title: "暑期社会实践团队返校汇报",
      url: "notices/20250805_social_practice.html",
      tags: ["社会实践", "暑期", "实践团队", "知行", "育人"],
      text: "总结 2025 年暑期“知行中华”社会实践各团队的调研行程与成果展示，强调知行合一、服务国家战略的育人目标，同时简要介绍信息学部实践队在数据调查与社区服务方面的案例。"
    },

    {
      title: "奖学金申报系统",
      url: "scholarship.html",
      tags: ["奖学金", "国家奖学金", "综合奖学金", "顾岱明", "林澜"],
      text: "清河大学奖学金申报与评定系统，仅在校学生登录可见。不同账号可查看本人历年奖学金申请与评定结果：包括顾岱明获得国家奖学金及“卓越创新”奖学金，林澜的综合一等奖与科研专项奖学金，以及陈思芸多次未通过的申请记录与官方评语。"
    },

    {
      title: "学生心理中心预约系统",
      url: "counseling.html",
      tags: ["心理中心", "预约", "辅导记录", "压力", "情绪"],
      text: "学生心理中心的预约与记录查询界面，仅学生账号可访问。不同账号可见自己的历史预约记录与形式，如个体面谈、团体辅导、线上自评量表等，系统只显示时间、形式和状态，不展示谈话内容。"
    },

    {
      title: "校园邮箱 / VPN 入口",
      url: "inbox.html",
      tags: ["邮箱", "收件箱", "VPN", "通知", "系统邮件"],
      text: "清河大学统一身份认证后进入的校园邮箱界面。不同账号看到各自的邮件：包括系统通知、实验室安排、门禁异常提醒、心理中心预约提醒等，与游戏线索密切相关。"
    },

    {
      title: "智能感知与交互实验室 - 导师与学生档案",
      url: "research.html",
      tags: ["实验室", "导师", "沈以航", "顾岱明", "林澜", "科研档案"],
      text: "信息学部科研页面中的实验室档案板块，集中展示沈以航教授的研究方向与项目，以及顾岱明、林澜等学生的科研轨迹和论文简介。"
    },

    {
      title: "信息化中心值班邮箱",
      url: "mailto:itops@qh.edu",
      tags: ["邮箱", "信息化中心", "itops", "值班"],
      text: "信息化中心值班邮箱 itops@qh.edu，经常出现在维护日志和系统提醒中，用于反馈网络及门禁系统异常。"
    },

    {
      title: "保卫处管理员邮箱",
      url: "mailto:zhang.gq@qh.edu",
      tags: ["邮箱", "保卫处", "管理员", "张国权"],
      text: "保卫处管理员张国权使用的工作邮箱 zhang.gq@qh.edu，张国权于2019年8月7日被聘为保卫处管理员，主要负责区域为B-4，经常被学生投诉。"
    },

    {
      title: "2021级信息学部女生宿舍安排",
      url: "archive/dorm_2021_ll.html",
      tags: ["林澜","宿舍","西苑3栋","412","舍友","陈思芸","宿舍号"],
      text: "2021级信息学部新生宿舍入住安排表，包含西苑3栋412宿舍。"
    },

    {
      title: "备忘录- 陈思芸",
      url: "archive/csy_memo.html",
      tags: ["陈思芸","奖学金","压力","自我否定","心理"],
      text: "思芸写给自己的深夜备忘录，提到奖学金落选、自我怀疑。"
    },

    {
      title: "【手写备忘】",
      url: "archive/secret_search.html",
      tags: ["备忘录","线索","陈思芸","手写","恐怖"],
      text: ""
    },
    {
  title: "清河校园墙：顾岱明 & 林澜是不是在一起？",
  url: "archive/campus_wall_gdm_ll.html",
  tags: ["校园墙","八卦","CP","匿名帖子"],
  text: "校园墙上一则高热度八卦帖。"
},
{
  title: "避雷贴：关于信息学部某“王牌”导师的提醒",
  url: "archive/campus_wall_warn_shen.html",
  tags: ["避雷","导师"],
  text: "匿名避雷贴，男生当工具人、女生被反复单独约谈,慎选！！！！！！！！"
},
{
  title: "顾岱明个人备忘",
  url: "archive/gdm_memo.html",
  tags: ["顾岱明","备忘录","极端","偏执","情绪"],
  text: "一份疑似顾岱明写下、又从未发出的个人备忘草稿。"
},
{
  title: "关于保卫处个别工作人员行为的情况反映",
  url: "archive/complaint_zgq_20250305.html",
  tags: ["投诉","保卫处","女学生","安全"],
  text: "一名在校女学生通过校园安全投诉平台匿名反映，在从图书馆回宿舍必经的 B-4 楼附近多次被保卫人员长时间盯视，并听到带有物化和贬低女性色彩的言论，请学校予以调查处理。"
},
{
  title: "张国权个人备忘（未发送草稿）",
  url: "archive/zgq_self_note.html",
  tags: ["自述","B-4","监控","投诉"],
  text: "疑似由保卫处职工张某在值班电脑上留下的个人备忘草稿，承认多次配合关闭 B-4 附近监控、对女学生抱有不当念头，并对匿名投诉表达强烈不满。"
},
{
  title: "关于公布 2025 届推免及直博拟录取名单的通知",
  url: "notices/20250915_recommendation_list.html",
  tags: ["推免", "保研"],
  text: "公布清河大学 2025 届优秀应届本科毕业生推免硕士研究生及本校直博生拟录取名单。"
},
{
  title: "《学生账号封存与家属阅览说明》",
  url: "archive/20250601_account_freeze.html",
  tags: ["账号封存", "学生账号封存与家属阅览说明"],
  text: "说明学生账号在特殊事件后的封存规则和家属核验码生成方式，并提供家属解封入口链接。"
},

{
  title: "《实验室夜间使用规范（2020 修订）》",
  url: "/notices/20200901_lab_night_rules.html",
  tags: ["实验室", "规范"],
  text: "实验室遵守细则，开放时段和管理要求。"
},
{
  title: "自杀事件相关文档",
  url: "archive/old_case_testimony.html",
  tags: ["自杀事件","自杀","案例"],
  text: "一名自杀的学生，在心理服务系统中留下的长篇自述，这也是她的遗书。"
},
{
  title: "关于部分教职工岗位调整及聘用关系的通知",
  url: "notices/20250620_staff_changes.html",
  tags: ["人事", "教职工", "岗位调整", "解聘", "张国权"],
  text: "通报 2025 年上半年部分教职工续聘、调任及解除聘用关系的情况。"
},







  ];

  // ===== 1.1 结果密码表：哪些条目需要密码，写在这里 =====
  // key 必须和上面 INDEX 里的 url 完全一致
  const PASSWORD_GUARD = {
    // 示例：给“手写备忘录”加 4 位数字密码
    "archive/secret_search.html": {
      password: "顾岱明",
      hint: "我喜欢的人的名字："   // 弹窗里的提示文字
    },
    "archive/gdm_memo.html": {
      password: "Top1",
      hint: "请输入四位字符密码："   // 弹窗里的提示文字
    },
    "archive/zgq_self_note.html": {
      password: "0620",
      hint: "数据恢复于张国权离职当天（请输入四位数字密码）。"   // 弹窗里的提示文字
    }

    // 再举例：如果你要给门禁记录也上锁，就加一条：
    // "security/access_20250517.html": {
    //   password: "B4-2219",
    //   hint: "输入门禁值班口令："
    // }
  };

  // 对外暴露索引，方便你在其它脚本里复用
  window.SEARCH_INDEX = INDEX;

  // ===== 2. 简单搜索实现（按 title + tags + text 模糊匹配） =====
  function normalize(str) {
    return (str || "").toLowerCase();
  }

  function matchItem(item, keywords) {
    const haystack = normalize(
      item.title + " " + (item.tags || []).join(" ") + " " + (item.text || "")
    );
    let score = 0;
    for (const kw of keywords) {
      if (!kw) continue;
      if (haystack.includes(kw)) score++;
    }
    return score;
  }

  function searchSite(query) {
    const q = (query || "").trim().toLowerCase();
    if (!q) return [];
    const keywords = q.split(/\s+/).filter(Boolean);

    return INDEX
      .map((item) => ({
        item,
        score: matchItem(item, keywords)
      }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.item);
  }

  window.searchSite = searchSite;

  // ===== 3. 渲染 search.html 结果列表 =====
  function renderIfSearchPage() {
    const box = document.getElementById("searchResults");
    if (!box) return;

    const params = new URLSearchParams(location.search);
    const q = params.get("q") || "";

    const input = document.getElementById("searchQuery");
    if (input) input.value = q;

    if (!q.trim()) {
      box.innerHTML =
        '<div class="muted small">请输入关键词，例如：<code>B-4</code>、<code>门禁</code>、<code>奖学金</code>、<code>心理中心</code> 等。</div>';
      return;
    }

    const results = searchSite(q);

    if (!results.length) {
      box.innerHTML =
        `<div class="muted small">未找到与“${q}”相关的内容，可以尝试更换或简化关键词。</div>`;
      return;
    }

    box.innerHTML = results
      .map((r) => {
        const guard = PASSWORD_GUARD[r.url];
        const lockedTag = guard
          ? `<span class="tag" style="border-color:#b45309;background:#451a03;color:#fed7aa;">需密码</span>`
          : "";
        const tagsHtml = (r.tags || [])
          .map((t) => `<span class="tag">${t}</span>`)
          .join(" ");

        const href = guard ? "#" : r.url;

        return `
      <div class="search-item">
        <div class="title">
          <a href="${href}"
             class="result-link"
             data-url="${r.url}"
             ${guard ? 'data-guard="1"' : ""}>
             ${r.title}
          </a>
        </div>
        <div class="meta">
          ${lockedTag}
          ${tagsHtml}
        </div>
        <div class="snippet">${r.text}</div>
      </div>`;
      })
      .join("");
  }

  // ===== 4. 自己画一个密码弹窗 =====
  function ensurePwModal() {
    let mask = document.getElementById("qhPwMask");
    if (mask) return mask;

    mask = document.createElement("div");
    mask.id = "qhPwMask";
    mask.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,.55);display:none;align-items:center;justify-content:center;z-index:9999;";

    mask.innerHTML = `
      <div class="qh-modal" style="width:380px;background:#141822;border:1px solid #202636;border-radius:12px;padding:16px;">
        <h3 style="margin:0 0 8px;font-size:18px;">访问验证</h3>
        <p id="qhPwHint" class="small" style="margin:0 0 8px;color:#dbe1ea;"></p>
        <input id="qhPwInput" type="password"
               class="input"
               placeholder="请输入密码"
               style="margin-top:4px;width:100%;box-sizing:border-box;">
        <div id="qhPwError"
             class="small"
             style="margin-top:6px;color:#f97373;display:none;">
          密码错误，无法访问此内容。
        </div>
        <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end;">
          <button class="btn" data-k="cancel">取消</button>
          <button class="btn primary" data-k="ok">确定</button>
        </div>
      </div>
    `;

    document.body.appendChild(mask);

    const input = mask.querySelector("#qhPwInput");
    const err   = mask.querySelector("#qhPwError");
    const hint  = mask.querySelector("#qhPwHint");
    const btnOk = mask.querySelector('[data-k="ok"]');
    const btnCancel = mask.querySelector('[data-k="cancel"]');

    function close() {
      mask.style.display = "none";
      mask.dataset.url = "";
      input.value = "";
      err.style.display = "none";
    }

    // 点击遮罩空白处关闭
    mask.addEventListener("click", (e) => {
      if (e.target === mask) close();
    });

    // 确定按钮
    if (!btnOk._bind) {
      btnOk._bind = true;
      btnOk.addEventListener("click", () => {
        const url = mask.dataset.url;
        const g = PASSWORD_GUARD[url];
        if (!g) {
          close();
          return;
        }
        const val = (input.value || "").trim();
        if (val === g.password) {
          close();
          location.href = url;
        } else {
          err.style.display = "block";
          if (typeof showToast === "function") {
            showToast("密码错误，无法访问此内容。", { type: "error" });
          }
        }
      });
    }

    // 取消按钮
    if (!btnCancel._bind) {
      btnCancel._bind = true;
      btnCancel.addEventListener("click", () => {
        close();
      });
    }

    // 按 Enter 也触发确定
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        btnOk.click();
      }
    });

    // 暴露一些方便设置提示的引用
    mask._input = input;
    mask._error = err;
    mask._hint  = hint;
    mask._close = close;

    return mask;
  }

  function openPwModal(url, guard) {
    const mask = ensurePwModal();
    const input = mask._input;
    const err   = mask._error;
    const hint  = mask._hint;

    mask.dataset.url = url;
    hint.textContent = guard.hint || "请输入访问密码：";
    err.style.display = "none";
    input.value = "";

    mask.style.display = "flex";
    setTimeout(() => { input.focus(); }, 10);
  }

  // ===== 5. 结果点击拦截：有密码的用弹窗验证 =====
  function setupSearchResultGuard() {
    const box = document.getElementById("searchResults");
    if (!box) return;

    box.addEventListener("click", (e) => {
      const a = e.target.closest("a.result-link");
      if (!a) return;

      const url = a.dataset.url || a.getAttribute("href") || "";
      const guard = PASSWORD_GUARD[url];

      // 没有密码保护 → 正常跳转
      if (!guard) {
        if (url && url !== "#") {
          e.preventDefault();
          location.href = url;
        }
        return;
      }

      // 有密码保护 → 弹出密码框
      e.preventDefault();
      openPwModal(url, guard);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderIfSearchPage();
    setupSearchResultGuard();
  });
})();
