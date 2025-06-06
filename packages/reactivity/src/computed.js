/**
 * Vue 3 计算属性（Computed）实现
 *
 * 这个文件实现了 Vue 3 中的计算属性功能：
 * 1. computed() - 创建只读计算属性
 * 2. computed() with getter/setter - 创建可写计算属性
 *
 * 计算属性的特点：
 * - 基于依赖进行缓存，只有依赖改变时才重新计算
 * - 支持懒计算，只有访问时才执行计算函数
 * - 可以依赖其他响应式数据（reactive、ref、其他 computed）
 * - 自身也是响应式的，可以被其他 computed 或 effect 依赖
 */

import { effect, track, trigger } from './effect.js'
import { TrackOpTypes, TriggerOpTypes } from './constants.js'
import { isFunction } from '@vue/shared'
import { ReactiveFlags } from './constants.js'

/**
 * ComputedRefImpl 类 - 计算属性的具体实现
 */
class ComputedRefImpl {
  /**
   * 构造函数
   * @param {Function} getter - 计算函数
   * @param {Function} _setter - 设置函数（可选）
   * @param {boolean} isReadonly - 是否只读
   */
  constructor(getter, _setter, isReadonly) {
    this.effect // 内部 effect，用于收集依赖
    this.__v_isRef = true // 标识为 ref 类型
    this[ReactiveFlags.IS_READONLY] = isReadonly // 是否只读
    this._dirty = true // 脏标记：true 表示需要重新计算
    this._value // 缓存的计算结果
    this._setter = _setter // 设置函数

    // 创建内部 effect，用于依赖收集和响应更新
    this.effect = effect(getter, {
      lazy: true, // 懒执行：不立即执行，等到访问 value 时才执行
      scheduler: () => {
        // 调度器：当依赖改变时的处理逻辑
        if (!this._dirty) {
          this._dirty = true // 标记为脏，下次访问时重新计算
          // 触发依赖此 computed 的其他 effect 或 computed
          trigger(this, TriggerOpTypes.SET, 'value')
        }
      }
    })
  }

  /**
   * value 的 getter
   * 实现计算属性的懒计算和缓存机制
   */
  get value() {
    // 懒计算：只有当值被标记为脏时才重新计算
    if (this._dirty) {
      this._dirty = false // 清除脏标记
      this._value = this.effect() // 执行计算函数，获取新值
    }

    // 依赖收集：将当前 effect 添加到此 computed 的依赖列表
    // 这样当这个 computed 的值改变时，依赖它的 effect 会重新执行
    track(this, TrackOpTypes.GET, 'value')

    return this._value
  }

  /**
   * value 的 setter
   * 只有可写计算属性才能设置值
   */
  set value(newValue) {
    if (this._setter) {
      // 如果有 setter 函数，调用它来处理新值
      this._setter(newValue)
    } else {
      // 如果是只读计算属性，发出警告
      console.warn('Write operation failed: computed value is readonly')
    }
  }
}

/**
 * computed 函数的具体实现
 * 支持两种调用方式：传入 getter 函数或配置对象
 *
 * @param {Function|Object} getterOrOptions - getter 函数或包含 get/set 的配置对象
 * @returns {ComputedRefImpl} 计算属性实例
 *
 * 使用示例：
 *
 * // 只读计算属性
 * const count = ref(0)
 * const double = computed(() => count.value * 2)
 *
 * console.log(double.value) // 0
 * count.value = 5
 * console.log(double.value) // 10
 *
 * // 可写计算属性
 * const firstName = ref('John')
 * const lastName = ref('Doe')
 *
 * const fullName = computed({
 *   get() {
 *     return firstName.value + ' ' + lastName.value
 *   },
 *   set(newValue) {
 *     [firstName.value, lastName.value] = newValue.split(' ')
 *   }
 * })
 *
 * console.log(fullName.value)  // "John Doe"
 * fullName.value = "Jane Smith"
 * console.log(firstName.value) // "Jane"
 * console.log(lastName.value)  // "Smith"
 */
export function computed(getterOrOptions) {
  let getter
  let setter

  // 判断参数类型，提取 getter 和 setter
  const onlyGetter = isFunction(getterOrOptions)
  if (onlyGetter) {
    // 只传入了 getter 函数，创建只读计算属性
    getter = getterOrOptions
    setter = undefined
  } else {
    // 传入了配置对象，创建可写计算属性
    const options = getterOrOptions
    getter = options.get
    setter = options.set
  }

  // 创建 ComputedRefImpl 实例
  const cRef = new ComputedRefImpl(
    getter,
    setter,
    onlyGetter || !setter // 只有 getter 或没有 setter 时为只读
  )

  return cRef
}
