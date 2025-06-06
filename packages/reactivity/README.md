# Vue 3 响应式系统 (Reactivity)

这是一个 Vue 3 响应式系统的简化实现，用于学习和理解 Vue 3 的核心原理。

## 🎯 核心概念

### 响应式原理图

```
┌─────────────────┐    访问属性     ┌─────────────────┐
│   响应式对象     │ ───────────→   │   依赖收集       │
│   (Proxy)      │                │   (track)       │
└─────────────────┘                └─────────────────┘
         │                                   │
         │ 修改属性                           │ 收集依赖
         ↓                                   ↓
┌─────────────────┐                ┌─────────────────┐
│   触发更新       │                │   Effect 函数   │
│   (trigger)    │ ←──────────────  │                │
└─────────────────┘    重新执行     └─────────────────┘
```

## 📁 文件结构

```
src/
├── index.ts           # 主入口文件
├── reactive.ts        # 响应式对象实现
├── effect.ts          # 副作用函数和依赖收集
├── baseHandlers.ts    # Proxy 处理器
├── ref.ts            # ref 响应式引用
├── computed.ts       # 计算属性
├── constants.ts      # 常量定义
└── warning.ts        # 警告工具
```

## 🔧 API 详解

### 1. reactive() - 响应式对象

```typescript
const state = reactive({
  count: 0,
  user: { name: 'Vue' }
})

// 深度响应式：嵌套对象也是响应式的
state.user.name = 'React' // 会触发更新
```

### 2. ref() - 响应式引用

```typescript
const count = ref(0)
const user = ref({ name: 'Vue' })

// 通过 .value 访问和修改
console.log(count.value) // 0
count.value++ // 触发更新
user.value.name = 'React' // 也触发更新
```

### 3. computed() - 计算属性

```typescript
const count = ref(0)

// 只读计算属性
const double = computed(() => count.value * 2)

// 可写计算属性
const fullName = computed({
  get() {
    return firstName.value + ' ' + lastName.value
  },
  set(newValue) {
    ;[firstName.value, lastName.value] = newValue.split(' ')
  }
})
```

### 4. effect() - 副作用函数

```typescript
const state = reactive({ count: 0 })

// 当 state.count 变化时，effect 会重新执行
effect(() => {
  console.log('Count is:', state.count)
})

state.count++ // 输出: Count is: 1
```

### 5. 工具函数

```typescript
// 检查类型
isRef(value) // 是否为 ref
isReactive(value) // 是否为响应式对象

// 类型转换
unref(value) // 获取 ref 的值
toRef(obj, 'key') // 对象属性转 ref
toRefs(obj) // 对象所有属性转 ref
```

## 🚀 核心实现原理

### 1. 响应式对象 (reactive.ts)

```typescript
// 使用 Proxy 代理原始对象
const proxy = new Proxy(target, {
  get(target, key, receiver) {
    const result = Reflect.get(target, key, receiver)
    track(target, 'get', key) // 依赖收集
    return isObject(result) ? reactive(result) : result
  },
  set(target, key, value, receiver) {
    const result = Reflect.set(target, key, value, receiver)
    trigger(target, 'set', key, value) // 触发更新
    return result
  }
})
```

### 2. 依赖收集与触发 (effect.ts)

```typescript
// 依赖收集：建立 响应式数据 -> effect 的映射
function track(target, type, key) {
  if (activeEffect) {
    let depsMap = targetMap.get(target)
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()))
    }
    let dep = depsMap.get(key)
    if (!dep) {
      depsMap.set(key, (dep = new Set()))
    }
    dep.add(activeEffect)
  }
}

// 依赖触发：执行所有相关的 effect
function trigger(target, type, key, newValue) {
  const depsMap = targetMap.get(target)
  if (depsMap) {
    const dep = depsMap.get(key)
    if (dep) {
      dep.forEach(effect => effect())
    }
  }
}
```

### 3. Ref 实现 (ref.ts)

```typescript
class RefImpl {
  constructor(value, isShallow) {
    this._value = isShallow ? value : toReactive(value)
  }

  get value() {
    track(this, 'get', 'value') // 收集依赖
    return this._value
  }

  set value(newValue) {
    if (hasChanged(newValue, this._value)) {
      this._value = toReactive(newValue)
      trigger(this, 'set', 'value', newValue) // 触发更新
    }
  }
}
```

### 4. Computed 实现 (computed.ts)

```typescript
class ComputedRefImpl {
  constructor(getter, setter) {
    this.effect = effect(getter, {
      lazy: true, // 懒执行
      scheduler: () => {
        // 依赖变化时的调度
        this._dirty = true
        trigger(this, 'set', 'value')
      }
    })
  }

  get value() {
    if (this._dirty) {
      this._dirty = false
      this._value = this.effect() // 重新计算
    }
    track(this, 'get', 'value') // 收集依赖
    return this._value
  }
}
```

## 🎮 使用示例

```typescript
import { reactive, ref, computed, effect } from '@vue/reactivity'

// 1. 创建响应式数据
const state = reactive({
  count: 0,
  todos: []
})

const message = ref('Hello Vue!')

// 2. 创建计算属性
const doubleCount = computed(() => state.count * 2)
const todoCount = computed(() => state.todos.length)

// 3. 创建副作用
effect(() => {
  console.log(`消息: ${message.value}`)
  console.log(`计数: ${state.count}, 双倍: ${doubleCount.value}`)
  console.log(`待办数量: ${todoCount.value}`)
})

// 4. 触发更新
state.count++ // 触发 effect 重新执行
message.value = 'Hello Reactivity!' // 触发 effect 重新执行
state.todos.push({ text: '学习Vue3' }) // 触发 effect 重新执行
```

## 🔍 调试技巧

### 1. 查看依赖关系

```typescript
// 在浏览器控制台中
console.log(targetMap) // 查看全局依赖映射
```

### 2. 追踪 effect 执行

```typescript
effect(() => {
  console.log('Effect 执行中...')
  console.log('当前 activeEffect:', activeEffect)
  console.log('状态:', state.count)
})
```

## ⚠️ 注意事项

1. **这是简化实现**：缺少官方版本的很多优化和边界处理
2. **仅用于学习**：不建议在生产环境使用
3. **TypeScript 警告**：有一些类型警告是正常的，不影响功能
4. **浏览器兼容性**：需要支持 Proxy 的现代浏览器

## 🎓 学习路径

1. **先理解概念**：响应式、依赖收集、副作用
2. **阅读源码**：按照 effect.ts → reactive.ts → ref.ts → computed.ts 的顺序
3. **动手实验**：修改代码，添加 console.log 观察执行流程
4. **对比官方**：理解简化版与官方版的差异

## 🚀 下一步扩展

- [ ] 实现 watch/watchEffect
- [ ] 添加 stop/pause/resume effect
- [ ] 实现 nextTick
- [ ] 添加开发工具集成
- [ ] 性能优化和错误处理

---

通过这个简化实现，你可以深入理解 Vue 3 响应式系统的核心原理！🎉
