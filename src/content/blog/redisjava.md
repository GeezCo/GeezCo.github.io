---
title: redis的java客户端
date: 2025-08-16T15:18:06.000Z
tags: []
categories:
  - 数据库
cover: null
description: ''
pubDate: '2026-05-15T08:29:00.000Z'
draft: false
---

### 配合官方文档食用更佳

- rediesson（[官方文档](https://github.com/redisson/redisson/wiki/%E7%9B%AE%E5%BD%95) ）

（逃离繁杂的加锁解锁操作，把精力放在业务功能实现上）

单服务器下sync(this)在本地加对象锁即可。

分布式情况略复杂

- 缓存穿透（大量访问不存在的key，缓存好像不存在）
（1）布隆过滤器
- 缓存雪崩（多个key到期同时失效，db压力大甚至服务器宕机）
加入随机时间（但实际开发中不需要 因为业务功能实现需要时间 再加随机时间可能弄巧成拙恰好一起到期）
    - 解决：
（1）分库分表读写分离
（2）熔断降级（达到流量阈值打回去 显示系统拥挤等）
（3）redis集群（弱一致性更常用些）
- 缓存击穿（单个热点key过期时间到）
（1）热点数据永不失效
（2）互斥锁
![9b420809-c290-4745-9c35-a39fd1eafdff.png](/images/9b420809-c290-4745-9c35-a39fd1eafdff.png)
