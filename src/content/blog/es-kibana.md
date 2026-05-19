---
title: ES-Kibana整合
description: ''
pubDate: '2026-05-18T01:26:00.000Z'
tags: []
draft: false
---
console info:

```plain text
[error]...
[version_conflict_engine_exception]:[task:endpoint:user-artifact-packager:1.0.0]:
[task:Alerting-alerting_telemetry]and[task:apm-telemetry-task]
both are:
version conflict, document already exists (current version [xx])
etc...
```

突然意识到Document 是ES中的索引库啊，那说明是索引库版本不一致咯前面的 task:apm-telementry 等等应该是索引库的名字 我给他删除了一下试了试，成功了。
但是如果是实际的开发工作中遇到这种情况，也不能删掉索引库的情况，该怎么办呢？

所以我来看官网了。

[如何处理版本冲突](https://www.elastic.co/guide/en/elasticsearch/guide/2.x/version-control.html#version-control)

[乐观并发控制](https://www.elastic.co/guide/en/elasticsearch/guide/2.x/optimistic-concurrency-control.html#optimistic-concurrency-control)

也算是从这个一个小bug 里面学到了如何检索自己的问题 如何排检索优先级：

官方文档 >> 该项目的Github issue > 各开源论坛

今天先写到这 先不排版了。
