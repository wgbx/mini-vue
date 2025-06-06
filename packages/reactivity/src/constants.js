/**
 * Vue 3 响应式系统的常量定义
 *
 * 这个文件定义了响应式系统中使用的各种枚举和常量
 */

/**
 * 依赖收集操作类型枚举
 * 用于标识在 track 函数中进行的操作类型
 */
export const TrackOpTypes = {
  GET: 'get', // 属性访问操作（obj.prop）
  HAS: 'has', // 属性存在检查操作（'prop' in obj）
  ITERATE: 'iterate' // 迭代操作（Object.keys(obj)、for...in）
}

/**
 * 依赖触发操作类型枚举
 * 用于标识在 trigger 函数中进行的操作类型
 */
export const TriggerOpTypes = {
  SET: 'set', // 属性设置操作（obj.prop = value）
  ADD: 'add', // 属性添加操作（给对象添加新属性）
  DELETE: 'delete', // 属性删除操作（delete obj.prop）
  CLEAR: 'clear' // 清空操作（clear Map/Set）
}

/**
 * 响应式对象标识符枚举
 * 用于在对象上添加特殊属性来标识其响应式状态
 */
export const ReactiveFlags = {
  SKIP: '__v_skip', // 标记对象跳过响应式转换
  IS_REACTIVE: '__v_isReactive', // 标记对象是响应式的
  IS_READONLY: '__v_isReadonly', // 标记对象是只读的
  IS_SHALLOW: '__v_isShallow', // 标记对象是浅层响应式的
  RAW: '__v_raw' // 获取响应式对象的原始对象
}

/**
 * 脏值级别枚举
 * 用于 computed 等需要缓存计算结果的场景
 */
export const DirtyLevels = {
  NotDirty: 0, // 不脏，值是最新的
  ComputedValueMaybeDirty: 1, // 计算值可能脏了
  ComputedValueDirty: 2, // 计算值确实脏了
  Dirty: 3 // 脏值，需要重新计算
}
