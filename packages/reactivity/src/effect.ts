let uid = 0
let activeEffect
let targetMap = new WeakMap()
const effectStack = []

export function effect(fn, options: any = {}) {
  const effect = createReactiveEffect(fn, options)
  if (!options.lazy) {
    effect()
  }
  return effect
}

function createReactiveEffect(fn, options) {
  const effect = function reactiveEffect() {
    if (!effectStack.includes(effect)) {
      try {
        effectStack.push(effect)
        activeEffect = effect
        fn()
      } finally {
        effectStack.pop()
        activeEffect = effectStack[effectStack.length - 1]
      }
    }
  }
  effect.id = uid++
  effect._isEffect = true
  effect.raw = fn
  effect.options = options
  return effect
}

export function Track(target, type, key) {
  if (activeEffect === undefined) {
    return
  }
  let depMap = targetMap.get(target)
  if (!depMap) {
    targetMap.set(target, (depMap = new Map()))
  }
  let dep = depMap.get(key)
  if (!dep) {
    depMap.set(key, (dep = new Set()))
  }
  if(!dep.has(activeEffect)){
    dep.add(activeEffect)
  }
}
