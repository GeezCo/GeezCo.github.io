---
title: 滴滴后端面试复盘：Java 基础、MySQL 与算法
description: 滴滴海外交易岗位三面面试记录与深度解析，涵盖 HashMap 原理、JVM 内存、并发编程、MySQL 引擎与索引、消息队列可靠性等核心考点
pubDate: '2023-07-12T08:29:00.000Z'
tags:
  - 面试
  - Java
  - MySQL
draft: false
---

## 面试背景

岗位：滴滴后端开发（海外交易业务），三面（技术 + 主管 + HR）

以下为完整问题列表 + 每道题的深度解析。

## 一面：Java 基础 + MySQL + 算法

### HashMap 和 Hashtable 区别

这个问题的本质是考察对 Java 集合框架演进的理解。

| 维度 | HashMap | Hashtable |
|------|---------|-----------|
| 线程安全 | 否 | 是（synchronized 方法级） |
| null 键/值 | 允许一个 null 键 + 多个 null 值 | 不允许任何 null |
| 初始容量 | 16 | 11 |
| 扩容 | 2 倍 | 2n+1 |
| 出现时间 | JDK 1.2 | JDK 1.0 |
| 推荐使用 | 是（需要线程安全用 ConcurrentHashMap） | 否（遗留类） |

核心区别：Hashtable 的线程安全是通过给每个方法加 `synchronized` 实现的——读操作也要等锁，性能极差。需要线程安全的 Map 应该用 `ConcurrentHashMap`——JDK 1.8 中它用 CAS + synchronized 锁单个桶，并发度远超 Hashtable。

### HashMap 扩容机制

**为什么需要扩容？**

HashMap 底层是数组 + 链表/红黑树。当元素数量超过 `capacity * loadFactor`（默认 16 * 0.75 = 12），碰撞概率急剧上升，链表变长，查询从 O(1) 退化为 O(n)。

**扩容过程**：

```
1. 新建一个 2 倍大小的数组
2. 遍历老数组的每个桶
3. 对桶中的每个节点重新计算 hash & (newCap - 1)
4. 因为 newCap 是 2 倍，节点的落位只有两种可能：
   - 原位（新索引 = 旧索引）
   - 原位 + oldCap
5. JDK 1.8 利用了这一点，避免了 JDK 1.7 中重新 hash 的开销
```

**JDK 1.7 vs 1.8 的差异**：

```
JDK 1.7: 头插法 → 并发扩容可能形成死循环（环形链表）
JDK 1.8: 尾插法 → 避免了死循环，多线程下数据覆盖仍存在
```

面试官问"头插法还是尾插法"就是在确认你是否知道 JDK 1.7 HashMap 死循环这个经典并发 bug。

### JVM 内存结构

```
JVM 运行时数据区：

┌───────────────────────────┐
│     程序计数器 (PC)        │  每个线程独立，指向当前执行的字节码
├───────────────────────────┤
│     Java 虚拟机栈          │  每个线程独立，栈帧 = 方法调用
│     ┌─────────────┐       │  存储局部变量表、操作数栈、返回地址
│     │  栈帧（方法A）│       │  -Xss 控制大小
│     │  栈帧（方法B）│       │
│     └─────────────┘       │
├───────────────────────────┤
│     本地方法栈             │  Native 方法调用
├──────────────┬────────────┤
│    堆 (Heap)              │  -Xms/-Xmx
│  ┌───────┬──────────┐    │  所有线程共享
│  │ 新生代│ 老年代    │    │  Minor GC 作用在新生代
│  │ E/S/S │          │    │  Full GC 作用在整个堆
│  └───────┴──────────┘    │
├───────────────────────────┤
│    方法区 / 元空间         │  -XX:MaxMetaspaceSize
│    类信息、常量池、        │  JDK 8+ 从永久代移到本地内存
│    静态变量、JIT 代码      │
└───────────────────────────┘
```

### 哪些区域会产生 OOM

