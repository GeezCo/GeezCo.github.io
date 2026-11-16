---
title: Nginx + Docker 部署实战：从挂载配置到反向代理
description: Docker 部署 Nginx 的完整指南：Volume 挂载机制深度解析、配置文件结构、反向代理与 HTTPS 配置模板
pubDate: '2022-11-15T14:30:00.000Z'
tags:
  - Nginx
  - Docker
  - DevOps
draft: false
---

## 为什么用 Docker 跑 Nginx

直接在宿主机上装 Nginx 没什么问题——`apt install nginx` 一行搞定。但当你需要考虑以下场景时，Docker 的优势就出来了：

- **多实例隔离**：开发/测试/生产各有各的 Nginx 配置，互不干扰
- **版本快照**：`nginx:1.25.3` 永远是一样的，不依赖操作系统源里的版本
- **迁移简单**：`docker compose up` 在新机器上就能拉起完全相同的环境
- **干净卸载**：`docker rm -f nginx`，不会有残留的配置文件、日志目录、systemd unit

## 核心：Docker Volume 挂载机制

Docker 容器的文件系统是临时的——容器删除后内部所有修改都消失。要让 Nginx 的配置文件、日志、静态资源持久化，需要通过 Volume 挂载把宿主机目录映射到容器内。

### 最常用的 run 命令

```bash
docker run -p 80:80 --name nginx \
  -v /mydata/nginx/html:/usr/share/nginx/html \
  -v /mydata/nginx/logs:/var/log/nginx \
  -v /mydata/nginx/nginx.conf:/etc/nginx/nginx.conf \
  -v /mydata/nginx/conf.d:/etc/nginx/conf.d \
  -d nginx:1.25
```

### 挂载参数详解

| 参数 | 宿主机 | 容器内 | 作用 |
|------|--------|--------|------|
| `-v /mydata/nginx/html:...` | 你的静态文件目录 | `/usr/share/nginx/html` | Nginx 默认的 `root` 目录 |
| `-v /mydata/nginx/logs:...` | 日志持久化目录 | `/var/log/nginx` | `access.log` + `error.log` |
| `-v /mydata/nginx/nginx.conf:...` | 主配置文件 | `/etc/nginx/nginx.conf` | 全局配置 |
| `-v /mydata/nginx/conf.d:...` | 扩展配置目录 | `/etc/nginx/conf.d` | 每个 site 一个 conf 文件 |
| `-p 80:80` | 宿主机 80 端口 | 容器内 80 端口 | 端口映射 |
| `-d` | - | - | daemon 模式（后台运行） |
| `--name nginx` | - | - | 给容器命名，方便后续操作 |

### 两种 Volume 语法的区别

```bash
# 方式一：Bind Mount（推荐，明确指定路径）
-v /mydata/nginx/html:/usr/share/nginx/html

# 方式二：Named Volume（Docker 管理路径，不知道文件在哪）
-v nginx_html:/usr/share/nginx/html
```

Bind Mount 的路径由你控制——你知道配置文件在哪里，随时 `vim /mydata/nginx/nginx.conf` 去改。Named Volume 的路径是 Docker 内部管理的（通常在 `/var/lib/docker/volumes/`），你没法直接编辑。对配置文件用 Bind Mount，对不需要手动改的数据用 Named Volume。

### 挂载文件 vs 挂载目录的陷阱

```bash
# 危险——如果 nginx.conf 文件不存在，Docker 会自动创建一个同名的空目录
-v /mydata/nginx/nginx.conf:/etc/nginx/nginx.conf

# 安全——先用 touch 创建文件，再挂载
touch /mydata/nginx/nginx.conf
docker run -v /mydata/nginx/nginx.conf:/etc/nginx/nginx.conf ... nginx
```

当宿主机路径指向一个**不存在的文件**时，Docker 会创建一个**目录**（不是文件）。容器启动后 Nginx 试图读取 `/etc/nginx/nginx.conf`——结果发现它是一个目录——启动失败。

## 配置文件的结构

一个典型的 Nginx 配置分为两层：

```
nginx.conf (主配置)
├── worker_processes   worker 进程数
├── events { }         连接处理
└── http {
      ├── 全局 http 设置（gzip、keepalive 等）
      └── include /etc/nginx/conf.d/*.conf;   ← 引入所有站点配置
          │
          ├── default.conf     (默认站点)
          ├── api.conf         (API 反向代理)
          └── blog.conf        (博客静态站点)
    }
```

### 主配置文件 `nginx.conf` 模板

```nginx
user nginx;
worker_processes auto;          # 自动匹配 CPU 核心数
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;    # 每个 worker 能同时处理的连接数
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    keepalive_timeout 65;
    gzip on;

    include /etc/nginx/conf.d/*.conf;
}
```

### 站点配置 `conf.d/blog.conf` 模板

```nginx
server {
    listen 80;
    server_name blog.example.com;

    root /usr/share/nginx/html/blog;
    index index.html;

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback：所有页面请求回退到 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 禁止访问隐藏文件
    location ~ /\. {
        deny all;
    }
}
```

## 反向代理配置

Nginx 最常见的用途是作为反向代理，挡在后端服务前面：

```
用户 → Nginx (80/443) → 后端服务 (3000/8080/...)
```

```nginx
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

如果后端是另一个 Docker 容器，用容器名作为 hostname：

```nginx
proxy_pass http://app-container:8080;
# Docker 的 DNS 会解析同一网络内的容器名
```

## Docker Compose 管理完整服务栈

一个更实际的场景：Nginx + 后端应用：

```yaml
# docker-compose.yml
version: '3.8'

services:
  nginx:
    image: nginx:1.25
    container_name: nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./html:/usr/share/nginx/html
      - ./logs:/var/log/nginx
    depends_on:
      - app
    restart: unless-stopped

  app:
    image: your-app:latest
    container_name: app
    expose:
      - "8080"
    restart: unless-stopped
```

`expose` 让 `app` 的 8080 端口在同一 Docker 网络内可见（不需要映射到宿主机），Nginx 容器可以直接 `proxy_pass http://app:8080`。

## 重载配置不需要重启容器

这是 Docker 跑 Nginx 的一个常见操作点：

```bash
# 修改配置文件后
vim /mydata/nginx/conf.d/blog.conf

# 测试配置是否有语法错误
docker exec nginx nginx -t

# 热重载——不中断服务
docker exec nginx nginx -s reload
```

`nginx -s reload` 是优雅重载——Nginx 主进程会加载新配置，然后逐个通知旧 worker 进程处理完当前连接后退出，新 worker 用新配置接替。

## 常用运维命令

```bash
# 查看容器状态
docker ps | grep nginx

# 查看日志（实时）
docker logs -f nginx

# 进入容器
docker exec -it nginx bash

# 查看 Nginx 版本和编译参数
docker exec nginx nginx -V

# 查看当前连接
docker exec nginx nginx -s status    # 需要 stub_status 模块开启
```

## 总结

- Docker Volume 挂载是容器化 Nginx 的核心——配置、日志、静态资源三样必须持久化
- `nginx -s reload` 实现零停机更新配置
- 反向代理配合 Docker Compose，Nginx + 后端 跑在同一网络，容器名直接当 hostname
- 挂载文件时必须确保宿主机文件已经存在，否则 Docker 创建目录导致启动失败
- `conf.d/*.conf` 的引入模式让每个站点独立一个配置文件，管理多个站点时不打架