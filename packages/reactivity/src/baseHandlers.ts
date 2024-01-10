import { isObject } from '@vue/shared'
import { reactive, readonly } from './reactive'
import { warn } from './warning'

const get = createGetter()
const shallowGet = createGetter(false, true)
const readonlyGet = createGetter(true)
const shallowReadonlyGet = createGetter(true, true)

const set = createSetter()
const shallowSet = createSetter(true)

function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key, receiver) {
    const res = Reflect.get(target, key, receiver)
    if (!isReadonly) {
      return res
    }
    if (shallow) {
      return res
    }
    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res)
    }
    return res
  }
}

function createSetter(shallow = false) {
  return function set(target, key, value, receiver) {
    return Reflect.set(target, key, value, receiver)
  }
}

export const reactiveHandlers = {
  get,
  set
}
export const shallowReactiveHandlers = {
  get: shallowGet,
  set: shallowSet
}
export const readonlyHandlers = {
  get: readonlyGet,
  set: (target, key) => {
    warn(`Delete operation on key "${String(key)}" failed: target is readonly.`, target)
  }
}
export const shallowReadonlyHandlers = {
  get: shallowReadonlyGet,
  set: (target, key) => {
    warn(`Delete operation on key "${String(key)}" failed: target is readonly.`, target)
  }
}
