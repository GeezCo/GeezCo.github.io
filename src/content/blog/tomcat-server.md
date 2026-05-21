---
title: Tomcat 404 错误排查
description: Java Web 新手常见问题：Tomcat 访问资源 404 错误的解决方案
pubDate: '2026-05-15T08:29:00.000Z'
tags:
  - Tomcat
  - Java Web
draft: false
---

## 问题现象

访问 `https://localhost:8080` 时报错：

```text
The origin server did not find a current representation
for the target resource or is not willing to disclose that one exists.
```

## 解决方案

### 方案一：重新配置服务器

在 Eclipse/IDEA 中：

1. 删除服务器配置
2. 重新添加新的服务器
3. 双击服务器，勾选 Server Locations 中间选项

### 方案二：检查访问路径

若 JSP 文件放在 WebContent 的子文件夹中，访问路径应为：

```text
localhost:8080/项目名/JSP文件夹名/JSP文件名.jsp
```

示例：

```text
localhost:8080/JSTLTest/jsp/JSTLTest.jsp
```

路径解析：

- `JSTLTest`：项目名称
- `jsp`：WebContent 下的文件夹
- `JSTLTest.jsp`：JSP 文件名

## 重要提醒

**WEB-INF 目录下的 JSP 文件无法直接访问**，需将 JSP 文件放到 WebContent 目录下。

## 参考资料

[CSDN 原文](https://blog.csdn.net/qq_36296239/article/details/78627140)