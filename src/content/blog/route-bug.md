---
title: Route-Bug
description: ''
pubDate: '2026-05-15T08:29:00.000Z'
tags: []
draft: false
---
跟上篇文章一样也是很多java web新手都遇到的错误:
`jsp跳转到Servlet 出现404路径错误:`

- 检查:

{% note red fa-bolt %}
jsp有交互操作时,路径应设置为`/项目名/Servlet名`
{% endnote %}
{% note red fa-bolt %}
,Servlet中dispatcher跳转到jsp页面时,也要写上`/文件夹名/jsp文件名`(默认情况.
{% endnote %}
之前遇到了一个问题，最后自己摸索着突然就搞清楚了。
问题就是：新建的动态web项目，发布到tomcat之后:

- jsp可以单独访问
- servlet可以单独访问

**但通过form表单跳转到servlet的类则出现404错误。**

反复研究了很久也没发现解决方案，可能这是个最基础的设置吧，根本没有人解答。

通过摸索,我发现最重要的一点就是servlet编译好之后生成的类,存放位置十分关键.

按照默认设置的话,类是存放在build/classes文件夹中的,

但是由于我们建立的jsp文件是存放在web-content文件夹中的，

所以jsp文件没法找到servlet生成的class文件。

{% notel red 解决办法:%}

解决方案就是在build path里面重新设置class的输出文件夹，放到web-inf文件夹下面的classes中,如果没有这个classes文件夹,则要自己新建一个。

{% endnotel %}

[regular::返回csdn原文:: fa-play-circle](https://blog.csdn.net/qq_36296239/article/details/78615827::fa-solid)
