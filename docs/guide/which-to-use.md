---
title: 选型：什么场景用哪个
description: 面向真实业务的 LangChain / LangGraph 选型决策树、场景对照表与「别用什么」的反例。
---

# 选型：什么场景用哪个

选型这件事，最忌讳「因为 LangGraph 更酷所以全项目上 LangGraph」。工程纪律是：**能用高层就用高层，控制不够了再降级。** 这一节给你一套能直接抄的判断方法。

> **一条主线**：LangChain 负责「快速造出能跑的 Agent」，LangGraph 负责「把复杂/长任务/需人审的流程稳稳跑住」。先问需求长什么样，再问用什么工具。

## 决策树：三问定位

<GraphFlow
  :steps="[
    { n: 'Q1', title: '需要工具/循环吗？', desc: '纯问答抽取 → 直接调模型，别上框架', tone: 'coral' },
    { n: 'Q2', title: '是标准 Agent 循环吗？', desc: '问答+调工具+答复 → LangChain create_agent', tone: 'teal' },
    { n: 'Q3', title: '要自定义流程吗？', desc: '分支/循环/并行/恢复/人审 → 下钻 LangGraph', tone: 'blue' },
    { n: '➕', title: '多 Agent 协作？', desc: '大图嵌小 Agent 节点 / supervisor 模式', tone: 'lime' }
  ]"
  tags="['default to high-level', 'drop down when blocked', 'compose freely']"
  note='官方在 1.0 博客里也是这个口径：start with LangChain high-level APIs, seamlessly drop down to LangGraph when you need more control.'
/>

## 场景对照表：照着抄

| 业务场景 | 推荐栈 | 为什么 |
| --- | --- | --- |
| 客服问答机器人（查订单/退款工单） | LangChain `create_agent` + Middleware | 需求就是标准循环，加个审批中间件即可，不必手搓图 |
| 文档 RAG 问答（检索 + 引用 + 拒答） | LangGraph 小图（检索→重排→生成→校验） | 步骤确定性强、要在生成前后插校验节点 |
| 数据分析和报告生成（取数→清洗→图→结论） | LangGraph | 确定性步骤 + 智能步骤混编，天然是流水线 |
| 需要人工审批的高危操作（转账/发文/上线） | LangGraph + Checkpointer + `interrupt` | 断点续跑 + 人在环路是 LangGraph 的看家本领 |
| 多日、跨会话的后台长任务 | LangGraph durable state | 进程重启也要从断点接着跑 |
| 多专家协作（研究/写作/审校分工） | LangGraph 多智能体 / 子图 | supervisor 或 handoff 模式编排多个 Agent |
| 想快速做个内部小工具 PoC | LangChain `create_agent` | 少写代码，最快见效 |
| 单次文本分类/实体抽取/翻译 | 直接调模型 API | 没有循环没有工具，上框架是负收益 |

## 什么时候「别用」——反例最有教育意义

::: danger 四种典型的过度工程
1. **给一个「输入→输出」的抽取任务上了整套 LangGraph 图。** 你没有循环、没有状态、没有分支，图只会让你的 YAML 评审多开一小时。
2. **明明只是想加个「历史太长要摘要」，却重写成手写节点图。** LangChain 已有内置 summarization middleware，别自己造。
3. **一上来就用 LangGraph 手搓 Agent 循环。** `create_agent` 已经帮你把这个循环（其实就是官方曾经 `create_react_agent` 的东西）做好了，先复用它，再谈定制。
4. **不用 Checkpointer 却宣称「我们的 Agent 有记忆」。** 记忆是持久化装配出来的，不是模型自带的。
:::

## 能力打分：帮你量化取舍

<FrameworkBars />

读图要点：**上手速度 LangChain 赢，控制力与长任务 LangGraph 赢。** 而这两列在「持久化 / 人机协同」上都高，是因为高层 LangChain 也吃了 LangGraph 运行时的红利。

## 一句落地建议

新项目默认这么起手，基本不会错：

1. 先用 `create_agent` 把 Agent 跑起来，验证「模型 + 工具」这套能不能满足需求。
2. 当你开始想要「在两次模型调用之间插一步确定性逻辑」「让某人审批后再继续」「跑到一半能恢复」——恭喜，这正是切换 LangGraph 的信号。
3. 复杂系统里，让 LangGraph 当骨架、`create_agent` 当其中的节点，是最省心的混合姿势。

---

- 关系还没吃透？回看 [LangChain vs LangGraph](/guide/difference)
- 想立刻动手？→ [create_agent：跑通第一个 Agent](/langchain/create-agent)
- 想看端到端怎么搭？→ [端到端项目骨架](/recipes/project-structure)
