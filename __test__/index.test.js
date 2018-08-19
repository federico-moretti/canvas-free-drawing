import CanvasFreeDrawing from '../src/index';

// function for test purposes
function getNodeColor(x, y, cfd) {
  const imageData = cfd.context.getImageData(0, 0, cfd.width, cfd.height);
  const data = imageData.data;
  return cfd.getNodeColor(x, y, data);
}

global.console = {
  warn: jest.fn(),
  log: jest.fn(),
};

describe('CanvasFreeDrawing', () => {
  const id = 'cfd';
  document.body.innerHTML = `<canvas id="${id}"></canvas>`;
  let cfd = new CanvasFreeDrawing({ elementId: id, width: 500, height: 500 });

  beforeEach(() => {
    // Set up our document body
    document.body.innerHTML = '<canvas id="cfd"></canvas>';
    cfd = new CanvasFreeDrawing({ elementId: id, width: 500, height: 500 });
  });

  it('error if missing parameters', () => {
    expect(() => {
      cfd = new CanvasFreeDrawing({ width: 500, height: 500 });
    }).toThrow('elementId is required');
  });

  it('check node color equality', () => {
    const node1 = [0, 0, 0];
    const node2 = [10, 10, 10];
    const node3 = [12, 12, 12];
    expect(cfd.isNodeColorEqual(node1, node1)).toBeTruthy();
    expect(cfd.isNodeColorEqual(node1, node2)).toBeFalsy();
    expect(cfd.isNodeColorEqual(node2, node3, 2)).toBeTruthy(); // with tolerance
  });

  it('set initial correct background color', () => {
    cfd = new CanvasFreeDrawing({ elementId: id, width: 500, height: 500, backgroundColor: [255, 255, 255] });
    const color = getNodeColor(250, 250, cfd);
    expect(color).toEqual([255, 255, 255, 255]);
  });

  it('mouse leaves canvas drawing', () => {
    const event1 = { button: 0, pageX: 100, pageY: 100 };
    const event2 = { button: 0, pageX: 500, pageY: 100 };
    cfd.mouseDown(event1);
    cfd.mouseMove(event2);
    cfd.mouseLeave();

    expect(cfd.isDrawing).toBeFalsy();
    expect(cfd.leftCanvasDrawing).toBeTruthy();
  });

  it('use floodfill', done => {
    const event1 = { button: 0, pageX: 100, pageY: 100 };
    const event2 = { button: 0, pageX: 300, pageY: 100 };
    const event3 = { button: 0, pageX: 300, pageY: 300 };
    const event4 = { button: 0, pageX: 100, pageY: 300 };
    const event5 = { button: 0, pageX: 100, pageY: 100 };
    cfd.mouseDown(event1);
    cfd.mouseMove(event2);
    cfd.mouseMove(event3);
    cfd.mouseMove(event4);
    cfd.mouseMove(event5);

    cfd.fill(150, 150, [255, 0, 255], false, () => {
      const colorLine = getNodeColor(100, 100, cfd);
      const colorFill = getNodeColor(150, 150, cfd);
      expect(colorLine).toEqual([0, 0, 0, 255]); // check lines
      expect(colorFill).toEqual([255, 0, 255, 255]); // check fill
      done();
    });
  });

  it('use floodfill with tolerance', done => {
    const event1 = { button: 0, pageX: 100, pageY: 100 };
    const event2 = { button: 0, pageX: 300, pageY: 100 };
    const event3 = { button: 0, pageX: 300, pageY: 300 };
    const event4 = { button: 0, pageX: 100, pageY: 300 };
    const event5 = { button: 0, pageX: 100, pageY: 100 };
    cfd.mouseDown(event1);
    cfd.mouseMove(event2);
    cfd.mouseMove(event3);
    cfd.mouseMove(event4);
    cfd.mouseMove(event5);

    cfd.fill(150, 150, [255, 0, 255], 50, () => {
      const colorLine = getNodeColor(100, 100, cfd);
      const colorFill = getNodeColor(150, 150, cfd);
      expect(colorLine).toEqual([0, 0, 0, 255]); // check lines
      expect(colorFill).toEqual([255, 0, 255, 255]); // check fill
      done();
    });
  });

  it('draw a red point', () => {
    const event = { button: 0, pageX: 10, pageY: 10 };
    cfd.setDrawingColor([255, 0, 0]);
    cfd.mouseDown(event);
    cfd.mouseUp();

    const color = getNodeColor(10, 10, cfd);
    expect(cfd.positions[0]).toEqual({ moving: false, x: 10, y: 10 });
    expect(color).toEqual([255, 0, 0, 255]);
  });

  it('draw a red point with touch', () => {
    const event = { changedTouches: [{ pageX: 10, pageY: 10 }] };
    cfd.setDrawingColor([255, 0, 0]);
    cfd.touchStart(event);
    cfd.touchEnd();

    const color = getNodeColor(10, 10, cfd);
    expect(cfd.positions[0]).toEqual({ moving: false, x: 10, y: 10 });
    expect(color).toEqual([255, 0, 0, 255]);
  });

  it('draw a black line', () => {
    const event1 = { button: 0, pageX: 10, pageY: 10 };
    const event2 = { button: 0, pageX: 15, pageY: 15 };
    cfd.mouseDown(event1);
    cfd.mouseMove(event2);
    cfd.mouseUp();

    const color = getNodeColor(15, 15, cfd);
    expect(cfd.positions[0]).toEqual({ moving: false, x: 10, y: 10 });
    expect(cfd.positions[1]).toEqual({ moving: true, x: 15, y: 15 });
    expect(color).toEqual([0, 0, 0, 255]);
  });

  it('draw a black line with touch', () => {
    const event1 = { changedTouches: [{ pageX: 10, pageY: 10 }] };
    const event2 = { changedTouches: [{ pageX: 15, pageY: 15 }] };
    cfd.touchStart(event1);
    cfd.touchMove(event2);
    cfd.touchEnd();

    const color = getNodeColor(15, 15, cfd);
    expect(cfd.positions[0]).toEqual({ moving: false, x: 10, y: 10 });
    expect(cfd.positions[1]).toEqual({ moving: true, x: 15, y: 15 });
    expect(color).toEqual([0, 0, 0, 255]);
  });

  it('register and fire redraw event', done => {
    cfd.on({ event: 'redraw' }, () => done());
    const event1 = { button: 0, pageX: 100, pageY: 100 };
    cfd.mouseDown(event1);
  });

  it('try to register for a not allowed event', () => {
    cfd.on({ event: 'jump' }, () => {});
    expect(global.console.warn).toHaveBeenCalledWith('This event is not allowed: jump');
  });

  it('set background', () => {
    cfd.setBackground([255, 0, 255, 255]);
    const color = getNodeColor(150, 150, cfd);
    expect(color).toEqual([255, 0, 255, 255]);
  });

  it('set line width', () => {
    cfd.setLineWidth(10);
    expect(cfd.lineWidth).toBe(10);
  });

  it('set colors separately', () => {
    cfd.setDrawingColor([255, 0, 255, 255]);
    cfd.configBucketTool({ color: [255, 0, 255, 255] });
    expect(cfd.strokeColor).toEqual([255, 0, 255, 255]);
    expect(cfd.bucketToolColor).toEqual([255, 0, 255, 255]);
  });

  it('set drawing color', () => {
    cfd.setDrawingColor([255, 0, 255, 255]);
    expect(cfd.strokeColor).toEqual([255, 0, 255, 255]);
    expect(cfd.bucketToolColor).toEqual([255, 0, 255, 255]);
  });

  it('toggle drawing mode', () => {
    expect(cfd.canvas.style.cursor).toBe('crosshair');
    expect(cfd.isDrawingModeEnabled).toBeTruthy();
    cfd.toggleDrawingMode();
    expect(cfd.canvas.style.cursor).toBe('auto');
    expect(cfd.isDrawingModeEnabled).toBeFalsy();
  });

  it('toggle bucket tool', () => {
    cfd.toggleBucketTool();
    expect(cfd.isBucketToolEnabled).toBeTruthy();
    cfd.toggleBucketTool();
    expect(cfd.isBucketToolEnabled).toBeFalsy();
  });

  it('save, clear and restore canvas', () => {
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
});
