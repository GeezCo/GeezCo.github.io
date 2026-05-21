---
title: JSP 到 Servlet 路径 404 错误
description: Java Web 新手常见问题：Form 表单跳转 Servlet 出现 404 路径错误
pubDate: '2026-05-15T08:29:00.000Z'
tags:
  - Java Web
  - Servlet
draft: false
---

## 问题现象

新建动态 Web 项目发布到 Tomcat 后：

- JSP 可以单独访问
- Servlet 可以单独访问
- Form 表单跳转 Servlet 出现 404 错误

## 原因分析

Servlet 编译后的 class 文件存放位置关键：

- 默认存放位置：`build/classes`
- JSP 文件存放位置：`WebContent`

路径不一致导致 JSP 无法找到 Servlet 的 class 文件。

## 解决方案

在 Build Path 中重新设置 class 输出文件夹：

1. 项目右键 → Build Path → Configure Build Path
2. Source 标签页 → Default output folder
3. 设置为 `WEB-INF/classes`
4. 如果没有 classes 文件夹，需手动创建

## 路径规范

### JSP 跳转 Servlet

Form 表单路径应为：

```text
/项目名/Servlet名
```

### Servlet 跳转 JSP

Dispatcher 跳转路径应为：

```text
/文件夹名/JSP文件名.jsp
```

## 参考资料

[CSDN 原文](https://blog.csdn.net/qq_36296239/article/details/78615827)