| 区域 | 是否 OOM | 原因 |
|------|---------|------|
| 堆 | 会 | 对象太多，GC 回收不掉。`-Xmx` 设小或内存泄漏 |
| 虚拟机栈 | 会 | 递归太深或创建过多线程。`StackOverflowError` / `OOM: unable to create new native thread` |
| 方法区/元空间 | 会 | 动态生成类太多（CGLIB、动态代理、JSP）。`OOM: Metaspace` |
| 直接内存 | 会 | NIO 的 DirectByteBuffer 分配过多。`OOM: Direct buffer memory` |
| 程序计数器 | 不会 | 唯一不抛 OOM/StackOverflow 的区域 |

### 大文件写入会导致 OOM 吗

**分情况**：

- 一次性 `byte[] bytes = new byte[fileSize]` 读整个文件——文件足够大就 OOM
- 用 `BufferedInputStream` 分批读写——不会，因为每次只在内存中保留一小部分
- 大文件写回磁盘同理——用 `BufferedWriter` 或 `FileChannel.transferTo()` 避免把整个文件读进堆

**正确做法**：

```java
try (FileInputStream fis = new FileInputStream("large.txt");
     FileOutputStream fos = new FileOutputStream("output.txt");
     BufferedInputStream bis = new BufferedInputStream(fis);
     BufferedOutputStream bos = new BufferedOutputStream(fos)) {
    byte[] buffer = new byte[8192];
    int len;
    while ((len = bis.read(buffer)) != -1) {
        bos.write(buffer, 0, len);
    }
}
```

### GC 可达性分析

GC 不是看"哪些对象可以回收"，而是**从 GC Roots 出发，找所有不可达的对象**。

```
GC Roots 包括：
  - 虚拟机栈中引用的对象（局部变量）
  - 方法区静态属性引用的对象
  - 方法区常量引用的对象
  - 本地方法栈中引用的对象（Native 方法）
  - 被同步锁持有的对象

从这些 Roots 出发，沿着引用链往下走：
  - 能走到的 → 存活 → 不回收
  - 走不到的 → 不可达 → 标记为可回收
```

### wait 和 sleep 的本质区别

这个问题经常被问到，核心在于**锁的释放**：

| 维度 | `wait()` | `sleep()` |
|------|---------|-----------|
| 所属类 | Object | Thread |
| 锁的释放 | **释放锁** | **不释放锁** |
| 唤醒方式 | `notify()` / `notifyAll()` | 时间到自动醒 / `interrupt()` |
| 使用条件 | 必须在 synchronized 块中调用 | 任何地方 |
| 线程状态 | WAITING / TIMED_WAITING | TIMED_WAITING |

**核心区别**：线程 A 在 synchronized 块内调用 `wait()`，会释放锁并等待——其他线程可以进入 synchronized 块。线程 A 在 synchronized 块内调用 `sleep()`，虽然线程休眠了，但**锁没释放**——其他线程仍然进不来。

### volatile 关键字

volatile 解决的是**可见性**和**禁止指令重排**，不解决原子性。

```
可见性：
  线程A 修改 flag = true → 立即刷新到主内存
  线程B 读取 flag → 从主内存读，能看到最新值

禁止指令重排：
  普通变量：
    1. 分配内存
    3. 引用指向内存   ← 指令重排后可能在初始化前执行
    2. 初始化对象

  volatile 修饰：
    1. 分配内存
    2. 初始化对象     ← 被 volatile 前的 StoreStore 屏障保护
    3. 引用指向内存
```

**被 volatile 修饰的变量存储在哪？** 主内存（Heap）中。volatile 不是把变量移到别的地方，而是通过 CPU 缓存一致性协议（如 MESI）和内存屏障，保证写入立即从 CPU 缓存刷新到主内存，读取从主内存加载。

### MySQL 常见引擎及区别

