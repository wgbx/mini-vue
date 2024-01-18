import { isObject } from '@vue/shared'
import { reactiveHandlers, shallowReadonlyHandlers, shallowReactiveHandlers, readonlyHandlers } from './baseHandlers'

const reactiveMap = new WeakMap()
const readonlyMap = new WeakMap()

function createReactiveObj(target, isReadonly, baseHandlers) {
  if (!isObject(target)) {
    return target
  }

  const proxyMap = isReadonly ? readonlyMap : reactiveMap
  const existingProxy = proxyMap.get(target)

  if (existingProxy) {
    return existingProxy
  }

  const proxy = new Proxy(target, baseHandlers)
  proxyMap.set(target, proxy)

  return proxy
}

export function reactive(target) {
  return createReactiveObj(target, false, reactiveHandlers)
}

export function shallowReactive(target) {
  return createReactiveObj(target, false, shallowReactiveHandlers)
}

export function readonly(target) {
  return createReactiveObj(target, true, readonlyHandlers)
}

export function shallowReadonly(target) {
  return createReactiveObj(target, true, shallowReadonlyHandlers)
}
