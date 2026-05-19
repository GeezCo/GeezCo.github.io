---
title: 关于服务推荐相关的idea记录
description: ''
pubDate: '2021-07-01T00:00:00.000Z'
tags:
  - 思考
  - 开发
draft: false
---
### 文献标题: Compatibility-Aware Web API Recommendation for MashupCreation via Textual Description Mining

- Qi L, Song H, Zhang X, et al. Compatibility-aware web api recommendation for mashup creation via textual description mining[J]. ACM Transactions on Multimidia Computing Communications and Applications, 2021, 17(1s): 1-19.

### 报告文章: Manufacturing service recommendation method toward industrial internet platform considering the cooperative relationship among enterprises

- Wang, Lei, et al. “Manufacturing service recommendation method toward industrial internet platform considering the cooperative relationship among enterprises.” Expert Systems with Applications 192 (2022): 116391.

初步构思：

1. 服务和任务的调用关系 (二部图) -> 迭代出相似度矩阵

任意服务和服务之间的相似度SR(包括不频繁项目的相似度)可以由此计算 :

FP-growth -> 服务组合中服务的频繁项目
(可以是不同服务组合)

- 方法 : 不同服务组合中的服务之间的相似度:
有如下几种情况:
组合A和组合B的服务历史上协作过 且都是频繁项
组合A和组合B的服务历史上协作过 部分是频繁项
组合A和组合B的服务部分在历史中协作过 协作的过的部分服务是频繁项
组合A和组合B的服务部分在历史中协作过 都不是频繁项
组合A和组合B的服务都没有在历史中协作过 部分频繁项
组合A和组合B的服务都没有在历史中协作过 没有频繁项

评价算法: 内部频繁项服务的个数 + 相似度 评价服务组合之间的相似度
每两个服务组合分别遍历 是频繁项权重就直接 +1 , 不频繁项目取跟组合中频繁项目的最大相似度 (<1) / 两个服务组合中的所有服务个数.

2. 再去结合 MOEA 可以找出高Qos的(在帕累托前沿的) + 高内联协作度服务组合
