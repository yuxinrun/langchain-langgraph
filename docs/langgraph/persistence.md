---
title: 持久化与记忆（Checkpointer）
description: LangGraph 的两套持久化系统——thread 级 Checkpointer 与跨 thread 的 Store，含断点恢复、时间旅行与后端选型。
---

# 持久化与记忆（Checkpointer）

这是 LangGraph 区别于「一坨 while 循环」的杀手锏，也是它敢叫自己 **runtime** 的底气。官方把持久化分成**两套互补的系统**（见 [Persistence 文档](https://docs.langchain.com/oss/python/langgraph/persistence)）：

> - **Checkpointer（短期记忆 / 线程级）**：把一个 `thread` 的图状态，按超步存成一串 **checkpoint**。用于多轮对话记忆、断点恢复、人机协同、时间旅行。
> - **Store（长期记忆 / 跨线程）**：一个可以跨 `thread` 读写的 KV/向量存储。用于「记得住用户偏好」「跨会话沉淀知识」。

## 一、给图装配 Checkpointer

持久化不是自动发生的，是你**显式装配**出来的——在 `compile()` 时传一个 checkpointer，并在调用时给一个 `thread_id`：

```python
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import StateGraph, START, END
from typing import Annotated
from typing_extensions import TypedDict
from langgraph.graph.message import add_messages

class State(TypedDict):
    messages: Annotated[list, add_messages]

graph = (
    StateGraph(State)
    .add_node("agent", call_model)
    .add_edge(START, "agent")
    .add_edge("agent", END)
    .compile(checkpointer=InMemorySaver())   # ← 关键：装配
)

# thread_id 就是「这段对话的存档槽位」
config = {"configurable": {"thread_id": "user-42-session-1"}}

graph.invoke({"messages": [{"role": "user", "content": "我叫鱼心"}]}, config)
r = graph.invoke({"messages": [{"role": "user", "content": "我叫什么？"}]}, config)
# 第二次调用不用重述，模型从同一 thread 的历史里记住了「鱼心」
```

**不同 `thread_id` = 不同会话**，彼此隔离；**相同 `thread_id` = 接着上次的状态往下跑**。

## 二、选对后端：从玩具到生产

::: code-group

```python [开发 · InMemorySaver]
from langgraph.checkpoint.memory import InMemorySaver
checkpointer = InMemorySaver()        # 进程内存，重启即失忆，仅开发用
```

```python [单机 · SqliteSaver]
# pip install -U langgraph-checkpoint-sqlite
from langgraph.checkpoint.sqlite import SqliteSaver
checkpointer = SqliteSaver.from_conn_string("checkpoints.db")
# 异步版本：from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
```

```python [生产 · PostgresSaver]
# pip install -U langgraph-checkpoint-postgres
from langgraph.checkpoint.postgres import PostgresSaver
checkpointer = PostgresSaver.from_conn_string("postgresql://...")
checkpointer.setup()                  # 首次建表
```

:::

| 后端 | 适用 | 提醒 |
| --- | --- | --- |
| `InMemorySaver` | 本地实验、单测 | 别拿去生产，重启就没了 |
| `SqliteSaver` | 单机小应用、边缘 | 并发写弱，多副本不合适 |
| `PostgresSaver` | 生产、多副本、需水平扩展 | 记得 `setup()` 建表，配好连接池 |

## 三、读状态、翻历史、改状态

装配了 checkpointer，你就白送了一组「观测/干预」能力，这是 debug 和做产品功能的宝藏：

```python
# 1) 看当前线程的最新状态
snapshot = graph.get_state(config)
print(snapshot.values["messages"][-1])
print(snapshot.next)                 # 下一步准备跑哪些节点（还没跑完时非空）

# 2) 翻历史：拿到一串 checkpoint，从新到旧
for snap in graph.get_state_history(config):
    print(snap.config["configurable"]["checkpoint_id"], snap.next)

# 3) 手动改状态（比如纠错 / 注入一条消息）
graph.update_state(config, {"messages": [HumanMessage("其实我叫余心")]})
```

## 四、时间旅行（Time Travel）

因为是按超步存档，你可以「回到过去某一步，从那里重放」——两种玩法：

- **fork 重放**：从历史里挑一个 `checkpoint_id`，用它作为起点继续 `invoke`，走一条平行时间线。
- **状态改写后续跑**：`update_state` 把某步改对，再让图接着跑。

这对「Agent 第 7 步走歪了，我想回到第 6 步换个选择」这种调试/产品需求，价值巨大。

## 五、长期记忆：Store

`checkpointer` 管的是「单个会话内」的记忆。要做「跨会话都记得这个用户喜欢简洁回答」，用 **Store**（见 [Memory 文档](https://docs.langchain.com/oss/python/langgraph/persistence)）。它在 `compile()` 时和 checkpointer 一起装配：

```python
from langgraph.store.memory import InMemoryStore

graph = builder.compile(
    checkpointer=InMemorySaver(),   # 短期：本会话状态
    store=InMemoryStore(),          # 长期：跨会话的知识/偏好
)

# 节点里用 (namespace, key) 读写长期记忆
def remember(state, store):
    store.put(("memories", "user-42"), "style", {"prefers": "concise"})
    return {}
```

::: tip 一句话分清两套系统
**Checkpointer = 「这个对话聊到哪了」；Store = 「关于这个用户/领域，我长期知道什么」。** 生产 Agent 往往两个都要，各司其职。
:::

## 六、别忘了：这套机制是人机协同的地基

`interrupt` 能「暂停等人、恢复继续」，靠的正是「当前状态被完整存进了某个 checkpoint」。你现在理解了 checkpointer，下一章 [人机协同](/langgraph/human-in-the-loop) 的暂停/恢复就是水到渠成。

---

- 状态能存能恢复，来学「暂停等人批」→ [人机协同（Human-in-the-loop）](/langgraph/human-in-the-loop)
- 想边跑边看进度 → [流式输出（Streaming）](/langgraph/streaming)
