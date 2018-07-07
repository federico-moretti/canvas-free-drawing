// import config, override format option
// rollup --config rollup.config.js -f umd
// rollup.config.js

import babel from 'rollup-plugin-babel';

export default {
  entry: 'src/index.js',
  output: {
    file: 'dist/canvas-free-drawing.js',
    format: 'umd',
    name: 'CanvasFreeDrawing',
  },
  plugins: [babel()],
  sourceMap: true,
};
