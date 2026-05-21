---
title: Nginx Docker 容器配置
description: Docker 运行 Nginx 并挂载配置文件、日志、静态资源目录
pubDate: '2025-05-18T00:00:00.000Z'
tags:
  - Nginx
  - Docker
draft: false
---

## Docker 运行 Nginx

```bash
docker run -p 80:80 --name nginx \
  -v /mydata/nginx/html:/usr/share/nginx/html \
  -v /mydata/nginx/logs:/var/log/nginx \
  -v /mydata/nginx/nginx.conf:/etc/nginx/nginx.conf \
  -v /mydata/nginx/conf.d:/etc/nginx/conf.d \
  -d nginx
```

## 参数说明

| 参数 | 说明 |
|------|------|
| `-p 80:80` | 宿主机端口映射 |
| `--name nginx` | 容器命名 |
| `-v /mydata/nginx/html:...` | 挂载静态资源目录 |
| `-v /mydata/nginx/logs:...` | 挂载日志目录 |
| `-v /mydata/nginx/nginx.conf:...` | 挂载主配置文件 |
| `-v /mydata/nginx/conf.d:...` | 挂载扩展配置目录 |
| `-d nginx` | 后台运行 |

## 使用场景

通过挂载目录实现：

- 配置文件持久化
- 日志文件可查看
- 静态资源可修改