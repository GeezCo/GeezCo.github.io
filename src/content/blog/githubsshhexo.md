---
title: GitHub SSH 免密登录配置
description: 配置 GitHub SSH 密钥实现免密推送，解决 Hexo 部署密码验证问题
pubDate: '2026-05-15T08:29:00.000Z'
tags:
  - Git
  - SSH
  - Hexo
draft: false
---

## 问题背景

Hexo deploy 时报错：

```text
As previously announced, starting on August 13, 2021, at 09:00 PST,
we will no longer accept account passwords when authenticating Git operations on GitHub.com.
Instead, token-based authentication (for example, personal access, OAuth, SSH Key,
or GitHub App installation token) will be required for all authenticated Git operations.
```

**原因**：GitHub 已不支持密码验证，需使用 Token 或 SSH 密钥。

## 解决方案：配置 SSH 密钥

### Step 1：生成密钥对

进入用户目录：

```bash
cd ~
```

删除已存在的 `.ssh` 目录（如果有）：

```bash
rm -r .ssh/
```

生成 RSA 密钥对：

```bash
ssh-keygen -t rsa -C your_email@example.com
```

遇到提示直接回车（使用默认配置）。

### Step 2：查看公钥

进入 `.ssh` 目录：

```bash
cd .ssh/
```

- `id_rsa`：私钥（保密，不要泄露）
- `id_rsa.pub`：公钥（需上传到 GitHub）

查看公钥：

```bash
cat id_rsa.pub
```

复制全部内容。

### Step 3：GitHub 配置

登录 GitHub：

1. 点击用户头像 → Settings
2. SSH and GPG keys → New SSH Key
3. 粘贴公钥内容
4. Title 随意命名
5. Add SSH Key

### Step 4：验证连接

```bash
ssh -T git@github.com
```

显示 `successfully` 即配置成功。

## Hexo 配置

修改 `_config.yml`：

```yaml
deploy:
  type: git
  repo: git@github.com:username/repository.git
  branch: master
```

**注意事项**：

- `username` 是 GitHub 用户名（不是登录 Username）
- `branch` 确认仓库默认分支名称（master 或 main）