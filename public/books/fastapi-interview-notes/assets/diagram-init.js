/* Mermaid 初始化：使用报告调色板（Product Teal）的具体色值
   —— 渲染结果无法继承 CSS 变量，必须写死 hex 值 */
(function () {
  if (typeof mermaid === 'undefined') return; // 库加载失败时保留原始文本作为降级

  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    securityLevel: 'strict',
    themeVariables: {
      fontFamily: "'InstrumentSans', 'PingFang SC', 'Microsoft YaHei', sans-serif",
      fontSize: '14px',
      primaryColor: '#FFFFFF',
      primaryBorderColor: '#DCE4E2',
      primaryTextColor: '#1F2A28',
      lineColor: '#5F706D',
      secondaryColor: '#EDFAF5',
      secondaryBorderColor: '#12B886',
      secondaryTextColor: '#0A5C43',
      tertiaryColor: '#F7FAF9',
      clusterBkg: '#EEF3F2',
      clusterBorder: '#DCE4E2',
      edgeLabelBackground: '#FFFFFF',
      arrowheadColor: '#5F706D'
    },
    flowchart: { curve: 'basis', nodeSpacing: 36, rankSpacing: 44, padding: 8 }
  });

  // 脚本位于 body 末尾，DOM 已就绪，直接渲染
  mermaid.run({ querySelector: '.mermaid' });
})();
