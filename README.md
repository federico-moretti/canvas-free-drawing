# Canvas Free Drawing

Simple and straightforward package that allows you to free draw on a canvas html element.

You can try it [here](https://fmoretti.com/canvas-free-drawing)!

## Features

- Lightweight (~6KB minified)
- Simplify canvas APIs
- Bucket tool
- Events

## Installing

Using npm:

```bash
npm install canvas-free-drawing
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
  // initialize
  const cfd = new CanvasFreeDrawing({ elementId: 'cfd', width: 500, height: 500 });

  // set properties
  cfd.setLineWidth(10); // in px
  cfd.setStrokeColor([0, 0, 255]); // in RGB

  // listen to events
  cfd.on({ event: 'redraw' }, () => {
    console.log('canvas did redraw');
  });
</script>
```

## API

#### `new CanvasFreeDrawing(params: object)`

Initialize the module.

- **elementId**: string
- **width**: integer
- **height**: integer
- lineWidth: integer
- strokeColor: array(3)
- backgroundColor: array(3)

#### `setLineWidth(pixels: integer)`

Set line width

#### `setStrokeColor(color: array(3))`

Set line color

#### `setDrawingColor(color: array(3))`

Set both bucket tool color and line color

#### `setBackground(color: array(3))`

Set background color

#### `toggleDrawingMode(): boolean`

Toggle drawing mode, which allows to draw on the canvas. Returns the state

You can also use `enableDrawingMode()` and `disableDrawingMode()`.

#### `isDrawingModeEnabled: boolean`

Check if drawing mode is enabled

#### `configBucketTool(params: object)`

Set bucket tool parameters.

- color: array(3)
- tolerance: integer

#### `toggleBucketTool(): boolean`

Toggle bucket tool. Returns the state

#### `isBucketToolEnabled: boolean`

Check if bucket tool is enabled

#### `clear()`

Clear the canvas

#### `save(): string`

Save the canvas as base64 and returns a string - this method uses the native method toDataURL()

#### `restore(data: string)`

Restore the canvas from the string previously saved

### Notes

Colors must be set with an array with RGB values: [0-255, 0-255, 0-255].

### Events

Subscribe to an event emitter, the callback will be called when the event gets called.

These are the events allowed:

- redraw
- mouseup
- mousedown
- mouseenter
- mouseleave

Some events (only `redraw` at the moment) also allow you to set a timeout counter so that the event will trigger instead of everytime, once every 10 times for example.

#### `on(params: object, callback)`

- **event**: string
- counter: integer

```js
cfd.on({ event: 'redraw', counter: 10 }, () => {
  console.log('Canvas did redraw!');
});
```

## Licence

[MIT](LICENSE) © [Federico Moretti](https://fmoretti.com)
