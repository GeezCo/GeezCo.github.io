---
title: Redis 缓存三大问题：穿透、击穿、雪崩
description: 深入分析缓存穿透、击穿、雪崩的产生原因及实战解决方案，包括布隆过滤器、互斥锁、集群策略
pubDate: '2022-09-11T08:29:00.000Z'
tags:
  - Redis
  - Java
draft: false
---

## 缓存为什么出问题？

一个典型的读请求链路：

```
请求 → 缓存(Redis) → 命中? → 返回
                     │
                     ↓ 未命中
                  数据库(MySQL) → 写入缓存 → 返回
```

当缓存"没挡住"请求时，流量直接砸到数据库上。根据"没挡住"的具体原因，分为三种场景。

## 缓存穿透：查不存在的数据

### 现象

```
用户反复查询 id=-1 的商品
  → Redis 查不到（根本没有这条数据）
  → 每次都要去 MySQL 查
  → MySQL 查了也没结果，返回空
  → Redis 也不会缓存空结果

攻击者利用这一点：大量请求不存在的 key，绕过缓存打穿数据库。
```

### 方案对比

**布隆过滤器（推荐）**：

```
布隆过滤器原理：
  存入 key="user:123" → hash1=3, hash2=7, hash3=11 → bit[3]=1, bit[7]=1, bit[11]=1
  查询 key="user:-1"  → hash1=2, hash2=5, hash3=9  → bit[2]=0 → 一定不存在

特点：
  - 说不存在的一定不存在（无假阴性）
  - 说存在的可能不存在（有假阳性，约 1-3%）
  - 位数组占用内存极小（1亿数据约 120MB）
```

实际用法：启动时把所有合法 key 写入布隆过滤器。请求到达时先过布隆过滤器，不存在的直接拒绝，不查 Redis 也不查 MySQL。

**缓存空值**：

```java
if (dbResult == null) {
    redis.set(key, "NULL", 60); // 缓存空值 60 秒
}
```

简单但有风险：如果攻击者生成大量不同不存在的 key，Redis 会被大量空值占满。

**两种方案结合**最稳妥：布隆过滤器做第一层拦截，缓存空值做兜底。

## 缓存击穿：热点数据过期

### 现象

```
某秒杀商品缓存刚好过期
  → 同一瞬间 1000 个请求到达
  → 全部缓存未命中
  → 1000 个线程同时去 MySQL 查同一条数据
  → 数据库瞬时压力爆炸
```

### 互斥锁方案

```java
public Product getProduct(String id) {
    String cacheKey = "product:" + id;
    String lockKey = "lock:product:" + id;
    
    Product product = redis.get(cacheKey);
    if (product != null) return product;
    
    // 获取分布式锁，只有拿到锁的线程去查数据库
    if (redis.setnx(lockKey, "1", 10)) {
        try {
            product = db.findById(id);          // 只有一条线程走到这里
            redis.set(cacheKey, product, 3600); // 更新缓存
        } finally {
            redis.del(lockKey);
        }
    } else {
        Thread.sleep(50);  // 没拿到锁的线程等一会儿再读缓存
        return getProduct(id);
    }
    return product;
}
```

关键点：用 `SETNX` 实现互斥，拿不到锁的线程休眠重试读缓存，避免大量线程同时打到数据库。

### 逻辑过期 + 异步更新

对热点数据不设 TTL（永不过期），在 value 中存一个逻辑过期时间。读取时发现"逻辑上过期了"就后台异步刷新，当前请求仍然返回旧数据。适合对一致性要求不高的热点场景。

## 缓存雪崩：大面积同时失效

### 现象

```
凌晨批量写入缓存，所有 key TTL = 86400（24小时）
  → 第二天凌晨，大量 key 同时到期
  → Redis 瞬间空了
  → 所有请求砸向 MySQL
  → 数据库宕机
```

### 应对策略

**TTL 加随机值**：

```java
int baseTTL = 3600;
int random = ThreadLocalRandom.current().nextInt(300); // 0-300 秒
redis.set(key, value, baseTTL + random);
```

这个简单的操作让缓存过期时间分散在 3600-3900 秒之间，不再扎堆失效。

**多级缓存**：

```
请求 → 本地缓存(Caffeine) → Redis → MySQL
```

本地缓存扛第一层，Redis 扛第二层，MySQL 只在两层缓存都失效时才被访问。

**熔断降级**：

```java
if (dbConnectionPool.getActive() > threshold) {
    throw new ServiceDegradedException("系统繁忙，请稍后重试");
}
```

Sentinel / Hystrix 在数据库连接池打满时直接拒绝请求，保证核心链路可用。用户体验比超时等待好得多。

**Redis 集群**：

单机挂了还有备机。Sentinel 做主从切换，Cluster 做分片。但注意——弱一致性模型下，切换瞬间可能读到旧数据。

## 选择合适的 Redis 客户端

| 客户端 | 特点 |
|--------|------|
| Jedis | 同步、简单、适合低并发 |
| Lettuce | 异步、线程安全、Spring Boot 默认 |
| Redisson | 分布式锁、布隆过滤器等高级功能封装 |

当前项目用 Redisson——它的分布式锁 API 封装了对 SETNX + Lua 脚本的细节，你只需：

```java
RLock lock = redisson.getLock("lock:product:123");
if (lock.tryLock(3, 10, TimeUnit.SECONDS)) {
    try { /* 业务逻辑 */ }
    finally { lock.unlock(); }
}
```

## 总结

| 现象 | 根因 | 关键手段 |
|------|------|---------|
| 穿透 | 查不存在的 key | 布隆过滤器 + 缓存空值 |
| 击穿 | 热点 key 过期 | 互斥锁 / 逻辑过期 |
| 雪崩 | 大量 key 同时过期 | TTL 加随机值 / 多级缓存 / 熔断 |