---
title: 端到端项目骨架
description: 一个能直接上手改的 LangGraph 项目结构——分层目录、状态与节点组织、依赖注入、配置管理，以及接到 FastAPI 上的最小可运行骨架。
---

# 端到端项目骨架

前面的零件都认全了，这一篇把它们**装成一台能发动的车**。给一套经过生产检验、又不故弄玄虚的目录结构——你直接照着建文件、往里填肉就行。

> **原则**：图定义、节点逻辑、工具、状态、prompt、持久化**各归各位**，靠一个显式的「装配」函数在编译期把依赖拼起来。别把所有东西堆一个 `main.py`——那是 demo，不是项目。

## 目录长这样

```text
my_agent/
├── pyproject.toml            # 依赖：langchain, langgraph, 后端 checkpointer 等
├── .env                      # 密钥只放这里，绝不进 git
├── src/
│   └── my_agent/
│       ├── state.py          # 全局 State 定义（TypedDict + reducer）
│       ├── prompts/          # 每个节点/角色一个 prompt 文件
│       │   ├── supervisor.md
│       │   └── writer.md
│       ├── tools/            # 工具（@tool），按领域分组
│       │   ├── search.py
│       │   └── db.py
│       ├── nodes/            # 节点函数：纯逻辑，输入 State 输出 update/Command
│       │   ├── agent.py
│       │   └── retrieve.py
│       ├── graph.py          # 装配：建 StateGraph、连边、compile（注入 checkpointer）
│       ├── memory.py         # checkpointer / store 的构造与选型
│       └── config.py         # 读环境变量、模型名、超参（recursion_limit 等）
├── serve/
│   └── api.py                # FastAPI：把 graph 暴露成 HTTP / SSE
└── tests/
    └── test_graph.py         # 单跑节点 + 端到端 invoke 断言
```

<GraphFlow
  :steps="[
    { n: '1', title: 'state.py', desc: '先定契约：有哪些字段、怎么合并', tone: 'teal' },
    { n: '2', title: 'tools/ + prompts/', desc: '能力与话术，独立可测', tone: 'blue' },
    { n: '3', title: 'nodes/', desc: '每步做什么，纯函数好单测', tone: 'coral' },
    { n: '4', title: 'graph.py', desc: '装配连线，compile 注入依赖', tone: 'lime' },
    { n: '5', title: 'serve/api.py', desc: '接 FastAPI，对外流式服务', tone: 'teal' }
  ]"
  tags="['分层目录', '依赖注入', 'compile 装配', 'FastAPI + SSE']"
/>

## 一、先定状态契约（state.py）

State 是整张图的数据总线，**先想清楚它，后面所有节点才有据可依**（回顾 [状态与 Reducer](/langgraph/state-reducer)）：

```python
from typing import Annotated, TypedDict
from langgraph.graph.message import add_messages
import operator

class AgentState(TypedDict):
    messages: Annotated[list, add_messages]      # 对话历史，自动追加
    documents: Annotated[list, operator.add]     # 检索结果，并行写靠 add 合并
    quality_score: float | None                  # 单写者字段，直接覆盖
    step: int                                    # 循环刹车计数
```

## 二、节点是纯函数（nodes/）

节点只做一件事：**读 State、算一下、返回「要更新的字段」**（或返回 `Command` 决定去向）。不要在里面 `print`、不要在模块顶层建全局连接——把依赖留给装配阶段注入（回顾 [路由](/langgraph/routing)）：

```python
# nodes/agent.py
from langchain.chat_models import init_chat_model
from ..config import settings

model = init_chat_model(settings.MODEL_ID)   # 模块级建一次即可

def agent_node(state):
    resp = model.invoke(state["messages"])
    return {"messages": [resp], "step": state["step"] + 1}
```

## 三、用装配函数把图拼起来（graph.py）

一个**显式的 builder 函数**，负责连点、连线、并在 `compile()` 时注入 checkpointer/store。这样测试可以传 `InMemorySaver`，生产传 `PostgresSaver`，同一套图定义零改动切换：

```python
# graph.py
from langgraph.graph import StateGraph, START, END
from .state import AgentState
from .nodes.agent import agent_node
from .nodes.retrieve import retrieve_node
from .memory import build_checkpointer

def should_continue(state) -> str:
    last = state["messages"][-1]
    return "tools" if getattr(last, "tool_calls", None) else END

def build_graph(with_memory: bool = True):
    b = StateGraph(AgentState)
    b.add_node("agent", agent_node)
    b.add_node("retrieve", retrieve_node)
    b.add_node("tools", ToolNode(tools))       # 见 langgraph.prebuilt

    b.add_edge(START, "agent")
    b.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
    b.add_edge("tools", "agent")               # 工具结果回灌，形成循环

    return b.compile(checkpointer=build_checkpointer() if with_memory else None)
```

## 四、持久化选型放一起（memory.py）

把「用哪个 checkpointer / store」集中到一个文件，用环境变量切换（回顾 [持久化](/langgraph/persistence)）：

```python
# memory.py
from .config import settings

def build_checkpointer():
    if settings.ENV == "dev":
        from langgraph.checkpoint.memory import InMemorySaver
        return InMemorySaver()
    from langgraph.checkpoint.postgres import PostgresSaver
    return PostgresSaver.from_conn_string(settings.PG_DSN)
```

## 五、接到 FastAPI，对外流式服务（serve/api.py）

图的 `astream` 天生适配 SSE。每个请求带自己的 `thread_id`，断线重连、多轮记忆都白送（回顾 [流式输出](/langgraph/streaming)）：

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import json
from .graph import build_graph

app = FastAPI()
graph = build_graph(with_memory=True)

@app.post("/chat")
async def chat(req: ChatReq):
    config = {"configurable": {"thread_id": req.thread_id}}
    inputs = {"messages": [{"role": "user", "content": req.text}], "step": 0}

    async def gen():
        async for mode, chunk in graph.astream(
            inputs, config, stream_mode=["updates", "messages"]
        ):
            yield f"event: {mode}\ndata: {json.dumps(chunk, ensure_ascii=False, default=str)}\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream")
```

## 六、依赖与配置纪律

- **`pyproject.toml` 锁大版本**：`langgraph>=1.0` / `langchain>=1.0`，别用 `==` 钉死小版本，也别裸奔不写版本。
- **密钥只进 `.env`**：`OPENAI_API_KEY`、`PG_DSN` 等，`.gitignore` 里必须有 `.env`。
- **超参进 `config.py`**：模型名、`recursion_limit`、超时、重试次数，全部集中，别散落在节点里。
- **测试分层**：节点当纯函数单测（喂假 State 断言输出）；图级别用 `InMemorySaver` 端到端跑一遍，断言最终状态与 `step` 收敛。

---

- 拿这套骨架做一个真实 RAG Agent → [RAG Agent 实战](/recipes/rag-agent)
- 部署与可观测怎么做 → [可观测与部署](/recipes/observability-deploy)
- 上线前对着清单排雷 → [常见坑与排查清单](/debugging/pitfalls)
