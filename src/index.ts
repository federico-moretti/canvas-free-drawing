type Color = number[];

type Coordinates = number[];

interface Position {
  y: number;
  x: number;
  isBucket: boolean;
  newColor?: Color;
  tolerance?: number;
  strokeColor?: Color;
  moving?: boolean;
  lineWidth: number;
}

type ColorRGBA = {
  R: number;
  G: number;
  B: number;
  A?: number;
};

interface Parameters {
  elementId: string;
  width: number;
  height: number;
  backgroundColor: Color;
  lineWidth: number;
  strokeColor: Color;
  disabled: string;
  showWarnings: boolean;
  maxSnapshots: number;
}

export default class CanvasFreeDrawing {
  elementId: string | void;
  canvasNode: HTMLElement | null;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  maxSnapshots: number;
  snapshots: ImageData[];
  undos: ImageData[];
  positions: [Position[]?];
  leftCanvasDrawing: boolean;
  isDrawing: boolean;
  isDrawingModeEnabled: boolean;
  imageRestored: boolean;
  lineWidth: number;
  backgroundColor?: Color;
  strokeColor: Color;
  bucketToolColor: Color;
  bucketToolTolerance: number;
  isBucketToolEnabled: boolean;
  listenersList: string[];
  allowedEvents: string[];
  redrawCounter: number;
  dispatchEventsOnceEvery: number;

  redrawEvent: Event;
  mouseUpEvent: Event;
  mouseDownEvent: Event;
  mouseEnterEvent: Event;
  mouseLeaveEvent: Event;
  touchStartEvent: Event;
  touchEndEvent: Event;

  touchIdentifier?: number;
  previousX?: number;
  previousY?: number;
  showWarnings: boolean;

  isNodeColorEqualCache = [];

  constructor(params: Parameters) {
    const {
      elementId,
      width,
      height,
      backgroundColor = [255, 255, 255],
      lineWidth = 5,
      strokeColor,
      disabled,
      showWarnings = false,
      maxSnapshots = 10,
    } = params;

    this.requiredParam(params, 'elementId');
    this.requiredParam(params, 'width');
    this.requiredParam(params, 'height');

    this.elementId = elementId;
    this.canvasNode = document.getElementById(this.elementId);

    if (this.canvasNode instanceof HTMLCanvasElement) {
      this.canvas = this.canvasNode;
    } else if (this.canvasNode instanceof HTMLElement) {
      const newCanvas = document.createElement('canvas');
      this.canvasNode.appendChild(newCanvas);
      this.canvas = newCanvas;
    } else {
      throw new Error(`No element found with following id: ${this.elementId}`);
    }
    this.context = <CanvasRenderingContext2D>this.canvas.getContext('2d');

    this.width = width;
    this.height = height;

    this.maxSnapshots = maxSnapshots;
    this.snapshots = [];
    this.undos = [];
    this.positions = [];
    this.leftCanvasDrawing = false; // to check if user left the canvas drawing, on mouseover resume drawing
    this.isDrawing = false;
    this.isDrawingModeEnabled = true;
    this.imageRestored = false;

    this.lineWidth = lineWidth;
    this.strokeColor = this.toValidColor(strokeColor);
    this.bucketToolColor = this.toValidColor(strokeColor);
    this.bucketToolTolerance = 0;
    this.isBucketToolEnabled = false;

    this.listenersList = ['mouseDown', 'mouseMove', 'mouseLeave', 'mouseUp', 'touchStart', 'touchMove', 'touchEnd'];
    this.allowedEvents = ['redraw', 'mouseup', 'mousedown', 'mouseenter', 'mouseleave'];
    this.redrawCounter = 0;
    this.dispatchEventsOnceEvery = 0; // this may become something like: [{event, counter}]

    // initialize events
    this.redrawEvent = new Event('cfd_redraw');
    this.mouseUpEvent = new Event('cfd_mouseup');
    this.mouseDownEvent = new Event('cfd_mousedown');
    this.mouseEnterEvent = new Event('cfd_mouseenter');
    this.mouseLeaveEvent = new Event('cfd_mouseleave');
    this.touchStartEvent = new Event('cfd_touchstart');
    this.touchEndEvent = new Event('cfd_touchend');

    // these are needed to remove the listener
    this.mouseDown = this.mouseDown.bind(this);
    this.mouseMove = this.mouseMove.bind(this);
    this.mouseLeave = this.mouseLeave.bind(this);
    this.mouseUp = this.mouseUp.bind(this);
    this.mouseUpDocument = this.mouseUpDocument.bind(this);
    this.touchStart = this.touchStart.bind(this);
    this.touchMove = this.touchMove.bind(this);
    this.touchEnd = this.touchEnd.bind(this);

    this.touchIdentifier = undefined;
    this.previousX = undefined;
    this.previousY = undefined;

    this.showWarnings = showWarnings;

    // cache
    this.isNodeColorEqualCache = [];

    this.setDimensions();
    this.setBackground(backgroundColor);
    this.storeSnapshot();

    if (!disabled) this.enableDrawingMode();
  }

