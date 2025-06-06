/**
 * Vue 3 Ref 响应式引用系统
 *
 * 这个文件实现了 Vue 3 中 ref 相关的所有功能：
 * 1. ref() - 创建响应式引用
 * 2. shallowRef() - 创建浅层响应式引用
 * 3. isRef() - 判断是否为 ref 对象
 * 4. unref() - 获取 ref 的值
 * 5. toRef() - 将对象属性转换为 ref
 * 6. toRefs() - 将对象所有属性转换为 ref
 *
 * ref 与 reactive 的区别：
 * - ref 用于基本类型和单个值的响应式
 * - reactive 用于对象的响应式
 * - ref 通过 .value 访问值
 * - reactive 直接访问属性
 */

import { track, trigger } from './effect.js'
import { TrackOpTypes, TriggerOpTypes } from './constants.js'
import { isObject } from '@vue/shared'
import { reactive } from './reactive.js'

/**
 * ref 对象的标识符
 * 用于识别一个对象是否为 ref
 */
export const RefFlag = '__v_isRef'

/**
 * RefImpl 类 - ref 的具体实现
 * 这是 ref() 和 shallowRef() 创建的对象的内部实现
 */
class RefImpl {
  /**
   * 构造函数
   * @param {*} value - 初始值
   * @param {boolean} __v_isShallow - 是否为浅层 ref
   */
  constructor(value, __v_isShallow) {
    this._value // 当前值（可能是响应式的）
    this._rawValue // 原始值（非响应式的）
    this[RefFlag] = true // ref 标识符
    this.__v_isShallow = __v_isShallow

    // 保存原始值（未转换的）
    this._rawValue = __v_isShallow ? value : toRaw(value)

    // 根据是否为浅层 ref，决定是否将值转换为响应式
    this._value = __v_isShallow ? value : toReactive(value)
  }

  /**
   * value 的 getter
   * 当访问 ref.value 时调用
   */
  get value() {
    // 依赖收集：将当前 effect 添加到这个 ref 的依赖列表中
    track(this, TrackOpTypes.GET, 'value')
    return this._value
  }

  /**
   * value 的 setter
   * 当设置 ref.value 时调用
   */
  set value(newVal) {
    // 根据 ref 类型和新值特性决定是否需要转换
    const useDirectValue = this.__v_isShallow || isShallow(newVal) || isReadonly(newVal)
    newVal = useDirectValue ? newVal : toRaw(newVal)

    // 只有值真正改变时才触发更新
    if (hasChanged(newVal, this._rawValue)) {
      this._rawValue = newVal
      this._value = useDirectValue ? newVal : toReactive(newVal)

      // 触发依赖更新：通知所有依赖这个 ref 的 effect 重新执行
      trigger(this, TriggerOpTypes.SET, 'value', newVal)
    }
  }
}

// ==================== 工具函数 ====================

/**
 * 将值转换为响应式
 * 如果是对象则使用 reactive()，否则返回原值
 * @param {*} value - 要转换的值
 * @returns {*} 转换后的值
 */
function toReactive(value) {
  return isObject(value) ? reactive(value) : value
}

/**
 * 获取响应式对象的原始值
 * 如果对象有 __v_raw 属性，递归获取原始值
 * @param {*} observed - 观察的对象
 * @returns {*} 原始值
 */
function toRaw(observed) {
  const raw = observed && observed.__v_raw
  return raw ? toRaw(raw) : observed
}

/**
 * 检查两个值是否发生了变化
 * 使用 Object.is 进行比较，能正确处理 NaN 和 +0/-0 的情况
 * @param {*} value - 新值
 * @param {*} oldValue - 旧值
 * @returns {boolean} 是否发生变化
 */
function hasChanged(value, oldValue) {
  return !Object.is(value, oldValue)
}

/**
 * 检查值是否为浅层响应式
 * @param {*} value - 要检查的值
 * @returns {boolean} 是否为浅层响应式
 */
function isShallow(value) {
  return !!(value && value.__v_isShallow)
}

/**
 * 检查值是否为只读
 * @param {*} value - 要检查的值
 * @returns {boolean} 是否为只读
 */
function isReadonly(value) {
  return !!(value && value.__v_isReadonly)
}

// ==================== 主要 API ====================

