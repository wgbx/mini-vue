export function createApp(options) {
  console.log('🚀 ~ file: index.js:2 ~ createApp ~ options:', options)
  return {
    mount(selector) {
      const parent = document.querySelector(selector)
      if (!options.render) {
        options.render = this.compile(parent.innerHTML)
      }
      const el = options.render.call(options.setup())
      parent.innerHTML = ''
      parent.appendChild(el)
    },
    compile(template) {
      return function render() {
        const div = document.createElement('div')
        div.innerHTML = this.message.value
        return div
      }
    }
  }
}

export function getInfo() {
  console.log('-------', 'getInfo')
}
