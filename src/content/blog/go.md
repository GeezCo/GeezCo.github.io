---
title: go问题汇总合集
description: ''
pubDate: '2026-05-15T08:29:00.000Z'
tags: []
draft: false
---
Desc: 所有的关于go的学习问题记录都在这个文章

# 安装部分

### 问题一: 安装后command not found

```bash
sh-3.2# go -version
sh: go: command not found
```

- 问题一解决方案:
1. check config file:

```bash
vim ~/.bash_profile
```

- 如果没有bash_profile就创建
2. 写入:

```bash
export GOROOT=/usr/local/go
export GOPATH=/usr/local/GO
#GOPATH可以写自己项目的文件地址
export PATH=$PATH:$GOROOT/bin:$GOPATH/bin
```

3. 保存后:

```bash
source ~/.bash_profile
```

4. check if it works.

```bash
sh-3.2# go version
go version go1.18 darwin/amd64
```

# 学习部分

## const关键字&& iota表达式

- go 变量声明 ：关键字 + 变量名 + 变量类型

```go
package main

import "fmt"

const (
  //iota是一个 表达式
  BEIJING = 10 * iota //iota = 0
  SHNAGHAI, // iota == 1
  SHENZHEN, // iota == 2
)
const (
  //批量赋值
    a,b = iota + 1 , iota + 2 // iota = 0
  c,d // iota = 1
  e,f

  g,h = iota * 2 , iota * 3
  i,k
  l,m
)

func main(){
  const length int = 123
  fmt.Println("beijing = ", BEIJING)
    fmt.Println("shanghai = ", SHANGHAI)
    fmt.Println("shenzhen = ", SHENZHEN)

    fmt.Println("ab cd ef = ", a, b, c, d, e, f)
    fmt.Println("gh ik lm = ", g, h, i, k, l, m)
}
```

```bash
beijing =  0
shanghai =  10
shenzhen =  20
ab cd ef =  1 2 2 3 3 4
gh ik lm =  6 9 8 12 10 15
```

## GO方法声明和返回值

- 关键字 + 方法名 + 返回值类型

eg : func test(args .. ) int

```go
package main

import "fmt"

func test(a string, b int) int {
    fmt.Println("a ", a)
    fmt.Println("b ", b)
    c := 11
    return c
}

//返回多个返回值 匿名形参
func test1(a string, b int) (int, int) {
    fmt.Println("method name =", a)
    fmt.Println("arg int =", b)
    return 22, 33
}

//返回多个返回值 有形参名称
//或者可以写 func test2(a string, b int) (r1 , r2 int)
func test2(a string, b int) (r1 int, r2 int) {
    fmt.Println("method name =", a)
    fmt.Println("arg int =", b)
    fmt.Println("r1 = ", r1)
    fmt.Println("r2 = ", r2)
    // 返回值赋值
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

```bash
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

## go指针

demo：

```go
var (
    tmp *int
  q *int
  p *int
) //batch 声明

    var a int = 10
    var b int = 20
    //指针赋值
    p = &a
    q = &b

    fmt.Println("p , q", *p, *q)
    //简单指针操作：交换
    tmp = p
    p = q
    q = tmp

    fmt.Println("p , q", *p, *q)
    //二级指针
  var (
    dd **int
  )
    var qq *int
    qq = &a
    dd = &qq

    fmt.Println("qq:", *qq)
    fmt.Println("dd:", **dd)
```

输出：

```bash
p , q 10 20
p , q 20 10
qq: 10
dd: 10
```

## defer 关键字

- return和defer 的优先级 demo：

```go
package main

import "fmt"

func f1() {
    fmt.Println("f1")
}
func f2() {
    fmt.Println("f2")
}
func f3() {
    fmt.Println("f3")
}

func Who_Is_First_Test() int {
  defer defer_call()
  return return_call()
}

func defer_call() int {
  fmt.Println("defer func call")
    return 0
}
func return_call() int {
  fmt.Println("defer func call")
    return 0
}

func mian(){
  defer fmt.Println("main end1")
  defer fmt.Println("main end2)

    defer f1()
    defer f2()
    defer f3()

    fmt.Println("main body output1 ")
    fmt.Println("main body output2 ")
    fmt.Println("whos is first ?" , Who_Is_First_Test())

}
```

```plain text
main body output1
main body output2
return func call
defer func call
Who is first? 1
f3
f2
f1
main end2
main end1
```