| 维度 | InnoDB | MyISAM |
|------|--------|--------|
| 事务支持 | 支持 (ACID) | 不支持 |
| 锁粒度 | 行锁 + 表锁 + 间隙锁 | 仅表锁 |
| 外键 | 支持 | 不支持 |
| 崩溃恢复 | 支持 (redo log) | 不支持（崩溃后需修复表） |
| 索引结构 | B+ 树，聚簇索引 | B+ 树，非聚簇索引 |
| 数据存储 | `.ibd` 文件（表空间） | `.MYD` + `.MYI`（数据 + 索引分离） |
| 全文索引 | 5.6+ 支持 | 原生支持 |
| 推荐场景 | 99% 的生产环境 | 只读、日志归档、数据仓库 |

### 事务隔离级别

```
隔离级别由低到高：

READ UNCOMMITTED      ← 脏读 ✓  不可重复读 ✓  幻读 ✓
READ COMMITTED        ← 不可重复读 ✓  幻读 ✓
REPEATABLE READ (默认) ← 幻读 ✓（InnoDB 用 gap lock 避免了大部分）
SERIALIZABLE          ← 全部避免（锁表，性能最差）

InnoDB 的 REPEATABLE READ 通过 MVCC + 间隙锁，
实际效果接近 SERIALIZABLE，但性能好得多。
```

### B 树和 B+ 树区别

```
B 树（2-3 树）：
        [10, 20]           ← 非叶子节点也存数据
       /    |    \
    [5,8] [12,15] [25,30]

B+ 树（MySQL InnoDB）：
        [10, 20]           ← 非叶子节点只存 key
       /    |    \
    [5,8] [12,15] [25,30]  ← 叶子节点存全部数据
       ↘     ↘      ↘
    [双向链表连接所有叶子节点]
```

| 维度 | B 树 | B+ 树 |
|------|------|-------|
| 数据存储 | 非叶子节点也存 | 仅叶子节点存 |
| 叶子节点连接 | 不连接 | 双向链表连接 |
| 范围查询 | 需要中序遍历 | 链表直接遍历，效率高 |
| 非叶子节点容量 | 存储数据占空间 | 只存 key，一个节点可存更多 key |

MySQL 选 B+ 树的核心原因：范围查询效率。`SELECT * FROM t WHERE id BETWEEN 100 AND 200`——B+ 树找到 100 后顺着链表往后扫就行。

### 索引失效情况

```sql
-- 1. LIKE 以 % 开头
SELECT * FROM t WHERE name LIKE '%abc';  -- 索引失效

-- 2. 对索引列使用函数
SELECT * FROM t WHERE DATE(create_time) = '2023-01-01';  -- 索引失效

-- 3. 隐式类型转换
SELECT * FROM t WHERE phone = 13800138000;  -- phone 是 varchar，索引失效

-- 4. OR 两边不全有索引
SELECT * FROM t WHERE name = 'a' OR age = 20;  -- age 没索引 → 全表扫描

-- 5. 联合索引不满足最左前缀
CREATE INDEX idx_abc ON t(a, b, c);
SELECT * FROM t WHERE b = 1 AND c = 2;  -- 没有 a，索引失效

-- 6. 不等于 / NOT IN
SELECT * FROM t WHERE status != 1;      -- 大概率走全表扫描

-- 7. IS NULL / IS NOT NULL（取决于数据分布）
```

### MVCC 是什么

> 多版本并发控制——读写不阻塞的关键。

```
原理：
  每行数据有隐藏列：
    - DB_TRX_ID: 最后修改的事务 ID
    - DB_ROLL_PTR: 回滚指针，指向 undo log
    - DB_ROW_ID: 行 ID

  读操作（SELECT）不阻塞写操作（UPDATE），写操作也不阻塞读：
    - 读：通过 ReadView 找到自己该看到的快照版本
    - 写：创建新版本，旧版本保留在 undo log

  READ COMMITTED:     每次 SELECT 都生成新的 ReadView
  REPEATABLE READ:    事务开始时生成一次 ReadView，整个事务共用
```

