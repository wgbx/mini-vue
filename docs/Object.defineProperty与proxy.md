---
title: Object.defineProperty VS proxy
date: 2024-01-10
tags:
  - vue
---

## 前言

本文是 vue3 源码解析系列的第一篇文章，这一章我们主要学习 vue3 源码中涉及到的一些核心 api，
后续的源码解读是非常复杂的，相关前置的基础知识一定要牢固，本章我们会详细解析以下 api

- Object.defineProperty
- Proxy
- Reflect
- WeakMap

## Object.defineProperty

### 介绍

在 Vue 的实例初始化阶段，Vue 会遍历 data 中的所有属性，并通过 Object.defineProperty 将这些属性全部转为 getter/setter。这样一来，当数据发生变化时，setter 会被自动调用

```javascript
// 假设有一个 Vue 实例
const vm = new Vue({
  data: {
    message: 'Hello, Vue!'
  }
});

// 遍历 data 中的所有属性
Object.keys(vm.$data).forEach(key => {
  let value = vm.$data[key];

  // 使用 Object.defineProperty 将属性转换为 getter 和 setter
  Object.defineProperty(vm, key, {
    get() {
      console.log(`Getting ${key}: ${value}`);
      return value;
    },
    set(newValue) {
      console.log(`Setting ${key} to: ${newValue}`);
      value = newValue;
    }
  });
});

// 测试 getter 和 setter
console.log(vm.message); // 访问 message 属性，触发 getter
vm.message = 'Hello, World!'; // 设置 message 属性，触发 setter
```

Object.defineProperty 是 ES5 中一个无法被 shim（模拟）的特性，因此 Vue 不支持 IE8 及更低版本的浏览器，除非使用 Polyfill

### 局限性

#### 属性添加与删除检测

当在已创建的实例化对象上动态添加或删除属性时，Vue 2 无法自动识别并转换这些新属性为响应式的，如果需要使新添加的属性也能触发视图更新，必须使用 Vue.set 或 this.$set 方法

#### 数组监控问题

Object.defineProperty 无法直接监听到数组元素通过索引赋值方式的变化，例如 array[index] = newValue。Vue 2 通过重写数组的某些内部方法（如 push、pop、shift、unshift、splice、sort、reverse）来间接处理这个问题，使得这些方法调用时能够触发视图更新

#### 深度监听的复杂性

若需要对嵌套对象的深层次属性进行响应式处理，Vue 2 需要递归地对嵌套结构中的每个属性使用 Object.defineProperty。这导致了深度监听的实现比较复杂，且性能消耗相较于浅层属性更高

#### 性能开销

对于大量数据项或深层嵌套对象，使用 Object.defineProperty 设置 getter 和 setter 方法会带来一定的性能损耗，特别是在大型应用中

## Proxy

### 介绍

Vue3 采用了 ES6 中的 Proxy 来监控数据的变化，所以 Vue3 只支持现代浏览器
Proxy 是 ES6 中新增的一个特性，它允许你创建一个对象的代理，从而可以拦截并重定义该对象上的基本操作，比如属性查找、赋值、删除等操作。通过 Proxy，你可以自定义对象的行为，实现更灵活和强大的操作
Proxy 的基本语法如下：

```javascript
let proxy = new Proxy(target, handler);
```

- target：要代理的目标对象。
- handler：一个对象，包含了钩子函数（也称为“陷阱”），用于拦截对目标对象的操作，通过在 handler 中定义相应的“陷阱”函数，可以拦截和重定义目标对象上的各种操作，例如：
- get：拦截属性的读取操作。
- set：拦截属性的赋值操作。
- deleteProperty：拦截属性的删除操作。
- apply：拦截函数的调用操作。

以下是一个简单的示例，演示了如何使用 Proxy 来拦截对象的属性读取和赋值：

```javascript
let target = {
  message: 'Hello, Proxy!'
};

const handler = {
  get: function(target, prop) {
    console.log(`Reading property ${prop}`);
    return target[prop];
  },
  set: function(target, prop, value) {
    console.log(`Setting property ${prop} to ${value}`);
    target[prop] = value;
  }
};

let proxy = new Proxy(target, handler);

console.log(proxy.message); // 会触发 get 拦截
proxy.message = 'Hello, World!'; // 会触发 set 拦截

```