/**
 * 创建一个响应式引用
 *
 * @param {*} value - 初始值
 * @returns {Object} Ref 对象
 *
 * 特点：
 * - 如果传入对象，会被转换为响应式对象
 * - 通过 .value 访问和修改值
 * - 值的变化会触发依赖更新
 *
 * 使用示例：
 * const count = ref(0)
 * const user = ref({ name: 'Vue' })
 *
 * console.log(count.value) // 0
 * count.value++            // 触发更新
 * user.value.name = 'React' // 也会触发更新
 */
export function ref(value) {
  return createRef(value, false)
}

/**
 * 创建一个浅层响应式引用
 *
 * @param {*} value - 初始值
 * @returns {Object} 浅层 Ref 对象
 *
 * 特点：
 * - 只有 .value 的赋值是响应式的
 * - 如果值是对象，对象内部的变化不会触发更新
 * - 适用于性能优化场景
 *
 * 使用示例：
 * const user = shallowRef({ name: 'Vue' })
 *
 * user.value = { name: 'React' }  // 触发更新
 * user.value.name = 'Angular'     // 不触发更新
 */
export function shallowRef(value) {
  return createRef(value, true)
}

/**
 * 创建 ref 的内部函数
 *
 * @param {*} rawValue - 原始值
 * @param {boolean} shallow - 是否为浅层 ref
 * @returns {RefImpl} RefImpl 实例
 */
function createRef(rawValue, shallow) {
  // 如果已经是 ref，直接返回
  if (isRef(rawValue)) {
    return rawValue
  }
  return new RefImpl(rawValue, shallow)
}

/**
 * 检查一个值是否为 ref
 *
 * @param {*} r - 要检查的值
 * @returns {boolean} 是否为 ref
 *
 * 使用示例：
 * const count = ref(0)
 * const num = 42
 *
 * isRef(count) // true
 * isRef(num)   // false
 */
export function isRef(r) {
  return !!(r && r[RefFlag] === true)
}

/**
 * 获取 ref 的值，如果不是 ref 则返回原值
 *
 * @param {*} ref - ref 对象或普通值
 * @returns {*} 实际的值
 *
 * 使用示例：
 * const count = ref(42)
 * const num = 24
 *
 * unref(count) // 42
 * unref(num)   // 24
 */
export function unref(ref) {
  return isRef(ref) ? ref.value : ref
}

/**
 * 将对象的单个属性转换为 ref
 *
 * @param {Object} object - 源对象
 * @param {string} key - 属性名
 * @returns {Object} 该属性的 ref
 *
 * 特点：
 * - 返回的 ref 与原对象的属性保持同步
 * - 修改 ref 会影响原对象
 * - 修改原对象也会影响 ref
 *
 * 使用示例：
 * const state = reactive({ count: 0, name: 'Vue' })
 * const countRef = toRef(state, 'count')
 *
 * countRef.value++     // state.count 也变为 1
 * state.count = 5      // countRef.value 也变为 5
 */
export function toRef(object, key) {
  const val = object[key]
  return isRef(val) ? val : new ObjectRefImpl(object, key)
}

/**
 * 将对象的所有属性转换为 ref
 *
 * @param {Object} object - 源对象
 * @returns {Object} 包含所有属性 ref 的新对象
 *
 * 使用示例：
 * const state = reactive({ count: 0, name: 'Vue' })
 * const { count, name } = toRefs(state)
 *
 * // 现在可以解构使用，同时保持响应式
 * count.value++        // state.count 也会增加
 */
export function toRefs(object) {
  const ret = {}
  for (const key in object) {
    ret[key] = toRef(object, key)
  }
  return ret
}

/**
 * ObjectRefImpl 类 - 对象属性 ref 的实现
 * 用于 toRef() 创建的 ref，与原对象属性保持同步
 */
class ObjectRefImpl {
  /**
   * 构造函数
   * @param {Object} _object - 源对象
   * @param {string} _key - 属性名
   */
  constructor(_object, _key) {
    this[RefFlag] = true
    this._object = _object // 源对象
    this._key = _key // 属性名
  }

  /**
   * 获取对象属性的值
   */
  get value() {
    return this._object[this._key]
  }

  /**
   * 设置对象属性的值
   */
  set value(newVal) {
    this._object[this._key] = newVal
  }
}
