(function() {
  // 代码块复制按钮：点击后把 <code> 的纯文本复制到剪贴板
  // （用 textContent 而非 innerHTML，天然避开 HTML 转义符问题）
  document.querySelectorAll(".codebox").forEach(function(box) {
    var btn = box.querySelector(".cb-btn");
    var code = box.querySelector("code");
    if (!btn || !code) return;

    btn.addEventListener("click", function() {
      var text = code.textContent;

      function done() {
        var original = btn.textContent;
        btn.textContent = "已复制 ✓";
        setTimeout(function() { btn.textContent = original; }, 1500);
      }

      // 优先用现代异步剪贴板 API，失败则退回旧版方案
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function() {
          fallbackCopy(text);
          done();
        });
      } else {
        fallbackCopy(text);
        done();
      }
    });
  });

  // 旧浏览器兜底：临时 textarea + execCommand
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
  }
})();