在上面的示例中，我们创建了一个目标对象 target，然后通过 Proxy 创建了一个代理对象 proxy，并定义了 handler 对象来拦截属性的读取和赋值操作。当对 proxy 对象进行属性读取和赋值时，会触发相应的拦截操作，从而实现自定义的行为

### 优势性

#### 全面拦截

Proxy 可以拦截几乎所有对目标对象（Object，Array，Map，Set 等）的操作，比如读取属性（get）、设置属性（set）、删除属性（deleteProperty）、判断属性是否存在（has）、枚举属性（ownKeys）等
这意味着 Vue3 能够无缝地跟踪任何层次深度的对象属性的变化，无论是新增属性、删除属性，还是修改已有属性的值

#### 更高效的响应式

Vue3 无需通过递归遍历对象属性来实现响应式，使用 Proxy 可以在对象创建之初就直接为其创建一个响应式代理，此后对该对象的任何操作都将触发相应的“陷阱”（trap）函数，从而自动触发视图更新

#### 更好的数组处理

Vue3 中，借助 Proxy 可以更自然地处理数组索引的增删改查操作，无需再像 Vue2 那样重新定义数组的原型方法（如 push、pop、shift、unshift、splice 等）
即使直接通过索引修改数组元素，Vue3 也能准确捕捉到变化

#### 优化内存占用

Proxy 可以直接作用于对象本身，而非像 Object.defineProperty 那样只作用于对象的每个属性。这有助于减少内存开销，特别是在处理大量数据和深层嵌套对象时

## 响应式

### 无响应式

```javascript
// 假设我们创建一个简单的数据对象
const shoeInfo = {
  number: 3,
  price: 10,
};

// 计算总价
function calculateTotal(shoe) {
  return shoe.number * shoe.price;
}

// 初始化时计算总价值
let total = calculateTotal(shoeInfo);
console.log('初始化时的总价：', total); // 输出：30

// 修改数据
shoeInfo.number = 5;

// 再次输出总价值，预期会更新，但实际上未更新
console.log('数据变化后的总价：', total); // 输出：30（实际并未更新为50）
```

通过分析，我们第二次打印依旧是 30，虽然我们的 num 发生了变化，但是 total 已经被运算过，所以下一次获取 total 的值依旧是之前的值
那应该怎么做，才能实时的获取到当前最新的 total，也很简单，我们每次获取之间，手动重新重新计算一次

```javascript
// 假设我们创建一个简单的数据对象
const shoeInfo = {
  number: 3,
  price: 10,
};

// 计算总价
function effect(shoe) {
  return shoe.number * shoe.price;
}

// 初始化时计算总价值
let total = effect(shoeInfo);
console.log('初始化时的总价：', total); // 输出：30

// 修改数据
shoeInfo.number = 5;

// 重新计算并输出总价值
total = effect(shoeInfo);
console.log('数据变化后的总价：', total); // 输出：50
```

我们增加 effect 方法来手动触发依赖，这样我们实现了需求，预期值是我们更新数据后的值
但是这样手动触发的方式，在真实业务中过于繁琐，难以维护，本质上依旧是命令式思维
如何实现值的修改，后续逻辑的自动执行呢？

### vue2 的解决方案

通过 Object.defineProperty 来对字段进行代理，通过 set，get 方法，完成逻辑的自动触发

```javascript
let number = 3
const shoeInfo = {
  number: number,
  price: 10,
};
let total = 0
function effect() {
  console.log('开始计算', shoeInfo)
  total = shoeInfo.number * shoeInfo.price
}
// 被代理的值无法不可再get中使用了 因为会触发set的死循环
// 所以,必须增加一个变量来做被代理的值,shoeInfo.number的get set内部实际修改和读取的都是number
Object.defineProperty(shoeInfo, 'number', {
  set(newVal) {
    number = newVal
    effect()
  },
  get() {
    return num
  },
})
```