  requiredParam(object: object, param: string) {
    if (!object || !(object as any)[param]) {
      throw new Error(`${param} is required`);
    }
  }

  logWarning(...args: string[]) {
    if (this.showWarnings) console.warn(...args);
  }

  addListeners() {
    this.listenersList.forEach(event => {
      this.canvas.addEventListener(event.toLowerCase(), (this as any)[event]);
    });
    document.addEventListener('mouseup', this.mouseUpDocument);
  }

  removeListeners() {
    this.listenersList.forEach(event => {
      this.canvas.removeEventListener(event.toLowerCase(), (this as any)[event]);
    });
    document.removeEventListener('mouseup', this.mouseUpDocument);
  }

  enableDrawingMode() {
    this.isDrawingModeEnabled = true;
    this.addListeners();
    this.toggleCursor();
    return this.isDrawingModeEnabled;
  }

  disableDrawingMode() {
    this.isDrawingModeEnabled = false;
    this.removeListeners();
    this.toggleCursor();
    return this.isDrawingModeEnabled;
  }

  mouseDown(event: MouseEvent) {
    if (event.button !== 0) return;
    const x = event.pageX - this.canvas.offsetLeft;
    const y = event.pageY - this.canvas.offsetTop;
    return this.drawPoint(x, y);
  }

  mouseMove(event: MouseEvent) {
    const x = event.pageX - this.canvas.offsetLeft;
    const y = event.pageY - this.canvas.offsetTop;
    this.drawLine(x, y, event);
  }

  touchStart(event: TouchEvent) {
    if (event.changedTouches.length > 0) {
      const { pageX, pageY, identifier } = event.changedTouches[0];
      const x = pageX - this.canvas.offsetLeft;
      const y = pageY - this.canvas.offsetTop;
      this.touchIdentifier = identifier;
      return this.drawPoint(x, y);
    }
  }

  touchMove(event: TouchEvent) {
    if (event.changedTouches.length > 0) {
      const { pageX, pageY, identifier } = event.changedTouches[0];
      const x = pageX - this.canvas.offsetLeft;
      const y = pageY - this.canvas.offsetTop;

      // check if is multi touch, if it is do nothing
      if (identifier != this.touchIdentifier) return;

      this.previousX = x;
      this.previousY = y;
      this.drawLine(x, y, event);
    }
  }

  touchEnd() {
    this.handleEndDrawing();
    this.canvas.dispatchEvent(this.touchEndEvent);
  }

  mouseUp() {
    this.handleEndDrawing();
    this.canvas.dispatchEvent(this.mouseUpEvent);
  }

  mouseUpDocument() {
    this.leftCanvasDrawing = false;
  }

  mouseLeave() {
    if (this.isDrawing) this.leftCanvasDrawing = true;
    this.isDrawing = false;
    this.canvas.dispatchEvent(this.mouseLeaveEvent);
  }

  mouseEnter() {
    this.canvas.dispatchEvent(this.mouseEnterEvent);
  }

  handleEndDrawing() {
    this.isDrawing = false;
    this.storeSnapshot();
  }

  drawPoint(x: number, y: number) {
    if (this.isBucketToolEnabled) {
      return this.fill(x, y, this.bucketToolColor, { tolerance: this.bucketToolTolerance });
    }
    this.isDrawing = true;
    this.storeDrawing(x, y, false);

    this.canvas.dispatchEvent(this.mouseDownEvent);

    this.handleDrawing(this.dispatchEventsOnceEvery);
  }

  drawLine(x: number, y: number, event: MouseEvent | TouchEvent) {
    if (this.leftCanvasDrawing) {
      this.leftCanvasDrawing = false;
      if (event instanceof MouseEvent) {
        this.mouseDown(event);
      } else if (event instanceof TouchEvent) {
        this.touchEnd();
      }
    }

    if (this.isDrawing) {
      this.storeDrawing(x, y, true);
      this.handleDrawing(this.dispatchEventsOnceEvery);
    }
  }

