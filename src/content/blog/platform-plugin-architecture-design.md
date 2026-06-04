---
title: 平台+插件架构：从通用RAG到垂直场景的架构演进
description: 通过"平台+插件"架构设计，实现通用能力与垂直场景的解耦，支持快速扩展和独立部署。以金融研报处理为例，探讨架构设计的关键决策。
pubDate: 2026-05-28
tags:
  - 架构设计
  - RAG
  - 微服务
  - 插件化
draft: false
locked: false
---

## 问题背景

通用RAG系统面临的核心挑战：功能同质化严重，难以形成差异化竞争力。市场上已有大量开源和商业化产品（Dify、FastGPT、Langchain-Chatchat等），客户更关注具体场景问题的解决能力，而非通用工具。

垂直场景（如金融研报分析、法律合同审查）具有明确的技术壁垒和付费意愿，但纯垂直化实现会限制系统的扩展性。

**核心矛盾**：如何在保持通用平台能力的同时，支持垂直场景的深度定制？

## 架构目标

1. **通用能力复用**：文档管理、用户认证、基础RAG能力等通用模块可被多个场景共享
2. **场景独立扩展**：垂直场景模块可独立开发、部署、迭代，不影响平台层
3. **灵活商业化**：支持按场景模块收费，降低客户采购门槛
4. **技术解耦**：场景层不侵入平台层代码，降低维护成本

## 架构设计

### 分层模型

```
┌─────────────────────────────────────────────────────────────┐
│                    通用平台层（Platform Layer）               │
├─────────────────────────────────────────────────────────────┤
│  gzdoc-common    │  通用工具、实体、常量                      │
│  gzdoc-gateway   │  统一网关、鉴权、限流                      │
│  gzdoc-auth      │  用户、租户、权限管理                      │
│  gzdoc-document  │  文档上传、存储、管理                      │
│  gzdoc-qa        │  通用问答、RAG基础能力                     │
└─────────────────────────────────────────────────────────────┘
                              ↓ 依赖
┌─────────────────────────────────────────────────────────────┐
│                  垂直场景层（Plugin Layer）                   │
├─────────────────────────────────────────────────────────────┤
│  gzdoc-finance   │  金融研报：解析、对比、投资建议            │
│  gzdoc-legal     │  法律合同：条款提取、风险识别              │
│  gzdoc-medical   │  医疗影像：报告解读、对比分析              │
└─────────────────────────────────────────────────────────────┘
```

### 关键设计原则

1. **单向依赖**：场景层依赖平台层，平台层不感知场景层
2. **接口抽象**：平台层提供标准接口，场景层实现具体逻辑
3. **独立部署**：场景服务可按需启停，不影响其他模块
4. **配置驱动**：通过配置文件注册场景插件，无需修改代码

## 技术实现

### 服务分层

#### 平台层服务（Java Spring Boot）

```java
// gzdoc-document: 文档管理
@Service
public class DocumentService {
    public Document upload(MultipartFile file) {
        // 通用文档上传逻辑
        return documentRepository.save(document);
    }
    
    public List<Document> list(String userId) {
        return documentRepository.findByUserId(userId);
    }
}

// gzdoc-qa: 通用问答
@Service
public class QAService {
    public Answer query(String question, String documentId) {
        // 基础RAG流程：检索 + 生成
        List<Chunk> chunks = vectorStore.search(question);
        return llmService.generate(question, chunks);
    }
}
```

#### 场景层服务（Python FastAPI）

```python
# gzdoc-finance: 金融研报分析
from fastapi import FastAPI
from gzdoc_common import DocumentClient, QAClient

app = FastAPI()

@app.post("/finance/reports/compare")
async def compare_reports(report_ids: List[str]):
    """横向对比多份研报"""
    # 1. 调用平台层获取文档
    documents = await document_client.get_batch(report_ids)
    
    # 2. 金融场景专用解析
    reports = [parse_financial_report(doc) for doc in documents]
    
    # 3. 提取关键指标对比
    comparison = {
        "target_price": [r.target_price for r in reports],
        "rating": [r.rating for r in reports],
        "key_metrics": extract_metrics(reports)
    }
    
    return comparison

def parse_financial_report(document):
    """金融研报专用解析逻辑"""
    # 识别研报结构（投资建议、财务数据、风险提示）
    # 提取结构化数据（目标价、评级、PE/PB等）
    pass
```

### 插件注册机制

```yaml
# config/plugins.yml
plugins:
  - name: finance
    enabled: true
    service_url: http://gzdoc-finance:8001
    routes:
      - path: /finance/*
        methods: [GET, POST]
    
  - name: legal
    enabled: false
    service_url: http://gzdoc-legal:8002
    routes:
      - path: /legal/*
        methods: [GET, POST]
```

