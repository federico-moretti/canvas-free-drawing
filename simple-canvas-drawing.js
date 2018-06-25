class SimpleCanvasDrawing {
  constructor(params = {}) {
    const {
      elementId = this.requiredParam('elementId'),
      width = this.requiredParam('width'),
      height = this.requiredParam('height'),
      lineWidth,
      strokeColor,
    } = params;

    this.elementId = elementId;
    this.canvas = document.getElementById(this.elementId);
    this.context = this.canvas.getContext('2d', { alpha: false });
    this.width = width;
    this.height = height;

    this.isDrawing = false;
    this.lineWidth = lineWidth || 5;
    this.tolerance = false;
    this.lastPath = null;
    this.positions = [];
    this.leftCanvasDrawing = false; // to check if user left the canvas drawing, on mouseover resume drawing
    this.selectedBucket = false;
    this.allowedEvents = ['redraw'];
    this.isCursorHidden = false;
    this.setStrokeColor(strokeColor);

    this.handleCursor();
    this.setDimensions();
    this.setBackground([255, 255, 255, 255]);
    this.addListeners();
  }

  requiredParam(param) {
    throw new Error(`${param} is required`);
  }

  addListeners() {
    this.canvas.addEventListener('mousedown', event => this.mouseDown(event));
    this.canvas.addEventListener('mousemove', event => this.mouseMove(event));
    this.canvas.addEventListener('mouseleave', () => this.mouseLeave());
    // this.canvas.addEventListener('mouseenter', () => this.mouseEnter());
    // this is on document to disable turn off 'leftCanvasDrawing'
    document.addEventListener('mouseup', () => this.mouseUp());
  }

  on(event, callback) {
    if (this.allowedEvents.includes(event)) {
      this.canvas.addEventListener(event, () => callback());
    }
  }

  mouseDown(event) {
    if (event.button !== 0) return;
    const x = event.pageX - this.canvas.offsetLeft;
    const y = event.pageY - this.canvas.offsetTop;
    if (this.selectedBucket) {
      this.fill(x, y, this.strokeColor, this.tolerance);
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

    // this.moveCursor(event);
  }

  mouseUp() {
    this.isDrawing = false;
    this.leftCanvasDrawing = false;
  }

  mouseLeave() {
    if (this.isDrawing) this.leftCanvasDrawing = true;
    this.isDrawing = false;
    // this.cursor.style.display = 'none';
  }

  mouseEnter() {
    console.log('mouse enter');
    // this.cursor.style.display = 'block';
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
      // this.context.translate(0.5, 0.5);
      this.context.stroke();
    });

    const redrawEvent = new Event('redraw');
    this.canvas.dispatchEvent(redrawEvent);
  }

  // https://en.wikipedia.org/wiki/Flood_fill
  fill(x, y, newColor, tolerance) {
    if (this.positions.length === 0) {
      this.setBackground(newColor);
      return;
    }
    if (typeof newColor != 'object') throw new Error('New color must be an array like: [255, 255, 255, 255]');
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

    const redrawEvent = new Event('redraw');
    this.canvas.dispatchEvent(redrawEvent);
    console.log(`Execution flood-fill: ${Date.now() - start} ms`);
  }

  // i = color 1; j = color 2; t = tolerance
  isNodeColorEqual(i, j, t) {
    if (t) {
      // console.log(Math.abs(i[0] - j[0]));
      // console.log(Math.abs(i[1] - j[1]));
      // console.log(Math.abs(i[2] - j[2]));
      // console.log('-------------');
      // prettier-ignore
      return (
        Math.abs(j[0] - i[0]) <= t &&
        Math.abs(j[1] - i[1]) <= t &&
        Math.abs(j[2] - i[2]) <= t
      );
    }
    return i[0] === j[0] && i[1] === j[1] && i[2] === j[2] && i[3] === j[3];
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

  rgbFromArray(a) {
    return `rgb(${a[0]},${a[1]},${a[2]})`;
  }

  setDimensions() {
    this.canvas.height = this.height;
    this.canvas.width = this.width;
  }

  setLineWidth(px) {
    this.lineWidth = px;
  }

  setStrokeColor(color) {
    if (typeof color === 'object' && color.length === 3) {
      color.push(255);
      this.strokeColor = color;
    } else if (!color) {
      this.strokeColor = [0, 0, 0, 255];
    } else {
      this.strokeColor = [0, 0, 0, 255];
      console.error('StrokeColor must be an array like: [255, 255, 255]');
    }
  }

  setBackground(color) {
    this.context.fillStyle = this.rgbaFromArray(color);
    this.context.fillRect(0, 0, this.width, this.height);
  }

  toggleBucket() {
    return (this.selectedBucket = !this.selectedBucket);
  }

  handleCursor() {
    this.canvas.style.cursor = 'crosshair';

    /*
    this.canvas.style.cursor = 'none';
    this.cursor = document.createElement('div');
    document.querySelector('body').appendChild(this.cursor);
    this.cursor.style.position = 'absolute';
    this.cursor.style.width = '10px';
    this.cursor.style.height = '10px';
    this.cursor.style.backgroundColor = this.rgbFromArray(this.strokeColor);
    this.cursor.style.pointerEvents = 'none';
    */
  }

  moveCursor(event) {
    this.cursor.style.top = event.pageY + 'px';
    this.cursor.style.left = event.pageX + 'px';
  }

  clear() {
    this.context.clearRect(0, 0, this.width, this.height);
    this.lastPath = null;
    this.positions = [];
    this.isDrawing = false;
    this.setBackground([255, 255, 255, 255]);
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
