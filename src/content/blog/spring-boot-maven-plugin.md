---
title: spring-boot-maven-plugin的踩坑
description: ''
pubDate: '2026-05-18T01:27:00.000Z'
tags: []
draft: false
---
## 问题描述

我的base-server模块 和 base-api模块 都是隶属于BaseLearn的两个模块其中server在依赖中引用了base-api模块且在代码中使用了base-api中的某些类 但是现在打包server的时候 找不到引用的类 说程序包com.cheems.baseapi.xxxx不存在 但是在idea中ctrl+左键是可以索引到具体的类的，路径没问题 无数次清理maven重新倒入依赖和清理idea缓存都尝试了 也尝试先将api 进行install 然后再打包server也不行。

## 排查问题

尝试先构建api模块

```bash
mvn clean install -pl base-api
```

再构建server

```bash
mvn clean install -pl base-server
```

依旧报错：程序包不存在一样的错误。

检查BaseLearn父模块将api拉到server之前：

```xml
<modules>
    <module>base-api</module>
    <module>base-server</module>
</modules>
```

然后

```bash
mvn clean install
```

重新 `install` api模块 然后 `package` server模块

依旧同样的错误。

## 尝试解决

我直接大手一挥直接把api 中的`<dependency></dependency>` 全部注释掉，然后reload，只留下必要的让api模块install成功的依赖
发现还是报错。

于是我注意到了在api模块中：

```xml
    <build>
        <plugins>
            <!-- spring-boot-maven-plugin 会改变默认maven的打包逻辑使得api（当前）模块打包好后 引用api模块的其他模块不能正常打包 报错找不到api中的类-->
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
```

经过仔细查找资料发现，spring-boot-maven-plugin 会更改maven的默认打包逻辑，导致包无法被别的模块引用。

## 总结

不知道干嘛的插件不要乱装。
