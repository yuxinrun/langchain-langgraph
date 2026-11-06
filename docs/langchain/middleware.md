---
title: Middleware 与结构化输出
description: 用 LangChain 1.0 的 Middleware 在 Agent 循环的钩子点插入审批、摘要、脱敏等逻辑，并控制结构化输出。
---

# Middleware 与结构化输出

`create_agent` 最大的痛点历来是「太封闭」——循环是内置的，你想在中间插手很难。LangChain 1.0 的答案是 **Middleware（中间件）**：在 Agent 循环的各个**钩子点**上挂你自己的逻辑，而不用重写成底层图。

> **一句话**：Middleware 之于 Agent 循环，就像拦截器/过滤器之于 HTTP 请求链——请求进来、模型调用前后、工具执行前后，都能拦一道。

## 钩子点：你能在哪里插手

Agent 每一步都会经过若干个「拦截位」。官方在 1.0 博客里给出的钩子覆盖了循环的每个环节：

<GraphFlow
  :steps="[
    { n: '1', title: 'Agent 启动前', desc: '注入系统提示、初始化状态', tone: 'teal' },
    { n: '2', title: '模型调用前后', desc: '改写消息、压缩历史、拦截输出', tone: 'blue' },
    { n: '3', title: '工具执行前后', desc: '审批高危调用、改写参数', tone: 'coral' },
    { n: '4', title: '循环结束/异常', desc: '收尾、兜底、fallback', tone: 'lime' }
  ]"
  tags="['before_model', 'after_model', 'before_tool', 'after_tool']"
  note='具体钩子名称与签名以官方文档为准：docs.langchain.com → LangChain → Middleware。这里讲「能插手的位置」，不背死 API。'
/>

## 三个内置中间件：直接开箱用

官方为最常见的需求预置了三件套，`create_agent(..., middleware=[...])` 里传进去即可：

```python
from langchain.agents import create_agent
from langchain.agents.middleware import (
    SummarizationMiddleware,
    HumanInTheLoopMiddleware,
    # PII 脱敏中间件同样在 langchain.agents.middleware 下
)

agent = create_agent(
    model="openai:gpt-4o-mini",
    tools=[get_weather, transfer_money],
    middleware=[
        # 1) 历史快撑爆上下文时，自动摘要旧消息、保留最近若干条
        SummarizationMiddleware(
            model="openai:gpt-4o-mini",
            max_tokens_before_summary=8000,
            messages_to_keep=6,
        ),
        # 2) 高危工具调用前暂停，等人批准 / 编辑 / 拒绝后再执行
        HumanInTheLoopMiddleware(
            interrupt_on={"transfer_money": True},
            description_prefix="请确认以下操作",
        ),
    ],
)
```

| 中间件 | 解决什么 | 典型场景 |
| --- | --- | --- |
| **Summarization** | 对话太长 → token 溢出 / 成本飙升 / 模型失焦 | 长会话客服、多轮研究助理 |
| **Human-in-the-loop** | 高危动作不能让模型说了算 | 转账、发正式邮件、删数据、上线 |
| **PII redaction** | 敏感信息（邮箱/手机号/证件号）别喂给模型 | 合规、隐私敏感业务 |

::: tip 先别急着写自定义中间件
90% 的需求这三件套 + 一两个工具就覆盖了。**先复用，再定制。** 当你发现内置中间件的粒度确实卡不住你的逻辑，再考虑：要么写自定义 middleware，要么直接下钻 LangGraph 手写节点。
:::

完整钩子清单与自定义 middleware 的写法，见官方 [LangChain Middleware 文档](https://docs.langchain.com/oss/python/langchain/middleware)。

## 结构化输出：让 Agent 稳定吐出你要的 JSON

很多时候你不想要一段散文答复，而要一个**能进数据库的结构**（比如 `{temperature, condition}`）。1.0 把结构化输出**并进了主循环**，省掉了一次额外的模型调用，既降延迟又省钱。两条路径：

::: code-group

```python [工具策略 ToolStrategy]
from pydantic import BaseModel
from langchain.agents import create_agent
from langchain.agents.structured_output import ToolStrategy

class WeatherReport(BaseModel):
    temperature: float
    condition: str

agent = create_agent(
    model="openai:gpt-4o-mini",
    tools=[get_weather],
    response_format=ToolStrategy(WeatherReport),   # 让模型「通过调用一个特殊工具」产出结构
    system_prompt="帮用户查询天气并返回结构化结果。",
)

result = agent.invoke({"messages": [{"role": "user", "content": "北京天气？"}]})
print(result["structured_response"])   # WeatherReport(temperature=23.0, condition='晴')
```

```python [模型原生 structured_output]
from pydantic import BaseModel

class WeatherReport(BaseModel):
    temperature: float
    condition: str

# 模型本身支持结构化输出时，可直接约束，无需额外工具轮
model = init_chat_model("openai:gpt-4o-mini")
structured = model.with_structured_output(WeatherReport)
print(structured.invoke("北京天气如何？"))
```

:::

- **ToolStrategy**：靠「调用一个返回该 schema 的工具」来拿结构，兼容性最好，适合不原生支持结构化输出的模型。
- **Provider-native**：直接让模型按 JSON schema 输出，延迟更低（不再多一轮），但依赖模型能力。

选型经验：**要跨模型稳定，用 ToolStrategy；追求极限延迟且模型给力，用原生。** 详见 [Structured Output 文档](https://docs.langchain.com/oss/python/langchain/structured-output)。

---

- 到这里，LangChain 的「自动挡」你已经开熟了。
- 想让流程「会拐弯、能长跑、可恢复」？进入重点：[LangGraph 心智模型](/langgraph/mental-model)
