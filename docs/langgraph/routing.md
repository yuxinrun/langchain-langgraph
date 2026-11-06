---
title: 路由：条件边 · Command · Send
description: LangGraph 如何决定下一步——固定边、条件边、节点内 Command 跳转与写状态、Send 动态并行扇出，以及循环刹车 recursion_limit。
---

# 路由：条件边 · Command · Send

上一节决定了「状态怎么合」，这一节决定「下一步去哪」。这是把 Agent 从「一条道走到黑」变成「会拐弯」的关键。LangGraph 给了你三个控制路由的抓手：**条件边、`Command`、`Send`。**

> **一句话分工**：条件边 = 看情况走既定岔路；`Command` = 节点自己决定去哪 + 顺手改状态；`Send` = 运行时动态生成 N 个并行分支。

## 1. 条件边：最常用的小红绿灯

上一节 `should_continue` 就是它。你提供一个「路由函数」，读 State 返回下一站的**名字**，再用 `path_map` 把返回值映射到节点（或 `END`）：

```python
def route(state) -> str:
    score = state["quality_score"]
    if score >= 80:
        return "publish"
    elif score >= 50:
        return "revise"
    return "discard"

builder.add_conditional_edges("evaluate", route, {
    "publish": "publish",
    "revise": "revise",
    "discard": END,
})
```

要点：路由函数**返回的是标签，不是节点对象**（除非你不用 path_map，直接返回节点名/`END`）。它让「分支」和「循环」都成为可能——`revise → evaluate → revise …` 就是这么转起来的。

## 2. `Command`：让节点自己说「去哪、并且改什么」

条件边把「路由决策」放在边上的函数里；`Command` 则把它**收进节点内部**——节点既更新状态，又指定下一跳。适合「路由逻辑和本步计算天然是一回事」的场景（尤其是多智能体的 handoff）：

```python
from langgraph.types import Command

def agent_node(state) -> Command:
    if state["messages"][-1].tool_calls:
        return Command(goto="tools", update={"step": state["step"] + 1})
    return Command(goto=END, update={"final": state["messages"][-1].content})
```

<GraphFlow
  :steps="[
    { n: 'E', title: '固定边', desc: 'A 之后一定 B，无脑', tone: 'teal' },
    { n: 'C', title: '条件边', desc: '边上函数读状态选岔路', tone: 'blue' },
    { n: 'K', title: 'Command', desc: '节点自己 goto + update', tone: 'coral' },
    { n: 'S', title: 'Send', desc: '运行时动态 fan-out N 个分支', tone: 'lime' }
  ]"
  tags="['add_conditional_edges', 'Command(goto, update)', 'Send', 'handoff']"
/>

## 3. `Send`：动态并行（map-reduce 的正确姿势）

普通并行边是「编译期就固定几条分支」。但有时分支数量**运行时才知道**——比如「把检索到的每个文档，都丢给一个 worker 处理」。这就是 `Send` 的主场：

```python
from langgraph.types import Send

def fan_out(state):
    # 有几个文档，就动态派发几个 worker 任务，每个带自己的入参
    return [Send("worker", {"doc": d}) for d in state["documents"]]

builder.add_conditional_edges("retriever", fan_out)   # 多条 Send 并行执行
builder.add_edge("worker", "aggregator")              # aggregator 等待所有 worker
```

- 每个 `Send("worker", payload)` 会为 `worker` 节点起一次**带独立输入**的执行，彼此并行。
- 结果通过上一节讲的 **reducer** 汇总到 State（如 `results: Annotated[list, operator.add]`）。
- `worker` 节点的入参会收到 `Send` 里带的那个 payload，而不是整份全局 State。

这套「fan-out → 并行 → reduce 汇总」就是经典的 map-reduce，用在「批量评估、多源检索、多路对比」上非常顺手。

## 4. 循环刹车：`recursion_limit`

图能循环是优点，也是杀手。模型如果一直「要点工具 → 要点工具 → …」，你会烧 token 烧到怀疑人生。LangGraph 用**超步数上限**当刹车，默认 25：

```python
try:
    graph.invoke(inputs, {"recursion_limit": 40})
except Exception as e:
    # GraphRecursionError：说明图转了太久没收敛
    ...
```

实战组合拳：**用 reducer 维护一个 `step` 计数，在路由函数里判断「超过 N 步就强制 END」**，比单纯依赖 `recursion_limit` 报错体面得多：

```python
def guarded_route(state):
    if state["step"] > 10:
        return "give_up"          # 优雅兜底，而不是硬撞上限
    return "continue"
```

## 5. 我该用哪个？

| 需求 | 选择 |
| --- | --- |
| 简单 if/else 分流 | 条件边 |
| 路由决策和本步计算是一回事 / 要改状态再跳 | `Command` |
| 分支数量运行时才知道、要并行处理一堆东西 | `Send` |
| 多智能体互相「移交控制权」 | `Command(goto=...)`（见 [多智能体](/langgraph/multi-agent)） |

更多 API 细节见官方 [Graph API](https://docs.langchain.com/oss/python/langgraph/graph-api)。

---

- 路由会拐弯了，下一步让它「记得住、能恢复」→ [持久化与记忆（Checkpointer）](/langgraph/persistence)
