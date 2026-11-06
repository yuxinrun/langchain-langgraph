---
title: StateGraph 上手：第一个图
description: 从零手写第一张 LangGraph 图：StateGraph、节点、边、compile、invoke，并手搓一个工具调用 Agent 循环。
---

# StateGraph 上手：第一个图

上一节建立了世界观，这一节就干一件事：**让你的手敲出一张能跑的图。** 我们会从「最小三步图」起步，再手搓一个完整的「会调工具的 Agent 循环」，让你亲手把 `create_agent` 帮你自动做的那件事拆开看清楚。

> 安装：`pip install -U langgraph "langchain[openai]"`，配好 `OPENAI_API_KEY`。

## 第一张图：最小三步

一个只有「一个节点」的图，熟悉 API 的形状：

```python
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END

class State(TypedDict):
    greeting: str

def make_greeting(state: State):
    return {"greeting": f"你好，{state['greeting']}！"}

# 1) 建图  2) 加节点  3) 连边  4) 编译  5) 运行
graph = (
    StateGraph(State)
    .add_node("greet", make_greeting)
    .add_edge(START, "greet")
    .add_edge("greet", END)
    .compile()
)

print(graph.invoke({"greeting": "鱼心"}))
# {'greeting': '你好，鱼心！'}
```

五个动作记住了吗：**定义 State → `add_node` → `add_edge` → `compile()` → `invoke()`**。`compile()` 之前你手里是「图纸」（StateGraph），之后才是能跑的「应用」（CompiledGraph）。新手最常见的报错就是忘了 `compile()` 或者忘了连 `START` 边。

## 主菜：手搓一个「会调工具」的 Agent 循环

这才是 LangGraph 的精髓。我们要不借助任何 prebuilt，自己把标准 Agent 循环搭出来——**两个节点（模型、工具）+ 一条条件边 + 一条回边**：

<GraphFlow
  :steps="[
    { n: '1', title: 'agent 节点', desc: '调模型，产出回复或 tool_calls', tone: 'teal' },
    { n: '2', title: '条件边 router', desc: '有 tool_calls 去 tools，否则 END', tone: 'blue' },
    { n: '3', title: 'tools 节点', desc: '执行工具，写回 ToolMessage', tone: 'coral' },
    { n: '4', title: '回边', desc: 'tools → agent，形成循环', tone: 'lime' }
  ]"
  tags="['call_model', 'ToolNode', 'should_continue', 'loop back']"
  note='把这四条连起来，就是 create_agent 内部那张图的手写版。看懂它，你就再也不会觉得高层 API 是黑魔法。'
/>

```python
from typing import Annotated, Literal
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from langchain.chat_models import init_chat_model
from langchain_core.tools import tool

@tool
def get_weather(city: str) -> str:
    """查询指定城市天气。"""
    return f"{city}：晴，23°C"

llm = init_chat_model("openai:gpt-4o-mini").bind_tools([get_weather])

class State(TypedDict):
    messages: Annotated[list, add_messages]

def call_model(state: State):
    resp = llm.invoke(state["messages"])
    return {"messages": [resp]}

def should_continue(state: State) -> Literal["tools", "__end__"]:
    last = state["messages"][-1]
    return "tools" if last.tool_calls else "__end__"   # 看模型有没有要点工具

builder = StateGraph(State)
builder.add_node("agent", call_model)
builder.add_node("tools", ToolNode([get_weather]))   # ToolNode 帮你自动执行工具
builder.add_edge(START, "agent")
builder.add_conditional_edges("agent", should_continue, {"tools": "tools", "__end__": END})
builder.add_edge("tools", "agent")                    # ← 这条回边制造了「循环」

agent = builder.compile()
out = agent.invoke({"messages": [{"role": "user", "content": "上海天气怎么样？"}]})
print(out["messages"][-1].content)
```

跑通的瞬间你会意识到：**所谓 Agent，就是一张「模型 ↔ 工具」互相把对方拉起来转圈的图。** `should_continue` 是方向盘，回边是油门，`recursion_limit` 是刹车（下一节 [路由](/langgraph/routing) 会专门讲刹车）。

## 关于 `ToolNode` 和 prebuilt 的现状

::: warning 1.0 的搬家，别踩旧教程的坑
- `langgraph.prebuilt` 里的 **`create_react_agent` 已弃用**，官方把它升级重构成了 LangChain 的 [`create_agent`](/langchain/create-agent)。你上面手搓的这张图，本质就是 `create_agent` 在做的事。
- 但 `ToolNode`、`tools_condition` 这些**积木**依然好用，手搓图时照常用。
- 看到 2024 年的老教程用 `create_react_agent`？知道它去哪了就行，新代码别再用。
:::

## 可视化你的图

调试复杂流程时，把图打印出来极其有用：

```python
# 导出 Mermaid / ASCII 流程图，贴进文档或 IDE 立刻看清拓扑
print(agent.get_graph().draw_ascii())
```

---

- 想真正控制「状态怎么合、并行写会不会打架」→ [状态与 Reducer](/langgraph/state-reducer)
- 想搞懂路由、并行扇出、循环刹车 → [路由：条件边 · Command · Send](/langgraph/routing)
