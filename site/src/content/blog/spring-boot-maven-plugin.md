---
title: spring-boot-maven-plugin 导致的多模块打包问题
description: 深入理解 Maven 打包机制与 spring-boot-maven-plugin 如何改变默认行为，导致被依赖模块无法被引用
pubDate: '2023-04-05T10:06:51.939Z'
tags:
  - Spring Boot
  - Maven
draft: false
---

## 问题现场

一个标准的多模块项目：

```text
BaseLearn/
├── pom.xml                  # 父 POM
├── base-api/                # API 模块：定义接口和 DTO
│   └── pom.xml
└── base-server/             # Server 模块：引用 base-api
    └── pom.xml
```

IDE 里一切正常，Ctrl + 点击能跳转。但一到打包：

```text
[ERROR] 程序包 com.cheems.baseapi.xxxx 不存在
[ERROR] 找不到符号
```

## 排查轨迹

**第一反应：构建顺序问题**

```bash
mvn clean install -pl base-api    # 先装 api
mvn clean install -pl base-server # 再装 server
```

不行。

**第二反应：父 POM 的 modules 顺序**

```xml
<modules>
    <module>base-api</module>     <!-- 确保先构建 -->
    <module>base-server</module>
</modules>
```

不行。

**第三反应：IDEA 缓存**

Invalidate Caches + 重新导入 Maven。不行。

**第四反应：开始怀疑插件**

查看 base-api 的 pom.xml，发现了问题：

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

## 根因分析

### Maven 默认打包 vs Spring Boot 打包

```
Maven 默认 jar:
  ┌──────────────────────┐
  │  com.cheems.baseapi  │  ← 可以 import + 类路径引用
  │  (你的 .class 文件)   │
  └──────────────────────┘

Spring Boot 打包:
  ┌──────────────────────┐
  │  BOOT-INF/classes/   │  ← 你的类被塞进去了
  │  ├── com/cheems/...  │
  │  └── ...             │
  │  META-INF/           │
  │  org/springframework/│
  └──────────────────────┘
```

`spring-boot-maven-plugin` 会重新打包（repackage），将模块变成一个可执行的 fat jar。jar 的内部结构被改写——类文件不再在根目录，而是被放到 `BOOT-INF/classes/` 下面。

**其他模块尝试引用这个 jar 时，类加载器在根路径找不到类，因为它们在 BOOT-INF 里面。**

这就是为什么 IDEA 能索引到（IDEA 看的是源码/编译输出，不是最终 jar），但 Maven 打包时找不到。

### 哪些模块需要这个插件？

```
可执行模块（需要 spring-boot-maven-plugin）：
  └── base-server（入口类在这里，要打成可执行 jar）

被依赖模块（不需要）：
  ├── base-api（被 server 引用 → 普通 jar 即可）
  ├── base-common
  └── base-domain
```

**原则：只有包含 main 方法、需要独立运行的那个模块才需要 spring-boot-maven-plugin。**

## 两种修复

### 方案一：删掉 API 模块中的插件

```xml
<!-- base-api/pom.xml → 删除整个 plugins 块 -->
```

最适合开头那个例子——api 模块不需要独立运行。

### 方案二：跳过 repackage

```xml
<plugin>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-maven-plugin</artifactId>
    <configuration>
        <skip>true</skip>
    </configuration>
</plugin>
```

适合用 `spring-boot-starter-parent` 的继承场景，子模块不想 repackage 但也不想删插件声明。

### 方案三：用 classifier 区分

```xml
<plugin>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-maven-plugin</artifactId>
    <configuration>
        <classifier>exec</classifier>
    </configuration>
</plugin>
```

这样会同时产出两个 jar：
- `base-api.jar`（普通 jar，可被引用）
- `base-api-exec.jar`（可执行 jar）

## 总结

- `spring-boot-maven-plugin` 改变了 jar 内部结构（BOOT-INF 格式）
- 被其他模块引用的模块**不能**用这个插件 repackage
- 只有入口模块（有 main 的）才需要
- Maven 构建顺序和 IDE 缓存排查是常规操作，但深层问题往往是打包配置