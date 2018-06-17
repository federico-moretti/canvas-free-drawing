class SimpleCanvasDrawing {
  constructor(element, params) {
    const { width, height } = params;
    this.elementId = element;
    this.canvas = this.getCanvas(element);
    this.context = this.canvas.getContext('2d', { alpha: false });
    this.isDrawing = false;

    this.width = width;
    this.height = height;

    this.sectionSize = 20;
    this.lineWidth = 5;
    this.strokeColor = 'black';

    this.xArray = [];
    this.yArray = [];
    this.movingArray = [];
    this.lastPath = null;
    this.positions = [];

    this.leftCanvasDrawing = false; // to check if user left the canvas drawing, on mouseover resume drawing

    this.setDimensions();
    this.setBackground();
    this.addListeners();
  }

  addListeners() {
    this.canvas.addEventListener('mousedown', event => this.mouseDown(event));
    this.canvas.addEventListener('mousemove', event => this.mouseMove(event));
    this.canvas.addEventListener('mouseup', () => this.mouseUp());
    this.canvas.addEventListener('mouseleave', () => this.mouseLeave());
  }

  mouseDown(event) {
    const x = event.pageX - this.canvas.offsetLeft;
    const y = event.pageY - this.canvas.offsetTop;
    this.isDrawing = true;
    const lenght = this.storeDrawing(x, y, false);
    this.lastPath = lenght - 1; // index last new path
    this.redraw();
  }

  mouseMove(event) {
    if (this.isDrawing) {
      const x = event.pageX - this.canvas.offsetLeft;
      const y = event.pageY - this.canvas.offsetTop;
      this.storeDrawing(x, y, true);
      this.redraw();
    }
  }

  mouseUp() {
    this.isDrawing = false;
  }

  mouseLeave() {
    this.isDrawing = false;
  }

  storeDrawing(x, y, moving) {
    return this.positions.push({ x, y, moving });
  }

  redraw(all) {
    this.context.strokeStyle = this.strokeColor;
    this.context.lineJoin = 'round';
    this.context.lineWidth = this.lineWidth;

    let position = [];

    if (all) {
      position = this.positions;
    } else {
      position = this.positions.slice(this.lastPath);
    }

    position.forEach(({ x, y, moving }, i) => {
      this.context.beginPath();
      if (moving && i) {
        this.context.moveTo(position[i - 1]['x'], position[i - 1]['y']);
      } else {
        this.context.moveTo(x - 1, y);
      }
      this.context.lineTo(x, y);
      this.context.closePath();
      this.context.stroke();
    });
  }

  // TODO: see flood-fill
  fill() {}

  // not used anymore
  getRedrawSection(x, y) {
    return { x: Math.floor(x / this.sectionSize), y: Math.floor(y / this.sectionSize) };
  }

  setDimensions() {
    this.canvas.height = this.height;
    this.canvas.width = this.width;
  }

  setLineWidth(px) {
    this.lineWidth = px;
  }

  setStrokeColor(color) {
    this.strokeColor = color;
  }

  getCanvas(id) {
    return document.getElementById(id);
  }

  setBackground() {
    this.context.fillStyle = 'white';
    this.context.fillRect(0, 0, this.width, this.height);
  }

  clear() {
    this.context.clearRect(0, 0, this.width, this.height);
    this.lastPath = null;
    this.positions = [];
    this.isDrawing = false;
  }

  save() {
    return this.positions;
  }

  restore(backup) {
    this.clear();
    this.positions = JSON.parse(backup);
    this.redraw();
  }
}
