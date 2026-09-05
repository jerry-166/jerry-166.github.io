(function() {
  // 从 CSS 变量读取主题色，保证图表与文档视觉一致
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // ---------- 图 2：三角色 × 八大原理域 雷达图 ----------
  var radarEl = document.getElementById('chart-role-radar');
  if (radarEl && typeof echarts !== 'undefined') {
    var radar = echarts.init(radarEl, null, { renderer: 'svg' });
    radar.setOption({
      animation: false,
      color: [accent, accent2, muted],
      tooltip: { appendToBody: true },
      legend: {
        bottom: 10,
        itemWidth: 14,
        itemHeight: 8,
        textStyle: { color: muted, fontSize: 13 }
      },
      radar: {
        center: ['50%', '46%'],
        radius: '62%',
        indicator: [
          { name: '渲染管线', max: 5 },
          { name: '语言运行时', max: 5 },
          { name: '状态架构', max: 5 },
          { name: '渲染策略', max: 5 },
          { name: '设计系统', max: 5 },
          { name: '性能工程', max: 5 },
          { name: '工程规模', max: 5 },
          { name: '安全边界', max: 5 }
        ],
        axisName: { color: ink, fontSize: 13 },
        splitLine: { lineStyle: { color: rule } },
        splitArea: { areaStyle: { color: [bg2, 'transparent'] } },
        axisLine: { lineStyle: { color: rule } }
      },
      series: [{
        type: 'radar',
        symbolSize: 5,
        lineStyle: { width: 2.5 },
        areaStyle: { opacity: 0.08 },
        data: [
          { value: [3, 3, 5, 5, 3, 4, 5, 4], name: '架构师' },
          { value: [4, 5, 4, 3, 3, 5, 4, 5], name: '工程师' },
          { value: [3, 2, 3, 2, 5, 3, 2, 2], name: '设计师' }
        ]
      }]
    });
    window.addEventListener('resize', function() { radar.resize(); });
  }

  // ---------- Mermaid 初始化（渲染策略谱系图） ----------
  if (typeof mermaid !== 'undefined') {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'neutral',
      securityLevel: 'loose',
      themeVariables: {
        primaryColor: bg2,
        primaryTextColor: ink,
        primaryBorderColor: accent,
        lineColor: muted,
        fontSize: '14px'
      }
    });
  }
})();
