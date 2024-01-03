export function createApp(options) {
  console.log('🚀 ~ file: index.js:2 ~ createApp ~ options:', options)
  return {
    mount(selector) {
      const parent = document.querySelector(selector)
      console.log('🚀 ~ file: index.js:5 ~ mount ~ parent:', parent)
      if (!options.render) {
        // 如果没有配置渲染函数，使用自定义的编译函数得到渲染函数
        options.render = this.compile(parent.innerHTML)
      }
      // 通过call执行函数，并将setup的返回值作为this
      const el = options.render.call(options.setup())
      // 清空宿主元素的内容
      parent.innerHTML = ''
      // 将el追加到宿主元素
      parent.appendChild(el)
    },
    compile(template) {
      // template暂时不处理
      return function render() {
        const div = document.createElement('div')
        // 这里的this就是setup函数的返回值
        div.innerHTML = this.message.value
        return div
      }
    }
  }
}

export function getInfo() {
  console.log('-------', 'getInfo')
}
