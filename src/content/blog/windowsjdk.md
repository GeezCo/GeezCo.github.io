---
title: Windows 多版本 JDK 管理的正确姿势
description: 深入解析 Windows 下 JDK 版本切换的底层机制：环境变量优先级、注册表劫持、PATH 解析顺序，以及为什么改了 JAVA_HOME 还是不生效
pubDate: '2022-10-06T08:29:00.000Z'
tags:
  - JDK
  - Java
  - Windows
draft: false
---

## 问题场景

项目 A 是遗留系统，跑在 JDK 8 上；项目 B 是新架构，需要 JDK 17 编译。你在系统环境变量里把 `JAVA_HOME` 从 JDK 8 改到 JDK 17，重启终端一敲 `java -version`——还是 1.8。

这不是 bug，这是 Windows 环境变量机制的正常行为。

## 为什么改了 JAVA_HOME 不生效？

### PATH 解析是顺序敏感的

Windows 在 PATH 中查找可执行文件时，**从上往下逐一匹配目录，找到第一个匹配的就停**。

```
PATH 内容（简化）：
  C:\Program Files\Java\jdk1.8.0_202\bin    ← 排第一
  %JAVA_HOME%\bin                            ← 排第三
  C:\Windows\System32
  ...
```

当你输入 `java`：
1. Windows 在 `C:\Program Files\Java\jdk1.8.0_202\bin` 找到 `java.exe`
2. 找到就停了，**不会继续往下看**
3. `%JAVA_HOME%\bin` 根本没有被检索到

所以你改 `JAVA_HOME` 指向 JDK 17 没有意义——`java.exe` 是从第一条硬编码路径找到的。

### 哪些东西会在 PATH 里塞 JDK 路径

| 来源 | 典型位置 | 优先级 |
|------|---------|--------|
| Oracle JDK 安装程序 | `C:\Program Files\Java\jdk1.8.0_xxx\bin` | 很高（安装时自动 prepend） |
| 某些开发工具的 bundled JDK | IDE 自带的 `jbr\bin` | 中 |
| 手动配置的 `%JAVA_HOME%\bin` | 你自己加的 | 取决于你放在第几位 |
| System32 下的 java | `C:\Windows\System32\java.exe` | Oracle JRE 安装时会复制一份过去 |

### System32 里的幽灵 java

Oracle JRE 安装时会把 `java.exe`、`javaw.exe`、`javaws.exe` 复制到 `C:\Windows\System32\`。而 System32 在 PATH 中通常非常靠前——这意味着即使你删了所有其他 JDK 路径，System32 里的旧版本 java 仍然会被调用。

```bash
where java
# 可能输出：
# C:\Windows\System32\java.exe       ← 幽灵 java
# C:\Program Files\Java\jdk1.8\bin\java.exe
# C:\Program Files\Java\jdk17\bin\java.exe
```

解决方案：把 `%JAVA_HOME%\bin` 放在 System32 之前，或者直接删掉 System32 下的 java（不推荐删 System32 的文件，用 PATH 顺序控制就好）。

## 注册表的"劫持"

Windows 注册表中有一条关键路径：

```
HKEY_LOCAL_MACHINE\SOFTWARE\JavaSoft\Java Development Kit
  ├── 1.8
  │   ├── JavaHome = "C:\Program Files\Java\jdk1.8.0_202"
  │   └── RuntimeLib = "..."
  ├── 17
  │   ├── JavaHome = "C:\Program Files\Java\jdk-17.0.1"
  │   └── RuntimeLib = "..."
  └── CurrentVersion = "1.8"    ← 这个值！！
```

`CurrentVersion` 这个键告诉某些应用程序"默认 JDK 是哪个版本"。很多 Java 应用（尤其是 Eclipse RCP 应用、旧版 IDE）会读取这个注册表值而不是 `JAVA_HOME` 环境变量。

```text
Java 程序找 JDK 的优先级（因实现而异）：

