---
title: ElasticSearch
description: ""
pubDate: 2026-05-15T08:29:00.000Z
tags: []
draft: false
---
info:

```plain text
[1].max file descriptors [4096] for elasticsearch
    process is too low, increase to at least [65536]
[2].max number of threads [1889] for user
    [adam] is too low, increase to at least [4096]
[3].max virtual memory areas vm.max_map_count [4096]
    is too low, increase to at least [65536]
```

`原因:`

- 文件描述符fd太少:

{% tabs First unique name %}

切换到root用户 查看硬限制

```bash
ulimit -Hn
```

```bash
vim /etc/security/limits.conf
```

在limits配置文件中添加下面设置:

*(adam是本地用户,替换你自己的)*

```bash
adam soft nofile 65536

adam hard nofile 65536

adam hard nproc 4096

adam soft nproc 4096
```

退出用户重新登录，使配置生效

重新 ulimit -Hn 查看硬限制 会发现数值有4096改成65535

```bash
vim /etc/security/limits.d/90-nproc.conf
```

找到文件中的如下内容:

```plain text
soft nproc 1024
```

修改为:

```plain text
soft nproc 2048
```

接下来在/etc/sysctl.conf添加:

```plain text
vm.max_map_count=655360
```

并执行:

```bash
sysctl -p
```

{% endtabs %}

[参考文档](https://www.elastic.co/guide/en/elasticsearch/reference/7.17/) 中是这么写的:

Elasticsearch uses a number of thread pools for different types of operations. It is important that it is able to create new threads whenever needed. Make sure that the number of threads that the Elasticsearch user can create is at least 4096.

意思就是说，ES是多线程处理任务的，为了确保ES可以正常运行，使用ES的用户可创建的线程数至少为4096

This can be done by setting [`ulimit -u 4096`](https://www.elastic.co/guide/en/elasticsearch/reference/7.17/setting-system-settings.html#ulimit) as root before starting Elasticsearch, or by setting `nproc` to `4096` in [`/etc/security/limits.conf`](https://www.elastic.co/guide/en/elasticsearch/reference/7.17/setting-system-settings.html#limits.conf).

可以在root用户下使用 `ulimit -u 4096` 这个设置来配置生效。

The package distributions when run as services under `systemd` will configure the number of threads for the Elasticsearch process automatically. No additional configuration is required.

如果使用`systemd`作为系统服务来启动ES则无须额外配置。
