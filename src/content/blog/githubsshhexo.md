---
title: GitHub SSH 免密登录的原理与配置
description: 深入理解非对称加密在 Git 认证中的应用，从 RSA 密钥对生成到 GitHub SSH 配置的完整流程，以及 GitHub 弃用密码认证背后的安全考量
pubDate: '2023-06-20T08:29:00.000Z'
tags:
  - Git
  - SSH
  - Hexo
  - 安全
draft: false
---

## 问题的起点：GitHub 不再接受密码

2021 年 8 月 13 日起，GitHub 彻底关闭了 Git 操作中的密码认证：

```text
remote: Support for password authentication was removed on August 13, 2021.
remote: Please see https://docs.github.com/en/get-started/getting-started-with-git/
        about-remote-repositories#cloning-with-https-urls for information on
        currently recommended modes of authentication.
```

这意味着 `git push https://github.com/user/repo.git` 再也不能弹一个框让你输入 GitHub 密码了。你必须使用以下三种方式之一：

| 方式 | 适用场景 | 安全性 |
|------|---------|--------|
| Personal Access Token (PAT) | CI/CD、临时授权 | 中（Token 可能泄漏） |
| SSH Key | 个人开发机器 | 高（私钥不出本地） |
| GitHub CLI (`gh auth`) | 交互式开发 | 高（OAuth 流程） |

本文聚焦于 SSH Key 方案——也是 Hexo 博客部署最常用的方式。

## SSH 密钥对的原理

在配置之前，先理解你正在做什么。

### 非对称加密的核心

```
                    ┌──────────────────────────────────┐
                    │         非对称加密模型             │
                    ├──────────────────────────────────┤
                    │                                  │
                    │   私钥 (Private Key)              │
                    │   ┌─────────────────────┐        │
                    │   │ 留在你的机器上        │        │
                    │   │ 永远不要给任何人      │        │
                    │   │ ~/.ssh/id_rsa        │        │
                    │   └─────────┬───────────┘        │
                    │             │ 数学相关            │
                    │             │                   │
                    │   公钥 (Public Key)               │
                    │   ┌─────────────────────┐        │
                    │   │ 上传到 GitHub        │        │
                    │   │ 可以公开             │        │
                    │   │ ~/.ssh/id_rsa.pub    │        │
                    │   └─────────────────────┘        │
                    │                                  │
                    └──────────────────────────────────┘
```

认证过程：

```
1. 你的机器 → GitHub: "我是 adam，请求连接"
2. GitHub → 你的机器: "好，这是随机数据 X，你用私钥加密它"
3. 你的机器: 用私钥加密 X → 得到 Y → 发给 GitHub
4. GitHub: 用你之前上传的公钥解密 Y → 得到 X' → X' == X → 认证通过 ✓
```

公钥加密的内容只有私钥能解密，私钥签名的内容只有公钥能验证。GitHub 用的是签名验证：你用私钥签名一段随机挑战，GitHub 用公钥验证签名——签名对的说明你持有私钥，即你是你声称的那个人。

### 为什么不用密码

密码的问题：
- **可被暴力破解**：即使 GitHub 做了速率限制，密码本身的熵不够高
- **可被钓鱼**：你无法在 git push 时区分真 GitHub 和中间人
- **可被复用**：很多人在多个平台用同一个密码
- **无法撤销单一设备**：改密码影响所有设备

SSH 密钥的优势：
- **2048/4096 位密钥**：暴力破解需要宇宙年龄级别的时间
- **每台设备独立的密钥对**：一台机器被 compromise 不影响其他设备
- **可精准撤销**：在 GitHub 上删掉某一个公钥即可

## 完整配置流程

### Step 1：检查现有密钥

```bash
ls -la ~/.ssh/
```

如果已经有 `id_rsa` + `id_rsa.pub` 或者 `id_ed25519` + `id_ed25519.pub`，你可以直接用现有的，不需要重新生成。

### Step 2：生成密钥对

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

参数说明：

| 参数 | 含义 |
|------|------|
| `-t ed25519` | 密钥类型。Ed25519 比 RSA 更安全、更快、更短 |
| `-C "email"` | 注释，帮助你识别这个密钥的用途 |

如果你的系统或 Git 客户端比较老，不支持 Ed25519，退回到 RSA：

```bash
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

`-b 4096` 指定密钥长度——不要用默认的 2048 位。

交互提示：

```text
Enter file in which to save the key (/Users/you/.ssh/id_ed25519):
  → 直接回车，用默认路径

Enter passphrase (empty for no passphrase):
  → 建议设置 passphrase（给私钥再加一层密码保护）
  → CI/CD 场景可以留空
