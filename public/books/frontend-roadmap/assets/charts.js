(function() {
  // 从 CSS 变量读取主题色，保证图表与文档视觉一致
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();   // #4B3FE3
  var accent2 = style.getPropertyValue('--accent2').trim(); // #D97706
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();

  // hex -> rgba 工具：生成主题色的透明度变体
  function rgba(hex, a) {
    var h = hex.replace('#', '');
    var r = parseInt(h.substring(0, 2), 16);
    var g = parseInt(h.substring(2, 4), 16);
    var b = parseInt(h.substring(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  // ---------- 图 1：六阶段时间轴（甘特式横向条形图） ----------
  var ganttEl = document.getElementById('chart-gantt');
  if (ganttEl && typeof echarts !== 'undefined') {
    var stages = [
      { name: 'Stage 6 · 进阶架构（持续）', start: 10, dur: 2.5, color: accent2, note: '回到《知识金字塔》八大域' },
      { name: 'Stage 5 · 部署上线 ★里程碑4', start: 9, dur: 1, color: accent, note: '全栈闭环 · 能干活' },
      { name: 'Stage 4 · 工程化 + TS', start: 7.5, dur: 1.5, color: rgba(accent, 0.4), note: 'Vite · 类型 · 联调' },
      { name: 'Stage 3 · React ★里程碑3', start: 4, dur: 3.5, color: accent, note: '组件 + 状态 + CRUD' },
      { name: 'Stage 2 · JS 核心 ★里程碑2', start: 2, dur: 2, color: rgba(accent, 0.4), note: '交互 + 调接口 + 三态' },
      { name: 'Stage 1 · HTML/CSS 静态页', start: 0.5, dur: 1.5, color: rgba(accent, 0.4), note: '盒模型 · flex · 还原设计稿' },
      { name: 'Stage 0 · 跑起来', start: 0, dur: 0.5, color: rgba(accent, 0.4), note: 'DevTools 三面板' }
    ];

    var chart = echarts.init(ganttEl, null, { renderer: 'svg' });
    chart.setOption({
      animation: false,
      tooltip: {
        appendToBody: true,
        formatter: function(p) {
          if (p.seriesName === '周期') {
            var idx = p.dataIndex;
            var s = stages[idx];
            return '<b>' + s.name + '</b><br/>第 ' + s.start + ' 周起 · 约 ' + s.dur + ' 周<br/>' + s.note;
          }
          return '';
        }
      },
      grid: { left: 8, right: 30, top: 10, bottom: 34, containLabel: true },
      xAxis: {
        type: 'value',
        min: 0,
        max: 13,
        interval: 1,
        axisLabel: { color: muted, fontSize: 12, formatter: 'W{value}' },
        splitLine: { lineStyle: { color: rule, type: 'dashed' } },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'category',
        data: stages.map(function(s) { return s.name; }),
        axisLabel: { color: ink, fontSize: 12.5 },
        axisLine: { lineStyle: { color: rule } },
        axisTick: { show: false }
      },
      series: [
        {
          name: '起点',
          type: 'bar',
          stack: 'total',
          itemStyle: { color: 'transparent' },
          emphasis: { itemStyle: { color: 'transparent' } },
          data: stages.map(function(s) { return s.start; })
        },
        {
          name: '周期',
          type: 'bar',
          stack: 'total',
          barWidth: 18,
          itemStyle: { borderRadius: 4 },
          label: {
            show: true,
            position: 'right',
            color: muted,
            fontSize: 11.5,
            fontFamily: 'JetBrains Mono, monospace',
            formatter: function(p) { return stages[p.dataIndex].dur + '周'; }
          },
          data: stages.map(function(s) {
            return { value: s.dur, itemStyle: { color: s.color } };
          })
        }
      ]
    });
    window.addEventListener('resize', function() { chart.resize(); });
  }

  // ---------- Mermaid 初始化（路线主干流程图） ----------
  if (typeof mermaid !== 'undefined') {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'neutral',
      securityLevel: 'loose',
      themeVariables: {
        primaryColor: '#FFFFFF',
        primaryTextColor: '#17172B',
        primaryBorderColor: '#4B3FE3',
        lineColor: '#63637A',
        fontSize: '14px',
        clusterBkg: '#F7F7FA'
      }
    });
  }
})();
