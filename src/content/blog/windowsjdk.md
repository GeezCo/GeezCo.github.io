---
title: windows下多版本jdk管理踩坑
description: ''
pubDate: '2026-05-15T08:29:00.000Z'
tags: []
draft: false
---
## 问题描述

最近需要搞一个在Windows下多版本的java 环境（别问问就是垃圾公司用的win）

自己有个项目需要打包用的jdk11

打包时候报错 无法识别的版本:11

现在想从1.8 切换到 11（下载好了）

求助了GPT 检查配置并重启也无果

最后尝试更改path环境变量优先级成功

## 配置:

1. java版本及配置：

```bash
where java

C:\Program File\Java\jdk1.8xxxxxx\bin\java.exe
C:\Program File\Java\jdk11.0.23xxx\bin\java.exe
```

其中 JAVA11_HOME 和 JAVA8_HOME 分别是两个系统变量。
再创建一个新的 JAVA_HOME : `%JAVA11_HOME%` 或者 `%JAVA8_HOME%`来引用当前是哪个环境。

## 排查问题

win + r -> 输入regedit

找到：

```bash
HKEY_LOCAL_MACHINE\SOFTWARE\Java Soft\Java Development Kit
```

发现 Current Version的值依旧是1.8

进一步验证了刚才就是环境变量没有生效

2. 问题线索：

我发现在bash终端临时设置JAVA_HOME变量是可以的：

```bash
set JAVA_HOME=C:\Program File\Java\jdk11.0.23xxx\bin\java.exe
set PATH=%JAVA_HOME%\bin;%PATH%
echo %JAVA_HOME%
java -version
```

这就说明是环境变量没有生效。

## 解决方案

尝试重启无效那说明就是加载环境变量的时候有问题
在配置环境的时候会在 path 中配置：

```bash
%JAVA_HOME%\bin
```

- 尝试把 path 调整到前面确保优先级高于其他条目。

于是我尝试放在了 xxx/system32后面（尽量不要影响系统环境变量的加载）。

重新打开cmd or bash终端

```bash
java -version
```

成功切换到11

## 总结

这次的问题提醒我，在配置多版本JDK时，不仅要确保`JAVA_HOME`等环境变量设置正确，还要关注`PATH`环境变量的优先级问题。通过这次的经历(cai keng)，我对环境变量的配置和管理有了更深的理解(tu cao).
