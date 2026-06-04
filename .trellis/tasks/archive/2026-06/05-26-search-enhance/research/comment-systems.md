# 开放评论系统调研

## 调研目标

为博客搜索功能寻找支持评论数 API 的评论系统，以便实现按评论数排序。

## 评论系统对比

### 1. Giscus（当前使用）

**基础信息**
- 基于 GitHub Discussions
- 完全免费
- 无需自建服务器

**优点**
- ✅ 已集成，无需迁移
- ✅ 支持 GitHub 登录
- ✅ 数据存储在 GitHub（用户拥有数据）
- ✅ 支持 Markdown、代码高亮、Emoji
- ✅ 支持嵌套回复和反应

**缺点**
- ❌ 需要 GitHub 账号才能评论（门槛较高）
- ❌ 评论数 API 需要调用 GitHub GraphQL API
- ❌ API 有速率限制（5000 次/小时）

**评论数 API**
```graphql
query {
  repository(owner: "ProcessMonitor", name: "wincy-blog") {
    discussion(number: 1) {
      comments {
        totalCount
      }
    }
  }
}
```

**参考资料**
- [Giscus GitHub](https://github.com/giscus/giscus)
- [Moving from utterances to giscus](https://shipit.dev/posts/from-utterances-to-giscus.html)

---

### 2. Remark42（推荐自建方案）

**基础信息**
- 自托管，开源（MIT）
- Go 语言编写，轻量级
- 支持多种登录方式（GitHub, Google, Facebook, Email）

**优点**
- ✅ **完整的 REST API**（包括评论数）
- ✅ 隐私友好，无追踪
- ✅ 支持匿名评论
- ✅ 支持 Markdown、图片上传
- ✅ 内置反垃圾评论机制
- ✅ 支持评论导入（Disqus, WordPress）
- ✅ 有 Astro 集成文档

**缺点**
- ❌ 需要自建服务器（VPS 或 Docker）
- ❌ 需要维护和备份

**评论数 API**
```bash
GET /api/v1/counts?site=<site_id>&url=<page_url>

# 返回示例
{
  "https://example.com/post1": 42,
  "https://example.com/post2": 15
}
```

**部署方式**
- Docker Compose（推荐）
- 二进制文件
- 支持 SQLite 或 BoltDB

**参考资料**
- [Remark42 官网](https://remark42.com/)
- [Remark42 API 文档](https://remark42.com/docs/contributing/api/)
- [Astro 集成指南](https://remark42.com/docs/manuals/integration-with-astro/)
- [The Best Self-Hosted Comment Systems in 2025](https://deployn.de/en/blog/self-hosted-comment-systems/)

---

### 3. Cusdis（轻量级自建）

**基础信息**
- 自托管，开源
- Node.js + SQLite
- 极简设计

**优点**
- ✅ 非常轻量（< 5KB JS）
- ✅ 无需登录即可评论
- ✅ 管理后台简洁
- ✅ 支持 Webhook

**缺点**
- ❌ 功能较少（无嵌套回复）
- ❌ API 文档不完善
- ❌ 社区较小

**评论数 API**
需要自行查询数据库或通过 Webhook 统计

**参考资料**
- [Cusdis Alternatives](http://alternativeto.net/software/cusdis/)

---

### 4. Isso（Python 自建）

**基础信息**
- 自托管，开源
- Python + SQLite
- Disqus 替代品

**优点**
- ✅ 轻量级（12KB JS）
- ✅ 无广告、无追踪
- ✅ 支持匿名评论
- ✅ 支持 Markdown
- ✅ 支持从 Disqus/WordPress 导入

**缺点**
- ❌ 界面较简陋
- ❌ API 功能有限
- ❌ 社区活跃度一般

**评论数 API**
```bash
GET /count?uri=<page_url>

# 返回示例
1
```

**参考资料**
- [Isso 官网](https://isso-comments.de/)
- [Isso GitHub](https://github.com/isso-comments/isso)
- [Quickstart](https://isso-comments.de/docs/guides/quickstart/)

---

### 5. Utterances（GitHub Issues）

**基础信息**
- 基于 GitHub Issues
- 完全免费
- Giscus 的前身

**优点**
- ✅ 极简设计
- ✅ 无需服务器
- ✅ 数据存储在 GitHub

**缺点**
- ❌ 功能比 Giscus 少（无嵌套回复）
- ❌ 使用 Issues 而非 Discussions（不够语义化）
- ❌ 评论数 API 同样需要 GitHub API

**评论数 API**
```bash
GET /repos/{owner}/{repo}/issues?labels=<page_label>
```

**参考资料**
- [Tips for using giscus](https://www.brycewray.com/posts/2022/05/tips-using-giscus/)

---

## 对比总结表

| 特性 | Giscus | Remark42 | Cusdis | Isso | Utterances |
|------|--------|----------|--------|------|------------|
| **托管方式** | GitHub | 自建 | 自建 | 自建 | GitHub |
| **评论数 API** | ✅ GraphQL | ✅ REST | ⚠️ 有限 | ✅ REST | ✅ REST |
| **登录要求** | GitHub | 多种 | 可选 | 可选 | GitHub |
| **嵌套回复** | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Markdown** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **隐私友好** | ⚠️ | ✅ | ✅ | ✅ | ⚠️ |
| **维护成本** | 无 | 中 | 低 | 低 | 无 |
| **社区活跃度** | 高 | 高 | 低 | 中 | 中 |

---

## 推荐方案

### 方案 A：保持 Giscus + 预构建评论数（推荐）

**实现方式**
1. 构建时通过 GitHub GraphQL API 获取所有文章的评论数
2. 写入 `src/data/comment-counts.json`
3. Pagefind 索引时包含评论数
4. 搜索时直接使用预构建的评论数排序

**优点**
- ✅ 无需迁移评论系统
- ✅ 搜索时无需额外 API 调用（性能最优）
- ✅ 评论数可缓存

**缺点**
- ❌ 评论数不是实时的（需要重新构建）
- ❌ 需要配置 GitHub token

**实现复杂度**：⭐⭐（中等）

---

### 方案 B：迁移到 Remark42

**实现方式**
1. 部署 Remark42 服务（Docker）
2. 迁移现有 Giscus 评论（手动或脚本）
3. 搜索时调用 Remark42 的 `/api/v1/counts` API

**优点**
- ✅ 完整的 REST API
- ✅ 降低评论门槛（支持多种登录方式）
- ✅ 数据完全自主控制
- ✅ 评论数实时更新

**缺点**
- ❌ 需要自建服务器（成本 + 维护）
- ❌ 需要迁移现有评论
- ❌ 用户需要重新登录

**实现复杂度**：⭐⭐⭐⭐（高）

---

### 方案 C：暂不支持评论数排序

**实现方式**
- 仅实现标题匹配、内容匹配、日期排序
- 评论数排序作为未来功能

**优点**
- ✅ 无需额外工作
- ✅ 可以先实现其他排序功能

**缺点**
- ❌ 不满足用户需求

**实现复杂度**：⭐（最低）

---

## 建议

**短期（当前任务）**：采用方案 C
- 先实现标题匹配、相关性、日期排序
- 评论数排序标记为"未来功能"

**中期（下个迭代）**：采用方案 A
- 构建时预获取评论数
- 成本低，性能好

**长期（如果需要）**：考虑方案 B
- 如果用户反馈 GitHub 登录门槛太高
- 如果需要更多评论功能（如审核、反垃圾）

---

## 参考资料

- [The Best Self-Hosted Comment Systems in 2025](https://deployn.de/en/blog/self-hosted-comment-systems/)
- [A survey of commenting systems for static websites](https://technologytales.com/a-survey-of-commenting-systems-for-static-websites/)
- [Various ways to include comments on your static site](https://darekkay.com/blog/static-site-comments/)
- [Open-source comments comparison](https://github.com/pozitron57/open-source-comments)
