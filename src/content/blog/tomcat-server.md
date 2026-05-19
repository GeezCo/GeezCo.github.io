---
title: Tomcat-Server
description: ''
pubDate: '2026-05-15T08:29:00.000Z'
tags: []
draft: false
---
很多java web新手都遇到的错误:

tomcat报错:
{% note bug description :%}

The origin server did not find a current representation for the target resource or is not willing to disclose that one exists.
{% endnote %}

打开`https://localhost:8080`依旧如此

解决办法:
{% tabs Solution %}

- 将服务器从eclipse的配置中删掉,重新添加新的服务器 双击.
- server locations 可选,勾选中间一个.

**如果错误依旧存在 点第二步**

若把jsp 文件 放到 WebContent 下面的文件夹里面 。

你的访问路径应该为: `localhost:8080/你的项目名称/你的放jsp的文件夹/jsp文件名称.jsp`

例子: localhost:8080/JSTLTest/jsp/JSTLTest.jsp

解释: 第一个JSTLTest为项目名称,jsp为WebContent下的文件夹,专门存放jsp文件的.第二个JSTLTest为文件名.需要加后缀。

{% endtabs %}

{% note danger %}
注意: **WEB-INF文件下的jsp文件是不能直接访问到的.因此要把jsp文件挪到WebContent文件下。**
{% endnote %}

[regular::返回csdn原文:: fa-play-circle](https://blog.csdn.net/qq_36296239/article/details/78627140::fa-solid)
