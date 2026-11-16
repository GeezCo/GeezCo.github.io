---
title: 遗传算法：从生物进化到程序优化
description: 深入理解遗传算法的核心思想、操作流程与参数调优，包含完整的代码实现示例
pubDate: '2022-05-18T08:29:00.000Z'
tags:
  - 算法
  - 遗传算法
  - 优化
draft: false
---

## 遗传算法的核心思想

### 自然界和程序优化的类比

```
自然界                  遗传算法
──────────────────────  ──────────────────────
种群中的个体            问题的一个解
个体的适应度            解的优劣程度（目标函数值）
环境选择（适者生存）      保留好解，淘汰差解
交配繁殖                两个解的基因交叉
基因突变                解的微调（避免局部最优）
N 代之后种群优化         迭代 N 次后找到近优解
```

遗传算法（Genetic Algorithm, GA）是一种**受自然选择启发的随机搜索算法**。它不保证找到最优解，但在合理的参数设置下，能高效地找到"足够好"的解——对于 NP-hard 问题尤其有价值。

### 什么时候用 GA

- 解空间巨大，穷举不现实（如 TSP 问题在 100 个城市时的排列数是 99!）
- 目标函数不可导，无法用梯度下降
- 不需要精确最优解，"足够好"就可以
- 问题的编码方式天然适合交叉和变异操作

## 五个核心要素

### 1. 编码：把问题解变成染色体

编码方式直接影响交叉和变异操作的设计：

| 编码方式 | 基因形式 | 典型场景 |
|---------|---------|---------|
| 二进制编码 | `10110011` | 背包问题、特征选择 |
| 实数编码 | `[3.14, 2.71, 1.41]` | 函数优化、参数调优 |
| 整数/排列编码 | `[3, 1, 4, 2, 5]` | TSP、调度、排序问题 |
| 树形编码 | 表达式树 | 遗传编程 |

```python
# 二进制编码示例
# 解 x ∈ [-5, 5]，精度 0.001
# 需要多少位？ (5 - (-5)) / 0.001 = 10000 → 2^14 = 16384
# 所以用 14 位二进制

# TSP 排列编码
# 10 个城市的一个可行解：
chromosome = [3, 7, 1, 9, 4, 6, 2, 8, 5, 10]
# 表示按此顺序访问城市
```

### 2. 适应值函数：打分标准

适应值函数是 GA 中最重要的设计决策——它告诉算法哪个解更好。

```python
def fitness(chromosome):
    """TSP 问题的适应值：路径越短，适应值越高"""
    total_distance = 0
    for i in range(len(chromosome) - 1):
        city_a = chromosome[i]
        city_b = chromosome[i + 1]
        total_distance += distance_matrix[city_a][city_b]
    # 回到起点
    total_distance += distance_matrix[chromosome[-1]][chromosome[0]]
    return 1.0 / total_distance  # 距离越短，适应值越大
```

**设计原则**：
- 适应值必须能区分解的优劣
- 不要有"悬崖"（相邻解适应值差异过大）
- 对违反约束的解给予惩罚（降低适应值）

### 3. 选择算子：谁有交配权

好的解应该有更高的概率产生后代，但不能让差解一点机会都没有——保持多样性。

```python
# 轮盘赌选择（Roulette Wheel Selection）
def roulette_wheel_select(population, fitnesses):
    total_fitness = sum(fitnesses)
    pick = random.uniform(0, total_fitness)
    current = 0
    for i, f in enumerate(fitnesses):
        current += f
        if current >= pick:
            return population[i]

# 锦标赛选择（Tournament Selection）
def tournament_select(population, fitnesses, k=3):
    """随机选 k 个个体，取最好的"""
    indices = random.sample(range(len(population)), k)
    best_idx = max(indices, key=lambda i: fitnesses[i])
    return population[best_idx]
```

### 4. 交叉算子：产生新个体

两个父代染色体交换基因片段，产生子代。

```python
# 单点交叉（适用于二进制/实数编码）
def single_point_crossover(parent1, parent2):
    """在随机位置切割，交换后半段"""
    point = random.randint(1, len(parent1) - 1)
    child1 = parent1[:point] + parent2[point:]
    child2 = parent2[:point] + parent1[point:]
    return child1, child2

# 顺序交叉 OX（适用于排列编码，如 TSP）
def order_crossover(p1, p2):
    """保留顺序关系的排列交叉"""
    size = len(p1)
    a, b = sorted(random.sample(range(size), 2))
    child = [None] * size
    child[a:b] = p1[a:b]
    fill = [x for x in p2 if x not in child[a:b]]
    j = 0
    for i in range(size):
        if child[i] is None:
            child[i] = fill[j]
            j += 1
    return child
```

### 5. 变异算子：随机微调

小概率随机改变某个基因，防止种群过早收敛到局部最优。

```python
# 二进制变异
def bit_flip_mutation(chromosome, mutation_rate=0.01):
    for i in range(len(chromosome)):
        if random.random() < mutation_rate:
            chromosome[i] = 1 - chromosome[i]  # 翻转
    return chromosome

# 排列变异（交换两个位置）
def swap_mutation(chromosome, mutation_rate=0.01):
    if random.random() < mutation_rate:
        a, b = random.sample(range(len(chromosome)), 2)
        chromosome[a], chromosome[b] = chromosome[b], chromosome[a]
    return chromosome
```

