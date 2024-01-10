let uid = 0
let activeEffect
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
    try {
      effectStack.push(effect)
      activeEffect = effect
      fn()
    } finally {
      effectStack.pop()
      activeEffect = effectStack[effectStack.length - 1]
    }
  }
  effect.id = uid++
  effect._isEffect = true
  effect.raw = fn
  effect.options = options
  return effect
}

export function Track(target, type, key) {
  console.log(target, type, key, activeEffect)
}
