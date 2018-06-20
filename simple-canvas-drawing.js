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
    this.strokeColor = 'black';

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
      this.fill(x, y, [255, 255, 255, 255], [255, 0, 0, 255]);
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

  //  Flood-fill (node, target-color, replacement-color):
  //  1. If target-color is equal to replacement-color, return.
  //  2. If color of node is not equal to target-color, return.
  //  3. Set Q to the empty queue.
  //  4. Add node to Q.
  //  5. For each element N of Q:
  //  6.     Set w and e equal to N.
  //  7.     Move w to the west until the color of the node to the west of w no longer matches target-color.
  //  8.     Move e to the east until the color of the node to the east of e no longer matches target-color.
  //  9.     For each node n between w and e:
  // 10.         Set the color of n to replacement-color.
  // 11.         If the color of the node to the north of n is target-color, add that node to Q.
  // 12.         If the color of the node to the south of n is target-color, add that node to Q.
  // 13. Continue looping until Q is exhausted.
  // 14. Return.
  fill(x, y, targetColor, newColor) {
    console.log('fill started');
    const rgbaTargetColor = this.rgbaFromArray(newColor);
    this.imageData = this.context.getImageData(0, 0, this.width, this.height).data;
    const nodeColor = this.getNodeColor(x, y);
    console.log('data', this.imageData);
    console.log('rgba', rgbaTargetColor);
    if (this.compareNodeColor(targetColor, newColor)) return;
    if (!this.compareNodeColor(nodeColor, targetColor)) return;
    console.log('after checks');
    const colored = {};
    const queue = [];
    queue.push([x, y]);

    while (queue.length) {
      const n = queue.pop();
      let w = n;
      let e = n;

      while (this.compareNodeColor(this.getNodeColor(w[0] - 1, w[1]), targetColor)) {
        w = [w[0] - 1, w[1]];
      }

      while (this.compareNodeColor(this.getNodeColor(e[0] + 1, e[1]), targetColor)) {
        e = [e[0] + 1, e[1]];
      }

      const firstNode = w[0];
      const lastNode = e[0];

      for (let i = firstNode; i <= lastNode; i++) {
        this.context.fillStyle = rgbaTargetColor;
        this.context.fillRect(i, w[1], 1, 1);
        colored[i.toString() + w[1].toString()] = true;

        const n = [i, w[1] + 1];
        if (this.compareNodeColor(this.getNodeColor(n[0], n[1]), targetColor)) {
          if (!this.isAlreadyColored(n[0], n[1], colored)) {
            queue.push(n);
            // colored.push([i, w[1] + 1]);
          }
        }

        const s = [i, w[1] - 1];
        if (this.compareNodeColor(this.getNodeColor(s[0], s[1]), targetColor)) {
          if (!this.isAlreadyColored(s[0], s[1], colored)) {
            queue.push(s);
            // colored.push([i, w[1] - 1]);
          }
        }
      }
    }
    console.log('fill ended');
  }

  isAlreadyColored(x, y, colored) {
    if (colored[x.toString() + y.toString()]) return true;
    return false;
  }

  compareNodeColor(color1, color2) {
    return color1[0] === color2[0] && color1[1] === color2[1] && color1[2] === color2[3] && color1[3] === color2[3];
  }

  rgbaFromArray(a) {
    return `rgba(${a[0]},${a[1]},${a[2]},${a[3]})`;
  }

  getNodeColor(x, y) {
    const i = (x + y * this.width) * 4;
    return [this.imageData[i], this.imageData[i + 1], this.imageData[i + 2], this.imageData[i + 3]];
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
    this.context.fillStyle = 'white';
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
    return this.positions;
  }

  restore(backup) {
    this.clear();
    this.positions = JSON.parse(backup);
    this.redraw();
  }
}
