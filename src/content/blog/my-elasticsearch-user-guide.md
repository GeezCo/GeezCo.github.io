---
title: ElasticSearch 用户指南：从索引原理到生产配置
description: ES与MySQL的概念映射、Mapping与Settings配置、文档CRUD操作、分词器原理及IK分词器安装，适合ES入门到生产
pubDate: '2023-02-09T08:29:00.000Z'
tags:
  - ElasticSearch
  - 全文检索
draft: false
---

## 为什么需要全文检索？

### SQL LIKE 的边界

```sql
SELECT * FROM goods WHERE title LIKE '%小米手机%';
```

这条 SQL 在生产环境的真实表现：
- `%` 开头导致索引失效，全表扫描
- 数据量到达百万级别时，查询耗时从毫秒跳到秒级
- 并发一上来，数据库连接池直接打满

全文检索解决的不是"能不能搜"的问题，而是**能不能在数据量增长 100 倍后还能搜**的问题。

### 数据分类：搜索策略的分水岭

| 类型 | 存储形态 | 搜索方式 |
|------|---------|---------|
| 结构化 | MySQL 行 → 固定列 | SQL `WHERE id = 123` |
| 非结构化 | 文章正文、PDF、日志 | 全文检索 |

结构化数据靠索引，非结构化数据靠分词 + 倒排索引。

### 全文检索实现路线

- Lucene：Java 全文检索工具包，偏底层，直接使用需要管理 IndexWriter/Searcher/TokenStream
- Solr：Lucene 之上的搜索服务器，XML 配置驱动
- ElasticSearch：Lucene 之上，JSON REST API + 分布式架构，实时搜索性能大幅优于 Solr

三者关系类似：TCP 套接字(Lucene) → HTTP 服务器(Solr/ES)。ES 用 JSON over HTTP 取代了 Lucene 的 Java API。

## 倒排索引：全文检索的核心数据结构

```
文档1: "小米手机很好用"
文档2: "华为手机也不错"
文档3: "小米笔记本性价比高"

分词后建立倒排索引:
  小米     → [文档1, 文档3]
  手机     → [文档1, 文档2]
  华为     → [文档2]
  笔记本   → [文档3]
  性价比   → [文档3]
```

正排索引是"文档→词"，倒排索引是"词→文档"。搜索时就变成了：输入"小米手机" → 拆成"小米"+"手机" → 分别查倒排列表 → 交集 = 文档1。

## ES 与 MySQL 的概念映射

| ES | MySQL | 说明 |
|----|-------|------|
| Index | Database | 索引库 = 数据库 |
| Type（7.x 废弃） | Table | 8.x 中已完全移除 |
| Document | Row | JSON 文档 = 一行数据 |
| Field | Column | 字段 |
| Mapping | Schema | 字段类型定义 |
| Shard | 分表 | 水平拆分 |
| Replica | 从库 | 副本 |

ES 6.x 之前一个 Index 可以有多个 Type，7.x 开始逐步废弃，8.x 完全移除。现在的约定是一个 Index 只存一种类型的文档。

## RESTful API 全掌握

| 方法 | URL | 作用 |
|------|-----|------|
| PUT | `/my_index` | 创建索引 |
| DELETE | `/my_index` | 删除索引 |
| GET | `/my_index` | 查看索引信息 |
| POST | `/my_index/_doc` | 新增文档（ES 自动生成 ID） |
| PUT | `/my_index/_doc/1` | 新增或全量替换文档（指定 ID） |
| POST | `/my_index/_update/1` | 部分更新文档 |
| DELETE | `/my_index/_doc/1` | 删除文档 |
| GET | `/my_index/_doc/1` | 按 ID 查询文档 |
| POST | `/my_index/_search` | 搜索查询 |

## Mapping 配置

Mapping 定义了每个字段在索引中的行为。错误的 Mapping 会导致搜不出来、排序异常、内存暴增。

```json
{
  "mappings": {
    "properties": {
      "id": { "type": "long" },
      "title": {
        "type": "text",
        "analyzer": "ik_max_word",
        "search_analyzer": "ik_smart"
      },
      "price": { "type": "scaled_float", "scaling_factor": 100 },
      "tags": { "type": "keyword" },
      "created_at": { "type": "date", "format": "yyyy-MM-dd HH:mm:ss" }
    }
  }
}
```

### text vs keyword 的选择

| 场景 | 类型 | 原因 |
|------|------|------|
| 文章标题、正文（需要搜索） | text | 会被分词，支持全文搜索 |
| 标签、分类（需要精确匹配） | keyword | 不分词，用于过滤/聚合/排序 |
| 身份证号、手机号 | keyword | 不需要分词，用 term 精确查询 |
| 邮箱地址 | keyword | 虽然含 `@` 但也应该是 keyword |

**关键原则**：如果字段需要被"搜"（用户输入关键词匹配），用 text。如果字段需要被"查"（精确匹配 + 聚合统计），用 keyword。一个字段可以同时有 text 和 keyword 两种类型（multi-field）。

### 字段属性

- `index: true/false` — 是否建索引。不需要搜索的字段（如二进制数据）设为 false 节省磁盘
- `store: true/false` — 是否存储原始值。默认 false，ES 用 `_source` 字段存全量 JSON，通常不需要单独 store
- `doc_values: true/false` — 是否建立列式存储。用于排序和聚合，默认 true。text 字段默认 false
- `enabled: true/false` — 整个 object 是否被索引。设为 false 则这个字段完全不可搜索

## Settings 配置

索引库级别的基础设置：

```json
{
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 1,
    "refresh_interval": "30s",
    "max_result_window": 10000
  }
}
```

| 参数 | 说明 | 注意 |
|------|------|------|
| `number_of_shards` | 主分片数 | 创建后不可修改，预估好数据量 |
| `number_of_replicas` | 副本数 | 可动态修改 |
| `refresh_interval` | 刷新间隔 | 默认 1s，写入量大可调大 |

分片数计算公式：`分片数 ≈ 数据量(GB) / 30`。单个分片建议 10-50GB。太少无法充分利用集群算力，太多增加 Master 节点管理开销。

## 分词器

### standard 分词器的局限

```text
输入："我爱北京天安门"
standard 分词结果：我 | 爱 | 北 | 京 | 天 | 安 | 门
```

standard 分词器不认识中文词边界——把每个汉字当成一个 term。搜索"天安门"时，匹配的是"天"+"安"+"门"三个 term 的交集，噪音极大。

### 安装 IK 分词器

```bash
./bin/elasticsearch-plugin install https://github.com/medcl/elasticsearch-analysis-ik/releases/download/v7.17.0/elasticsearch-analysis-ik-7.17.0.zip
```

重启后：

```json
POST /_analyze
{
  "analyzer": "ik_max_word",
  "text": "我爱北京天安门"
}
```

结果：`我 | 爱 | 北京 | 天安门 | 天安 | 安门`

IK 智能分词器有两种模式：
- `ik_max_word`：最细粒度切分，召回率高，适合索引时使用
- `ik_smart`：粗粒度切分，精确度高，适合搜索时使用

最佳实践：索引用 ik_max_word，搜索用 ik_smart。

## 总结

- 倒排索引是全文检索的底层数据结构——词到文档的映射
- text 字段用于搜索，keyword 用于过滤和聚合
- 分片数不合理的代价比 indices 多 10% 磁盘严重得多
- 中文搜索必须装 IK 分词器，单字分词的结果是不可接受的