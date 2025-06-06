/**
 * Vue 3 响应式系统的主入口文件
 *
 * 这个文件负责导出所有响应式相关的 API，包括：
 * - reactive: 创建响应式对象
 * - ref: 创建响应式引用
 * - computed: 创建计算属性
 * - effect: 创建副作用函数
 *
 * 使用方式：
 * import { reactive, ref, computed, effect } from '@vue/reactivity'
 */

// 导出响应式对象相关 API (reactive, readonly, shallowReactive 等)
export * from './reactive.js'

// 导出副作用系统 API (effect, track, trigger 等)
export * from './effect.js'

// 导出 ref 系统 API (ref, isRef, unref, toRefs 等)
export * from './ref.js'

// 导出计算属性 API (computed)
export * from './computed.js'
