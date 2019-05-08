(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = global || self, factory(global.CanvasFreeDrawing = {}));
}(this, function (exports) { 'use strict';

	function unwrapExports (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var dist = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	var AllowedEvents;
	(function (AllowedEvents) {
	    AllowedEvents["redraw"] = "redraw";
	    AllowedEvents["fill"] = "fill";
	    AllowedEvents["mouseup"] = "mouseup";
	    AllowedEvents["mousedown"] = "mousedown";
	    AllowedEvents["mouseenter"] = "mouseenter";
	    AllowedEvents["mouseleave"] = "mouseleave";
	})(AllowedEvents = exports.AllowedEvents || (exports.AllowedEvents = {}));
	var CanvasFreeDrawing = /** @class */ (function () {
	    function CanvasFreeDrawing(params) {
	        var elementId = params.elementId, width = params.width, height = params.height, _a = params.backgroundColor, backgroundColor = _a === void 0 ? [255, 255, 255] : _a, _b = params.lineWidth, lineWidth = _b === void 0 ? 5 : _b, _c = params.strokeColor, strokeColor = _c === void 0 ? [0, 0, 0] : _c, disabled = params.disabled, _d = params.showWarnings, showWarnings = _d === void 0 ? false : _d, _e = params.maxSnapshots, maxSnapshots = _e === void 0 ? 10 : _e;
	        this.requiredParam(params, 'elementId');
	        this.requiredParam(params, 'width');
	        this.requiredParam(params, 'height');
	        this.elementId = elementId;
	        this.canvasNode = document.getElementById(this.elementId);
	        if (this.canvasNode instanceof HTMLCanvasElement) {
	            this.canvas = this.canvasNode;
	        }
	        else if (this.canvasNode instanceof HTMLElement) {
	            var newCanvas = document.createElement('canvas');
	            this.canvasNode.appendChild(newCanvas);
	            this.canvas = newCanvas;
	        }
	        else {
	            throw new Error("No element found with following id: " + this.elementId);
	        }
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
	        this.strokeColor = this.toValidColor(strokeColor);
	        this.bucketToolColor = this.toValidColor(strokeColor);
	        this.bucketToolTolerance = 0;
	        this.isBucketToolEnabled = false;
	        this.listenersList = [
	            'mouseDown',
	            'mouseMove',
	            'mouseLeave',
	            'mouseUp',
	            'touchStart',
	            'touchMove',
	            'touchEnd',
	        ];
	        this.allowedEvents = this.getAllowedEvents();
	        this.redrawCounter = 0;
	        this.dispatchEventsOnceEvery = 0; // this may become something like: [{event, counter}]
	        // initialize events
	        this.events = {
	            redrawEvent: new Event('cfd_redraw'),
	            fillEvent: new Event('cfd_fill'),
	            mouseUpEvent: new Event('cfd_mouseup'),
	            mouseDownEvent: new Event('cfd_mousedown'),
	            mouseEnterEvent: new Event('cfd_mouseenter'),
	            mouseLeaveEvent: new Event('cfd_mouseleave'),
	            touchStartEvent: new Event('cfd_touchstart'),
	            touchEndEvent: new Event('cfd_touchend'),
	        };
	        this.bindings = {
	            mouseDown: this.mouseDown.bind(this),
	            mouseMove: this.mouseMove.bind(this),
	            mouseLeave: this.mouseLeave.bind(this),
	            mouseUp: this.mouseUp.bind(this),
	            mouseUpDocument: this.mouseUpDocument.bind(this),
	            touchStart: this.touchStart.bind(this),
	            touchMove: this.touchMove.bind(this),
	            touchEnd: this.touchEnd.bind(this),
	        };
	        this.touchIdentifier = undefined;
	        this.previousX = undefined;
	        this.previousY = undefined;
	        this.showWarnings = showWarnings;
	        // cache
	        this.isNodeColorEqualCache = {};
	        this.setDimensions();
	        this.setBackground(backgroundColor);
	        this.storeSnapshot();
	        if (!disabled)
	            this.enableDrawingMode();
	    }
	    CanvasFreeDrawing.prototype.requiredParam = function (object, param) {
	        if (!object || !object[param]) {
	            throw new Error(param + " is required");
	        }
	    };
	    CanvasFreeDrawing.prototype.logWarning = function () {
	        var args = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            args[_i] = arguments[_i];
	        }
	        if (this.showWarnings)
	            console.warn.apply(console, args);
	    };
	    CanvasFreeDrawing.prototype.addListeners = function () {
	        var _this = this;
	        this.listenersList.forEach(function (event) {
	            _this.canvas.addEventListener(event.toLowerCase(), _this.bindings[event]);
	        });
	        document.addEventListener('mouseup', this.bindings.mouseUpDocument);
	    };
	    CanvasFreeDrawing.prototype.removeListeners = function () {
	        var _this = this;
	        this.listenersList.forEach(function (event) {
	            _this.canvas.removeEventListener(event.toLowerCase(), _this.bindings[event]);
	        });
	        document.removeEventListener('mouseup', this.bindings.mouseUpDocument);
	    };
	    CanvasFreeDrawing.prototype.getAllowedEvents = function () {
	        var events = [];
	        for (var event_1 in AllowedEvents) {
	            events.push(event_1);
	        }
	        return events;
	    };
	    CanvasFreeDrawing.prototype.enableDrawingMode = function () {
	        this.isDrawingModeEnabled = true;
	        this.addListeners();
	        this.toggleCursor();
	        return this.isDrawingModeEnabled;
	    };
	    CanvasFreeDrawing.prototype.disableDrawingMode = function () {
	        this.isDrawingModeEnabled = false;
	        this.removeListeners();
	        this.toggleCursor();
	        return this.isDrawingModeEnabled;
	    };
	    CanvasFreeDrawing.prototype.mouseDown = function (event) {
	        if (event.button !== 0)
	            return;
	        var x = event.pageX - this.canvas.offsetLeft;
	        var y = event.pageY - this.canvas.offsetTop;
	        this.drawPoint(x, y);
	    };
	    CanvasFreeDrawing.prototype.mouseMove = function (event) {
	        var x = event.pageX - this.canvas.offsetLeft;
	        var y = event.pageY - this.canvas.offsetTop;
	        this.drawLine(x, y, event);
	    };
	    CanvasFreeDrawing.prototype.touchStart = function (event) {
	        if (event.changedTouches.length > 0) {
	            var _a = event.changedTouches[0], pageX = _a.pageX, pageY = _a.pageY, identifier = _a.identifier;
	            var x = pageX - this.canvas.offsetLeft;
	            var y = pageY - this.canvas.offsetTop;
	            this.touchIdentifier = identifier;
	            this.drawPoint(x, y);
	        }
	    };
	    CanvasFreeDrawing.prototype.touchMove = function (event) {
	        if (event.changedTouches.length > 0) {
	            var _a = event.changedTouches[0], pageX = _a.pageX, pageY = _a.pageY, identifier = _a.identifier;
	            var x = pageX - this.canvas.offsetLeft;
	            var y = pageY - this.canvas.offsetTop;
	            // check if is multi touch, if it is do nothing
	            if (identifier != this.touchIdentifier)
	                return;
	            this.previousX = x;
	            this.previousY = y;
	            this.drawLine(x, y, event);
	        }
	    };
	    CanvasFreeDrawing.prototype.touchEnd = function () {
	        this.handleEndDrawing();
	        this.canvas.dispatchEvent(this.events.touchEndEvent);
	    };
	    CanvasFreeDrawing.prototype.mouseUp = function () {
	        this.handleEndDrawing();
	        this.canvas.dispatchEvent(this.events.mouseUpEvent);
	    };
	    CanvasFreeDrawing.prototype.mouseUpDocument = function () {
	        this.leftCanvasDrawing = false;
	    };
	    CanvasFreeDrawing.prototype.mouseLeave = function () {
	        if (this.isDrawing)
	            this.leftCanvasDrawing = true;
	        this.isDrawing = false;
	        this.canvas.dispatchEvent(this.events.mouseLeaveEvent);
	    };
	    CanvasFreeDrawing.prototype.mouseEnter = function () {
	        this.canvas.dispatchEvent(this.events.mouseEnterEvent);
	    };
	    CanvasFreeDrawing.prototype.handleEndDrawing = function () {
	        this.isDrawing = false;
	        this.storeSnapshot();
	    };
	    CanvasFreeDrawing.prototype.drawPoint = function (x, y) {
	        if (this.isBucketToolEnabled) {
	            this.fill(x, y, this.bucketToolColor, {
	                tolerance: this.bucketToolTolerance,
	            });
	        }
	        else {
	            this.isDrawing = true;
	            this.storeDrawing(x, y, false);
	            this.canvas.dispatchEvent(this.events.mouseDownEvent);
	            this.handleDrawing();
	        }
	    };
	    CanvasFreeDrawing.prototype.drawLine = function (x, y, event) {
	        if (this.leftCanvasDrawing) {
	            this.leftCanvasDrawing = false;
	            if (event instanceof MouseEvent) {
	                this.mouseDown(event);
	            }
	            else if (event instanceof TouchEvent) {
	                this.touchEnd();
	            }
	        }
	        if (this.isDrawing) {
	            this.storeDrawing(x, y, true);
	            this.handleDrawing(this.dispatchEventsOnceEvery);
	        }
	    };
	    CanvasFreeDrawing.prototype.handleDrawing = function (dispatchEventsOnceEvery) {
	        var _this = this;
	        this.context.lineJoin = 'round';
	        var positions = [this.positions.slice().pop()];
	        positions.forEach(function (position) {
	            if (position && position[0] && position[0].strokeColor) {
	                _this.context.strokeStyle = _this.rgbaFromArray(position[0].strokeColor);
	                _this.context.lineWidth = position[0].lineWidth;
	                _this.draw(position);
	            }
	        });
	        if (!dispatchEventsOnceEvery) {
	            this.canvas.dispatchEvent(this.events.redrawEvent);
	        }
	        else if (this.redrawCounter % dispatchEventsOnceEvery === 0) {
	            this.canvas.dispatchEvent(this.events.redrawEvent);
	        }
	        this.undos = [];
	        this.redrawCounter += 1;
	    };
	    CanvasFreeDrawing.prototype.draw = function (position) {
	        var _this = this;
	        position.forEach(function (_a, i) {
	            var x = _a.x, y = _a.y, moving = _a.moving;
	            _this.context.beginPath();
	            if (moving && i) {
	                _this.context.moveTo(position[i - 1]['x'], position[i - 1]['y']);
	            }
	            else {
	                _this.context.moveTo(x - 1, y);
	            }
	            _this.context.lineTo(x, y);
	            _this.context.closePath();
	            _this.context.stroke();
	        });
	    };
	    // https://en.wikipedia.org/wiki/Flood_fill
	    CanvasFreeDrawing.prototype.fill = function (x, y, newColor, _a) {
	        var tolerance = _a.tolerance;
	        newColor = this.toValidColor(newColor);
	        if (this.positions.length === 0 && !this.imageRestored) {
	            this.setBackground(newColor, false);
	            this.canvas.dispatchEvent(this.events.redrawEvent);
	            this.canvas.dispatchEvent(this.events.fillEvent);
	            return;
	        }
	        var pixels = this.width * this.height;
	        var imageData = this.context.getImageData(0, 0, this.width, this.height);
	        var newData = imageData.data;
	        var targetColor = this.getNodeColor(x, y, newData);
	        if (this.isNodeColorEqual(targetColor, newColor, tolerance))
	            return;
	        var queue = [];
	        queue.push([x, y]);
	        while (queue.length) {
	            if (queue.length > pixels)
	                break;
	            var n = queue.pop();
	            var w = n;
	            var e = n;
	            while (this.isNodeColorEqual(this.getNodeColor(w[0] - 1, w[1], newData), targetColor, tolerance)) {
	                w = [w[0] - 1, w[1]];
	            }
	            while (this.isNodeColorEqual(this.getNodeColor(e[0] + 1, e[1], newData), targetColor, tolerance)) {
	                e = [e[0] + 1, e[1]];
	            }
	            var firstNode = w[0];
	            var lastNode = e[0];
	            for (var i = firstNode; i <= lastNode; i++) {
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
	        this.canvas.dispatchEvent(this.events.redrawEvent);
	        this.canvas.dispatchEvent(this.events.fillEvent);
	    };
	    CanvasFreeDrawing.prototype.toValidColor = function (color) {
	        if (Array.isArray(color) && color.length === 4)
	            color.pop();
	        if (Array.isArray(color) && color.length === 3) {
	            var validColor = color.slice();
	            validColor.push(255);
	            return validColor;
	        }
	        else {
	            this.logWarning('Color is not valid!\n' +
	                'It must be an array with RGB values:  [0-255, 0-255, 0-255]');
	            return [0, 0, 0, 255];
	        }
	    };
	    // i = color 1; j = color 2; t = tolerance
	    CanvasFreeDrawing.prototype.isNodeColorEqual = function (i, j, t) {
	        var color1 = '' + i[0] + i[1] + i[2] + i[3];
	        var color2 = '' + j[0] + j[1] + j[2] + j[3];
	        var key = color1 + color2 + t;
	        t = t || 0;
	        if (this.isNodeColorEqualCache.hasOwnProperty(color1 + color2 + t)) {
	            return this.isNodeColorEqualCache[key];
	        }
	        var diffRed = Math.abs(j[0] - i[0]);
	        var diffGreen = Math.abs(j[1] - i[1]);
	        var diffBlue = Math.abs(j[2] - i[2]);
	        var percentDiffRed = diffRed / 255;
	        var percentDiffGreen = diffGreen / 255;
	        var percentDiffBlue = diffBlue / 255;
	        var percentDiff = ((percentDiffRed + percentDiffGreen + percentDiffBlue) / 3) * 100;
	        var result = t >= percentDiff;
	        this.isNodeColorEqualCache[key] = result;
	        return result;
	    };
	    CanvasFreeDrawing.prototype.getNodeColor = function (x, y, data) {
	        var i = (x + y * this.width) * 4;
	        return [data[i], data[i + 1], data[i + 2], data[i + 3]];
	    };
	    CanvasFreeDrawing.prototype.setNodeColor = function (x, y, color, data) {
	        var i = (x + y * this.width) * 4;
	        data[i] = color[0];
	        data[i + 1] = color[1];
	        data[i + 2] = color[2];
	        data[i + 3] = color[3];
	    };
	    CanvasFreeDrawing.prototype.rgbaFromArray = function (a) {
	        return "rgba(" + a[0] + "," + a[1] + "," + a[2] + "," + a[3] + ")";
	    };
	    CanvasFreeDrawing.prototype.setDimensions = function () {
	        this.canvas.height = this.height;
	        this.canvas.width = this.width;
	    };
	    CanvasFreeDrawing.prototype.toggleCursor = function () {
	        this.canvas.style.cursor = this.isDrawingModeEnabled ? 'crosshair' : 'auto';
	    };
	    CanvasFreeDrawing.prototype.storeDrawing = function (x, y, moving) {
	        if (moving) {
	            var lastIndex = this.positions.length - 1;
	            this.positions[lastIndex].push({
	                x: x,
	                y: y,
	                moving: moving,
	                lineWidth: this.lineWidth,
	                strokeColor: this.strokeColor,
	                isBucket: false,
	            });
	        }
	        else {
	            this.positions.push([
	                {
	                    x: x,
	                    y: y,
	                    isBucket: false,
	                    moving: moving,
	                    lineWidth: this.lineWidth,
	                    strokeColor: this.strokeColor,
	                },
	            ]);
	        }
	    };
	    CanvasFreeDrawing.prototype.storeSnapshot = function () {
	        var imageData = this.getCanvasSnapshot();
	        this.snapshots.push(imageData);
	        if (this.snapshots.length > this.maxSnapshots) {
	            this.snapshots = this.snapshots.splice(-Math.abs(this.maxSnapshots));
	        }
	    };
	    CanvasFreeDrawing.prototype.getCanvasSnapshot = function () {
	        return this.context.getImageData(0, 0, this.width, this.height);
	    };
	    CanvasFreeDrawing.prototype.restoreCanvasSnapshot = function (imageData) {
	        this.context.putImageData(imageData, 0, 0);
	    };
	    // Public APIs
	    CanvasFreeDrawing.prototype.on = function (params, callback) {
	        var event = params.event, counter = params.counter;
	        this.requiredParam(params, 'event');
	        if (this.allowedEvents.includes(event)) {
	            if (event === 'redraw' && counter && Number.isInteger(counter)) {
	                this.dispatchEventsOnceEvery = counter;
	            }
	            this.canvas.addEventListener('cfd_' + event, function () { return callback(); });
	        }
	        else {
	            this.logWarning("This event is not allowed: " + event);
	        }
	    };
	    CanvasFreeDrawing.prototype.setLineWidth = function (px) {
	        this.lineWidth = px;
	    };
	    CanvasFreeDrawing.prototype.setBackground = function (color, save) {
	        if (save === void 0) { save = true; }
	        var validColor = this.toValidColor(color);
	        if (validColor) {
	            if (save)
	                this.backgroundColor = validColor;
	            this.context.fillStyle = this.rgbaFromArray(validColor);
	            this.context.fillRect(0, 0, this.width, this.height);
	        }
	    };
	    CanvasFreeDrawing.prototype.setDrawingColor = function (color) {
	        this.configBucketTool({ color: color });
	        this.setStrokeColor(color);
	    };
	    CanvasFreeDrawing.prototype.setStrokeColor = function (color) {
	        this.strokeColor = this.toValidColor(color);
	    };
	    CanvasFreeDrawing.prototype.configBucketTool = function (params) {
	        var _a = params.color, color = _a === void 0 ? null : _a, _b = params.tolerance, tolerance = _b === void 0 ? null : _b;
	        if (color)
	            this.bucketToolColor = this.toValidColor(color);
	        if (tolerance && tolerance > 0) {
	            this.bucketToolTolerance = tolerance > 100 ? 100 : tolerance;
	        }
	    };
	    CanvasFreeDrawing.prototype.toggleBucketTool = function () {
	        return (this.isBucketToolEnabled = !this.isBucketToolEnabled);
	    };
	    CanvasFreeDrawing.prototype.toggleDrawingMode = function () {
	        return this.isDrawingModeEnabled
	            ? this.disableDrawingMode()
	            : this.enableDrawingMode();
	    };
	    CanvasFreeDrawing.prototype.clear = function () {
	        this.context.clearRect(0, 0, this.width, this.height);
	        this.positions = [];
	        this.imageRestored = false;
	        if (this.backgroundColor)
	            this.setBackground(this.backgroundColor);
	        this.handleEndDrawing();
	    };
	    CanvasFreeDrawing.prototype.save = function () {
	        return this.canvas.toDataURL();
	    };
	    CanvasFreeDrawing.prototype.restore = function (backup, callback) {
	        var _this = this;
	        var image = new Image();
	        image.src = backup;
	        image.onload = function () {
	            _this.imageRestored = true;
	            _this.context.drawImage(image, 0, 0);
	            if (typeof callback === 'function')
	                callback();
	        };
	    };
	    CanvasFreeDrawing.prototype.undo = function () {
	        var lastSnapshot = this.snapshots[this.snapshots.length - 1];
	        var goToSnapshot = this.snapshots[this.snapshots.length - 2];
	        if (goToSnapshot) {
	            this.restoreCanvasSnapshot(goToSnapshot);
	            this.snapshots.pop();
	            this.undos.push(lastSnapshot);
	            this.undos = this.undos.splice(-Math.abs(this.maxSnapshots));
	            this.imageRestored = true;
	        }
	        else {
	            this.logWarning('There are no more undos left.');
	        }
	    };
	    CanvasFreeDrawing.prototype.redo = function () {
	        if (this.undos.length > 0) {
	            var lastUndo = this.undos.pop();
	            if (lastUndo) {
	                this.restoreCanvasSnapshot(lastUndo);
	                this.snapshots.push(lastUndo);
	                this.snapshots = this.snapshots.splice(-Math.abs(this.maxSnapshots));
	            }
	        }
	        else {
	            this.logWarning('There are no more redo left.');
	        }
	    };
	    return CanvasFreeDrawing;
	}());
	exports.default = CanvasFreeDrawing;
	});

	var index = unwrapExports(dist);
	var dist_1 = dist.AllowedEvents;

	exports.AllowedEvents = dist_1;
	exports.default = index;

	Object.defineProperty(exports, '__esModule', { value: true });

}));
