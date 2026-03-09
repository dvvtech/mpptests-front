(function () {
  const palette = appConfig.colors.map((color) => ({
    ...color,
    rgb: Utils.hexToRgb(color.hex)
  }));

  function analyzeDrawing(canvas) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const counts = new Map();
    let total = 0;
    const background = Utils.hexToRgb(appConfig.backgroundColor);

    for (let index = 0; index < data.length; index += 4) {
      const alpha = data[index + 3];
      if (alpha < 100) {
        continue;
      }

      const current = {
        r: data[index],
        g: data[index + 1],
        b: data[index + 2]
      };

      if (Utils.colorDistance(current, background) < 8) {
        continue;
      }

      let nearest = palette[0];
      let minDistance = Number.POSITIVE_INFINITY;

      palette.forEach((color) => {
        const distance = Utils.colorDistance(current, color.rgb);
        if (distance < minDistance) {
          minDistance = distance;
          nearest = color;
        }
      });

      counts.set(nearest.name, (counts.get(nearest.name) || 0) + 1);
      total += 1;
    }

    if (!total) {
      return [];
    }

    return Array.from(counts.entries())
      .filter(([, count]) => count >= 10)
      .map(([name, count]) => {
        const match = palette.find((color) => color.name === name);
        return {
          name,
          hex: match ? match.hex : '#94a3b8',
          count,
          percentage: (count / total) * 100
        };
      })
      .sort((first, second) => second.count - first.count);
  }

  function renderChart(container, items) {
    container.innerHTML = '';

    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'text-sm leading-7 text-slate-500';
      empty.textContent = 'Недостаточно закрашенных областей для построения диаграммы.';
      container.appendChild(empty);
      return;
    }

    items.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'chart-row';
      row.innerHTML = `
        <div>
          <div class="chart-label">
            <span class="chart-dot" style="background:${item.hex}"></span>
            <span>${item.name}</span>
          </div>
          <div class="chart-bar-shell">
            <div class="chart-bar" style="width:${item.percentage}%; background:${item.hex};"></div>
          </div>
        </div>
        <div class="text-right text-sm font-semibold text-slate-600">${Utils.formatPercent(item.percentage)}</div>
      `;
      container.appendChild(row);
    });
  }

  window.Statistics = {
    analyzeDrawing,
    renderChart
  };
})();