我们再以上代码，再次修改 shoeInfo.num，将触发代理中的 set，进而触发 effect，实现依赖的自动触发，vue2 的底层也正是如此实现的，这样看起来我们的需求已经解决了，但他存在局限性，我们在 Object.defineProperty 已经详细介绍了
object.defineProperty 只能监听到指定对象的指定属性的 get set，这些工作其实是 vue 初始化阶段完成，所以指定对象的指定元素发生变化的时候，我们可以监听到变化，vue 中也确实是这么表现的
但是如果，我们在指定对象上面新增属性，object.defineProperty 是无法监听到的，无法监听则无法处理被新增的字段，自然字段就不具备响应式
在 vue2 中，如果想解决以上问题，需要使用 Vue.$set 进行手动增加响应式字段，解决无法监听到字段新增的问题

### vue3 的解决方案

vue3 中改用了 proxy，为什么响应式核心 api 做了修改，proxy 是什么？我们先实现一个类似 vue2 的案例

```js
const shoeInfo = {
  number: 3,
  price: 10,
};

let shoeInfoProxy = new Proxy(shoeInfo, {
  // target 被代理对象 key 本次修改的对象中的键 newValue 修改后的值 receiver 代理对象
  set(target, key, newValue, receiver) {
    console.log('触发了写入事件')
    shoes[key] = newValue
    effect()
    return true
  },
  // target 被代理对象 key 本次读取的值 receiver 代理对象
  get(target, key, receiver) {
    console.log('触发了获取事件')
    return shoes[key]
  },
})

let total = 0
function effect() {
  console.log('开始计算', shoeInfo)
  // 如果使用被代理对象本身shoeInfo,这不会触发
  // 如果使用代理对象shoeInfoProxy,则这里会触发proxy的get事件
  total = shoeInfo.number * shoeInfo.price
}
```

通过以上代码，我们可以看到一些差别
object.defineProperty

- 代理的并非对象本身，而是对象中的属性
- 只能监听到对象被代理的指定属性，无法监听到对象本身的修改
- 修改对象属性的时候，是对原对象进行修改的，原有属性，则需要第三方的值来充当代理对象

proxy

- proxy 针对对象本身进行代理
- 代理对象属性的变化都可以被代理到
- 修改对象属性的时候，我们针对代理对象进行修改

无论是逻辑的可读性，还是 API 能力上，proxy 都比 object.defineProperty 要强很多，这也是 vue3 选择 proxy 的原因。

## Reflect

在 vue3 的源码中的 @vue/reactivity 中，我们会经常看到在 proxy 的 set、get 中存在 Reflect 的身影，但是从我们上面对 proxy 的使用来看，赋值 读取都实现了，为什么 vue3 中还是使用了 Reflect 呢

### 介绍

Reflect 是一个内置的 JavaScript 对象，它主要用于提供一组静态方法，这些方法与对象操作相关，并且与 Proxy 对象的方法相对应。Reflect 的方法可以用于执行常见的对象操作，比如属性的获取、设置、删除，以及原型链的操作等

#### 反射操作的标准化

它提供了一组与诸如 Object.defineProperty、Object.getPrototypeOf 等现有对象操作方法对应的标准 API，增强了这些操作的一致性和可预测性

#### 拦截操作

通过 Reflect 的方法，开发者可以更容易地拦截和控制对象属性的访问、修改、删除等操作，这对于实现自定义对象行为，如数据绑定、代理模式等尤为有用

#### 错误处理

许多 Reflect 方法会返回一个表示操作结果的布尔值，而不是在失败时抛出异常，这让错误处理更加清晰和可控

#### 函数式风格

Reflect 的所有方法都可以像普通函数那样调用，而不必使用 new 关键字或作为对象方法调用，这与 Object 上的一些方法形成了对比

### 实践

似乎比较难理解，我们举个例子吧

```js
let obj = {
  num:10
}
obj.num // 10
Reflect.get(obj,'num') // 10
```

这么来看，似乎这个 api 很普通啊，反而把简单的读取值写复杂了
这时候我们就要提一下 Reflect.get 的第三个参数了

```js
// receiver 如果target对象中指定了propertyKey，receiver则为getter调用时的this值
Reflect.get(target, propertyKey, receiver])
```

这次我们知道了，第三个参数 receiver 具有强制修改 this 指向的能力，接下来我们来看一个场景