  handleDrawing(dispatchEventsOnceEvery: number) {
    this.context.lineJoin = 'round';
    const positions = [[...this.positions].pop()];

    positions.forEach(position => {
      if (position && position[0] && position[0].strokeColor) {
        this.context.strokeStyle = this.rgbaFromArray(position[0].strokeColor);
        this.context.lineWidth = position[0].lineWidth;
        this.draw(position);
      }
    });

    if (!dispatchEventsOnceEvery) {
      this.canvas.dispatchEvent(this.redrawEvent);
    } else if (this.redrawCounter % dispatchEventsOnceEvery === 0) {
      this.canvas.dispatchEvent(this.redrawEvent);
    }

    this.undos = [];
    this.redrawCounter += 1;
  }

  draw(position: Position[]) {
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
  fill(x: number, y: number, newColor: Color, { tolerance }: { tolerance: number }) {
    return new Promise(resolve => {
      newColor = this.toValidColor(newColor);
      if (this.positions.length === 0 && !this.imageRestored) {
        this.setBackground(newColor, false);
        this.canvas.dispatchEvent(this.redrawEvent);
        return;
      }

      const imageData = this.context.getImageData(0, 0, this.width, this.height);
      const newData = imageData.data;
      const targetColor = this.getNodeColor(x, y, newData);
      if (this.isNodeColorEqual(targetColor, newColor, tolerance)) return;
      const queue: Coordinates[] = [];
      queue.push([x, y]);

      while (queue.length) {
        if (queue.length > this.width * this.height) break;
        const n = queue.pop();
        let w = <number[]>n;
        let e = <number[]>n;

        while (this.isNodeColorEqual(this.getNodeColor(w[0] - 1, w[1], newData), targetColor, tolerance)) {
          w = [w[0] - 1, w[1]];
        }

        while (this.isNodeColorEqual(this.getNodeColor(e[0] + 1, e[1], newData), targetColor, tolerance)) {
          e = [e[0] + 1, e[1]];
        }

        const firstNode = w[0];
        const lastNode = e[0];

        for (let i = firstNode; i <= lastNode; i++) {
          this.setNodeColor(i, w[1], newColor, newData);

          if (this.isNodeColorEqual(this.getNodeColor(i, w[1] + 1, newData), targetColor, tolerance)) {
            queue.push([i, w[1] + 1]);
          }

          if (this.isNodeColorEqual(this.getNodeColor(i, w[1] - 1, newData), targetColor, tolerance)) {
            queue.push([i, w[1] - 1]);
          }
        }
      }

      this.context.putImageData(imageData, 0, 0);
      this.canvas.dispatchEvent(this.redrawEvent);

      resolve(true);
    });
  }

  toValidColor(color: Color): Color {
    if (Array.isArray(color) && color.length === 4) color.pop();
    if (Array.isArray(color) && color.length === 3) {
      const validColor = [...color];
      validColor.push(255);
      return validColor;
    } else {
      this.logWarning('Color is not valid! It must be an array with RGB values:  [0-255, 0-255, 0-255]');
      return [0, 0, 0, 255];
    }
  }

  // i = color 1; j = color 2; t = tolerance
  isNodeColorEqual(i: Color, j: Color, t: number) {
    // const color1 = JSON.stringify(i);
    // const color2 = JSON.stringify(j);
    const color1 = '' + i[0] + i[1] + i[2] + i[3];
    const color2 = '' + j[0] + j[1] + j[2] + j[3];
    const key = color1 + color2 + t;
    t = t || 0;

    if (this.isNodeColorEqualCache.hasOwnProperty(color1 + color2 + t)) {
      return (this.isNodeColorEqualCache as any)[key];
    }

    const diffRed = Math.abs(j[0] - i[0]);
    const diffGreen = Math.abs(j[1] - i[1]);
    const diffBlue = Math.abs(j[2] - i[2]);

    const percentDiffRed = diffRed / 255;
    const percentDiffGreen = diffGreen / 255;
    const percentDiffBlue = diffBlue / 255;

    const percentDiff = ((percentDiffRed + percentDiffGreen + percentDiffBlue) / 3) * 100;
    const result = t >= percentDiff;

    (this.isNodeColorEqualCache as any)[key] = result;
    return result;
  }

  getNodeColor(x: number, y: number, data: Uint8ClampedArray) {
    const i = (x + y * this.width) * 4;
    return [data[i], data[i + 1], data[i + 2], data[i + 3]];
  }

  setNodeColor(x: number, y: number, color: Color, data: Uint8ClampedArray) {
    const i = (x + y * this.width) * 4;
    data[i] = color[0];
    data[i + 1] = color[1];
    data[i + 2] = color[2];
    data[i + 3] = color[3];
  }

  rgbaFromArray(a: Color) {
    return `rgba(${a[0]},${a[1]},${a[2]},${a[3]})`;
  }

  setDimensions() {
    this.canvas.height = this.height;
    this.canvas.width = this.width;
  }

  toggleCursor() {
    this.canvas.style.cursor = this.isDrawingModeEnabled ? 'crosshair' : 'auto';
  }

  storeDrawing(x: number, y: number, moving: boolean) {
    if (moving) {
      const lastIndex = this.positions.length - 1;
      (this.positions[lastIndex] as Position[]).push({
        x,
        y,
        moving,
        lineWidth: this.lineWidth,
        strokeColor: this.strokeColor,
        isBucket: false,
      });
    } else {
      this.positions.push([
        {
          x,
          y,
          isBucket: false,
          moving,
          lineWidth: this.lineWidth,
          strokeColor: this.strokeColor,
        },
      ]);
    }
  }

  storeSnapshot() {
    new Promise(resolve => {
      const imageData = this.getCanvasSnapshot();
      this.snapshots.push(imageData);
      if (this.snapshots.length > this.maxSnapshots) {
        this.snapshots = this.snapshots.splice(-Math.abs(this.maxSnapshots));
      }
      resolve();
    });
  }

  getCanvasSnapshot() {
    return this.context.getImageData(0, 0, this.width, this.height);
  }

  restoreCanvasSnapshot(imageData: ImageData) {
    this.context.putImageData(imageData, 0, 0);
  }

  // Public APIs

  on(params: { event: string; counter?: number }, callback: Function) {
    const { event, counter } = params;
    this.requiredParam(params, 'event');

    if (this.allowedEvents.includes(event)) {
      if (event === 'redraw' && counter && Number.isInteger(counter)) {
        this.dispatchEventsOnceEvery = counter;
      }
      this.canvas.addEventListener('cfd_' + event, () => callback());
    } else {
      this.logWarning(`This event is not allowed: ${event}`);
    }
  }

  setLineWidth(px: number) {
    this.lineWidth = px;
  }

  setBackground(color: Color, save = true) {
    const validColor = this.toValidColor(color);
    if (validColor) {
      if (save) this.backgroundColor = validColor;
      this.context.fillStyle = this.rgbaFromArray(validColor);
      this.context.fillRect(0, 0, this.width, this.height);
    }
  }

  setDrawingColor(color: Color) {
    this.configBucketTool({ color });
    this.setStrokeColor(color);
  }

  setStrokeColor(color: Color) {
    this.strokeColor = this.toValidColor(color);
  }

  configBucketTool(params: { color?: Color; tolerance?: number }) {
    const { color = null, tolerance = null } = params;
    if (color) this.bucketToolColor = this.toValidColor(color);
    if (tolerance && tolerance > 0) {
      this.bucketToolTolerance = tolerance > 100 ? 100 : tolerance;
    }
  }

  toggleBucketTool() {
    return (this.isBucketToolEnabled = !this.isBucketToolEnabled);
  }

  toggleDrawingMode() {
    return this.isDrawingModeEnabled ? this.disableDrawingMode() : this.enableDrawingMode();
  }

  clear() {
    this.context.clearRect(0, 0, this.width, this.height);
    this.positions = [];
    if (this.backgroundColor) this.setBackground(this.backgroundColor);
    this.handleEndDrawing();
  }

  save() {
    return this.canvas.toDataURL();
  }

  restore(backup: string, callback: Function) {
    const image = new Image();
    image.src = backup;
    image.onload = () => {
      this.imageRestored = true;
      this.context.drawImage(image, 0, 0);
      if (typeof callback === 'function') callback();
    };
  }

  undo() {
    const lastSnapshot = this.snapshots[this.snapshots.length - 1];
    const goToSnapshot = this.snapshots[this.snapshots.length - 2];
    if (goToSnapshot) {
      this.restoreCanvasSnapshot(goToSnapshot);
      this.snapshots.pop();
      this.undos.push(lastSnapshot);
      this.undos = this.undos.splice(-Math.abs(this.maxSnapshots));
    } else {
      this.logWarning('There are no more undos left.');
    }
  }

  redo() {
    if (this.undos.length > 0) {
      const lastUndo = this.undos.pop();
      if (lastUndo) {
        this.restoreCanvasSnapshot(lastUndo);
        this.snapshots.push(lastUndo);
        this.snapshots = this.snapshots.splice(-Math.abs(this.maxSnapshots));
      }
    } else {
      this.logWarning('There are no more redo left.');
    }
  }
}
