---
title: JSP 跳转 Servlet 404：Java Web 路径问题的根源
description: 深入分析 Web 应用中 Form 表单、Servlet、JSP 之间的路径映射问题，理解相对路径与绝对路径的区别，以及编译输出目录对类加载的影响
pubDate: '2023-01-05T08:29:00.000Z'
tags:
  - Java Web
  - Servlet
  - JSP
draft: false
---

## 场景复现

一个最简 Web 项目：

```
项目结构:
  WebContent/
  ├── index.jsp               ← 表单页面，提交到 LoginServlet
  ├── welcome.jsp             ← 登录成功后的欢迎页
  └── WEB-INF/
      ├── web.xml
      └── classes/            ← 编译后的 Servlet class
```

`index.jsp` 有一个表单：

```html
<form action="LoginServlet" method="post">
  <input name="username" />
  <button type="submit">登录</button>
</form>
```

`LoginServlet.java` 在 `src/com/example/LoginServlet.java`：

```java
@WebServlet("/LoginServlet")
public class LoginServlet extends HttpServlet {
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        String username = req.getParameter("username");
        req.setAttribute("username", username);
        req.getRequestDispatcher("/welcome.jsp").forward(req, resp);
    }
}
```

测试：

- `http://localhost:8080/myapp/index.jsp` → JSP 正常显示 ✓
- `http://localhost:8080/myapp/LoginServlet` → Servlet 正常响应 ✓
- 从 index.jsp 提交表单 → **404** ✗

JSP 和 Servlet 单独都正常，但表单跳转就 404。问题出在**路径的写法**上。

## 相对路径 vs 绝对路径：表单提交的陷阱

### 浏览器解析相对路径的规则

当你在 `index.jsp` 中写 `<form action="LoginServlet">`，浏览器看到的是相对路径。浏览器会根据**当前页面的 URL** 来拼接最终请求地址：

```
当前页面 URL:  http://localhost:8080/myapp/jsp/index.jsp
相对路径:      LoginServlet
浏览器拼接:    http://localhost:8080/myapp/jsp/LoginServlet    ← ！错
正确应该是:    http://localhost:8080/myapp/LoginServlet        ← /myapp 的根
```

浏览器把 `LoginServlet` 拼接到了当前页面所在的目录 `/myapp/jsp/` 下，而不是应用的根路径 `/myapp/`。

### 几种 action 写法的实际效果

假设 `index.jsp` 位于 `/myapp/user/jsp/index.jsp`：

| action 写法 | 浏览器解析结果 | 说明 |
|-------------|---------------|------|
| `LoginServlet` | `/myapp/user/jsp/LoginServlet` | 相对路径，拼在当前目录 |
| `./LoginServlet` | `/myapp/user/jsp/LoginServlet` | 同上 |
| `../LoginServlet` | `/myapp/user/LoginServlet` | 往上一级 |
| `/LoginServlet` | `/LoginServlet` | 绝对路径，丢掉了 /myapp |
| `/myapp/LoginServlet` | `/myapp/LoginServlet` | 正确 |

### 推荐写法：使用 JSP EL 表达式动态生成路径

```html
<form action="${pageContext.request.contextPath}/LoginServlet" method="post">
```

`${pageContext.request.contextPath}` 在运行时被替换为当前 Web 应用的 Context Path（例如 `/myapp`），所以最终生成：

```html
<form action="/myapp/LoginServlet" method="post">
```

无论在哪个子目录的 JSP 中，这个路径始终正确。

### Servlet 内部转发的路径是另一回事

注意区分**浏览器发请求**和**服务端转发**：

```java
// 这是服务端转发——路径是相对于应用根目录的（没有 Context Path）
request.getRequestDispatcher("/welcome.jsp").forward(request, resp);
//                          ↑ 这个 / 指的是 /myapp/ 的根

// 这是浏览器重定向——路径要包含 Context Path
response.sendRedirect(request.getContextPath() + "/welcome.jsp");
//                                    ↑ 需要手动加上 /myapp
```

转发（forward）：服务端内部操作，路径相对于应用根目录。
重定向（redirect）：告诉浏览器发起新请求，需要完整的 URL 路径。

## class 文件位置：另一个 404 来源

### Eclipse 的默认输出目录问题

Eclipse 项目的默认编译输出是 `build/classes/`：

```
Eclipse 自动编译:
  src/com/example/LoginServlet.java
    → build/classes/com/example/LoginServlet.class

Tomcat 期望在这里:
  WEB-INF/classes/com/example/LoginServlet.class
```

当 Tomcat 收到 `/myapp/LoginServlet` 请求时，它去 `WEB-INF/classes/` 下找类文件——找不到。但 Tomcat 报的是 404 而不是 ClassNotFoundException，因为 Servlet 容器找不到对应的 Servlet 映射时就返回 404。

**修复**：

```
Eclipse: 项目右键 → Build Path → Configure Build Path
  → Source 标签页
  → Default output folder: 改为 项目名/WebContent/WEB-INF/classes

IDEA: 通常不需要手动改，它的部署机制会自动拷贝
```

### 检查方式

最直接的验证——看 `WEB-INF/classes/` 下有没有编译好的 class 文件：

```bash
ls -la WebContent/WEB-INF/classes/com/example/
# 如果没有 LoginServlet.class，说明编译输出路径不对
```

## 完整的路径映射图

```
浏览器 URL                     →  Tomcat 内部查找路径
─────────────────────────────────────────────────────
/myapp/index.jsp              →  webapps/myapp/index.jsp
/myapp/WEB-INF/web.xml        →  ✗ 404（WEB-INF 受保护）
/myapp/LoginServlet           →  WEB-INF/classes/.../LoginServlet.class
                                  （通过 web.xml 或 @WebServlet 中的 url-pattern）
/myapp/jsp/user/list.jsp      →  webapps/myapp/jsp/user/list.jsp
/myapp/css/style.css          →  webapps/myapp/css/style.css
/myapp/
  jsp/
    user/
      index.jsp               →  浏览器中的路径是 /myapp/jsp/user/index.jsp
                                  表单 action="LoginServlet" 拼成 /myapp/jsp/user/LoginServlet
```

## 常见的路径写法速查

```html
<!-- JSP 中 -->
<link href="${pageContext.request.contextPath}/css/style.css" rel="stylesheet">
<script src="${pageContext.request.contextPath}/js/app.js"></script>
<form action="${pageContext.request.contextPath}/login" method="post">
<a href="${pageContext.request.contextPath}/user/list">用户列表</a>
```

```java
// Servlet 中
// 转发
request.getRequestDispatcher("/WEB-INF/view/result.jsp").forward(request, response);

// 重定向
response.sendRedirect(request.getContextPath() + "/login.jsp");

// 获取资源真实路径
String realPath = getServletContext().getRealPath("/upload/");
```

## 总结

- **相对路径以浏览器地址栏的当前目录为基准**——JSP 在子目录中，action 的相对路径就拼错了
- `${pageContext.request.contextPath}` 是 Java Web 中最可靠的路径写法，始终指向应用根
- 转发（forward）和重定向（redirect）的路径规则不同——转发是服务端行为，路径相对于应用根；重定向是客户端行为，需要完整路径
- Eclipse 默认编译输出到 `build/classes/`，Tomcat 在 `WEB-INF/classes/` 找——不匹配就 404
- Tomcat 找不到 Servlet 类时返回 404 而非 500 或 ClassNotFoundException——这是容易误导排查方向的一点