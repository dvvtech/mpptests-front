(function () {
  const ANALYZE_ENDPOINT = 'https://api.cloud-platform.pro/mpp-tests/v1/color-analysis/analyze-lusher';

  async function analyzeColoring(payload) {
    try {
      const response = await fetch(ANALYZE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return normalizeAnalysisResponse(data, payload.user_color.colors);
    } catch (error) {
      console.warn('API анализа недоступен, используются демо-данные:', error);
      return buildFallbackAnalysis(payload.user_color.colors);
    }
  }

  function normalizeAnalysisResponse(data, colors) {
    if (!data || typeof data !== 'object') {
      return buildFallbackAnalysis(colors);
    }

    const source = data.result || data.data || data;
    const mainCharacteristic = source.main_characteristic || source.mainCharacteristic || source.summary;
    const strengths = source.strengths || source.strong_sides || [];
    const recommendations = source.recommendations || source.tips || [];

    if (!mainCharacteristic) {
      return buildFallbackAnalysis(colors);
    }

    return {
      main_characteristic: mainCharacteristic,
      strengths: Array.isArray(strengths) ? strengths : [String(strengths)],
      recommendations: Array.isArray(recommendations) ? recommendations : [String(recommendations)],
      source: 'api'
    };
  }

  function buildFallbackAnalysis(colors) {
    const dominant = colors[0] ? colors[0].color || colors[0].name : 'Нейтральный';
    const secondary = colors[1] ? colors[1].color || colors[1].name : 'спокойный оттенок';

    return {
      main_characteristic: `Доминирование цвета «${dominant}» указывает на актуальную потребность в самовыражении и внутреннем контроле, а присутствие оттенка «${secondary}» добавляет стремление к устойчивости и эмоциональному равновесию.`,
      strengths: [
        'Хорошая чувствительность к эмоциональным состояниям и изменениям среды.',
        'Способность быстро включаться в задачу, когда появляется понятная цель.',
        'Выраженная потребность сохранять личные границы и внутренний порядок.'
      ],
      recommendations: [
        'Чередуйте периоды высокой активности с короткими паузами на восстановление.',
        'Фиксируйте приоритеты дня, чтобы снижать внутреннее напряжение от перегрузки.',
        'Добавляйте больше спокойных рутин, если замечаете эмоциональное переутомление.'
      ],
      source: 'demo'
    };
  }

  async function sendResultsEmail() {
    return Promise.reject(new Error('Эндпоинт /api/send-results пока не реализован.'));
  }

  window.Api = {
    analyzeColoring,
    sendResultsEmail
  };
})();
