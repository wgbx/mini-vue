/**
 * Vue 3 响应式系统的警告工具
 *
 * 这个文件提供了开发环境下的警告功能，
 * 主要用于提示开发者错误的操作，比如尝试修改只读对象。
 */

/**
 * 发出警告信息
 *
 * @param message - 警告消息
 * @param target - 相关的目标对象（可选）
 *
 * 使用场景：
 * - 尝试修改只读响应式对象时
 * - 无效的响应式操作时
 * - 其他需要提醒开发者的情况
 */
export function warn(message: string) {
  console.warn(message)
}
