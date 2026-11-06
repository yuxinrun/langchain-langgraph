---
title: 流式输出（Streaming）
description: LangGraph 的四种流式模式 values / updates / messages / custom，以及异步流、子图流与生产用法。
---

# 流式输出（Streaming）

长任务最忌讳「转圈 30 秒然后一次性砸结果」。LangGraph 把流式做成了一等公民，因为图本来就是**一个超步一个超步**往前推的——每推一步，就可以往外吐一次（见 [Streaming 文档](https://docs.langchain.com/oss/python/langgraph/streaming)）。

> **一句话**：`graph.stream(...)` 让你在图还没跑完时，就不断拿到「此刻发生了什么」。选哪种 `stream_mode`，取决于你想看「什么粒度的事件」。

## 四种流式模式，一张表记住

| `stream_mode` | 吐出来的是 | 粒度 | 典型用途 |
| --- | --- | --- | --- |
| `"values"` | 每步之后的**完整 State 快照** | 粗 | 想看全局进度、做状态回放 |
| `"updates"` | 每个节点**产生的增量更新** | 中 | 展示「哪个节点刚干完活」的进度条 |
| `"messages"` | 模型 token 流 + 消息事件 | 细 | 打字机式逐字输出（最常用在对话 UI） |
| `"custom"` | 你自己 `writer(...)` 推的任意数据 | 自定义 | 进度百分比、检索召回数、中间指标 |

## 1. updates：看「哪个节点刚跑完」

```python
for chunk in graph.stream(inputs, config, stream_mode="updates"):
    # chunk 形如 {"agent": {"messages": [...]}}，一次一个节点
    for node, delta in chunk.items():
        print(f"[{node}] 更新了 {len(delta.get('messages', []))} 条消息")
```

做多步进度条时最舒服：每收到一个 `updates`，就知道推进了一格。

## 2. messages：逐 token 打字机

```python
for ns, chunk in graph.stream(inputs, config, stream_mode="messages"):
    # chunk 是模型吐出的 message chunk，token 级
    if getattr(chunk, "content", ""):
        print(chunk.content, end="", flush=True)
```

前端接 SSE / WebSocket 时，把这个循环的 `chunk.content` 转出去，就是你熟悉的 ChatGPT 式流式回复。

## 3. custom：把「只有你知道的中间量」推出去

模型调用之外，你常常想吐点私有进度——检索召回了几篇、重排耗时多少。用 `get_stream_writer`：

```python
from langgraph.config import get_stream_writer

def retrieve(state):
    writer = get_stream_writer()
    docs = search(state["query"])
    writer({"stage": "retrieval", "count": len(docs)})   # ← 自定义事件
    return {"documents": docs}

for event in graph.stream(inputs, config, stream_mode="custom"):
    print(event)   # {'stage': 'retrieval', 'count': 8}
```

## 4. 组合多种模式 + 异步

一次订阅多种粒度，返回值会带上「是哪一种模式」：

```python
for mode, data in graph.stream(
    inputs, config, stream_mode=["updates", "custom"]
):
    if mode == "updates":
        ...
    elif mode == "custom":
        ...
```

接 FastAPI / 高并发场景一律用异步版 `astream`：

```python
async for chunk in graph.astream(inputs, config, stream_mode="messages"):
    await push_to_websocket(chunk)
```

::: tip 子图也能流
嵌套了子图（见下一章 [多智能体](/langgraph/multi-agent)）时，给 `stream(..., subgraphs=True)`，就能同时拿到父图和子图的事件，并且通过返回的命名空间 `ns` 区分事件来自哪一层。
:::

## 实战建议

- **对话类 UI**：默认 `messages`；需要「步骤感」时再并一个 `updates`。
- **长流水线（RAG、报告生成）**：`updates` 做进度骨架 + `custom` 塞业务指标。
- **别在流里做重活**：流式只是「观测」，不要为了拼进度把关键逻辑塞进消费端。
- **记得配超时与取消**：真实世界有半途中断，流式循环要能干净退出。

---

- 一张图跑通了，怎么让多张图/多个 Agent 协同？→ [多智能体与子图](/langgraph/multi-agent)
- 想看流式在真实项目里怎么用 → [端到端项目骨架](/recipes/project-structure)
