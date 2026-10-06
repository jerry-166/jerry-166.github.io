/* ============================================================
 * app.js —— MySQL 逻辑链活文档的交互脚本（博客版，v2.1）
 * 功能一：目录 scrollspy（滚动到哪个章节，侧边目录对应项高亮）
 * 功能二：自检清单勾选状态持久化（localStorage，换天打开仍保留）
 * 功能三：模块切换（架构链 / 锁）——切换 body class + 记住上次模块
 * 注意：本页另挂 anno.js 划线系统（独立运行，与本文件零耦合）；
 *       划线锚定在 DOM 结构上，模块切换只改 display 不动 DOM，
 *       因此切模块不会影响任何已有划线。
 * 无任何外部依赖；页面纯静态打开即可运行。
 * ============================================================ */
(function () {
  "use strict";

  /* ---------- 功能三：模块切换（v2.0 起） ---------- */
  // 机制：Tab 点击 → 切换 body 的 mod-arch / mod-lock class → CSS 控制显隐。
  // body 标签自带默认 class="mod-arch"（HTML 兜底），此处再从 localStorage
  // 恢复上次停留的模块，避免刷新后跳回默认模块。
  var MOD_KEY = "mysql-arch-logic-module"; // 模块选择持久化 key
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".mod-tab"));

  function applyModule(mod) {
    var target = mod === "lock" ? "lock" : "arch"; // 白名单兜底，防 localStorage 注入任意 class
    document.body.classList.remove("mod-arch", "mod-lock");
    document.body.classList.add("mod-" + target);
    tabs.forEach(function (t) { t.classList.toggle("on", t.getAttribute("data-mod") === target); });
  }

  try {
    var savedMod = localStorage.getItem(MOD_KEY);
    if (savedMod) applyModule(savedMod);
  } catch (e) { /* 隐私模式读取失败则用默认 arch */ }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var mod = tab.getAttribute("data-mod") === "lock" ? "lock" : "arch";
      applyModule(mod);
      try { localStorage.setItem(MOD_KEY, mod); } catch (e) {}
      // 切换后回到页面顶部，避免停留在被隐藏章节的滚动位置
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  /* ---------- 功能一：目录 scrollspy ---------- */
  // 收集两套目录里所有锚点对应的章节元素（隐藏章节不触发 observer）
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll(".toc a"));
  var sections = tocLinks
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  if (sections.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        // 命中章节：先清空全部高亮，再点亮当前项
        tocLinks.forEach(function (a) { a.classList.remove("active"); });
        var link = document.querySelector('.toc a[href="#' + entry.target.id + '"]');
        if (link) link.classList.add("active");
      });
    }, { rootMargin: "-20% 0px -70% 0px" }); // 视口中部偏上视为"当前章节"
    sections.forEach(function (s) { io.observe(s); });
  }

  /* ---------- 功能二：自检清单持久化 ---------- */
  var STORE_KEY = "mysql-arch-logic-checks-v1"; // 升级文档时保留勾选记录

  function readState() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
    catch (e) { return {}; }
  }

  var state = readState();
  // 注意：选择器用 .checklist（覆盖架构模块 #checklist 与锁模块 ul.checklist 两套清单）
  var boxes = Array.prototype.slice.call(document.querySelectorAll(".checklist input[type=checkbox]"));

  // 初始：回填上次勾选状态，并给已完成项加删除线样式
  boxes.forEach(function (box) {
    if (state[box.id]) {
      box.checked = true;
      if (box.parentElement) box.parentElement.classList.add("done");
    }
    box.addEventListener("change", function () {
      state[box.id] = box.checked;
      if (box.parentElement) box.parentElement.classList.toggle("done", box.checked);
      try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* 忽略隐私模式写入失败 */ }
    });
  });

  // 连续双击自检清单标题 3 次可清空勾选（隐藏的复位入口，避免误触）
  // 注意：架构模块入口在 #c11（自检清单章），锁模块入口在 #l8——章节重编号时需同步更新
  var resetTargets = ["#c11 h2", "#l8 h2"];
  resetTargets.forEach(function (selector) {
    var h2 = document.querySelector(selector);
    if (!h2) return;
    var taps = 0, timer = null;
    h2.addEventListener("dblclick", function () {
      taps++;
      clearTimeout(timer);
      timer = setTimeout(function () { taps = 0; }, 600);
      if (taps >= 3) {
        taps = 0;
        boxes.forEach(function (box) {
          box.checked = false;
          if (box.parentElement) box.parentElement.classList.remove("done");
        });
        state = {};
        try { localStorage.removeItem(STORE_KEY); } catch (e) {}
        var tip = document.querySelector("#c11 p");
        if (tip) tip.textContent = "勾选记录已清空，重新开始自检。";
      }
    });
  });
})();