### InnoDB 下有哪些 log

| Log | 作用 | 存储位置 |
|-----|------|---------|
| Redo Log | 崩溃恢复：物理日志，记录"哪个页修改了什么" | `ib_logfile0/1` |
| Undo Log | 事务回滚 + MVCC：逻辑日志，记录"改了之前是什么" | 表空间中 |
| Binlog | 主从复制 + 数据恢复：逻辑日志，记录 SQL 语句 | `mysql-bin.xxx` |
| Error Log | 错误信息 | `error.log` |
| Slow Query Log | 慢查询 | `slow.log` |

**Redo Log 的 `innodb_flush_log_at_trx_commit`**：
- `1`（默认）：每次提交刷盘，最安全
- `2`：每次提交写 OS 缓存，每秒刷盘，可能丢 1 秒数据
- `0`：每秒刷盘，可能丢最后几秒数据

## 二面：系统设计 + 算法

### 高 QPS 大流量应对方案

从请求链路逐层梳理：

```
CDN → 限流网关 → 负载均衡 → 应用层 → 缓存层 → 数据库

CDN:         静态资源不走服务器
限流网关:    令牌桶/漏桶，保护下游
负载均衡:    多实例水平扩展
应用层:      无状态 + 异步 + 线程池隔离
缓存层:      多级缓存（本地 + Redis）
数据库:      读写分离 + 分库分表 + 连接池
```

### MQ 消息可靠传递

```
生产者 → Broker → 消费者
  │        │        │
  │        │        └── 手动 ACK（处理完再确认）
  │        │
  │        └── 消息持久化 + 主从同步
  │
  └── 发送确认（publisher confirm）+ 事务消息
```

**Consumer 执行失败处理**：
- 重试 N 次
- 仍失败 → 死信队列 → 人工处理 + 告警
- 消费时做**幂等**（Redis 记录消费过的 msgId）

### LC 448：找到所有数组中消失的数字

```java
// 原地哈希：利用数组下标作为 hash 桶
public List<Integer> findDisappearedNumbers(int[] nums) {
    for (int i = 0; i < nums.length; i++) {
        int index = Math.abs(nums[i]) - 1;
        if (nums[index] > 0) {
            nums[index] = -nums[index];  // 标记出现过
        }
    }
    List<Integer> res = new ArrayList<>();
    for (int i = 0; i < nums.length; i++) {
        if (nums[i] > 0) res.add(i + 1);  // 没被标记 = 数字缺失
    }
    return res;
}
```

## 三面（主管）

主管面更多考察技术认知和眼界。

### 对 AI 的看法

这是 2023 年面试中越来越多出现的问题。核心不是要你对 AI 有什么深刻研究，而是看你是否关注技术趋势，是否能思考 AI 对软件工程的影响。

### MCP 是什么

> Model Context Protocol——Anthropic 发布的 LLM 与外部工具/数据源连接的开放协议。让 AI 能够通过统一接口调用数据库、API、文件系统等外部资源。

### LC 560：和为 K 的子数组

```java
public int subarraySum(int[] nums, int k) {
    Map<Integer, Integer> prefixSum = new HashMap<>();
    prefixSum.put(0, 1);
    int sum = 0, count = 0;
    for (int num : nums) {
        sum += num;
        count += prefixSum.getOrDefault(sum - k, 0);
        prefixSum.merge(sum, 1, Integer::sum);
    }
    return count;
}
```

### 候选人定级方向

- 0-3 年：能卷能沉淀，锚定业务成长
- 5-8 年：技术深度和领导力
- 8 年+：终局思维，看清业务终极形态和公司阶段

## 总结

一面偏基础——HashMap、JVM、MySQL 这些是后端面试的必考题。二面偏系统设计——高 QPS 应对和 MQ 可靠性，考察的是工程实践。三面看认知——对 AI 的看法、MCP 等技术趋势的理解，考察的是技术视野是否开阔。