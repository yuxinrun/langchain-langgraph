---
title: RAG Agent 实战
description: 用 LangGraph 搭一个会自检、会改写问题、能并行检索的 Agentic RAG——从 retrieve→grade→rewrite 闭环到 Send 扇出的完整落地。
---

# RAG Agent 实战

「检索 → 塞进 prompt → 让模型答」是最朴素的 RAG，但它**不会反思**：检索回来的东西不相关，它也照答不误，于是开始一本正经地胡说。这一篇用 LangGraph 把它升级成 **Agentic RAG**——**会判断检索质量、会改写问题重来、会并行多路检索**的闭环（见 [LangChain RAG 文档](https://docs.langchain.com/oss/python/langchain/overview)）。

> **核心思路**：把 RAG 画成一张**带反馈循环的图**，而不是流水线。检索完先「打分」，分数不够就回去「改写问题重搜」，够了才「生成答案」。循环靠条件边，并行靠 `Send`。

## 图长这样

<GraphFlow
  :steps="[
    { n: 'Q', title: 'rewrite', desc: '改写/拆解用户问题', tone: 'blue' },
    { n: 'R', title: 'retrieve', desc: '向量检索召回文档', tone: 'teal' },
    { n: 'G', title: 'grade', desc: '给每篇文档相关性打分', tone: 'coral' },
    { n: '?', title: '够了吗？', desc: '不够→回 rewrite；够→生成', tone: 'lime' },
    { n: 'A', title: 'generate', desc: '基于合格文档生成答案', tone: 'teal' }
  ]"
  tags="['agentic rag', 'grade loop', 'query rewrite', 'Send fan-out', 'self-check']"
/>

关键那条 **grade → (不够) rewrite** 的回边，就是「会反思」的全部秘密——它把一次性流水线变成了收敛循环。

## 一、状态定义

```python
from typing import Annotated, TypedDict
import operator
from langgraph.graph.message import add_messages

class RagState(TypedDict):
    question: str                        # 当前要检索的问题（可能被改写）
    documents: Annotated[list, operator.add]   # 并行检索结果，add 合并
    graded: list                         # 通过相关性检查的文档
    retries: int                         # 改写重试次数，当循环刹车
    answer: str | None
```

## 二、检索节点

```python
def retrieve(state) -> dict:
    docs = vector_store.similarity_search(state["question"], k=6)
    return {"documents": docs}
```

## 三、打分节点：用结构化输出，别让模型自由发挥

判断相关性**必须用结构化输出**约束成 `{binary_score: "yes"/"no"}`，否则你没法在路由函数里做 if 判断（回顾 [Middleware 与结构化输出](/langchain/middleware)）：

```python
from pydantic import BaseModel

class Grade(BaseModel):
    binary_score: str   # "yes" 表示相关，"no" 表示不相关

grader = model.with_structured_output(Grade)

def grade_docs(state) -> dict:
    passed = []
    for doc in state["documents"]:
        g = grader.invoke(
            f"文档能否回答这个问题？\n问题：{state['question']}\n文档：{doc.page_content}"
        )
        if g.binary_score.lower() == "yes":
            passed.append(doc)
    return {"graded": passed}
```

## 四、路由：够了就生成，不够就改写重来

条件边决定循环去向，`retries` 兜底防止无限打转（回顾 [路由的循环刹车](/langgraph/routing)）：

```python
def decide(state) -> str:
    if state["graded"]:
        return "generate"                 # 有合格文档，去生成
    if state["retries"] >= 2:
        return "generate"                 # 兜底：改两次还不行，用现有材料硬答
    return "rewrite"                      # 否则改写问题再搜

builder.add_conditional_edges("grade", decide, {
    "generate": "generate",
    "rewrite": "rewrite",
})
```

`rewrite` 节点里让模型把问题换个说法 / 拆成子问题，并把 `retries += 1`，然后 `add_edge("rewrite", "retrieve")` 回到检索——闭环成型。

## 五、进阶：用 Send 做多查询并行检索

想让模型把复杂问题拆成 3 个子问题**并行**检索，再汇总评分？这就是 `Send` 的舞台——运行时动态派发 N 个检索分支，结果用 reducer 合并（回顾 [Send 动态并行](/langgraph/routing)）：

```python
from langgraph.types import Send

def split_and_dispatch(state):
    subs = planner.invoke(state["question"])   # 结构化成 3 个子问题
    # 每个子问题起一个独立的 retrieve 分支，并行跑
    return [Send("retrieve", {"question": q, "documents": []}) for q in subs]

builder.add_conditional_edges("plan", split_and_dispatch)
builder.add_edge("retrieve", "grade")          # 等所有分支回来再统一打分
```

## 六、生成节点：只喂合格文档 + 强制引用

```python
def generate(state) -> dict:
    context = "\n\n".join(d.page_content for d in state["graded"])
    msg = model.invoke(
        f"仅根据以下资料回答，资料里没有就直说不知道，并标注引用来源。\n"
        f"问题：{state['question']}\n资料：\n{context}"
    )
    return {"answer": msg.content, "messages": [msg]}
```

## 落地建议

- **打分/改写用便宜模型**：`gpt-4o-mini` 这类足够，别每一步都请最贵的模型，RAG 循环里调用量很大。
- **给循环设死上限**：`retries` 到顶必须收口，否则「搜不到 → 改写 → 还是搜不到」会烧穿预算。
- **检索和生成解耦**：检索器换成 BM25、混合检索、还是向量库，都不该影响图结构——只是 `retrieve` 节点内部实现变了。
- **可观测优先**：把 grade 的通过/淘汰数用 `custom` 流式吐出来，你能一眼看到「到底召回了几篇有用的」（回顾 [流式输出](/langgraph/streaming)）。

---

- 想看这套图怎么装进工程 → [端到端项目骨架](/recipes/project-structure)
- 想给关键动作加人工审批 → [带人工审批的工作流](/recipes/approval-workflow)
- RAG 概念与构件基础 → [核心构件：模型 · 消息 · 工具](/langchain/building-blocks)
