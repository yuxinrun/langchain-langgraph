---
title: 状态与 Reducer
description: LangGraph 的 State schema、reducer 合并规则、add_messages、自定义 reducer，以及并行写入同一 key 的正确姿势。
---

# 状态与 Reducer

心智模型里说「节点返回更新」，那**多个更新怎么合并进 State？** 答案就是 **reducer（归并函数）**。这一节是新手最容易「看是看懂、一跑就炸」的地方，我们把它一次钉死。

> **默认行为：节点返回什么，就直接覆盖对应 key。** 这通常不是你想要的——尤其当你要「往列表里加一条」而不是「把列表换成一条」的时候。

## 没有 reducer 时会发生什么

```python
class State(TypedDict):
    messages: list          # ← 没加 reducer

def bad_node(state: State):
    return {"messages": [AIMessage("我只说了一句")]}
# 结果：messages 被整个替换成只剩这一条，历史全没了 😱
```

这就是首页避坑清单里那条「节点返回整块覆盖状态」的真相。**要追加，就要显式声明 reducer。**

## `add_messages`：消息场景的标配

LangGraph 给消息通道预置了 `add_messages` reducer，它会**追加**新消息，并**按消息 id 去重/更新**（同 id 的消息会被替换，方便编辑历史）。这就是为什么前面每节都写 `Annotated[list, add_messages]`：

```python
from typing import Annotated
from langgraph.graph.message import add_messages

class State(TypedDict):
    messages: Annotated[list, add_messages]
```

`add_messages` 还有个隐藏福利：它会把 dict 形式的消息（如 `{"role": "user", "content": "..."}`）自动转成标准的 `Message` 对象。

## 自定义 reducer：把「覆盖」改成「你要的合并」

reducer 就是一个 `(当前值, 更新值) -> 新值` 的函数，挂在 `Annotated` 的第二个参数上：

```python
import operator
from typing import Annotated
from typing_extensions import TypedDict

def add_int(left: int, right: int) -> int:
    return left + right

class State(TypedDict):
    # 列表追加：直接用 operator.add
    logs: Annotated[list[str], operator.add]
    # 计数器累加：自定义 reducer
    hit_count: Annotated[int, add_int]
    # 不加 Annotated 的字段 = 默认「后写覆盖」
    final_answer: str
```

::: tip 一张速查表：想干嘛用什么 reducer
| 你想要的 | 怎么写 |
| --- | --- |
| 消息按序追加 + 按 id 去重 | `Annotated[list, add_messages]` |
| 普通列表追加 | `Annotated[list, operator.add]` |
| 数字累加 | `Annotated[int, lambda a, b: a + b]` |
| 字典浅合并 | `Annotated[dict, lambda a, b: {**a, **b}]` |
| 谁最后写谁说了算 | 不加 `Annotated`（默认覆盖） |
:::

## 并行写入：reducer 是「防爆」关键

回忆超步模型——**同一超步里多个并行节点可能同时写同一个 key**。如果这个 key 没有 reducer，LangGraph 会直接报错（一个通道一步只接受一个值）。有了 reducer，并行更新才会被正确合并：

<GraphFlow
  :steps="[
    { n: 'F', title: 'fan-out', desc: '同一步并行跑 A / B / C', tone: 'blue' },
    { n: 'M', title: '合并写入', desc: '三个节点都写 results', tone: 'teal' },
    { n: 'R', title: 'reducer', desc: '用 operator.add 合成一份', tone: 'lime' },
    { n: 'J', title: 'join', desc: 'results 汇总后进入下一步', tone: 'coral' }
  ]"
  tags="['parallel super-step', 'one write per channel', 'reducer prevents crash']"
/>

```python
def node_a(state): return {"results": ["A"]}
def node_b(state): return {"results": ["B"]}

# results 必须有 reducer，否则并行写会炸
class State(TypedDict):
    results: Annotated[list, operator.add]

builder.add_edge("start", "node_a")
builder.add_edge("start", "node_b")   # 两个分支同一步并行跑，都写 results
```

## 用 Pydantic 当 State：更强的校验

状态也能用 Pydantic 模型定义，好处是自动校验 + 默认值 + 更清晰的类型：

```python
from pydantic import BaseModel, Field
from typing import Annotated
from langgraph.graph.message import add_messages

class State(BaseModel):
    messages: Annotated[list, add_messages] = []
    score: int = Field(default=0)
```

::: tip TypedDict 还是 Pydantic？
- **TypedDict**：轻量、快、够用——日常首选。
- **Pydantic**：需要字段校验、默认值、复杂嵌套时更香。
- 两者都支持 `messages` 特殊通道，切换成本很低。
:::

## 别忘了：State 是持久化的载体

正因为状态被结构化成「通道 + reducer」，checkpointer 才能把每一步的 State 干净地存下来、恢复回去。**你现在学的 reducer，直接决定了你后面断点恢复、时间旅行的正确性。** 衔接阅读 → [持久化与记忆（Checkpointer）](/langgraph/persistence)。

---

- 状态搞定了，接下来学「下一步走哪」→ [路由：条件边 · Command · Send](/langgraph/routing)