1. 启动参数 -vm 指定的路径
2. JAVA_HOME 环境变量
3. 注册表 CurrentVersion → JavaHome    ← 这里！
4. PATH 中第一个 java.exe
5. 当前工作目录下的 jre/
```

如果你只改了环境变量变量没改注册表，某些工具可能仍然找到旧版本。

**修复**：直接改注册表 `CurrentVersion`，或者用 `reg` 命令：

```bash
reg add "HKLM\SOFTWARE\JavaSoft\Java Development Kit" /v CurrentVersion /t REG_SZ /d 17 /f
```

## 多版本切换的正确方案

### 方案对比

| 方案 | 原理 | 便捷性 | 兼容性 |
|------|------|--------|--------|
| 手动改 PATH 顺序 | 把目标 JDK 的 bin 放最前面 | ★☆☆☆☆ | 100% |
| 批处理脚本切换 | 不同终端窗口设不同环境变量 | ★★★☆☆ | 100% |
| 系统变量引用 | `JAVA_HOME=%JAVA8_HOME%` 或 `%JAVA17_HOME%` | ★★☆☆☆ | 注意注册表 |
| SDKMAN / jabba | Unix 工具，Windows 有 WSL 版本 | ★★★★★ | WSL only |
| IDE 内配置 | 每个项目指定 JDK | ★★★★☆ | IDE 内有效 |

### 方案一：变量引用 + PATH 控制（推荐）

设置以下系统变量：

```
JAVA8_HOME  = C:\Program Files\Java\jdk1.8.0_202
JAVA17_HOME = C:\Program Files\Java\jdk-17.0.1
JAVA_HOME   = %JAVA17_HOME%     ← 默认用 17
```

PATH 中添加：

```
%JAVA_HOME%\bin
```

**关键**：确保 PATH 中没有其他硬编码的 JDK 路径排在 `%JAVA_HOME%\bin` 前面。检查方式：

```bash
where java
# 应该只有一条输出，且指向 %JAVA_HOME%\bin
```

需要切换版本时，改 `JAVA_HOME` 的值为 `%JAVA8_HOME%` 或 `%JAVA17_HOME%`，然后**重新打开终端**（不是刷新环境变量，Windows 的 CMD/PowerShell 在启动时一次性加载环境变量，不会动态刷新）。

### 方案二：终端级别的临时切换

如果你只是临时编译某个项目：

```bash
# CMD
set JAVA_HOME=C:\Program Files\Java\jdk-17.0.1
set PATH=%JAVA_HOME%\bin;%PATH%
java -version

# PowerShell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17.0.1"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
java -version
```

这仅影响当前终端窗口，关掉就恢复。

### 方案三：IDE 项目级 JDK 配置

最推荐的日常开发方式——不在系统层面切换，而是在 IDE 里为每个项目指定 JDK：

**IntelliJ IDEA**：
```
File → Project Structure → Project → SDK → 选择 JDK 版本
```

**Gradle**（`gradle.properties`）：
```properties
org.gradle.java.home=C:\\Program Files\\Java\\jdk-17.0.1
```

**Maven**（`pom.xml`）：
```xml
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-compiler-plugin</artifactId>
  <configuration>
    <source>17</source>
    <target>17</target>
    <fork>true</fork>
    <executable>C:\Program Files\Java\jdk-17.0.1\bin\javac</executable>
  </configuration>
</plugin>
```

这样系统 JDK 保持不变，但项目编译用的是指定版本。

## JDK 发行版的选择

不只是版本号的问题——你选的 JDK 发行版也影响行为：

| 发行版 | 特点 | 适合场景 |
|--------|------|---------|
| Oracle JDK | 官方，8u211+ 开始商用收费 | 企业有 Oracle 订阅 |
| OpenJDK | 开源参考实现 | 自己编译/学习 |
| Adoptium (Eclipse Temurin) | 社区维护，TCK 测试通过 | **生产推荐** |
| Amazon Corretto | AWS 维护，长期支持 | 在 AWS 上跑 |
| Azul Zulu | 支持更多平台（包括 ARM） | macOS M1/M2 |
| GraalVM | 高性能 + Native Image | 云原生/Serverless |
| 阿里 Dragonwell | 国内定制，有中文文档 | 国内生产环境 |

## 验证清单

切换 JDK 后，逐个确认这些工具都指向正确版本：

```bash
java -version          # JRE 版本
javac -version         # JDK 编译器版本
where java             # 确认路径来源
echo %JAVA_HOME%       # 环境变量
mvn -version           # Maven 用的 JDK（可能是 JAVA_HOME 也可能是 mvn 配置的）
```

最后一个很关键——Maven 的 `mvn` 脚本可能通过 `JAVA_HOME` 找 JDK，也可能通过注册表。确认方式：

```bash
mvn -version
# 关注输出中的 "Java version" 和 "Java home"
```

## 总结

- **PATH 顺序决定一切**：`java` 命令走 PATH 第一个匹配项，不是 `JAVA_HOME`
- **注册表是隐藏变量**：`HKLM\SOFTWARE\JavaSoft\JDK\CurrentVersion` 劫持某些工具的行为
- **System32 有幽灵**：Oracle JRE 安装器会复制 java.exe 到 System32
- **IDE 项目级配置 > 系统级切换**：日常开发用 IDE/Gradle/Maven 的 JDK 配置，不要频繁改系统变量
- **验证用 where，不用 java -version**：看看 java.exe 到底来自哪个目录