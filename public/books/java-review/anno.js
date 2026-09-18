/* ==================================================================
   anno.js v3 — 静态页面划线标注（本地存储 + blog 云端同步）
   ------------------------------------------------------------------
   用法：页面 </body> 前引入  <script src="anno.js"></script>

   v2 变更：
     · 点击划线 / 面板列表项 → 右侧滑出【长条边栏 drawer】（不再是小弹窗）
     · 批注内容支持 Markdown 渲染（标题/加粗/斜体/行内码/代码块/列表/引用/链接）
     · 边栏分 查看 / 编辑 两种模式：查看=渲染后的 MD；编辑=大文本框+可开关预览
     · 边栏可收起（✕ / Esc），从划线、悬浮按钮、列表随时再展开
     · 列表中长批注可原地 展开/收起

   v3 变更（云端持久化，配合 blog 的 /api/annotations）：
     · 存储 = localStorage（本地缓存，秒开） + 云端 KV（跨设备同步）
     · 打开页面：先渲染本地 → 后台拉云端，云端较新则自动覆盖并重画
     · 每次保存：本地立即写 + 异步推送云端（keepalive，关页也不丢）
     · 乐观锁：多设备并发写时 409 → 自动"拉云端+合并本地未推送项"后重推
     · 写口令：首次推送时提示输入一次（存本机），对应服务端 ANNO_WRITE_TOKEN
     · 云端不可用（未部署/断网）→ 自动降级为仅本地，功能不受影响
     · 面板标题右侧有同步状态标签（☁已同步/仅本机/☁待验证），点击=手动同步
   ================================================================== */
