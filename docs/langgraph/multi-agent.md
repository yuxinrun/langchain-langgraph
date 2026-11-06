---
title: 多智能体与子图
description: 用 LangGraph 组织多个 Agent 协同——supervisor 中枢、handoff 移交、把子图/created agent 当节点嵌入，以及 swarm 群聊模式的落地姿势。
---

# 多智能体与子图

一个 Agent 搞不定的事，就派一队。**多智能体的本质不是「养一堆模型」，而是「把复杂任务拆成各司其职的小图，再编排它们协作」**——而 LangGraph 天生就是编排图的，所以它是这件事最顺手的工具（见 [Use Subgraphs 文档](https://docs.langchain.com/oss/python/langgraph/use-subgraphs)）。

> **一句话**：一个 Agent = 一张图；多个 Agent = 把若干张图（或若干 `create_agent`）作为**节点**拼进一张更大的图，用前面学的 `Command(goto=...)` / 条件边在它们之间路由控制权。

## 为什么要拆成多个 Agent

单体 Agent 塞太多工具、太多职责，会：提示词臃肿、工具选择乱、一步错步步错、难调试。拆开的收益：

- **各司其职**：检索的只管检索，写作的只管写作，审查的只管挑刺。
- **上下文隔离**：每个子 Agent 只看自己该看的 State 字段，不被无关信息污染。
- **可独立演进**：某个环节要换模型/加工具，动那一块就行，不牵一发动全身。

::: tip 别为了多而多
能用一张图 + 几个节点解决的，别硬拆成五个 Agent。**多智能体是「职责真的需要隔离」时的手段，不是炫技。** 大多数业务，一个 supervisor + 两三个专职 Agent 就到顶了。
:::

## 模式一：Supervisor（中枢调度）

最常用、最好落地的模式：一个「主管」Agent 负责决策「下一步交给谁」，把活儿派给专职子 Agent，收回结果再决定下一步。控制流长这样：

<GraphFlow
  :steps="[
    { n: 'U', title: 'Supervisor', desc: '读全局状态，决定下一跳', tone: 'coral' },
    { n: 'R', title: 'Researcher', desc: '专职：检索/查资料', tone: 'blue' },
    { n: 'W', title: 'Writer', desc: '专职：成文/产出', tone: 'teal' },
    { n: 'C', title: 'Critic', desc: '专职：审查/打分', tone: 'lime' },
    { n: 'U', title: '回到 Supervisor', desc: '达标则 END，否则再派活', tone: 'coral' }
  ]"
  tags="['supervisor', 'handoff via Command(goto)', 'subgraph as node', 'loop until done']"
/>

中枢的路由逻辑，就是上一章的 `Command`——**每个子 Agent 干完活把控制权 `goto` 回 supervisor，由 supervisor 再决定下一站**：

```python
from langgraph.types import Command
from langgraph.graph import StateGraph, START, END

def supervisor(state) -> Command:
    """读全局状态，决定下一步交给谁（或收工）。"""
    last = state["messages"][-1].content
    if "DONE" in last:
        return Command(goto=END)
    if state.get("needs_research"):
        return Command(goto="researcher")
    if state.get("draft_missing"):
        return Command(goto="writer")
    return Command(goto="critic")
```

## 模式二：把子图当节点嵌入（compose）

LangGraph 最优雅的一点：**一张编译好的图，本身就能当作另一张图的一个节点**。子 Agent 内部再复杂，对父图而言只是「一个方框」：

```python
# researcher 是一张独立编译好的子图（内部可以有它自己的 agent/tools 循环）
researcher_graph = build_research_agent().compile()

# writer / critic 同理
writer_graph = build_writer_agent().compile()

builder = StateGraph(State)
builder.add_node("supervisor", supervisor)
builder.add_node("researcher", researcher_graph)   # ← 子图直接当节点
builder.add_node("writer", writer_graph)           # ← 又一个子图
builder.add_node("critic", critic_fn)

builder.add_edge(START, "supervisor")
# 子 Agent 干完活统一回到 supervisor，由中枢再决定下一跳
builder.add_edge("researcher", "supervisor")
builder.add_edge("writer", "supervisor")
builder.add_edge("critic", "supervisor")
```

