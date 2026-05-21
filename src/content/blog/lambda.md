---
title: Java Lambda 表达式与 Stream 流
description: Java 8 Lambda 表达式基础、Stream 流创建与中间操作详解
pubDate: '2026-05-15T08:29:00.000Z'
tags:
  - Java
  - Lambda
draft: false
---

## Lambda 表达式简介

Lambda 是 Java 8 引入的函数式编程特性，简化匿名内部类写法。

## Stream 流

### 创建流

#### 单列集合

```java
List<Obj> list = getList();
Stream<Obj> stream = list.stream();
```

#### 数组

```java
Integer[] arr = {1, 2, 3, 4, 5};
Stream<Integer> stream1 = Arrays.stream(arr);
Stream<Integer> stream2 = Stream.of(arr);
```

#### 双列集合

双列集合需先转成单列集合：

```java
Map<String, Integer> map = new HashMap<>();
map.put("test1", 15);
map.put("test2", 16);
map.put("test3", 17);

// Map 转换为 Entry Set
Set<Map.Entry<String, Integer>> entrySet = map.entrySet();

// 传统写法
entrySet.stream()
    .filter(new Predicate<Map.Entry<String, Integer>>() {
        @Override
        public boolean test(Map.Entry<String, Integer> entry) {
            return entry.getValue() > 15;
        }
    })
    .forEach(new Consumer<Map.Entry<String, Integer>>() {
        @Override
        public void accept(Map.Entry<String, Integer> entry) {
            System.out.println(entry.getKey() + " === " + entry.getValue());
        }
    });

// Lambda 简化写法
entrySet.stream()
    .filter(entry -> entry.getValue() > 15)
    .forEach(entry -> System.out.println(entry.getKey() + " === " + entry.getValue()));
```

### 中间操作

常用中间操作：

- `filter()`：过滤
- `map()`：映射
- `sorted()`：排序
- `distinct()`：去重
- `limit()`：限制数量
- `skip()`：跳过

### 终止操作

- `forEach()`：遍历
- `collect()`：收集
- `count()`：计数
- `reduce()`：归约