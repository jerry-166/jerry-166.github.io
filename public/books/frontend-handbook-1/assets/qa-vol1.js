/* =====================================================================
   第一册 · 答疑手册 qa-vol1.html —— 17 个交互演示的全部逻辑
   按 A–H 部分顺序排列；每个演示独立成段，互不依赖。
   ===================================================================== */
(function () {
  'use strict';

  // id 直取的简写（等价 getElementById，见第 4 章 D 部分 Q1）
  const $ = (id) => document.getElementById(id);

  /* ==================================================================
     演示 1 · CSS 优先级算分器（B 部分 Q1）
     把选择器解析成三元组 (id 数, 类级数, 元素数)，逐位比较。
     计分规则：#id → id 位；.类 / [属性] / :伪类 → 类位；标签 / ::伪元素 → 元素位
     ================================================================== */
  function specificity(sel) {
    if (!sel || !sel.trim()) return null;
    const s = { id: 0, cls: 0, el: 0 };
    let rest = sel;
    // 伪元素 ::before —— 算 1 个"元素"
    rest = rest.replace(/::[a-zA-Z-]+/g, () => { s.el++; return ' '; });
    // 属性选择器 [type=text] —— 算 1 个"类"
    rest = rest.replace(/\[[^\]]*\]/g, () => { s.cls++; return ' '; });
    // 单冒号伪类 :hover（含 :not(...) 整体，简化处理）—— 算 1 个"类"
    rest = rest.replace(/:[a-zA-Z-]+(?:\([^)]*\))?/g, () => { s.cls++; return ' '; });
    // #id
    rest = rest.replace(/#[\w-]+/g, () => { s.id++; return ' '; });
    // .类
    rest = rest.replace(/\.[\w-]+/g, () => { s.cls++; return ' '; });
    // 剩下的裸词就是标签名（* 不计分）；组合符（空格 > + ~）在这里顺便被当作分隔符
    rest.split(/[\s>+~]+/).forEach((tok) => {
      tok = tok.trim();
      if (!tok || tok === '*') return;
      if (/^[a-zA-Z][\w-]*$/.test(tok)) s.el++;
    });
    return s;
  }

  $('selGo').addEventListener('click', () => {
    const a = specificity($('selA').value);
    const b = specificity($('selB').value);
    if (!a || !b) {
      $('selOut').textContent = '选择器解析失败：支持 #id / .类 / 标签 / :伪类 / ::伪元素 / [属性] / 组合符（空格 > + ~）';
      return;
    }
    const fmt = (s, tag, raw) =>
      `${tag}「${raw.trim()}」→ (id=${s.id}, 类=${s.cls}, 元素=${s.el})`;
    let verdict, why;
    if (a.id !== b.id)      { verdict = a.id > b.id ? 'A 胜' : 'B 胜'; why = 'id 位先分出胜负——后面位数再多也不看（逐位比较）'; }
    else if (a.cls !== b.cls) { verdict = a.cls > b.cls ? 'A 胜' : 'B 胜'; why = 'id 位打平，类位分出胜负'; }
    else if (a.el !== b.el) { verdict = a.el > b.el ? 'A 胜' : 'B 胜'; why = '前两位打平，元素位分出胜负'; }
    else                    { verdict = '同分'; why = '三元组完全相同 → 比源码顺序：谁在 CSS 里后出现谁赢'; }
    $('selOut').textContent =
      fmt(a, 'A', $('selA').value) + '\n' +
      fmt(b, 'B', $('selB').value) + '\n' +
      '判定：' + verdict + ' —— ' + why + '\n' +
      '注：这就是"11 个类打不过 1 个 id"的机器验证：(0,11,0) vs (1,0,0)，id 位 0 < 1 直接出局。:not(...) 在本演示里整体按 1 个类计（简化）。';
  });

  /* ==================================================================
     演示 2 · margin 合并实测（B 部分 Q2）
     普通文档流：相邻兄弟取 max；flex 容器：不合并，间距相加。
     ================================================================== */
  (function marginDemo() {
    const mgA = $('mgA'), mgB = $('mgB'), mgFlex = $('mgFlex');
    function update() {
      const a = +mgA.value, b = +mgB.value;
      $('mgAv').textContent = a + 'px';
      $('mgBv').textContent = b + 'px';
      $('mgBox1').style.marginBottom = a + 'px';
      $('mgBox2').style.marginTop = b + 'px';
      // 切换容器为 flex（column 方向保持上下排布）
      $('mgStage').style.display = mgFlex.checked ? 'flex' : 'block';
      $('mgStage').style.flexDirection = mgFlex.checked ? 'column' : '';
      if (mgFlex.checked) {
        $('mgOut').textContent =
          `容器 = display:flex（column）\n实际间距 = ${a} + ${b} = ${a + b}px（flex 子项之间 margin 不合并，间距相加）\n→ 现代布局（flex + gap）天然免疫 margin 合并。`;
      } else {
        $('mgOut').textContent =
          `容器 = 普通文档流（block）\n实际间距 = max(${a}, ${b}) = ${Math.max(a, b)}px（相邻兄弟的上下 margin 相遇取较大者）\n→ 拖动两个滑块：只要一个变大，间距就等于较大的那个，永远不会是相加。`;
      }
    }
    mgA.addEventListener('input', update);
    mgB.addEventListener('input', update);
    mgFlex.addEventListener('change', update);
    update();
  })();

  /* ==================================================================
     演示 3 · 单位实验（B 部分 Q3）
     拖根字号，观察 px 不动 / rem 跟随 / em 看爹 / vw 只看视口。
     ================================================================== */
  (function unitDemo() {
    const slider = $('unitFs');
    function update() {
      const fs = +slider.value;
      // 直接改根元素 html 的字号 —— 这就是 rem 的"根"
      document.documentElement.style.fontSize = fs + 'px';
      $('unitFsV').textContent = fs + 'px';

      // getComputedStyle 读"浏览器算出来的最终值"，不是你写的值
      const pxReal = getComputedStyle($('uPx')).fontSize;
      const remReal = getComputedStyle($('uRem')).fontSize;
      $('uPxV').textContent = '实际 ' + pxReal + '（不变）';
      $('uRemV').textContent = '实际 ' + remReal + '（= 根字号）';

      // em 链：body 是 16px 写死的 → 一级 19.2 → 二级 23 → 三级 27.6，层层 ×1.2
      const lv3 = $('uEm').querySelector('span span span');
      $('uEmV').textContent =
        '一级 ' + getComputedStyle($('uEm').querySelector('span')).fontSize +
        ' / 三级 ' + getComputedStyle(lv3).fontSize +
        '（em 看爹：这条链的根是 body 的 16px，钉死不跟根字号动）';

      // vw：视口宽的 1%，和根字号无关
      const vwPx = (window.innerWidth / 100 * 30).toFixed(0);
      $('uVwV').textContent = '30vw = ' + vwPx + 'px（屏宽 ' + window.innerWidth + ' ÷ 100 × 30）';

      $('unitOut').textContent =
        `根字号 html{font-size:${fs}px} → 1rem = ${fs}px（rem 卡片跟着变）\n` +
        `px 卡片 = ${pxReal}，纹丝不动（绝对单位）\n` +
        `em 卡片链 = 16 → 19.2 → 23 → 27.6px（em 相对父级字号，嵌套累乘；这条链不受根字号影响，因为起点是 body 写死的 16px）\n` +
        `vw 只看屏幕宽：拖根字号它不动，缩放浏览器窗口它才动。`;
    }
    slider.addEventListener('input', update);
    window.addEventListener('resize', update);
    update();
  })();

  /* ==================================================================
     演示 4 · inline-block 基线对齐（B 部分 Q4）
     切换 vertical-align，看三个盒子 + 参考文字的相对位置。
     ================================================================== */
  (function baselineDemo() {
    const notes = {
      baseline: '默认 baseline：A 盒子最后一行文字的基线、B 的文字基线、C 空盒子的下边缘，全部对齐参考文字的基线。结果：C 整个身子"坐"在基线上（下方留缝、看起来飘在半空），A 的第一行被顶得很高——不是 bug，是三种盒子在各自履行基线对齐。',
      middle: 'vertical-align: middle：三个盒子的垂直中点和行中点对齐——视觉上基本齐平。最常用的修复值。',
      top: 'vertical-align: top：三个盒子的顶边对齐行的顶边——做卡片墙时最整齐的选择。',
      bottom: 'vertical-align: bottom：三个盒子的底边对齐行的底边——和 baseline 不同，底边对齐不参考文字基线。'
    };
    function update() {
      const v = document.querySelector('input[name=va]:checked').value;
      ['iblA', 'iblB', 'iblC'].forEach((id) => { $(id).style.verticalAlign = v; });
      $('iblOut').textContent = '当前：vertical-align: ' + v + '\n' + notes[v];
    }
    document.querySelectorAll('input[name=va]').forEach((r) => r.addEventListener('change', update));
    update();
  })();

  /* ==================================================================
     演示 5 · flex 三步分配计算器（B 部分 Q6 / G 部分 Q1）
     自算"浏览器算法"三步（基准 → 剩余 → grow 分赃 / shrink 还债），
     再设置真实 flex 让浏览器渲染，对比"自算 vs 实测"。
     ================================================================== */
  (function flexDemo() {
    const GAP = 8;
    // 三个子项：el=盒子，val=输入框，w=宽度读数，label=显示名
    const items = [
      { el: $('fxi1'), val: $('fxA'), w: $('fxw1'), label: 'A', visible: true, minW: 0 },
      { el: $('fxi2'), val: $('fxB'), w: $('fxw2'), label: 'B', visible: true, minW: 0 },
      { el: $('fxi3'), val: $('fxC'), w: $('fxw3'), label: 'C', visible: true, minW: 0 }
    ];
    const presets = {
      // 第 6 章项目的场景：input(flex:1) + button(默认 0 1 auto)
      // input 的 min-width:auto ≈ 170px（浏览器的默认行为），这里用 minW 模拟
      todo: { labels: ['input', 'button', 'C'], vis: [true, true, false], flex: ['1 1 0%', '0 1 auto', '1 1 0%'], minW: [170, 0, 0] },
      side: { labels: ['sidebar', 'main', 'C'], vis: [true, true, false], flex: ['0 0 220px', '1 1 0%', '1 1 0%'], minW: [0, 0, 0] },
      even: { labels: ['A', 'B', 'C'], vis: [true, true, true], flex: ['1 1 0%', '1 1 0%', '1 1 0%'], minW: [0, 0, 0] }
    };

    // 解析 "grow shrink basis" 字符串；缺省遵循 CSS 规范（如 flex:1 = 1 1 0%）
    function parseFlex(str) {
      const parts = String(str).trim().split(/\s+/);
      const grow = parseFloat(parts[0]) || 0;
      const shrink = parts.length > 1 ? (parseFloat(parts[1]) || 0) : 1;
      let basisAuto = false, basisPx = 0;
      if (parts.length < 3) { basisPx = 0; }            // flex:1 / flex:1 1 → basis 0%（规范）
      else if (parts[2] === 'auto') basisAuto = true;   // auto = 按内容宽领基准
      else basisPx = parseFloat(parts[2]) || 0;         // 0% / 120px / 0 → 领固定基准
      return { grow, shrink, basisAuto, basisPx };
    }

    function recalc() {
      const W = +$('fxW').value;
      $('fxWv').textContent = W + 'px';

      // --- 第 0 步：测量每项的"内容宽"（当作 min-width:auto 的值）---
      // 临时设 flex:0 0 auto + 清掉 min-width，让盒子按内容自然舒展，读 offsetWidth
      items.forEach((it) => {
        it.el.style.display = it.visible ? '' : 'none';
        it.el.style.flex = '0 0 auto';
        it.el.style.width = 'auto';
        it.el.style.minWidth = 'auto';
      });
      items.forEach((it) => { it.contentW = it.el.offsetWidth; });

      // --- 解析用户输入的三元组 ---
      items.forEach((it) => {
        const p = parseFlex(it.val.value);
        it.grow = p.grow; it.shrink = p.shrink;
        it.basisAuto = p.basisAuto; it.basisPx = p.basisPx;
        it.basis = p.basisAuto ? it.contentW : p.basisPx;
        it.pinned = false; it.hitFloor = false;
      });
      const vis = items.filter((it) => it.visible);
      const gaps = (vis.length - 1) * GAP;
      const basisSum = vis.reduce((s, it) => s + it.basis, 0);
      const free = W - basisSum - gaps;
      vis.forEach((it) => { it.final = it.basis; });

      const L = []; // 计算过程文本
      L.push(`容器 ${W}px · gap ${GAP}px × ${vis.length - 1} · 可见子项 ${vis.length} 个`);
      L.push(`① 定基准：` + vis.map((it) =>
        `${it.label}=${Math.round(it.basis)}px${it.basisAuto ? '(auto→内容宽)' : '(' + it.basisPx + ')'}`).join('  ') +
        `  合计 ${Math.round(basisSum)}px`);

      if (free >= 0) {
        // --- 第三步 A：分赃（grow）---
        const gsum = vis.reduce((s, it) => s + it.grow, 0);
        L.push(`② 算剩余：${W} − ${Math.round(basisSum)} − ${gaps} = +${Math.round(free)}px → 富余，走 grow`);
        if (gsum > 0) {
          vis.forEach((it) => { it.final = it.basis + free * it.grow / gsum; });
          L.push(`③ 分赃：Σgrow=${gsum}（` + vis.map((it) => `${it.label}:${it.grow}`).join(' ') +
            `）→ ` + vis.filter((it) => it.grow > 0).map((it) =>
              `${it.label} +${Math.round(free * it.grow / gsum)}px`).join('  '));
        } else {
          L.push(`③ 分赃：Σgrow=0 → 没人抢，富余空着，各自保持基准宽`);
        }
      } else {
        // --- 第三步 B：还债（shrink，权重 = shrink × 基准）---
        const debt0 = -free;
        let debt = debt0;
        L.push(`② 算剩余：${W} − ${Math.round(basisSum)} − ${gaps} = −${Math.round(debt0)}px → 超支，走 shrink`);
        L.push(`③ 还债：债务 ${Math.round(debt0)}px · 权重=shrink×基准（` +
          vis.map((it) => `${it.label}:${it.shrink}×${Math.round(it.basis)}=${it.shrink * Math.round(it.basis)}`).join('  ') + `）`);
        let guard = 0;
        while (debt > 0.5 && guard++ < 6) {
          const pool = vis.filter((it) => !it.pinned && it.shrink > 0 && it.basis > 0);
          if (!pool.length) break;
          const wsum = pool.reduce((s, it) => s + it.shrink * it.basis, 0);
          if (wsum <= 0) break;
          const newPins = [];
          pool.forEach((it) => {
            const share = debt * (it.shrink * it.basis) / wsum;
            const cand = it.basis - share;
            if (cand < it.contentW) { it.final = it.contentW; it.pinned = true; newPins.push(it); }
            else it.final = cand;
          });
          if (!newPins.length) { debt = 0; break; }
          // 已被 min-width 钉住的项承担了 (基准−内容宽)，剩下的债务由其余项继续分摊
          debt -= newPins.reduce((s, it) => s + (it.basis - it.contentW), 0);
          newPins.forEach((it) => L.push(`   ${it.label} 应缩过头 → 被 min-width:auto 钉在内容宽 ${Math.round(it.contentW)}px（flex 最著名的坑）`));
        }
      }

      // min-width 兜底：最终宽不低于 max(内容宽, 预设 min-width)
      vis.forEach((it) => {
        it.floor = Math.max(it.contentW, it.minW || 0);
        if (it.final < it.floor) { it.hitFloor = true; it.final = it.floor; }
      });

      // --- 应用到真实 DOM，让浏览器自己算一遍 ---
      items.forEach((it) => {
        // basis 按输入的第三段原样写回（auto / 0% / 120px 都支持；缺省按规范补 0%）
        const third = it.val.value.trim().split(/\s+/)[2];
        const basisCss = it.basisAuto ? 'auto' : (third || '0%');
        it.el.style.flex = `${it.grow} ${it.shrink} ${basisCss}`;
        // 预设的 min-width 模拟（如 input 的 min-width:auto ≈ 170px）；否则交还浏览器默认
        it.el.style.minWidth = it.minW ? it.minW + 'px' : 'auto';
      });

      // 读取浏览器实测宽度，和自算对比（✓ 一致 / → 有出入）
      const results = vis.map((it) => {
        const mine = Math.round(it.final);
        const real = it.el.offsetWidth;
        it.w.textContent = Math.abs(mine - real) <= 1 ? `${mine}px ✓` : `${mine}→${real}px`;
        return `${it.label}=${mine}px${it.hitFloor ? '（被min-width钉住）' : ''}`;
      });
      const total = vis.reduce((s, it) => s + it.final, 0) + gaps;
      L.push(`结果：` + results.join('  ｜  ') + (total > W + 1 ? `\n⚠ 合计 ${Math.round(total)}px > 容器 ${W}px → 装不下，溢出（没人肯缩/都被钉住时的真实结局）` : ``));
      L.push(`（✓ = 自算与浏览器实测一致——你刚刚手动跑了一遍浏览器内核的 flex 算法）`);
      $('fxSteps').textContent = L.join('\n');
    }

    // 容器宽滑块实时重算；三个 flex 输入框失焦重算
    $('fxW').addEventListener('input', recalc);
    items.forEach((it) => it.val.addEventListener('change', recalc));
    $('fxGo').addEventListener('click', recalc);

    // 预设按钮：写入输入框 + 更新标签/可见性/min-width 模拟，再重算
    document.querySelectorAll('[data-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const p = presets[btn.dataset.preset];
        items.forEach((it, i) => {
          it.val.value = p.flex[i];
          it.label = p.labels[i];
          it.visible = p.vis[i];
          it.minW = p.minW[i];
          it.el.firstChild.nodeValue = it.label; // 更新盒子上的名字（"A"→"input"）
        });
        recalc();
      });
    });
    recalc();
  })();

  /* ==================================================================
     演示 6 · z-index 层叠上下文（B 部分 Q7）
     两个下拉控制两栋"楼"的高度，badge 的 z-index 只是楼内房间号。
     ================================================================== */
  (function zindexDemo() {
    function update() {
      const c1 = $('ziC1').value, c2 = $('ziC2').value, b2 = $('ziB2').value;
      $('ziCard1').style.zIndex = c1;
      $('ziCard2').style.zIndex = c2;
      $('ziBadge').style.zIndex = b2;
      $('ziC1v').textContent = 'z-index: ' + c1;
      $('ziC2v').textContent = 'z-index: ' + c2;

      // auto 的元素不建"楼"（层叠上下文），按 0 参与比较
      const h1 = c1 === 'auto' ? 0 : +c1;
      const h2 = c2 === 'auto' ? 0 : +c2;
      let msg;
      if (h1 > h2) {
        msg = `✗ 徽章被压住。卡片1 的楼（${c1}）比卡片2 的楼（${c2}）高——卡片2 整栋（连着里面的徽章）被一起压住。徽章的 z-index:${b2} 再大也只是"卡片2 这栋楼里的房间号"，出不了楼。这就是你实验里"父子改 z-index 不生效"的现场。`;
      } else if (h1 < h2) {
        msg = `✓ 徽章可见。卡片2 的楼（${c2}）比卡片1（${c1}）高，徽章随楼压在上面——注意此刻起决定作用的是父级的 z-index，不是徽章自己的 ${b2}。`;
      } else if (c1 === 'auto' && c2 === 'auto') {
        msg = `✓ 徽章可见。两张卡片都不建楼（z-index:auto）——徽章的 z-index:${b2} 直接参与根上下文的全球排名，${b2} 秒杀两张 auto 卡片。想让子的 z-index 出人头地，父就不能建楼。`;
      } else {
        msg = `✓ 徽章可见。两栋楼同高（${c1}）→ 比 DOM 源码顺序：卡片2 后写，压住卡片1，徽章随卡片2 在上。`;
      }
      $('ziOut').textContent = msg;
    }
    ['ziC1', 'ziC2', 'ziB2'].forEach((id) => $(id).addEventListener('change', update));
    update();
  })();

  /* ==================================================================
     演示 7 · grid 四个经典模板（B 部分 Q8）
     ================================================================== */
  (function gridDemo() {
    const tpl = {
      cols3: {
        style: 'grid-template-columns:1fr 1fr 1fr;',
        html: '<div>1</div><div>2</div><div>3</div><div>4</div><div>5</div><div>6</div>',
        out: '.gd { display:grid; grid-template-columns: 1fr 1fr 1fr; }\n宽度切成三份（fr = 份额单位），6 个卡片自动流进格子，行数自动。改成 1fr 2fr 1fr 就是 1:2:1 分。'
      },
      side: {
        style: 'grid-template-columns:220px 1fr;',
        html: '<div class="alt" style="grid-row:span 2;">sidebar 220px</div><div>main · 1fr 吃剩余</div><div class="gray">main 继续往下</div>',
        out: '.gd { grid-template-columns: 220px 1fr; }\n左列钉死 220px，右列 1fr 吃掉全部剩余——等价于 flex 的 0 0 220px + flex:1，但一行写完；侧边栏再加 grid-row:span 2 跨两行。'
      },
      areas: {
        style: 'grid-template-areas:"head head" "side main" "foot foot";grid-template-columns:1fr 2fr;',
        html: '<div style="grid-area:head;">header（横跨两列）</div><div class="alt" style="grid-area:side;">aside</div><div style="grid-area:main;">main</div><div class="gray" style="grid-area:foot;">footer（横跨两列）</div>',
        out: '.gd {\n  grid-template-areas: "head head"\n                       "side main"\n                       "foot foot";\n  grid-template-columns: 1fr 2fr;\n}\n用字符串画布局草图，子元素用 grid-area: head/side/main/foot 各就各位——可读性天花板。'
      },
      span: {
        style: 'grid-template-columns:1fr 1fr 1fr;',
        html: '<div style="grid-column:span 2;">我横跨 2 列（grid-column: span 2）</div><div class="alt">2</div><div>3</div><div class="alt">4</div><div class="gray">5</div>',
        out: '.gd { grid-template-columns: 1fr 1fr 1fr; }\n.gd > div:first-child { grid-column: span 2; }\n第一个卡片横跨 2 列——flex 换行后做不到这么直白的跨格，这是"二维"的直观体验。'
      }
    };
    function setGap() {
      const v = +$('gdGap').value;
      $('gdGapV').textContent = v + 'px';
      const gd = $('gdStage').querySelector('.gd');
      if (gd) gd.style.gap = v + 'px';
    }
    function render(key) {
      const t = tpl[key];
      $('gdStage').innerHTML = `<div class="gd" style="${t.style}">${t.html}</div>`;
      $('gdOut').textContent = t.out;
      setGap();
    }
    document.querySelectorAll('[data-grid]').forEach((btn) => {
      btn.addEventListener('click', () => render(btn.dataset.grid));
    });
    $('gdGap').addEventListener('input', setGap);
    render('cols3');
  })();

  /* ==================================================================
     演示 8 · BFC 三个效果（B 部分 Q9）
     每个场景可"开包间"（父元素 display:flow-root）对比。
     ================================================================== */
  (function bfcDemo() {
    let scene = null, open = false;
    const text = {
      float: [
        '现状（父未开包间）：子元素 float 后脱离文档流，父元素（淡紫背景）高度塌陷成 0——完全包不住孩子。这叫"高度塌陷"，九成"布局突然乱套"的元凶。',
        '开包间后（父 display:flow-root）：父元素自成独立 BFC，算高度时把内部浮动孩子算进来——淡紫背景重新包住了浮动子元素。所谓"清除浮动"，原理就是给父开包间。'
      ],
      margin: [
        '现状（父未开包间）：第一个子元素的 margin-top:32px 穿透了没有边框/内边距的父元素——间距出现在父元素外面（淡紫背景没包住那 32px）。"我只是想让孩子离父顶远点，结果父被整个顶下去了"。',
        '开包间后（父 display:flow-root）：父元素自成 BFC，父子之间 margin 不再合并——32px 变成父元素内部的空隙（淡紫背景包住了它）。'
      ],
      wrap: [
        '现状（右侧未开包间）：右侧文字块是普通块级盒子——文字行绕开浮动图片（环绕排版，报纸效果），但块的背景一直延伸到图片下方。想要干净的"两栏"做不到。',
        '开包间后（右侧 display:flow-root）：右侧块自成 BFC，规则"包间的边界盒避开旁边的浮动"生效——整个块（含背景）挪到浮动右侧，两栏达成。'
      ]
    };
    function render() {
      const area = $('bfcArea');
      if (!scene) { area.innerHTML = ''; $('bfcOut').textContent = '等待操作……'; return; }
      const ps = open ? 'display:flow-root;' : ''; // 开包间的开关就这一个属性
      if (scene === 'float') {
        area.innerHTML =
          '<div style="border:2px dashed #B9B3F5;padding:8px;border-radius:8px;background:#fff;">' +
            '<div id="bfcP" style="' + ps + 'background:#EFEFFB;border-radius:6px;">' +
              '<div style="float:left;width:130px;height:64px;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12.5px;">float:left 子元素</div>' +
            '</div>' +
            '<div style="background:var(--accent2);color:#fff;border-radius:6px;padding:8px 12px;font-size:13px;margin-top:8px;">父元素后面的兄弟块</div>' +
          '</div>';
      } else if (scene === 'margin') {
        area.innerHTML =
          '<div style="border:2px dashed #B9B3F5;padding:8px;border-radius:8px;background:#fff;">' +
            '<div style="background:#63637A;color:#fff;padding:8px 12px;font-size:13px;border-radius:6px;">上面的兄弟块</div>' +
            '<div id="bfcP" style="' + ps + 'background:#EFEFFB;">' +
              '<div style="margin-top:32px;background:var(--accent);color:#fff;padding:8px 12px;font-size:13px;">第一个子元素（margin-top:32px）</div>' +
            '</div>' +
          '</div>';
      } else if (scene === 'wrap') {
        area.innerHTML =
          '<div style="border:2px dashed #B9B3F5;padding:8px;border-radius:8px;background:#fff;overflow:auto;">' +
            '<div style="float:left;width:110px;height:84px;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12.5px;margin-right:8px;">float:left 图片</div>' +
            '<div id="bfcP" style="' + ps + 'background:#FDF4E6;padding:10px 12px;font-size:13px;line-height:1.8;">右侧文字块。默认我是普通块级盒子：文字行绕开浮动，但我的背景延伸到浮动下方（环绕效果）。开包间后我的整个边界盒避开浮动，变成两栏。</div>' +
          '</div>';
      }
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.role = 'toggle';
      btn.className = 'btn ' + (open ? 'ghost' : 'warn');
      btn.textContent = open ? '关掉包间（恢复普通 block）' : '开包间（display:flow-root）';
      btn.style.marginTop = '10px';
      area.appendChild(btn);
      $('bfcOut').textContent = text[scene][open ? 1 : 0];
    }
    document.querySelectorAll('[data-bfc]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const k = btn.dataset.bfc;
        if (k === 'reset') { scene = null; open = false; }
        else if (scene === k) { open = !open; } // 再点一次 = 开关包间
        else { scene = k; open = false; }
        render();
      });
    });
    // 场景内的"开包间"按钮：事件委托（场景 HTML 每次重绘）
    $('bfcArea').addEventListener('click', (e) => {
      if (e.target.dataset && e.target.dataset.role === 'toggle') { open = !open; render(); }
    });
    render();
  })();

  /* ==================================================================
     演示 9 · 三种隐藏方式（C 部分 第 6 题）
     display:none 不占位 / visibility:hidden 占位 / opacity:0 占位可点。
     ================================================================== */
  (function hideDemo() {
    const notes = {
      show: '默认：三个盒子并排。中间盒子可点击（点它试试）。',
      none: 'display:none —— 中间盒子从布局里整个消失，盒子3 顶上来补位。量它的尺寸是 0、点击收不到事件——"不存在了"。',
      hidden: 'visibility:hidden —— 中间盒子还站在原地（盒子3 没动），只是看不见。不可点击。"穿了隐形衣"。',
      opacity: 'opacity:0 —— 同样占位（盒子3 没动），但点中间那块空位试试：点击事件还在触发！透明 ≠ 不存在。配合 transition 可以做淡入淡出（display/visibility 是开关量，做不了过渡）。'
    };
    function update() {
      const v = document.querySelector('input[name=hid]:checked').value;
      const mid = $('hidMid');
      mid.style.display = v === 'none' ? 'none' : '';
      mid.style.visibility = v === 'hidden' ? 'hidden' : '';
      mid.style.opacity = v === 'opacity' ? '0' : '1';
      $('hidOut').textContent = notes[v];
    }
    document.querySelectorAll('input[name=hid]').forEach((r) => r.addEventListener('change', update));
    // 点击中间盒子：验证"隐藏了还能不能点到"
    $('hidMid').addEventListener('click', () => {
      const v = document.querySelector('input[name=hid]:checked').value;
      $('hidOut').textContent =
        '⚡ 你点到了中间盒子（click 触发）——当前模式 ' + v +
        (v === 'opacity'
          ? '：透明但占位、可点击，这是 opacity:0 的专属特性。'
          : v === 'show'
            ? '：正常状态，当然能点。'
            : '：不可能出现这行（该模式下点不到）。');
    });
    update();
  })();

  /* ==================================================================
     演示 10 · 事件冒泡与两种处理姿势（D 部分 Q4）
     ================================================================== */
  (function bubbleDemo() {
    let t0 = 0;
    function log(msg, tag) {
      const ms = Math.round(performance.now() - t0);
      const line = document.createElement('div');
      line.innerHTML = `<span class="mc-tag">[+${ms}ms]</span> ${tag ? `<span class="mc-tag">${tag}</span> ` : ''}${msg}`;
      $('bubLog').appendChild(line);
    }
    function resetLog() {
      $('bubLog').innerHTML = '<div style="opacity:.6;">（点场景里的按钮试试）</div>';
    }

    // 统一的监听器工厂：grand / parent / child 三层各挂一个
    function handler(name) {
      return function (e) {
        const deleOn = $('bubDele').checked;
        // 委托模式 = 只有 grand 挂了监听器（其他层"未挂"）
        if (deleOn && name !== 'grand') return;
        // 拦截模式 = child 的监听器里调 stopPropagation，事件到此为止
        if (name === 'child' && $('bubStop').checked && !deleOn) e.stopPropagation();
        log(`${name} 的监听器触发（target=${e.target.tagName.toLowerCase()}，currentTarget=${name}）`);
      };
    }
    $('bubChild').addEventListener('click', handler('child'));
    $('bubParent').addEventListener('click', handler('parent'));
    $('bubGrand').addEventListener('click', handler('grand'));

    // 点击 child 后，根据当前模式追加"结论行"
    $('bubChild').addEventListener('click', () => {
      const stop = $('bubStop').checked, dele = $('bubDele').checked;
      let sum;
      if (dele && !stop) sum = '→ 委托模式：只在 grand 挂了 1 个监听器，冒泡到它统一处理；e.target 告诉你实际点的是 child——列表有一万项也只挂这一个。';
      else if (dele && stop) sum = '→ 注意：你勾了 stopPropagation，但 child 没挂监听器，没人在源头调用它——事件照常冒到 grand。拦截只可能发生在"挂了监听的那一层"。';
      else if (!dele && stop) sum = '→ 拦截模式：child 的监听器里 stopPropagation() 拦下事件，没有上浮——parent/grand 无感知。';
      else sum = '→ 三层各挂一个监听器：点一次，child → parent → grand 依次各触发一次（这就是"点一次触发多次"的真相：不是事件触发两次，是多个监听器各听到一次）。';
      log(sum);
    });
    $('bubClear').addEventListener('click', resetLog);
    resetLog();
  })();

  /* ==================================================================
     演示 11 · preventDefault 开关对比（D 部分 Q6）
     iframe 里跑一个真实小页面；未勾选时放行默认行为（整页导航）。
     ================================================================== */
  (function pdDemo() {
    function load() {
      $('pdFrame').srcdoc = [
        '<!DOCTYPE html><html><head><meta charset="utf-8"><style>',
        'body{font-family:sans-serif;font-size:13px;padding:12px;background:#fff;margin:0;}',
        'label{display:flex;align-items:center;gap:6px;margin-bottom:10px;font-weight:700;cursor:pointer;}',
        'form{display:flex;gap:6px;}',
        'input[type=text]{flex:1;min-width:0;padding:6px 8px;border:1px solid #ccc;border-radius:6px;}',
        'button{padding:6px 14px;background:#4B3FE3;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:700;}',
        'ul{list-style:none;padding:0;margin:10px 0 0;}',
        'li{background:#F7F7FA;border-radius:6px;padding:6px 10px;margin-top:6px;}',
        '#st{margin-top:10px;font-size:12px;color:#63637A;min-height:18px;}',
        '</style></head><body>',
        '<label><input type="checkbox" id="chk"> 阻止默认行为 e.preventDefault()</label>',
        '<form id="f" action="about:blank"><input type="text" id="i" placeholder="输入一条任务" autocomplete="off"><button type="submit">提交</button></form>',
        '<ul id="l"><li>初始任务 1</li><li>初始任务 2</li></ul>',
        '<p id="st">提交次数 0 · 先不勾选直接点「提交」，看浏览器的默认行为；再勾选后试一次</p>',
        '<scr', 'ipt>',
        'var n = 0;',
        'document.getElementById("f").addEventListener("submit", function (e) {',
        '  var stop = document.getElementById("chk").checked;',
        '  n++;',
        '  if (stop) {',
        '    e.preventDefault();', // ← 就是这一行决定"刷新与否"
        '    var t = document.getElementById("i").value.trim();',
        '    if (t) {',
        '      var li = document.createElement("li");',
        '      li.textContent = t;',
        '      document.getElementById("l").appendChild(li);',
        '      document.getElementById("i").value = "";',
        '    }',
        '    document.getElementById("st").textContent = "第 " + n + " 次提交 · preventDefault：页面没刷新，任务由 JS 加进列表 ✓";',
        '  } else {',
        '    document.getElementById("st").textContent = "第 " + n + " 次提交 · 未阻止：浏览器的默认行为（提交表单 = 整页导航）即将发生——看，小窗被重载，你加的任务全没了";',
        '  }',
        '});',
        '</scr', 'ipt></body></html>'
      ].join('');
    }
    $('pdReload').addEventListener('click', () => {
      load();
      $('pdOut').textContent = '小窗已重新装载。勾选「阻止默认行为」再提交，对比体验两种模式。';
    });
    load();
  })();

  /* ==================================================================
     演示 12 · innerHTML 的 XSS 危害 vs textContent（D 部分 Q7）
     默认载荷是"无害版攻击代码"：<img src=x onerror="xssFired()">
     ================================================================== */
  (function xssDemo() {
    // onerror 属性里裸调用的函数必须是全局的（window.xssFired）
    window.xssFired = function () {
      $('xssBanner').classList.add('show');
      $('xssHtml').style.background = '#FDECEA';
    };
    const DEFAULT = '<img src=x onerror="xssFired()">';
    $('xssRender').addEventListener('click', () => {
      const v = $('xssIn').value;
      $('xssBanner').classList.remove('show');
      $('xssHtml').style.background = '';
      $('xssHtml').innerHTML = v;      // ① 危险：字符串被当 HTML 解析——onerror 真的会执行
      $('xssText').textContent = v;   // ② 安全：字符串被当纯文字——尖括号原样显示
      const risky = /on(error|load|click|mouseover)\s*=|<script/i.test(v);
      $('xssOut').textContent =
        '输入：' + v + '\n' +
        '① innerHTML：按 HTML 解析' + (risky ? '——含可执行代码，浏览器真的执行了它（看红色警告条）' : '——本次没有可执行代码，正常渲染') + '\n' +
        '② textContent：按纯文字处理——同样的字符串只是文字，什么都不会执行。这就是"展示用户输入一律 textContent"的原因。';
    });
    $('xssReset').addEventListener('click', () => {
      $('xssIn').value = DEFAULT;
      $('xssHtml').innerHTML = '（待渲染）';
      $('xssHtml').style.background = '';
      $('xssText').textContent = '（待渲染）';
      $('xssBanner').classList.remove('show');
      $('xssOut').textContent = '点「渲染」对比两种方式的输出。';
    });
  })();

  /* ==================================================================
     演示 13 · 浮点误差实测与三招修法（E 部分 Q2）
     ================================================================== */
  (function floatDemo() {
    function run() {
      const a = parseFloat($('fpA').value);
      const b = parseFloat($('fpB').value);
      const t = parseFloat($('fpT').value);
      if (isNaN(a) || isNaN(b) || isNaN(t)) {
        $('fpOut').textContent = '三个框都要填数字。';
        return;
      }
      const raw = a + b;
      const L = [];
      L.push(`a + b = ${a} + ${b} = ${raw}`);
      L.push(raw === t
        ? `直接 === 判等：true ✓（这对数的二进制除得尽——比如 2 的负幂次，零误差）`
        : `直接 === 判等：false ✘（差值 ${raw - t} —— 二进制表示 1/10 就像十进制表示 1/3，无限循环只能截断）`);
      L.push('');
      // 招 1：容差比较
      const diff = Math.abs(raw - t);
      L.push(`招1 容差比较：Math.abs(${raw} − ${t}) = ${diff} < 1e-9 → ${diff < 1e-9}（标准答案：问"差值够不够小"，不问"是否恰好相等"）`);
      // 招 2：整数化（按"分"运算）
      const a2 = Math.round(a * 100), b2 = Math.round(b * 100), t2 = Math.round(t * 100);
      L.push(`招2 整数化：${a2} + ${b2} = ${a2 + b2} 分 = ${(a2 + b2) / 100} 元，与目标 ${t2} 分判等 → ${(a2 + b2) === t2}（钱的正解：以分为单位全程整数）`);
      // 招 3：toFixed
      L.push(`招3 toFixed(2)：(${raw}).toFixed(2) = "${raw.toFixed(2)}" —— 只管展示：返回的是字符串（typeof 结果 "string"），拿去比较会踩 '5'===5 的坑；且舍入有怪癖：(1.005).toFixed(2) = "${(1.005).toFixed(2)}" 不是 "1.01"`);
      $('fpOut').textContent = L.join('\n');
    }
    $('fpGo').addEventListener('click', run);
    document.querySelectorAll('[data-fp]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.dataset.fp === 'classic') { $('fpA').value = '0.1'; $('fpB').value = '0.2'; $('fpT').value = '0.3'; }
        else { $('fpA').value = '0.25'; $('fpB').value = '0.5'; $('fpT').value = '0.75'; }
        run();
      });
    });
    run();
  })();

  /* ==================================================================
     演示 14 · await 挂起的是函数，不是线程（E 部分 Q6）
     async/await 版与等价 Promise 链版，时间线应完全一致。
     ================================================================== */
  (function timelineDemo() {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    let t0 = 0;
    function log(msg) {
      const ms = Math.round(performance.now() - t0);
      const line = document.createElement('div');
      line.innerHTML = `<span class="mc-tag">[+${ms}ms]</span> ${msg}`;
      $('tlLog').appendChild(line);
    }
    function clear() {
      $('tlLog').innerHTML = '<div style="opacity:.6;">（点上面的按钮，盯着每行开头的时间戳看）</div>';
    }
    $('tlRun').addEventListener('click', () => {
      $('tlLog').innerHTML = '';
      t0 = performance.now();
      log('① 调用 load()（async 函数）——同步代码，立刻执行');
      (async function load() {
        log('② load 开始跑，遇到 await → 函数挂起，控制权立刻还给主线程');
        await sleep(800);
        log('⑥ 800ms 后 Promise 完成 → load 从暂停点恢复（一次微任务）');
        log('⑦ load 继续往下跑完——⑥⑦ 几乎同一毫秒');
      })();
      log('③ 主线程接管：这行立刻执行（在 ② 之后同一毫秒）');
      log('④ 主线程继续干活：渲染、响应点击，一点没耽误');
      log('⑤ 主线程空闲待命……（接下来 800ms 页面随便点、随便动）');
    });
    $('tlRun2').addEventListener('click', () => {
      $('tlLog').innerHTML = '';
      t0 = performance.now();
      log('① 调用 loadChain()（普通函数 + Promise 链）');
      (function loadChain() {
        log('② 函数发起 Promise（800ms 后完成），立刻返回');
        return sleep(800).then(() => {
          log('⑥ 800ms 到：.then 登记的回调被调度执行');
          log('⑦ 链继续——和 async/await 版时间线一模一样');
        });
      })();
      log('③ 主线程接管：立刻执行');
      log('④ 主线程继续干活');
      log('⑤ 主线程空闲待命……');
    });
    $('tlClear').addEventListener('click', clear);
    clear();
  })();

  /* ==================================================================
     演示 15 · 事件循环模拟器（E 部分 Q8）
     13 步逐步推演：A B C D E 经典题，含"宏任务里注册微任务"。
     ================================================================== */
  (function evDemo() {
    // 每一步的完整快照：栈 / 微队列 / 宏队列 / 已输出 / 高亮的代码行号
    const S = [
      { phase: '点「下一步」开始：浏览器主线程开始执行这整段脚本——它本身就是一个宏任务', stack: [], micro: [], macro: [], out: [], hl: null },
      { phase: '主线程从宏任务队列取出「整段脚本」（<script> 本身就是一个宏任务），压入调用栈开始执行', stack: ['整段脚本'], micro: [], macro: [], out: [], hl: null },
      { phase: '第 1 行是同步代码：立刻执行 console.log("A")', stack: ['整段脚本'], micro: [], macro: [], out: ['A'], hl: 1 },
      { phase: '第 2 行 setTimeout(...)：不执行回调，只把回调 D 登记进宏任务队列（哪怕延时 0 也要排队）——继续往下', stack: ['整段脚本'], micro: [], macro: ['D：定时器回调'], out: ['A'], hl: 2 },
      { phase: '第 6 行 Promise.resolve().then(...)：Promise 已就绪，回调 C 登记进微任务队列——微任务是"插队通道"，但也要等当前任务跑完才轮到', stack: ['整段脚本'], micro: ['C：then 回调'], macro: ['D：定时器回调'], out: ['A'], hl: 6 },
      { phase: '第 7 行 console.log("B")：同步代码，立刻执行', stack: ['整段脚本'], micro: ['C：then 回调'], macro: ['D：定时器回调'], out: ['A', 'B'], hl: 7 },
      { phase: '整段脚本（宏任务）执行完毕，调用栈清空。事件循环的铁律：每个宏任务之后，把微任务队列清空到没有为止', stack: [], micro: ['C：then 回调'], macro: ['D：定时器回调'], out: ['A', 'B'], hl: null },
      { phase: '取出微任务 C 执行：console.log("C")。它是纯 JS 的活（Promise 回调），不等任何 IO', stack: ['C：微任务回调'], micro: [], macro: ['D：定时器回调'], out: ['A', 'B', 'C'], hl: 6 },
      { phase: '微任务队列空了（本轮没有新微任务产生）→ 这轮循环走完，可能有渲染机会 → 取下一个宏任务', stack: [], micro: [], macro: ['D：定时器回调'], out: ['A', 'B', 'C'], hl: null },
      { phase: '取出最早登记的宏任务 D（定时器回调）压栈执行：console.log("D")', stack: ['D：定时器回调'], micro: [], macro: [], out: ['A', 'B', 'C', 'D'], hl: 3 },
      { phase: 'D 的回调里遇到 Promise.then → 登记微任务 E。这就是你问的"宏任务执行完还有微任务"：刚跑的宏任务自己注册了新微任务！', stack: ['D：定时器回调'], micro: ['E：then 回调'], macro: [], out: ['A', 'B', 'C', 'D'], hl: 4 },
      { phase: 'D 执行完、栈清空 → 照铁律清微任务：执行 E，console.log("E")', stack: ['E：微任务回调'], micro: [], macro: [], out: ['A', 'B', 'C', 'D', 'E'], hl: 4 },
      { phase: '微任务空、宏任务也空——主线程进入待命：下一次点击 / 定时器到点 / 网络返回会唤醒它，循环继续转（while(true) 直到页面关闭）', stack: [], micro: [], macro: [], out: ['A', 'B', 'C', 'D', 'E'], hl: null },
      { phase: '最终输出：A → B → C → D → E。口诀：同步跑完 → 微任务清空 → 才轮到下一个宏任务。去做 F 部分那道含 await 的进阶题验收', stack: [], micro: [], macro: [], out: ['A', 'B', 'C', 'D', 'E'], hl: null }
    ];
    let cur = 0;
    function render() {
      const s = S[cur];
      $('evStepNo').textContent = `第 ${cur} / 13 步`;
      $('evPhase').textContent = s.phase;
      const chip = (t, cls) => `<div class="ev-chip ${cls}">${t}</div>`;
      const empty = '<div class="ev-chip" style="opacity:.4;">（空）</div>';
      $('evStack').innerHTML = s.stack.length ? s.stack.map((t) => chip(t, 'active')).join('') : empty;
      $('evMicro').innerHTML = s.micro.length ? s.micro.map((t) => chip(t, 'micro')).join('') : empty;
      $('evMacro').innerHTML = s.macro.length ? s.macro.map((t) => chip(t, 'macro')).join('') : empty;
      $('evOut').innerHTML = s.out.length
        ? s.out.map((o) => `<span>${o}</span>`).join('')
        : '<div style="opacity:.45;font-size:12px;">（还没有输出）</div>';
      $('evCode').querySelectorAll('[data-n]').forEach((d) => {
        d.classList.toggle('hl', Number(d.dataset.n) === s.hl);
      });
      $('evNext').disabled = cur >= S.length - 1;
      $('evPrev').disabled = cur <= 0;
    }
    $('evNext').addEventListener('click', () => { if (cur < S.length - 1) { cur++; render(); } });
    $('evPrev').addEventListener('click', () => { if (cur > 0) { cur--; render(); } });
    $('evReset').addEventListener('click', () => { cur = 0; render(); });
    render();
  })();

  /* ==================================================================
     演示 16 · "返回新数组" ≠ "返回新对象"（F 部分 第 2 题）
     map 拷贝数组的壳，元素还是原对象的引用——改属性两边一起变。
     ================================================================== */
  (function arrDemo() {
    let users = [], copied = [];
    const fmt = (u) =>
      `<div${u.__hit ? ' class="hit"' : ''}>{ name: "${u.name}", age: ${u.age} }${u.__hit ? ' ← 被改到' : ''}</div>`;
    function render() {
      $('arOrig').innerHTML = users.map(fmt).join('');
      $('arCopy').innerHTML = copied.map(fmt).join('');
    }
    function init() {
      // 模拟 map 的默认行为：新数组、旧元素（同一个对象的引用）
      users = [{ name: '小明', age: 18 }, { name: '小红', age: 20 }, { name: '小刚', age: 22 }];
      copied = users.map((u) => u);
      render();
    }
    $('arReset').addEventListener('click', () => {
      init();
      $('arOut').textContent = '已重置。当前 copied = users.map(u => u)——数组的壳是新的，元素还是原来那三个对象（引用相同）。点上面 ①②③ 做实验，每次点击前都会自动重置。';
    });
    $('arA').addEventListener('click', () => {
      init();
      copied[0].age = 99;          // 改的是"新数组"里的元素——但它和原数组 0 号位是同一个对象
      users[0].__hit = true;
      render();
      $('arOut').textContent = '① copied[0].age = 99 —— 看左边：原数组的"小明"也变成 99 了！map 拷贝的只是数组的壳，元素还是原来那些对象（同一引用）。这就是"map 不改原数组"这句话只对了一半的原因。';
    });
    $('arB').addEventListener('click', () => {
      init();
      copied = users.map((u) => ({ ...u }));  // 展开运算符：先给每个元素造新对象
      copied[0].age = 99;
      copied[0].__hit = true;
      render();
      $('arOut').textContent = '② map(u => ({ ...u })) 先浅拷贝每个元素，再改副本 —— 左边原数组纹丝不动。两层都新（新数组 + 新对象）才是真隔离。第 6 章项目 { ...t, done: !t.done } 用的就是这招。';
    });
    $('arC').addEventListener('click', () => {
      init();
      copied[0] = { name: '新来的', age: 1, __hit: true };  // 只替换新数组自己的 0 号槽位
      render();
      $('arOut').textContent = '③ copied[0] = 新对象 —— 只动了新数组自己的 0 号槽位，原数组完全不知情。结论：数组壳是隔离的，元素引用不是——隔离到哪一层，取决于你"新"到哪一层。';
    });
    init();
  })();

  /* ==================================================================
     演示 17 · 样式不生效排查五步（H 部分 第 4 条）
     左边真实现场（.bug-box 被更高特异性的规则覆盖成蓝色），
     右边模拟 DevTools Styles 面板，五步走完再"应用修复"。
     ================================================================== */
  (function spDemo() {
    const spr1 = $('spr1'), spr2 = $('spr2'), spr3 = $('spr3');
    const SPR1_HTML = spr1.innerHTML; // 保存原始规则，修复演示后可还原
    let cur = 0;
    const outs = {
      1: '① 选对人：F12 → Elements，点中 .bug-box 这个元素（左边的盒子刚闪了橙框，模拟"点中元素"）。排查第一步永远是确认你选的是"出问题的那个元素"——很多人在这步就点成了它的父级。',
      2: '② 找你的规则：Styles 面板里你写的 .bug-box { color: #D93025 }（styles.css:12）找到了（绿框高亮）——说明选择器没拼错、CSS 文件也引入了。\n（如果这步就找不到你的规则：选择器写错 / CSS 文件没引入 / 属性名拼错——非法值旁边会有黄色三角警告，表示值被丢弃，压根没参与打架。）',
      3: '③ 找赢家：你的规则在，但 color 被划掉了！看没被划的那条：.sp-stage .bug-box { color: #1A73E8 }（styles.css:31）。算分：它 = 2 个类 (0,2,0)；你的 = 1 个类 (0,1,0)。它赢，所以盒子是蓝色。\n—— B 部分演示 1 的算分器，此刻就是干这个用的。',
      4: '④ Computed 验证：切到 Computed 面板（左边盒子现在是蓝色虚线框），查 color 的最终生效值 #1A73E8——和肉眼一致，说明不是继承/初始值/单位问题，就是被更高优先级覆盖了。Computed 面板里点那个值能跳回来源规则（就是第 ③ 步那条赢家）。',
      5: '⑤ 修复三选一：提高自己规则的特异性（.sp-stage .bug-box 或更精确的类）；删掉/改掉冲突的那条；调 CSS 引入顺序（只救得了"同分"，这里不同分，顺序没用）。点「应用修复」看第一种的实际效果。'
    };
    function render() {
      // 全量重置
      [spr1, spr2, spr3].forEach((r) => r.classList.remove('win', 'lose'));
      spr1.innerHTML = SPR1_HTML;
      const bug = $('spBug');
      bug.classList.remove('fixed');
      bug.style.outline = '';
      document.querySelectorAll('[data-sp]').forEach((b) => {
        b.style.outline = Number(b.dataset.sp) === cur ? '2px solid var(--accent)' : '';
      });
      if (!cur) {
        $('spOut').textContent = '点 1–5 步按钮，跟着走一遍完整排查（左边的盒子和右边面板里的规则都是真实生效的，不是截图）。';
        return;
      }
      if (cur === 1) bug.style.outline = '3px solid #D97706';
      if (cur === 2) spr1.classList.add('win');
      if (cur >= 3) {
        spr2.classList.add('win');   // 赢家：没被划掉
        spr1.classList.add('lose');  // 你的规则：被划掉
        spr3.classList.add('lose');  // 浏览器默认样式：也输了
      }
      if (cur === 4) bug.style.outline = '3px dashed #1A73E8'; // 模拟 Computed 面板看到的终值
      $('spOut').textContent = outs[cur];
    }
    document.querySelectorAll('[data-sp]').forEach((btn) => {
      btn.addEventListener('click', () => { cur = Number(btn.dataset.sp); render(); });
    });
    $('spFix').addEventListener('click', () => {
      cur = 5;
      render();
      // 模拟"把你的规则改成更高特异性"：.bug-box → .sp-stage .bug-box.fixed
      $('spBug').classList.add('fixed'); // CSS 里 (0,2,1) > (0,2,0)，红字 + 绿框真实生效
      spr1.classList.remove('lose');
      spr1.innerHTML =
        '<span class="sp-sel">.sp-stage .bug-box.fixed</span> { <span class="sp-props">color: #D93025;</span> } <span class="sp-src">styles.css:12（你改后）</span>';
      spr1.classList.add('win');
      $('spOut').textContent = '✓ 修复成功：把你那条规则的特异性提到 (0,2,1)（.sp-stage .bug-box.fixed），压过冲突规则的 (0,2,0)——盒子变红、绿框生效。\n注意整个过程没动 !important——那是调试用的核武器，留着核按钮不用是排版系统最后的体面。点 1–5 步任意按钮可重看。';
    });
    render();
  })();

})();