网关根据配置动态路由请求到对应的场景服务。

### 数据流转

```
客户端请求
    ↓
API Gateway（路由 + 鉴权）
    ↓
场景服务（gzdoc-finance）
    ↓ 调用平台层API
平台服务（gzdoc-document, gzdoc-qa）
    ↓ 返回通用数据
场景服务（场景专用处理）
    ↓
返回客户端
```

## 金融场景实现

### 核心能力

1. **研报解析**：识别研报结构，提取投资建议、目标价、评级等关键信息
2. **横向对比**：对比多家机构对同一标的的观点和数据
3. **趋势分析**：追踪同一机构对某标的的观点变化

### 技术栈

- **文档解析**：PyMuPDF（PDF）+ python-docx（Word）
- **表格提取**：Camelot（结构化表格）+ GPT-4V（复杂表格）
- **向量检索**：Weaviate（支持混合检索）
- **LLM**：GPT-4 Turbo（理解金融术语）

### 示例：研报对比API

```python
@app.post("/finance/reports/compare")
async def compare_reports(request: CompareRequest):
    # 1. 获取研报文档
    reports = await fetch_reports(request.report_ids)
    
    # 2. 提取关键信息
    parsed = [extract_key_info(r) for r in reports]
    
    # 3. 生成对比表
    comparison_table = generate_comparison_table(parsed)
    
    # 4. LLM总结差异
    summary = await llm_summarize_differences(comparison_table)
    
    return {
        "comparison_table": comparison_table,
        "summary": summary,
        "consensus": calculate_consensus(parsed)
    }
```

## 扩展性验证

### 新增场景流程

1. **创建场景服务**：新建 `gzdoc-legal` 服务
2. **实现场景逻辑**：法律合同条款提取、风险识别
3. **注册插件**：在 `plugins.yml` 中添加配置
4. **独立部署**：部署 `gzdoc-legal` 服务，无需重启平台层

### 平台层无需修改

新增场景时，平台层（文档管理、用户认证、基础RAG）完全不需要修改代码，只需：
- 场景服务调用平台层API
- 网关配置新增路由规则

## 技术决策

### 为什么平台层用Java，场景层用Python？

- **平台层（Java）**：稳定性要求高，Spring Cloud生态成熟，适合企业级应用
- **场景层（Python）**：AI生态丰富（LangChain、Transformers），快速迭代

### 为什么不用微前端？

前端保持统一体验，后端插件化即可满足扩展需求。微前端会增加复杂度，收益不明显。

### 为什么不用Serverless？

金融场景对响应时间敏感（冷启动不可接受），且需要维护向量索引等有状态服务。

## 实施路径

1. **Phase 1**：完成平台层基础能力（文档管理、用户认证、基础RAG）
2. **Phase 2**：实现金融场景插件，验证架构可行性
3. **Phase 3**：新增第二个场景（法律或医疗），验证扩展性
4. **Phase 4**：完善插件管理（热插拔、版本控制、依赖管理）

## 总结

"平台+插件"架构通过分层和解耦，实现了通用能力复用与垂直场景深度定制的平衡。关键要点：

1. **单向依赖**：场景层依赖平台层，避免双向耦合
2. **接口抽象**：平台层提供标准API，场景层实现具体逻辑
3. **独立部署**：场景服务可按需启停，降低运维复杂度
4. **配置驱动**：通过配置注册插件，无需修改代码

该架构适用于需要支持多个垂直场景的SaaS产品，特别是AI应用领域。

---

## 相关资源

- 项目地址：[GzDoc on GitHub](https://github.com/GeezCo/gzdoc)
- 技术栈：Spring Boot 3.2 + FastAPI + LangChain + WeaviateMinIO
        // 发送Kafka消息
        // 返回文档ID
    }
}

// gzdoc-qa: 问答服务（通用）
@Service
public class QAService {
    public QAResponse ask(String question, List<Long> documentIds) {
        // 向量检索
        // LLM生成答案
        // 返回答案+引用
    }
}
```

#### 场景层服务（Java Spring Boot）

```java
// gzdoc-finance: 金融研报服务（场景专用）
@Service
public class FinanceReportService {
    @Autowired
    private DocumentService documentService;  // 复用平台层
    @Autowired
    private QAService qaService;              // 复用平台层
    
    public void processReport(Long reportId) {
        // 1. 获取文档（复用平台层）
        Document doc = documentService.getDocument(reportId);
        
        // 2. 金融专用解析
        ReportData data = parseFinanceReport(doc);
        
        // 3. 提取财务数据（场景专用）
        List<FinancialData> financialData = extractFinancialData(data);
        
        // 4. 保存到金融专用表
        saveFinanceData(reportId, data, financialData);
    }
    