```

**关于 passphrase**：为私钥设置密码增加一层保护——即使私钥文件泄漏，攻击者还需要破解 passphrase。日常使用可以配合 `ssh-agent` 实现一次输入、长期有效：

```bash
ssh-add ~/.ssh/id_ed25519
# 输入一次 passphrase，之后当前 session 内免密
```

### Step 3：理解生成的文件

```bash
~/.ssh/
├── id_ed25519       # 私钥 - chmod 600（只有你自己可读写）
└── id_ed25519.pub   # 公钥 - 可以公开
```

一个公钥示例：

```text
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGx... your_email@example.com
│           │                                      │
│           └── Base64 编码的公钥数据                 └── 注释
└── 密钥类型
```

### Step 4：上传公钥到 GitHub

```bash
cat ~/.ssh/id_ed25519.pub
# 复制输出的全部内容（从 ssh-ed25519 开头到注释结尾）
```

GitHub 操作路径：
```
Settings → SSH and GPG keys → New SSH key
  Title: "MacBook Pro 2024"    ← 标识设备，方便以后管理
  Key:   <粘贴公钥内容>
  → Add SSH key
```

### Step 5：验证连接

```bash
ssh -T git@github.com
```

首次连接会看到：

```text
The authenticity of host 'github.com (140.82.xxx.xxx)' can't be established.
ECDSA key fingerprint is SHA256:p2QAMXNIC1TJYWeIOttrVc98/R1BUFWu3/LiyKgUfQM.
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

这是 SSH 的 known_hosts 机制——你的客户端第一次见到 github.com，不确定对方是不是真的 github.com。显示出来的 fingerprint 可以去 [GitHub 官方文档](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/githubs-ssh-key-fingerprints) 核对。确认一致后输入 `yes`。

成功后：

```text
Hi username! You've successfully authenticated, but GitHub does
not provide shell access.
```

后半句 "does not provide shell access" 是正常的——GitHub 的 SSH 服务器只用于 Git 操作，不会给你开 shell。

### Step 6：配置 Git 使用 SSH

如果你的仓库还是 HTTPS URL：

```bash
git remote -v
# origin  https://github.com/user/repo.git (fetch)
# origin  https://github.com/user/repo.git (push)

# 切换到 SSH
git remote set-url origin git@github.com:user/repo.git
```

格式对比：

```
HTTPS: https://github.com/用户名/仓库名.git
SSH:   git@github.com:用户名/仓库名.git
```

## Hexo 的 SSH 配置

Hexo 的部署配置在 `_config.yml`：

```yaml
deploy:
  type: git
  repo: git@github.com:username/username.github.io.git
  branch: main
```

注意两点：
1. `username` 是 GitHub 用户名（出现在 URL 中的那个），不是登录邮箱
2. `branch` 确认是 `main` 还是 `master`——GitHub 2020 年起新建仓库默认 `main`

如果部署失败：

```bash
hexo deploy
# 报错: Permission denied (publickey)
```

很可能是 ssh-agent 没有加载对应的密钥，或者用系统用户生成密钥后与 Hexo 运行用户不同。调试：

```bash
ssh -vT git@github.com
# -v 会打印详细的认证流程，看具体卡在哪一步
```

## 多设备/多密钥管理

不同的设备应该有**独立的密钥对**：

```
GitHub SSH Keys:
  ├── MacBook Pro   (ed25519, 2024-03)
  ├── Linux 服务器    (ed25519, 2024-06)
  └── Windows 台式机  (rsa 4096, 2023-11)
```

好处：
- 某台设备丢失/被黑，删除对应的公钥即可
- 不影响其他设备的正常使用

`~/.ssh/config` 可以管理多个密钥：

```
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes

Host github-work
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_work
  IdentitiesOnly yes
```

然后：
```bash
git clone git@github-work:company/repo.git
# 这会使用 id_ed25519_work 而不是默认的 id_ed25519
```

## 安全注意事项

- **私钥 (`id_ed25519`) 永远不要分享、上传、复制到其他机器**——需要新设备就生成新密钥对
- **passphrase 值得设置**——它是私钥的第二道防线
- **定期检查 GitHub 的 SSH Keys 列表**——删除不认识或不用的
- **不要用 `rm -rf ~/.ssh/` 来"重置"**——如果有其他服务的密钥也会被一并删除

## 总结

- GitHub 关闭密码认证不是给你添麻烦，而是从根本上消除了密码泄漏和暴力破解的风险
- 非对称加密让"验证你是谁"变成了数学问题而非信任问题
- 每台设备独立的密钥对——一台被黑不影响其他
- `ssh -T git@github.com` 是调试 SSH 连接的第一步
- Ed25519 > RSA 4096 > RSA 2048