const CanvasFreeDrawing = require('../dist/index').default;

console.warn = jest.fn();

describe('CanvasFreeDrawing', () => {
  const id = 'cfd';
  let cfd = null;

  const getNodeColor = (x, y) => {
    const imageData = cfd.context.getImageData(0, 0, cfd.width, cfd.height);
    const data = imageData.data;
    return cfd.getNodeColor(x, y, data);
  };

  const drawPoint = ({ x, y, color }) => {
    const event = { button: 0, pageX: x, pageY: y };
    cfd.setDrawingColor(color);
    if (cfd.isBucketToolEnabled) {
      return cfd.mouseDown(event);
    } else {
      cfd.mouseDown(event);
    }
    cfd.mouseUp();
  };

  beforeEach(() => {
    jest.clearAllMocks();

    document.body.innerHTML = `<canvas id="${id}"></canvas>`;
    cfd = new CanvasFreeDrawing({
      elementId: id,
      width: 500,
      height: 500,
      showWarnings: true,
    });
  });

  it('should throw error if missing parameters', () => {
    expect(() => {
      cfd = new CanvasFreeDrawing({
        width: 500,
        height: 500,
        showWarnings: true,
      });
    }).toThrow('elementId is required');
    expect(() => {
      cfd = new CanvasFreeDrawing({ elementId: id, width: 500 });
    }).toThrow('height is required');
    expect(() => {
      cfd = new CanvasFreeDrawing({ elementId: id, height: 500 });
    }).toThrow('width is required');
  });

  it('should create a canvas element than init cfd', () => {
    document.body.innerHTML = `<div id="${id}"></div>`;
    cfd = new CanvasFreeDrawing({
      elementId: id,
      width: 500,
      height: 500,
      showWarnings: true,
    });
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });

  it('should show an error on a not valid color', () => {
    cfd.toValidColor('nice color');
    expect(console.warn).toHaveBeenCalledWith(
      'Color is not valid!\nIt must be an array with RGB values:  [0-255, 0-255, 0-255]'
    );
  });

  it('should check for node color equality', () => {
    const node1 = [0, 0, 0];
    const node2 = [10, 10, 10];
    const node3 = [12, 12, 12];
    expect(cfd.isNodeColorEqual(node1, node1)).toBeTruthy();
    expect(cfd.isNodeColorEqual(node1, node2)).toBeFalsy();
    expect(cfd.isNodeColorEqual(node2, node3, 2)).toBeTruthy(); // with tolerance
  });

  it('should set initial correct background color', () => {
    cfd = new CanvasFreeDrawing({
      elementId: id,
      width: 500,
      height: 500,
      backgroundColor: [255, 255, 255],
    });
    const color = getNodeColor(250, 250, cfd);
    expect(color).toEqual([255, 255, 255, 255]);
  });

  it('should detect mouse leave the canvas drawing', () => {
    const event1 = { button: 0, pageX: 100, pageY: 100 };
    const event2 = { button: 0, pageX: 500, pageY: 100 };
    cfd.mouseDown(event1);
    cfd.mouseMove(event2);
    cfd.mouseLeave();

    expect(cfd.isDrawing).toBeFalsy();
    expect(cfd.leftCanvasDrawing).toBeTruthy();
  });

  it('should detect the mouse enter the canvas', done => {
    cfd.on({ event: 'mouseenter' }, () => {
      done();
    });
    cfd.mouseEnter();
  });

  it('should detect the mouseup outside the canvas', () => {
    cfd.mouseUpDocument();
    expect(cfd.leftCanvasDrawing).toBeFalsy();
  });

  it('should use floodfill', done => {
    let countEvents = 0;
    cfd.on({ event: 'redraw' }, () => {
      countEvents += 1;
    });

    cfd.on({ event: 'fill' }, () => {
      const colorLine = getNodeColor(100, 100, cfd);
      const colorFill = getNodeColor(150, 150, cfd);
      expect(countEvents).toBe(6);
      expect(colorLine).toEqual([0, 0, 0, 255]); // check lines
      expect(colorFill).toEqual([255, 0, 255, 255]); // check fill

      done();
    });

    cfd.mouseDown({ button: 0, pageX: 100, pageY: 100 });
    const moveEvents = [
      { button: 0, pageX: 300, pageY: 100 },
      { button: 0, pageX: 300, pageY: 300 },
      { button: 0, pageX: 100, pageY: 300 },
      { button: 0, pageX: 100, pageY: 100 },
    ];
    moveEvents.forEach(event => cfd.mouseMove(event));

    cfd.configBucketTool({ color: [255, 0, 255] });
    cfd.toggleBucketTool();
    expect(cfd.isBucketToolEnabled).toBe(true);

    cfd.mouseDown({ button: 0, pageX: 150, pageY: 150 });
  });

  it('should use floodfill with tolerance', done => {
    let countEvents = 0;
    cfd.on({ event: 'redraw' }, () => {
      countEvents += 1;
    });

    cfd.on({ event: 'fill' }, () => {
      const colorLine = getNodeColor(100, 100, cfd);
      const colorFill = getNodeColor(150, 150, cfd);
      expect(countEvents).toBe(6);
      expect(colorLine).toEqual([0, 0, 0, 255]); // check lines
      expect(colorFill).toEqual([255, 0, 255, 255]); // check fill

      done();
    });

    cfd.mouseDown({ button: 0, pageX: 100, pageY: 100 });
    const moveEvents = [
      { button: 0, pageX: 300, pageY: 100 },
      { button: 0, pageX: 300, pageY: 300 },
      { button: 0, pageX: 100, pageY: 300 },
      { button: 0, pageX: 100, pageY: 100 },
    ];
    moveEvents.forEach(event => cfd.mouseMove(event));

    cfd.configBucketTool({ tolerance: 0, color: [255, 0, 255] });
    cfd.toggleBucketTool();
    expect(cfd.isBucketToolEnabled).toBe(true);

    cfd.mouseDown({ button: 0, pageX: 150, pageY: 150 });
  });

  it('should draw a red point', () => {
    drawPoint({ x: 10, y: 10, color: [255, 0, 0] });

    const color = getNodeColor(10, 10, cfd);
    expect(cfd.positions[0][0]).toEqual({
      isBucket: false,
      lineWidth: 5,
      moving: false,
      strokeColor: [255, 0, 0, 255],
      x: 10,
      y: 10,
    });
    expect(color).toEqual([255, 0, 0, 255]);
  });

  it('should draw a red point with touch', () => {
    const event = { changedTouches: [{ pageX: 10, pageY: 10 }] };
    cfd.setDrawingColor([255, 0, 0]);
    cfd.touchStart(event);
    cfd.touchEnd();

    const color = getNodeColor(10, 10, cfd);
    expect(cfd.positions[0][0]).toEqual({
      isBucket: false,
      lineWidth: 5,
      moving: false,
      strokeColor: [255, 0, 0, 255],
      x: 10,
      y: 10,
    });
    expect(color).toEqual([255, 0, 0, 255]);
  });

  it('should draw a black line', () => {
    const event1 = { button: 0, pageX: 10, pageY: 10 };
    const event2 = { button: 0, pageX: 15, pageY: 15 };
    cfd.mouseDown(event1);
    cfd.mouseMove(event2);
    cfd.mouseUp();

    const color = getNodeColor(15, 15, cfd);
    expect(cfd.positions[0][0]).toEqual({
      isBucket: false,
      lineWidth: 5,
      moving: false,
      strokeColor: [0, 0, 0, 255],
      x: 10,
      y: 10,
    });
    expect(cfd.positions[0][1]).toEqual({
      isBucket: false,
      lineWidth: 5,
      moving: true,
      strokeColor: [0, 0, 0, 255],
      x: 15,
      y: 15,
    });
    expect(color).toEqual([0, 0, 0, 255]);
  });

  it('should draw a black line with touch', () => {
    const event1 = { changedTouches: [{ pageX: 10, pageY: 10 }] };
    const event2 = { changedTouches: [{ pageX: 15, pageY: 15 }] };
    cfd.touchStart(event1);
    cfd.touchMove(event2);
    cfd.touchEnd();

    const color = getNodeColor(15, 15, cfd);
    expect(cfd.positions[0][0]).toEqual({
      isBucket: false,
      lineWidth: 5,
      moving: false,
      strokeColor: [0, 0, 0, 255],
      x: 10,
      y: 10,
    });
    expect(cfd.positions[0][1]).toEqual({
      isBucket: false,
      lineWidth: 5,
      moving: true,
      strokeColor: [0, 0, 0, 255],
      x: 15,
      y: 15,
    });
    expect(color).toEqual([0, 0, 0, 255]);
  });

  it('should not draw a red point because used left click', () => {
    const event = { button: 1, pageX: 10, pageY: 10 };
    cfd.setDrawingColor([255, 0, 0]);
    cfd.mouseDown(event);
    cfd.mouseUp();

    const color = getNodeColor(10, 10, cfd);
    expect(cfd.positions.length).toBe(0);
    expect(color).toEqual([255, 255, 255, 255]);
  });

  it('should register and fire redraw event', done => {
    cfd.on({ event: 'redraw' }, () => done());
    const event1 = { button: 0, pageX: 100, pageY: 100 };
    cfd.mouseDown(event1);
  });

  it('should fire redraw event with debounce - multiple clicks', () => {
    const countRedraws = jest.fn();
    cfd.on({ event: 'redraw', counter: 10 }, countRedraws);

    cfd.mouseDown({ button: 0, pageX: 150, pageY: 150 });
    cfd.mouseDown({ button: 0, pageX: 100, pageY: 100 });

    expect(countRedraws.mock.calls.length).toBe(2);
  });

  it('should fire redraw event with debounce - only click', () => {
    const countRedraws = jest.fn();
    cfd.on({ event: 'redraw', counter: 3 }, countRedraws);
    const clickEvent = { button: 0, pageX: 100, pageY: 100 };
    const moveEvents = [
      { button: 0, pageX: 100, pageY: 110 },
      { button: 0, pageX: 100, pageY: 120 },
    ];

    cfd.mouseDown(clickEvent);
    moveEvents.forEach(event => cfd.mouseMove(event));
    expect(countRedraws.mock.calls.length).toBe(1);
  });

  it('should fire redraw event with debounce - click and move', () => {
    const countRedraws = jest.fn();
    cfd.on({ event: 'redraw', counter: 3 }, countRedraws);
    const clickEvent = { button: 0, pageX: 100, pageY: 100 };
    const moveEvents = [
      { button: 0, pageX: 100, pageY: 110 },
      { button: 0, pageX: 100, pageY: 120 },
      { button: 0, pageX: 100, pageY: 130 },
    ];

    cfd.mouseDown(clickEvent);
    moveEvents.forEach(event => cfd.mouseMove(event));
    expect(countRedraws.mock.calls.length).toBe(2);
  });

  it('should try to register for a not allowed event', () => {
    cfd.on({ event: 'jump' }, () => {});
    expect(console.warn).toHaveBeenCalledWith(
      'This event is not allowed: jump'
    );
  });

  it('should set a background color', () => {
    cfd.setBackground([255, 0, 255, 255]);
    const color = getNodeColor(150, 150, cfd);
    expect(color).toEqual([255, 0, 255, 255]);
  });

  it('should set a line width', () => {
    cfd.setLineWidth(10);
    expect(cfd.lineWidth).toBe(10);
  });

  it('should set colors separately', () => {
    cfd.setDrawingColor([255, 0, 255, 255]);
    cfd.configBucketTool({ color: [255, 0, 255, 255], tolerance: 20 });
    expect(cfd.strokeColor).toEqual([255, 0, 255, 255]);
    expect(cfd.bucketToolColor).toEqual([255, 0, 255, 255]);
  });

  it('should set a drawing color', () => {
    cfd.setDrawingColor([255, 0, 255, 255]);
    expect(cfd.strokeColor).toEqual([255, 0, 255, 255]);
    expect(cfd.bucketToolColor).toEqual([255, 0, 255, 255]);
  });

  it('should toggle drawing mode', () => {
    cfd.toggleDrawingMode();
    expect(cfd.canvas.style.cursor).toBe('auto');
    expect(cfd.isDrawingModeEnabled).toBeFalsy();
    cfd.toggleDrawingMode();
    expect(cfd.canvas.style.cursor).toBe('crosshair');
    expect(cfd.isDrawingModeEnabled).toBeTruthy();
  });

  it('should toggle bucket tool', () => {
    cfd.toggleBucketTool();
    expect(cfd.isBucketToolEnabled).toBeTruthy();
    cfd.toggleBucketTool();
    expect(cfd.isBucketToolEnabled).toBeFalsy();
  });

  it('should save, clear and restore canvas', () => {
    const event1 = { button: 0, pageX: 100, pageY: 100 };
    cfd.mouseDown(event1);
    const colorAfterClick = getNodeColor(100, 100, cfd);
    expect(colorAfterClick).toEqual([0, 0, 0, 255]);

    const canvasData = cfd.save();
    cfd.clear();

    const colorAfterClear = getNodeColor(100, 100, cfd);
    expect(colorAfterClear).toEqual([255, 255, 255, 255]);

    cfd.restore(canvasData, () => {
      const colorAfterRestore = getNodeColor(100, 100, cfd);
      expect(colorAfterRestore).toEqual([0, 0, 0, 255]);
    });
  });

  it('should undo and redo a drawing', () => {
    drawPoint({ x: 10, y: 10, color: [255, 0, 0] });
    const color = getNodeColor(10, 10, cfd);
    expect(color).toEqual([255, 0, 0, 255]);

    drawPoint({ x: 50, y: 50, color: [0, 255, 0] });
    const color2 = getNodeColor(50, 50, cfd);
    expect(color2).toEqual([0, 255, 0, 255]);

    cfd.undo();
    const color3 = getNodeColor(50, 50, cfd);
    expect(color3).toEqual([255, 255, 255, 255]);

    cfd.redo();
    const color4 = getNodeColor(50, 50, cfd);
    expect(color4).toEqual([0, 255, 0, 255]);
  });

  it('should receive warnings for undo and redo', () => {
    drawPoint({ x: 10, y: 10, color: [255, 0, 0] });
    drawPoint({ x: 20, y: 20, color: [255, 0, 0] });
    cfd.undo();
    expect(console.warn.mock.calls.length).toBe(0);
    cfd.undo();
    cfd.undo();
    expect(console.warn.mock.calls.length).toBe(1);
    expect(console.warn).toHaveBeenCalledWith('There are no more undos left.');

    console.warn.mockReset();
    cfd.redo();
    expect(console.warn.mock.calls.length).toBe(0);
    cfd.redo();
    cfd.redo();
    expect(console.warn.mock.calls.length).toBe(1);
    expect(console.warn).toHaveBeenCalledWith('There are no more redo left.');
  });
});
