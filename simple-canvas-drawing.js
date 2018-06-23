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
    this.lineWidth = 2;
    this.strokeColor = [0, 0, 0, 255];
    this.tolerance = false;

    this.xArray = [];
    this.yArray = [];
    this.movingArray = [];
    this.lastPath = null;
    this.positions = [];

    this.leftCanvasDrawing = false; // to check if user left the canvas drawing, on mouseover resume drawing
    this.selectedBucket = false;

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
    if (this.selectedBucket) {
      this.fill(x, y, this.strokeColor, this.tolerance);
      this.selectedBucket = false;
      return;
    }
    this.isDrawing = true;
    const lenght = this.storeDrawing(x, y, false);
    this.lastPath = lenght - 1; // index last new path
    this.redraw();
  }

  mouseMove(event) {
    if (this.leftCanvasDrawing) {
      this.leftCanvasDrawing = false;
      this.mouseDown(event);
    }
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
    if (this.isDrawing) this.leftCanvasDrawing = true;
    this.isDrawing = false;
  }

  storeDrawing(x, y, moving) {
    return this.positions.push({ x, y, moving });
  }

  redraw(all) {
    this.context.strokeStyle = this.rgbaFromArray(this.strokeColor);
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

  // https://en.wikipedia.org/wiki/Flood_fill
  fill(x, y, newColor, tolerance) {
    if (typeof newColor != 'object') throw new Error('New color must be an array like: [255, 255, 255, 255]');
    console.log('tolerance:', tolerance || 'none');
    const start = Date.now();
    const imageData = this.context.getImageData(0, 0, this.width, this.height);
    const data = imageData.data;
    const nodeColor = this.getNodeColor(x, y, data);
    const targetColor = this.getNodeColor(x, y, data);
    if (this.isNodeColorEqual(targetColor, newColor, tolerance)) return;
    if (!this.isNodeColorEqual(nodeColor, targetColor)) return;
    const queue = [];
    queue.push([x, y]);

    while (queue.length) {
      if (queue.length > this.width * this.height) break;
      const n = queue.pop();
      let w = n;
      let e = n;

      while (this.isNodeColorEqual(this.getNodeColor(w[0] - 1, w[1], data), targetColor, tolerance)) {
        w = [w[0] - 1, w[1]];
      }

      while (this.isNodeColorEqual(this.getNodeColor(e[0] + 1, e[1], data), targetColor, tolerance)) {
        e = [e[0] + 1, e[1]];
      }

      const firstNode = w[0];
      const lastNode = e[0];

      for (let i = firstNode; i <= lastNode; i++) {
        this.setNodeColor(i, w[1], newColor, data);

        if (this.isNodeColorEqual(this.getNodeColor(i, w[1] + 1, data), targetColor, tolerance)) {
          queue.push([i, w[1] + 1]);
        }

        if (this.isNodeColorEqual(this.getNodeColor(i, w[1] - 1, data), targetColor, tolerance)) {
          queue.push([i, w[1] - 1]);
        }
      }
    }

    this.context.putImageData(imageData, 0, 0);
    console.log(`execution flood-fill: ${Date.now() - start} ms`);
  }

  // i = color 1; j = color 2; t = tolerance
  isNodeColorEqual(i, j, t) {
    if (t) {
      return (
        Math.abs(i[0] - j[0]) <= t &&
        Math.abs(i[1] - j[1]) <= t &&
        Math.abs(i[2] - j[2]) <= t &&
        Math.abs(i[3] - j[3]) <= t
      );
    }
    return i[0] === j[0] && i[1] === j[1] && i[2] === j[3] && i[3] === j[3];
  }

  getNodeColor(x, y, data) {
    const i = (x + y * this.width) * 4;
    return [data[i], data[i + 1], data[i + 2], data[i + 3]];
  }

  setNodeColor(x, y, color, data) {
    const i = (x + y * this.width) * 4;
    data[i] = color[0];
    data[i + 1] = color[1];
    data[i + 2] = color[2];
    data[i + 3] = color[3];
  }

  rgbaFromArray(a) {
    return `rgba(${a[0]},${a[1]},${a[2]},${a[3]})`;
  }

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
    this.context.fillStyle = this.rgbaFromArray([255, 255, 255, 255]);
    this.context.fillRect(0, 0, this.width, this.height);
  }

  selectBucket() {
    this.selectedBucket = true;
  }

  clear() {
    this.context.clearRect(0, 0, this.width, this.height);
    this.lastPath = null;
    this.positions = [];
    this.isDrawing = false;
    this.setBackground();
  }

  save() {
    return this.canvas.toDataURL();
  }

  restore(backup) {
    const image = new Image();
    image.src = backup;
    image.onload = () => {
      this.context.drawImage(image, 0, 0);
    };
  }
}
