---
title: 核心构件：模型 · 消息 · 工具
description: LangChain 1.0 的三大核心构件——Chat 模型抽象、消息与内容块、工具定义，以及它们如何拼成一个 Agent。
---

# 核心构件：模型 · 消息 · 工具

LangChain 1.0 把自己瘦身成了「你真正用来造 Agent 的那几样东西」。抛开历史包袱，它的心脏就三个构件：**模型（Models）、消息（Messages）、工具（Tools）**。把这三个吃透，`create_agent` 只是把它们一键拼起来。

> **一句话**：模型负责「想」，消息负责「说和被说」，工具负责「动手」。Agent = 让模型自己决定什么时候动手。

## 1. 模型：换厂商不改代码

LangChain 的模型抽象是 provider 无关的。官方推荐的起手方式是 `init_chat_model`，用一个字符串指定厂商和型号：

```python
from langchain.chat_models import init_chat_model

# 想换 Anthropic？把下面这行的 model 改掉即可，业务代码一行不动
model = init_chat_model("openai:gpt-4o-mini", temperature=0)

resp = model.invoke("用一句话解释什么是幂等性")
print(resp.content)
```

不同厂商的集成（OpenAI、Anthropic、Google 等）都在 `langchain-<provider>` 包里，接口一致。详见 [Models 文档](https://docs.langchain.com/oss/python/langchain/models)。

## 2. 消息与内容块：对话的原子

对话由一串「消息」组成，按角色分：

| 消息类型 | 谁说的 | 典型用途 |
| --- | --- | --- |
| `SystemMessage` | 你（开发者） | 设定人设、规则、约束 |
| `HumanMessage` | 用户 | 真实输入 |
| `AIMessage` | 模型 | 模型的回复，可能带 `tool_calls` |
| `ToolMessage` | 工具 | 把工具执行结果回灌给模型 |

```python
from langchain_core.messages import SystemMessage, HumanMessage

msgs = [
    SystemMessage("你是一个严谨的助理，不确定就说不确定。"),
    HumanMessage("北京今天适合跑步吗？"),
]
resp = model.invoke(msgs)
```

**1.0 的关键升级是「标准内容块（content blocks）」**：一条消息的 `.content_blocks` 用统一结构描述文本、reasoning、图片、引用、工具调用等。这意味着你从 OpenAI 切到 Anthropic，前端的渲染逻辑和后端的存储结构不至于当场崩掉——因为大家读的是同一套结构。见 [Messages 文档](https://docs.langchain.com/oss/python/langchain/messages)。

## 3. 工具：让模型能「动手」

工具本质是一个带类型注解和文档字符串的函数。`@tool` 装饰器会把它的**名字、参数 schema、docstring** 自动转成模型能读懂的说明书——这也是为什么「工具描述」写得好不好，直接决定模型会不会用它。

```python
from langchain_core.tools import tool

@tool
def get_weather(city: str) -> str:
    """查询指定城市的实时天气。

    Args:
        city: 城市名，使用中文，例如「北京」。
    """
    # 真实场景里这里会调气象 API
    return f"{city}：晴，23°C，适合户外慢跑。"
```

::: tip 工具设计的三条实战经验
1. **docstring 是给模型看的提示词**，不是给人看的注释。写清楚「什么时候该用我」。
2. **参数尽量用基础类型 + 枚举**，别塞一个没人看得懂的 `dict`。
3. **返回要「可消化」**：能摘要就摘要，别把 10MB 原始 JSON 直接怼回上下文（既贵又会让模型失焦）。
:::

工具的授权、隔离、结果裁剪等更工程化的做法，和 MCP 的工具设计一脉相通，可参考姊妹站 [MCP Patterns](https://github.com/yuxinrun/mcp-patterns)。

## 把三者拼起来 = Agent

单独看，这三个构件都很朴素。LangChain 的魔法在于：**`create_agent` 把「模型 + 工具 + 系统提示」组装成一个会自动循环的东西**——它把工具说明书交给模型，模型决定要不要调、调哪个，框架负责执行工具并把 `ToolMessage` 回灌，直到模型给出最终答复。

<GraphFlow
  :steps="[
    { n: 'M', title: '模型', desc: '决定下一步：回答还是调工具', tone: 'teal' },
    { n: 'X', title: '消息', desc: '承载对话历史与工具结果', tone: 'blue' },
    { n: 'T', title: '工具', desc: '真正执行外部动作', tone: 'coral' },
    { n: '∑', title: 'Agent', desc: '让模型自主循环这三者', tone: 'lime' }
  ]"
  tags="['init_chat_model', '@tool', 'content_blocks', 'create_agent']"
/>

---

- 想立刻把这三大构件跑成一个真 Agent？→ [create_agent：跑通第一个 Agent](/langchain/create-agent)
- 想给循环加「审批 / 摘要 / 脱敏」？→ [Middleware 与结构化输出](/langchain/middleware)
