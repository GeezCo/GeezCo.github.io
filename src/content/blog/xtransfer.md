---
title: xTransfer三面凉经
description: ''
pubDate: '2026-05-15T08:29:00.000Z'
tags: []
draft: false
---
## 一面

1. 自我介绍
2. 如何保证幂等性
3. 企业级项目怎么传递TraceId
4. rpc注册和发现流程 (聊很久)
5. 线程池的核心参数 任务的执行流程？
6. 算法lc 61 旋转链表

```java
/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode() {}
 *     ListNode(int val) { this.val = val; }
 *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }
 * }
 */
class Solution {
    public ListNode rotateRight(ListNode head, int k) {
        // 处理边界情况
        if (head == null || head.next == null || k == 0) {
            return head;
        }

        // 计算链表长度
        int length = 1;
        ListNode tail = head;
        while (tail.next != null) {
            tail = tail.next;
            length++;
        }

        // 对k取模，避免不必要的旋转
        k = k % length;
        if (k == 0) {
            return head;
        }

        // 找到新的尾节点（第length-k个节点）
        ListNode newTail = head;
        for (int i = 1; i < length - k; i++) {
            newTail = newTail.next;
        }

        // 重新连接链表
        ListNode newHead = newTail.next;
        newTail.next = null;
        tail.next = head;

        return newHead;
    }
}
```

## 二面

7. 谈谈你对dubbo的理解
8. dubbo中的consumer 和 provider 的调用流程 什么路径？
9. dubbo中的比较核心的抽象接口是哪些？
10. string stringbuffer stringbuilder的区别
11. string 和string 相加会发生什么？底层是怎么做到的？

6.synchronized 关键字是怎么保证线程安全的？

7.反射是什么时候用的 什么场景下可以用？

8.提到了在AOP用了反射，那么在AOP代理中是怎么实现反射的？

9.反射的弊端有哪些？

10.spring容器启动流程的加载顺序。

11.事务的几种实现方式？

12.数据库索引有哪几种？

13.场景题：分布式系统中如何保证幂等 比如订单id的生成？如何做？

14.算法 lc79 单词搜索

```java
class Solution {
    public boolean exist(char[][] board, String word) {
        int m = board.length;
        int n = board[0].length;
// s -> e -> dfs(b[i], i , j )
        for(int i = 0 ; i < m ; i++){
            for(int j = 0 ; j < n ; j++){
                if(dfs(board, word , i , j , 0)) {
                    return true;
                }
            }
        }
        return false;
    }

    private boolean dfs(char[][] board, String word , int i , int j , int index ){
        if (index == word.length()) return true;

        if(i < 0 || i >= board.length || j < 0 || j >= board[0].length
        || board[i][j] != word.charAt(index)) {
            return false;
        }


        char temp = board[i][j];

        board[i][j] = '#';  //. warn

        boolean found = dfs(board , word , i + 1, j , index +1) ||
        dfs(board , word , i - 1, j , index +1) ||
        dfs(board , word , i, j + 1 , index +1) ||
        dfs(board , word , i, j - 1 , index +1);

        board[i][j] = temp;

        return found;

    }
    // 跨境支付 收款 （跨境alipay）
    // 1. 国内：对接多个国家渠道 国际化 USDT支付 B2B的header
}
```

## 三面

12. 自我介绍（略）

2.开闭原则怎么保证？

3.oom排查的方法 流程 如何定位？

4.通过日志怎么定位oom？

5.jvm有什么哪些分区会overflow 如果overflow了怎么办？

6.微服务架构有哪些核心中间件？

7.如果服务provider宕机 消费者如何及时发现？

8.说一些你知道的设计模式有哪些？

（HR和主管一起面试的 后面就是跟HR面了）
9.你有什么想问的？

10.注意到学历倒挂了 当时发生什么了？

11.职业规划有没有？

12.注意到你有其他一线大厂流程 你这边是怎么考虑的？
