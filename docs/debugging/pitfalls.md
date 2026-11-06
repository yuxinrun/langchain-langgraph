---
title: 常见坑与排查清单
description: LangGraph / LangChain 转型路上最常踩的坑与照着就能排查的清单——从状态没合并、循环失控、interrupt 不幂等，到 checkpointer 缺失、版本迁移与上下文爆炸。
---

# 常见坑与排查清单

这一页是**血泪浓缩**：把新手（以及自负的老手）在 LangGraph/LangChain 上反复踩的坑列成清单。遇到问题，先来这儿对一遍，能省你一半 debug 时间。每条都给「症状 → 原因 → 解法」。

## 一、状态类

### 1. 并行写同一字段，结果丢了 / 报 `InvalidUpdateError`

- **症状**：多个节点或 `Send` 分支往同一个 State key 写，抛 `Could not apply the updates`，或后写的把先写的默默覆盖。
- **原因**：这个字段没声明 **reducer**，LangGraph 不知道「两个值怎么合」。
- **解法**：给该字段用 `Annotated[..., reducer]`——消息用 `add_messages`，列表累加用 `operator.add`，计数用自定义合并函数（见 [状态与 Reducer](/langgraph/state-reducer)）。

### 2. 对话历史凭空消失

- **症状**：明明上一轮说过的事，这一轮模型完全不记得。
- **原因**：要么没配 `checkpointer`，要么两次调用用了**不同的 `thread_id`**。
- **解法**：`compile(checkpointer=...)` + 每次 invoke 传**同一个** `thread_id`（见 [持久化](/langgraph/persistence)）。

## 二、路由与循环类

### 3. `GraphRecursionError`：图转太久被强制叫停

- **症状**：`Recursion limit of 25 reached without hitting a stop condition`。
- **原因**：Agent 陷入「要工具→调工具→再要工具」的死循环，或你的条件边永远回不到 END。
- **解法**：① 检查回边逻辑，确保有**明确的终止条件**；② 用 `step` 计数 + 路由里「超 N 步强制 END」优雅兜底；③ 真需要更多轮再调大 `recursion_limit`（治标），别把它当默认设置。

### 4. 条件边返回了节点对象 / 名字拼错，图「不走」

- **症状**：图跑到某个节点就停了，或跳去意外分支。
- **原因**：路由函数**返回的是标签字符串**，要能在 `path_map` 里查到；返回对象或拼错名字会静默失效或报错。
- **解法**：路由函数返回**字符串**，并确保 `path_map` 覆盖所有可能返回值；`END` 也要显式映射。

### 5. 子图/多 Agent 互相踢皮球，控制权绕圈

- **症状**：supervisor 把活派给 A，A 又甩给 B，B 再丢回 A……token 疯涨。
- **原因**：交接判据不明确，靠模型「猜」该不该收尾。
- **解法**：每个交接点写**显式状态位**（`needs_x=False`）作为完成判据；给整队设 `recursion_limit` 与「谁最终拍板结束」的兜底（见 [多智能体](/langgraph/multi-agent)）。

## 三、人机协同类

### 6. `interrupt` 恢复后，副作用被执行了两遍

- **症状**：明明只批了一次，钱扣了两回 / 邮件发了两封。
- **原因**：含 `interrupt` 的节点在 resume 时会**从头重跑**，你把副作用写在了 `interrupt()` **之前**。
- **解法**：**把有副作用的操作放在 `interrupt()` 返回之后**，并用唯一操作 ID 做幂等去重（见 [人机协同](/langgraph/human-in-the-loop)）。

### 7. resume 报「没有待恢复的中断」

- **症状**：`Command(resume=...)` 无效，图不动。
- **原因**：`thread_id` 和暂停时不一致，或压根没配 checkpointer（没有存档点就没有「恢复」可言）。
- **解法**：确认 `compile` 时装配了 checkpointer，并用**同一个 `thread_id`** 恢复；先 `get_state(config)` 看 `tasks[].interrupts` 确认确实卡在暂停点。

## 四、持久化与生产类

### 8. 生产用 `InMemorySaver`，重启集体失忆

- **症状**：本地好好的，一部署多副本/一重启，所有会话历史蒸发。
- **原因**：`InMemorySaver` 只存进程内存。
- **解法**：生产一律 `PostgresSaver`（记得 `.setup()` 建表 + 连接池），单机玩具才考虑 Sqlite（见 [持久化选型](/langgraph/persistence)）。

### 9. 忘了开 tracing，线上「答非所问」无从查起

- **症状**：用户说 Agent 输出离谱，你本地复现不出，也看不到线上到底怎么走的。
- **解法**：第一天就 `LANGSMITH_TRACING=true`，让每个线程留下完整 trace 树（见 [可观测与部署](/recipes/observability-deploy)）。

## 五、LangChain 与迁移类

### 10. 还在用 `create_react_agent` / 旧的 chain API

- **症状**：装了 1.0 后 import 报错或行为变了；用着被弃用的入口。
- **原因**：1.0（2025-10）把 `create_react_agent` 从 `langgraph.prebuilt` 迁到了 `langchain.agents.create_agent`；老式 chain/LCEL 玩法归入 `langchain-classic`。
- **解法**：新项目直接用 `create_agent`（它就跑在 LangGraph runtime 上，见 [create_agent](/langchain/create-agent)）；维护旧代码时按需引 `langchain-classic`，但心里要有数那是过渡态。

### 11. 结构化输出忽成忽败

- **症状**：`with_structured_output` 有时不返回你要的 JSON schema。
- **原因**：走的是 provider 原生结构化输出，某些模型支持不稳。
- **解法**：关键约束可改用 **ToolStrategy**（用一个「强制调用的工具」来兜住结构），或对输出做校验后重试（见 [Middleware 与结构化输出](/langchain/middleware)）。

## 六、成本与上下文类

### 12. token 烧穿 / 上下文越跑越肥

- **症状**：长对话或多 Agent 跑几轮，账单和延迟一起起飞。
- **原因**：把整段历史、所有中间消息一股脑塞进每一步的 prompt。
- **解法**：给 Agent 上 **SummarizationMiddleware** 压缩历史、给子 Agent 的 State「瘦身」只带必要字段、检索类任务只喂「过了打分」的文档（见 [Agentic RAG](/recipes/rag-agent)）。

## 快速自查口诀

<GraphFlow
  :steps="[
    { n: '1', title: '合了吗', desc: '并行字段有没有 reducer', tone: 'teal' },
    { n: '2', title: '存了吗', desc: 'checkpointer + 对的 thread_id', tone: 'blue' },
    { n: '3', title: '收口了吗', desc: '循环有终止、有 step 刹车', tone: 'coral' },
    { n: '4', title: '幂等了吗', desc: 'interrupt 前无副作用', tone: 'lime' },
    { n: '5', title: '看见了吗', desc: 'tracing 开了没', tone: 'teal' }
  ]"
  tags="['reducer', 'thread_id', 'termination', 'idempotent', 'tracing']"
/>

---

- 系统重学每一步机制 → [心智模型：State · Node · Edge](/langgraph/mental-model)
- 上线前把护栏补齐 → [可观测与部署](/recipes/observability-deploy)
- 忘了官方 API 细节 → [LangGraph 官方文档](https://docs.langchain.com/oss/python/langgraph/overview)