    // 金融专用功能：横向对比
    public ComparisonResult compareReports(String stockCode, List<Long> reportIds) {
        // 对比多份研报
        // 分析评级一致性
        // 对比财务预测
        // 生成投资建议
    }
}
```

**关键点：**
- ✅ 场景层通过 `@Autowired` 依赖注入复用平台层能力
- ✅ 平台层不感知场景层的存在
- ✅ 场景层可以添加专用逻辑，不影响平台层

### 2. AI能力分层

#### 通用AI能力（Python FastAPI）

```python
# ai-service/app/services/

# 通用能力
ocr_service.py          # OCR识别
parser_service.py       # 文档解析
embedding_service.py    # 向量化
retrieval_service.py    # 向量检索
llm_service.py          # LLM调用
rag_service.py          # RAG编排
```

#### 场景AI能力（Python FastAPI）

```python
# ai-service/app/services/finance/

report_parser.py        # 研报解析
table_extractor.py      # 表格提取
entity_recognizer.py    # 实体识别（公司名、指标）
comparison_engine.py    # 对比引擎
investment_advisor.py   # 投资建议生成
```

**金融专用Prompt示例：**

```python
REPORT_PARSE_PROMPT = """
你是一个专业的金融分析师，请从以下研报中提取关键信息：

研报内容：
{report_content}

请提取以下信息（JSON格式）：
1. 基本信息：标题、机构、分析师、发布日期
2. 股票信息：代码、名称、评级、目标价
3. 核心观点：3-5条核心观点
4. 财务数据：营收、净利润、毛利率等（按年份）
5. 估值数据：PE、PB、PS
6. 风险提示：主要风险点
"""

COMPARISON_PROMPT = """
你是一个专业的金融分析师，请对比以下{count}份关于{stock_name}的研报：

{reports_summary}

请从以下维度对比：
1. 评级一致性
2. 目标价差异
3. 核心逻辑差异
4. 财务预测差异
5. 风险提示差异

最后给出综合分析和投资建议。
"""
```

---

## 数据流程

### 金融研报处理流程

```
用户上传研报
    ↓
API Gateway → gzdoc-finance (场景层入口)
    ↓
1. 调用 gzdoc-document 上传文件（复用平台层）
    ↓
2. 发送 Kafka 消息: finance-report-upload
    ↓
3. AI服务消费消息
   ├─ 研报解析（提取基本信息）
   ├─ 表格识别（财务数据）
   ├─ 实体提取（公司名、指标）
   └─ 向量化（复用平台层）
    ↓
4. 保存数据
   ├─ t_document（平台表）
   ├─ t_finance_report（场景表）
   └─ t_finance_data（场景表）
    ↓
5. 更新状态 + 通知用户
```

### 金融问答流程（场景增强）

```
用户提问："茅台的直营占比是多少？"
    ↓
gzdoc-finance (场景层)
    ↓
1. 场景过滤（只查询茅台的研报）
   reportIds = getReportsByStockCode("600519")
    ↓
2. 调用 gzdoc-qa 问答服务（复用平台层）
   response = qaService.ask(question, reportIds)
    ↓
3. 场景增强（添加金融专用信息）
   ├─ 最新财务数据
   ├─ 估值数据
   └─ 历史趋势
    ↓
返回增强后的答案
```

---

## 架构优势

### 1. 开发效率高

**新增场景不影响老代码：**

```bash
# 新增法律合同场景
cd backend
mkdir gzdoc-legal

# 复用平台层能力
@Autowired
private DocumentService documentService;  // 文档管理
@Autowired
private QAService qaService;              // 问答能力

# 实现法律专用逻辑
public void processContract(Long contractId) {
    // 合同解析
    // 条款提取
    // 风险识别
}
```

**全程不需要修改平台层代码！**

### 2. 商业化灵活

**按场景定价：**

```
基础版：$99/月
- 平台层所有功能
- 通用文档管理
- 基础问答

金融版：$499/月
- 基础版 +
- 研报解析
- 横向对比
- 投资建议

