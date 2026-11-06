---
title: LangChain vs LangGraph
description: 一次讲清 LangChain 与 LangGraph 的关系、分工与区别——不是竞品，而是同一台发动机的高层 API 与底层运行时。
---

# LangChain vs LangGraph

这是本站最想帮你打通的一节。先把结论钉死：

> **LangChain 和 LangGraph 不是「二选一」的竞品，而是「同一台发动机的两个挡位」。** LangChain 是高层 API（帮你快速造 Agent），LangGraph 是底层框架 + 运行时（帮你精细控制并稳跑 Agent）。而且——**LangChain 的 `create_agent` 本身就跑在 LangGraph 之上。**

这不是一家之言，是官方在 [1.0 发布博客](https://www.langchain.com/blog/langchain-langgraph-1dot0) 里的原话：*「LangChain agents are built on LangGraph, so you're not locked in.」*

## 一张图看懂分层关系

<RuntimeStack />

从上到下有三层：

| 层 | 归属 | 它负责什么 | 你会直接写它吗 |
| --- | --- | --- | --- |
| 高层 API | LangChain | `create_agent`、标准 Agent 循环、Middleware、结构化输出 | 多数时候写这层就够 |
| 编排层 | LangGraph | `StateGraph`、节点、边、条件路由、子图 | 要精细控制时才手写 |
| 运行时 | LangGraph | 持久化 / Checkpoint、流式、人机协同、可恢复 | 通过配置「装配」出来 |

关键事实来自 1.0 发布：`langgraph.prebuilt` 里的 `create_react_agent` 被**弃用**，功能搬到了 `langchain.agents` 的 `create_agent`——这个搬家本身就说明了「高层归 LangChain，底层引擎归 LangGraph」的分工。

## 各自到底强在哪

### LangChain —— 让你「五分钟上路」

LangChain 1.0 把自己**瘦身**成一堆核心构件（旧功能打包进了 `langchain-classic`）。它的价值是「provider 无关 + 开箱即用」：

- **模型抽象**：换 OpenAI / Anthropic / Gemini 不用改业务代码。
- **标准消息与内容块**：1.0 引入 [standard content blocks](https://docs.langchain.com/oss/python/langchain/messages)，让 reasoning、引用、工具调用在不同厂商间有一致的结构，切模型不至于把前端和存储打崩。
- **`create_agent`**：一个函数得到会「想 → 调工具 → 再想」的 Agent。
- **Middleware**：在执行循环的各个钩子点插入逻辑，官方内置了三件套——人机协同、历史摘要（summarization）、PII 脱敏。详见 [LangChain Middleware](https://docs.langchain.com/oss/python/langchain/middleware)。

### LangGraph —— 让你「稳跑长任务」

LangGraph 提供的是**控制与可靠性**。它的四大生产级能力（[LangGraph 概览](https://docs.langchain.com/oss/python/langgraph/overview)）：

- **Durable state（持久状态）**：执行状态自动落盘，服务重启、任务被打断，都能从断点继续，而不是让用户重头再来。
- **Built-in persistence（Checkpointer）**：不写一行数据库代码就能存档/恢复，支撑「多日审批」「跨会话后台任务」。见 [Persistence](https://docs.langchain.com/oss/python/langgraph/persistence)。
- **Human-in-the-loop（人机协同）**：用 `interrupt()` 原生暂停，等人审批/编辑/否决后继续。见 [Interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts)。
- **图式编排**：节点、条件边、`Command`、`Send` 并行、子图——复杂流程随便画。见 [Graph API](https://docs.langchain.com/oss/python/langgraph/graph-api)。

## 用一个类比彻底说死

如果你嫌上面还是抽象，换成后端同学秒懂的说法：

> **LangChain ≈ Spring Boot / Django：给你约定优于配置，快速起服务。**
> **LangGraph ≈ 工作流引擎 / 状态机（Temporal、Airflow 那个味道）：管的是「一个多步骤、可中断、可恢复的流程怎么稳稳推进」。**

你不会问「Spring 和 Temporal 谁更好」——因为它们解决的根本不是同一层问题。LangChain 与 LangGraph 同理。

## 什么时候从 LangChain 下钻到 LangGraph

一张决策表，抄走：

| 你的现状 | 建议 |
| --- | --- |
| 需求正好是标准 Agent 循环（问答 + 调工具 + 给答复） | 停在 LangChain `create_agent`，别自找麻烦 |
| 想在循环里加「审批 / 摘要 / 脱敏」 | 用 LangChain **Middleware**，仍不必碰底层图 |
| 流程里有确定性步骤和智能步骤混编（先抽取→再检索→再判断→再写库） | 上 LangGraph，把每步画成节点 |
| 需要循环、分支、并行、map-reduce 式扇出 | 上 LangGraph 的条件边 / `Send` |
| 需要断点恢复、长时间运行、跨会话记忆 | 上 LangGraph + Checkpointer |
| 想让大流程调用多个小 Agent 协作 | LangGraph 大图里嵌 `create_agent` 节点（见[多智能体](/langgraph/multi-agent)） |

## 一个必须澄清的误区

::: warning 常见误解：「用了 LangGraph 是不是就要抛弃 LangChain？」
恰恰相反。生产里最常见的健康形态是：**外层一张 LangGraph 大图画流程，里面几个节点直接用 `create_agent` 造的小 Agent。** LangChain 提供「构件」，LangGraph 提供「装配线」，两者混用是官方鼓励的默认姿势，不是妥协。
:::

---

- 直接想要选型结论和反例？→ [选型：什么场景用哪个](/guide/which-to-use)
- 想先动手跑一个？→ [create_agent：跑通第一个 Agent](/langchain/create-agent)
