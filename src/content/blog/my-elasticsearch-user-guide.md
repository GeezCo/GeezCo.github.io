---
title: My-Elasticsearch-User-Guide
description: ''
pubDate: '2026-05-15T08:29:00.000Z'
tags: []
draft: false
---
1. 商品搜索专题

一、如何搜素？

大量数据检索的时候 会产生索引失效的问题

1)like 失效等情况…
参考文章: [mysql索引失效, 51cto的文章](https://www.51cto.com/article/702691.html)

2)where失效，or条件失效，or的左边索引列，右边不是索引列即会失效。

3)包括select * 的滥用

example : select * from goods where title like ‘%小米%’;
数据量庞大时，应该如何处理？

二、使用全文检索

1)数据的分类
1.结构化数据：
固定格式、有限长度、数据类型固定。
- 例如：数据库中的数据就是结构化数据。
2.非结构化数据：
长度不固定、数据类型不固定、格式不固定。
解决办法：
针对结构化数据 sql语句查询
非结构化数据:
1.顺序扫描 : 性能差
2.全文检索 : 划分词等 - 针对单词建立索引 - 对索引全文检索
先划分词然后查询索引的过程就叫做全文搜索，索引占用额外的磁盘空间 空间换时间
2)全文搜索应用场景
1.搜索引擎
爬虫之后的分词创建索引，搜索时直接搜索索引。
2.站内搜索
电商网站，各大社交平台、论坛等等
3.磁盘文件等等

3)如何实现全文检索
1.lucene 在java 中唯一可以使用的全文检索技术
基于java的全文检索工具包。（偏底层
2.Solr、Elasticsearch（底层是lucene
都是基于Lucene的全文检索服务器，独立运行，支持集群。
实时搜索 es性能更好

4）全文检索流程
一、创建索引
1.采集数据
各种来源的数据。(磁盘 网站 文本 图片url etc…)
2.分析数据
关键词拆分
去标点
去除停用词
转化大小写
得到单词列表
3.创建文档对象
把原始文档进行封装 Document对象（相当于一个数据库）
field：一个document可以有多个field 文件名 文件 等信息，并不是所有的field都需要分析 比如文件路径。
然后关键词拆分，取出标点符号去除重复词 转换大小写 最终得到一个单词列表
每个关键词都是一个term
4.创建索引库
基于关键词（term）创建索引
封装Document对象
索引库存放的是关键词和Document的关系
二、查询索引大致流程
1.用户接口
用户输入查询内容。
输入可以是一个关键词，也可以是一句话。
2.封装查询条件
需要把用户内容进行分词处理。
需要指定要查询的field
查询条件：
field ：value
遵循以上格式
3.执行查询
在索引中根据查询条件查询对应字段，找到对应关键词。
关键词存在就查询到结果，不存在就没结果。
根据关键词找到文档id，根据文档id找到document对象

![be34b97d-1b48-4603-9462-8d638a554ccd.png](/blog/be34b97d-1b48-4603-9462-8d638a554ccdpng)

```plain text
    4.结果中关键词部分高亮显示，分页处理，根据相关度进行排序
```

2.ES部分

1）对应关系：

ES ：索引库 -> (type)-> Document -> field

mysql ：Database -> table -> 行 -> 列

2）ES API的方法

基于restful接口管理的索引库：
方法（增删改查）：

```bash
put（post） 、delete 、post（put） 、get
```

url：

```bash
localhost:9200/{索引名称}
```

2. Mapping相关

就是索引文档中文档格式的定义：字段名称，对应的数据类型，是否索引，是否存储，是否分词等。

最好是先定义mapping 再添加数据，也可以直接添加让es自己根据document格式推断出mapping 定义。

1.创建mapping

方法:
PUT

url:
ip address:9200/{索引名称}/_mappings
例如: 192.168.57.10:9200/blog/_mappings
请求体:

```json
{
    "mappings":{
        // es6.x 版本之前有type字段:
        // "myblog":{},
        "properties":{
            //文档id 这个id可以更改 :
            "id" : {
                //id数据类型 long
                "type":"long"
            },
            //文档 名称：
            "name": {
                //名称数据类型 文本类型 分词功能只支持text类型 keyword也可以存储字符串但不能分词。
                "type":"text",
                // 默认分词器
                "analyzer":"standard",
                //document的整个内容是否展示给用户 展示就存储 （一般展示网页摘要
                "store":"true",
                // 是否为索引 true可以不加引号 有分词需求必须要创建索引 有些不需要 比如身份证号 手机号 不需要分词
                "index":true
            },
            //用户手机号
            "mobile":{
                "type":"keyword",
                "store":"true",
                "index":true
            },
            //备注
            "comment":{
                "type" : "text",
                "analyzer":"standard",
                "store" : "true",
                "index" : true
            }
        }
    }
}
```

3. Settings 相关
创建索引库的时候设置settings 属性。
1.创建Settings

方法:
PUT

url:
ip address:9200/{索引名称}/_settings
例如: 192.168.57.10:9200/blog/_settings
请求体:

```json
{
    "mappings": {
        // ...
    },
    "settings" : {
        //该索引库的分片数量 创建后无法修改
        "number_of_shards" : 5,
        //副本数量
        "number_of_replies": 1
    }
}
```

- 创建索引库之后分片数量不可以再修改了，只可以修改副本数量。

POST修改

ip address:9200/{索引名称}/_doc/{唯一的文件id}

请求体：

```json
{
    "id":3,
    "title":"hshshshshshs",
    "content" : "dnsinapkp"
    // etc
}
```

DELETE删除
url：ip address:9200/{索引名称}/_doc/{唯一的文件id}

GET搜索（根据url的唯一的_id取文档）
url：ip address:9200/{索引名称}/_doc/{唯一的文件id}

- Es 查找自动分词 默认分词器叫做standard 处理英文根据空格处理。处理中文是一个汉字一个关键词。
