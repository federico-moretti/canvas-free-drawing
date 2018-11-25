(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.CanvasFreeDrawing = factory());
}(this, (function () { 'use strict';

  function _typeof(obj) {
    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function (obj) {
        return typeof obj;
      };
    } else {
      _typeof = function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }

    return _typeof(obj);
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
  }

  function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

      return arr2;
    }
  }

  function _iterableToArray(iter) {
    if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
  }

  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance");
  }

  var CanvasFreeDrawing =
  /*#__PURE__*/
  function () {
    function CanvasFreeDrawing() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      _classCallCheck(this, CanvasFreeDrawing);

      var _params$elementId = params.elementId,
          elementId = _params$elementId === void 0 ? this.requiredParam('elementId') : _params$elementId,
          _params$width = params.width,
          width = _params$width === void 0 ? this.requiredParam('width') : _params$width,
          _params$height = params.height,
          height = _params$height === void 0 ? this.requiredParam('height') : _params$height,
          _params$backgroundCol = params.backgroundColor,
          backgroundColor = _params$backgroundCol === void 0 ? [255, 255, 255] : _params$backgroundCol,
          _params$lineWidth = params.lineWidth,
          lineWidth = _params$lineWidth === void 0 ? 5 : _params$lineWidth,
          strokeColor = params.strokeColor,
          disabled = params.disabled,
          _params$showWarnings = params.showWarnings,
          showWarnings = _params$showWarnings === void 0 ? false : _params$showWarnings,
          _params$maxSnapshots = params.maxSnapshots,
          maxSnapshots = _params$maxSnapshots === void 0 ? 10 : _params$maxSnapshots;
      this.elementId = elementId;
      this.canvas = document.getElementById(this.elementId);
      this.checkCanvasElement();
      this.context = this.canvas.getContext('2d');
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
      this.strokeColor = this.validateColor(strokeColor, true);
      this.bucketToolColor = this.validateColor(strokeColor, true);
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
      this.touchEndEvent = new Event('cfd_touchend'); // these are needed to remove the listener

      this.mouseDown = this.mouseDown.bind(this);
      this.mouseMove = this.mouseMove.bind(this);
      this.mouseLeave = this.mouseLeave.bind(this);
      this.mouseUp = this.mouseUp.bind(this);
      this.mouseUpDocument = this.mouseUpDocument.bind(this);
      this.touchStart = this.touchStart.bind(this);
      this.touchMove = this.touchMove.bind(this);
      this.touchEnd = this.touchEnd.bind(this);
      this.touchIdentifier = null;
      this.previousX = null;
      this.previousY = null;
      this.showWarnings = showWarnings; // cache

      this.isNodeColorEqualCache = [];
      this.setDimensions();
      this.setBackground(backgroundColor);
      this.storeSnapshot();
      if (!disabled) this.enableDrawingMode();
    }

    _createClass(CanvasFreeDrawing, [{
      key: "requiredParam",
      value: function requiredParam(param) {
        throw new Error("".concat(param, " is required"));
      }
    }, {
      key: "logWarning",
      value: function logWarning() {
        var _console;

        if (this.showWarnings) (_console = console).warn.apply(_console, arguments);
      }
    }, {
      key: "checkCanvasElement",
      value: function checkCanvasElement() {
        if (this.canvas.tagName !== 'CANVAS') {
          var newCanvas = document.createElement('canvas');
          this.canvas.appendChild(newCanvas);
          this.canvas = newCanvas;
        }
      }
    }, {
      key: "addListeners",
      value: function addListeners() {
        var _this = this;

        this.listenersList.forEach(function (event) {
          _this.canvas.addEventListener(event.toLowerCase(), _this[event]);
        });
        document.addEventListener('mouseup', this.mouseUpDocument);
      }
    }, {
      key: "removeListeners",
      value: function removeListeners() {
        var _this2 = this;

        this.listenersList.forEach(function (event) {
          _this2.canvas.removeEventListener(event.toLowerCase(), _this2[event]);
        });
        document.removeEventListener('mouseup', this.mouseUpDocument);
      }
    }, {
      key: "enableDrawingMode",
      value: function enableDrawingMode() {
        this.isDrawingModeEnabled = true;
        this.addListeners();
        this.toggleCursor();
        return this.isDrawingModeEnabled;
      }
    }, {
      key: "disableDrawingMode",
      value: function disableDrawingMode() {
        this.isDrawingModeEnabled = false;
        this.removeListeners();
        this.toggleCursor();
        return this.isDrawingModeEnabled;
      }
    }, {
      key: "mouseDown",
      value: function mouseDown(event) {
        if (event.button !== 0) return;
        var x = event.pageX - this.canvas.offsetLeft;
        var y = event.pageY - this.canvas.offsetTop;
        return this.drawPoint(x, y);
      }
    }, {
      key: "mouseMove",
      value: function mouseMove(event) {
        var x = event.pageX - this.canvas.offsetLeft;
        var y = event.pageY - this.canvas.offsetTop;
        this.drawLine(x, y);
      }
    }, {
      key: "touchStart",
      value: function touchStart(event) {
        if (event.changedTouches.length > 0) {
          var _event$changedTouches = event.changedTouches[0],
              pageX = _event$changedTouches.pageX,
              pageY = _event$changedTouches.pageY,
              identifier = _event$changedTouches.identifier;
          var x = pageX - this.canvas.offsetLeft;
          var y = pageY - this.canvas.offsetTop;
          this.touchIdentifier = identifier;
          return this.drawPoint(x, y);
        }
      }
    }, {
      key: "touchMove",
      value: function touchMove(event) {
        if (event.changedTouches.length > 0) {
          var _event$changedTouches2 = event.changedTouches[0],
              pageX = _event$changedTouches2.pageX,
              pageY = _event$changedTouches2.pageY,
              identifier = _event$changedTouches2.identifier;
          var x = pageX - this.canvas.offsetLeft;
          var y = pageY - this.canvas.offsetTop; // check if is multi touch, if it is do nothing

          if (identifier != this.touchIdentifier) return;
          this.previousX = x;
          this.previousY = y;
          this.drawLine(x, y);
        }
      }
    }, {
      key: "touchEnd",
      value: function touchEnd() {
        this.handleEndDrawing();
        this.canvas.dispatchEvent(this.touchEndEvent);
      }
    }, {
      key: "mouseUp",
      value: function mouseUp() {
        this.handleEndDrawing();
        this.canvas.dispatchEvent(this.mouseUpEvent);
      }
    }, {
      key: "mouseUpDocument",
      value: function mouseUpDocument() {
        this.leftCanvasDrawing = false;
      }
    }, {
      key: "mouseLeave",
      value: function mouseLeave() {
        if (this.isDrawing) this.leftCanvasDrawing = true;
        this.isDrawing = false;
        this.canvas.dispatchEvent(this.mouseLeaveEvent);
      }
    }, {
      key: "mouseEnter",
      value: function mouseEnter() {
        this.canvas.dispatchEvent(this.mouseEnterEvent);
      }
    }, {
      key: "handleEndDrawing",
      value: function handleEndDrawing() {
        this.isDrawing = false;
        this.storeSnapshot();
      }
    }, {
      key: "drawPoint",
      value: function drawPoint(x, y) {
        if (this.isBucketToolEnabled) {
          return this.fill(x, y, this.bucketToolColor, {
            tolerance: this.bucketToolTolerance
          });
        }

        this.isDrawing = true;
        this.storeDrawing(x, y, false);
        this.canvas.dispatchEvent(this.mouseDownEvent);
        this.handleDrawing();
      }
    }, {
      key: "drawLine",
      value: function drawLine(x, y) {
        if (this.leftCanvasDrawing) {
          this.leftCanvasDrawing = false;
          this.mouseDown(event);
        }

        if (this.isDrawing) {
          this.storeDrawing(x, y, true);
          this.handleDrawing({
            dispatchEventsOnceEvery: this.dispatchEventsOnceEvery
          });
        }
      }
    }, {
      key: "handleDrawing",
      value: function handleDrawing() {
        var _this3 = this;

        var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            dispatchEventsOnceEvery = _ref.dispatchEventsOnceEvery;

        this.context.lineJoin = 'round';
        var positions = [_toConsumableArray(this.positions).pop()];
        positions.forEach(function (position) {
          _this3.context.strokeStyle = _this3.rgbaFromArray(position[0].strokeColor);
          _this3.context.lineWidth = position[0].lineWidth;

          _this3.draw(position);
        });

        if (!dispatchEventsOnceEvery) {
          this.canvas.dispatchEvent(this.redrawEvent);
        } else if (this.redrawCounter % dispatchEventsOnceEvery === 0) {
          this.canvas.dispatchEvent(this.redrawEvent);
        }

        this.undos = [];
        this.redrawCounter += 1;
      }
    }, {
      key: "draw",
      value: function draw(position) {
        var _this4 = this;

        position.forEach(function (_ref2, i) {
          var x = _ref2.x,
              y = _ref2.y,
              moving = _ref2.moving;

          _this4.context.beginPath();

          if (moving && i) {
            _this4.context.moveTo(position[i - 1]['x'], position[i - 1]['y']);
          } else {
            _this4.context.moveTo(x - 1, y);
          }

          _this4.context.lineTo(x, y);

          _this4.context.closePath();

          _this4.context.stroke();
        });
      } // https://en.wikipedia.org/wiki/Flood_fill

    }, {
      key: "fill",
      value: function fill(x, y, newColor, _ref3) {
        var _this5 = this;

        var tolerance = _ref3.tolerance,
            _ref3$storeInPosition = _ref3.storeInPosition,
            storeInPosition = _ref3$storeInPosition === void 0 ? true : _ref3$storeInPosition;
        return new Promise(function (resolve) {
          newColor = _this5.validateColor(newColor);

          if (_this5.positions.length === 0 && !_this5.imageRestored) {
            _this5.setBackground(newColor, false);

            _this5.canvas.dispatchEvent(_this5.redrawEvent);

            return;
          }

          var imageData = _this5.context.getImageData(0, 0, _this5.width, _this5.height);

          var newData = imageData.data;

          var targetColor = _this5.getNodeColor(x, y, newData);

          if (_this5.isNodeColorEqual(targetColor, newColor, tolerance)) return;
          var queue = [];
          queue.push([x, y]);

          while (queue.length) {
            if (queue.length > _this5.width * _this5.height) break;
            var n = queue.pop();
            var w = n;
            var e = n;

            while (_this5.isNodeColorEqual(_this5.getNodeColor(w[0] - 1, w[1], newData), targetColor, tolerance)) {
              w = [w[0] - 1, w[1]];
            }

            while (_this5.isNodeColorEqual(_this5.getNodeColor(e[0] + 1, e[1], newData), targetColor, tolerance)) {
              e = [e[0] + 1, e[1]];
            }

            var firstNode = w[0];
            var lastNode = e[0];

            for (var i = firstNode; i <= lastNode; i++) {
              _this5.setNodeColor(i, w[1], newColor, newData);

              if (_this5.isNodeColorEqual(_this5.getNodeColor(i, w[1] + 1, newData), targetColor, tolerance)) {
                queue.push([i, w[1] + 1]);
              }

              if (_this5.isNodeColorEqual(_this5.getNodeColor(i, w[1] - 1, newData), targetColor, tolerance)) {
                queue.push([i, w[1] - 1]);
              }
            }
          }

          _this5.context.putImageData(imageData, 0, 0);

          _this5.canvas.dispatchEvent(_this5.redrawEvent);

          if (storeInPosition) {
            _this5.positions.push({
              isBucket: true,
              x: x,
              y: y,
              newColor: newColor,
              tolerance: tolerance
            });
          }

          resolve(true);
        });
      }
    }, {
      key: "validateColor",
      value: function validateColor(color, placeholder) {
        if (_typeof(color) === 'object' && color.length === 4) color.pop();

        if (_typeof(color) === 'object' && color.length === 3) {
          var validColor = _toConsumableArray(color);

          validColor.push(255);
          return validColor;
        } else if (placeholder) {
          return [0, 0, 0, 255];
        }

        this.logWarning('Color is not valid! It must be an array with RGB values:  [0-255, 0-255, 0-255]');
        return null;
      } // i = color 1; j = color 2; t = tolerance

    }, {
      key: "isNodeColorEqual",
      value: function isNodeColorEqual(i, j, t) {
        // const color1 = JSON.stringify(i);
        // const color2 = JSON.stringify(j);
        var color1 = '' + i[0] + i[1] + i[2] + i[3];
        var color2 = '' + j[0] + j[1] + j[2] + j[3];
        t = t || 0;

        if (this.isNodeColorEqualCache.hasOwnProperty(color1 + color2 + t)) {
          return this.isNodeColorEqualCache[color1 + color2 + t];
        }

        var diffRed = Math.abs(j[0] - i[0]);
        var diffGreen = Math.abs(j[1] - i[1]);
        var diffBlue = Math.abs(j[2] - i[2]);
        var percentDiffRed = diffRed / 255;
        var percentDiffGreen = diffGreen / 255;
        var percentDiffBlue = diffBlue / 255;
        var percentDiff = (percentDiffRed + percentDiffGreen + percentDiffBlue) / 3 * 100;
        var result = t >= percentDiff;
        this.isNodeColorEqualCache[color1 + color2 + t] = result;
        return result;
      }
    }, {
      key: "getNodeColor",
      value: function getNodeColor(x, y, data) {
        var i = (x + y * this.width) * 4;
        return [data[i], data[i + 1], data[i + 2], data[i + 3]];
      }
    }, {
      key: "setNodeColor",
      value: function setNodeColor(x, y, color, data) {
        var i = (x + y * this.width) * 4;
        data[i] = color[0];
        data[i + 1] = color[1];
        data[i + 2] = color[2];
        data[i + 3] = color[3];
      }
    }, {
      key: "rgbaFromArray",
      value: function rgbaFromArray(a) {
        return "rgba(".concat(a[0], ",").concat(a[1], ",").concat(a[2], ",").concat(a[3], ")");
      }
    }, {
      key: "setDimensions",
      value: function setDimensions() {
        this.canvas.height = this.height;
        this.canvas.width = this.width;
      }
    }, {
      key: "toggleCursor",
      value: function toggleCursor() {
        this.canvas.style.cursor = this.isDrawingModeEnabled ? 'crosshair' : 'auto';
      }
    }, {
      key: "storeDrawing",
      value: function storeDrawing(x, y, moving) {
        if (moving) {
          this.positions[this.positions.length - 1].push({
            x: x,
            y: y,
            moving: moving,
            lineWidth: this.lineWidth,
            strokeColor: this.strokeColor
          });
        } else {
          this.positions.push([{
            x: x,
            y: y,
            moving: moving,
            lineWidth: this.lineWidth,
            strokeColor: this.strokeColor
          }]);
        }
      }
    }, {
      key: "storeSnapshot",
      value: function storeSnapshot() {
        var _this6 = this;

        new Promise(function (resolve) {
          var imageData = _this6.getCanvasSnapshot();

          _this6.snapshots.push(imageData);

          if (_this6.snapshots.length > _this6.maxSnapshots) {
            _this6.snapshots = _this6.snapshots.splice(-Math.abs(_this6.maxSnapshots));
          }

          resolve();
        });
      }
    }, {
      key: "getCanvasSnapshot",
      value: function getCanvasSnapshot() {
        return this.context.getImageData(0, 0, this.width, this.height);
      }
    }, {
      key: "restoreCanvasSnapshot",
      value: function restoreCanvasSnapshot(imageData) {
        this.context.putImageData(imageData, 0, 0);
      } // Public APIs

    }, {
      key: "on",
      value: function on(params, callback) {
        var _params$event = params.event,
            event = _params$event === void 0 ? this.requiredParam('event') : _params$event,
            counter = params.counter;

        if (this.allowedEvents.includes(event)) {
          if (event === 'redraw' && Number.isInteger(counter)) {
            this.dispatchEventsOnceEvery = parseInt(counter);
          }

          this.canvas.addEventListener('cfd_' + event, function () {
            return callback();
          });
        } else {
          this.logWarning("This event is not allowed: ".concat(event));
        }
      }
    }, {
      key: "setLineWidth",
      value: function setLineWidth(px) {
        this.lineWidth = px;
      }
    }, {
      key: "setBackground",
      value: function setBackground(color) {
        var save = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
        var validColor = this.validateColor(color);

        if (validColor) {
          if (save) this.backgroundColor = validColor;
          this.context.fillStyle = this.rgbaFromArray(validColor);
          this.context.fillRect(0, 0, this.width, this.height);
        }
      }
    }, {
      key: "setDrawingColor",
      value: function setDrawingColor(color) {
        this.configBucketTool({
          color: color
        });
        this.setStrokeColor(color);
      }
    }, {
      key: "setStrokeColor",
      value: function setStrokeColor(color) {
        this.strokeColor = this.validateColor(color, true);
      }
    }, {
      key: "configBucketTool",
      value: function configBucketTool(params) {
        var _params$color = params.color,
            color = _params$color === void 0 ? null : _params$color,
            _params$tolerance = params.tolerance,
            tolerance = _params$tolerance === void 0 ? null : _params$tolerance;
        if (color) this.bucketToolColor = this.validateColor(color);

        if (tolerance && tolerance > 0) {
          this.bucketToolTolerance = tolerance > 100 ? 100 : tolerance;
        }
      }
    }, {
      key: "toggleBucketTool",
      value: function toggleBucketTool() {
        return this.isBucketToolEnabled = !this.isBucketToolEnabled;
      }
    }, {
      key: "isBucketToolEnabled",
      value: function isBucketToolEnabled() {
        return this.isBucketToolEnabled;
      }
    }, {
      key: "toggleDrawingMode",
      value: function toggleDrawingMode() {
        return this.isDrawingModeEnabled ? this.disableDrawingMode() : this.enableDrawingMode();
      }
    }, {
      key: "isDrawingModeEnabled",
      value: function isDrawingModeEnabled() {
        return this.isDrawingModeEnabled;
      }
    }, {
      key: "clear",
      value: function clear() {
        this.context.clearRect(0, 0, this.width, this.height);
        this.lastPath = [];
        this.positions = [];
        this.setBackground(this.backgroundColor);
        this.handleEndDrawing();
      }
    }, {
      key: "save",
      value: function save() {
        return this.canvas.toDataURL();
      }
    }, {
      key: "restore",
      value: function restore(backup, callback) {
        var _this7 = this;

        var image = new Image();
        image.src = backup;

        image.onload = function () {
          _this7.imageRestored = true;

          _this7.context.drawImage(image, 0, 0);

          if (typeof callback === 'function') callback();
        };
      }
    }, {
      key: "undo",
      value: function undo() {
        var lastSnapshot = this.snapshots[this.snapshots.length - 1];
        var goToSnapshot = this.snapshots[this.snapshots.length - 2];

        if (goToSnapshot) {
          this.restoreCanvasSnapshot(goToSnapshot);
          this.snapshots.pop();
          this.undos.push(lastSnapshot);
          this.undos = this.undos.splice(-Math.abs(this.maxSnapshots));
        } else {
          this.logWarning('There are no more undos left.');
        }
      }
    }, {
      key: "redo",
      value: function redo() {
        if (this.undos.length > 0) {
          var lastUndo = this.undos.pop();
          this.restoreCanvasSnapshot(lastUndo);
          this.snapshots.push(lastUndo);
          this.snapshots = this.snapshots.splice(-Math.abs(this.maxSnapshots));
        } else {
          this.logWarning('There are no more redo left.');
        }
      }
    }]);

    return CanvasFreeDrawing;
  }();

  return CanvasFreeDrawing;

})));
//# sourceMappingURL=canvas-free-drawing.js.map
