---
title: 可观测与部署
description: 给 LangGraph Agent 加上可观测（LangSmith 追踪/评测）与上线能力——从 tracing、custom 指标到 LangSmith Deployment（原 LangGraph Platform）与自托管 FastAPI 的选型与落地。
---

# 可观测与部署

图能在本地跑通，只是万里长征第一步。**Agent 一旦上生产，你最怕的不是它报错，而是它「悄无声息地做了一件蠢事」**——所以可观测（看得见它每一步干了啥、花了多少、慢在哪）不是锦上添花，是**生死线**。好消息是：LangChain/LangGraph 在这块几乎是「开箱即得」（见 [LangSmith Observability](https://docs.langchain.com/langsmith/observability)）。

> **一句话分工**：**LangSmith** 负责「看得见」——追踪、评测、成本/延迟监控；**LangSmith Deployment（原名 LangGraph Platform）** 负责「跑得稳」——把图变成带持久化、流式、并发、定时任务的生产运行时。

## 一、可观测：先让每一步「留痕」

### 1. 开 tracing：改一个环境变量就完事

LangChain/LangGraph 的调用链能被 LangSmith **自动捕获**，你几乎不用改代码——配上密钥即可（见 [Set up LangSmith](https://docs.langchain.com/langsmith/platform-setup)）：

```bash
export LANGSMITH_TRACING=true
export LANGSMITH_API_KEY="lsv2_..."
```

配上之后，每次 `graph.invoke` 都会在 [smith.langchain.com](https://smith.langchain.com) 生成一棵**完整 trace 树**：每个节点、每次模型调用、每个工具、输入输出、token 数、耗时、花费，一目了然。多智能体/子图的嵌套结构也能一层层展开看——这是 debug「Agent 为什么在这儿绕了 8 圈」的唯一靠谱手段。

### 2. 补业务自定义指标：用 custom 流 / 属性

光有 token 和延迟不够，你还想盯「检索召回了几篇、审批通过率多少」。把这类私有指标随 trace 一起上报，配合前面学过的 [custom 流式](/langgraph/streaming)：

```python
from langchain_core.runnables import RunnableConfig
from langgraph.config import get_stream_writer

def retrieve(state, config: RunnableConfig):
    docs = search(state["question"])
    # 既推给前端流，也可作为 metadata 挂到 trace 上
    get_stream_writer()({"stage": "retrieval", "count": len(docs)})
    return {"documents": docs}
```

::: tip 别裸奔上线
没有 tracing 的 Agent 调试，等于蒙眼开车。**第一天就把 `LANGSMITH_TRACING=true` 打开**，等你线上遇到「模型答非所问」时，你会感谢此刻的自己。
:::

### 3. 评测（Evaluation）：把「感觉变好了」变成「分数变高了」

改 prompt、换模型前后到底有没有变好，不能靠感觉。LangSmith 支持建**数据集 + 评估器**，对一批输入跑出可对比的分数（回归测试同款思路），把 Agent 迭代从「玄学调参」拉回「有指标的演进」。

## 二、部署：三条路，按团队规模选

LangGraph 的图是个 Python 对象，要对外服务就得有个 runtime 承载它。三条主流路线：

<GraphFlow
  :steps="[
    { n: 'A', title: 'LangSmith Deployment', desc: '原 LangGraph Platform，托管/混合，最省心', tone: 'teal' },
    { n: 'B', title: '自托管 FastAPI', desc: '自己写服务，配 Postgres checkpointer', tone: 'blue' },
    { n: 'C', title: 'Serverless / 容器', desc: 'Docker/K8s/云函数，按需弹性', tone: 'coral' }
  ]"
  tags="['LangSmith Deployment', 'self-host FastAPI', 'Postgres checkpointer', 'SSE streaming', 'scaling']"
/>

| 路线 | 适合 | 你要操心的 |
| --- | --- | --- |
| **LangSmith Deployment**（原 LangGraph Platform） | 想要托管 assistants API、流式、线程/持久化、cron 全现成 | 写一个 `langgraph.json` 描述入口，其余它包办（见 [Deployment 文档](https://docs.langchain.com/langsmith/deployment)） |
| **自托管 FastAPI** | 已有服务基建、想完全掌控 | 自己接 [项目骨架](/recipes/project-structure) 里的 `/chat`、配 `PostgresSaver`、管并发与连接池 |
| **容器 / Serverless** | 弹性流量、混合架构 | 冷启动、长任务超时、checkpointer 一定要是外部数据库 |

### 用 LangSmith Deployment：一个 `langgraph.json` 起

托管路线的核心就是把图和依赖声明清楚，平台帮你把 Agent Server、持久化、流式接口都搭好：

```jsonc
// langgraph.json
{
  "dependencies": ["."],
  "graphs": {
    "agent": "./src/my_agent/graph.py:build_graph"   // 指向你的装配函数
  },
  "env": ".env"
}
```

它自带：线程与 checkpoint 存储、SSE 流式、assistant 配置、后台运行、定时任务——这些自己撸要花不少功夫的活儿，全都免配上桌。

### 自托管要点（无论走哪条路都适用）

- **checkpointer 换生产后端**：`InMemorySaver` 只能本地玩，多副本/重启不丢档必须 `PostgresSaver`（回顾 [持久化](/langgraph/persistence)）。
- **对外一律流式**：长任务用 SSE / WebSocket 把 `astream` 事件转出去，别让用户干等（见 [项目骨架](/recipes/project-structure) 的 `/chat`）。
- **`thread_id` 隔离会话**：每个用户/会话独立 `thread_id`，这是记忆与并发正确性的地基。

## 三、生产级护栏

- **超时与取消**：图能循环就能失控，给每次请求配 hard timeout，并能干净中断（回顾 [循环刹车](/langgraph/routing)）。
- **成本与限流**：trace 里盯 token/延迟；入口按用户/租户限流，防止单点把预算烧穿。
- **密钥与配置**：`.env` + 密钥管理服务，绝不硬编码；模型名、`recursion_limit` 集中在 [config](/recipes/project-structure)。
- **人机协同卡点**：高危动作上线前，务必保留 `interrupt` 审批通道（回顾 [审批工作流](/recipes/approval-workflow)）。
- **可回滚**：善用 checkpoint 的时间旅行做灰度与事故回溯，别把生产当唯一真相。

---

- tracing 打通后回看流式机制 → [流式输出（Streaming）](/langgraph/streaming)
- 部署所依赖的存档能力 → [持久化与记忆（Checkpointer）](/langgraph/persistence)
- 上线前最后对着清单排雷 → [常见坑与排查清单](/debugging/pitfalls)
