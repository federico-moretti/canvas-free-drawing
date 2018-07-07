// import config, override format option
// rollup --config rollup.config.js -f umd
// rollup.config.js

import babel from 'rollup-plugin-babel';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/canvas-free-drawing.js',
    format: 'umd',
    name: 'CanvasFreeDrawing',
    sourcemap: true,
  },
  plugins: [babel()],
};