## 完整算法流程

```python
import random

def genetic_algorithm(
    population_size=100,
    generations=500,
    crossover_rate=0.8,
    mutation_rate=0.01,
    elite_size=2
):
    # Step 1: 初始化种群
    population = [random_chromosome() for _ in range(population_size)]
    
    for gen in range(generations):
        # Step 2: 计算适应值
        fitnesses = [fitness(ind) for ind in population]
        
        # 记录最优个体
        best_idx = max(range(len(population)), key=lambda i: fitnesses[i])
        best_fitness = fitnesses[best_idx]
        if gen % 50 == 0:
            print(f"Generation {gen}: Best fitness = {best_fitness:.4f}")
        
        # Step 3: 精英保留（最优个体直接进入下一代）
        new_population = []
        elite_indices = sorted(range(len(population)), 
                               key=lambda i: fitnesses[i], reverse=True)[:elite_size]
        for i in elite_indices:
            new_population.append(population[i][:])
        
        # Step 4: 选择 + 交叉 + 变异
        while len(new_population) < population_size:
            # 选择父代
            p1 = tournament_select(population, fitnesses, k=3)
            p2 = tournament_select(population, fitnesses, k=3)
            
            # 交叉
            if random.random() < crossover_rate:
                c1, c2 = crossover(p1, p2)
            else:
                c1, c2 = p1[:], p2[:]
            
            # 变异
            c1 = mutate(c1, mutation_rate)
            c2 = mutate(c2, mutation_rate)
            
            new_population.append(c1)
            if len(new_population) < population_size:
                new_population.append(c2)
        
        population = new_population
    
    # 返回最优解
    fitnesses = [fitness(ind) for ind in population]
    best_idx = max(range(len(population)), key=lambda i: fitnesses[i])
    return population[best_idx], fitnesses[best_idx]
```

## 参数调优

| 参数 | 太小 | 太大 | 推荐值 |
|------|------|------|--------|
| 种群规模 | 多样性不足，早熟收敛 | 计算量线性增长 | 50-200 |
| 交叉概率 | 搜索效率低 | 破坏好解 | 0.7-0.9 |
| 变异概率 | 多样性不足 | 退化为随机搜索 | 0.001-0.05 |
| 精英数量 | 丢失好解 | 早熟收敛 | 种群规模的 1-5% |
| 迭代代数 | 未收敛 | 浪费时间 | 100-1000（看收敛曲线） |

**调参经验**：
- 先跑一次看收敛曲线——如果几十代就不再提升了，大概率是早熟收敛，加大变异率
- 如果最优解一直在缓慢提升，说明搜索还不够，加大代数
- 变异率不要超过 0.1——超过后 GA 就退化为随机搜索，收敛不了了

## 完整示例：求解函数最大值

```python
import random
import math

# 目标: 求 f(x) = x * sin(10π * x) + 2.0 在 [-1, 2] 上的最大值

def f(x):
    return x * math.sin(10 * math.pi * x) + 2.0

def encode(x, min_val=-1.0, max_val=2.0, bits=22):
    """实数 → 二进制编码"""
    scaled = int((x - min_val) / (max_val - min_val) * (2**bits - 1))
    return [int(b) for b in format(scaled, f'0{bits}b')]

def decode(chromosome, min_val=-1.0, max_val=2.0):
    """二进制 → 实数"""
    binary_str = ''.join(str(b) for b in chromosome)
    scaled = int(binary_str, 2)
    return min_val + scaled * (max_val - min_val) / (2**len(chromosome) - 1)

# 运行 GA
pop_size = 50
bits = 22

population = [encode(random.uniform(-1, 2)) for _ in range(pop_size)]

for gen in range(200):
    fitnesses = [f(decode(ind)) for ind in population]
    best = max(fitnesses)
    if gen % 40 == 0:
        print(f"Gen {gen}: best = {best:.6f}")
    
    # 精英保留
    elite_idx = fitnesses.index(best)
    new_pop = [population[elite_idx][:]]
    
    # 选择、交叉、变异...
    while len(new_pop) < pop_size:
        # (选择 + 交叉 + 变异逻辑同上，此处省略)
        pass

best_solution = decode(population[fitnesses.index(max(fitnesses))])
print(f"最优解: x = {best_solution:.6f}, f(x) = {max(fitnesses):.6f}")
```

## 遗传算法的局限

- **不保证全局最优**：可能收敛到局部最优，多次运行取最好结果可以缓解
- **参数敏感**：不同问题需要不同的交叉/变异策略，没有通用参数
- **计算开销大**：每一代都要评估整个种群的适应值，目标函数计算量大时不适用
- **编码困难**：复杂约束问题可能不适合简单的线性编码

## 总结

- GA 的核心是"模拟自然选择"——把解编码为染色体，通过选择、交叉、变异在解空间中搜索
- 适应值函数是核心设计——算法不听你的，只听适应值函数
- 选择保留好解，交叉产生新解，变异防止局部最优——三者的平衡决定算法效率
- 没有万能参数，观察收敛曲线比记推荐值更有用