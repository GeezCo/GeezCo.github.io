---
title: Go 语言入门笔记：从安装到 defer 的坑
description: Go 环境配置、iota 枚举、多返回值、指针与二级指针、defer 执行顺序等基础概念深度讲解
pubDate: '2022-07-14T08:29:00.000Z'
tags:
  - Go
draft: false
---

## 环境配置

### 安装后找不到 go 命令

```bash
go version
# sh: go: command not found
```

Go 的安装包不会自动配置 PATH。需要手动设置两个关键环境变量：

```bash
# ~/.bash_profile 或 ~/.zshrc
export GOROOT=/usr/local/go          # Go 安装目录
export GOPATH=$HOME/go               # 你的工作空间
export PATH=$PATH:$GOROOT/bin:$GOPATH/bin
```

`GOROOT` 和 `GOPATH` 的区别：

| 变量 | 作用 | 类比 |
|------|------|------|
| GOROOT | Go 编译器、标准库的位置 | JDK 安装目录 |
| GOPATH | 你的代码、第三方依赖的位置 | Maven 本地仓库 + 源码目录 |

执行 `source ~/.bash_profile` 后，`go version` 应该正常输出。

## const 和 iota：Go 的枚举利器

Go 没有 Java 的 enum 关键字。它用 const + iota 模拟枚举，而且更灵活：

```go
const (
    BEIJING = 10 * iota  // iota = 0 → 0
    SHANGHAI             // iota = 1 → 10
    SHENZHEN             // iota = 2 → 20
)
```

iota 在 const 块中从 0 开始，每多一行自动 +1。上一行的表达式会被"继承"：

```go
const (
    a, b = iota + 1, iota + 2   // iota=0: a=1, b=2
    c, d                        // iota=1: c=2, d=3 (表达式继承)
    e, f                        // iota=2: e=3, f=4

    g, h = iota * 2, iota * 3   // iota=3: g=6, h=9  (重新指定表达式)
    i, k                        // iota=4: i=8, k=12
    l, m                        // iota=5: l=10, m=15
)
```

输出：`ab cd ef = 1 2 2 3 3 4`、`gh ik lm = 6 9 8 12 10 15`

关键理解：**iota 是行号而不是值**，每个 const 声明块的 iota 从 0 独立计数。

## 多返回值：Go 的标志设计

```go
// 匿名返回：调用方看名字不知道含义
func test1(a string, b int) (int, int) {
    return 22, 33
}

// 命名返回：函数签名就是文档
func test2(a string, b int) (r1 int, r2 int) {
    r1 = 44
    r2 = 55
    return  // 裸 return，返回 r1 和 r2 的当前值
}
```

命名返回值的优势：函数签名自解释、defer 中可以修改返回值（重要特性）。

命名返回值的坑：裸 return 可读性差。简单函数用命名返回，复杂函数显式 return 值更安全。

## 指针：有但没有 C 那么危险

Go 的指针比 C 温和得多——没有指针运算，不存在 `ptr++` 这种用法：

```go
var a int = 10
var b int = 20

p := &a   // p 指向 a
q := &b   // q 指向 b

// 交换指针——不是交换值
p, q = q, p

fmt.Println(*p, *q)  // 20 10（a 和 b 的值没变，只是 p 和 q 指向变了）
```

二级指针在 Go 中少见但也存在：

```go
var a int = 10
qq := &a    // qq → a
dd := &qq   // dd → qq → a

fmt.Println(**dd)  // 10，两次解引用
```

实际开发中二级指针主要出现在：需要修改指针本身指向的场景（如链表操作）、某些标准库 API 的签名。

## defer：比你想象的微妙

defer 在函数返回前执行，常用于关闭文件、释放锁。但和 return 的交互顺序容易被误解：

```go
func Who_Is_First_Test() int {
    defer defer_call()   // 第 4 步：defer 在 return 之后执行
    return return_call() // 第 1 步：return 先算出值
}
```

执行顺序：

```text
main body output1
main body output2
return func call      ← return_call() 先执行
defer func call       ← defer_call() 后执行
who is first ? 0
f3                    ← 多个 defer 按 LIFO 出栈
f2
f1
main end2
main end1
```

三个关键规则：

1. **defer 的参数在声明时就求值**，不是执行时才求值
2. **多个 defer 按后进先出（LIFO）执行**——像叠盘子，最后放的先拿
3. **defer 可以修改命名返回值**——这就是为什么有些函数在 defer 里做 recover

```go
func tricky() (result int) {
    defer func() { result++ }()
    return 0   // 实际返回 1
}
```

## 小结

- GOROOT 和 GOPATH 是两个独立的职责
- iota 是行计数器，配合 const 实现灵活的枚举
- 多返回值 + 命名返回值是 API 设计利器
- Go 指针安全但语义精确
- defer 的执行顺序是 LIFO，且与 return 值的交互需要牢记