父子图之间靠**共享 State 的字段**传数据。若子图和父图的 State 结构不同，就在「当节点接入」时套一层**转换函数**，把父 State 的某些键喂给子图、再把子图输出映射回父 State——别偷懒让两边结构硬耦合。

::: details 子图也能流式、也能存档
嵌套子图时，`graph.stream(..., subgraphs=True)` 能同时拿到父/子图事件（回顾 [流式输出](/langgraph/streaming)）。checkpointer 也会把子图的中间状态一并纳入存档，恢复时整棵树原样复活（回顾 [持久化](/langgraph/persistence)）。
:::

## 模式三：`create_agent` 直接当节点

前面 [LangChain 速通](/langchain/create-agent) 里用 `create_agent` 造出来的高层 Agent，**同样能塞进大图当一个节点**——你不必手搓它的 agent/tools 循环，只管把它接进编排里：

```python
from langchain.agents import create_agent

# 一个开箱即用、自带工具循环的高层 Agent
translator = create_agent(
    model="openai:gpt-4o-mini",
    tools=[glossary_lookup],
    prompt="你是专业翻译，把用户文本翻成地道英文。",
)

builder.add_node("translator", translator)   # create_agent 的产物直接当节点
```

**这就是「高层省事 + 低层可控」的黄金组合**：简单的活儿用 `create_agent` 三行搞定，复杂编排用 LangGraph 图把多个这种 Agent 串起来。底层它们都跑在同一个 LangGraph runtime 上（见 [LangGraph 仓库](https://github.com/langchain-ai/langgraph)）。

## 模式四：Handoff / Swarm（无中枢、点对点移交）

不是所有协作都需要一个「领导」。Swarm 模式让 **Agent 之间直接把控制权移交给对方**，靠的是工具调用触发的 `Command(goto=...)`：

```python
from langgraph.types import Command

def sales_agent(state):
    ...  # 判断这其实是技术支持的活儿

def handoff_to_support(state) -> Command:
    # 把「移交」做成一个可被调用的工具，调用即跳转
    return Command(goto="support_agent",
                   update={"messages": [system("已转交技术支持")]})
```

- **Supervisor**：星型，有中枢，控制权回收——**好观测、好加护栏**，生产首选。
- **Swarm / Handoff**：网状，无中枢，控制权流转——**更灵活，但容易绕圈**，务必配 `recursion_limit` 和「谁最终收尾」的兜底（回顾 [路由的循环刹车](/langgraph/routing)）。

| 场景 | 推荐模式 |
| --- | --- |
| 流程有明确阶段、要可控可审计 | Supervisor |
| 专职分工清晰、各自内部复杂 | 子图当节点（compose） |
| 想少写循环、快速拼队 | `create_agent` 当节点 |
| 对话式路由、你一句我一句接力 | Handoff / Swarm |

## 落地建议（血泪版）

- **共享状态要「瘦身」**：只把协作必需的字段放进全局 State；子 Agent 私有的一堆中间消息别全塞进父 State，否则上下文爆炸、token 烧穿。
- **每个交接点写清「完成判据」**：supervisor 靠什么判断「researcher 干完了」？显式状态位（`needs_research=False`）永远比让模型猜靠谱。
- **给整队配刹车**：多 Agent 互相踢皮球是真实存在的 bug，`recursion_limit` + 步数计数 + 「超过 N 轮强制收尾」三件套别省。
- **先单跑再联调**：每个子 Agent 先用自己的 thread 单独跑通，再拼进大图——否则出了错你根本不知道是哪个 Agent 的锅。

---

- 想看懂多智能体整体架构与更多范例 → [LangGraph 官方文档](https://docs.langchain.com/oss/python/langgraph/overview)
- 把这套编排真正落成一个能上线的项目 → [端到端项目骨架](/recipes/project-structure)
- 回到基础，复习控制权路由怎么拐弯 → [路由：条件边 · Command · Send](/langgraph/routing)
