---
title: spring-boot-maven-plugin 踩坑记录
description: 解决多模块项目中 spring-boot-maven-plugin 导致的依赖找不到问题
pubDate: '2026-05-19T10:06:51.939Z'
tags:
  - Spring Boot
  - Maven
draft: false
---

## 问题背景

项目结构：

```
BaseLearn/
├── base-api/
├── base-server/
```

`base-server` 模块依赖 `base-api` 模块，代码中使用了 `base-api` 的类。

打包 `base-server` 时报错：程序包 `com.cheems.baseapi.xxxx` 不存在。

IDEA 中 Ctrl + 左键可以索引到类，路径没问题。多次清理 Maven 依赖、清理 IDEA 缓存都无效。

## 排查过程

### 尝试一：分模块构建

```bash
mvn clean install -pl base-api
mvn clean install -pl base-server
```

依旧报错。

### 尝试二：调整父模块顺序

```xml
<modules>
    <module>base-api</module>
    <module>base-server</module>
</modules>
```

```bash
mvn clean install
```

重新 install api 模块，再 package server 模块，依旧报错。

### 尝试三：精简依赖

注释掉 api 模块中不必要的 `<dependency>`，只保留必要依赖让 api install 成功。

依旧报错。

## 问题根因

注意到 `base-api` 模块的 pom.xml：

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
        </plugin>
    </plugins>
</build>
```

**关键发现**：`spring-boot-maven-plugin` 会更改 Maven 的默认打包逻辑，导致包无法被其他模块引用。

## 解决方案

在不需要作为可执行 jar 的模块（如 api 模块）中，移除 `spring-boot-maven-plugin`。

或者添加 skip 配置：

```xml
<plugin>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-maven-plugin</artifactId>
    <configuration>
        <skip>true</skip>
    </configuration>
</plugin>
```

## 总结

不知道作用的插件不要乱装。被其他模块引用的模块，不应使用 `spring-boot-maven-plugin`。