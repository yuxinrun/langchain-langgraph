---
title: 带人工审批的工作流
description: 把 interrupt/resume、checkpointer 与条件路由组装成一条真实审批流——草稿生成、人工审核、编辑或驳回重做、危险动作放行到上线的完整落地。
---

# 带人工审批的工作流

这一篇把前三块能力**拧成一根绳**：用 [持久化](/langgraph/persistence) 存档、用 [人机协同](/langgraph/human-in-the-loop) 的 `interrupt` 卡点、用 [路由](/langgraph/routing) 分流，做一个能上线的「**AI 起草 → 人工审核 → 放行/驳回 → 执行**」工作流。这是企业级 Agent 最常见的形态——**没有一个正经系统会让 AI 未经人点头就直接发钱、发文、上生产。**

> **场景设定**：一个「对外公告生成 Agent」。流程是：起草 → **暂停等审核** → 审核人可「批准 / 编辑后批准 / 驳回重做」→ 批准后才走发布。**发布**这一步单独再设一道卡点，因为它不可逆。

## 全流程图

<GraphFlow
  :steps="[
    { n: '1', title: 'draft', desc: 'AI 起草公告文案', tone: 'teal' },
    { n: '2', title: 'review (interrupt)', desc: '暂停，把草稿抛给人类', tone: 'coral' },
    { n: '3', title: '决策分流', desc: 'approve / edit / reject', tone: 'blue' },
    { n: '4', title: 'revise', desc: '驳回则按反馈重写，回到审核', tone: 'lime' },
    { n: '5', title: 'publish (interrupt)', desc: '发布前再卡一道，然后 END', tone: 'coral' }
  ]"
  tags="['human-in-the-loop', 'checkpoint', 'routing', 'idempotent', 'multi-gate']"
/>

## 一、状态与两道卡点

```python
from typing import Annotated, TypedDict
from langgraph.graph.message import add_messages
from langgraph.types import interrupt, Command
from langgraph.graph import StateGraph, START, END

class ApprovalState(TypedDict):
    messages: Annotated[list, add_messages]
    draft: str
    feedback: str          # 审核人的修改意见
    approved: bool

def draft_node(state):
    msg = model.invoke("为一场地震写一条官方安全公告，简洁专业。")
    return {"draft": msg.content, "messages": [msg]}
```

**第一道卡点：审核草稿。** 注意 `interrupt` 之前的代码要幂等——恢复时该节点从头重跑：

```python
def review_node(state):
    decision = interrupt({
        "type": "review_draft",
        "draft": state["draft"],
        "options": ["approve", "edit", "reject"],
    })
    # decision 由外部 Command(resume=...) 注入
    if decision["action"] == "approve":
        return {"approved": True}
    if decision["action"] == "edit":
        return {"draft": decision["new_draft"], "approved": True}
    # reject：记下反馈，回到起草重做
    return {"feedback": decision["comment"], "approved": False}
```

## 二、用条件边把「驳回重做」连成循环

`review` 之后去哪，取决于批没批。没批就回 `draft` 重写，形成一个「**不打回原形不罢休**」的循环，并带次数刹车：

```python
def route_after_review(state) -> str:
    return "publish" if state["approved"] else "draft"

builder.add_conditional_edges("review", route_after_review, {
    "publish": "publish",
    "draft": "draft",
})
builder.add_edge("draft", "review")
builder.add_edge("publish", END)
```

## 三、第二道卡点：不可逆动作放行

发布是「做了就收不回」的操作，值得**单独**再来一次 `interrupt`：

```python
def publish_node(state):
    go = interrupt({
        "type": "final_gate",
        "question": "公告不可撤回，确认发布？",
        "draft": state["draft"],
    })
    if go["action"] == "approve":
        do_publish(state["draft"])       # 真正对外发布
        return {"messages": [system("已发布")]}
    return {"messages": [system("已取消发布")]}
```

::: warning 两个 interrupt，两段暂停，各自独立存档
同一个 `thread` 里，跑到第一个 `interrupt` 就停、等第一次 resume；恢复后继续跑到第二个 `interrupt` 又停、等第二次 resume。**每一次暂停都是一个 checkpoint**，进程可以完全退出再回来——这正是 [持久化](/langgraph/persistence) 给你的超能力。
:::

## 四、外部编排：审核台怎么驱动它

后端把「暂停现场」读出来给前端渲染按钮，人类点了再把决策 resume 回去：

```python
config = {"configurable": {"thread_id": "announce-2026-11"}}

# 1) 起草并停在第一个卡点
graph.invoke({"messages": []}, config)

snap = graph.get_state(config)
gate = snap.tasks[0].interrupts[0].value        # {'type': 'review_draft', 'draft': ...}
# → 前端根据 gate['type'] 渲染「批准/编辑/驳回」界面

# 2) 审核人驳回并写了意见 → resume，图回到 draft 重写，再停到新卡点
graph.invoke(Command(resume={"action": "reject", "comment": "语气太轻松，改严肃"}), config)

# 3) 再次审核通过 → resume
graph.invoke(Command(resume={"action": "approve"}), config)

# 4) 走到发布卡点 → 最终确认
graph.invoke(Command(resume={"action": "approve"}), config)
```

## 五、也可以偷懒：用 Middleware

如果你的 Agent 是 `create_agent` 造的，不必手写两道 `interrupt`——[HumanInTheLoopMiddleware](/langchain/middleware) 能让你**声明式**地指定「哪些工具调用前必须停下来等批」：

```python
from langchain.agents.middleware import HumanInTheLoopMiddleware

agent = create_agent(
    model="openai:gpt-4o-mini",
    tools=[draft_announcement, publish_announcement],
    checkpointer=PostgresSaver.from_conn_string(DSN),
    middleware=[HumanInTheLoopMiddleware(
        interrupt_on={"publish_announcement": True}   # 只有发布需要人批
    )],
)
```

**手写 `interrupt` 给你完全的自由（多道卡点、自定义决策分流），Middleware 给你速度（声明式给工具加审批）。** 理解了本章，两种你都能随手切换。

## 落地建议

- **暂停要能持久**：生产一定用 `PostgresSaver` 而非 `InMemorySaver`——审批可能几小时后才有人处理，进程不能一直挂着。
- **卡点前别放副作用**：`interrupt` 所在节点恢复时会从头重跑，把「真正发布/扣款」的调用放在 `interrupt` **返回之后**，且本身幂等（用唯一操作 ID 去重）。
- **把 payload 设计成前端契约**：`interrupt({...})` 里带上 `type`、可选项、需要展示的数据，前端就能一套组件渲染多种卡点。
- **超时兜底**：给「人类迟迟不批」设策略——定时任务扫描停在半路的 thread，提醒或直接走安全默认（如取消）。

---

- 审批现场为何能存能恢复 → [持久化与记忆（Checkpointer）](/langgraph/persistence)
- interrupt/resume 机制细讲 → [人机协同（Human-in-the-loop）](/langgraph/human-in-the-loop)
- 把这条流程装进可上线工程 → [端到端项目骨架](/recipes/project-structure)
