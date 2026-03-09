(function () {
  const STORAGE_KEY = 'mpp-tests-settings';

  window.appConfig = {
    canvasWidth: 785,
    canvasHeight: 1080,
    images: [
      { id: 1, name: 'Тест 1', filename: 'images/test1.png', thumbnail: 'images/thumbnails/test1_thumb.png' },
      { id: 2, name: 'Тест 2', filename: 'images/test2.png', thumbnail: 'images/thumbnails/test2_thumb.png' },
      { id: 3, name: 'Тест 3', filename: 'images/test3.png', thumbnail: 'images/thumbnails/test3_thumb.png' },
      { id: 4, name: 'Тест 4', filename: 'images/test4.png', thumbnail: 'images/thumbnails/test4_thumb.png' },
      { id: 5, name: 'Тест 5', filename: 'images/test5.png', thumbnail: 'images/thumbnails/test5_thumb.png' }
    ],
    colors: [
      { name: 'Красный', hex: '#ef4444' },
      { name: 'Оранжевый', hex: '#f97316' },
      { name: 'Желтый', hex: '#eab308' },
      { name: 'Розовый', hex: '#ec4899' },
      { name: 'Коричневый', hex: '#92400e' },
      { name: 'Зеленый', hex: '#22c55e' },
      { name: 'Голубой', hex: '#0ea5e9' },
      { name: 'Синий', hex: '#3b82f6' },
      { name: 'Фиолетовый', hex: '#8b5cf6' },
      { name: 'Бирюзовый', hex: '#06b6d4' },
      { name: 'Черный', hex: '#000000' },
      { name: 'Белый', hex: '#ffffff' }
    ],
    backgroundColor: '#9ca3af'
  };

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function hexToRgb(hex) {
    const normalized = hex.replace('#', '');
    const value = normalized.length === 3
      ? normalized.split('').map((item) => item + item).join('')
      : normalized;

    const numeric = Number.parseInt(value, 16);
    return {
      r: (numeric >> 16) & 255,
      g: (numeric >> 8) & 255,
      b: numeric & 255
    };
  }

  function rgbToHex(r, g, b) {
    return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
  }

  function colorDistance(first, second) {
    return Math.sqrt(
      Math.pow(first.r - second.r, 2) +
      Math.pow(first.g - second.g, 2) +
      Math.pow(first.b - second.b, 2)
    );
  }

  function getAgeFromBirthDate(dateString) {
    if (!dateString) {
      return 0;
    }

    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age -= 1;
    }

    return Math.max(age, 0);
  }

  function getZodiacInfo(dateString) {
    if (!dateString) {
      return null;
    }

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    const month = date.getMonth() + 1;
    const day = date.getDate();

    const signs = [
      { apiValue: 'capricorn', label: 'Козерог', start: [1, 1], end: [1, 19] },
      { apiValue: 'aquarius', label: 'Водолей', start: [1, 20], end: [2, 18] },
      { apiValue: 'pisces', label: 'Рыбы', start: [2, 19], end: [3, 20] },
      { apiValue: 'aries', label: 'Овен', start: [3, 21], end: [4, 19] },
      { apiValue: 'taurus', label: 'Телец', start: [4, 20], end: [5, 20] },
      { apiValue: 'gemini', label: 'Близнецы', start: [5, 21], end: [6, 20] },
      { apiValue: 'cancer', label: 'Рак', start: [6, 21], end: [7, 22] },
      { apiValue: 'leo', label: 'Лев', start: [7, 23], end: [8, 22] },
      { apiValue: 'virgo', label: 'Дева', start: [8, 23], end: [9, 22] },
      { apiValue: 'libra', label: 'Весы', start: [9, 23], end: [10, 22] },
      { apiValue: 'scorpio', label: 'Скорпион', start: [10, 23], end: [11, 21] },
      { apiValue: 'sagittarius', label: 'Стрелец', start: [11, 22], end: [12, 21] },
      { apiValue: 'capricorn', label: 'Козерог', start: [12, 22], end: [12, 31] }
    ];

    return signs.find((sign) => {
      const [startMonth, startDay] = sign.start;
      const [endMonth, endDay] = sign.end;

      if (startMonth === endMonth) {
        return month === startMonth && day >= startDay && day <= endDay;
      }

      if (month === startMonth) {
        return day >= startDay;
      }

      if (month === endMonth) {
        return day <= endDay;
      }

      return false;
    }) || null;
  }

  function saveSettings(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error('Не удалось восстановить настройки:', error);
      return null;
    }
  }

  function formatPercent(value) {
    return `${Math.round(value)}%`;
  }

  window.Utils = {
    STORAGE_KEY,
    clamp,
    hexToRgb,
    rgbToHex,
    colorDistance,
    getAgeFromBirthDate,
    getZodiacInfo,
    saveSettings,
    loadSettings,
    formatPercent
  };
})();
