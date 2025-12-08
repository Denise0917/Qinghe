/* =========================
 * inbox.js - 私人邮箱（与登录状态强绑定；内嵌数据）
 *  - 支持按登录次数逐步解锁邮件（ARG 用）
 * ========================= */
(function(){
  const KEY_READ_PREFIX   = 'qh_mail_read_';
  const KEY_STAR_PREFIX   = 'qh_mail_star_';
  const KEY_UNLOCK_PREFIX = 'qh_mail_unlocked_';   // 已解锁的分阶段邮件 ID
  const POLL_MS = 300;

  const $  = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));

  // 从 auth.js 写入的登录次数里读取
  function getLoginCountFor(uid){
    const k = 'qh_login_count_' + uid;
    const n = Number(localStorage.getItem(k) || '0');
    return Number.isFinite(n) ? n : 0;
  }

  /* -----------------------------------
   * 1. 基础邮件（每次登录都会有）
   *    👉 你把原来给各个账号写的邮件都放到这里
   * ----------------------------------- */
  const BASE_MAILS = {
     'U-GDM': [
{
  id:'m_g_love01',
  folder:'inbox',
  from:'一楼自习室的学妹 <anon1@stu.qh.edu>',
  subject:'第一次在自习室看到你',
  date:'2022-10-08 22:14',
  starred:false,
  body:`学长你好：

其实我也不知道该怎么称呼你，只知道大家都叫你“顾神”。

第一次注意到你，是新生刚报到那阵子，在信息学部一楼自习室。  
那天晚上已经快 22:00 了，很多人都走了，你还一个人坐在靠窗的位置，  
桌上摊着一大摞算法题草稿，旁边是被你捏得皱巴巴的矿泉水瓶。

我本来只是想借个插线板，结果站在你旁边好久你都没发现我，  
我就看见你一直在写、划掉、再写，试了一遍又一遍。  
突然有点理解大家为什么说“学霸是这么长出来的”。

后面才从同班同学那里听说，你是 ACM 队里已经预定的主力，  
好像从高中开始就一路拿奖到现在。  
听起来好像离我很远，但又…每天在楼道里都能碰到你，  
有时候觉得你和别人不一样的地方，好像也只是“比别人更认真一点”。

总之，只是想跟你说一句：  
每次经过那扇窗的时候，看见灯下还坐着你，心里就会莫名觉得安心一点。

祝你今年的比赛顺利。  
—— 一楼自习室总是坐在第二排的小透明`
},
{
  id:'m_g_love02',
  folder:'inbox',
  from:'匿名 <wall-2023@stu.qh.edu>',
  subject:'如果你也会累的话，就眨眨眼吧',
  date:'2023-03-15 23:01',
  starred:true,
  body:`顾：

今天在操场外圈看到你一个人慢跑。  
我们学院的运动场灯到 22:30 会关一半，你还是照常跑完了四圈。

大家都只看到“顾岱明又拿了什么奖”“顾岱明又进了什么队”，  
但大多数人不知道的是，你好像从来没有真正休息过一天。

有人说你是“天才”，我倒是更相信你只是把本来应该分散的一点点快乐，  
都拿去换成了努力和自律。

我没有勇气当面说这些话，就只好躲在校园邮箱里。  
如果你有一天也觉得累了，可以试试允许自己“停一停”，  

当然，这些话你大概不会当回事。你肯定会说：“还没到可以休息的时候。”

那我就只好站在远处看着你，  
心里默默想，如果你也会觉得累的话，就眨眨眼吧——  
反正我每天都会看向你窗户那一边。

（不用回，也不用理会是谁发的，就当作路上捡到的一张小纸条。）`
},

{
  id:'m_g_love03',
  folder:'inbox',
  from:'“明明很好” <someone@stu.qh.edu>',
  subject:'被你拒绝帮忙之后',
  date:'2023-11-02 16:47',
  starred:false,
  body:`顾同学：

还记得上次我拜托你帮我看一眼数据分析的作业吗？  
你当时一句话就拒绝了，说“你应该自己先试一遍”。

说实话，当时真的是有一点点难过的，  
但后来在实验室楼道里偶尔听见你训队友：  
“你们老想着让我给答案，等比赛的时候谁来给你们？”  
突然就理解你的那种“不帮忙”。

大家觉得你冷，其实只是你对“认真”这件事要求太高，  
高到连别人想偷懒一小步你都看不过去。

我其实挺想问一句：  
你是不是对自己，也同样这么不留情面？

如果有一天你想要一个可以安静听你抱怨的人，  
不需要你是“顾神”“顾队”“顾学长”，  
只需要你是一个会被 Bug 气到想砸键盘的普通人，  
那就回复我一句“好”，我会当作收到一封世界上最重要的邮件。

—— 一个曾经被你拒绝、但现在有点感谢你的人`
},
{
  id:'m_g_love04',
  folder:'inbox',
  from:'匿名投稿 <wall-love@stu.qh.edu>',
  subject:'【校园墙截稿】关于你和她的那条 CP 贴',
  date:'2025-03-5 20:33',
  starred:true,
  body:`顾：

今天校园墙上有一条讨论得很火的帖子，你肯定已经听说了。  
说的是“顾岱明 × 某人”，评论区各种“天作之合”“郎才女貌”。

我不知道那条帖子的内容会不会让你困扰，  

我承认，刚看到的时候，我的第一反应不是“吃瓜”，  
而是突然很慌——  
慌的是好像所有人都在等你和谁成为一对“完美的 CP”，  
却没有人问过你，你自己到底想要什么。

如果你有一天真的喜欢上谁了，希望那个人是你自己选的，  
不是校园墙帮你选出来的，也不是同学起哄出来的。

—— 一个看过那条帖，也偷偷点了“折叠”的人`
},
      
{
  id:'m_g_004',
  folder:'inbox',
  from:'陈思芸 <chen.siyun@stu.qh.edu>',
  subject:'那个……关于**校园墙**那条，我有点想问你',
  date:'2025-03-06 22:07',
  starred:false,
  body:
`顾学长：

不好意思这么晚打扰你……只是今天刷到一条**校园墙**的帖子，一直有点心神不宁。

他们说你和林澜学姐「很般配」、「每天一起学习」，还有人说你们在实验室门口等彼此的照片……我知道大部分都是乱说的，可是不知道为什么，看见的时候心里还是突然揪了一下。

我不是想打听八卦啦，只是……有些话不问清楚，会一直在脑子里打转。

你们……真的像大家说的那样吗？  
如果这是不方便回答的问题，就别回复我也没关系，我只是……鼓起了很大的勇气才写这封邮件。

抱歉，让你困扰的话请忽略吧。

晚安，  
思芸
`
}
     ],
     'U-PLAYER': [
  {
    id:'m_p_001',
    folder:'inbox',
    from:'清河大学信息化中心 <noreply@qh.edu>',
    subject:'[通知] 校园邮箱启用成功',
    date:'2025-09-01 09:20',
    starred:false,
    body:
`林镜同学你好：

你的校园邮箱已启用：linjing@stu.qh.edu
学号：自动同步自迎新系统。

请妥善保管账号与密码，不要泄露给他人。如需在校外访问，请通过 VPN 登录“校内邮箱”及相关系统。

—— 清河大学信息化中心`
  },

  {
  id:'m_lj_003',
  folder:'inbox',
  from:'学生工作部宿管中心 <dorm@qh.edu>',
  subject:'[入住信息] 2025级新生宿舍安排通知',
  date:'2025-09-01 09:30',
  starred:false,
  body:`同学你好：

欢迎你加入清河大学，成为 2025 级新同学。

根据当前报到及宿舍资源情况，你的住宿安排如下（如无特殊说明，自 2025-09-01 起生效）：

  校区：清河校区
  住宿园区：东苑学生公寓
  楼栋：东苑 5 栋
  房间号：620
  床位：B 床

  预计同住舍友信息（以实际入住为准）：
  · A 床：周可（信息学部 / 人机交互方向）
  · B 床：林镜（信息学部 / 待分流）
  · C 床：王沐（经济与管理学院 / 会计学）
  · D 床：刘倩（生命与健康学院 / 生物技术）

我们真诚希望你能与舍友们共同度过一段安全、温暖、有意义的大学生活，在相互尊重与理解中建立良好的宿舍氛围。

如对住宿安排有身体情况、家庭情况等方面的<strong>特殊需求</strong>，需申请调整宿舍的，请通过邮箱联系：
  
  宿管协调邮箱：dorm@qh.edu
  主题格式建议：“宿舍调整申请 + 姓名 + 学号”

注意：宿舍调整以“确有困难、材料齐全”为原则，请同学合理提出诉求，耐心等待审核结果。

祝你在清河大学度过充实而美好的四年。

学生工作部宿管中心
2025-08-28
`
},

  {
    id:'m_p_002',
    folder:'inbox',
    from:'学生心理中心 <counsel@qh.edu>',
    subject:'心理支持专线开通 · 新生关怀提醒',
    date:'2025-09-02 08:02',
    starred:true,
    body:
`林镜同学：

欢迎加入清河大学。

如在适应新环境、学习压力、宿舍人际等方面感到紧张或不安，你可以通过心理中心进行匿名咨询或预约面谈：

· 线上预约入口：/counseling.html
· 工作日开放时间：9:00–21:00
· 如遇紧急情况，请优先联系辅导员或保卫处值班电话。

不必把所有事情都一个人扛着，适当求助是成熟和负责的表现。

—— 学生心理中心`
  },
    {
    id:'m_p_003',
    folder:'inbox',
    from:'教务处实践教学科 <jwc@qh.edu>',
    subject:'关于导师确认及导师见面安排（沈以航老师）',
    date:'2025-09-05 14:15',
    starred:false,
    body:
`林镜同学：

根据你在迎新系统中的志愿及学院审核结果，你已被分配至
信息学部沈以航老师名下，作为“结构化记忆与人机交互方向”新生指导对象。

导师初次见面安排如下：
· 导师姓名：沈以航 副教授
· 建议讨论内容：学习规划、科研兴趣、后续项目参与方式等

沈老师在系统备注中提出，希望与你进行一次“单独深入交流”，时间由你与导师协商。

如对导师安排有疑问，或希望更换导师，请第一时间联系学院教务秘书。

—— 教务处 实践教学科
（此邮件为系统自动发送，请勿直接回复）`
  },

        ],
     'U-LL': [
        {
  id:'m_ll_003',
  folder:'inbox',
  from:'沈以航 <shen.yh@qh.edu>',
  subject:'今晚 B-4-404 讨论一下后续推免材料',
  date:'2025-05-17 14:21',
  starred:false,
  body:
`林澜同学：

关于你这学期在「记忆可视化接口」项目上的工作，我这边准备把相关材料再完整整理一下，后面在学院里做推免与奖学金评审时，会更好说话一些。

有几份阶段性结果和日志需要你这边补充说明，另外，之前提到的竞赛经历、论文稿件和推荐信措辞，也可以趁这两天一起定下来。这些东西如果准备得好，对你后面很关键，就不要拖了。

今晚我会在 B-4 楼那边加班一会儿，如果你方便的话，21:30 到 B-4-404 找我，我们单独把这些细节过一遍。晚上人少一点，不会被打断，效率也高些。

有事再回信确认一下时间。

沈以航
2025-05-17`
}

      ],
     'U-CSY': [ {
    id:'m_p_001',
    folder:'inbox',
    from:'清河大学信息化中心 <noreply@qh.edu>',
    subject:'[通知] 校园邮箱启用成功',
    date:'2021-09-01 09:20',
    starred:false,
    body:
`陈思芸同学你好：

你的校园邮箱已启用：chen.siyun@stu.qh.edu
学号：自动同步自迎新系统。

请妥善保管账号与密码，不要泄露给他人。如需在校外访问，请通过 VPN 登录“校内邮箱”及相关系统。

—— 清河大学信息化中心`
  },

  {
  id:'m_c_006',
  folder:'inbox',
  from:'学生心理中心 <counsel@qh.edu>',
  subject:'【自动提醒】您有一条未完成的预约申请',
  date:'2025-03-18 22:50',
  starred:false,
  body:
`同学您好：

系统检测到您于 21:37 开始填写“个人面谈预约”表单，但未提交。
如您近期感到压力、疲惫或对学习生活存在困扰，欢迎继续完善预约，
心理中心将在两小时内为您确认时段。

这是一次匿名流程，我们尊重每一位同学的选择。

清河大学学生心理中心
工作时间：9:00–21:00`
}
,

{
  id:'m_c_007',
  folder:'inbox',
  from:'西苑宿舍管理中心 <dorm@qh.edu>',
  subject:'关于您提交的宿舍人际反馈处理结果',
  date:'2024-12-08 10:12',
  starred:false,
  body:
`陈思芸同学：

我们已收到您关于“寝室氛围紧张”的反馈。经值班老师走访与核实，
目前未发现影响安全与秩序的情况。建议同学们以沟通方式解决生活
习惯与学习时间等方面的小冲突。

如需调寝，可在下学期开学前提交申请，届时会根据宿舍实际情况统筹安排。

如您近期情绪波动较大，可预约学生心理中心的谈话时段。

西苑宿舍管理中心`
}
, ],
     'U-ZGQ': [/* ====== ① 日常工作邮件（几封很正常的公务） ====== */
  {
    id:'m_zgq_001',
    folder:'inbox',
    from:'保卫处值班系统 <security@qh.edu>',
    subject:'【排班更新】2025 年 4–6 月夜间巡逻安排',
    date:'2025-04-01 09:24',
    starred:false,
    body:`张国权：

现更新 2025 年 4—6 月夜间巡逻值班排班表，请查收附件。  
重点区域包括：B-4 实验楼、D-2 教学楼、图书馆西侧广场等。

请按时到岗，做好巡逻记录。

保卫处值班系统`
  },
  {
    id:'m_zgq_002',
    folder:'inbox',
    from:'保卫处办公室 <office@qh.edu>',
    subject:'【提醒】实验楼监控设备定期检查',
    date:'2025-04-08 14:12',
    starred:false,
    body:`张国权：

近期有学生反映个别楼宇走廊“有点黑、看不清人脸”，  
请你在本周内配合信息化中心，对 B-4 等楼宇的视频监控设备进行一次走访检查，  
重点查看：摄像头角度是否偏移、画面是否模糊、是否有遮挡等。


保卫处办公室`
  },
  {
    id:'m_zgq_003',
    folder:'inbox',
    from:'学生服务中心 <service@qh.edu>',
    subject:'学生反映夜间有人在实验楼附近逗留',
    date:'2025-03-27 21:10',
    starred:false,
    body:`张师傅：

今晚约 21:00，有学生通过服务热线反映，在 B 区实验楼附近看到可疑人员逗留时间较长。  
请在后续巡逻时注意留意，遇到情况及时上报并做好记录。

学生服务中心`
  },
  {
    id:'m_zgq_004',
    folder:'inbox',
    from:'保卫处消防科 <fire@qh.edu>',
    subject:'【通知】实验区域消防通道清理',
    date:'2025-05-01 10:52',
    starred:false,
    body:`张国权：

请于本周内对 B-4 楼各楼层消防通道进行彻查，  
如发现堆放杂物、私拉电线等情况，  
请拍照记录并联系相关学院及时清理。

消防科`
  },

  /* ====== ② 工资发放通知（每月一封，显得很正常） ====== */
  {
    id:'m_zgq_pay_2024_11',
    folder:'inbox',
    from:'财务处 <finance@qh.edu>',
    subject:'【工资发放通知】2024 年 11 月',
    date:'2024-11-25 09:00',
    starred:false,
    body:`张国权：

2024 年 11 月工资已发放至您预留工资卡账户，请注意查收。

财务处`
  },
  {
    id:'m_zgq_pay_2024_12',
    folder:'inbox',
    from:'财务处 <finance@qh.edu>',
    subject:'【工资发放通知】2024 年 12 月',
    date:'2024-12-25 09:01',
    starred:false,
    body:`2024 年 12 月工资已发放，请查收。  

如有疑问请在 5 个工作日内联系财务处。`
  },
  {
    id:'m_zgq_pay_2025_01',
    folder:'inbox',
    from:'财务处 <finance@qh.edu>',
    subject:'【工资发放通知】2025 年 1 月',
    date:'2025-01-25 09:00',
    starred:false,
    body:`2025 年 1 月工资已发放。  

财务处`
  },
  {
    id:'m_zgq_pay_2025_02',
    folder:'inbox',
    from:'财务处 <finance@qh.edu>',
    subject:'【工资发放通知】2025 年 2 月',
    date:'2025-02-25 09:00',
    starred:false,
    body:`2025 年 2 月工资已入账，请注意查收。  

财务处`
  },
  {
    id:'m_zgq_pay_2025_03',
    folder:'inbox',
    from:'财务处 <finance@qh.edu>',
    subject:'【工资发放通知】2025 年 3 月',
    date:'2025-03-25 09:00',
    starred:false,
    body:`2025 年 3 月工资已发放。  

财务处`
  },
  {
    id:'m_zgq_pay_2025_04',
    folder:'inbox',
    from:'财务处 <finance@qh.edu>',
    subject:'【工资发放通知】2025 年 4 月',
    date:'2025-04-25 09:00',
    starred:false,
    body:`2025 年 4 月工资已发放。  

财务处`
  },
  {
    id:'m_zgq_pay_2025_05',
    folder:'inbox',
    from:'财务处 <finance@qh.edu>',
    subject:'【工资发放通知】2025 年 5 月',
    date:'2025-05-25 09:01',
    starred:false,
    body:`2025 年 5 月工资已发放，请注意查收。

财务处`
  },
 ],
     'U-SYH': [// 1. 研究生院 / 学校层面的工作邮件
    {
      id:'m_sh_001',
      folder:'inbox',
      from:'研究生院 <grad@qh.edu>',
      subject:'关于 2025 届推免名额分配与推荐意见',
      date:'2025-09-10 10:18',
      starred:true,
      body:
`沈老师：

根据学院上报情况，信息学部 2025 届拟分配推免名额共 12 人，其中直博名额 2 人、学术硕士 7 人、专硕 3 人。请您结合本年度竞赛获奖、科研项目参与情况，给出对相关学生的推荐排序意见，并于 3 月 6 日前在系统中完成填报。

涉及学生名单（节选）：
- 顾岱明（2021D0001）
- 陈思芸（2021A0421）
- ……

研究生院
2025-09-10`
    },

    {
      id:'m_sh_002',
      folder:'inbox',
      from:'校长办公室 <president@qh.edu>',
      subject:'关于参加市校战略合作签约仪式的通知',
      date:'2025-08-15 09:06',
      starred:false,
      body:
`沈以航老师：

兹定于 8 月 20 日下午在清河市政府会议中心举行“清河市—清河大学战略合作协议”签约仪式。经研究，决定邀请您作为信息学部教师代表参加，并在会前向市领导简要介绍“城市感知与记忆可视化接口”项目进展。

请提前准备 3 分钟左右的发言提纲，并于 8 月 18 日前发送至校长办公室邮箱备存。

校长办公室
2025-08-15`
    },

    {
      id:'m_sh_003',
      folder:'inbox',
      from:'信息学部党委书记 <sec.is@qh.edu>',
      subject:'关于实验室学生思想与安全情况的沟通',
      date:'2025-04-26 17:40',
      starred:false,
      body:
`沈老师：

近期学院收到个别同学关于“科研压力较大、夜间实验较多”的反馈，希望各实验室在保证科研进度的同时，进一步关注学生身心状态和实验安全边界。

特别是夜间单独留在实验室的情况，请尽量避免，确有需要时要做到多人在场、过程留痕。也请您在与学生开展个别谈话时，注意方式方法，避免引起不必要的误会。

如有需要学院协调的地方，也欢迎您随时沟通。

信息学部党委书记
2025-04-26`
    },
        // 9. 纯工作教学邮件
    {
      id:'m_sh_011',
      folder:'inbox',
      from:'教学秘书 <teach@qh.edu>',
      subject:'《可信人机交互》课程期末成绩录入提醒',
      date:'2025-01-12 14:33',
      starred:false,
      body:
`沈老师：

本学期《可信人机交互》课程已完成全部教学安排，请于 1 月 18 日前登录教务系统完成成绩录入及试卷分析表填写，避免影响后续奖学金评定与推免工作时的成绩调取。

如需助教协助整理平时成绩，请及时告知。

教务办公室
2025-01-12`
    }
 ],

 'U-CSY-ALT': [
    {
      id:'m_calt_001',
      folder:'inbox',
      from:'沈以航 <shen.yh@qh.edu>',
      subject:'科研项目后续可以聊一下',
      date:'2025-06-02 22:11',
      starred:false,
      body:
`思芸：

你之前提到的那篇稿子我看了，思路还可以。你也知道，最近那件“意外”闹得很厉害，很多人盯着实验室看。以后有些话，就不要再从学校邮箱发了。

这个地址先收着，以后有需要沟通的事情，从这里说。推免、项目、奖学金这些，你愿意的话，我这边能帮到的还是会帮。你自己考虑清楚。

沈以航`
    },



    {
      id:'m_calt_003',
      folder:'inbox',
      from:'沈以航 <shen.yh@qh.edu>',
      subject:'推免前材料和答辩顺序',
      date:'2025-09-05 23:01',
      starred:false,
      body:
`思芸：

学院那边的顺序我已经帮你往前排了一点，答辩时会按照项目贡献重点介绍你负责的那几块。你这几天把 PPT 和自述再按我画的提纲改一改，别提太多“早期版本”的事。

另外，还是那句话，别在公开场合乱说以前的事情，也别和别人提这个邮箱。等名单出来之后，我再和你讲后面的安排。

沈以航`
    },

  ],
  };

  /* -----------------------------------
   * 2. 分阶段邮件：达到 minLogin 次登录后才会“刷出来”
   *    👉 这里只放“剧情关键邮件”（约见、告白、黑料等）
   *    👉 内容你等会自己补，把 body 换成真正文本就行
   * ----------------------------------- */
  const STAGED_MAILS = {
    // 顾岱明：第 3 次登录才出现陈约他去 B-4-404 的邮件
    'U-PLAYER': [
  {
    id:'m_p_004',
    minLogin: 2,   // 第 3 次及以后登录解锁
    folder:'inbox',
    from:'沈以航 <shen.yh@qh.edu>',
    subject:'关于你后续发展与一次轻松的小聊',
    date:'2025-09-05 21:03',
    starred:false,
    body:
`林镜同学：

看到你的材料的时候我印象挺深的，本科阶段能有你这种基础的学生并不多。
我这几年带的学生里，有好几个拿到了国家奖学金、校长奖学金，还有直博、保研到“985”的，
他们基本都是跟着我做项目一步一步走上去的。

简单说，只要方向跟对、人跟对，很多机会其实是可以“照顾”到的。
评奖评优、推免名额、项目署名，这些我在学院那边还是有一定话语权的。

白天你可能比较忙，实验楼人也多，不太方便细聊。
如果你不介意的话，我们可以找个安静一点的时间，
比如哪天晚上大家都散了之后，你到 B-4 那边，我正好也在实验室，
可以具体给你讲讲接下来怎么“布局”，哪些比赛该报、哪些论文比较好出成果。

当然，邮件里很多话不太适合说太满，见面聊会更直接。
你可以先想想，有没有什么想要的目标，我看看能不能帮你“推一把”。

—— 沈以航`
  },
  {
  id:'m_lj_004',
  minLogin: 2,   // 第 3 次及以后登录解锁
  folder:'inbox',
  from:'周可 <zhou.ke@stu.qh.edu>',
  subject:'关于选导师的事…你会考虑沈老师吗？',
  date:'2025-10-12 21:18',
  starred:true,
  body:`林镜：

你真的要选沈老师做导师吗？

这两天我在刷到几条 避雷贴 ，都是在说选导师要慎重，其中有一篇明显就是在暗指他，提到了以前在 B-4 那边发生过的一些事，虽然说得很隐晦，但看得人心里发毛

我知道校园墙上的话不一定全是真的，可一届一届的人都在提醒，多少说明这个人身上有一些风险，不完全是“流言”三个字能带过去的。

我不是想干涉你的决定，只是…说实话，我有点担心你。  
我觉得他真的不行，太吓人了！

周可
`
},
    {
      id:'m_p_009',
      minLogin: 3,   // 第 3 次及以后登录解锁
      folder:'inbox',
      from:'学生处 <xsc@qh.edu>',
      subject:'关于已故学生账号封存与家属阅览说明',
      date:'2025-09-02 10:15',
      starred:false,
      body:
`林镜同学：

您好。首先向您和家人再次表达慰问。

根据学校学生工作部与信息化中心联合制定的《学生账号封存与家属阅览说明》，
对于已故学生的校园账号（含统一身份账号、校园邮箱等），学校已按规定完成封存处理，
以保护当事人的隐私与相关数据安全。

如您和直系亲属因学习、纪念等合理事由，确有需要临时查阅部分学籍记录、
奖助学金信息或系统通知邮件，可通过学生工作部提出书面申请，并按说明生成“家属核验码”，
在限定范围内开通只读权限。

具体流程及“家属核验码”的生成规则，请参见校内通知：
《学生账号封存与家属阅览说明》。

请您知悉。如有疑问，可通过学生工作部联系辅导员老师，或发送邮件至 xsc@qh.edu 咨询。

学生工作部
清河大学
2025-06-02`
    },
    ],
    'U-SYH': [

        {
  id:'m_ll_004',
  minLogin: 3,   // 第 3 次及以后登录解锁
  folder:'inbox',
  from:'林澜 <lin.lan@stu.qh.edu>',
  subject:'Re: 今晚 B-4-404 讨论一下后续推免材料',
  date:'2025-05-17 15:02',
  starred:false,
  body:
`沈老师：

邮件收到了，最近几次组会上您提到的推免和奖学金材料，我这边也一直在补充整理，确实有一些地方需要再对一下。

今晚我这边原本有自习安排，不过可以调整一下时间。如果您方便的话，我大概 21:30 左右去 B-4-404 找您，可能会稍微晚个几分钟，到时候提前给您发消息。

另外，关于之后课题方向和实验室安排，我也有一些自己的想法，想当面和您沟通一下。邮件里说不清楚，就放到今晚一起聊吧。

那就先这样，晚上见。

林澜
2025-05-17`
},
        // 4. 拒绝他“帮忙”的女学生回信
    {
      id:'m_sh_006',
      minLogin: 2,   // 第 3 次及以后登录解锁
      folder:'inbox',
      from:'周** <zhou.xx@stu.qh.edu>',
      subject:'Re: 关于你保研材料和项目的进一步沟通',
      date:'2025-03-09 08:19',
      starred:false,
      body:
`沈老师您好：

谢谢您抽时间看我的材料，也谢谢您愿意帮我把细节再打磨一下。我认真想了一下，还是希望所有沟通尽量放在白天、在实验室有其他同学在的时候进行。

不是不信任您，只是我自己比较容易紧张，晚上单独去 B-4 那边的话可能更说不清楚，也怕被别的同学误会。简历这周我会按您上次课上说的思路再修改一版，做完以后再发给您看，可以吗？

给您添麻烦了，再次感谢。

学生
周**`
    },

    // 5. 暗暗“妥协”的女学生回信
    {
      id:'m_sh_007',
      minLogin: 2,   // 第 3 次及以后登录解锁
      folder:'inbox',
      from:'李** <li.yy@stu.qh.edu>',
      subject:'Re: 推免材料的修改和后续安排',
      date:'2024-10-12 00:03',
      starred:true,
      body:
`沈老师：

刚刚看到邮件，之前没敢太多打扰您，其实我心里也很着急。今年学院说名额很紧张，我也知道如果没有项目和您这边的推荐，基本上就没机会。

如果您方便的话，我可以照您说的时间过去，把材料和后面该怎么做都听清楚。我只是有点担心晚上太晚宿舍会关门……不过这些我自己想办法，您不用操心。

谢谢您一直说愿意“照顾”我，我也会尽力配合，把事情做好。

学生
李**`
    },

    // 6. 比较直白地划清界限的回信
    {
      id:'m_sh_008',
      minLogin: 2,   // 第 3 次及以后登录解锁
      folder:'inbox',
      from:'匿名学生 <hidden@stu.qh.edu>',
      subject:'请您注意与学生交流的方式',
      date:'2023-04-30 21:33',
      starred:false,
      body:
`沈老师：

我本来不太敢写这封邮件，但最近几次单独交流之后还是觉得有些话需要说明。

我非常感谢您在学业和项目上的指导，但是您在聊天中多次提到我的穿着、气质之类的话题，还说“有些话邮件里不好写”、“晚上再慢慢谈”，这些会让我感到很不舒服，也不知道该怎么理解。

我只是想认真做研究，希望所有机会都能建立在公开、规范的标准上，而不是一些“只有我们知道的条件”。如果是我误会了，也请您见谅；如果不是，希望以后我们之间的沟通可以更加边界清晰一些。

学生`
    },
    // 7. 典型“被他帮完忙”的感谢信
    {
      id:'m_sh_009',
      minLogin: 4,   // 第 3 次及以后登录解锁
      folder:'inbox',
      from:'陈** <chen_new@qh.com>',
      subject:'关于推免结果的感谢',
      date:'2025-09-17 19:26',
      starred:false,
      body:
`沈老师：

今天学院贴出了推免名单，我被拟录取到本校信息学部读研了。说实话，如果没有您之前帮我把项目挂进去、在学院会上替我说话，我大概很难有这样的结果。

这些话当面不好讲太多，只能在这里简单说一声谢谢。很多细节我都会记在心里，以后如果有机会，也希望能帮您做更多事情，不管是在实验室还是别的工作上。

祝好。

学生
陈**`
    },


    // 8. 他发给学院/领导，装得很“正经”的邮件
    {
      id:'m_sh_010',
      minLogin: 3,   // 第 3 次及以后登录解锁
      folder:'sent',
      from:'沈以航 <shen.yh@qh.edu>',
      subject:'关于信息学部 2025 届推免学生综合评价的补充说明（未发送）',
      date:'2025-09-07 16:02',
      starred:false,
      body:
`各位老师好：

根据研究生院统一要求，现就信息学部部分推免候选人综合评价情况做进一步说明，主要包括：

1. 顾岱明：在结构化记忆检索、可视化接口等项目中起到核心作用，科研潜力突出，建议列入直博生重点考察对象；
2. 陈思芸：课程成绩稳定，参与实验室项目时间较长，项目贡献主要体现在数据整理与系统维护层面，建议列入学术型硕士推荐名单；
3. 其他候选人：详见附件表格。

如有需要，当面再做补充。

沈以航
信息学部
2025-09-07`
    },

    
    ],
    'U-GDM': [
        {
  id:'m_g_005',
  minLogin: 2,   // 第 3 次及以后登录解锁
  folder:'inbox',
  from:'陈思芸 <chen.siyun@stu.qh.edu>',
  subject:'今晚可以来 B-4 一趟吗？',
  date:'2025-05-17 16:58',
  starred:false,
  body:
`顾同学：

突然给你发邮件有点突兀，不过最近发生的事情太多了，我有些话不太方便当面说。

关于前阵子「校园墙」上那些把你和林澜写成 CP 的帖子……老实讲，我看着很难受。

说真的，我总觉得她很多东西不是只靠实力拿的。总是和沈老师单独待在实验室，夜里还留到很晚，系里不少人都在背后议论，但谁也不敢明说。

我不想在邮件里讲太多是非，只是觉得你应该知道别人在怎么看这件事。要是你愿意的话，今晚自习后我们能不能当面聊一下？我大概 21:40 左右会去 B-4 楼 404 教室，就我们两个人，我有些话还是想当面跟你讲清楚。


思芸
2025-05-17`
},
{
  id:'m_g_111',
  minLogin: 3,   // 第 3 次及以后登录解锁
  folder:'inbox',
  from:'陈思芸 <chen.siyun@stu.qh.edu>',
  subject:'新邮箱',
  date:'2025-06-13 16:58',
  starred:false,
  body:
`顾同学：

我这个邮箱以后不准备用了，那之后可以用chen_new@qh.com这个邮箱联系我。

思芸
2025-06-13`
}
    ],

    // 陈思芸：第 3 次登录才出现顾的回复
    'U-CSY': [
        {
  id:'m_c_104',
  folder:'inbox',
  minLogin: 3,
  from:'顾岱明 <gdm@stu.qh.edu>',
  subject:'Re: 今晚可以来 B-4 一趟吗？',
  date:'2025-05-17 17:12',
  starred:false,
  body:
`思芸：

邮件我看到了，谢谢你愿意跟我说这些。

至于你提到的那些事，很多细节在邮件里说不太合适，确实也有一些我自己没理顺的地方。可能你比我想象中更敏感，也更在意这类不公平吧。

今晚的话，那就按你说的，21:40 在 404 吧，我会尽量提前赶过去。如果你临时有事也没关系，随时给我发邮件或者消息都行。

还有，以后这种事情不用一个人憋着，有什么想法就直接跟我说。

路上注意安全，别太晚一个人走。

顾岱明
2025-05-17`
},
{
  id:'m_c_1084',
  folder:'inbox',
  minLogin: 4,
  from:'陈思芸 <chen.siyun@stu.qh.edu>',
  subject:'我一直忘不了那天晚上......（草稿）',
  date:'2025-05-19 02:12',
  starred:false,
  body:
`我到底要不要把事情经过说出去，啊————我要疯了
你为什么来找我！又不是我害死你的！
真的不是我呜呜呜
我没有真的害你啊！
不是我！啊————
9958！`
},
      {
  id:'m_c_204',
  minLogin: 2,
  folder:'inbox',
  from:'顾岱明 <gdm@stu.qh.edu>',
  subject:'Re: 那个……关于**校园墙**那条，我有点想问你',
  date:'2025-03-07 09:22',
  starred:false,
  body:
`思芸：

你昨天的邮件我看得很认真，也……不像你说的那样「打扰」。

直接告诉你吧：  
校园墙的内容都是瞎编的。真的。

我和林澜的确做过项目，但仅此而已。  
如果我和谁有特别的关系，我自己会说，而不是让别人替我乱写。

你知道我对你的心意的，你不要多想。

说实话，能有人因为那些无聊的帖子而在意我，感觉……还挺开心的。  
你愿意问我，比放在心里胡思乱想重要得多。

以后如果遇到这种让你不舒服的事，可以第一时间来问我。  
我不介意的。

另外，最近比赛的事情如果你想一起准备，也可以来找我，我有空。

顾
`
},
 {
    id:'m_c_303',
    minLogin: 2,
    folder:'inbox',
    from:'学生资助管理中心 <aids@qh.edu>',
    subject:'本学期“自强成长资助计划”资金发放通知',
    date:'2025-05-25 10:36',
    starred:true,
    body:
`陈思芸同学：

你好！根据学校学生资助工作安排，你本学期申请的
“自强成长资助计划”（生活困难学生专项补助）已审核通过，
资助金已于 5 月 24 日发放至学校统一结算银行卡：

· 资助项目：自强成长资助计划（2024–2025 学年春季学期）
· 发放金额：3000 元
· 发放方式：一次性划入校园银行卡（尾号 ****8234）

本项目主要用于缓解阶段性生活压力，不与奖学金评定直接挂钩，
也不会作为“能力高低”的评价标准。我们始终相信，经济条件从来
不应该成为你追求学业与人生目标的障碍。

如果在学习、生活或情绪上仍感到紧张和压力，欢迎主动与辅导员、
学院资助联系人或学生心理中心沟通讨论，学校会尽力提供支持。

愿你在清河的每一个学期，都能一点点看见自己的进步和力量。

—— 清河大学学生资助管理中心
aids@qh.edu`
  },



  {
    id:'m_c_402',
    minLogin: 2,
    folder:'inbox',
    from:'教务处实践教学科 <jwc@qh.edu>',
    subject:'关于综合奖学金评审结果的说明',
    date:'2025-05-15 09:31',
    starred:false,
    body:
`陈思芸同学：

你本学年申报的综合一等奖学金，经学院评审和公示，未列入最终获奖名单。
主要原因已在系统中反馈：综合测评排名未进入学院前 10%，科研竞赛成果和导师推荐意见未达到一等奖学金评定标准。

如对结果有疑问，可在公示期内向学院奖助学金工作小组提出复议申请。

—— 教务处 实践教学科
（本邮件为系统自动发送）`
  },

  {
  id:'m_c_draft_001',
  minLogin: 2,
  folder:'draft',
  from:'陈思芸 <chen.siyun@stu.qh.edu>',
  subject:'（未发送）申请奖学金答疑',
  date:'2025-05-16 00:41',
  starred:false,
  body:
`周老师您好：

不好意思这么晚还打扰您。我只是想确认一下，我这次综合一等奖
到底是差在哪里？我看学院公布的评分项，我的课程成绩和综测都
不算差……

是不是我真的不够好？还是我做的那些项目，其实都没有意义？

我知道我不是你们眼里的那种“有天分的学生”，但我真的已经很努力了。

抱歉，打扰了。
（此邮件未发送）`
}
,

  {
  id:'m_c_504',
  minLogin: 2,
  folder:'inbox',
  from:'沈以航 <shen.yh@qh.edu>',
  subject:'上次和你说的事，我还是等你的决定',
  date:'2025-05-21 23:58',
  starred:false,
  body:
`思芸：

这两天事情多，现在才有空给你回信。奖学金名单你应该也看到了，
结果不尽如人意，我懂你那种失落——毕竟你确实比不少同学都努力。

但有些事情你也要明白：评奖、推免、论文发表……这些从来不是
只靠“努力”就够的。平台、资源、人脉、项目分配，这些东西
你自己一个人争不来。老师能给你创造的空间，远比你想象得大。

我之前跟你提过的事，现在当然还是作数的。
你考虑清楚，只要愿意，我们可以把你的规划重新理一遍——
课题、署名、项目成果、推免名额，我都有办法“往前推”。

而你呢，也不是不能帮老师一些忙。
很多东西不方便明说，你懂。等你愿意来聊，我们找个安静的时间，
晚上实验楼那边人少，我在办公室就可以等你。
有些事当面说比较合适。

别觉得压力大，这不是强迫，是机会。

沈以航`
}
,
{
  id:'m_c_605',
  minLogin: 2,
  folder:'inbox',
  from:'ICIHCI 2025 Editorial Office <no-reply@icihci-conf.org>',
  subject:'[ICIHCI 2025] 稿件 QH-24-317 审稿结果（Reject）',
  date:'2025-03-12 11:08',
  starred:false,
  body:
`Dear Author,

We regret to inform you that your manuscript
"Sequence-aware Memory Panel for Classroom Interaction Logs"
(ID: QH-24-317) has been rejected by ICIHCI 2025.

Below is a consolidated summary of reviewer comments:

1. **Lack of novelty**  
   The paper relies heavily on existing architectures and only provides
   incremental engineering modifications. Reviewers found no substantial
   methodological contribution.

2. **Weak experiments**  
   - Dataset too small, unclear data collection procedure  
   - No ablation experiments  
   - Key claims are not supported by sufficient evidence

3. **Writing and structure issues**  
   The paper lacks clarity in motivation, method description,
   and error analysis. Reviewers consider the current draft
   “below the publication standard of ICIHCI”.

4. **Internal recommendation (not公开部分，摘要)**  
   *The supervising professor indicated the work is “not yet mature”  
   and suggested that the student should “re-evaluate the direction  
   and improve basic research skills before attempting top-tier venues.”*

We appreciate your submission and encourage you to strengthen the work
before considering resubmission.

Best regards,
ICIHCI 2025 Editorial Office`
}],

    // 林澜：第 2 次登录才出现沈约她 + 她的回信
    'U-LL': [
    ],

    'U-ZGQ': [/* ====== ③ 学校警告邮件（两次正式警告 + 一次“最后提醒”） ====== */
  {
    id:'m_zgq_warn01',
    minLogin: 2,   // 第 3 次及以后登录解锁
    folder:'inbox',
    from:'学生工作部 <xgb@qh.edu>',
    subject:'【行为提醒】关于学生投诉一事',
    date:'2025-03-05 16:20',
    starred:true,
    body:`张国权：

近期有女学生向学生工作部反映，在晚间经过某些路段时，多次感到你在长时间注视，  
表示“感觉被盯着看，很不舒服”。

经与你本人谈话核实，相关情况基本属实。  
现向你发出行为提醒，请在巡逻过程中注意保持专业距离，避免给学生造成心理压力。  

学生工作部`
  },
  {
    id:'m_zgq_warn02',
    minLogin: 2,   // 第 3 次及以后登录解锁
    folder:'inbox',
    from:'人事处 <hr@qh.edu>',
    subject:'【警告】关于不当言论的处理决定',
    date:'2025-04-19 10:33',
    starred:true,
    body:`张国权：

人事处收到多名学生的书面反映，  
称你在与同事聊天时，用带有明显不尊重和物化色彩的语言评价女学生的外貌，  
已对当事学生造成不良影响。

经核查属实。  
根据学校有关规定，现对你作出“警告”处理。  
如再发生类似行为，人事处将建议学校对你作出严肃组织处理。

人事处`
  },
  {
    id:'m_zgq_warn03',
    minLogin: 2,   // 第 3 次及以后登录解锁
    folder:'inbox',
    from:'保卫处处长 <chief@qh.edu>',
    subject:'【重要】关于进一步规范个人言行的通知',
    date:'2025-05-10 09:14',
    starred:true,
    body:`张国权：

你在半年内已收到与个人言行相关的多次提醒与警告。  
保卫处再次重申：工作期间的一言一行，都代表学校形象。  

如果后续再出现被学生或教职工正式投诉的情况，  
保卫处将建议人事处按程序启动解除劳动合同的相关流程。

请务必引以为戒。

保卫处处长`
  },
  {
    id:'m_zgq_shen01',
    minLogin: 3,   // 第 3 次及以后登录解锁
    folder:'inbox',
    from:'沈以航 <shen.yh@qh.edu>',
    subject:'今晚 B-4 楼的监控设备麻烦你照旧帮忙一下',
    date:'2025-05-16 18:21',
    starred:true,
    body:`张师傅：

还是跟以前一样麻烦你一下。  
17号晚上大概 21:30–22:00 这段时间，B-4 楼那几路走廊、楼梯口的监控，  
你这边按“例行检修”处理一下就行，记录上写线路不稳定、画面间断什么的，  
你比我熟。

上次辛苦你帮忙，那点心意你也收到了。  
这次事成之后，还是按上次的标准，不会少你的。

不要在办公室当众提这件事，有情况我再单独找你说。

—— 沈以航`
  }
],
    // 你后面如果还想给别的账号加阶段邮件，按这个格式继续写就行
  };

  /* -----------------------------------
   * 3. “已解锁邮件 ID” 本地存取
   *    防止刷新页面时重复“新邮件”
   * ----------------------------------- */
  function getUnlockedMailIds(uid){
    const k = KEY_UNLOCK_PREFIX + uid;
    try{
      const raw = localStorage.getItem(k);
      if(!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    }catch(e){
      return [];
    }
  }

  function saveUnlockedMailIds(uid, ids){
    const k = KEY_UNLOCK_PREFIX + uid;
    localStorage.setItem(k, JSON.stringify(ids));
  }

  /* -----------------------------------
   * 4. 根据当前登录次数，算出“这个账号现在应该看到哪些邮件”
   *    - 基础 + 已解锁 + 本次新解锁
   * ----------------------------------- */
  function getMailListFor(uid){
    // 1) 基础邮件：拷贝一份，避免原数据被修改
    const base = (BASE_MAILS[uid] || []).slice();

    // 2) 登录次数 + 已经解锁过的 staged 邮件 ID
    const loginCount  = getLoginCountFor(uid);
    const unlockedIds = getUnlockedMailIds(uid);
    const stagedList  = STAGED_MAILS[uid] || [];
    const newlyUnlocked = [];

    stagedList.forEach(m => {
      // 已经解锁过 → 直接加入列表
      if (unlockedIds.includes(m.id)) {
        base.unshift(m);   // 新邮件放上面好看一点
        return;
      }

      // 未解锁但满足登录次数 → 本次解锁
      if (loginCount >= (m.minLogin || 1)) {
        base.unshift(m);
        newlyUnlocked.push(m.id);
      }
    });

    // 3) 把本次新解锁的 ID 记下来，避免下次重复“惊喜”
    if (newlyUnlocked.length) {
      saveUnlockedMailIds(uid, unlockedIds.concat(newlyUnlocked));
    }

    return base;
  }

  /* -----------------------------------
   * 5. 本地“已读/星标”状态
   * ----------------------------------- */
  const readSet      = (uid)=> new Set(JSON.parse(localStorage.getItem(KEY_READ_PREFIX+uid)||'[]'));
  const writeReadSet = (uid,set)=> localStorage.setItem(KEY_READ_PREFIX+uid, JSON.stringify([...set]));
  const starSet      = (uid)=> new Set(JSON.parse(localStorage.getItem(KEY_STAR_PREFIX+uid)||'[]'));
  const writeStarSet = (uid,set)=> localStorage.setItem(KEY_STAR_PREFIX+uid, JSON.stringify([...set]));

  function getUnread(uid){
    const mails = getMailListFor(uid);
    const rs = readSet(uid);
    return mails.filter(m=>m.folder==='inbox' && !rs.has(m.id)).length;
  }

  // 顶部徽章 & 缓存同步
  function updateBadges(uid){
    const unread = getUnread(uid);
    localStorage.setItem(`qh_unread_cache_${uid}`, String(unread));
    window.dispatchEvent(new CustomEvent('qh-unread-updated', { detail:{ uid, count: unread }}));
    const badge = document.getElementById('badgeInbox');
    if (badge) badge.textContent = unread;
  }

  // 工具
  const readPane = ()=> $('#readPane');
  const listEl   = ()=> $('#mailList');
  function escapeHTML(s){ return (s||'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[m])); }
  const currentFolder = ()=> $('#mailFolders a.active')?.dataset.folder || 'inbox';

  /* -----------------------------------
   * 6. 列表渲染
   * ----------------------------------- */
  function renderList(uid){
    const mails = getMailListFor(uid).slice().sort((a,b)=> b.date.localeCompare(a.date));
    const rs = readSet(uid), ss = starSet(uid);
    const kw = ($('#kw')?.value || '').trim().toLowerCase();
    const folder = currentFolder();

    const data = mails.filter(m=>{
      if(folder==='inbox' && m.folder!=='inbox') return false;
      if(folder==='read'  && !rs.has(m.id)) return false;
      if(folder==='star'  && !ss.has(m.id)) return false;
      if(kw){
        const h = (m.subject + ' ' + m.from).toLowerCase();
        return h.includes(kw);
      }
      return true;
    });

    listEl().innerHTML = data.map(m=>{
      const starred = ss.has(m.id);
      const unread  = !rs.has(m.id);
      return `
        <div class="mail-row ${unread?'unread':''}" data-id="${m.id}">
          <div class="star ${starred?'on':''}" data-role="star" title="${starred?'取消星标':'加星标'}">★</div>
          <div class="subject"><span class="from">${escapeHTML(m.from)}</span> — ${escapeHTML(m.subject)}</div>
          <div class="date">${m.date}</div>
        </div>`;
    }).join('') || `<div class="ghost" style="padding:14px">该文件夹暂无邮件</div>`;

    $$('#mailList .mail-row').forEach(row=>{
      row.addEventListener('click', (e)=>{
        if(e.target && e.target.matches('.star,[data-role="star"]')){
          toggleStar(uid, row.dataset.id);
          return;
        }
        openMail(uid, row.dataset.id);
      });
    });

    updateBadges(uid);
  }

  function openMail(uid, id){
    const mails = getMailListFor(uid);
    const m = mails.find(x=>x.id===id); if(!m) return;

    const rs = readSet(uid);
    if(!rs.has(id)){ rs.add(id); writeReadSet(uid, rs); }

    $('#btnToggleRead').textContent = '标为未读';
    $('#btnToggleStar').textContent = starSet(uid).has(id) ? '取消星标' : '加星标';
    readPane().dataset.id = id;

    readPane().querySelector('.title').textContent = m.subject;
    readPane().querySelector('.meta').textContent = `发件人：${m.from}　时间：${m.date}`;
    readPane().querySelector('.content').textContent = m.body;

    renderList(uid);
  }

  function toggleRead(uid){
    const id = readPane().dataset.id; if(!id) return;
    const rs = readSet(uid);
    if(rs.has(id)){ rs.delete(id); $('#btnToggleRead').textContent = '标为已读'; }
    else{ rs.add(id); $('#btnToggleRead').textContent = '标为未读'; }
    writeReadSet(uid, rs);
    renderList(uid);
  }

  function toggleStar(uid, id=null){
    id = id || readPane().dataset.id; if(!id) return;
    const ss = starSet(uid);
    if(ss.has(id)){ ss.delete(id); }
    else{ ss.add(id); }
    writeStarSet(uid, ss);
    const btn = $('#btnToggleStar'); if(btn && readPane().dataset.id===id){
      btn.textContent = ss.has(id) ? '取消星标' : '加星标';
    }
    renderList(uid);
  }

  /* -----------------------------------
   * 7. 登录绑定 & 引导层
   * ----------------------------------- */
  let loginPoll = null;
  function showLoginCover(){ const c=$('#mailLoginCover'); if(c) c.style.display='flex'; }
  function hideLoginCover(){ const c=$('#mailLoginCover'); if(c) c.style.display='none'; }

  function bindCommonEvents(uid){
    $('#btnBack')?.addEventListener('click', ()=>{
      if(history.length>1){ history.back(); }
      else{ location.href='index.html'; }
    });

    $$('#mailFolders a').forEach(a=>{
      a.addEventListener('click', (e)=>{
        e.preventDefault();
        $$('#mailFolders a').forEach(x=>x.classList.remove('active'));
        a.classList.add('active'); renderList(uid);
      });
    });

    $('#kw')?.addEventListener('input', ()=> renderList(uid));
    $('#btnRefresh')?.addEventListener('click', ()=> renderList(uid));

    $('#btnToggleRead')?.addEventListener('click', ()=> toggleRead(uid));
    $('#btnToggleStar')?.addEventListener('click', ()=> toggleStar(uid));
  }

  function initForUser(auth){
    hideLoginCover();
    const span = $('#mailUser'); if(span) span.textContent = auth.email;
    bindCommonEvents(auth.id);
    localStorage.setItem(`qh_unread_cache_${auth.id}`, String(getUnread(auth.id)));
    renderList(auth.id);
  }

  function guardAndInit(){
    const auth = (typeof getAuth==='function') ? getAuth() : null;
    if(!auth){
      showLoginCover();
      $('#mailGoLogin')?.addEventListener('click', ()=> { if(typeof openLogin==='function') openLogin(); });
      if(!loginPoll){
        loginPoll = setInterval(()=>{
          const a = (typeof getAuth==='function') && getAuth();
          if(a){ clearInterval(loginPoll); loginPoll=null; initForUser(a); }
        }, POLL_MS);
      }
      return;
    }
    initForUser(auth);
  }

  document.addEventListener('DOMContentLoaded', ()=>{ guardAndInit(); });

  // 可选：暴露几个调试用的全局函数（控制台里好查）
  window.qhGetMailListFor = getMailListFor;
  window.qhGetUnread      = getUnread;

})();
