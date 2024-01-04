import NodeResolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import babel from '@rollup/plugin-babel'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const __dirname = fileURLToPath(new URL('.', import.meta.url))
const packagesDir = path.resolve(__dirname, 'packages')
const packageDir = path.resolve(packagesDir, process.env.TARGET)
console.log('🚀 ~ file: rollup.config.js:14 ~ packageDir:', packageDir)
const name = path.basename(packageDir)
const resolve = p => path.resolve(packageDir, p)
const pkg = require(resolve('package.json'))
const { buildOptions = {} } = pkg
console.log('🚀 ~ file: rollup.config.js:18 ~ name:', name)
console.log('🚀 ~ file: rollup.config.js:17 ~ buildOptions:', buildOptions)
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

function createConfig(){

}

export default buildOptions.formats.map(format => createConfig(format, outputOptions[format]))
