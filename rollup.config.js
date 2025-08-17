import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import postcss from 'rollup-plugin-postcss';
import copy from 'rollup-plugin-copy';
import serve from 'rollup-plugin-serve';

const isProduction = process.env.NODE_ENV === 'production';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/bundle.js',
    format: 'iife',
    name: 'WebDAVBookmarks',
    sourcemap: !isProduction,
  },
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
      preventAssignment: true
    }),
    resolve({
      browser: true,
      extensions: ['.js', '.jsx'],
      preferBuiltins: false
    }),
    commonjs({
      include: /node_modules/,
      namedExports: {
        '@mui/material': [
          'createTheme',
          'ThemeProvider',
          'Box',
          'Button',
          'TextField',
          'Typography',
          'Paper',
          'styled'
        ]
      }
    }),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      presets: ['@babel/preset-react'],
      extensions: ['.js', '.jsx'],
      plugins: [
        ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]
      ]
    }),
    postcss({
      extract: true,
      minimize: isProduction,
      modules: false,
      use: ['sass']
    }),
    copy({
      targets: [
        { src: 'src/*.html', dest: 'dist' },
        { src: 'src/*.png', dest: 'dist' },
        { src: 'manifest.json', dest: 'dist' },
        { src: 'public/index.html', dest: 'dist' }
      ]
    }),
    !isProduction && serve({
      contentBase: 'dist',
      port: 3000,
      open: true,
      host: 'localhost'
    }),
    isProduction && terser()
  ],
  onwarn(warning, warn) {
    // Игнорируем предупреждения о 'use client'
    if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && warning.message.includes('use client')) {
      return;
    }
    warn(warning);
  },
};