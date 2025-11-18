const fs = require('fs');
const path = require('path');
const browserslist = fs
  .readFileSync(path.resolve(__dirname, '.browserslistrc'), 'utf8')
  .trim()
  .split('\n');

const buildEnv = process.env.EUI_BUILD_ENV;

const isOptimize = buildEnv === 'optimize';
const isTestEnv = buildEnv === 'test-env';

const config = {
  env: {
    targets: browserslist,
  },
  jsc: {
    parser: {
      syntax: 'typescript',
      tsx: true,
    },
    transform: {
      comments: true,
      react: {
        runtime: 'classic',
        importSource: '@emotion/react',
      },
      // Equivalent to Babel's `@emotion/babel-preset-css-prop`
      emotion: {
        autoLabel: 'always',
        labelFormat: '[local]',
        sourceMap: false,
      },
    },
    // Equivalent to Babel's `@babel/proposal-class-properties` and others,
    // SWC supports modern features by default
    target: 'es2020',
    // Equivalent to Babel's `@babel/plugin-transform-runtime`
    externalHelpers: isOptimize || isTestEnv,
  },
  module: {
    type: process.env.SWC_MODULE_TYPE || 'commonjs',
  },
};

module.exports = config;
