---
title: xTransfer 三面面试经历
description: 跨境支付公司后端面试记录，包含算法题与技术问题
pubDate: '2026-05-15T08:29:00.000Z'
tags:
  - 面试
  - Java
draft: false
---

## 一面

### 问题列表

1. 自我介绍
2. 如何保证幂等性
3. 企业级项目怎么传递 TraceId
4. RPC 注册和发现流程（聊了很久）
5. 线程池核心参数、任务执行流程
6. 算法：LC 61 旋转链表

### 算法题解：旋转链表

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

        // k 取模，避免不必要旋转
        k = k % length;
        if (k == 0) {
            return head;
        }

        // 找到新尾节点（第 length-k 个节点）
        ListNode newTail = head;
        for (int i = 1; i < length - k; i++) {
            newTail = newTail.next;
        }

        // 重新连接
        ListNode newHead = newTail.next;
        newTail.next = null;
        tail.next = head;

        return newHead;
    }
}
```

## 二面

### 问题列表

1. 谈谈对 Dubbo 的理解
2. Dubbo Consumer 和 Provider 调用流程
3. Dubbo 核心抽象接口有哪些
4. String、StringBuilder、StringBuffer 区别
5. String + String 底层如何实现
6. synchronized 如何保证线程安全
7. 反射什么时候用，什么场景可用
8. AOP 代理中如何实现反射
9. 反射的弊端有哪些
10. Spring 容器启动流程加载顺序
11. 事务的几种实现方式
12. 数据库索引有哪几种
13. 场景题：分布式系统如何保证幂等，订单 ID 生成如何做
14. 算法：LC 79 单词搜索

### 算法题解：单词搜索

```java
class Solution {
    public boolean exist(char[][] board, String word) {
        int m = board.length;
        int n = board[0].length;

        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                if (dfs(board, word, i, j, 0)) {
                    return true;
                }
            }
        }
        return false;
    }

    private boolean dfs(char[][] board, String word, int i, int j, int index) {
        if (index == word.length()) return true;

        if (i < 0 || i >= board.length
            || j < 0 || j >= board[0].length
            || board[i][j] != word.charAt(index)) {
            return false;
        }

        char temp = board[i][j];
        board[i][j] = '#';  // 标记已访问

        boolean found = dfs(board, word, i + 1, j, index + 1)
            || dfs(board, word, i - 1, j, index + 1)
            || dfs(board, word, i, j + 1, index + 1)
            || dfs(board, word, i, j - 1, index + 1);

        board[i][j] = temp;  // 恢复

        return found;
    }
}
```

## 三面（HR + 主管）

### 问题列表

1. 自我介绍
2. 开闭原则怎么保证
3. OOM 排查方法、流程、如何定位
4. 通过日志怎么定位 OOM
5. JVM 哪些分区会 Overflow，Overflow 后怎么办
6. 微服务架构有哪些核心中间件
7. Provider 宕机，Consumer 如何及时发现
8. 设计模式有哪些
9. 学历倒挂的原因
10. 职业规划
11. 其他一线大厂流程的考虑
12. 反问环节

## 公司业务

跨境支付收款（跨境支付宝），对接多国渠道，国际化 USDT 支付，B2B 业务。