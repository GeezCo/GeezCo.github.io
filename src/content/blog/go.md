---
title: Go 语言学习问题汇总
description: Go 安装配置、const/iota、方法声明、指针、defer 关键字等基础知识点
pubDate: '2026-05-15T08:29:00.000Z'
tags:
  - Go
draft: false
---

## 安装部分

### 问题：command not found

安装后执行：

```bash
go -version
sh: go: command not found
```

### 解决方案

检查配置文件：

```bash
vim ~/.bash_profile
```

如果没有则创建，写入：

```bash
export GOROOT=/usr/local/go
export GOPATH=/usr/local/GO
export PATH=$PATH:$GOROOT/bin:$GOPATH/bin
```

保存后执行：

```bash
source ~/.bash_profile
```

验证：

```bash
go version
go version go1.18 darwin/amd64
```

## const 关键字与 iota 表达式

Go 变量声明：关键字 + 变量名 + 变量类型

### iota 示例

```go
package main

import "fmt"

const (
    BEIJING = 10 * iota  // iota = 0
    SHANGHAI             // iota = 1
    SHENZHEN             // iota = 2
)

const (
    a, b = iota + 1, iota + 2  // iota = 0
    c, d                       // iota = 1
    e, f                       // iota = 2

    g, h = iota * 2, iota * 3  // iota = 3
    i, k                       // iota = 4
    l, m                       // iota = 5
)

func main() {
    const length int = 123
    fmt.Println("beijing = ", BEIJING)
    fmt.Println("shanghai = ", SHANGHAI)
    fmt.Println("shenzhen = ", SHENZHEN)

    fmt.Println("ab cd ef = ", a, b, c, d, e, f)
    fmt.Println("gh ik lm = ", g, h, i, k, l, m)
}
```

输出：

```text
beijing =  0
shanghai =  10
shenzhen =  20
ab cd ef =  1 2 2 3 3 4
gh ik lm =  6 9 8 12 10 15
```

## 方法声明与返回值

关键字 + 方法名 + 返回值类型

```go
package main

import "fmt"

// 单返回值
func test(a string, b int) int {
    fmt.Println("a ", a)
    fmt.Println("b ", b)
    c := 11
    return c
}

// 多返回值（匿名形参）
func test1(a string, b int) (int, int) {
    fmt.Println("method name =", a)
    fmt.Println("arg int =", b)
    return 22, 33
}

// 多返回值（命名形参）
func test2(a string, b int) (r1 int, r2 int) {
    fmt.Println("method name =", a)
    fmt.Println("arg int =", b)
    fmt.Println("r1 = ", r1)
    fmt.Println("r2 = ", r2)
    r1 = 44
    r2 = 55
    return
}

func main() {
    c := test("123", 512)
    fmt.Println("c= ", c)

    ret1, ret2 := test1("test1", 1024)
    fmt.Println("ret1 , ret2 :", ret1, ret2)

    ret3, ret4 := test2("test2", 2048)
    fmt.Println("ret3 , ret4 :", ret3, ret4)
}
```

输出：

```text
a  123
b  512
c=  11
method name = test1
arg int = 1024
ret1 , ret2 : 22 33
method name = test2
arg int = 2048
r1 =  0
r2 =  0
ret3 , ret4 : 44 55
```

## Go 指针

```go
var (
    tmp *int
    q   *int
    p   *int
)

var a int = 10
var b int = 20

// 指针赋值
p = &a
q = &b

fmt.Println("p , q", *p, *q)

// 指针交换
tmp = p
p = q
q = tmp

fmt.Println("p , q", *p, *q)

// 二级指针
var dd **int
var qq *int
qq = &a
dd = &qq

fmt.Println("qq:", *qq)
fmt.Println("dd:", **dd)
```

输出：

```text
p , q 10 20
p , q 20 10
qq: 10
dd: 10
```

## defer 关键字

defer 与 return 的执行顺序：

```go
package main

import "fmt"

func f1() { fmt.Println("f1") }
func f2() { fmt.Println("f2") }
func f3() { fmt.Println("f3") }

func defer_call() int {
    fmt.Println("defer func call")
    return 0
}

func return_call() int {
    fmt.Println("return func call")
    return 0
}

func Who_Is_First_Test() int {
    defer defer_call()
    return return_call()
}

func main() {
    defer fmt.Println("main end1")
    defer fmt.Println("main end2")

    defer f1()
    defer f2()
    defer f3()

    fmt.Println("main body output1")
    fmt.Println("main body output2")
    fmt.Println("who is first ?", Who_Is_First_Test())
}
```

输出：

```text
main body output1
main body output2
return func call
defer func call
who is first ? 0
f3
f2
f1
main end2
main end1
```

**执行顺序**：

1. return 先执行
2. defer 后执行
3. 多个 defer 按 LIFO（后进先出）顺序执行