企业版：$2999/月
- 金融版 +
- 法律合同
- 医疗影像
- 私有部署
```

**按需部署：**

```yaml
# 客户可以选择只部署需要的场景
kubectl apply -f k8s/platform/  # 平台层（必须）
kubectl apply -f k8s/finance/   # 金融场景（可选）
# kubectl apply -f k8s/legal/   # 法律场景（不部署）
```

### 3. 技术债务低

- ✅ 通用代码保持简洁
- ✅ 场景代码独立演进
- ✅ 废弃场景直接删除模块
- ✅ 新场景并行开发

---

## 成本分析

### 单份研报处理成本

```
- OCR: $0（开源PaddleOCR）
- 结构化提取: $0.05（GPT-3.5）
- 向量化: $0（本地BGE-M3）
- 总计: $0.05/份
```

### 单次问答成本

```
- 检索: $0（本地）
- LLM生成: $0.01-0.03（GPT-3.5/4）
- 总计: $0.01-0.03/次
```

### 月成本估算（100用户）

```
- 研报处理: 100用户 × 10份/月 × $0.05 = $50
- 问答: 100用户 × 50次/月 × $0.02 = $100
- 总计: $150/月

收入: $499 × 100 = $49,900/月
毛利率: ($49,900 - $150) / $49,900 = 99.7%
```

**关键：垂直场景可以卖高价，成本却很低。**

---

## 竞争优势

### vs 通用RAG产品

| 维度 | 通用RAG | GzDoc金融版 |
|------|---------|-------------|
| 定位 | 通用工具 | 金融专用 |
| 价格 | $99/月 | $499/月 |
| 研报解析 | ❌ | ✅ 专业解析 |
| 表格提取 | ❌ | ✅ 财务数据 |
| 横向对比 | ❌ | ✅ 多研报对比 |
| 投资建议 | ❌ | ✅ AI生成 |
| 客户 | 泛泛而谈 | 精准定位 |

### vs Wind金融终端

| 维度 | Wind | GzDoc金融版 |
|------|------|-------------|
| 价格 | ¥30,000/年 | $499/月 ≈ ¥3,600/年 |
| 研报问答 | ❌ | ✅ |
| 横向对比 | 手动 | ✅ 自动 |
| 投资建议 | ❌ | ✅ AI生成 |
| 学习成本 | 高 | 低 |

**定位：Wind的智能化补充，而不是替代。**

---

## 架构演进路线

### Phase 1: MVP (Month 1-3) ✅ 进行中
- ✅ 平台层基础服务
- ✅ 通用文档处理
- ✅ 基础RAG问答

### Phase 2: 首个场景 (Month 4-6)
- 🚀 金融研报场景
- 验证"平台+插件"架构
- 积累场景开发经验

### Phase 3: 场景扩展 (Month 7-9)
- 法律合同场景
- 医疗影像场景
- 完善平台能力

### Phase 4: 商业化 (Month 10-12)
- 多场景组合销售
- 私有化部署方案
- 企业级特性

---

## 经验总结

### 1. 不要做通用产品

> "通用 = 没有特色 = 没有竞争力"

**教训：**
- 通用RAG市场已经饱和
- 客户需要的是解决具体问题
- 垂直场景才有定价权

### 2. 架构要为商业化服务

> "技术架构不是为了炫技，而是为了赚钱"

**设计原则：**
- 按场景收费 → 需要模块化架构
- 按需部署 → 需要独立部署能力
- 快速试错 → 需要低耦合设计

### 3. 先做一个场景，验证架构

> "不要一开始就设计完美架构，先验证可行性"

**实施策略：**
- 先做金融场景（验证架构）
- 再做法律场景（验证扩展性）
- 最后完善平台能力

### 4. 复用 > 重写

> "能复用的就复用，不要重复造轮子"

**技术选择：**
- 平台层：Spring Cloud（成熟生态）
- AI层：LangChain（丰富组件）
- 向量库：Weaviate（开箱即用）

---

## 下一步

1. **完成金融场景开发**（Month 4-6）
   - 研报解析
   - 横向对比
   - 投资建议

2. **验证商业模式**（Month 6-7）
   - 找10个付费客户
   - 验证定价策略
   - 收集反馈优化

3. **扩展第二个场景**（Month 7-9）
   - 法律合同或医疗影像
   - 验证架构扩展性
   - 完善平台能力

---

## 总结

从通用RAG到垂直场景，从红海到蓝海，关键在于：

1. **找到真实痛点**：金融研报分析
2. **设计灵活架构**："平台+插件"模式
3. **快速验证迭代**：先做一个场景
4. **商业化优先**：架构为商业服务

**最重要的：不要为了技术而技术，要为了赚钱而技术。**

---

## 相关资源

- 项目地址：[GzDoc on GitHub](https://github.com/yourusername/gzdoc)
- 架构文档：[Platform-Plugin Architecture](https://github.com/yourusername/gzdoc/blob/main/docs/architecture/platform-plugin-architecture.md)
- 技术栈：Spring Boot 3.2 + FastAPI + LangChain + Weaviate

---

如果你也在做AI应用，欢迎交流！

- 邮箱：your-email@example.com
- Twitter：@yourhandle
- 微信：your-wechat

---

*本文首发于个人博客，转载请注明出处。*
