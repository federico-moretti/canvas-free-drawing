# Canvas Free Drawing

Simple and straightforward package that allows you to free draw on a canvas html element.

You can try it [here](https://federicomoretti.dev/canvas-free-drawing)!

## Latest Update

**Complete rewrite in Typescript**, even though there are no API changes, I choose to do a major version bump.

## Features

- Lightweight (~11KB minified)
- Simplify canvas APIs
- Bucket tool
- Events (draw, fill, etc. )
- Touch support
- Undo and redo

## Installing

Import as a module

```bash
npm install --save canvas-free-drawing
# or
yarn add canvas-free-drawing
```

or directly in the html:

```html
<script src="canvas-free-drawing.min.js"></script>
```

## Example

Basic usage:

```html
<canvas id="cfd"></canvas>

<script>
  // initialize
  const cfd = new CanvasFreeDrawing({
    elementId: 'cfd',
    width: 500,
    height: 500,
  });

  // set properties
  cfd.setLineWidth(10); // in px
  cfd.setStrokeColor([0, 0, 255]); // in RGB

  // listen to events
  cfd.on({ event: 'redraw' }, () => {
    // code...
  });
</script>
```

## API

#### `new CanvasFreeDrawing(params: object)`

Initialize the module.

| Parameter       | Type                                 | Description                   |
| --------------- | ------------------------------------ | ----------------------------- |
| **width**       | number                               | canvas width                  |
| **elementId**   | string                               | html element id               |
| **height**      | number                               | canvas height                 |
| lineWidth       | number (default: 5)                  | canvas line width             |
| strokeColor     | number[3] (default: [0, 0, 0])       | canvas stroke color           |
| backgroundColor | number[3] (default: [255, 255, 255]) | canvas background color       |
| disabled        | boolean (default: false)             | disable the ability to draw   |
| showWarnings    | boolean (default: false)             | enable warning in the console |
| maxSnapshots    | number (default: 10)                 | max number of "undos"         |

#### `setLineWidth(pixels: number): void`

Set line width.

#### `setStrokeColor(color: number[3]): void`

Set line color.

#### `setDrawingColor(color: number[3]): void`

Set both bucket tool color and line color.

#### `setBackground(color: number[3], save?: boolean (default: true)): void`

Set background color, if true then it will be used as background in next `clear()`.

#### `toggleDrawingMode(): boolean`

Toggle drawing mode, returns its state.

You can also use `enableDrawingMode()` and `disableDrawingMode()`.

#### `#isDrawingModeEnabled: boolean`

Property to check if drawing mode is enabled

#### `configBucketTool(params: { color?: number[3], tolerance?: number }): void`

Set bucket tool parameters, tolerance is from 0 to 100.

#### `toggleBucketTool(): boolean`

Toggle bucket tool, returns its state.

#### `#isBucketToolEnabled: boolean`

Property to check if bucket tool is enabled.

#### `clear(): void`

Clear the canvas.

#### `save(): string`

Save the canvas as base64 and returns a string - this method uses the native method toDataURL().

#### `restore(data: string, callback: () => void): void`

Restore the canvas from the string previously saved.

#### `undo(): void`

Undo last action on the canvas.

You can define the maximum undo and redo allowed with `maxSnapshots` in the initialization.

#### `redo(): void`

Redo last action on the canvas

### Notes

Colors must be set with an array with RGB values: [0-255, 0-255, 0-255].

### Events

Subscribe to an event emitter, the callback will be called when the event gets called.

#### `on(params: { event: AllowedEvents, counter?: number }, callback: () => void): void`

```ts
enum AllowedEvents {
  redraw,
  fill,
  mouseup,
  mousedown,
  mouseenter,
  mouseleave,
}
```

`counter` will debounce the events (only `redraw` at the moment), once every n times based on `counter` the event will trigger.

```js
// this will be triggered once every 10 times the canvas actually redraw
cfd.on({ event: 'redraw', counter: 10 }, () => {
  // code...
});
```

## Licence

[MIT](LICENSE) © [Federico Moretti](https://fmoretti.com)
