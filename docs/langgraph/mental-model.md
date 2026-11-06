---
title: 心智模型：State · Node · Edge
description: LangGraph 的世界观——把 Agent 建模成一张带状态的图，用超步推进。吃透这一节，后面全是加法。
---

# 心智模型：State · Node · Edge

如果这一站你只能彻底搞懂一节，就是这节。LangGraph 的一切都建立在**一个隐喻**上：

> **把你的 Agent 想成一张「带公共白板（State）的流程图」：节点（Node）读白板、写白板，边（Edge）决定下一步轮到谁上场。**

<GraphAnatomy />

## 三个词，掰开揉碎

### State（状态）—— 那块公共白板

State 是一个贯穿整张图的数据结构，通常是一个 `TypedDict` 或 Pydantic 模型。**节点之间不直接互相调用，全靠在这块白板上读写来传话。** 这带来一个巨大的工程好处：任何时刻想知道「事情进展到哪了」，看一眼 State 就行——这也是持久化和断点恢复能成为一等公民的根本原因。

```python
from typing import Annotated
from typing_extensions import TypedDict
from langgraph.graph.message import add_messages

class State(TypedDict):
    # messages 用 reducer 追加，而不是覆盖
    messages: Annotated[list, add_messages]
    step_count: int
```

### Node（节点）—— 干活的人

一个节点**就是一个普通函数**：入参是当前 State，返回值是「对 State 的更新」（一个部分字典）。它里面想干嘛干嘛——调模型、查数据库、发 HTTP。

```python
def call_model(state: State):
    resp = llm.invoke(state["messages"])
    return {"messages": [resp]}          # ← 只返回要更新的部分
```

::: tip 节点的两个铁律
1. 节点**返回的是「更新」不是「整个新状态」**：`{"messages": [新消息]}` 表示「往 messages 上加一条」，具体怎么合，由 reducer 决定（下一节细讲）。
2. 节点应尽量**无副作用、可重放**：LangGraph 可能重试或从检查点恢复，幂等会让你的调试轻松很多。
:::

### Edge（边）—— 下一步轮到谁

边连接节点，规定执行顺序。三种最常见：

| 边类型 | 含义 | 写法 |
| --- | --- | --- |
| 普通边 | A 跑完一定跑 B | `graph.add_edge("A", "B")` |
| 条件边 | 看 State 决定走哪条 | `graph.add_conditional_edges("A", router_fn)` |
| 入口 / 出口 | 从哪开始 / 到哪结束 | `add_edge(START, "A")` / `add_edge("B", END)` |

特殊常量 `START` 和 `END` 标记图的入口和终点。**条件边 + 回边**，就构成了 Agent 的「循环」——这正是标准 Agent 循环在 LangGraph 里的真身。

## 运行时怎么跑：超步（super-step）

LangGraph 不是一口气把图跑完，而是一个个**超步**推进的（借鉴了 Google 的 Pregel 模型）：

<GraphFlow
  :steps="[
    { n: 'T0', title: '激活 START', desc: '把入口节点的入边点亮', tone: 'teal' },
    { n: 'T1', title: '并行执行', desc: '同一超步里互不依赖的节点一起跑', tone: 'blue' },
    { n: 'T2', title: '合并写入', desc: '用 reducer 把各节点的更新合进 State', tone: 'coral' },
    { n: 'T3', title: '存档 & 推进', desc: '落一个 checkpoint，点亮下一批节点', tone: 'lime' }
  ]"
  tags="['Pregel', 'super-step', 'checkpoint each step', 'parallel within step']"
/>

每个超步结束时，运行时做三件事：**合并状态更新 → 存档（如果配了 checkpointer）→ 决定下一步激活哪些节点**。当没有任何节点被激活时，图就跑完了。这个模型天然支持并行、循环、以及「在任意两步之间停下来等人」。

## 为什么这套模型这么能打

把上面的世界观串起来，你就理解了 LangGraph 那几个「高级特性」其实全是加法：

- 因为状态是**集中的、离散的（按超步）** → 所以能**存档/恢复**（持久化）。见 [持久化与记忆](/langgraph/persistence)
- 因为每个超步之间可以**停** → 所以能在中途 **interrupt 等人审批**（人机协同）。见 [人机协同](/langgraph/human-in-the-loop)
- 因为节点之间**并行且事件化推进** → 所以能**流式**吐中间进度。见 [流式输出](/langgraph/streaming)
- 因为图**可组合**（子图当节点） → 所以能拼**多智能体**。见 [多智能体与子图](/langgraph/multi-agent)

## 动手前的一句话

概念到此够了。别在这里反复咀嚼——**直接去下一节亲手画你的第一张图**。手搓一遍 `StateGraph → add_node → add_edge → compile → invoke`，这套世界观会瞬间从「看懂」变成「会用」。

---

- 马上动手画第一张图 → [StateGraph 上手：第一个图](/langgraph/quickstart)
- 还没想清楚要不要用 LangGraph → 回看 [LangChain vs LangGraph](/guide/difference)
