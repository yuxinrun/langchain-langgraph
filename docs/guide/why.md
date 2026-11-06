---
title: 为什么需要 Agent 框架
description: 从普通程序员的视角理解 Agent、以及为什么「裸调 LLM」到「用框架」之间隔着一条生产鸿沟。
---

# 为什么需要 Agent 框架

先下一个判断：**Agent 不是「更聪明的聊天机器人」，而是「一个会自己拐弯、还会记住走到哪了」的程序。** 你要是写过状态机、异步任务队列或者带分支的业务流程，那你其实已经懂了大半——只是主角从「if/else」换成了「大模型」。

> **一句话锚定：裸调 LLM 像手写 socket，用 Agent 框架像用 HTTP 框架。** 都能跑，但后者帮你把重试、连接管理、可观测性这些「脏活」扛了。

## 先搞清楚：什么才算 Agent

市面上「Agent」被用滥了。工程上，一个能打的 Agent 至少满足三件事：

1. **有目标**，而不是单轮问答。你给它「帮我把这周的报销整理好」，而不是「今天天气」。
2. **会用工具**（调用函数、查数据库、发 HTTP），并把工具结果**重新喂回模型**。
3. **在循环里自己决定下一步**：还差信息就再查，够了就收尾给答复。

这三件事合起来，就是所谓的 **Agent 循环（agent loop）**：

<GraphFlow
  :steps="[
    { n: '01', title: '收到请求', desc: '把用户目标放进消息列表', tone: 'teal' },
    { n: '02', title: '问模型', desc: '模型决定：调工具还是直接答', tone: 'blue' },
    { n: '03', title: '执行工具', desc: '调函数/查库，拿到真实结果', tone: 'coral' },
    { n: '04', title: '结果回灌', desc: '把工具输出加回上下文', tone: 'blue' },
    { n: '05', title: '循环或收尾', desc: '没完就回到 02，完了给答复', tone: 'lime' }
  ]"
  tags="['ReAct', 'tool calling', 'agent loop', 'LangGraph super-steps']"
  note='这个循环，LangChain 的 create_agent 帮你内置好了；LangGraph 则允许你把其中每一步拆成节点、想怎么连就怎么连。'
/>

官方对 Agent 的定义与循环细节见 [LangChain Docs · Agents](https://docs.langchain.com/oss/python/langchain/agents)。

## 裸调 LLM 的四种「跑不动」

很多转型同学的第一版 Agent 是这样写的：`while` 循环里调 OpenAI，遇到 `tool_calls` 就执行，把结果 append 回去。看起来能跑，但一旦上真实流量，会撞四堵墙：

| 你会遇到的场景 | 裸调 LLM 的痛 | 框架帮你做了什么 |
| --- | --- | --- |
| 用户刷新页面 / 服务器重启 | 对话状态全丢，从头再来 | LangGraph **Checkpointer** 每步存档，可断点恢复 |
| 任务要跑很久（查 20 个网页） | 干等、前端转圈、超时 | **Streaming** 逐 token / 逐节点吐进度 |
| 关键操作要人审批（转账、发信） | 你得自己造暂停/续跑机制 | **interrupt / Command** 一等公民的人机协同 |
| 想知道「它为啥这么答」 | 只能 print，一脸问号 | **LangSmith** 全链路 trace，逐步回放 |

看到了吗？真正难的不是「让模型说话」，而是**让它说话之外的那一整套工程**：状态、恢复、并发、观测、控制。这正是 [LangGraph](https://www.langchain.com/langgraph) 存在的理由——官方原话是它是「a lower-level framework **and runtime**, designed to support production-grade, long running agents」。

## 那 LangChain 和 LangGraph 分别是啥

别被名字骗成「两个竞品」。一句话先记住关系：

- **LangChain**：偏**高层**的框架，给你标准化的模型抽象、消息、工具、内容块，以及开箱即用的 `create_agent`。目标是「让你飞快地把一个 Agent 上线」。（见 [LangChain 概览](https://docs.langchain.com/oss/python/langchain/overview)）
- **LangGraph**：偏**底层**的框架 + 运行时，把流程建模成「带状态的图」，专供需要精细控制、持久化、长任务的场景。（见 [LangGraph Graph API](https://docs.langchain.com/oss/python/langgraph/graph-api)）
- **关系**：`create_agent` 底层就是用 LangGraph 跑的。所以下一章我们会用一张图讲清「同一台发动机的两个挡位」。

## 用不用框架，其实是道选择题

不是所有场景都值得上框架。给自己三条判断线：

- **只是单次、无状态、无工具的问答/抽取** → 直接调模型 API 就行，别为了时髦引入编排。
- **要调工具、有标准 Agent 循环** → LangChain `create_agent`，五分钟上路。
- **流程复杂、要长跑、要人审、要自定义分支/并行/恢复** → LangGraph，把控制粒度攥在手里。

这三条线展开成完整的选型决策，见下一篇 [LangChain vs LangGraph](/guide/difference) 和 [选型：什么场景用哪个](/guide/which-to-use)。

## 给转型同学的一句定心丸

你不需要「学会 AI」才能做 Agent。你要做的是把**已有的工程直觉**——状态管理、错误处理、幂等、可观测——翻译到「以模型为其中一个节点」的新语境里。LangChain 与 LangGraph 做的事，就是让这套工程直觉有地方落脚。

---

- 想彻底分清两个框架的区别与关系？→ [LangChain vs LangGraph](/guide/difference)
- 手里有具体业务、直接想知道该用哪个？→ [选型：什么场景用哪个](/guide/which-to-use)
