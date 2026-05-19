---
title: Spring基础一篇就够了
description: ''
pubDate: '2026-05-15T08:29:00.000Z'
tags: []
draft: false
---
目标：
理解IoC （inverse of control）/DI （dependency injection）
理解 AOP（面向切面编程）

Spring是什么？（不是重点一笔带过）
是软件层面的框架，无特定场景，是一个管理者形象，企业级开发框架，让企业级应用更快开发，优势就是让企业级项目可以做分层架构，开发者可以选择组件模块化开发。
目前已经有各个不同层的解决方案，比如：
MVC：有strust2 SpringMVC
ORMapping：Hibernate Mybatis Spring Data
微服务分布式架构：Spring Cloud
它的两大核心就是 IoC / AOP

企业级项目一般： 用户量大 并发量高 功能模块多又复杂；性能、安全性要求高；需求变化快，业务又复杂。
