---
title: 快速开始
description: 本指南将帮助你快速上手 GzDoc 平台
order: 2
---

本指南将帮助你快速上手 GzDoc 平台。

## 环境要求

### 后端环境
- Java 17+
- Maven 3.8+
- PostgreSQL 14+
- Redis 6+

### AI 环境
- Python 3.10+
- CUDA 11.8+（可选，用于 GPU 加速）

## 安装步骤

### 1. 克隆项目

```bash
git clone https://github.com/GeezCo/gzDoc.git
cd gzDoc
```

### 2. 配置数据库

```sql
CREATE DATABASE gzdoc;
CREATE USER gzdoc_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE gzdoc TO gzdoc_user;
```

### 3. 启动后端服务

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

### 4. 启动 AI 服务

```bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 5. 访问系统

打开浏览器访问：
- 后端 API: http://localhost:8080
- AI 服务: http://localhost:8000
- 前端界面: http://localhost:3000

## 下一步

- 查看 [架构设计](./architecture/overview) 了解系统架构
- 查看 [开发指南](./development/setup) 了解开发流程
- 查看 [部署指南](./deployment/docker) 了解部署方式
