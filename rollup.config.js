import commonjs from '@rollup/plugin-commonjs'
import alias from '@rollup/plugin-alias'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import json from '@rollup/plugin-json'
import { defineConfig } from 'rollup'
import size from 'rollup-plugin-size'
import esbuild from 'rollup-plugin-esbuild'
import { externals } from 'rollup-plugin-node-externals'

export default defineConfig([
  // CommonJS (for Node) and ES module (for bundlers) build.
  // (We could have three entries in the configuration array
  // instead of two, but it's quicker to generate multiple
  // builds from a single configuration where possible, using
  // an array for the `output` option, where we can specify
  // `file` and `format` for each target)
  {
    input: 'src/cli.ts',
    preserveEntrySignatures: 'strict',
    plugins: [
      externals({
        devDeps: false,
        builtinsPrefix: 'strip',
      }),
      esbuild({
        minify: process.env.BUILD === 'production',
        sourceMap: true,
        target: 'es2020',
      }),
      alias({
        resolve: ['.ts', '.js', '.tsx', '.jsx'],
        entries: [
          { find: '@/', replacement: './src/' },
          // https://github.com/MatrixAI/js-virtualfs/issues/4
          { find: 'readable-stream', replacement: 'stream' },
        ],
      }),
      commonjs(),
      nodeResolve({ preferBuiltins: true }),
      json(),
      size(),
    ],
    output: [
      {
        sourcemap: true,
        entryFileNames: '[name].mjs',
        dir: 'lib',
        chunkFileNames: 'chunks/[name].mjs',
        format: 'esm',
      },
    ],
  },
])
