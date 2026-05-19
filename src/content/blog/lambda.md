---
title: Lambda表达式
description: ''
pubDate: '2026-05-15T08:29:00.000Z'
tags: []
draft: false
---
来自java8的“新”特性…

# lambda in java

## 1.1 常见操作

### 1.1.1 创建流

单列集合 : 集合对象.stream();

```java
class Obj{
    propertie1;
    propertie2;
    ...etc...
}
public static void main(String[] args) {
    List<obj.class> listObj = getList();
    Stream<obj.class> streamObj = listObj.stream();
}
```

数组: Arrays.stream(数组对象) 或者使用 Stream.of创建

```java
    Integer[] arr = {1,2,3,4,5};
    Stream<Integer> stream1 = Arrays.stream(arr);
    Stream<Integer> stream2 = Stream.of(arr);
```

双列集合: 转换成单列集合在创建流(就是套娃)

```java
    Map<String, Integer> map = new HashMap<>();
        map.put("test1 " , 15);
        map.put("test2 " , 16);
        map.put("test3 " , 17);

        //把map 双列集合转换为单列集合
        Set<Map.Entry<String, Integer>> entrySet = map.entrySet();

        entrySet.stream().filter(new Predicate<Map.Entry<String, Integer>>() {
            @Override
            public boolean test(Map.Entry<String, Integer> stringIntegerEntry) {
                return stringIntegerEntry.getValue()>15;
            }
        }).forEach(new Consumer<Map.Entry<String, Integer>>() {
            @Override
            public void accept(Map.Entry<String, Integer> stringIntegerEntry) {
                System.out.println(stringIntegerEntry.getKey() + "===" + stringIntegerEntry.getValue());
            }
        });
```

### 1.1.2 中间操作
