import fs from 'fs'
import { execa } from 'execa'

const dirs = fs.readdirSync('packages').filter(path => fs.statSync(`packages/${path}`).isDirectory())

async function build(target) {
  await execa('rollup', ['-c', '--environment', `TARGET:${target}`], { stdio: 'inherit' })
}

Promise.all(dirs.map(build)).then(() => {
  console.log('build finished')
})
