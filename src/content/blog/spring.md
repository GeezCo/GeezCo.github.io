---
title: Spring 基础入门
description: Spring 框架核心概念：IoC 控制反转、DI 依赖注入、AOP 面向切面编程
pubDate: '2026-05-19T10:06:51.870Z'
tags:
  - Spring
  - Java
draft: false
---

## 学习目标

- 理解 IoC（Inverse of Control）控制反转
- 理解 DI（Dependency Injection）依赖注入
- 理解 AOP（Aspect Oriented Programming）面向切面编程

## Spring 是什么？

Spring 是软件层面的框架，无特定场景限制，是一个"管理者"形象的企业级开发框架。

**核心优势**：让企业级项目可以做分层架构，开发者可以选择组件模块化开发。

## Spring 生态

各层已有成熟的解决方案：

| 层级 | 解决方案 |
|------|---------|
| MVC | Struts2、Spring MVC |
| ORMapping | Hibernate、MyBatis、Spring Data |
| 微服务 | Spring Cloud |

## Spring 核心特性

两大核心：**IoC / AOP**

### IoC（控制反转）

传统开发中，对象依赖由开发者手动创建和管理。Spring 通过 IoC 容器自动管理对象依赖，开发者只需声明依赖关系。

### DI（依赖注入）

DI 是 IoC 的具体实现方式。Spring 容器在创建对象时，自动将依赖对象注入。

### AOP（面向切面编程）

将横切关注点（如日志、事务、安全）从业务逻辑中分离，通过代理机制实现统一管理。

## 企业级项目特点

- 用户量大、并发量高
- 功能模块多且复杂
- 性能、安全性要求高
- 需求变化快、业务复杂