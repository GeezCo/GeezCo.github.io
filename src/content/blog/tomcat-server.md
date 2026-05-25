---
title: Tomcat 部署架构与 404 错误排查手册
description: 深入理解 Tomcat 目录结构、Servlet 规范、应用部署流程，以及 404 错误的完整排查思路
pubDate: '2022-11-27T08:29:00.000Z'
tags:
  - Tomcat
  - Java Web
draft: false
---

## 问题的起点

访问 `http://localhost:8080` 看到一个空白页或者：

```text
HTTP Status 404 – Not Found
The origin server did not find a current representation
for the target resource or is not willing to disclose that one exists.
```

这说明 Tomcat 启动成功了（端口监听正常），但它找不到你要的资源。404 在 Tomcat 中有多种可能性，逐层排查比瞎改配置高效得多。

## Tomcat 的目录结构决定了访问路径

理解 Tomcat 的目录结构是排查 404 的基础：

```
tomcat/
├── bin/           # 启动脚本（catalina.bat/sh）
├── conf/
│   ├── server.xml     # 核心配置：端口、Host、Context
│   └── web.xml        # 全局 web.xml，所有应用继承
├── webapps/            # WAR 包和展开目录放这里 ★
│   ├── ROOT/           # 默认应用（路径 = /）
│   ├── myapp/          # 应用 myapp（路径 = /myapp）
│   └── myapp.war       # WAR 包，启动时自动展开
├── logs/               # 日志
├── work/               # JSP 编译后的 Servlet 源码
└── temp/
```

### 访问路径的映射规则

```
URL: http://localhost:8080/myapp/user/list.jsp
                              │       │
                              │       └── Web 应用内的资源路径
                              │           （相对于 WebContent/src/main/webapp）
                              └── Context Path（等于目录名或 WAR 名，ROOT 例外）
```

几个容易踩坑的点：

1. **Context Path 不是项目名**：Context Path 默认等于 WAR 文件名或目录名，但可以通过 `META-INF/context.xml` 或 `server.xml` 中的 `<Context path="/xxx">` 覆盖
2. **ROOT 是特例**：放到 `webapps/ROOT/` 下的应用，Context Path 是 `/`，访问 `http://localhost:8080/` 就行
3. **IDEA/Eclipse 的部署路径可能不同**：IDE 可能把应用部署到临时目录而不是 `webapps/`，路径映射会变

## 404 的五种根因

### 1. Context Path 不对

```
你的资源在: webapps/myapp/index.jsp
你访问的: http://localhost:8080/index.jsp        ← 少了一层 /myapp
正确的:   http://localhost:8080/myapp/index.jsp   ✓
```

排查：

```bash
# 看 Tomcat 日志确认部署了哪些应用
tail -f tomcat/logs/catalina.out | grep "Deploy"

# 或者访问 Manager 应用（需要配置用户）
http://localhost:8080/manager/html
```

### 2. 资源在 WEB-INF 目录下

```
WebContent/
├── index.jsp           ← 可以直接访问: /myapp/index.jsp
└── WEB-INF/
    ├── web.xml
    ├── classes/        ← Servlet class 文件
    ├── lib/            ← jar 包
    └── secret.jsp      ← 无法直接访问！/myapp/WEB-INF/secret.jsp → 404
```

**WEB-INF 下的内容是受保护的**——这是 Servlet 规范的设计。客户端无法直接通过 URL 访问 WEB-INF 下的任何文件。只有 Servlet 的 `RequestDispatcher` 可以转发到 WEB-INF 下的资源。

```
// 这样是可以的——服务端转发
request.getRequestDispatcher("/WEB-INF/view/result.jsp").forward(request, response);

// 客户端直接访问就是 404
// http://localhost:8080/myapp/WEB-INF/view/result.jsp → 404
```

这是安全设计，不是 bug。把 JSP 放到 `WebContent/`（或 `src/main/webapp/`）下而不是 `WEB-INF/` 下。

### 3. class 文件找不到（输出目录配置错误）

这个坑主要出现在 Eclipse 中。Eclipse 默认把编译后的 class 文件输出到 `build/classes/`，但 Tomcat 期望类文件在 `WEB-INF/classes/` 下。

