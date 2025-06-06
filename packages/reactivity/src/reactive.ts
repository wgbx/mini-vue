/**
 * Vue 3 响应式对象的创建和管理
 *
 * 这个文件实现了 Vue 3 中响应式对象的核心功能：
 * 1. reactive() - 创建深度响应式对象
 * 2. readonly() - 创建只读响应式对象
 * 3. shallowReactive() - 创建浅层响应式对象
 * 4. shallowReadonly() - 创建浅层只读响应式对象
 *
 * 核心原理：
 * - 使用 Proxy 代理原始对象
 * - 使用 WeakMap 缓存已创建的代理对象，避免重复创建
 * - 通过不同的 handler 实现不同的响应式行为
 */

import { isObject } from '@vue/shared'
import { reactiveHandlers, shallowReadonlyHandlers, shallowReactiveHandlers, readonlyHandlers } from './baseHandlers'

/**
 * 响应式对象的缓存
 * 使用 WeakMap 存储 原始对象 -> 响应式代理对象 的映射
 * WeakMap 的优势：当原始对象被垃圾回收时，对应的代理对象也会被自动清理
 */
const reactiveMap = new WeakMap()

/**
 * 只读对象的缓存
 * 存储 原始对象 -> 只读代理对象 的映射
 */
const readonlyMap = new WeakMap()

/**
 * 创建响应式对象的通用函数
 *
 * @param target - 要代理的原始对象
 * @param isReadonly - 是否为只读代理
 * @param baseHandlers - Proxy 处理器对象，定义了 get/set 等拦截行为
 * @returns 代理对象或原始对象
 */
function createReactiveObj(target, isReadonly, baseHandlers) {
  // 1. 类型检查：只有对象才能被代理
  if (!isObject(target)) {
    return target
  }

  // 2. 选择合适的缓存映射表
  const proxyMap = isReadonly ? readonlyMap : reactiveMap

  // 3. 检查缓存：如果已经创建过代理对象，直接返回
  const existingProxy = proxyMap.get(target)
  if (existingProxy) {
    return existingProxy
  }

  // 4. 创建新的 Proxy 代理对象
  const proxy = new Proxy(target, baseHandlers)

  // 5. 缓存代理对象，避免重复创建
  proxyMap.set(target, proxy)

  return proxy
}

/**
 * 创建深度响应式对象
 *
 * @param target - 要转换为响应式的对象
 * @returns 响应式代理对象
 *
 * 特点：
 * - 对象的所有嵌套属性都会被递归转换为响应式
 * - 当属性被访问时会收集依赖
 * - 当属性被修改时会触发依赖更新
 *
 * 使用示例：
 * const state = reactive({
 *   count: 0,
 *   user: { name: 'Vue', age: 3 }
 * })
 * // state.user.name 的修改也会触发响应式更新
 */
export function reactive(target) {
  return createReactiveObj(target, false, reactiveHandlers)
}

/**
 * 创建浅层响应式对象
 *
 * @param target - 要转换为响应式的对象
 * @returns 浅层响应式代理对象
 *
 * 特点：
 * - 只有对象的第一层属性是响应式的
 * - 嵌套对象不会被转换为响应式
 * - 适用于性能优化场景
 *
 * 使用示例：
 * const state = shallowReactive({
 *   count: 0,                    // 响应式
 *   user: { name: 'Vue', age: 3 } // 非响应式
 * })
 * // state.count 的修改会触发更新
 * // state.user.name 的修改不会触发更新
 */
export function shallowReactive(target) {
  return createReactiveObj(target, false, shallowReactiveHandlers)
}

/**
 * 创建深度只读对象
 *
 * @param target - 要转换为只读的对象
 * @returns 只读代理对象
 *
 * 特点：
 * - 对象的所有嵌套属性都是只读的
 * - 尝试修改属性时会在开发环境下发出警告
 * - 不会收集依赖，因为只读对象不会改变
 *
 * 使用示例：
 * const config = readonly({
 *   apiUrl: 'https://api.example.com',
 *   settings: { timeout: 5000 }
 * })
 * // config.apiUrl = 'new-url' // 在开发环境下会警告
 */
export function readonly(target) {
  return createReactiveObj(target, true, readonlyHandlers)
}

/**
 * 创建浅层只读对象
 *
 * @param target - 要转换为只读的对象
 * @returns 浅层只读代理对象
 *
 * 特点：
 * - 只有对象的第一层属性是只读的
 * - 嵌套对象可以被修改
 * - 适用于部分保护数据的场景
 *
 * 使用示例：
 * const config = shallowReadonly({
 *   apiUrl: 'https://api.example.com',     // 只读
 *   settings: { timeout: 5000 }           // 可修改
 * })
 * // config.apiUrl = 'new-url'             // 会警告
 * // config.settings.timeout = 3000       // 可以修改
 */
export function shallowReadonly(target) {
  return createReactiveObj(target, true, shallowReadonlyHandlers)
}
