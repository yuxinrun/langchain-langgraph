---
title: create_agent：跑通第一个 Agent
description: 从零用 LangChain 1.0 的 create_agent 跑通一个会自己调用工具、可流式输出、能记住上下文的 Agent。
---

# create_agent：跑通第一个 Agent

这一节的目标很单纯：**在你的机器上，跑出第一个真能「想 + 调工具 + 答」的 Agent。** 不搞概念，全程可复制。

> `create_agent` 是 LangChain 1.0 的门面担当——一个函数得到一个标准 Agent，而且它底层就是一张 LangGraph 图。

## 0. 装环境

需要 **Python 3.10+**（1.0 已放弃 3.9）。用一个干净的虚拟环境：

```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate

pip install -U langchain "langchain[openai]" langgraph
# 用别的厂商就换成 langchain[anthropic] 等
export OPENAI_API_KEY="sk-..."
```

## 1. 最小可跑：一个会查天气的 Agent

```python
from langchain.agents import create_agent
from langchain_core.tools import tool

@tool
def get_weather(city: str) -> str:
    """查询指定城市的实时天气。"""
    # 生产里这里调真实气象 API
    return f"{city}：晴，23°C，空气质量优。"

agent = create_agent(
    model="openai:gpt-4o-mini",
    tools=[get_weather],
    system_prompt="你是一个乐于助人的天气助理，回答简洁。",
)

result = agent.invoke(
    {"messages": [{"role": "user", "content": "北京现在天气如何，适合跑步吗？"}]}
)

# 最终答复藏在最后一条 AI 消息里
print(result["messages"][-1].content)
```

跑起来你会看到：模型**先决定调用 `get_weather`**（框架自动执行），拿到结果后再组织一句「北京晴、23°C，适合跑步」。**这个「决定调工具 → 执行 → 回灌 → 再答」的循环，就是 Agent 的全部秘密。**

::: tip invoke / stream / ainvoke
`create_agent` 返回的东西就是一个编译好的 LangGraph 图，所以 LangGraph 的调用姿势全都能用：
- `agent.invoke(input)`：一次性拿到最终结果。
- `agent.stream(input)`：逐步产出（节点级 / token 级），适合做进度展示。
- `agent.ainvoke / astream`：异步版本，接 FastAPI 之类时优先用。
:::

## 2. 看清楚它到底干了啥

把 `result["messages"]` 打印出来，你会看到一个典型的四段式轨迹——这也是你 debug 时最该盯的东西：

```text
HumanMessage   → 北京现在天气如何，适合跑步吗？
AIMessage      → tool_calls: get_weather(city="北京")   # 模型决定动手
ToolMessage    → 北京：晴，23°C，空气质量优。              # 框架执行并回灌
AIMessage      → 北京晴、23°C，空气质量优，很适合户外跑步～  # 收尾答复
```

配合 [LangSmith](https://smith.langchain.com/) 可以把每一步（含 token 用量、耗时）可视化回放。在代码里加上两行环境变量即可接入：

```bash
export LANGSMITH_TRACING=true
export LANGSMITH_API_KEY="ls_..."
```

## 3. 让它「记住上一句」：加个 Checkpointer

默认每次 `invoke` 都是失忆的新对话。要让 Agent 记住上下文，给它配一个 **checkpointer**，并用 `thread_id` 区分会话——这里提前尝了一口 LangGraph 的持久化能力：

```python
from langgraph.checkpoint.memory import InMemorySaver

agent = create_agent(
    model="openai:gpt-4o-mini",
    tools=[get_weather],
    system_prompt="你是一个乐于助人的天气助理。",
    checkpointer=InMemorySaver(),   # ← 关键：装配持久化
)

cfg = {"configurable": {"thread_id": "user-42"}}

agent.invoke({"messages": [{"role": "user", "content": "北京天气？"}]}, cfg)
# 这一句不用再说「北京」，模型已经从上一轮记住了
r2 = agent.invoke({"messages": [{"role": "user", "content": "那上海呢？"}]}, cfg)
print(r2["messages"][-1].content)
```

::: warning 别把「记忆」和「上下文窗口」搞混
`InMemorySaver` 只活在进程内存里，重启就没了。生产要用持久化后端（如 `SqliteSaver` / Postgres 版 checkpointer）。checkpointer 与 thread 的完整机制，见本站重点章节 [持久化与记忆（Checkpointer）](/langgraph/persistence)。
:::

## 4. 流式输出：别让用户干等

真实产品里，你多半想「打字机」式地把回复吐出来。`stream` 的 `messages` 模式可以逐 token 产出：

```python
for ns, chunk in agent.stream(
    {"messages": [{"role": "user", "content": "推荐三项北京周末活动"}]},
    cfg,
    stream_mode="messages",
):
    if hasattr(chunk, "content") and chunk.content:
        print(chunk.content, end="", flush=True)
```

流式在 LangGraph 里有更丰富的模式（values / updates / custom），单独开在 [流式输出（Streaming）](/langgraph/streaming) 一节。

## 小结与下一步

你现在已经具备：起一个标准 Agent、看清它的执行轨迹、给它加记忆、把回复流式吐出来。**这套 `create_agent` 覆盖了 80% 的日常需求。** 剩下 20% 需要「自定义流程、分支、断点恢复、人工审批」的，就是我们接下来要用 LangGraph 手动挡解决的事。

---

- 想给循环加「审批 / 摘要 / 脱敏」？→ [Middleware 与结构化输出](/langchain/middleware)
- 准备进入重点，从世界观开始 → [LangGraph 心智模型：State · Node · Edge](/langgraph/mental-model)
