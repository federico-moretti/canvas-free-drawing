// import config, override format option
// rollup --config rollup.config.js -f umd
// rollup.config.js

import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';

export default {
  input: 'src/index.js',
  output: {
    file: 'umd/canvas-free-drawing.js',
    format: 'umd',
    name: 'CanvasFreeDrawing',
    sourcemap: true,
  },
  plugins: [
    resolve(),
    babel({
      exclude: 'node_modules/**', // only transpile our source code
    }),
  ],
};
