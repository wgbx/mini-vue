/**
 * Vue 3 响应式系统的副作用（Effect）实现
 *
 * 这个文件是响应式系统的核心，实现了：
 * 1. 副作用函数的创建和管理
 * 2. 依赖收集（track）机制
 * 3. 依赖触发（trigger）机制
 *
 * 核心原理：
 * - 当响应式数据被访问时，收集当前正在执行的 effect（依赖收集）
 * - 当响应式数据被修改时，重新执行相关的 effect（依赖触发）
 */

// 全局变量：用于生成唯一的 effect ID
let uid = 0

// 全局变量：当前正在执行的 effect 函数
let activeEffect

// 全局依赖映射表：target -> key -> effects
// 结构：WeakMap<target, Map<key, Set<effect>>>
let targetMap = new WeakMap()

// effect 执行栈：用于处理嵌套 effect 的情况
const effectStack = []

/**
 * ReactiveEffect 接口定义
 * 描述一个响应式副作用函数的结构
 */
interface ReactiveEffect {
  (): any // effect 函数本身，可以被调用
  id: number // 唯一标识符
  _isEffect: boolean // 标识这是一个 effect 函数
  raw: any // 原始函数
  options: any // 配置选项
}

/**
 * 创建一个响应式副作用函数
 *
 * @param fn - 要执行的函数
 * @param options - 配置选项
 * @param options.lazy - 是否延迟执行（computed 会用到）
 * @param options.scheduler - 自定义调度器
 * @returns 返回 effect 函数，可以手动调用来重新执行
 *
 * 使用示例：
 * const stop = effect(() => {
 *   console.log(state.count) // 当 state.count 变化时，这个函数会重新执行
 * })
 */
export function effect(fn, options: any = {}) {
  const effect = createReactiveEffect(fn, options)

  // 如果不是延迟执行，立即执行一次
  if (!options.lazy) {
    effect()
  }

  return effect
}

/**
 * 创建响应式副作用函数的内部实现
 *
 * @param fn - 原始函数
 * @param options - 配置选项
 * @returns 包装后的 effect 函数
 */
function createReactiveEffect(fn, options): ReactiveEffect {
  const effect = function reactiveEffect() {
    // 避免重复执行：如果当前 effect 已经在执行栈中，就不再执行
    if (!effectStack.includes(effect)) {
      try {
        // 1. 将当前 effect 推入执行栈
        effectStack.push(effect)

        // 2. 设置为当前活跃的 effect（用于依赖收集）
        activeEffect = effect

        // 3. 执行原始函数（在执行过程中会触发 getter，进而收集依赖）
        fn()
      } finally {
        // 4. 执行完毕后，从栈中移除
        effectStack.pop()

        // 5. 恢复上一个活跃的 effect
        activeEffect = effectStack[effectStack.length - 1]
      }
    }
  } as ReactiveEffect

  // 设置 effect 的元数据
  effect.id = uid++ // 唯一 ID
  effect._isEffect = true // 标识为 effect 函数
  effect.raw = fn // 保存原始函数
  effect.options = options // 保存配置选项

  return effect
}

/**
 * 依赖收集函数
 * 当响应式数据被访问时调用，建立数据与 effect 之间的依赖关系
 *
 * @param target - 目标对象（响应式对象）
 * @param _type - 操作类型（GET、HAS、ITERATE）
 * @param key - 被访问的属性名
 *
 * 数据结构：
 * targetMap (WeakMap):
 *   target1 -> Map:
 *     key1 -> Set: [effect1, effect2, ...]
 *     key2 -> Set: [effect3, effect4, ...]
 *   target2 -> Map:
 *     ...
 */
export function track(target, _type, key) {
  // 如果没有活跃的 effect，说明不是在 effect 函数中访问数据，无需收集依赖
  if (activeEffect === undefined) {
    return
  }

  // 1. 获取 target 对应的依赖映射表
  let depMap = targetMap.get(target)
  if (!depMap) {
    // 如果不存在，创建一个新的 Map
    targetMap.set(target, (depMap = new Map()))
  }

  // 2. 获取 key 对应的 effect 集合
  let dep = depMap.get(key)
  if (!dep) {
    // 如果不存在，创建一个新的 Set
    depMap.set(key, (dep = new Set()))
  }

  // 3. 将当前活跃的 effect 添加到依赖集合中
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect)
  }
}

/**
 * 依赖触发函数
 * 当响应式数据被修改时调用，执行所有相关的 effect 函数
 *
 * @param target - 目标对象
 * @param _type - 操作类型（SET、ADD、DELETE、CLEAR）
 * @param key - 被修改的属性名
 * @param _newValue - 新值（可选）
 * @param _oldValue - 旧值（可选）
 */
export function trigger(target, _type, key, _newValue?, _oldValue?) {
  // 1. 获取 target 对应的依赖映射表
  const depMap = targetMap.get(target)
  if (!depMap) {
    // 如果没有依赖，直接返回
    return
  }

  // 2. 收集需要执行的 effects
  const effects = new Set<ReactiveEffect>()

  // 3. 根据 key 收集相关的 effects
  if (key !== void 0) {
    const dep = depMap.get(key)
    if (dep) {
      dep.forEach((effect: ReactiveEffect) => {
        // 避免在 effect 执行过程中触发自己（防止无限循环）
        if (effect !== activeEffect) {
          effects.add(effect)
        }
      })
    }
  }

  // 4. 执行所有收集到的 effects
  effects.forEach((effect: ReactiveEffect) => {
    if (effect.options?.scheduler) {
      // 如果有自定义调度器，使用调度器执行
      effect.options.scheduler(effect)
    } else {
      // 否则直接执行 effect 函数
      effect()
    }
  })
}

// 保持向后兼容的别名
export const Track = track