(function () {
  'use strict';

  /* ==================== 配置 ==================== */
  var PAGE = decodeURIComponent(location.pathname.split('/').pop() || 'index');
  var KEY = 'anno:' + PAGE;
  var MTIME_KEY = KEY + ':mtime';   // 本地最后一次修改时间（用于重启后判断有无未推送数据）
  var PUSHED_KEY = KEY + ':pushed'; // 本地最后一次成功推送云端的时间
  var HINT_KEY = 'anno:hint3';
  var TOKEN_KEY = 'anno:token';     // 云端写口令（首次输入后存本机，免重复输入）
  var COLORS = { y: '#ffe58a', g: '#a7f3d0', r: '#fecaca' };
  var COLOR_LABEL = { y: '重点', g: '已掌握', r: '疑问' };

  /* ---- 云端同步配置 ----
     API 基址选择规则（优先级从高到低）：
       1. 页面里显式配置 window.ANNO_API（想强制指向别的服务时用）
       2. 本地打开（file:// 或 localhost 调试）→ 直连 blog 线上 API（服务端 CORS 已放开 *）
       3. 页面本身部署在 blog 域名下 → 同域相对路径（最稳、无跨域）
     这样同一份 HTML 本地看和线上看，批注都是同一份云端数据               */
  var REMOTE_ORIGIN = 'https://jerry-166-github-io-juuy.vercel.app';
  var API_BASE = (window.ANNO_API != null) ? String(window.ANNO_API)
    : (location.protocol === 'file:' || /^(localhost|127\.|0\.0\.0\.0$)/.test(location.hostname))
      ? REMOTE_ORIGIN : '';
  var API = API_BASE + '/api/annotations';

  var annotations = [];
  var orphanIds = {};

  /* ---- 云端同步状态 ---- */
  var cloudStamp = 0;      // 已知的云端版本号（服务端 updatedAt），0 = 尚未同步过
  var pendingSince = null; // 本地存在"尚未推送到云端"的修改（时间戳 / null）
  var cloudStatus = 'idle';// 'idle' 同步中 | 'ok' 云端已同步 | 'local' 仅本机 | 'noauth' 待输口令
  var syncBtn;             // 面板标题右侧的状态标签（点击 = 手动同步）

  /* ==================== 基础工具 ==================== */
  function $(s, r) { return (r || document).querySelector(s); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function uid() { return 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function byId(id) { for (var i = 0; i < annotations.length; i++) if (annotations[i].id === id) return annotations[i]; return null; }
  function hide(n) { n.style.display = 'none'; }
  function fmt(ts) {
    var d = new Date(ts);
    function p(x) { return (x < 10 ? '0' : '') + x; }
    return (d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var toastEl, toastTimer;
  function toast(msg, ms) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, ms || 2400);
  }

  /* ==================== 存储（本地 + 云端双层） ==================== */
  function load() {
    try { annotations = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { annotations = []; }
    if (!Array.isArray(annotations)) annotations = [];
    // 重启后恢复"未推送"状态：本地最后修改时间晚于最后推送时间 → 说明有离线数据待补推
    try {
      var mt = +(localStorage.getItem(MTIME_KEY) || 0);
      var pd = +(localStorage.getItem(PUSHED_KEY) || 0);
      pendingSince = mt > pd ? mt : null;
    } catch (e) { pendingSince = null; }
  }
  /** 只写本地（不触发云端推送；拉取云端覆盖时用它，避免 pull→push 死循环） */
  function writeLocal() {
    try {
      localStorage.setItem(KEY, JSON.stringify(annotations));
      localStorage.setItem(MTIME_KEY, String(Date.now()));
    }
    catch (e) { toast('保存失败：本地存储不可用或已写满'); }
  }
  /** 完整保存：本地立即写 + 异步推云端（fire-and-forget，失败静默降级） */
  function save() {
    writeLocal();
    pendingSince = Date.now();
    pushCloud(false);
  }

  /* ==================== 云端同步 ==================== */
  function getToken() {
    try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; }
  }

  /** 首次写云端前请求口令（= 服务端环境变量 ANNO_WRITE_TOKEN），存本机免重复输入 */
  function askToken(cb) {
    var t = prompt('首次同步批注需要口令（即 blog 的 ANNO_WRITE_TOKEN 环境变量值）：');
    if (t == null) { setSyncStatus('noauth'); return; }   // 用户点了取消：仅本机使用
    try { localStorage.setItem(TOKEN_KEY, t); } catch (e) { }
    if (cb) cb();
  }

  /** 更新面板上的同步状态标签（颜色 + 提示语） */
  function setSyncStatus(s) {
    cloudStatus = s;
    if (!syncBtn) return;
    var map = {
      ok:     ['☁ 已同步', '#059669', '云端已是最新（点击立即同步）'],
      local:  ['仅本机', '#94a3b8', '云端不可用或未部署，批注暂存本机浏览器（点击重试）'],
      noauth: ['☁ 待验证', '#b45309', '需要口令才能写入云端（点击输入口令并同步）'],
      idle:   ['同步中…', '#94a3b8', '正在与云端同步…']
    };
    var m = map[s] || map.idle;
    syncBtn.textContent = m[0];
    syncBtn.style.color = m[1];
    syncBtn.title = m[2];
  }

  /**
   * 拉取云端数据
   * @param mergeLocal true = 云端打底、本地覆盖同 id 并补充独有条目（用于 409 冲突/离线补推，两边数据都不丢）
   * @param cb 回调 ok:boolean
   */
  function pullCloud(mergeLocal, cb) {
    fetch(API + '?page=' + encodeURIComponent(PAGE))
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (d) {
        var remote = (d && Array.isArray(d.items)) ? d.items : [];
        cloudStamp = (d && d.updatedAt) || 0;
        if (mergeLocal) {
          var map = {};
          remote.forEach(function (a) { map[a.id] = a; });   // 云端打底
          annotations.forEach(function (a) { map[a.id] = a; });// 本地覆盖同 id（用户最新修改优先）+ 补独有
          remote = Object.keys(map).map(function (k) { return map[k]; });
        }
        // 云端与本地内容不一致 → 采用云端（或合并结果）并重画
        if (JSON.stringify(remote) !== JSON.stringify(annotations)) {
          annotations = remote;
          writeLocal();        // 只写本地缓存，不回推（避免 pull↔push 循环）
          applyAll();
        }
        setSyncStatus('ok');
        if (cb) cb(true);
      })
      .catch(function () { setSyncStatus('local'); if (cb) cb(false); });
  }

  /**
   * 推送本地数据到云端
   * @param retried true = 已是冲突后的自动重试（防止 409 循环）
   * 流程：无口令→先要口令；401→口令错了重输；409→拉云端+合并本地未推送项→再推一次
   */
  function pushCloud(retried) {
    var token = getToken();
    if (!token) { askToken(function () { pushCloud(false); }); return; }
    fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page: PAGE,
        baseUpdatedAt: cloudStamp,   // 乐观锁基准：服务端版本若比它新 → 409
        items: annotations,
        token: token                 // 口令放 body（而非 header），兼容未来 sendBeacon
      }),
      keepalive: true                // 页面关闭瞬间也尽量把这次保存发出去
    }).then(function (r) {
      if (r.status === 401) {
        setSyncStatus('noauth');
        toast('同步口令不正确，请重新输入');
        askToken(function () { pushCloud(false); });
        return null;
      }
      if (r.status === 409 && !retried) {
        // 别的设备先写入了云端 → 拉云端 + 合并本地未推送项 → 自动重推一次
        return pullCloud(true, function () { pushCloud(true); });
      }
      if (!r.ok) throw 0;
      return r.json();
    }).then(function (d) {
      if (!d) return;
      cloudStamp = d.updatedAt || Date.now();
      pendingSince = null;
      try { localStorage.setItem(PUSHED_KEY, String(Date.now())); } catch (e) { }
      setSyncStatus('ok');
    }).catch(function () { setSyncStatus('local'); });   // 网络错/未部署：静默降级仅本机
  }

  /** 点击状态标签 = 手动同步：有未推送数据就推，否则拉最新 */
  function manualSync() {
    if (cloudStatus === 'noauth' || !getToken()) {
      askToken(function () { pullCloud(false); pushCloud(false); });
      return;
    }
    if (pendingSince) pushCloud(false);
    else pullCloud(false);
  }

  /** 启动同步：先推离线攒下的修改，否则拉云端最新（拉取过程中用户又保存了 → 补推） */
  function syncStart() {
    setSyncStatus('idle');
    if (pendingSince) { pushCloud(false); return; }
    pullCloud(false, function (ok) {
      if (ok && pendingSince) pushCloud(false);
    });
  }

  /* ==================== 轻量 Markdown 渲染（安全：先全量转义再还原有限标签） ==================== */

  /** 行内元素：`code`、[text](url 仅限 http/https)、**bold**、*italic* */
  function inlineMd(s) {
    var codes = [];
    s = s.replace(/`([^`]+)`/g, function (m, c) { codes.push(c); return '\u0000' + (codes.length - 1) + '\u0000'; });
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, t, u) {
      return /^(https?:)?\/\//i.test(u)
        ? '<a href="' + u + '" target="_blank" rel="noopener">' + t + '</a>'
        : t;
    });
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    s = s.replace(/\u0000(\d+)\u0000/g, function (m, i) { return '<code>' + escHtml(codes[+i]) + '</code>'; });
    return s;
  }

  /** 块级 + 行内：标题/引用/列表/分割线/段落/代码块（```lang） */
  function mdToHtml(src) {
    if (!src) return '';
    var text = String(src).replace(/\r\n?/g, '\n');
    var blocks = [];
    text = text.replace(/```(\w*)\n?([\s\S]*?)```/g, function (m, lang, code) {
      blocks.push({ lang: lang, code: code.replace(/\n$/, '') });
      return '\u0001' + (blocks.length - 1) + '\u0001';
    });

    var lines = escHtml(text).split('\n');
    var out = [], para = [], i, m;
    var listTag = null, quote = [];

    function flushPara() {
      if (para.length) { out.push('<p>' + para.map(inlineMd).join('<br>') + '</p>'); para = []; }
    }
    function closeList() { if (listTag) { out.push('</' + listTag + '>'); listTag = null; } }
    function flushQuote() {
      if (quote.length) { out.push('<blockquote>' + quote.map(inlineMd).join('<br>') + '</blockquote>'); quote = []; }
    }
    function flushAll() { flushPara(); closeList(); flushQuote(); }
    function openList(tag) { if (listTag !== tag) { closeList(); out.push('<' + tag + '>'); listTag = tag; } }

    for (i = 0; i < lines.length; i++) {
      var L = lines[i];

      if ((m = L.match(/^\u0001(\d+)\u0001$/))) {                       // 整行代码块
        flushAll();
        var b = blocks[+m[1]];
        out.push('<pre><code' + (b.lang ? ' class="lang-' + b.lang + '"' : '') + '>' + escHtml(b.code) + '</code></pre>');
        continue;
      }
      if ((m = L.match(/^(#{1,4})\s+(.*)$/))) {                          // 标题
        flushAll();
        var lv = m[1].length;
        out.push('<h' + lv + '>' + inlineMd(m[2]) + '</h' + lv + '>');
        continue;
      }
      if (/^\s*(-{3,}|\*{3,})\s*$/.test(L)) { flushAll(); out.push('<hr>'); continue; }
      if ((m = L.match(/^&gt;\s?(.*)$/))) {                              // 引用（> 已被转义成 &gt;）
        flushPara(); closeList(); quote.push(m[1]); continue;
      }
      if ((m = L.match(/^\s*[-*]\s+(.+)$/))) {                           // 无序列表
        flushPara(); flushQuote(); openList('ul'); out.push('<li>' + inlineMd(m[1]) + '</li>'); continue;
      }
      if ((m = L.match(/^\s*\d+[.、]\s+(.+)$/))) {                       // 有序列表
        flushPara(); flushQuote(); openList('ol'); out.push('<li>' + inlineMd(m[1]) + '</li>'); continue;
      }
      if (!L.trim()) { flushAll(); continue; }                           // 空行 = 分段
      closeList(); flushQuote(); para.push(L);                           // 普通文字行
    }
    flushAll();
    return out.join('');
  }

  /* ==================== 样式注入 ==================== */
  function injectStyles() {
    var css = [
      /* ---- 划线 ---- */
      '.anno-hl{background:#ffe58a;color:#0f172a;border-radius:2px;padding:0 1px;cursor:pointer;}',
      '.anno-hl.c-y{background:#ffe58a}.anno-hl.c-g{background:#a7f3d0}.anno-hl.c-r{background:#fecaca}',
      '.anno-hl:hover{box-shadow:0 0 0 2px rgba(36,86,214,.35)}',
      '@keyframes annoFlash{0%,100%{box-shadow:none}40%{box-shadow:0 0 0 4px rgba(36,86,214,.55)}}',
      '.anno-hl.flash{animation:annoFlash 1.2s ease}',
      '.anno-chip{margin-left:2px;font-size:10px;font-weight:800;color:#fff;background:#2456d6;',
      'border-radius:999px;padding:1px 5px;cursor:pointer;user-select:none;vertical-align:super;}',

      /* ---- 选区工具条 ---- */
      '.anno-toolbar{position:fixed;z-index:10002;display:none;background:#0f172a;border-radius:10px;',
      'padding:6px;box-shadow:0 8px 24px rgba(0,0,0,.3);align-items:center;user-select:none;}',
      '.anno-toolbar .anno-sw{width:22px;height:22px;border-radius:6px;border:2px solid transparent;cursor:pointer;margin-right:4px;}',
      '.anno-toolbar .anno-sw:hover{border-color:#fff}',
      '.anno-toolbar .anno-nb{background:#334155;color:#e2e8f0;border:none;border-radius:6px;padding:4px 10px;',
      'font-size:12px;font-weight:600;cursor:pointer;margin-left:2px;}',
      '.anno-toolbar .anno-nb:hover{background:#475569}',

      /* ---- 右侧长条边栏（v2 核心） ---- */
      '.anno-drawer{position:fixed;top:0;right:0;bottom:0;width:min(430px,94vw);z-index:10001;',
      'background:#fff;border-left:1px solid #e2e8f0;box-shadow:-12px 0 36px rgba(15,23,42,.14);',
      'display:flex;flex-direction:column;transform:translateX(105%);transition:transform .28s cubic-bezier(.4,0,.2,1);}',
      '.anno-drawer.open{transform:translateX(0)}',
      '.ad-head{display:flex;align-items:center;gap:8px;padding:14px 16px;border-bottom:1px solid #e2e8f0;flex-shrink:0;}',
      '.ad-dot{width:12px;height:12px;border-radius:50%;flex-shrink:0;box-shadow:0 0 0 1px #cbd5e1 inset;}',
      '.ad-dot.c-y{background:#f59e0b}.ad-dot.c-g{background:#10b981}.ad-dot.c-r{background:#ef4444}',
      '.ad-head .ad-tag{font-size:12px;color:#64748b;}',
      '.ad-head .ad-time{font-size:12px;color:#94a3b8;}',
      '.ad-head .ad-sp{flex:1}',
      '.ad-btn{border:1px solid #e2e8f0;background:#f8fafc;color:#334155;border-radius:8px;',
      'font-size:12.5px;font-weight:600;padding:5px 12px;cursor:pointer;}',
      '.ad-btn:hover{border-color:#2456d6;color:#2456d6;}',
      '.ad-btn.pri{background:#2456d6;color:#fff;border-color:#2456d6;}',
      '.ad-btn.pri:hover{background:#1a44b8;color:#fff}',
      '.ad-btn.danger{color:#dc2626;}.ad-btn.danger:hover{border-color:#dc2626;background:#fef2f2}',
      '.ad-quote{margin:12px 16px 0;padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;',
      'border-radius:10px;font-size:12.5px;color:#64748b;max-height:96px;overflow-y:auto;',
      'line-height:1.65;flex-shrink:0;}',
      '.ad-quote b{color:#475569}',
      '.ad-main{flex:1;min-height:0;display:flex;flex-direction:column;padding:12px 16px;gap:10px;}',

      /* 查看模式：Markdown 渲染区 */
      '.ad-view{flex:1;overflow-y:auto;padding:4px 2px 12px;}',
      '.ad-empty-note{color:#94a3b8;font-size:13.5px;padding:18px 4px;}',

      /* 编辑模式：大文本框 + 预览 */
      '.ad-edit-wrap{flex:1;min-height:0;display:flex;flex-direction:column;gap:8px;}',
      '.ad-ta{flex:1;min-height:180px;width:100%;border:1px solid #cbd5e1;border-radius:10px;',
      'padding:12px;font:13.5px/1.7 "Cascadia Code",Consolas,monospace;resize:none;box-sizing:border-box;',
      'outline:none;background:#fdfdfe;}',
      '.ad-ta:focus{border-color:#2456d6;box-shadow:0 0 0 3px rgba(36,86,214,.12)}',
      '.ad-preview{border:1px dashed #c7d7fe;background:#f6f9ff;border-radius:10px;padding:10px 12px;',
      'overflow-y:auto;min-height:60px;max-height:40%;}',

      /* 编辑器底部工具行 */
      '.ad-foot{display:flex;align-items:center;gap:6px;padding:0 16px 14px;flex-wrap:wrap;flex-shrink:0;}',
      '.ad-foot .ad-lb{font-size:12px;color:#94a3b8;}',
      '.ad-foot .anno-swb{width:24px;height:24px;border-radius:50%;border:2px solid #fff;',
      'box-shadow:0 0 0 1px #cbd5e1;cursor:pointer;}',
      '.ad-foot .anno-swb.sel{box-shadow:0 0 0 2px #2456d6}',
      '.ad-foot .ad-sp{flex:1}',

      /* Markdown 内容通用样式（查看区与预览共用） */
      '.md-body{font-size:14px;line-height:1.8;color:#334155;word-break:break-word;}',
      '.md-body h1,.md-body h2,.md-body h3,.md-body h4{color:#0f172a;margin:14px 0 6px;line-height:1.4;}',
      '.md-body h1{font-size:18px}.md-body h2{font-size:16.5px}.md-body h3{font-size:15px}.md-body h4{font-size:14px}',
      '.md-body p{margin:6px 0;}',
      '.md-body h1:first-child,.md-body h2:first-child,.md-body h3:first-child{margin-top:2px;}',
      '.md-body code{background:#eef2f7;border-radius:5px;padding:1px 6px;font-size:12.8px;color:#b91c1c;',
      'font-family:"Cascadia Code",Consolas,monospace;}',
      '.md-body pre{background:#0f172a;color:#cbd5e1;border-radius:10px;padding:12px 14px;overflow-x:auto;margin:8px 0;}',
      '.md-body pre code{background:none;color:inherit;padding:0;font-size:12.8px;line-height:1.65;}',
      '.md-body blockquote{border-left:3px solid #c7d7fe;background:#f6f9ff;margin:8px 0;padding:6px 12px;',
      'border-radius:0 8px 8px 0;color:#475569;}',
      '.md-body ul,.md-body ol{margin:6px 0 6px 22px;}',
      '.md-body li{margin:3px 0;}',
      '.md-body a{color:#2456d6;text-decoration:underline;}',
      '.md-body hr{border:none;border-top:1px solid #e2e8f0;margin:12px 0;}',
      '.md-body strong{color:#0f172a}',

      /* ---- 悬浮按钮 & 管理面板 ---- */
      '.anno-fab{position:fixed;right:26px;bottom:84px;z-index:9998;width:42px;height:42px;',
      'border-radius:50%;background:#0f766e;color:#fff;border:none;cursor:pointer;font-size:16px;',
      'box-shadow:0 4px 12px rgba(15,118,110,.4);}',
      '.anno-fab:hover{background:#115e59}',
      '.anno-fab .anno-badge{position:absolute;top:-4px;right:-4px;background:#dc2626;color:#fff;',
      'font-size:10px;font-weight:800;border-radius:999px;min-width:17px;height:17px;line-height:17px;',
      'text-align:center;display:none;}',
      '.anno-panel{position:fixed;right:26px;bottom:136px;z-index:9999;width:340px;',
      'max-width:calc(100vw - 40px);max-height:min(64vh,560px);background:#fff;',
      'border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 16px 40px rgba(15,23,42,.22);',
      'display:none;flex-direction:column;overflow:hidden;}',
      '.anno-panel header{display:flex;align-items:center;gap:6px;padding:12px 14px;',
      'border-bottom:1px solid #e2e8f0;font-weight:700;color:#1e293b;font-size:14px;}',
      '.anno-panel .anno-sync{margin-left:auto;font-size:11px;font-weight:600;border:1px solid #e2e8f0;',
      'background:#f8fafc;color:#94a3b8;border-radius:999px;padding:3px 10px;cursor:pointer;}',
      '.anno-panel .anno-sync:hover{border-color:#2456d6;}',
      '.anno-panel .anno-tools{display:flex;gap:4px;}',
      '.anno-panel .anno-tools button{font-size:11px;padding:3px 8px;border-radius:6px;cursor:pointer;',
      'border:1px solid #e2e8f0;background:#f8fafc;color:#475569;}',
      '.anno-panel .anno-tools button:hover{border-color:#2456d6;color:#2456d6;}',
      '.anno-panel .anno-tools .anno-clr:hover{border-color:#dc2626;color:#dc2626;}',
      '.anno-list{overflow-y:auto;padding:8px;}',
      '.anno-item{border:1px solid #e2e8f0;border-radius:10px;padding:8px 10px;margin-bottom:8px;',
      'cursor:pointer;background:#fff;}',
      '.anno-item:hover{border-color:#2456d6;}',
      '.anno-item .anno-top{display:flex;align-items:center;gap:6px;margin-bottom:4px;}',
      '.anno-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;}',
      '.anno-dot.c-y{background:#f59e0b}.anno-dot.c-g{background:#10b981}.anno-dot.c-r{background:#ef4444}',
      '.anno-time{font-size:11px;color:#94a3b8;}',
      '.anno-orphan{font-size:10px;color:#b45309;background:#fef3c7;border-radius:4px;padding:0 5px;}',
      '.anno-x{margin-left:auto;border:none;background:none;cursor:pointer;color:#94a3b8;',
      'font-size:12px;padding:0 2px;}',
      '.anno-x:hover{color:#dc2626;}',
      '.anno-ex{font-size:12.5px;color:#334155;display:-webkit-box;-webkit-line-clamp:2;',
      '-webkit-box-orient:vertical;overflow:hidden;}',
      '.anno-nt-wrap{margin-top:4px;}',
      '.anno-nt{font-size:12px;color:#0f766e;white-space:pre-wrap;max-height:57px;overflow:hidden;',
      'transition:max-height .25s;}',
      '.anno-nt.open{max-height:none;}',
      '.anno-more{font-size:11px;color:#2456d6;border:none;background:none;padding:2px 0 0;cursor:pointer;}',
      '.anno-empty{padding:26px 10px;text-align:center;color:#94a3b8;font-size:13px;}',

      '.anno-toast{position:fixed;left:50%;bottom:36px;transform:translateX(-50%);background:#0f172a;',
      'color:#fff;padding:10px 18px;border-radius:10px;font-size:13.5px;z-index:10003;',
      'opacity:0;transition:opacity .25s;pointer-events:none;max-width:80vw;}',
      '.anno-toast.show{opacity:1;}'
    ].join('');
    var s = document.createElement('style');
    s.textContent = css;
    document.head.appendChild(s);
  }

  /* ==================== XPath 定位 ==================== */
  function xpathOf(node) {
    var parts = [], n = node;
    while (n && n !== document.body) {
      if (n.nodeType === 3) {
        var ti = 1, ts = n.previousSibling;
        while (ts) { if (ts.nodeType === 3) ti++; ts = ts.previousSibling; }
        parts.unshift('text()[' + ti + ']');
      } else if (n.nodeType === 1) {
        var ei = 1, es = n.previousElementSibling;
        while (es) { if (es.tagName === n.tagName) ei++; es = es.previousElementSibling; }
        parts.unshift(n.tagName.toLowerCase() + '[' + ei + ']');
      }
      n = n.parentNode;
    }
    return parts.join('/');
  }
  function resolveNode(path) {
    if (!path) return null;
    try {
      return document.evaluate('./' + path, document.body, null,
        XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    } catch (e) { return null; }
  }
  function resolveRange(a) {
    var sc = resolveNode(a.sx), ec = resolveNode(a.ex);
    if (!sc || !ec) return null;
    try {
      var r = document.createRange();
      r.setStart(sc, Math.min(a.so, sc.nodeType === 3 ? sc.length : sc.childNodes.length));
      r.setEnd(ec, Math.min(a.eo, ec.nodeType === 3 ? ec.length : ec.childNodes.length));
      if (r.collapsed) return null;
      var c = r.commonAncestorContainer;
      var ce = c.nodeType === 1 ? c : c.parentNode;
      var main = document.querySelector('main');
      if (!main || !main.contains(ce)) return null;
      return r;
    } catch (e) { return null; }
  }
  function findByText(text) {
    if (!text || text.length < 4) return null;
    var main = document.querySelector('main');
    if (!main) return null;
    var w = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, null);
    while (w.nextNode()) {
      var n = w.currentNode;
      var i = n.nodeValue.indexOf(text);
      if (i >= 0) {
        var r = document.createRange();
        r.setStart(n, i);
        r.setEnd(n, i + text.length);
        return r;
      }
    }
    return null;
  }

  /* ==================== 划线的施加与清除 ==================== */
  function unmarkAll() {
    var main = document.querySelector('main');
    if (!main) return;
    main.querySelectorAll('.anno-chip').forEach(function (c) { c.remove(); });
    main.querySelectorAll('.anno-hl').forEach(function (mk) {
      var p = mk.parentNode;
      while (mk.firstChild) p.insertBefore(mk.firstChild, mk);
      mk.remove();
    });
    document.body.normalize();
  }
  function wrapRange(range, a) {
    var root = range.commonAncestorContainer.nodeType === 1
      ? range.commonAncestorContainer : range.commonAncestorContainer.parentNode;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var items = [];
    while (walker.nextNode()) {
      var n = walker.currentNode;
      if (!range.intersectsNode(n) || !n.nodeValue.length) continue;
      var s = 0, e = n.nodeValue.length;
      if (n === range.startContainer) s = range.startOffset;
      if (n === range.endContainer) e = range.endOffset;
      if (s < e && n.nodeValue.slice(s, e).trim()) items.push([n, s, e]);
    }
    if (!items.length) return;
    var lastMark = null;
    items.forEach(function (it) {
      var t = it[0];
      if (it[2] < t.nodeValue.length) t.splitText(it[2]);
      if (it[1] > 0) t = t.splitText(it[1]);
      var mark = document.createElement('mark');
      mark.className = 'anno-hl c-' + a.color;
      mark.dataset.aid = a.id;
      t.parentNode.replaceChild(mark, t);
      mark.appendChild(t);
      lastMark = mark;
    });
    if (a.note && lastMark) {
      var chip = document.createElement('sup');
      chip.className = 'anno-chip';
      chip.dataset.aid = a.id;
      chip.textContent = '✎';
      lastMark.after(chip);
    }
  }
  function applyAll() {
    unmarkAll();
    orphanIds = {};
    var jobs = [];
    annotations.forEach(function (a) {
      var r = resolveRange(a) || findByText(a.text);
      if (r) jobs.push({ a: a, r: r });
      else orphanIds[a.id] = true;
    });
    jobs.forEach(function (j) { wrapRange(j.r, j.a); });
    updatePanel();
  }

  /* ==================== 选区处理 ==================== */
  function clampToMain(range) {
    var main = document.querySelector('main');
    if (!main) return null;
    var mr = document.createRange();
    mr.selectNodeContents(main);
    var r = range.cloneRange();
    if (r.compareBoundaryPoints(Range.START_TO_START, mr) < 0) r.setStart(mr.startContainer, mr.startOffset);
    if (r.compareBoundaryPoints(Range.END_TO_END, mr) > 0) r.setEnd(mr.endContainer, mr.endOffset);
    return r.collapsed ? null : r;
  }
  function currentRange() {
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount || sel.isCollapsed) return null;
    var r = clampToMain(sel.getRangeAt(0));
    if (!r || !r.toString().trim()) return null;
    return r;
  }
  function createFromSelection(color, openEditor) {
    var r0 = currentRange();
    if (!r0) { toast('请先选中正文中的文字'); return; }
    unmarkAll();
    var a = {
      id: uid(), color: color || 'y', note: '',
      text: r0.toString(),
      sx: xpathOf(r0.startContainer), so: r0.startOffset,
      ex: xpathOf(r0.endContainer), eo: r0.endOffset,
      ts: Date.now()
    };
    if (!a.sx || !a.ex) { applyAll(); return; }
    annotations.push(a);
    save();
    applyAll();
    window.getSelection().removeAllRanges();
    if (openEditor) openDrawer(a.id, 'edit');
  }

  /* ==================== UI：工具条 / 边栏 / 面板 ==================== */
  var toolbar, drawer, fab, panel, list, badge, fileInput;
  var curId = null;        // 边栏当前展示的标注 id
  var drawerMode = 'view'; // 'view' | 'edit'
  var editColor = 'y';
  var previewOn = false;

  function showToolbar() {
    var r = currentRange();
    if (!r) { hide(toolbar); return; }
    toolbar.style.display = 'flex';
    var w = toolbar.offsetWidth, h = toolbar.offsetHeight;
    var rect = r.getBoundingClientRect();
    var x = Math.max(8, Math.min(rect.left + rect.width / 2 - w / 2, innerWidth - w - 8));
    var y = rect.top - h - 8;
    if (y < 8) y = Math.min(rect.bottom + 8, innerHeight - h - 8);
    toolbar.style.left = x + 'px';
    toolbar.style.top = y + 'px';
  }

  function syncColorBtns() {
    drawer.querySelectorAll('.anno-swb').forEach(function (b) {
      b.classList.toggle('sel', b.dataset.c === editColor);
    });
  }

  /** 打开边栏。mode: 'view' 查看 | 'edit' 编辑 */
  function openDrawer(id, mode) {
    var a = byId(id);
    if (!a) return;
    curId = id;
    editColor = a.color;
    drawerMode = mode || 'view';
    renderDrawer();
    drawer.classList.add('open');
    panel.style.display = 'none';
  }
  function closeDrawer() {
    drawer.classList.remove('open');
    curId = null;
  }

  /** 渲染边栏内容（每次打开/切模式/换标注都重画） */
  function renderDrawer() {
    var a = byId(curId);
    if (!a) return;
    drawer.innerHTML = '';

    /* —— 头部 —— */
    var head = el('div', 'ad-head');
    var dot = el('span', 'ad-dot c-' + a.color);
    head.appendChild(dot);
    head.appendChild(el('span', 'ad-tag', COLOR_LABEL[a.color] + (orphanIds[a.id] ? ' · 位置失效' : '')));
    head.appendChild(el('span', 'ad-time', fmt(a.ts)));
    var sp = el('span', 'ad-sp');
    head.appendChild(sp);
    if (drawerMode === 'view') {
      var be = el('button', 'ad-btn', '✎ 编辑');
      be.title = '编辑此批注（支持 Markdown）';
      be.addEventListener('click', function () { drawerMode = 'edit'; renderDrawer(); });
      head.appendChild(be);
    } else {
      var bv = el('button', 'ad-btn', '👁 查看模式');
      bv.addEventListener('click', function () { drawerMode = 'view'; renderDrawer(); });
      head.appendChild(bv);
    }
    var bc = el('button', 'ad-btn', '✕');
    bc.title = '收起边栏';
    bc.addEventListener('click', closeDrawer);
    head.appendChild(bc);
    drawer.appendChild(head);

    /* —— 原文摘录 —— */
    var quote = el('div', 'ad-quote');
    quote.appendChild(el('b', null, '划线原文：'));
    quote.appendChild(document.createTextNode(a.text));
    drawer.appendChild(quote);

    /* —— 主体 —— */
    var main = el('div', 'ad-main');
    if (drawerMode === 'view') {
      var view = el('div', 'ad-view');
      if (a.note) {
        var md = el('div', 'md-body');
        md.innerHTML = mdToHtml(a.note);   // mdToHtml 内部已全量转义，仅还原有限白名单标签
        view.appendChild(md);
      } else {
        view.appendChild(el('div', 'ad-empty-note', '暂无批注 —— 点右上角「✎ 编辑」写下你的笔记（支持 Markdown）'));
      }
      main.appendChild(view);
    } else {
      var wrap = el('div', 'ad-edit-wrap');
      var ta = el('textarea', 'ad-ta');
      ta.value = a.note || '';
      ta.placeholder = '支持 Markdown：\n# 标题\n**加粗** *斜体* `行内码`\n- 列表\n> 引用\n```java\n代码块\n```';
      ta.spellcheck = false;
      wrap.appendChild(ta);
      if (previewOn) {
        var pv = el('div', 'ad-preview md-body');
        pv.innerHTML = mdToHtml(ta.value);
        wrap.appendChild(pv);
        ta.addEventListener('input', function () { pv.innerHTML = mdToHtml(ta.value); });
      }
      main.appendChild(wrap);
      drawer.appendChild(main);

      /* —— 编辑底部：颜色 + 预览开关 + 保存/删除 —— */
      var foot = el('div', 'ad-foot');
      foot.appendChild(el('span', 'ad-lb', '颜色'));
      Object.keys(COLORS).forEach(function (k) {
        var b = el('button', 'anno-swb');
        b.style.background = COLORS[k];
        b.dataset.c = k;
        b.title = COLOR_LABEL[k];
        b.addEventListener('click', function () { editColor = k; syncColorBtns(); });
        foot.appendChild(b);
      });
      var bp = el('button', 'ad-btn', previewOn ? '预览：开' : '预览：关');
      bp.addEventListener('click', function () {
        previewOn = !previewOn;
        renderDrawer();
      });
      foot.appendChild(bp);
      foot.appendChild(el('span', 'ad-sp'));
      var bd = el('button', 'ad-btn danger', '删除');
      bd.addEventListener('click', function () {
        annotations = annotations.filter(function (x) { return x.id !== curId; });
        save(); applyAll(); closeDrawer();
      });
      var bs = el('button', 'ad-btn pri', '保存');
      bs.addEventListener('click', function () {
        var t = byId(curId);
        if (t) {
          t.color = editColor;
          t.note = ta.value;
          t.ts = t.ts;           // 保留创建时间
          save(); applyAll();
        }
        drawerMode = 'view';
        renderDrawer();
      });
      foot.appendChild(bd);
      foot.appendChild(bs);
      drawer.appendChild(foot);

      setTimeout(function () { ta.focus(); }, 80);
      return;
    }
    drawer.appendChild(main);
  }

  function buildUI() {
    /* 选区工具条 */
    toolbar = el('div', 'anno-toolbar');
    Object.keys(COLORS).forEach(function (k) {
      var b = el('button', 'anno-sw');
      b.style.background = COLORS[k];
      b.title = '划线 · ' + COLOR_LABEL[k];
      b.addEventListener('mousedown', function (e) { e.preventDefault(); });
      b.addEventListener('click', function () { createFromSelection(k, false); hide(toolbar); });
      toolbar.appendChild(b);
    });
    var nb = el('button', 'anno-nb', '✎ 备注');
    nb.addEventListener('mousedown', function (e) { e.preventDefault(); });
    nb.addEventListener('click', function () { createFromSelection('y', true); hide(toolbar); });
    toolbar.appendChild(nb);

    /* 右侧边栏 */
    drawer = el('div', 'anno-drawer');

    /* 悬浮按钮 */
    fab = el('button', 'anno-fab', '✒');
    fab.title = '我的标注';
    badge = el('span', 'anno-badge', '');
    fab.appendChild(badge);
    fab.addEventListener('click', function () {
      panel.style.display = (panel.style.display === 'flex') ? 'none' : 'flex';
    });

    /* 管理面板 */
    panel = el('div', 'anno-panel');
    var head = el('header');
    head.appendChild(el('span', null, '我的标注'));
    /* 同步状态标签：点击 = 手动同步（推未推送数据 / 拉云端最新） */
    syncBtn = el('button', 'anno-sync', '同步中…');
    syncBtn.addEventListener('click', function (e) { e.stopPropagation(); manualSync(); });
    head.appendChild(syncBtn);
    var tools = el('div', 'anno-tools');
    var btnExp = el('button', null, '导出');
    var btnImp = el('button', null, '导入');
    var btnClr = el('button', 'anno-clr', '清空');
    btnExp.addEventListener('click', exportData);
    btnImp.addEventListener('click', function () { fileInput.click(); });
    btnClr.addEventListener('click', clearAll);
    tools.appendChild(btnExp);
    tools.appendChild(btnImp);
    tools.appendChild(btnClr);
    head.appendChild(tools);
    list = el('div', 'anno-list');
    panel.appendChild(head);
    panel.appendChild(list);

    /* 文件导入 */
    fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json,application/json';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', function () {
      if (fileInput.files && fileInput.files[0]) importData(fileInput.files[0]);
      fileInput.value = '';
    });

    toastEl = el('div', 'anno-toast');
    [toolbar, drawer, fab, panel, fileInput, toastEl].forEach(function (n) { document.body.appendChild(n); });

    /* 全局事件 */
    document.addEventListener('mouseup', function (e) {
      if (e.target.closest('.anno-toolbar, .anno-drawer, .anno-panel, .anno-fab')) return;
      setTimeout(showToolbar, 0);
    });
    document.addEventListener('click', function (e) {
      var t = e.target.closest('.anno-hl, .anno-chip');
      if (t) { openDrawer(t.dataset.aid, 'view'); return; }
      if (e.target.closest('.anno-drawer, .anno-toolbar, .anno-panel, .anno-fab')) return;
      hide(toolbar);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeDrawer(); hide(toolbar); panel.style.display = 'none'; }
      // Cmd/Ctrl+Enter 快速保存编辑中的批注
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && drawerMode === 'edit') {
        var btn = drawer.querySelector('.ad-btn.pri');
        if (btn) btn.click();
      }
    });
    window.addEventListener('scroll', function () { hide(toolbar); }, { passive: true });
  }

  /* ==================== 面板列表 ==================== */
  function updatePanel() {
    badge.textContent = annotations.length || '';
    badge.style.display = annotations.length ? 'block' : 'none';
    list.innerHTML = '';
    if (!annotations.length) {
      list.appendChild(el('div', 'anno-empty', '还没有标注 —— 选中正文文字试试'));
      return;
    }
    annotations.slice().sort(function (a, b) { return a.ts - b.ts; }).forEach(function (a) {
      var item = el('div', 'anno-item');
      var top = el('div', 'anno-top');
      top.appendChild(el('span', 'anno-dot c-' + a.color));
      top.appendChild(el('span', 'anno-time', fmt(a.ts)));
      if (orphanIds[a.id]) top.appendChild(el('span', 'anno-orphan', '位置失效'));
      var x = el('button', 'anno-x', '✕');
      x.title = '删除此标注';
      top.appendChild(x);
      item.appendChild(top);
      item.appendChild(el('div', 'anno-ex', a.text));
      if (a.note) {
        var nw = el('div', 'anno-nt-wrap');
        var nt = el('div', 'anno-nt', a.note);
        var more = el('button', 'anno-more', '展开 ▾');
        more.addEventListener('click', function (e) {
          e.stopPropagation();
          nt.classList.toggle('open');
          more.textContent = nt.classList.contains('open') ? '收起 ▴' : '展开 ▾';
        });
        nw.appendChild(nt);
        nw.appendChild(more);
        item.appendChild(nw);
        setTimeout(function () {           // 溢出才显示 展开/收起
          if (nt.scrollHeight <= nt.clientHeight + 2) more.style.display = 'none';
        }, 0);
      }
      item.addEventListener('click', function (e) {
        if (e.target.closest('.anno-x, .anno-more')) return;
        locate(a.id);
        openDrawer(a.id, 'view');
      });
      x.addEventListener('click', function (e) {
        e.stopPropagation();
        annotations = annotations.filter(function (t) { return t.id !== a.id; });
        save(); applyAll();
      });
      list.appendChild(item);
    });
  }

  function locate(id) {
    var marks = document.querySelectorAll('.anno-hl[data-aid="' + id + '"]');
    if (!marks.length) return;
    var m = marks[0];
    var d = m.closest('details');
    if (d && !d.open) d.open = true;
    m.scrollIntoView({ behavior: 'smooth', block: 'center' });
    marks.forEach(function (k) {
      k.classList.add('flash');
      setTimeout(function () { k.classList.remove('flash'); }, 1400);
    });
  }

  /* ==================== 导出 / 导入 / 清空 ==================== */
  function exportData() {
    if (!annotations.length) return toast('本页还没有标注');
    var data = { page: PAGE, exportedAt: new Date().toISOString(), annotations: annotations };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '标注-' + PAGE.replace(/\.html?$/i, '') + '-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('已导出 ' + annotations.length + ' 条标注');
  }
  function importData(file) {
    var rd = new FileReader();
    rd.onload = function () {
      var data;
      try { data = JSON.parse(rd.result); } catch (e) { return toast('文件不是合法的 JSON'); }
      var arr = Array.isArray(data) ? data : data.annotations;
      if (!Array.isArray(arr)) return toast('文件中没有标注数据');
      var map = {};
      annotations.forEach(function (a) { map[a.id] = a; });
      var n = 0;
      arr.forEach(function (a) {
        if (!a || typeof a.text !== 'string') return;
        if (!a.id) a.id = uid();
        if (!COLORS[a.color]) a.color = 'y';
        a.note = typeof a.note === 'string' ? a.note : '';
        map[a.id] = a;
        n++;
      });
      annotations = Object.keys(map).map(function (k) { return map[k]; });
      save(); applyAll();
      toast('已导入 ' + n + ' 条标注');
    };
    rd.readAsText(file, 'utf-8');
  }
  function clearAll() {
    if (!annotations.length) return toast('本页没有标注');
    if (!confirm('确定清空本页全部 ' + annotations.length + ' 条标注？（建议先导出备份）')) return;
    annotations = [];
    save(); applyAll();
    toast('已清空');
  }

  /* ==================== 启动 ==================== */
  function init() {
    injectStyles();
    buildUI();
    load();          // 1. 先读本地缓存 → 立即渲染划线（秒开，不等网络）
    applyAll();
    syncStart();     // 2. 后台连云端：有离线修改先补推，否则拉云端最新（较新则覆盖重画）
    if (!localStorage.getItem(HINT_KEY)) {
      toast('选中正文文字即可划线/写批注（支持 Markdown），数据自动同步云端，也可在面板「导出」备份', 4200);
      try { localStorage.setItem(HINT_KEY, '1'); } catch (e) { }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
