# Canvas Free Drawing

Simple and straightforward package and APIs that allows you to draw on a canvas html element.

## Features

- Lightweight
- Simple APIs to change line properties
- Bucket tool
- Redraw events

## Installing

Using npm:
```bash
$ npm install canvas-free-drawing
```

Use local file:
```html
<script src="canvas-free-drawing.min.js"></script>
```

## Example

Basic usage:
```html
<canvas id="cfd"></canvas>

<script>
  const cfd = new CanvasFreeDrawing({ elementId: 'cfd', width: 500, height: 500 });
</script>
```

## APIs

```js
// Create new CanvasFreeDrawing instance
// Required params: elementId, width and height
const cfd = new CanvasFreeDrawing({ elementId: 'cfd', width: 500, height: 500 });

// Other APIs

// Set line width in pixel
cfd.setLineWidth(10);

// Colors use the following format [0-255, 0-255, 0-255]
// If you want blue then use should use [0, 0, 255]

// Set stroke color
cfd.setStrokeColor([0, 0, 255]);

// Set canvas background color as 
cfd.setBackground([0, 0, 0]);

// Toggle bucket tool an returns its state
cfd.toggleBucket();

// Check if bucket tool is active
cfd.isBucketActive();

// Clear the canvas and set the last set background or white
cfd.clear();

// Save the canvas as base64 and returns it - uses the native method toDataURL()
const canvasData = cfd.save();

// Restore the canvas previously saved
cfd.restore(canvasData)

// Subscribe to an event emitter, the callback will be called everytime the event will trigger
// Allowed events:
// - 'redraw' -> will be triggered everytime the canvas redraws
cfd.on(event, callback)

```