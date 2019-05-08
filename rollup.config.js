// rollup.config.js
import commonjs from 'rollup-plugin-commonjs';

export default {
  input: 'dist/index.js',
  output: {
    exports: 'named',
    file: 'umd/canvas-free-drawing.js',
    format: 'umd',
    name: 'CanvasFreeDrawing',
  },
  plugins: [commonjs()],
};
