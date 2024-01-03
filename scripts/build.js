import fs from 'fs'

const dirs = fs.readdirSync('packages').filter(path=>{
  if(!fs.statSync(`packages/${path}`).isDirectory()){
    return false
  }
  return true
})

console.log("🚀 ~ file: build.js:8 ~ dirs ~ dirs:", dirs)