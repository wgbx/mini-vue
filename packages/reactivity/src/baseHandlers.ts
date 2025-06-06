/**
 * Vue 3 响应式系统的 Proxy 处理器
 *
 * 这个文件定义了 Proxy 的各种拦截器（handlers），用于：
 * 1. 拦截属性访问（getter）- 进行依赖收集
 * 2. 拦截属性设置（setter）- 触发依赖更新
 * 3. 处理不同类型的响应式行为（深度/浅层、可写/只读）
 *
 * 核心原理：
 * - getter 中调用 track() 收集依赖
 * - setter 中调用 trigger() 触发更新
 * - 根据配置决定是否递归转换嵌套对象
 */

import { isObject } from '@vue/shared'
import { reactive, readonly } from './reactive'
import { warn } from './warning'
import { TrackOpTypes, TriggerOpTypes } from './constants'
import { track, trigger } from './effect'

// 预创建各种 getter 函数
const get = createGetter() // 深度响应式 getter
const shallowGet = createGetter(false, true) // 浅层响应式 getter
const readonlyGet = createGetter(true) // 深度只读 getter
const shallowReadonlyGet = createGetter(true, true) // 浅层只读 getter

// 预创建各种 setter 函数
const set = createSetter() // 深度响应式 setter
const shallowSet = createSetter(true) // 浅层响应式 setter

/**
 * 创建 getter 函数的工厂函数
 *
 * @param isReadonly - 是否为只读模式
 * @param shallow - 是否为浅层模式
 * @returns getter 函数
 */
function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key, receiver) {
    // 1. 使用 Reflect.get 获取属性值，保证正确的 this 绑定
    const res = Reflect.get(target, key, receiver)

    // 2. 如果不是只读模式，进行依赖收集
    if (!isReadonly) {
      // 当访问属性时，收集当前 effect 作为该属性的依赖
      track(target, TrackOpTypes.GET, key)
    }

    // 3. 如果是浅层模式，直接返回结果，不做递归转换
    if (shallow) {
      return res
    }

    // 4. 如果结果是对象，需要递归转换为响应式
    if (isObject(res)) {
      // 根据当前模式选择合适的转换函数
      return isReadonly ? readonly(res) : reactive(res)
    }

    // 5. 如果是基本类型，直接返回
    return res
  }
}

/**
 * 创建 setter 函数的工厂函数
 *
 * @param _shallow - 是否为浅层模式
 * @returns setter 函数
 */
function createSetter(_shallow = false) {
  return function set(target, key, value, receiver) {
    // 1. 保存旧值，用于触发更新时的对比
    const oldValue = target[key]

    // 2. 使用 Reflect.set 设置属性值
    const result = Reflect.set(target, key, value, receiver)

    // 3. 触发依赖更新
    // 当属性被修改时，通知所有依赖该属性的 effect 重新执行
    trigger(target, TriggerOpTypes.SET, key, value, oldValue)

    // 4. 返回设置结果
    return result
  }
}

/**
 * 深度响应式对象的处理器
 * 用于 reactive() 创建的对象
 */
export const reactiveHandlers = {
  get, // 深度响应式 getter
  set // 深度响应式 setter
}

/**
 * 浅层响应式对象的处理器
 * 用于 shallowReactive() 创建的对象
 */
export const shallowReactiveHandlers = {
  get: shallowGet, // 浅层响应式 getter
  set: shallowSet // 浅层响应式 setter
}

/**
 * 深度只读对象的处理器
 * 用于 readonly() 创建的对象
 */
export const readonlyHandlers = {
  get: readonlyGet, // 深度只读 getter
  set: (target, key) => {
    // 只读对象的 setter：在开发环境下发出警告
    warn(`Delete operation on key "${String(key)}" failed: target is readonly.`, target)
  }
}

/**
 * 浅层只读对象的处理器
 * 用于 shallowReadonly() 创建的对象
 */
export const shallowReadonlyHandlers = {
  get: shallowReadonlyGet, // 浅层只读 getter
  set: (target, key) => {
    // 浅层只读对象的 setter：在开发环境下发出警告
    warn(`Delete operation on key "${String(key)}" failed: target is readonly.`, target)
  }
}
