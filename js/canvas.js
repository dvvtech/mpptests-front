(function () {
  const MAX_HISTORY = 20;

  function createOffscreenCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = appConfig.canvasWidth;
    canvas.height = appConfig.canvasHeight;
    return canvas;
  }

  const CanvasModule = {
    refs: {},
    state: {
      templateImage: null,
      view: {
        scale: 1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0
      },
      brushSize: 18,
      brushColor: appConfig.colors[0].hex,
      isMoveMode: false,
      isDrawing: false,
      isPanning: false,
      lastPoint: null,
      undoStack: [],
      redoStack: []
    },

    init(refs) {
      this.refs = refs;
      this.refs.canvas.width = appConfig.canvasWidth;
      this.refs.canvas.height = appConfig.canvasHeight;
      this.refs.context = this.refs.canvas.getContext('2d');
      this.refs.templateCanvas = createOffscreenCanvas();
      this.refs.templateContext = this.refs.templateCanvas.getContext('2d');
      this.refs.drawingCanvas = createOffscreenCanvas();
      this.refs.drawingContext = this.refs.drawingCanvas.getContext('2d');
      this.refs.exportCanvas = createOffscreenCanvas();
      this.refs.exportContext = this.refs.exportCanvas.getContext('2d');

      this.bindEvents();
      this.drawPlaceholder();
      this.clearDrawingLayer(false);
      this.render();
      this.saveState();
    },

    bindEvents() {
      this.refs.canvas.addEventListener('pointerdown', (event) => this.handlePointerDown(event));
      this.refs.canvas.addEventListener('pointermove', (event) => this.handlePointerMove(event));
      this.refs.canvas.addEventListener('pointerup', () => this.handlePointerUp());
      this.refs.canvas.addEventListener('pointerleave', () => this.handlePointerUp());
      this.refs.canvas.addEventListener('pointercancel', () => this.handlePointerUp());
    },

    setBrushColor(color) {
      this.state.brushColor = color;
    },

    setBrushSize(size) {
      this.state.brushSize = size;
    },

    setMoveMode(enabled) {
      this.state.isMoveMode = enabled;
      this.refs.canvas.classList.toggle('move-mode', enabled);
    },

    rotate(deltaDegrees) {
      this.state.view.rotation += (deltaDegrees * Math.PI) / 180;
      this.render();
    },

    zoom(delta) {
      this.state.view.scale = Utils.clamp(this.state.view.scale + delta, 0.5, 3);
      this.render();
    },

    resetView() {
      this.state.view.scale = 1;
      this.state.view.rotation = 0;
      this.state.view.offsetX = 0;
      this.state.view.offsetY = 0;
      this.render();
    },

    loadImage(image) {
      return new Promise((resolve) => {
        this.showLoader('Загрузка теста...');

        const source = new Image();
        source.onload = () => {
          this.state.templateImage = source;
          this.drawTemplate(source);
          this.clearDrawingLayer(false);
          this.resetView();
          this.state.undoStack = [];
          this.state.redoStack = [];
          this.saveState();
          this.hideLoader();
          resolve(true);
        };

        source.onerror = () => {
          this.drawPlaceholder();
          this.clearDrawingLayer(false);
          this.resetView();
          this.state.undoStack = [];
          this.state.redoStack = [];
          this.saveState();
          this.hideLoader();
          resolve(false);
        };

        source.src = image.filename;
      });
    },

    drawTemplate(image) {
      const ctx = this.refs.templateContext;
      ctx.clearRect(0, 0, appConfig.canvasWidth, appConfig.canvasHeight);
      ctx.fillStyle = appConfig.backgroundColor;
      ctx.fillRect(0, 0, appConfig.canvasWidth, appConfig.canvasHeight);

      const scale = appConfig.canvasHeight / image.height;
      const drawWidth = image.width * scale;
      const drawHeight = appConfig.canvasHeight;
      const offsetX = (appConfig.canvasWidth - drawWidth) / 2;
      ctx.drawImage(image, offsetX, 0, drawWidth, drawHeight);
    },

    drawPlaceholder() {
      const ctx = this.refs.templateContext;
      ctx.clearRect(0, 0, appConfig.canvasWidth, appConfig.canvasHeight);
      ctx.fillStyle = appConfig.backgroundColor;
      ctx.fillRect(0, 0, appConfig.canvasWidth, appConfig.canvasHeight);
      ctx.fillStyle = '#475569';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '600 34px Manrope';
      ctx.fillText('Изображение не выбрано', appConfig.canvasWidth / 2, appConfig.canvasHeight / 2 - 20);
      ctx.font = '500 20px Manrope';
      ctx.fillText('Вернитесь на страницу настроек', appConfig.canvasWidth / 2, appConfig.canvasHeight / 2 + 26);
      this.render();
    },

    clearDrawingLayer(shouldSave = true) {
      this.refs.drawingContext.clearRect(0, 0, appConfig.canvasWidth, appConfig.canvasHeight);
      this.render();
      if (shouldSave) {
        this.saveState();
      }
    },

    handlePointerDown(event) {
      const point = this.getCanvasCoordinates(event);
      if (!point) {
        return;
      }

      this.refs.canvas.setPointerCapture(event.pointerId);

      if (this.state.isMoveMode) {
        this.state.isPanning = true;
        this.state.lastPoint = {
          x: event.clientX,
          y: event.clientY
        };
        this.refs.canvas.classList.add('dragging');
        return;
      }

      this.state.isDrawing = true;
      this.state.lastPoint = point;
      this.drawStroke(point, point);
      this.render();
    },

    handlePointerMove(event) {
      if (this.state.isPanning && this.state.lastPoint) {
        const rect = this.refs.canvas.getBoundingClientRect();
        const scaleX = appConfig.canvasWidth / rect.width;
        const scaleY = appConfig.canvasHeight / rect.height;
        this.state.view.offsetX += (event.clientX - this.state.lastPoint.x) * scaleX;
        this.state.view.offsetY += (event.clientY - this.state.lastPoint.y) * scaleY;
        this.state.lastPoint = { x: event.clientX, y: event.clientY };
        this.render();
        return;
      }

      if (!this.state.isDrawing) {
        return;
      }

      const point = this.getCanvasCoordinates(event);
      if (!point || !this.state.lastPoint) {
        return;
      }

      this.drawStroke(this.state.lastPoint, point);
      this.state.lastPoint = point;
      this.render();
    },

    handlePointerUp() {
      if (this.state.isDrawing) {
        this.saveState();
      }

      this.state.isDrawing = false;
      this.state.isPanning = false;
      this.state.lastPoint = null;
      this.refs.canvas.classList.remove('dragging');
    },

    drawStroke(from, to) {
      const ctx = this.refs.drawingContext;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = this.state.brushColor;
      ctx.lineWidth = this.state.brushSize;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.restore();
    },

    getCanvasCoordinates(event) {
      const rect = this.refs.canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        return null;
      }

      const x = (event.clientX - rect.left) * (appConfig.canvasWidth / rect.width);
      const y = (event.clientY - rect.top) * (appConfig.canvasHeight / rect.height);

      const centerX = appConfig.canvasWidth / 2;
      const centerY = appConfig.canvasHeight / 2;
      const translatedX = x - centerX - this.state.view.offsetX;
      const translatedY = y - centerY - this.state.view.offsetY;
      const cos = Math.cos(-this.state.view.rotation);
      const sin = Math.sin(-this.state.view.rotation);
      const rotatedX = translatedX * cos - translatedY * sin;
      const rotatedY = translatedX * sin + translatedY * cos;
      const scale = this.state.view.scale || 1;
      const finalX = rotatedX / scale + centerX;
      const finalY = rotatedY / scale + centerY;

      return {
        x: Utils.clamp(finalX, 0, appConfig.canvasWidth),
        y: Utils.clamp(finalY, 0, appConfig.canvasHeight)
      };
    },

    render() {
      const ctx = this.refs.context;
      ctx.clearRect(0, 0, appConfig.canvasWidth, appConfig.canvasHeight);
      ctx.fillStyle = appConfig.backgroundColor;
      ctx.fillRect(0, 0, appConfig.canvasWidth, appConfig.canvasHeight);
      ctx.save();
      ctx.translate(appConfig.canvasWidth / 2 + this.state.view.offsetX, appConfig.canvasHeight / 2 + this.state.view.offsetY);
      ctx.scale(this.state.view.scale, this.state.view.scale);
      ctx.rotate(this.state.view.rotation);
      ctx.translate(-appConfig.canvasWidth / 2, -appConfig.canvasHeight / 2);
      ctx.drawImage(this.refs.templateCanvas, 0, 0);
      ctx.drawImage(this.refs.drawingCanvas, 0, 0);
      ctx.restore();
    },

    saveState() {
      const snapshot = this.refs.drawingCanvas.toDataURL('image/png');
      if (this.state.undoStack[this.state.undoStack.length - 1] === snapshot) {
        return;
      }

      this.state.undoStack.push(snapshot);
      if (this.state.undoStack.length > MAX_HISTORY) {
        this.state.undoStack.shift();
      }
      this.state.redoStack = [];
      if (window.App && typeof window.App.updateUndoRedoButtons === 'function') {
        window.App.updateUndoRedoButtons();
      }
    },

    restoreSnapshot(snapshot) {
      return new Promise((resolve) => {
        const image = new Image();
        image.onload = () => {
          this.refs.drawingContext.clearRect(0, 0, appConfig.canvasWidth, appConfig.canvasHeight);
          this.refs.drawingContext.drawImage(image, 0, 0);
          this.render();
          resolve();
        };
        image.src = snapshot;
      });
    },

    async undo() {
      if (this.state.undoStack.length <= 1) {
        return;
      }

      const current = this.state.undoStack.pop();
      this.state.redoStack.push(current);
      await this.restoreSnapshot(this.state.undoStack[this.state.undoStack.length - 1]);
      if (window.App && typeof window.App.updateUndoRedoButtons === 'function') {
        window.App.updateUndoRedoButtons();
      }
    },

    async redo() {
      if (!this.state.redoStack.length) {
        return;
      }

      const snapshot = this.state.redoStack.pop();
      this.state.undoStack.push(snapshot);
      await this.restoreSnapshot(snapshot);
      if (window.App && typeof window.App.updateUndoRedoButtons === 'function') {
        window.App.updateUndoRedoButtons();
      }
    },

    getRotationDegrees() {
      return Math.round((this.state.view.rotation * 180) / Math.PI);
    },

    getZoomPercent() {
      return Math.round(this.state.view.scale * 100);
    },

    getDrawingCanvas() {
      return this.refs.drawingCanvas;
    },

    getExportDataUrl() {
      this.refs.exportContext.clearRect(0, 0, appConfig.canvasWidth, appConfig.canvasHeight);
      this.refs.exportContext.drawImage(this.refs.templateCanvas, 0, 0);
      this.refs.exportContext.drawImage(this.refs.drawingCanvas, 0, 0);
      return this.refs.exportCanvas.toDataURL('image/png');
    },

    showLoader(message) {
      this.refs.loaderText.textContent = message;
      this.refs.loader.classList.remove('hidden');
    },

    hideLoader() {
      this.refs.loader.classList.add('hidden');
    }
  };

  window.CanvasModule = CanvasModule;
})();
