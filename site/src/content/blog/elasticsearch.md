---
title: ElasticSearch 启动常见系统限制修复
description: ES 启动时的文件描述符、线程数、虚拟内存三大限制的排查与修复，以及背后的 Linux 系统管理原理
pubDate: '2023-01-18T08:29:00.000Z'
tags:
  - ElasticSearch
  - Linux
draft: false
---

## 启动报错全貌

首次安装 ElasticSearch 后启动，通常会看到三条错误：

```text
[1] max file descriptors [4096] for elasticsearch process is too low,
    increase to at least [65536]
[2] max number of threads [1889] for user [adam] is too low,
    increase to at least [4096]
[3] max virtual memory areas vm.max_map_count [4096] is too low,
    increase to at least [65536]
```

三条错误的本质：ES 是一个重度使用系统资源的 Java 进程，操作系统的默认限制对它来说是瓶颈。

## 为什么 ES 需要这么多资源

### 文件描述符（65536）

ES 的每个分片都是一组 Lucene 索引文件。一个节点可能有几十个分片，每个分片由几十个 Segment 文件组成。加上网络连接、mmap 的文件映射——ES 同时打开的文件数量远超普通应用。

默认 4096 的限制来源于 Linux 内核的历史安全策略：防止单个进程消耗太多文件句柄影响其他进程。ES 不是普通进程，这个限制得放行。

### 线程数（4096）

引用官方文档：

> Elasticsearch uses a number of thread pools for different types of operations. It is important that it is able to create new threads whenever needed.

ES 内部有多个线程池：search、index、bulk、get、snapshot 等。每个线程池有自己的线程数配置。网络线程、Lucene 后台合并线程加起来，轻松超过默认的 1024。

### 虚拟内存区域（65536）

Elasticsearch 默认使用 mmapfs 来存储索引——把索引文件映射到虚拟地址空间，用操作系统的页缓存替代 JVM 堆缓存。

Lucene 不依赖 JVM 堆来缓存索引数据，而是把索引文件 mmap 到进程的虚拟地址空间，让 OS 的 page cache 管理冷热数据。每个 mmap 区域消耗一个 vm_area_struct——默认 65530 不够。

## 修复步骤

### 1. 文件描述符 + 线程数

编辑 `/etc/security/limits.conf`：

```text
elasticsearch  soft  nofile  65536
elasticsearch  hard  nofile  65536
elasticsearch  soft  nproc   4096
elasticsearch  hard  nproc   4096
```

- `soft`：当前会话的软限制，用户可以自行调整
- `hard`：上限，用户无法超越
- `nofile`：打开文件数
- `nproc`：进程/线程数

退出重新登录生效。用 `ulimit -Hn` 和 `ulimit -Hu` 验证。

也有人被 `/etc/security/limits.d/90-nproc.conf` 覆盖：

```text
# 将 soft nproc 1024 改为 4096
soft nproc 4096
```

limits.d 下的配置文件优先级更高，如果 limits.conf 改了不生效，查这里。

### 2. 虚拟内存

临时生效：

```bash
sysctl -w vm.max_map_count=262144
```

永久生效，编辑 `/etc/sysctl.conf`：

```text
vm.max_map_count=262144
```

执行 `sysctl -p` 加载。

### 3. 如果你用 systemd

systemd 管理的服务，limits.conf 对它无效。需要在 service 文件中声明：

```ini
[Service]
LimitNOFILE=65536
LimitNPROC=4096
```

ES 的 RPM/DEB 包自带的 service 文件已经配好了，手动安装才需要注意。

## 验证

```bash
# 切换到 ES 用户
su - elasticsearch

# 验证 limits
ulimit -Hn    # 应该 >= 65536
ulimit -Hu    # 应该 >= 4096

# 验证 vm
sysctl vm.max_map_count  # 应该 >= 262144

# 启动
./bin/elasticsearch
```

## 总结

三个限制不是 ES 的 bug，而是它作为高性能搜索引擎对底层 Linux 资源的合理需求。理解了 mmap + Lucene + 线程池的架构后，这些配置就都是合理的。