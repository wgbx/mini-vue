const get = createGetter()
const shallowGet = createGetter(false, true)
const readonlyGet = createGetter(true)
const shallowReadonlyGet = createGetter(true, true)

function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key, receiver) {
    
  }
}

export const reactiveHandlers = {
  get
}
export const shallowReactiveHandlers = {
  get: shallowGet
}
export const readonlyHandlers = {
  get: readonlyGet
}
export const shallowReadonlyHandlers = {
  get: shallowReadonlyGet
}
