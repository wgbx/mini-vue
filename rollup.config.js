import NodeResolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const __dirname = fileURLToPath(new URL('.', import.meta.url))

const packagesDir = path.resolve(__dirname, 'packages')
const packageDir = path.resolve(packagesDir, process.env.TARGET)
const resolve = p => path.resolve(packageDir, p)
const name = path.basename(packageDir)
const pkg = require(resolve('package.json'))
const { buildOptions = {} } = pkg

const outputOptions = {
  es: {
    file: resolve(`dist/${name}.esm.js`),
    format: 'es'
  },
  cjs: {
    file: resolve(`dist/${name}.cjs.js`),
    format: 'cjs'
  },
  global: {
    file: resolve(`dist/${name}.global.js`),
    format: 'iife'
  }
}

function createConfig(format, output) {
  output.name = buildOptions.name
  output.sourcemap = true

  return {
    input: resolve(`src/index.js`),
    output,
    plugins: [json(), NodeResolve(), commonjs()]
  }
}

export default buildOptions.formats.map(format => createConfig(format, outputOptions[format]))
