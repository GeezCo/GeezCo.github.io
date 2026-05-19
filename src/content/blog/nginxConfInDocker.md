---
title: nginxConfInDocker
description: ''
pubDate: '2025-05-18T00:00:00.000Z'
tags: []
draft: false
---
一些配置的备份

```bash
docker run -p 80:80 --name nginx \
-v /mydata/nginx/html:/usr/share/nginx/html \
-v /mydata/nginx/logs:/var/log/nginx \
-v /mydata/nginx/nginx.conf:/etc/nginx/nginx.conf \
-v /mydata/nginx/conf.d:/etc/nginx/conf.d \
-d nginx
```
