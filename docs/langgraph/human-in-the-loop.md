---
title: 人机协同（Human-in-the-loop）
description: 用 LangGraph 的 interrupt 与 Command(resume) 实现暂停审批、编辑、否决再续跑的一等公民人机协同。
---

# 人机协同（Human-in-the-loop）

高危操作（转账、发正式邮件、删库、上线）绝不能让模型一句话就干了。**LangGraph 把「暂停 → 等人批 → 继续」做成了一等公民**，用 `interrupt()` 一个函数搞定（见 [Interrupts 文档](https://docs.langchain.com/oss/python/langgraph/interrupts)）。

> **一句话**：`interrupt(payload)` 会在图的执行中途按下暂停键，把 payload 抛给外部；外面拿到决策后，用 `Command(resume=...)` 把图从暂停处叫醒，接着往下跑。

## 为什么它能成：靠上一章的存档

暂停不是真的让线程挂在那儿等——而是：**图跑到 `interrupt` 处，把当前状态作为一个 checkpoint 存下来，然后就退出了**（进程可以该干嘛干嘛）。等你几小时、几天后带着决策回来，用同一个 `thread_id` 恢复，从那个存档点继续。所以：

::: warning 三条前提，少一条都跑不通
1. **必须配 checkpointer**——没有存档就没有「恢复点」。
2. **恢复要用同一个 `thread_id`**——否则找不到当初那个暂停现场。
3. **含 `interrupt` 的节点必须幂等**——恢复时该节点会**从头重跑**，`interrupt()` 这次才返回你传进来的决策值。别把「发请求」写在 `interrupt()` 之前，否则会被执行两遍。
:::

## 最小闭环：审批一笔转账

```python
from langgraph.types import interrupt, Command

def execute_transfer(state):
    # 1) 暂停：把要人看的信息抛出去
    decision = interrupt({
        "question": "确认要执行这笔转账吗？",
        "amount": state["amount"],
        "to": state["payee"],
    })
    # ↑ 上面这行在第一次运行时会「中断退出」；
    #   恢复运行时，decision = 你 resume 传进来的值

    # 2) 根据决策分流
    if decision["action"] == "approve":
        do_transfer(state)
        return {"status": "done"}
    elif decision["action"] == "edit":
        state["amount"] = decision["new_amount"]
        do_transfer(state)
        return {"status": "done_after_edit"}
    return {"status": "rejected"}
```

调用与恢复的编排：

```python
config = {"configurable": {"thread_id": "tx-001"}}

# 第一次 invoke：跑完 execute_transfer 到 interrupt 处就停了
graph.invoke({"amount": 50000, "payee": "某供应商"}, config)

# 读取「图现在卡在哪个暂停点、抛出了什么给人类」
snapshot = graph.get_state(config)
pending = snapshot.tasks[0].interrupts[0].value
print(pending)   # {'question': '确认要执行这笔转账吗？', 'amount': 50000, ...}

# 人类在前端点了一下「批准」——把决策 resume 回去，图从暂停处继续
graph.invoke(Command(resume={"action": "approve"}), config)
```

## 完整心智：暂停—决策—分流

<GraphFlow
  :steps="[
    { n: '01', title: '跑到 interrupt', desc: '当前状态被 checkpoint 存下，退出', tone: 'coral' },
    { n: '02', title: '外部拿到 payload', desc: '前端弹出：请审批这笔操作', tone: 'blue' },
    { n: '03', title: '人类做决策', desc: '批准 / 编辑参数 / 拒绝', tone: 'teal' },
    { n: '04', title: 'Command(resume)', desc: '节点从头重跑，interrupt 返回决策', tone: 'blue' },
    { n: '05', title: '按决策分流', desc: '放行执行 或 直接 END', tone: 'lime' }
  ]"
  tags="['interrupt()', 'Command(resume=...)', 'needs checkpointer', 'idempotent node']"
/>

## 三种常见审批形态

| 形态 | 怎么做 | 适用 |
| --- | --- | --- |
| **批准 / 拒绝** | resume 一个 `{action: approve/reject}`，节点里分流 | 大多数高危操作 |
| **编辑后再执行** | resume 带上新参数，节点用新值执行 | 改金额、改收件人、改措辞 |
| **多步连续审批** | 在多个节点各设一个 `interrupt` | 复杂流程的关键卡点串联 |

## 高层选手：不想手搓就用 Middleware

如果你用的是 LangChain 的 `create_agent`，其实不必手写 `interrupt`——[内置的 HumanInTheLoopMiddleware](/langchain/middleware) 已经帮你把「指定工具调用前自动暂停等审批」封装好了：

```python
from langchain.agents import create_agent
from langchain.agents.middleware import HumanInTheLoopMiddleware

agent = create_agent(
    model="openai:gpt-4o-mini",
    tools=[get_weather, transfer_money],
    checkpointer=InMemorySaver(),
    middleware=[HumanInTheLoopMiddleware(interrupt_on={"transfer_money": True})],
)
```

底层机制完全一样——中间件内部就是在工具执行前插了一个 `interrupt`，再用 `Command(resume)` 恢复。**理解了本章的 `interrupt`，你既懂高层黑盒、也能在 LangGraph 里手搓自定义审批流。**

---

- 暂停/恢复都会了，来学「边跑边看进度」→ [流式输出（Streaming）](/langgraph/streaming)
- 想把审批做成完整可上线的工作流 → [带人工审批的工作流](/recipes/approval-workflow)
