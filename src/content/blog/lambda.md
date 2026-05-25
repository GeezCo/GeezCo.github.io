---
title: Java Lambda 与 Stream 编程实践
description: 从匿名内部类到 Lambda 的演进，Stream 流的创建方式、惰性求值原理与常见操作模式
pubDate: '2022-08-23T08:29:00.000Z'
tags:
  - Java
  - Lambda
draft: false
---

## 为什么要 Lambda？

Java 8 之前的集合操作：

```java
List<String> result = new ArrayList<>();
for (User user : users) {
    if (user.getAge() > 18) {
        result.add(user.getName());
    }
}
Collections.sort(result);
```

Java 8 之后：

```java
List<String> result = users.stream()
    .filter(u -> u.getAge() > 18)
    .map(User::getName)
    .sorted()
    .collect(Collectors.toList());
```

区别不只是代码量——后者描述的是"做什么"而不是"怎么做"，这就是函数式思维的核心。

## Lambda 本质：对函数式接口的语法糖

```java
// 匿名内部类（Java 7）
users.stream().filter(new Predicate<User>() {
    @Override
    public boolean test(User user) {
        return user.getAge() > 18;
    }
});

// Lambda（等价写法）
users.stream().filter(user -> user.getAge() > 18);

// 方法引用（更简洁）
users.stream().filter(User::isAdult);
```

编译器不会为 Lambda 生成单独的 class 文件——它用 invokedynamic 指令在运行时动态绑定，性能比匿名内部类好得多。

## Stream 流的三种创建方式

### 单列集合

```java
List<User> users = userService.listAll();
Stream<User> stream = users.stream();       // 顺序流
Stream<User> parallel = users.parallelStream(); // 并行流
```

### 数组

```java
Integer[] arr = {1, 2, 3, 4, 5};
Stream<Integer> s1 = Arrays.stream(arr);
Stream<Integer> s2 = Stream.of(arr);        // 等价
```

### 双列集合（Map）

Map 没有 stream() 方法，需要先转成单列：

```java
Map<String, Integer> scores = new HashMap<>();

// 方式一：entrySet
scores.entrySet().stream()
    .filter(e -> e.getValue() > 80)
    .forEach(e -> System.out.println(e.getKey()));

// 方式二：keySet / values
scores.keySet().stream().forEach(System.out::println);
scores.values().stream().mapToInt(Integer::intValue).average();
```

## 流操作的核心规则

```
源 → 中间操作(惰性) → 中间操作(惰性) → 终止操作(触发执行) → 结果
```

**惰性求值**：filter、map、sorted 这些中间操作不会立即执行，它们只是构建了一个"操作流水线"。只有当终止操作（collect、forEach、count）调用时，整个流水线才真正运行。

这意味着你可以在构建流水线时插入日志来理解执行顺序：

```java
stream.filter(u -> {
    System.out.println("filter: " + u.getName());
    return u.getAge() > 18;
}).map(u -> {
    System.out.println("map: " + u.getName());
    return u.getName();
}).collect(Collectors.toList());

// 输出是交替的：filter→map→filter→map→... 而不是 全部filter完再全部map
```

**流只能用一次**：一个 Stream 被终止操作消费后就关闭了，再操作会抛 IllegalStateException。

## 常用操作速查

| 操作 | 类型 | 说明 |
|------|------|------|
| `filter(Predicate)` | 中间 | 过滤 |
| `map(Function)` | 中间 | 转换类型 |
| `flatMap(Function)` | 中间 | 扁平化（一对多） |
| `distinct()` | 中间 | 去重（基于 equals） |
| `sorted()` | 中间 | 排序 |
| `limit(n)` / `skip(n)` | 中间 | 截取 / 跳过 |
| `peek(Consumer)` | 中间 | 调试用，不改变元素 |
| `forEach(Consumer)` | 终止 | 遍历（不保证顺序在并行流中） |
| `collect(Collector)` | 终止 | 收集为集合 |
| `reduce(identity, BinaryOperator)` | 终止 | 归约 |
| `anyMatch/allMatch/noneMatch` | 终止 | 短路匹配 |

## flatMap 的妙用

```java
// 订单包含多个商品 → 统计所有商品的总数量
List<Order> orders = getOrders();
int totalItems = orders.stream()
    .flatMap(order -> order.getItems().stream())  // 订单→商品 的一对多展开
    .mapToInt(Item::getQuantity)
    .sum();
```

`map` 是一对一映射，`flatMap` 是一对多展开并"拍平"到一个流里。

## reduce：函数式编程的万能工具

```java
// sum 是 reduce 的特化
int sum = numbers.stream().reduce(0, (a, b) -> a + b);

// 求最大值
int max = numbers.stream().reduce(Integer.MIN_VALUE, Integer::max);

// 字符串拼接
String joined = words.stream().reduce("", (a, b) -> a + ", " + b);
```

collect、count、sum 等终止操作本质上都是 reduce 的特化形式。

## 总结

- Lambda = 函数式接口的语法糖 + invokedynamic 动态绑定
- Stream 中间操作是惰性的，终止操作触发执行
- 一个流只能消费一次
- map 是一对一，flatMap 是一对多展开
- 并行流有坑：线程池是共享的 ForkJoinPool，IO 操作别用