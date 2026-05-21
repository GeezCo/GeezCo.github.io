---
title: ElasticSearch 用户指南
description: ElasticSearch 全文检索原理、索引库操作、Mapping 与 Settings 配置详解
pubDate: '2026-05-15T08:29:00.000Z'
tags:
  - ElasticSearch
  - 全文检索
draft: false
---

## 一、商品搜索专题

### 1.1 传统搜索的问题

大量数据检索时会产生索引失效问题：

- `LIKE` 查询失效（如 `%小米%`）
- `WHERE` 条件中 `OR` 左边是索引列、右边不是索引列会导致索引失效
- `SELECT *` 滥用

示例：

```sql
SELECT * FROM goods WHERE title LIKE '%小米%';
```

数据量庞大时性能急剧下降。

### 1.2 全文检索方案

#### 数据分类

| 类型 | 特点 | 示例 |
|------|------|------|
| 结构化数据 | 固定格式、有限长度、类型固定 | 数据库数据 |
| 非结构化数据 | 长度不固定、类型不固定、格式不固定 | 文本文件 |

#### 非结构化数据检索方案

- **顺序扫描**：性能差
- **全文检索**：划分词 → 建立索引 → 搜索索引

全文检索是"空间换时间"的策略。

#### 全文检索应用场景

- 搜索引擎（爬虫 + 分词 + 索引）
- 站内搜索（电商、社交平台、论坛）
- 磁盘文件搜索

#### 全文检索实现技术

| 技术 | 说明 |
|------|------|
| Lucene | Java 全文检索工具包（底层） |
| Solr | 基于 Lucene 的全文检索服务器 |
| ElasticSearch | 基于 Lucene，实时搜索性能更好 |

### 1.3 全文检索流程

#### 创建索引

1. **采集数据**：来自网站、磁盘、文本等
2. **分析数据**：关键词拆分、去标点、去停用词、大小写转换
3. **创建文档对象**：封装为 Document（相当于数据库行）
4. **创建索引库**：基于关键词（term）建立索引，存储关键词与 Document 的关系

#### 查询索引

1. **用户接口**：输入关键词或句子
2. **封装查询条件**：分词处理，指定查询 field
3. **执行查询**：在索引中查找关键词 → 找到 Document ID → 返回 Document
4. **结果处理**：关键词高亮、分页、相关度排序

![全文检索流程图](/images/be34b97d-1b48-4603-9462-8d638a554ccd.png)

## 二、ES 核心概念

### 2.1 与 MySQL 对应关系

| ElasticSearch | MySQL |
|---------------|-------|
| 索引库 | Database |
| Type（ES 7.x 已废弃） | Table |
| Document | Row |
| Field | Column |

### 2.2 RESTful API

基于 RESTful 接口管理索引库：

| HTTP 方法 | 操作 |
|-----------|------|
| PUT / POST | 创建 |
| DELETE | 删除 |
| POST / PUT | 更新 |
| GET | 查询 |

URL 格式：

```text
http://localhost:9200/{索引名称}
```

## 三、Mapping 配置

Mapping 定义文档格式：字段名称、数据类型、是否索引、是否存储、是否分词等。

建议先定义 Mapping 再添加数据。

### 3.1 创建 Mapping

**方法**：PUT

**URL**：`http://192.168.57.10:9200/blog/_mappings`

**请求体**：

```json
{
  "mappings": {
    "properties": {
      "id": {
        "type": "long"
      },
      "name": {
        "type": "text",
        "analyzer": "standard",
        "store": true,
        "index": true
      },
      "mobile": {
        "type": "keyword",
        "store": true,
        "index": true
      },
      "comment": {
        "type": "text",
        "analyzer": "standard",
        "store": true,
        "index": true
      }
    }
  }
}
```

**字段说明**：

- `type`：数据类型（text 支持分词，keyword 不支持分词）
- `analyzer`：分词器（standard 是默认分词器）
- `store`：是否存储文档完整内容（用于网页摘要展示）
- `index`：是否创建索引（有分词需求必须为 true）

## 四、Settings 配置

Settings 定义索引库的物理存储设置。

### 4.1 创建 Settings

**方法**：PUT

**URL**：`http://192.168.57.10:9200/blog/_settings`

**请求体**：

```json
{
  "mappings": {
    "properties": {
    }
  },
  "settings": {
    "number_of_shards": 5,
    "number_of_replicas": 1
  }
}
```

**重要说明**：

- `number_of_shards`：分片数量，创建后无法修改
- `number_of_replicas`：副本数量，可修改

## 五、文档操作

### 5.1 添加文档

**方法**：POST

**URL**：`http://192.168.57.10:9200/blog/_doc/{文档ID}`

**请求体**：

```json
{
  "id": 3,
  "title": "文章标题",
  "content": "文章内容"
}
```

### 5.2 删除文档

**方法**：DELETE

**URL**：`http://192.168.57.10:9200/blog/_doc/{文档ID}`

### 5.3 查询文档

**方法**：GET

**URL**：`http://192.168.57.10:9200/blog/_doc/{文档ID}`

## 六、分词说明

ES 默认分词器是 `standard`：

- 英文：按空格分词
- 中文：单字分词（每个汉字作为一个关键词）

如需更好的中文分词效果，可安装 IK 分词器插件。