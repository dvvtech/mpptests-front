(function () {
  const App = {
    state: {
      selectedTest: null,
      gender: '',
      birthDate: '',
      currentColor: appConfig.colors[0],
      brushSize: 18,
      analysis: null,
      statistics: []
    },
    refs: {},

    async init() {
      try {
        this.showGlobalLoading('Загрузка интерфейса...');
        await this.loadComponent('settings', 'settings.html');
        await this.loadComponent('coloring', 'coloring.html');
        this.cacheRefs();
        this.initSettings();
        this.initColoring();
        this.restoreSettings();
        this.showSection('settings');
      } catch (error) {
        console.error('Ошибка инициализации приложения:', error);
        document.getElementById('settings').innerHTML = '<div class="surface-panel mx-auto max-w-xl p-8 text-center text-slate-700">Не удалось инициализировать приложение.</div>';
      } finally {
        this.hideGlobalLoading();
      }
    },

    async loadComponent(id, file) {
      const response = await fetch(file);
      if (!response.ok) {
        throw new Error(`Не удалось загрузить ${file}`);
      }
      const content = await response.text();
      document.getElementById(id).innerHTML = content;
    },

    cacheRefs() {
      this.refs.settingsSection = document.getElementById('settings');
      this.refs.coloringSection = document.getElementById('coloring');
      this.refs.gender = document.getElementById('gender');
      this.refs.birthDate = document.getElementById('birthDate');
      this.refs.imageSelector = document.getElementById('image-selector');
      this.refs.settingsError = document.getElementById('settings-error');
      this.refs.continueButton = document.getElementById('continue-button');
      this.refs.palette = document.getElementById('color-palette');
      this.refs.brushSize = document.getElementById('brush-size');
      this.refs.brushSizeValue = document.getElementById('brush-size-value');
      this.refs.rotationValue = document.getElementById('rotation-value');
      this.refs.zoomValue = document.getElementById('zoom-value');
      this.refs.homeButton = document.getElementById('home-button');
      this.refs.rotateLeft = document.getElementById('rotate-left');
      this.refs.rotateRight = document.getElementById('rotate-right');
      this.refs.zoomIn = document.getElementById('zoom-in');
      this.refs.zoomOut = document.getElementById('zoom-out');
      this.refs.undoButton = document.getElementById('undo-button');
      this.refs.redoButton = document.getElementById('redo-button');
      this.refs.moveToggle = document.getElementById('move-toggle');
      this.refs.centerButton = document.getElementById('center-button');
      this.refs.clearButton = document.getElementById('clear-button');
      this.refs.analyzeButton = document.getElementById('analyze-button');
      this.refs.resultsPanel = document.getElementById('results-panel');
      this.refs.resultsImage = document.getElementById('results-image');
      this.refs.resultsStatus = document.getElementById('results-status');
      this.refs.statisticsChart = document.getElementById('statistics-chart');
      this.refs.resultMain = document.getElementById('result-main');
      this.refs.resultStrengths = document.getElementById('result-strengths');
      this.refs.resultRecommendations = document.getElementById('result-recommendations');
      this.refs.sendResultsButton = document.getElementById('send-results-button');
      this.refs.selectedTestLabel = document.getElementById('selected-test-label');
      this.refs.activeColorLabel = document.getElementById('active-color-label');
      this.refs.canvas = document.getElementById('main-canvas');
      this.refs.canvasLoader = document.getElementById('canvas-loader');
      this.refs.canvasLoaderText = this.refs.canvasLoader.querySelector('span:last-child');
      this.refs.modalRoot = document.getElementById('modal-root');
      this.refs.modalTitle = document.getElementById('modal-title');
      this.refs.modalMessage = document.getElementById('modal-message');
      this.refs.modalActions = document.getElementById('modal-actions');
      this.refs.modalClose = document.getElementById('modal-close');
      this.refs.toastRoot = document.getElementById('toast-root');
      this.refs.globalLoading = document.getElementById('global-loading');
      this.refs.loadingText = document.getElementById('loading-text');
    },

    initSettings() {
      this.initImageSelector();
      this.refs.continueButton.addEventListener('click', () => this.handleContinue());
      this.refs.gender.addEventListener('change', () => this.persistDraftSettings());
      this.refs.birthDate.addEventListener('change', () => this.persistDraftSettings());
    },

    initColoring() {
      CanvasModule.init({
        canvas: this.refs.canvas,
        loader: this.refs.canvasLoader,
        loaderText: this.refs.canvasLoaderText
      });

      this.initPalette();
      this.refs.brushSize.addEventListener('input', (event) => {
        this.state.brushSize = Number(event.target.value);
        this.refs.brushSizeValue.textContent = String(this.state.brushSize);
        CanvasModule.setBrushSize(this.state.brushSize);
      });

      this.refs.homeButton.addEventListener('click', () => {
        this.openConfirm({
          title: 'Перейти на главную?',
          message: 'Вы действительно хотите перейти на главную? В этом случае ваши данные не сохранятся.',
          confirmLabel: 'Перейти',
          confirmVariant: 'secondary',
          onConfirm: () => {
            this.hideResults();
            CanvasModule.clearDrawingLayer(false);
            CanvasModule.resetView();
            CanvasModule.drawPlaceholder();
            this.showSection('settings');
          }
        });
      });

      this.refs.rotateLeft.addEventListener('click', () => {
        CanvasModule.rotate(-90);
        this.updateTransformIndicators();
      });

      this.refs.rotateRight.addEventListener('click', () => {
        CanvasModule.rotate(90);
        this.updateTransformIndicators();
      });

      this.refs.zoomIn.addEventListener('click', () => {
        CanvasModule.zoom(0.1);
        this.updateTransformIndicators();
      });

      this.refs.zoomOut.addEventListener('click', () => {
        CanvasModule.zoom(-0.1);
        this.updateTransformIndicators();
      });

      this.refs.undoButton.addEventListener('click', async () => {
        await CanvasModule.undo();
      });

      this.refs.redoButton.addEventListener('click', async () => {
        await CanvasModule.redo();
      });

      this.refs.moveToggle.addEventListener('click', () => {
        const nextValue = !this.refs.moveToggle.classList.contains('active');
        this.refs.moveToggle.classList.toggle('active', nextValue);
        CanvasModule.setMoveMode(nextValue);
      });

      this.refs.centerButton.addEventListener('click', () => {
        CanvasModule.resetView();
        this.updateTransformIndicators();
      });

      this.refs.clearButton.addEventListener('click', () => {
        this.openConfirm({
          title: 'Очистить раскраску?',
          message: 'Очистить раскраску? Все изменения будут потеряны. Это действие нельзя отменить.',
          confirmLabel: 'Очистить',
          confirmVariant: 'danger',
          onConfirm: () => {
            CanvasModule.clearDrawingLayer(true);
            this.hideResults();
            this.showToast('Раскраска очищена.', 'success');
          }
        });
      });

      this.refs.analyzeButton.addEventListener('click', () => this.handleAnalyze());
      this.refs.sendResultsButton.addEventListener('click', () => this.handleSendResults());
      this.refs.modalClose.addEventListener('click', () => this.closeModal());
      this.updateTransformIndicators();
      this.updateUndoRedoButtons();
    },

    initPalette() {
      this.refs.palette.innerHTML = '';
      appConfig.colors.forEach((color) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'palette-swatch';
        button.dataset.color = color.hex;
        button.title = color.name;
        button.style.background = color.hex;
        button.addEventListener('click', () => {
          this.state.currentColor = color;
          CanvasModule.setBrushColor(color.hex);
          this.refs.activeColorLabel.textContent = `Цвет: ${color.name}`;
          this.refs.palette.querySelectorAll('.palette-swatch').forEach((item) => item.classList.toggle('active', item === button));
        });
        this.refs.palette.appendChild(button);
      });

      const initial = this.refs.palette.querySelector('.palette-swatch');
      if (initial) {
        initial.classList.add('active');
      }
      CanvasModule.setBrushColor(this.state.currentColor.hex);
      CanvasModule.setBrushSize(this.state.brushSize);
    },

    initImageSelector() {
      this.refs.imageSelector.innerHTML = '';

      const observer = 'IntersectionObserver' in window
        ? new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                this.loadPreview(entry.target);
                observer.unobserve(entry.target);
              }
            });
          }, { rootMargin: '120px' })
        : null;

      appConfig.images.forEach((image, index) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'image-item text-left';
        item.dataset.imageId = String(image.id);
        item.innerHTML = `
          <div class="image-preview" data-filename="${image.filename}" data-thumbnail="${image.thumbnail}">
            <div class="preview-spinner">
              <span class="loader-ring"></span>
            </div>
          </div>
          <div class="border-t border-slate-200 px-3 py-3 text-center text-sm font-semibold text-slate-700">${image.name}</div>
        `;

        item.addEventListener('click', () => this.selectTest(image.id));
        this.refs.imageSelector.appendChild(item);

        const preview = item.querySelector('.image-preview');
        if (observer) {
          observer.observe(preview);
        } else {
          setTimeout(() => this.loadPreview(preview), index * 80);
        }
      });
    },

    loadPreview(container) {
      if (container.dataset.loaded === 'true') {
        return;
      }

      const image = new Image();
      image.onload = () => {
        image.className = '';
        container.appendChild(image);
        requestAnimationFrame(() => image.classList.add('loaded'));
        const spinner = container.querySelector('.preview-spinner');
        if (spinner) {
          spinner.remove();
        }
      };
      image.onerror = () => {
        const fallback = container.dataset.filename;
        if (image.src.endsWith(container.dataset.thumbnail)) {
          image.src = fallback;
          return;
        }

        const spinner = container.querySelector('.preview-spinner');
        if (spinner) {
          spinner.innerHTML = '<i class="fas fa-image text-xl"></i>';
        }
      };
      image.alt = 'Превью теста';
      image.src = container.dataset.thumbnail;
      container.dataset.loaded = 'true';
    },

    selectTest(imageId) {
      this.state.selectedTest = appConfig.images.find((image) => image.id === imageId) || null;
      this.refs.imageSelector.querySelectorAll('.image-item').forEach((item) => {
        item.classList.toggle('selected', Number(item.dataset.imageId) === imageId);
      });
      this.persistDraftSettings();
    },

    restoreSettings() {
      const saved = Utils.loadSettings();
      if (!saved) {
        return;
      }

      this.state.gender = saved.gender || '';
      this.state.birthDate = saved.birthDate || '';
      this.refs.gender.value = this.state.gender;
      this.refs.birthDate.value = this.state.birthDate;

      if (saved.selectedTestId) {
        this.selectTest(saved.selectedTestId);
      }
    },

    persistDraftSettings() {
      this.state.gender = this.refs.gender.value;
      this.state.birthDate = this.refs.birthDate.value;

      Utils.saveSettings({
        gender: this.state.gender,
        birthDate: this.state.birthDate,
        selectedTestId: this.state.selectedTest ? this.state.selectedTest.id : null
      });
    },

    validateSettings() {
      const messages = [];
      if (!this.refs.gender.value) {
        messages.push('Выберите пол.');
      }

      if (!this.refs.birthDate.value) {
        messages.push('Укажите дату рождения.');
      }

      if (!this.state.selectedTest) {
        messages.push('Выберите тест для раскрашивания.');
      }

      if (this.refs.birthDate.value) {
        const birthDate = new Date(this.refs.birthDate.value);
        const today = new Date();
        if (birthDate > today) {
          messages.push('Дата рождения не может быть в будущем.');
        }
      }

      return messages;
    },

    async handleContinue() {
      const errors = this.validateSettings();
      if (errors.length) {
        this.refs.settingsError.innerHTML = `<ul class="space-y-1">${errors.map((item) => `<li>${item}</li>`).join('')}</ul>`;
        this.refs.settingsError.classList.remove('hidden');
        return;
      }

      this.refs.settingsError.classList.add('hidden');
      this.persistDraftSettings();
      this.showSection('coloring');
      this.refs.selectedTestLabel.textContent = this.state.selectedTest.name;
      const loaded = await CanvasModule.loadImage(this.state.selectedTest);
      this.hideResults();
      this.updateTransformIndicators();
      if (!loaded) {
        this.showToast('Не удалось загрузить тест. Показана заглушка.', 'warning');
      }
    },

    async handleAnalyze() {
      const statistics = Statistics.analyzeDrawing(CanvasModule.getDrawingCanvas());
      if (!statistics.length) {
        this.showToast('Сначала раскрасьте тест хотя бы несколькими цветами.', 'warning');
        return;
      }

      this.showGlobalLoading('Анализируем цветовое распределение...');
      try {
        const zodiac = Utils.getZodiacInfo(this.refs.birthDate.value);
        const payload = {
          user_color: {
            colors: statistics.map((item) => ({ color: item.name, percentage: Math.round(item.percentage) })),
            age: Utils.getAgeFromBirthDate(this.refs.birthDate.value),
            gender: this.refs.gender.value,
            zodiac_sign: zodiac ? zodiac.apiValue : 'unknown'
          },
          version: 1
        };

        const analysis = await Api.analyzeColoring(payload);
        this.state.statistics = statistics;
        this.state.analysis = analysis;
        this.renderResults();
        this.showToast(analysis.source === 'demo' ? 'API недоступен, показаны демо-данные.' : 'Анализ успешно выполнен.', analysis.source === 'demo' ? 'warning' : 'success');
      } finally {
        this.hideGlobalLoading();
      }
    },

    renderResults() {
      this.refs.resultsPanel.classList.remove('hidden');
      this.refs.resultsImage.src = CanvasModule.getExportDataUrl();
      this.refs.resultsStatus.textContent = this.state.analysis && this.state.analysis.source === 'demo' ? 'демо' : 'готово';
      this.refs.resultMain.textContent = this.state.analysis.main_characteristic;
      Statistics.renderChart(this.refs.statisticsChart, this.state.statistics);
      this.renderTextList(this.refs.resultStrengths, this.state.analysis.strengths);
      this.renderTextList(this.refs.resultRecommendations, this.state.analysis.recommendations);
    },

    renderTextList(container, items) {
      container.innerHTML = '';
      items.forEach((item) => {
        const listItem = document.createElement('li');
        listItem.className = 'flex gap-3';
        listItem.innerHTML = '<span class="mt-2 h-2 w-2 flex-none rounded-full bg-sky-500"></span><span></span>';
        listItem.querySelector('span:last-child').textContent = item;
        container.appendChild(listItem);
      });
    },

    hideResults() {
      this.state.analysis = null;
      this.state.statistics = [];
      this.refs.resultsPanel.classList.add('hidden');
      this.refs.statisticsChart.innerHTML = '';
      this.refs.resultMain.textContent = '';
      this.refs.resultStrengths.innerHTML = '';
      this.refs.resultRecommendations.innerHTML = '';
      this.refs.resultsImage.removeAttribute('src');
    },

    async handleSendResults() {
      if (!this.state.analysis) {
        this.showToast('Сначала выполните расчет результатов.', 'warning');
        return;
      }

      try {
        await Api.sendResultsEmail();
      } catch (error) {
        this.showToast(error.message, 'warning');
      }
    },

    updateTransformIndicators() {
      this.refs.rotationValue.textContent = `${CanvasModule.getRotationDegrees()}°`;
      this.refs.zoomValue.textContent = `${CanvasModule.getZoomPercent()}%`;
    },

    updateUndoRedoButtons() {
      const { undoStack, redoStack } = CanvasModule.state;
      this.refs.undoButton.disabled = undoStack.length <= 1;
      this.refs.redoButton.disabled = redoStack.length === 0;
      this.refs.undoButton.style.opacity = this.refs.undoButton.disabled ? '0.45' : '1';
      this.refs.redoButton.style.opacity = this.refs.redoButton.disabled ? '0.45' : '1';
    },

    showSection(section) {
      this.refs.settingsSection.classList.toggle('hidden', section !== 'settings');
      this.refs.coloringSection.classList.toggle('hidden', section !== 'coloring');
    },

    openConfirm({ title, message, confirmLabel, confirmVariant, onConfirm }) {
      this.refs.modalTitle.textContent = title;
      this.refs.modalMessage.textContent = message;
      this.refs.modalActions.innerHTML = '';

      const cancelButton = document.createElement('button');
      cancelButton.type = 'button';
      cancelButton.className = 'secondary-button';
      cancelButton.textContent = 'Отмена';
      cancelButton.addEventListener('click', () => this.closeModal());

      const confirmButton = document.createElement('button');
      confirmButton.type = 'button';
      confirmButton.className = confirmVariant === 'danger' ? 'tool-button active' : 'primary-button';
      confirmButton.textContent = confirmLabel;
      confirmButton.addEventListener('click', () => {
        this.closeModal();
        onConfirm();
      });

      this.refs.modalActions.append(cancelButton, confirmButton);
      this.refs.modalRoot.classList.remove('hidden');
      this.refs.modalRoot.setAttribute('aria-hidden', 'false');
    },

    closeModal() {
      this.refs.modalRoot.classList.add('hidden');
      this.refs.modalRoot.setAttribute('aria-hidden', 'true');
    },

    showToast(message, type = 'default') {
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.textContent = message;
      this.refs.toastRoot.appendChild(toast);
      window.setTimeout(() => {
        toast.remove();
      }, 3200);
    },

    showGlobalLoading(message) {
      const loading = this.refs.globalLoading || document.getElementById('global-loading');
      const text = this.refs.loadingText || document.getElementById('loading-text');
      if (!loading || !text) {
        return;
      }

      loading.classList.remove('hidden');
      loading.setAttribute('aria-busy', 'true');
      text.textContent = message;
    },

    hideGlobalLoading() {
      const loading = this.refs.globalLoading || document.getElementById('global-loading');
      if (!loading) {
        return;
      }

      loading.classList.add('hidden');
      loading.setAttribute('aria-busy', 'false');
    }
  };

  window.App = App;
  document.addEventListener('DOMContentLoaded', () => {
    App.init();
  });
})();