```js
let data = {
  name: '张三',
  age: '12岁',
  get getUsrInfo() {
    return this.name + this.age
  }
}

let dataProxy = new Proxy(data, {
  get(target, key, receiver) {
    console.log('属性被读取')
    return target[key]
  }
})
console.log(dataProxy.getUsrInfo)
```

打印情况如下

```js
属性被读取
张三12岁
```

dataProxy.getUsrInfo 的 get 输出的值是正常的，但是 get 只被触发了一次，这是不正常的
因为 getUsrInfo 里面还读取了被代理对象 data 的 name、age，理想情况应当是 get 被触发三次。
为什么会出现这样的情况呢，这是因为调用 getUsrInfo 的时候，this 指向了 data，实际执行的是 data.getUsrInfo，此时的 this 指向 data，而不是 dataProxy，此时 get 自然是监听不到 name、age 的 get 了
这时候我们就用到了 Reflect 的第三个参数，来重置 get set 的 this 指向

```javascript
let dataProxy = new Proxy(data, {
  get(target, key, receiver) {
    console.log('属性被读取')
    return Reflect.get(target, key, receiver)
    // return target[key]
  }
})
```

打印情况如下

```javascript
属性被读取
属性被读取
属性被读取
张三12岁
```

现在打印就正常了，get 被执行的 3 次，此时的 this 指向了 dataProxy，Reflect 很好的解决了以上的 this 指向问题
通过以上案例，我们可以看到使用 target[key] 有些情况下是不符预期的，比如案例中的被代理对象 this 指向问题，而使用 Reflect 则可以更加稳定的解决这些问题，在 vue3 源码中也确实是这么用的

## WeakMap

### 介绍

WeakMap 是 JavaScript 中的一种特殊的映射数据结构，它是 ES6（ECMAScript 2015）引入的标准库的一部分。不同于常规的 Map 对象，WeakMap 存储的键必须是对象类型，并且它对这些键的引用是弱引用（weak reference）

#### 弱引用特性

- 当一个对象只有 WeakMap 中的键引用时，JavaScript 的垃圾回收机制（GC）仍然可以回收该对象，因为 WeakMap 中的键不会阻止对象被当作不可达对象清理。这意味着当一个对象的所有其他引用都被释放，即使它还在 WeakMap 中作为键，该对象仍会被垃圾回收

#### 特性与限制

- WeakMap 的键只能是对象，不能是字符串、数字或者其他原始类型。如果试图用非对象作为键，会抛出错误
- WeakMap 是不可迭代的，不支持 forEach、keys、values 和 entries 方法，也不能通过 for...of 循环遍历
- 由于其弱引用特性，WeakMap 的大小会随着键对象的生命周期变化而变化，因此它没有 .size 属性来获取当前键值对的数量

#### 应用场景

- WeakMap 常用于在不干扰垃圾回收的情况下，为特定对象存储私有数据或者元数据
- 在某些情况中，它可以帮助防止内存泄漏，尤其在那些需要临时关联对象和额外数据，但又不希望数据生命周期超过对象本身的场景

### 实践

```js
// Map
let obj = {
  name: '张三'
}
let map = new Map()
map.set(obj, 'name')
obj = null // obj的引用类型被垃圾回收
console.log(map) // map中key obj依旧存在
```

```js
// WeakMap
let obj = {
  name: '张三'
 }
let map = new WeakMap()
map.set(obj, 'name')
obj = null // obj的引用类型被垃圾回收
console.log(map) // weakMap中key为obj的键值对已经不存在
```

通过以上案例我们可以了解到

- 弱引用在对象与 key 共存场景存在优势，作为 key 的对象被销毁的同时，WeakMap 中的 key value 也自动销毁了。
- 弱引用也解释了为什么 weakMap 的 key 不能是基础类型，因为基础类型存在栈内存中，不存在弱引用关系；

在 vue3 的依赖收集阶段，源码中用到了 WeakMap，具体什么作用？我们在接下来的源码分析中进行解答

## 结语

通过本篇文章，我们认识到了 object.defineProperty 相较于 proxy 的劣势，以及搭配 proxy 同时出现的 Reflect 的原因，还有一个 Map 的原生的 API，WeakMap 的作用

接下来我们就可以正式走进 vue3 源码分析的世界
