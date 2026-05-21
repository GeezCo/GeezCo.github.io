---
title: ES-Kibana 整合版本冲突解决
description: 解决 Kibana 与 ElasticSearch 整合时出现的版本冲突问题
pubDate: '2026-05-18T01:26:00.000Z'
tags:
  - ElasticSearch
  - Kibana
draft: false
---

## 问题现象

Kibana 启动时报错：

```text
[error]...
[version_conflict_engine_exception]: [task:endpoint:user-artifact-packager:1.0.0]:
[task:Alerting-alerting_telemetry] and [task:apm-telemetry-task]
both are:
version conflict, document already exists (current version [xx])
etc...
```

## 问题分析

错误信息中提到 Document，这是 ES 中的索引库概念。说明是索引库版本不一致导致的冲突。

`task:apm-telemetry` 等应该是索引库的名称。尝试删除这些索引库后问题解决。

但在实际开发中，删除索引库可能不是最佳方案。

## 解决方案

### 方案一：删除冲突的索引库

如果可以接受数据丢失，直接删除冲突的索引库。

### 方案二：处理版本冲突

参考官方文档：

- [版本控制](https://www.elastic.co/guide/en/elasticsearch/guide/2.x/version-control.html#version-control)
- [乐观并发控制](https://www.elastic.co/guide/en/elasticsearch/guide/2.x/optimistic-concurrency-control.html#optimistic-concurrency-control)

使用版本号机制确保数据一致性。

## 问题排查优先级

从这个小 bug 学到了问题检索优先级：

```
官方文档 > 项目 GitHub Issue > 开源论坛
```

官方文档是最权威的参考来源。