---
title: Spring 框架核心：IoC 与 AOP 深度解析
description: 从传统开发到控制反转，深入理解Spring IoC容器、依赖注入、面向切面编程及企业级生态
pubDate: '2023-03-12T10:06:51.870Z'
tags:
  - Spring
  - Java
draft: false
---

## 为什么要有 Spring？

先看一段不用 Spring 的代码：

```java
public class OrderService {
    private OrderRepository repository = new OrderRepositoryImpl();
    private PaymentGateway payment = new AlipayGateway();
    
    public void createOrder(Order order) {
        repository.save(order);
        payment.pay(order.getAmount());
    }
}
```

问题在哪里？

- `OrderService` 自己创建依赖对象，换个实现就得改代码
- 每个 Service 都自己 new 对象，散落各处难以统一管理
- 单元测试时想换个 Mock 对象？改源码才行

Spring 要解决的核心问题：**谁负责创建对象？谁来管理对象之间的关系？**

## IoC：谁来当老板

### 传统模式 vs 控制反转

```
传统模式（你控制一切）：
  OrderService ──new──▶ OrderRepositoryImpl
  OrderService ──new──▶ AlipayGateway
  
IoC 模式（容器接管）：
  Spring 容器 ──注入──▶ OrderService
                        ├── OrderRepository（容器帮它找）
                        └── PaymentGateway（容器帮它找）
```

控制反转的本质是**把创建和管理对象的控制权从程序员手里交给框架**。你不再 new 对象，而是告诉 Spring"我需要什么"，Spring 负责装配。

### 三种注入方式

**构造器注入（推荐）**：

```java
@Service
public class OrderService {
    private final OrderRepository repository;
    private final PaymentGateway payment;
    
    public OrderService(OrderRepository repository, PaymentGateway payment) {
        this.repository = repository;
        this.payment = payment;
    }
}
```

为什么首选构造器注入？依赖不可变（final）、对象创建完就能用、不依赖反射设值。

**Setter 注入**：可选依赖时可以，但对象可能出现未完全初始化的中间状态。

**字段注入（@Autowired 直接写字段上）**：代码最短但最难测试，你没法在单元测试里传入依赖而不启动 Spring 容器。

### Bean 的生命周期

```
实例化 → 属性填充 → BeanNameAware → BeanFactoryAware
→ BeanPostProcessor(before) → InitializingBean.afterPropertiesSet
→ 自定义 init-method → BeanPostProcessor(after)
→ 就绪可用
→ DisposableBean.destroy → 自定义 destroy-method → 生命周期结束
```

理解生命周期很重要——AOP 就是在 BeanPostProcessor 阶段把代理织入的。

## AOP：横切逻辑的统一出口

### 为什么不是 OOP 的事？

```
OrderService    UserService    PaymentService
     │               │               │
     ├── 日志         ├── 日志         ├── 日志
     ├── 事务         ├── 事务         ├── 事务
     ├── 权限检查     ├── 权限检查     ├── 权限检查
     ├── 业务逻辑     ├── 业务逻辑     ├── 业务逻辑
     └── 异常处理     └── 异常处理     └── 异常处理
```

日志、事务、权限这些横切逻辑散落在每个方法里。OOP 的垂直继承树处理不了这种"横向"代码。AOP 的思路是：**把横切逻辑抽成切面，在需要的地方织入**。

### 核心概念

| 概念 | 说明 | 示例 |
|------|------|------|
| Joinpoint | 可被拦截的点 | 方法调用、字段赋值 |
| Pointcut | 匹配规则 | `execution(* com.demo.service.*.*(..))` |
| Advice | 拦截到之后做什么 | 开启事务、记录日志 |
| Aspect | Advice + Pointcut | `@Aspect` 注解的类 |
| Weaving | 把切面织入目标对象 | 编译期、类加载期、运行时 |

### Spring AOP 怎么做到的

Spring AOP 默认用 JDK 动态代理（基于接口）或 CGLIB（基于子类）。它不修改原 class 文件，而是在 BeanPostProcessor 阶段生成一个代理对象：

```java
// Spring 实际返回的不是你的 UserService，而是：
// JDK 代理: Proxy(UserServiceImpl) → 实现了 UserService 接口的代理对象
// CGLIB 代理: UserServiceImpl$$EnhancerBySpringCGLIB → 子类代理
```

限制：只能拦截 Spring Bean 的 public 方法。想拦截 private 方法或非 Bean 的调用，你需要 AspectJ（编译期织入）。

## Spring 生态全景

```
                      Spring Boot
                    (自动配置/起步依赖)
                          │
          ┌───────────────┼───────────────┐
          │               │               │
     Spring MVC      Spring Data     Spring Cloud
     (Web层)         (数据层)         (微服务)
          │               │               │
          ▼               ▼               ▼
     REST API        JPA / Redis    服务发现/配置中心/网关
     WebSocket       MongoDB / ES   熔断/限流/链路追踪
          │               │               │
          └───────────────┼───────────────┘
                          │
                    Spring Framework
                   (IoC / AOP / 事件)
```

Spring 早已不是单一的 DI 容器——从单体 Web 到微服务体系，每层都有成熟方案。

## 不是所有东西都应该进容器

Spring 管理一切是陷阱：

- **值对象（VO/DTO）**：数据载体，放容器里干嘛？
- **纯工具类**：无状态无依赖的静态方法，不需要容器
- **领域实体**：应该由 ORM（Hibernate/MyBatis）管理生命周期

容器管理的是**有依赖关系、需要生命周期管理的 Bean**，不是所有对象。

## 总结

- IoC 让容器管理对象创建和装配，你的代码只关心业务逻辑
- AOP 把横切关注点从业务代码中剥离，保持单一职责
- 构造器注入优于字段注入——可测试、不可变、无魔法
- Spring 是一套生态，不是一个框架，按需选用