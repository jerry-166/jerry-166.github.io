// assets/charts.js —— 本报告所有图表初始化逻辑（ECharts + Mermaid）
(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // 数字格式化：500000 -> 50w
  function fmt(v) {
    if (v >= 10000) { return (v / 10000) + 'w'; }
    return String(v);
  }

  // ===== Mermaid 初始化（架构图/时序图/状态机）=====
  if (window.mermaid) {
    mermaid.initialize({ startOnLoad: true, theme: 'neutral', securityLevel: 'loose' });
  }

  // ===== 图 2-2：五层流量漏斗 =====
  var elFunnel = document.getElementById('chart-funnel');
  if (elFunnel && window.echarts) {
    var cFunnel = echarts.init(elFunnel, null, { renderer: 'svg' });
    cFunnel.setOption({
      animation: false,
      tooltip: {
        show: true,
        appendToBody: true,
        formatter: function (p) { return p.name + '：' + fmt(p.value) + ' QPS'; }
      },
      series: [{
        type: 'funnel',
        left: '12%',
        top: 12,
        bottom: 12,
        width: '76%',
        min: 0,
        max: 500000,
        minSize: '12%',
        sort: 'descending',
        gap: 4,
        label: {
          show: true,
          position: 'inside',
          color: bg2,
          fontSize: 13,
          formatter: function (p) { return p.name + '  ' + fmt(p.value); }
        },
        itemStyle: { borderColor: bg2, borderWidth: 1, color: accent },
        data: [
          { value: 500000, name: '入口峰值（含重试/脚本）' },
          { value: 100000, name: 'Nginx 限流放行' },
          { value: 50000, name: '预约资格校验通过' },
          { value: 12000, name: '售罄标志拦截后' },
          { value: 10000, name: 'Redis 扣减成功（=库存数）' }
        ]
      }]
    });
    window.addEventListener('resize', function () { cFunnel.resize(); });
  }

  // ===== 图 8-1：版本演进（对数坐标柱状图）=====
  var elEvo = document.getElementById('chart-evo');
  if (elEvo && window.echarts) {
    var cEvo = echarts.init(elEvo, null, { renderer: 'svg' });
    cEvo.setOption({
      animation: false,
      tooltip: {
        show: true,
        appendToBody: true,
        formatter: function (p) { return p.name + '：约 ' + fmt(p.value) + ' QPS'; }
      },
      grid: { left: 70, right: 30, top: 50, bottom: 60 },
      xAxis: {
        type: 'category',
        data: ['V1 裸奔', 'V2 防超卖', 'V3 缓存+锁', 'V4 Lua+MQ', 'V5 完整漏斗'],
        axisLabel: { color: muted, fontSize: 11 },
        axisLine: { lineStyle: { color: rule } },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'log',
        logBase: 10,
        min: 500,
        max: 1000000,
        name: 'QPS（对数）',
        nameTextStyle: { color: muted },
        axisLabel: { color: muted, formatter: function (v) { return fmt(v); } },
        splitLine: { lineStyle: { color: rule } }
      },
      series: [{
        type: 'bar',
        barWidth: '52%',
        data: [1000, 3000, 30000, 120000, 500000],
        itemStyle: { color: accent, borderRadius: [4, 4, 0, 0] },
        label: {
          show: true,
          position: 'top',
          color: ink,
          fontWeight: 600,
          formatter: function (p) { return fmt(p.value); }
        }
      }]
    });
    window.addEventListener('resize', function () { cEvo.resize(); });
  }

  // ===== 图 6-1：库存分段理论吞吐 =====
  var elSeg = document.getElementById('chart-seg');
  if (elSeg && window.echarts) {
    var cSeg = echarts.init(elSeg, null, { renderer: 'svg' });
    cSeg.setOption({
      animation: false,
      tooltip: {
        show: true,
        appendToBody: true,
        formatter: function (p) { return p.name + '：约 ' + fmt(p.value) + ' QPS（理论）'; }
      },
      grid: { left: 70, right: 30, top: 40, bottom: 50 },
      xAxis: {
        type: 'category',
        data: ['单 key（不分段）', '4 段', '8 段', '16 段'],
        axisLabel: { color: muted, fontSize: 11 },
        axisLine: { lineStyle: { color: rule } },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        max: 900000,
        axisLabel: { color: muted, formatter: function (v) { return fmt(v); } },
        splitLine: { lineStyle: { color: rule } }
      },
      series: [{
        type: 'bar',
        barWidth: '50%',
        data: [100000, 320000, 580000, 800000],
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: function (p) { return p.dataIndex === 0 ? accent2 : accent; }
        },
        label: {
          show: true,
          position: 'top',
          color: ink,
          fontWeight: 600,
          formatter: function (p) { return fmt(p.value); }
        }
      }]
    });
    window.addEventListener('resize', function () { cSeg.resize(); });
  }
})();
