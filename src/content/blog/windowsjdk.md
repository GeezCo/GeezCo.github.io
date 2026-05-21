---
title: Windows 多版本 JDK 管理踩坑
description: Windows 系统下配置 JDK 1.8 与 JDK 11 多版本切换的实践经验
pubDate: '2026-05-15T08:29:00.000Z'
tags:
  - JDK
  - Java
  - Windows
draft: false
---

## 问题背景

项目打包需要 JDK 11，但当前系统默认 JDK 1.8。

切换后报错：无法识别版本: 11

多次尝试配置环境变量并重启无效。

## 环境配置

查看系统已安装的 JDK：

```bash
where java

C:\Program Files\Java\jdk1.8.0_xxx\bin\java.exe
C:\Program Files\Java\jdk11.0.23\bin\java.exe
```

配置系统变量：

- `JAVA8_HOME`：JDK 1.8 路径
- `JAVA11_HOME`：JDK 11 路径
- `JAVA_HOME`：`%JAVA11_HOME%` 或 `%JAVA8_HOME%`

## 问题排查

### 检查注册表

Win + R → `regedit`：

```text
HKEY_LOCAL_MACHINE\SOFTWARE\Java Soft\Java Development Kit
```

发现 Current Version 值仍为 1.8。

### 临时测试

Bash 终端临时设置环境变量：

```bash
set JAVA_HOME=C:\Program Files\Java\jdk11.0.23
set PATH=%JAVA_HOME%\bin;%PATH%
echo %JAVA_HOME%
java -version
```

临时设置可以生效，说明是环境变量加载顺序问题。

## 解决方案

检查 PATH 环境变量中 `%JAVA_HOME%\bin` 的位置。

将 `%JAVA_HOME%\bin` 移到其他条目之前（但不要放在 system32 前面）。

重新打开终端验证：

```bash
java -version
```

成功切换到 JDK 11。

## 总结

多版本 JDK 切换时，不仅要配置 `JAVA_HOME`，还要关注 PATH 环境变量的优先级顺序。