/* ============================================================
   第二册 React 手册 · 交互演示脚本（6 个演示）
   演示 1：命令式 vs 声明式（#demo1）
   演示 2：JSX ⇄ 编译结果切换（#demo2）
   演示 3：引用相等性实验台（#demo3）
   演示 4：key=index vs key=id 匹配实验（#demo4）
   演示 5：useEffect 依赖数组模拟器（#demo5）
   演示 6：迷你 React 引擎驱动的待办清单（#demo6）
   ============================================================ */
(function () {
  "use strict";

  /* ---------- 通用小工具 ---------- */
  // 按 id 快捷取元素（页面上所有演示元素都遵循 d<编号>-<名字> 命名）
  function $id(id) { return document.getElementById(id); }

  // 每个演示独立初始化：一个演示挂了不影响其他演示
  function safeInit(name, fn) {
    try { fn(); } catch (e) { console.error("[demo init failed] " + name, e); }
  }

  /* ============================================================
     演示 1 · 命令式 vs 声明式
     左边：数据 +1 后，三处 UI 要你自己点按钮同步（漏一步就「数据与界面对不上」）
     右边：模拟 React —— 改 state 后三处 UI 自动同步
     ============================================================ */
  safeInit("demo1", function () {
    var box = $id("demo1");
    if (!box) return;

    // ----- 左侧（命令式）的真实状态 -----
    var done = 0;        // 数据本体：已完成的任务数（0~5）
    var steps = 0;       // 你手动点了多少次「更新」按钮
    var uiNum = 0;       // 屏幕上数字当前显示的值（可能落后于 done！）
    var uiBar = 0;       // 进度条当前显示的值
    var uiText = 0;      // 文案当前对应的值

    // ----- 右侧（声明式）的 state -----
    var state = 0;

    var TOTAL = 5; // 假设一共 5 项任务，进度按 done/5 计算

    // 根据 n 生成文案：让「文案」和数字明显不同步时能看出来
    function textFor(n) {
      if (n <= 0) return "还没有完成任务";
      if (n >= TOTAL) return "全部 5 项完成，干得漂亮！";
      return "进行中…已完成 " + n + "/5 项";
    }

    // 刷新左侧读数区：数据、步数、以及「哪些 UI 落后了」的警告
    function refreshLeftReadout() {
      var warns = [];
      // 三处 UI 分别和数据本体比对——只要有任何一处没手动更新，就报警
      if (uiNum !== done) warns.push("⚠ 数字与数据不一致（落后 " + (done - uiNum) + "）");
      if (uiBar !== done) warns.push("⚠ 进度条与数据不一致");
      if (uiText !== done) warns.push("⚠ 文案与数据不一致");
      var html = "数据：" + done + " · 手动更新步数：" + steps;
      if (warns.length) html += "\n" + warns.join("\n") + "\n——这就是第一册的痛点：你忘了哪步，界面就错哪步。";
      $id("d1-readout").textContent = html;
    }

    // 把左侧三处 UI 更新到指定值（只有你点对应按钮才调用）
    function paintLeft() {
      $id("d1-num").textContent = uiNum;
      $id("d1-bar").style.width = Math.min(uiBar / TOTAL, 1) * 100 + "%";
      $id("d1-text").textContent = textFor(uiText);
    }

    // 右侧：模拟 React 的「UI = f(state)」——state 一变，三处 UI 一次全对齐
    function paintRight(flash) {
      $id("d1-state").textContent = state;
      $id("d1-rnum").textContent = state;
      $id("d1-rbar").style.width = Math.min(state / TOTAL, 1) * 100 + "%";
      $id("d1-rtext").textContent = textFor(state);
      $id("d1-rreadout").textContent =
        "state：" + state + " · React 自动同步三处 UI（你手动更新步数：0）\n" +
        "你只调用了 setState(" + state + ")，剩下的事（数字/进度条/文案）全是「算」出来的。";
      // 闪烁提示：这块区域刚经历了一次「重渲染」
      if (flash) {
        var card = $id("d1-rightcard");
        card.classList.remove("render-flash");
        void card.offsetWidth; // 强制重排，让动画能重新触发
        card.classList.add("render-flash");
      }
    }

    function reset() {
      done = 0; steps = 0; uiNum = 0; uiBar = 0; uiText = 0; state = 0;
      paintLeft(); refreshLeftReadout(); paintRight(false);
    }

    // 事件委托：演示 1 容器内所有按钮统一在这里分发
    box.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      var act = btn.getAttribute("data-act");

      if (act === "inc") {
        if (done < TOTAL) done++;          // 数据变了——但 UI 一动不动，等你手动同步
      } else if (act === "syncNum") {
        uiNum = done; steps++;             // 手动把数字追上数据
      } else if (act === "syncBar") {
        uiBar = done; steps++;
      } else if (act === "syncText") {
        uiText = done; steps++;
      } else if (act === "set") {
        if (state < TOTAL) state++;        // 声明式：只改 state
        paintRight(true);
        return;                            // 右侧自己刷，不用走左侧逻辑
      } else if (act === "reset") {
        reset();
        return;
      }
      paintLeft();
      refreshLeftReadout();
    });

    reset(); // 初始化
  });

  /* ============================================================
     演示 2 · JSX ⇄ 编译结果切换器
     左边是你写的 JSX；右边在两种编译产物之间切换：
     ① React.createElement（经典写法，React 16 及以前）
     ② jsx() 自动运行时（React 17+，Vite 默认）
     ============================================================ */
  safeInit("demo2", function () {
    var input = $id("d2-name");
    var srcEl = $id("d2-src");
    var outEl = $id("d2-out");
    var noteEl = $id("d2-note");
    var toggleBtn = $id("d2-toggle");
    if (!input || !srcEl) return;

    var mode = "classic"; // classic = createElement | modern = jsx() 运行时

    // 名字里若含引号，转义后展示，避免看起来像语法错误
    function esc(s) { return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"'); }

    function render() {
      var name = input.value === "" ? "（空）" : input.value;
      var safe = esc(name);

      // ---------- 左侧：你写的 JSX 源码 ----------
      srcEl.textContent =
        'function Greeting({ name }) {\n' +
        '  return (\n' +
        '    <h1 className="title">\n' +
        '      你好，{name}！\n' +
        '    </h1>\n' +
        '  );\n' +
        '}\n' +
        '\n' +
        '<Greeting name="' + safe + '" />';

      // ---------- 右侧：编译产物（两种形态） ----------
      if (mode === "classic") {
        outEl.textContent =
          '// 编译器（Babel/esbuild）把每个尖括号都翻译成函数调用：\n' +
          'React.createElement(\n' +
          '  Greeting,              // 组件：大写开头 → 当函数找\n' +
          '  { name: "' + safe + '" }    // props：一个普通对象\n' +
          ')\n' +
          '\n' +
          '// Greeting 内部 return 的东西，同样被翻译：\n' +
          'React.createElement(\n' +
          '  "h1",                  // 小写开头 → 当 HTML 标签\n' +
          '  { className: "title" },\n' +
          '  "你好，", name, "！"    // children：变量混在字符串里传\n' +
          ')';
        noteEl.textContent =
          "经典形态：JSX = React.createElement 的语法糖。\n" +
          "运行时真正得到的是普通 JS 对象（虚拟 DOM 节点）：\n" +
          '{ type: Greeting, props: { name: "' + safe + '" } }\n' +
          '{ type: "h1", props: { className: "title", children: ["你好，' + name + '！"] } }\n' +
          "—— 浏览器从头到尾没见过一个尖括号。";
      } else {
        outEl.textContent =
          '// React 17+ 的「自动运行时」：不再需要 import React\n' +
          'import { jsx as _jsx } from "react/jsx-runtime";\n' +
          '\n' +
          '_jsx(Greeting, { name: "' + safe + '" })\n' +
          '\n' +
          '// Greeting 内部：\n' +
          '_jsx("h1", {\n' +
          '  className: "title",\n' +
          '  children: ["你好，", name, "！"]   // children 统一收进 props\n' +
          '})';
        noteEl.textContent =
          "现代形态：编译器自动注入 _jsx，所以新代码里可以不写 import React。\n" +
          "两种形态运行结果完全等价——都产出同一个虚拟 DOM 对象：\n" +
          '{ type: "h1", props: { className: "title", children: ["你好，' + name + '！"] } }\n' +
          "记住面试标准答案：JSX 是语法糖，编译后是函数调用，运行时是 JS 对象。";
      }

      toggleBtn.textContent = mode === "classic"
        ? "当前视角：createElement（经典）· 点击切到 jsx() 运行时"
        : "当前视角：jsx() 运行时（React 17+）· 点击切回 createElement";
    }

    input.addEventListener("input", render);
    toggleBtn.addEventListener("click", function () {
      mode = mode === "classic" ? "modern" : "classic";
      render();
    });
    render();
  });

  /* ============================================================
     演示 3 · 引用相等性实验台（push vs [...arr]）
     左边模拟「原地修改」：内容变了但引用不变 → Object.is = true → 不重渲染
     右边模拟「不可变更新」：每次造新数组 → Object.is = false → 重渲染 +1
     ============================================================ */
  safeInit("demo3", function () {
    var arrA = ["待办A", "待办B"];   // 左边的数组（会被原地修改）
    var arrB = ["待办A", "待办B"];   // 右边的数组（每次换新的）
    var refBn = 1;                   // 右边数组的「地址」编号：每造一个新数组 +1
    var seqA = 0, seqB = 0;          // 两侧各自的新任务序号
    var renderCount = 0;             // 「真实重渲染」次数：只有右边会涨
    var logs = [];

    function fmtArr(arr) {
      var s = "[" + arr.map(function (x) { return '"' + x + '"'; }).join(", ") + "]";
      return s.length > 46 ? s.slice(0, 44) + "…" : s;
    }

    function paint() {
      $id("d3-arrA").textContent = fmtArr(arrA);
      $id("d3-refA").textContent = "#A1（从未变过）";
      $id("d3-arrB").textContent = fmtArr(arrB);
      $id("d3-refB").textContent = "#B" + refBn;
      $id("d3-rendercount").textContent = renderCount;

      var head = "React 判据：Object.is(旧值, 新值) —— 对象比的是地址，不是内容。\n";
      var body = logs.length ? logs.join("\n") : "点上面的按钮做实验。";
      var tail = "\n\n当前界面渲染次数：" + renderCount + "（只有方式 B 能让它 +1）";
      $id("d3-readout").textContent = head + body + tail;
    }

    function pushLog(line) {
      logs.push(line);
      if (logs.length > 4) logs.shift(); // 只留最近 4 条，避免读数区无限变长
    }

    $id("d3-push").addEventListener("click", function () {
      var label = "任务" + (++seqA);
      arrA.push(label); // 原地修改：数组的「地址」没有任何变化
      pushLog(
        "A：todos.push(\"" + label + "\") → 内容确实加了，但数组还是原来那个（#A1）" +
        " → Object.is = true → React：「没变」→ 界面不更新 ✗"
      );
      paint();
    });

    $id("d3-spread").addEventListener("click", function () {
      var label = "任务" + (++seqB);
      arrB = arrB.concat([label]); // 不可变更新：concat 返回新数组（等价 [...arr, x]）
      refBn++;                     // 新数组 = 新地址
      renderCount++;               // React 认账 → 真实重渲染一次
      pushLog(
        "B：setTodos([...todos, \"" + label + "\"]) → 造出新数组（#B" + refBn + "）" +
        " → Object.is = false → React：「变了」→ 重渲染 ✓ 渲染次数 +1"
      );
      paint();
    });

    $id("d3-reset").addEventListener("click", function () {
      arrA = ["待办A", "待办B"];
      arrB = ["待办A", "待办B"];
      refBn = 1; seqA = 0; seqB = 0; renderCount = 0; logs = [];
      paint();
    });

    paint();
  });

  /* ============================================================
     样式注入：演示 4/5/6 由 JS 生成的 DOM 需要的少量样式
     （选择器带前缀，不会污染手册页面其他部分）
     ============================================================ */
  var injected = document.createElement("style");
  injected.textContent = [
    // ---- 演示 4：key 实验台的行样式 ----
    ".d4-row { display:flex; align-items:center; gap:8px; padding:6px 8px; border-bottom:1px dashed var(--rule); }",
    ".d4-row:last-child { border-bottom:none; }",
    ".d4-badge { font-size:11px; font-weight:700; padding:1px 7px; border-radius:99px; white-space:nowrap; }",
    ".d4-first   { background:#EEF1F8; color:var(--muted); }",
    ".d4-keep    { background:#E3F6EC; color:#0E9F6E; }",
    ".d4-relabel { background:#FDE8E8; color:#D93025; }",
    ".d4-new     { background:#FFF4DE; color:#B45309; }",
    ".d4-label { font-size:13.5px; font-weight:600; min-width:60px; white-space:nowrap; }",
    ".d4-input { flex:1; min-width:0; font-size:13px; padding:3px 8px; border:1px solid var(--rule); border-radius:6px; font-family:inherit; }",
    ".d4-bad .d4-input { border-color:#D93025; border-style:dashed; background:#FFF7F7; }",
    // ---- 演示 5：依赖模拟器的日志行颜色 ----
    ".d5-line { line-height:1.75; font-size:12.5px; }",
    ".d5-head { font-weight:700; color:var(--accent); }",
    ".d5-sub { color:var(--muted); font-size:12px; }",
    ".d5-r { color:var(--ink); font-weight:700; }",
    ".d5-e { color:#0E9F6E; }",
    ".d5-c { color:var(--muted); }"
  ].join("\n");
  document.head.appendChild(injected);

  /* ============================================================
     演示 4 · key 匹配实验台：key=index vs key=id（全册最推荐）
     两列共享同一份数据源，唯一变量是 React 给「行」发什么身份证：
       左 · key=index（座位号）：React 按位置匹配。删中间项后，
         「写周报」座位上的节点文字被改写成「买牛奶」，
         但输入框里的草稿（DOM 内部状态，React 看不见）留在原座位 → 张冠李戴
       右 · key=id（身份证）：React 按身份匹配。谁的 id 没了就销毁谁的节点
         （草稿陪葬），其余节点原样保留 → 草稿忠实跟随主人
     ============================================================ */
  safeInit("demo4", function () {
    var listA = $id("d4-listA");
    var listB = $id("d4-listB");
    if (!listA || !listB) return;

    // ---- 数据层：两列共用的数组 state（[{ id, label }]）----
    var nextId = 104;    // 模拟后端主键发号器（稳定 id 的来源）
    var insertSeq = 0;   // 头部插入的序号（新任务1、新任务2…）
    var tasks;

    // ---- DOM 层：模拟两列「真实存在的 DOM 节点」----
    // 每行三个字段，归属完全不同（这是本演示的核心设定）：
    //   label   → React 管的内容（每次渲染从数据同步过来）
    //   draft   → DOM 自己的状态（你在输入框里打的字），React 完全看不见它
    //   ownerId → 这行 DOM 当前属于哪个 id（右列身份匹配的依据；左列用不到）
    var rowsA, rowsB;

    function readout(text) { $id("d4-readout").textContent = text; }

    function resetAll() {
      tasks = [
        { id: 101, label: "查资料" },
        { id: 102, label: "写周报" },   // 中间项：删除按钮的目标
        { id: 103, label: "买牛奶" }
      ];
      rowsA = tasks.map(function (t) { return { ownerId: null, label: t.label, draft: "", origin: "first" }; });
      rowsB = tasks.map(function (t) { return { ownerId: t.id,  label: t.label, draft: "", origin: "first" }; });
      paintColumns();
      readout(
        "先在两边的输入框里随便打几个字（制造 DOM 内部状态），再点「删除中间项」或「头部插入新项」。\n" +
        "看点：草稿（你打的字）到底跟着座位走，还是跟着任务本身走。"
      );
    }

    // 画出一列：角标（DOM 来历）+ 任务文字（React 管的）+ 草稿输入框（DOM 自己的）
    function paintColumn(container, rows) {
      container.innerHTML = "";
      rows.forEach(function (row) {
        var line = document.createElement("div");
        line.className = "d4-row" + (row.origin === "relabel" ? " d4-bad" : "");

        var badge = document.createElement("span");
        badge.className = "d4-badge d4-" + row.origin;
        badge.textContent = row.origin === "first"  ? "初始"
                          : row.origin === "keep"   ? "复用"
                          : row.origin === "relabel"? "换字"
                          : "新建";
        line.appendChild(badge);

        var label = document.createElement("span");
        label.className = "d4-label";
        label.textContent = row.label;
        line.appendChild(label);

        var input = document.createElement("input");
        input.type = "text";
        input.className = "d4-input";
        input.placeholder = "打点字";
        input.value = row.draft;                                  // 重建时把草稿放回去
        input.addEventListener("input", function () {             // 打字只记到行模型上，
          row.draft = input.value;                                // 不触发任何「渲染」——
        });                                                       // 因为草稿不是 React 的 state
        line.appendChild(input);

        container.appendChild(line);
      });
    }

    function paintColumns() {
      paintColumn(listA, rowsA);
      paintColumn(listB, rowsB);
    }

    // 两列中任一行有草稿，才看得出 key 的威力
    function hasDraft() {
      return rowsA.concat(rowsB).some(function (r) { return r.draft !== ""; });
    }
    function draftHint() {
      return hasDraft() ? "" : "\n\n（你还一行字都没打——点「重置」后在输入框里打点字，效果立现。）";
    }

    // ---- 左列重算：座位号匹配（模拟 key=index 时 React 的 diff 行为）----
    // 位置 i 有旧节点 → 复用：文字改成新数据第 i 项的 label，草稿留在原座位
    // 位置 i 超出旧行数 → 新建节点（草稿为空）
    function remapByIndex(oldRows) {
      return tasks.map(function (t, i) {
        if (i < oldRows.length) {
          return {
            ownerId: null, label: t.label, draft: oldRows[i].draft,
            origin: oldRows[i].label === t.label ? "keep" : "relabel"
          };
        }
        return { ownerId: null, label: t.label, draft: "", origin: "new" };
      });
    }

    // ---- 右列重算：身份证匹配（模拟 key=id 时 React 的 diff 行为）----
    // 数据里每个 id 找到自己原来的节点 → 原样保留（草稿跟主人走）
    // 找不到旧节点的 id → 新建；数据里消失的 id → 节点整个销毁（草稿陪葬）
    function remapById(oldRows) {
      var pool = oldRows.map(function (r) { return r; });   // 可认领的旧节点池
      var rows = tasks.map(function (t) {
        for (var j = 0; j < pool.length; j++) {
          if (pool[j] && pool[j].ownerId === t.id) {
            var hit = pool[j];
            pool[j] = null;                                  // 该节点已被认领
            return { ownerId: t.id, label: t.label, draft: hit.draft, origin: "keep" };
          }
        }
        return { ownerId: t.id, label: t.label, draft: "", origin: "new" };
      });
      // 池里剩下的 = 新数据里已不存在的 id → 它们的节点被 React 销毁
      return { rows: rows, destroyed: pool.filter(Boolean) };
    }

    $id("d4-delmid").addEventListener("click", function () {
      var idx = -1;
      for (var i = 0; i < tasks.length; i++) {
        if (tasks[i].label === "写周报") { idx = i; break; }
      }
      if (idx === -1) {
        readout("「写周报」已经不在列表里了——点「重置」可以再来一遍。");
        return;
      }

      var oldA = rowsA, oldB = rowsB;
      tasks.splice(idx, 1);          // 数据层：删掉中间项「写周报」

      rowsA = remapByIndex(oldA);    // 左：按座位号重算
      var rb = remapById(oldB);      // 右：按身份证重算
      rowsB = rb.rows;

      paintColumns();

      // 读数区解说：把两侧 React 各自「心里想的事」写出来
      var gone = rb.destroyed[0];
      readout(
        "【数据】删除中间项「写周报」，剩 " + tasks.length + " 项。\n\n" +
        "左 · key=index（座位号）：React 逐「位置」对比——\n" +
        "  位置 " + idx + " 的节点文字被改写「" + oldA[idx].label + "」→「" + rowsA[idx].label + "」，\n" +
        "  但输入框是 DOM 自己的状态，React 不碰它 →\n" +
        "  你给「" + oldA[idx].label + "」打的草稿，现在归「" + rowsA[idx].label + "」用了 ✗\n" +
        "  位置 " + (oldA.length - 1) + " 的节点（原「" + oldA[oldA.length - 1].label + "」）被销毁。\n\n" +
        "右 · key=id（身份证）：React 按「身份」匹配——\n" +
        "  「写周报」的 id 不在新数据里 → 它的节点整个销毁" +
        (gone && gone.draft ? "（草稿「" + gone.draft + "」陪葬）" : "") + "\n" +
        "  其余节点原样保留 → 草稿各自跟着主人走 ✓" + draftHint()
      );
    });

    $id("d4-addhead").addEventListener("click", function () {
      insertSeq++;
      var t = { id: nextId++, label: "新任务" + insertSeq };
      var oldA = rowsA, oldB = rowsB;
      tasks.unshift(t);              // 数据层：头部插入新项

      rowsA = remapByIndex(oldA);
      var rb = remapById(oldB);
      rowsB = rb.rows;

      paintColumns();

      // 左列数一下有几个复用节点被改字（内容整体后移一格 = 全部张冠李戴）
      var relabeled = 0;
      rowsA.forEach(function (r) { if (r.origin === "relabel") relabeled++; });

      readout(
        "【数据】头部插入「" + t.label + "」，共 " + tasks.length + " 项。\n\n" +
        "左 · key=index（座位号）：所有内容整体后移一个座位——\n" +
        "  " + relabeled + " 个复用节点的文字全被改写，草稿全部错位一格：\n" +
        "  你给「" + oldA[0].label + "」打的字，现在显示在「" + tasks[0].label + "」行里 ✗\n" +
        "  （逐行数数看：每行输入框里的草稿都不是这一行任务自己的。）\n\n" +
        "右 · key=id（身份证）：只有新 id「" + t.label + "」需要新建节点，\n" +
        "  其余节点原样保留 → 草稿一个都没挪窝 ✓" + draftHint()
      );
    });

    $id("d4-reset").addEventListener("click", resetAll);

    resetAll();
  });

  /* ============================================================
     演示 5 · useEffect 依赖数组模拟器
     勾选 deps 里放谁 → 改 state → 亲眼看 effect 跑还是不跑、
     清理函数何时插入。规则只有一条：
     渲染后逐项 Object.is 对比「这次 deps 的值 vs 上次 deps 的值」，
     任何一项不等 → 先执行上一次的清理函数，再跑本次 effect；
     全等 → 什么都不做。
     （两个特例：首次挂载必跑；deps 数组本身变了也必跑）
     ============================================================ */
  safeInit("demo5", function () {
    var cbCount = $id("d5-dep-count");
    var cbUser  = $id("d5-dep-user");
    if (!cbCount || !cbUser) return;

    var users = ["阿黄", "小黑", "白白"];  // user 换人时在这三个之间轮换
    var count = 0, userPtr = 0;
    var renderNo = 0;      // 渲染序号
    var prev = null;       // 上一次的 deps 快照：{ sig, vals, ran }
    var lines = [];        // 日志行：{ text, cls }

    function currentUser() { return users[userPtr]; }

    // 当前勾选的依赖签名：如 "count,user" / "count" / ""（空数组）
    function sig() {
      var s = [];
      if (cbCount.checked) s.push("count");
      if (cbUser.checked) s.push("user");
      return s.join(",");
    }

    function esc(s) {
      return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function pushLine(text, cls) {
      lines.push({ text: text, cls: cls || "c" });
      if (lines.length > 40) lines.shift();   // 只留最近 40 行，日志区不会无限变长
      paintLog();
    }

    function paintLog() {
      var s = sig();
      // 顶部固定区：当前配置 + 一句话规则（勾选一变，这里立刻跟着变）
      var head =
        '<div class="d5-line d5-head">当前配置：useEffect(fn, [' + s + '])' +
        (s === "" ? ' ← 空数组：只在挂载时跑一次，之后永远不跑' : '') +
        '</div>' +
        '<div class="d5-line d5-sub">规则：渲染后逐项 Object.is 对比新旧值 → 变了：先清理上一轮，再跑 effect；全没变：跳过。</div>';
      var body = lines.map(function (l) {
        return '<div class="d5-line d5-' + l.cls + '">' + esc(l.text) + '</div>';
      }).join("");
      $id("d5-readout").innerHTML = head + '<div style="height:6px;"></div>' + body;
    }

    // 模拟的 effect：假装副作用是「把页面标题同步成最新 state」
    function effectBody(vals) {
      return "effect 执行 ✓ —— 副作用：同步标题为「count=" + vals.count + ", user=" + vals.user + "」";
    }

    function render(cause) {
      renderNo++;
      var s = sig();
      var vals = { count: count, user: currentUser() };

      pushLine(
        "渲染 #" + renderNo + "（" + cause + "）· count=" + vals.count +
        " · user=" + vals.user + " · deps=[" + s + "]", "r"
      );

      // ---- 判定 effect 跑不跑：完全按 React 的真实规则 ----
      var run = false, why = "";
      if (!prev) {
        run = true; why = "首次渲染（挂载）——React 规定 mount 后必跑一次";
      } else if (prev.sig !== s) {
        run = true; why = "deps 数组本身变了（你改了勾选）——数组长度/成员不同 → 必跑";
      } else {
        var changed = [];
        if (cbCount.checked && !Object.is(prev.vals.count, vals.count)) {
          changed.push("count: " + prev.vals.count + " → " + vals.count);
        }
        if (cbUser.checked && !Object.is(prev.vals.user, vals.user)) {
          changed.push("user: \"" + prev.vals.user + "\" → \"" + vals.user + "\"");
        }
        if (changed.length) {
          run = true; why = "deps 里的 " + changed.join("；") + " 变了";
        } else {
          why = s === ""
            ? "deps 是空数组 []，没有任何被监控的值 → 永远跳过"
            : "deps 里的 " + s + " 都没变（这次改的是没进 deps 的值）";
        }
      }

      if (run) {
        // 只有「上一轮 effect 真的跑过」才有清理函数可执行——这就是清理函数的插入时机
        if (prev && prev.ran) {
          pushLine(
            "├─ 清理函数执行（收尾上一轮：取消旧标题「count=" + prev.vals.count +
            ", user=" + prev.vals.user + "」）", "c"
          );
        }
        pushLine("└─ " + effectBody(vals) + "   〔" + why + "〕", "e");
      } else {
        pushLine("└─ effect 跳过 ✗ —— " + why, "c");
      }

      prev = { sig: s, vals: vals, ran: run };
      $id("d5-count").textContent = vals.count;
      $id("d5-username").textContent = vals.user;
    }

    function reset() {
      count = 0; userPtr = 0; renderNo = 0; prev = null; lines = [];
      cbCount.checked = true; cbUser.checked = false;
      pushLine("— 模拟组件挂载 —", "r");
      render("mount");
    }

    $id("d5-inc").addEventListener("click", function () {
      count++;
      render("count +1");
    });

    $id("d5-user").addEventListener("click", function () {
      userPtr = (userPtr + 1) % users.length;
      render("user 换人");
    });

    // 改勾选 = 改了代码里的 deps 数组：不立即触发渲染，
    // 下一次渲染时按新数组判定（sig 不同 → 那一轮必跑，日志里会注明原因）
    [cbCount, cbUser].forEach(function (cb) {
      cb.addEventListener("change", function () {
        paintLog();   // 先刷新顶部配置说明
        pushLine("· 你改了勾选（= 改了代码里的 deps 数组）——下一次渲染开始按 [" + sig() + "] 判定", "c");
      });
    });

    $id("d5-reset").addEventListener("click", reset);

    reset();
  });

  /* ============================================================
     演示 6 · mini-react TodoApp（真引擎，不是模拟动画）
     引擎与书中 8.1 的 60 行同构：h() + useState() + render/schedule。
     额外做了三处教学增强，均在日志中注明：
       ① 每次渲染 / 写记忆格时打日志（教学埋点）
       ② 全清重建后恢复输入焦点与光标（可用性补丁：真实 React 有 diff 不需要）
       ③ 过滤 null / false 子节点（健壮性补丁，支持条件渲染）
     ============================================================ */
  safeInit("demo6", function () {
    var appBox = $id("d6-app");
    var logBox = $id("d6-log");
    var rendersEl = $id("d6-renders");
    if (!appBox || !logBox) return;

    // ---------- 样式：引擎生成的 DOM + 日志行（页面 CSS 未覆盖的部分） ----------
    var css = document.createElement("style");
    css.textContent = [
      "#d6-app .d6-row { display:flex; gap:8px; margin-bottom:8px; align-items:center; }",
      "#d6-app input[type=text] { flex:1; min-width:0; font-size:13px; padding:5px 10px; border:1px solid var(--rule); border-radius:6px; font-family:inherit; }",
      "#d6-app .d6-btn { font-size:12.5px; font-weight:700; color:#fff; background:var(--accent); border:none; border-radius:6px; padding:5px 12px; cursor:pointer; }",
      "#d6-app .d6-filter { font-size:12px; padding:3px 10px; border-radius:99px; border:1px solid var(--rule); background:#fff; cursor:pointer; color:var(--muted); }",
      "#d6-app .d6-filter.on { background:var(--accent); border-color:var(--accent); color:#fff; font-weight:700; }",
      "#d6-app ul { list-style:none; margin:10px 0; padding:0; }",
      "#d6-app li { display:flex; align-items:center; gap:8px; padding:6px 0; border-bottom:1px dashed var(--rule); }",
      "#d6-app .d6-text { font-size:13.5px; }",
      "#d6-app li.done .d6-text { text-decoration:line-through; color:var(--muted); }",
      "#d6-app .d6-del { margin-left:auto; font-size:11.5px; color:#D93025; background:#fff; border:1px solid #F3C2C2; border-radius:5px; padding:2px 8px; cursor:pointer; }",
      "#d6-app .d6-count { font-size:12.5px; color:var(--muted); margin:8px 0 0; }",
      "#d6-app .d6-empty { font-size:13px; color:var(--muted); }",
      "#d6-app.d6-flash { animation: d6flash .8s ease-out; }",
      "@keyframes d6flash { 0% { background:#FFF3C4; } 100% { background:#fff; } }",
      ".d6l { display:block; }",
      ".d6l-act { color:#8CE99A; }",
      ".d6l-state { color:#7EE0FF; }",
      ".d6l-render { color:#FFD479; font-weight:700; }",
      ".d6l-cmt { color:#8A8AA0; font-style:italic; }"
    ].join("\n");
    document.head.appendChild(css);

    // ---------- 引擎日志（右侧终端区） ----------
    function log(kind, text) {
      var span = document.createElement("span");
      span.className = "d6l d6l-" + kind;
      span.textContent = text;
      logBox.appendChild(span);
      while (logBox.children.length > 160) logBox.removeChild(logBox.firstChild); // 防止无限增长
      logBox.scrollTop = logBox.scrollHeight;   // 自动滚到最新一行
    }

    // 记忆格里的值太长就截断：todos 显示条数，字符串加引号
    function brief(v) {
      if (Array.isArray(v)) return "[" + v.length + " 条]";
      if (typeof v === "string") return '"' + (v.length > 12 ? v.slice(0, 10) + "…" : v) + '"';
      return String(v);
    }

    // ---------- 迷你 React 引擎（与书中 8.1 的 60 行同构） ----------
    var hooks = [];                    // 记忆格数组：挂在组件外面——函数组件有记忆的全部秘密
    var hookIndex = 0;                  // 当前渲染用到第几格（Hook 不能放 if 里的原因）
    var rootComponent = null, rootContainer = null;
    var renderCount = 0;

    // h()：JSX 编译后的真身——返回普通 JS 对象（一个虚拟 DOM 节点）
    function h(type, props) {
      var children = [].concat.apply([], Array.prototype.slice.call(arguments, 2)); // 展开一层嵌套数组
      return { type: type, props: props || {}, children: children };
    }

    function useState(initial) {
      var i = hookIndex++;             // 按调用顺序领格子：第 1 个 useState 永远是 0 号格
      if (!(i in hooks)) {
        hooks[i] = initial;            // 只有第一次渲染才写初始值，之后全部读旧值
        log("state", "格子[" + i + "] 初始化 ← " + brief(initial));
      }
      function setState(next) {
        // 函数式更新支持：传函数就用旧值调用它（「连加」场景的正解）
        var value = typeof next === "function" ? next(hooks[i]) : next;
        if (Object.is(hooks[i], value)) {
          log("cmt", "setState(" + i + ")：新旧值 Object.is 相等 → 跳过，不重渲染");
          return;
        }
        log("state", "setState(格子[" + i + "])：" + brief(hooks[i]) + " → " + brief(value) + "，调度重渲染");
        hooks[i] = value;              // 写新值 → 标记（真实 React 在这里批处理排队）
        schedule();                    // 请求重渲染
      }
      return [hooks[i], setState];
    }

    // render()：递归把虚拟 DOM 变成真实 DOM（props 的四条落地规则都在这）
    function render(vdom, parent) {
      if (vdom == null || vdom === false || vdom === true) return null;   // 补丁③：条件渲染的空洞
      if (typeof vdom === "string" || typeof vdom === "number") {
        return parent.appendChild(document.createTextNode(vdom));
      }
      var el = document.createElement(vdom.type);
      Object.keys(vdom.props).forEach(function (k) {
        var v = vdom.props[k];
        if (k.indexOf("on") === 0) el.addEventListener(k.slice(2).toLowerCase(), v); // onClick → click
        else if (k === "className") el.className = v;                               // JSX 的 className
        else if (k === "checked") el.checked = v;
        else if (k === "value") el.value = v;
        else if (k === "placeholder") el.placeholder = v;
        else el.setAttribute(k, v);
      });
      vdom.children.forEach(function (c) { render(c, el); });   // 子节点递归
      parent.appendChild(el);
      return el;
    }

    // ---- 补丁②：焦点保存/恢复 ----
    // 全清重建会把输入框整个换掉（焦点、光标全丢）；真实 React 有 diff、
    // 节点是复用的所以没这个问题。这里记录「焦点元素的路径 + 光标位置」，
    // 重建后按路径找回，保证受控输入可以连续打字。
    function saveFocus() {
      var el = document.activeElement;
      if (!el || el === document.body || !rootContainer || !rootContainer.contains(el)) return null;
      var path = [];
      var node = el;
      while (node && node !== rootContainer) {
        var p = node.parentNode;
        path.unshift(Array.prototype.indexOf.call(p.children, node));   // 在父元素里的座位号
        node = p;
      }
      return { path: path, start: el.selectionStart, end: el.selectionEnd };
    }
    function restoreFocus(info) {
      if (!info) return;
      try {
        var node = rootContainer;
        for (var i = 0; i < info.path.length; i++) {
          node = node.children[info.path[i]];
          if (!node) return;
        }
        if (node.focus) node.focus();
        if (info.start != null && node.setSelectionRange) node.setSelectionRange(info.start, info.end);
      } catch (e) { /* 焦点恢复失败不影响演示 */ }
    }

    function schedule() {
      renderCount++;
      rendersEl.textContent = renderCount;
      log("render", "render #" + renderCount + "：重跑 TodoApp()，hookIndex 归零，从 0 号格对号入座");
      var focus = saveFocus();          // 补丁②：记住焦点在哪
      rootContainer.innerHTML = "";     // 简化：全清重建（真实 React 会 diff 只改差异）
      render(rootComponent(), rootContainer);
      restoreFocus(focus);              // 补丁②：找回焦点和光标
      appBox.classList.remove("d6-flash");   // 黄色闪烁 = 刚重渲染过
      void appBox.offsetWidth;               // 强制重排，让动画能重新触发
      appBox.classList.add("d6-flash");
    }

    function mount(component, container) {   // 入口：等价 createRoot().render(<App />)
      rootComponent = component;
      rootContainer = container;
      hooks.length = 0;                 // 挂载 = 全新的组件实例：记忆格清零
      hookIndex = 0;
      log("act", "mount(TodoApp, 容器) —— 等价 createRoot().render(<App />)");
      schedule();
    }

    // ---------- TodoApp 组件（与书中 8.2 App.jsx 同一份逻辑） ----------
    var FILTERS = [ ["all", "全部"], ["active", "未完成"], ["done", "已完成"] ];

    function TodoApp() {
      // 三格记忆：todos / inputText / filter。
      // 调用顺序永远固定（不放进 if）→ 每次渲染都对号入座同一格
      var t0 = useState([
        { id: 1, text: "读完第二册第 8 章", done: true },
        { id: 2, text: "把演示 6 玩明白", done: false }
      ]);
      var todos = t0[0], setTodos = t0[1];

      var t1 = useState("");
      var inputText = t1[0], setInputText = t1[1];

      var t2 = useState("all");
      var filter = t2[0], setFilter = t2[1];

      // 三个修改动作：全部不可变更新（concat 加 / map 改 / filter 删）
      function addTodo() {
        if (!inputText.trim()) return;
        setTodos(todos.concat([{ id: Date.now(), text: inputText, done: false }]));
        setInputText("");               // 两个 setState 在真实 React 里自动批处理，只渲染一次
      }
      function toggle(id) {
        setTodos(todos.map(function (t) {
          return t.id === id ? { id: t.id, text: t.text, done: !t.done } : t;  // 命中换新对象
        }));
      }
      function removeTodo(id) {
        setTodos(todos.filter(function (t) { return t.id !== id; }));
      }

      // 派生值：能算出来的不配当 state——筛选结果和完成数每次渲染现算，不占记忆格
      var visible = filter === "all" ? todos
        : todos.filter(function (t) { return (filter === "done") === t.done; });
      var doneCount = todos.filter(function (t) { return t.done; }).length;

      return h("div", null,
        h("div", { className: "d6-row" },
          h("input", {
            type: "text", value: inputText, placeholder: "输入新任务…",
            onInput: function (e) { setInputText(e.target.value); }   // 受控组件：每敲一键都是一次 setState
          }),
          h("button", { className: "d6-btn", onClick: addTodo }, "添加")
        ),
        h("div", { className: "d6-row" },
          FILTERS.map(function (f) {
            return h("button", {
              className: "d6-filter" + (filter === f[0] ? " on" : ""),
              onClick: function () { setFilter(f[0]); }
            }, f[1]);
          })
        ),
        h("ul", null,
          visible.length === 0
            ? h("li", null, h("span", { className: "d6-empty" }, "（当前筛选下没有任务）"))
            : visible.map(function (t) {
                return h("li", { className: t.done ? "done" : "" },
                  h("input", { type: "checkbox", checked: t.done, onChange: function () { toggle(t.id); } }),
                  h("span", { className: "d6-text" }, t.text),
                  h("button", { className: "d6-del", onClick: function () { removeTodo(t.id); } }, "删")
                );
              })
        ),
        h("p", { className: "d6-count" },
          "共 " + todos.length + " 条，完成 " + doneCount + " 条（visible 是派生值，不占记忆格）")
      );
    }

    // 受控输入每敲一个字都会走一遍「setState → 重跑函数 → 重建」——右侧日志会告诉你代价
    mount(TodoApp, appBox);
    log("cmt", "试试：输入框打字（每键一次重渲染）、勾选、删除、切筛选——左侧黄闪 = 刚重渲染");

    $id("d6-reset").addEventListener("click", function () {
      logBox.innerHTML = "";
      renderCount = 0;
      mount(TodoApp, appBox);           // 重新挂载 = 记忆格清零、从第 1 次渲染重来
    });
  });
})();