```
期望的目录结构:
  WEB-INF/classes/com/example/MyServlet.class    ← Tomcat 从这里找

Eclipse 默认输出:
  build/classes/com/example/MyServlet.class       ← Eclipse 编译到这里
```

**修复**：
```
项目右键 → Build Path → Configure Build Path
  → Source 标签页
  → Default output folder: 改成 WEB-INF/classes
```

IDEA 通常不会遇到这个问题——它默认输出到 `out/production/`，部署时自动拷贝到正确位置。

### 4. JSP 在子目录中，路径层级不对

```
WebContent/
└── jsp/
    └── user/
        └── list.jsp

访问路径: /myapp/jsp/user/list.jsp
                         │   │    │
                         │   │    └── JSP 文件名
                         │   └── 子目录
                         └── 顶层文件夹
```

每一个子目录对应 URL 中的一个路径段。

### 5. web.xml 的 url-pattern 配置错误

Servlet 的 URL 映射在 `web.xml` 或 `@WebServlet` 注解中定义：

```xml
<servlet-mapping>
  <servlet-name>UserServlet</servlet-name>
  <url-pattern>/user</url-pattern>       ← 注意：不是 /UserServlet
</servlet-mapping>
```

访问 `/myapp/UserServlet` → 404。应该访问 `/myapp/user`。

`@WebServlet` 注解的情况：

```java
@WebServlet("/user")          // 访问 /myapp/user
@WebServlet("/user/*")        // 访问 /myapp/user/xxx 都走这个 Servlet
@WebServlet("*.do")           // 访问 /myapp/anything.do
```

**url-pattern 匹配规则**：
1. 精确匹配 `/user`：完全一致才命中
2. 路径匹配 `/user/*`：前缀匹配
3. 扩展名匹配 `*.jsp`：后缀匹配
4. 默认匹配 `/`：兜底，处理所有未匹配的请求

匹配优先级：精确 > 路径 > 扩展名 > 默认。

## 排查 404 的系统化流程

```
                    ┌─────────────────────────┐
                    │  Tomcat 启动成功了吗？     │
                    │  检查 catalina.out        │
                    └────────────┬──────────────┘
                                 │
                    ┌────────────▼──────────────┐
                    │  应用部署成功了吗？        │
                    │  看 Manager 或 deploy 日志 │
                    └────────────┬──────────────┘
                                 │
                    ┌────────────▼──────────────┐
                    │  访问的 URL 路径是否正确？  │
                    │  Context Path + 资源路径    │
                    └────────────┬──────────────┘
                                 │
                    ┌────────────▼──────────────┐
                    │  资源在 WEB-INF 之外吗？   │
                    │  JSP 必须在 WebContent 下   │
                    └────────────┬──────────────┘
                                 │
                    ┌────────────▼──────────────┐
                    │  class 文件在正确位置吗？    │
                    │  WEB-INF/classes/          │
                    └────────────┬──────────────┘
                                 │
                    ┌────────────▼──────────────┐
                    │  url-pattern 映射正确吗？   │
                    │  检查 web.xml / @WebServlet│
                    └────────────────────────────┘
```

## 附加：为什么 Eclipse/IDEA 中 Tomcat 可能不更新

有时候你改了代码，重启 Tomcat 但还是老结果——不是 404，而是"改的代码没生效"。

**原因**：IDE 没有把修改后的 class 自动部署到 Tomcat。解决：
- IDEA：手动 Build → Build Artifacts → Rebuild
- Eclipse：Project → Clean，或者勾选 "Automatically publish when resources change"

## 总结

- 404 不是玄学——是路径映射、目录结构、资源可见性三者之一出了问题
- WEB-INF 下的内容客户端无法访问，这是 Servlet 规范的安全设计
- IDE 部署路径和 Tomcat 期望路径不一致时（Eclipse build/classes 问题），类加载失败但报 404 而非 ClassNotFound
- Context Path 默认 = WAR 名/目录名，ROOT 是特例
- url-pattern 的 4 种匹配规则有严格优先级