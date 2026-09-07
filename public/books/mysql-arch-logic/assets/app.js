/* ============================================================
 * app.js —— MySQL 架构逻辑链活文档的交互脚本
 * 功能一：目录 scrollspy（滚动到哪个章节，侧边目录对应项高亮）
 * 功能二：自检清单勾选状态持久化（localStorage，换天打开仍保留）
 * 无任何外部依赖；页面纯静态打开即可运行。
 * ============================================================ */
(function () {
  "use strict";

  /* ---------- 功能一：目录 scrollspy ---------- */
  // 收集目录里所有锚点对应的章节元素
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
  var boxes = Array.prototype.slice.call(document.querySelectorAll("#checklist input[type=checkbox]"));

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

  // 连续双击清单区域标题 5 次可清空勾选（隐藏的复位入口，避免误触）
  // 注意：#c11 是"自检清单"章节 id，章节重编号时需同步更新
  var h2 = document.querySelector("#c11 h2");
  if (h2) {
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
  }
})();
