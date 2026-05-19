---
title: Github设置ssh免密登陆并配置hexo
description: ''
pubDate: '2026-05-15T08:29:00.000Z'
tags: []
draft: false
---
{% notel blue hexo deploy的时候时候报错: %}

- As previously announced, starting on August 13, 2021, at 09:00 PST, we will no longer accept account passwords when authenticating Git operations on GitHub.com. Instead, token-based authentication (for example, personal access, OAuth, SSH Key, or GitHub App installation token) will be required for all authenticated Git operations.

{% endnotel %}

大致意思是:
密码验证于2021年8月13日不再支持，不能再用密码方式去提交代码。请用使用 personal access token 替代。
### 解决方法:

---

{% tabs ssh gen setting %}

**Step 0.生成密钥对**

```bash
cd ~
```

· 删除已经存在的 .ssh 目录(如果有)

```bash
rm -r .ssh/
```

· 生成密钥对.

```bash
ssh-keygen -t rsa -C *你的github邮箱地址*
```

- 遇到提示enter就OK(也可以自己命名密钥名称,提取密码等,这里默认)
**Step 1.进入本地ssh目录**

```bash
cd .ssh/
```

- 此目录下的 id_rsa 就是你的私钥(要保存好 ❌不要泄露❌ )
**Step 2. 查看id_rsa.pub （公钥**

```bash
cat id_rsa.pub
```

复制下来(所有)

**Step 3.GitHub Account Setting**
· 登录 GitHub，点击用户头像→Settings→SSHandGPG keys
· 点击 New SSH Key 复制到Key 文本框中 Title 随便起名
· Add SSH Key 就可以了

{% endtabs %}

---

- 接下来是 hexo 配置

{% tabs hexo setting %}

验证下是否配置是否生效:

```bash
ssh -T git@github.com
```

显示successfully xxxx 就OK

最后配置_config.yml:

```bash
deploy:
  type: git
  repo: git@github.com:你的用户名/仓库名.git
  branch: master
```

{% endtabs %}

{% note danger %}

注意: 用户名是你 github的名字 不是之前的登录Username and 看好你的git默认的branch是什么

{% endnote %}
