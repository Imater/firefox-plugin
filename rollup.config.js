import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import postcss from 'rollup-plugin-postcss';
import copy from 'rollup-plugin-copy';

const isProduction = process.env.NODE_ENV === 'production';

// Общие плагины для копирования файлов
const copyPlugin = copy({
  targets: [
    { src: 'src/*.html', dest: 'dist' },
    { src: 'src/*.png', dest: 'dist' },
    { src: 'favorites-icon.png', dest: 'dist' },
    { src: 'manifest.json', dest: 'dist' },
    { src: 'popup.html', dest: 'dist' },
    { src: 'popup.js', dest: 'dist' }
  ]
});

export default [
  // Основной bundle для приложения
  {
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
        include: /node_modules/
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
      copyPlugin,
      isProduction && terser()
    ].filter(Boolean),
    onwarn(warning, warn) {
      // Игнорируем предупреждения о 'use client'
      if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && warning.message.includes('use client')) {
        return;
      }
      warn(warning);
    },
  },
  // Background script
  {
    input: 'background.js',
    output: {
      file: 'dist/background.js',
      format: 'iife',
      name: 'BackgroundScript',
      sourcemap: !isProduction,
    },
    plugins: [
      resolve({
        browser: true,
        extensions: ['.js'],
        preferBuiltins: false
      }),
      commonjs({
        include: /node_modules/
      }),
      copyPlugin,
      isProduction && terser()
    ].filter(Boolean)
  }
];