---
title: 服务组合推荐算法研究笔记
description: 基于服务协作关系的推荐算法构思，结合 FP-growth 与 MOEA 优化
pubDate: '2021-07-01T00:00:00.000Z'
tags:
  - 服务推荐
  - MOEA
draft: false
---

## 参考文献

1. Compatibility-Aware Web API Recommendation for Mashup Creation via Textual Description Mining
   - Qi L, Song H, Zhang X, et al. ACM Transactions on Multimedia Computing Communications and Applications, 2021

2. Manufacturing service recommendation method toward industrial internet platform considering the cooperative relationship among enterprises
   - Wang, Lei, et al. Expert Systems with Applications 192 (2022): 116391

## 初步构思

### 服务与任务调用关系

构建二部图 → 迭代出相似度矩阵。

任意服务间的相似度 SR（包括不频繁项）可通过以下方式计算：

### FP-growth 提取频繁项

从服务组合中提取频繁共现的服务集合。

### 服务组合相似度计算

不同服务组合中服务的相似度情况：

| 场景 | 说明 |
|------|------|
| A 和 B 历史上协作过 | 都是频繁项 |
| A 和 B 历史上协作过 | 部分是频繁项 |
| A 和 B 部分在历史中协作过 | 协作过的部分是频繁项 |
| A 和 B 部分在历史中协作过 | 都不是频繁项 |
| A 和 B 没有历史协作 | 部分频繁项 |
| A 和 B 没有历史协作 | 没有频繁项 |

### 评价算法

内部频繁项个数 + 相似度评价服务组合相似度：

- 频繁项权重直接 +1
- 不频繁项取与组合中频繁项的最大相似度（<1）
- 除以两个服务组合中的所有服务个数

### 结合 MOEA

结合多目标进化算法（MOEA）找出：

- 高 QoS（在帕累托前沿）
- 高内联协作度的服务组合