---
layout: home

hero:
  name: LangGraph & LangChain
  text: 写给普通程序员的 Agent 开发落地手册
  tagline: 不背八股、不玄学。一次讲透 LangChain 与 LangGraph 到底有什么区别、分别适合什么场景，再以 LangGraph 为主，从心智模型到能跑的代码，把「学了就能上手」这件事做到底。
  actions:
    - theme: brand
      text: 开始阅读
      link: /guide/why
    - theme: alt
      text: 跑通第一个 Agent
      link: /langchain/create-agent
    - theme: alt
      text: GitHub
      link: https://github.com/yuxinrun/langchain-langgraph
---

<div class="mp-wrap">

<section class="mp-section" style="border-top:0;padding-top:20px">

<div class="mp-eyebrow">LangGraph 实战手册 · Agent 工程</div>

## 一句话：Agent 不是「更长的提示词」，而是「一个会自己拐弯的程序」

<p class="mp-lead">会写 for 循环、懂状态管理、知道什么叫副作用回滚的你，转型做 Agent 开发其实只差一层窗户纸。LangChain 帮你把这层窗户纸捅破，LangGraph 则把整面墙拆了——因为它们俩要解决的，从来不是「怎么问 AI」，而是「怎么让 AI 稳定、可控、可恢复地替你把活干完」。</p>

<div class="mp-stats">
  <div class="mp-stat"><strong>2</strong><span>个框架 · 一次讲透区别</span></div>
  <div class="mp-stat"><strong>11</strong><span>篇 LangGraph 深入实战</span></div>
  <div class="mp-stat"><strong>1.0</strong><span>对齐 2025-10 正式发布</span></div>
  <div class="mp-stat"><strong>0</strong><span>玄学 · 全是能跑的代码</span></div>
</div>

<div class="mp-tags">
  <span>LangChain 1.0</span><span>LangGraph 1.0</span><span>create_agent</span><span>StateGraph</span><span>Checkpointer</span><span>Human-in-the-loop</span><span>Streaming</span><span>Multi-Agent</span>
</div>

</section>

<section class="mp-section">

<div class="mp-eyebrow">Quickstart · 5 分钟</div>

## 先跑通，再理解

<p class="mp-lead">别急着啃架构图。先起一个能对话、会自己调工具的 Agent，看着它跑起来，理解会顺很多。下面左边是心智路线，右边是能直接抄的代码。</p>

<div class="mp-split">
<div>

<div class="mp-steps">
  <div class="mp-step"><b>01</b><div><strong>装好环境</strong><p>Python 3.10+，一条 <code>pip install langchain langgraph</code> 就位。</p></div></div>
  <div class="mp-step"><b>02</b><div><strong>用 create_agent 起一个 Agent</strong><p>给它一个模型、几个工具，它就自带「想 → 调工具 → 再想」的循环。</p></div></div>
  <div class="mp-step"><b>03</b><div><strong>要精细控制时，下钻到 LangGraph</strong><p>把流程画成节点、边、条件路由，加上持久化与人机协同。</p></div></div>
</div>

<div class="mp-quote">记住这条主线：LangChain 是「自动挡」，先开着上路；LangGraph 是「手动挡」，需要漂移和越野时再切。它们共用同一台发动机。</div>

<a class="mp-go" style="display:inline-block;margin-top:18px;color:var(--accent);font-weight:650" href="./langchain/create-agent.html">看 create_agent 完整跑通 →</a>

</div>
<div>

::: code-group

```python [create_agent · 自动挡]
from langchain.agents import create_agent
from langchain_core.tools import tool

@tool
def get_weather(city: str) -> str:
    """查询指定城市的天气。"""
    return f"{city}：晴，23°C"

agent = create_agent(
    model="openai:gpt-4o-mini",
    tools=[get_weather],
    system_prompt="友好地帮用户查询信息。",
)

agent.invoke({"messages": [{"role": "user", "content": "北京天气怎么样？"}]})
```

```python [StateGraph · 手动挡]
from typing import Annotated
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from typing_extensions import TypedDict

class State(TypedDict):
    messages: Annotated[list, add_messages]

def chatbot(state: State):
    return {"messages": [llm.invoke(state["messages"])]}

graph = (
    StateGraph(State)
    .add_node("chatbot", chatbot)
    .add_edge(START, "chatbot")
    .add_edge("chatbot", END)
    .compile()
)
graph.invoke({"messages": [{"role": "user", "content": "你好"}]})
```

:::

</div>
</div>

</section>

<section class="mp-section">

<div class="mp-eyebrow">Map · 板块地图</div>

## 按「你会问的问题」组织，不按官方文档目录

<p class="mp-lead">每一块都对应一个你迟早会卡住的问题。可以从头顺读，也可以直接跳到当前让你头疼的那一节。</p>

<div class="mp-grid">
  <a class="mp-card" href="./guide/difference.html">
    <span class="mp-num">01</span>
    <h3>到底啥区别</h3>
    <p>LangChain 和 LangGraph 是什么关系？一个是库、一个是运行时，还是竞品？一张图说清。</p>
    <span class="mp-go">建立正确的心智模型</span>
  </a>
  <a class="mp-card tone-coral" href="./guide/which-to-use.html">
    <span class="mp-num">02</span>
    <h3>选型判断</h3>
    <p>什么业务用哪个？给出决策树、评分表和几个「别用 LangGraph」的反例。</p>
    <span class="mp-go">三分钟定技术选型</span>
  </a>
  <a class="mp-card tone-blue" href="./langchain/create-agent.html">
    <span class="mp-num">03</span>
    <h3>LangChain 速通</h3>
    <p>模型、消息、工具三大构件，create_agent 一行起 Agent，Middleware 与结构化输出。</p>
    <span class="mp-go">快速起步做出第一个 Agent</span>
  </a>
  <a class="mp-card" href="./langgraph/mental-model.html">
    <span class="mp-num">04</span>
    <h3>LangGraph 深入</h3>
    <p>State / Node / Edge 世界观、条件路由、Checkpointer、人机协同、流式、多智能体。</p>
    <span class="mp-go">把重点框架彻底吃透</span>
  </a>
  <a class="mp-card tone-lime" href="./recipes/project-structure.html">
    <span class="mp-num">05</span>
    <h3>端到端实战</h3>
    <p>项目骨架、RAG Agent、带人工审批的工作流、可观测与部署——复制即可上线。</p>
    <span class="mp-go">从 demo 走向生产</span>
  </a>
  <a class="mp-card tone-coral" href="./debugging/pitfalls.html">
    <span class="mp-num">06</span>
    <h3>排坑清单</h3>
    <p>死循环、状态不更新、checkpoint 丢上下文、interrupt 恢复姿势不对……按症状定位。</p>
    <span class="mp-go">上线前先看这一页</span>
  </a>
</div>

</section>

<section class="mp-section">

<div class="mp-eyebrow coral">Difference · 关键区别</div>

## 不是谁更强，而是「自动挡」和「手动挡」

<p class="mp-lead">同样是做 Agent，LangChain 让你在标准循环里跑得飞快；LangGraph 让你在复杂、长耗时、要人审批的流程里稳如老狗。下面这张表只记最影响选型的差异。</p>

<FrameworkBars />

<p class="mp-lead" style="margin-top:8px">结论：默认<strong>从 LangChain 的 create_agent 起步</strong>；当流程需要自定义分支、循环、并行、断点恢复或人工介入时，<strong>下钻到 LangGraph</strong>。两者可混用——你可以把 create_agent 生成的 Agent 当作一个节点，塞进更大的 LangGraph 图里。</p>

<a class="mp-go" style="display:inline-block;margin-top:18px;color:var(--accent);font-weight:650" href="./guide/difference.html">读完整的区别与选型 →</a>

</section>

<section class="mp-section">

<div class="mp-eyebrow">Mental Model · LangGraph 世界观</div>

## 把 Agent 想成一张「带状态的流程图」，而不是一串提示词

<p class="mp-lead">这是 LangGraph 全部威力的起点。一旦你脑子里有了「节点读状态、节点改状态、边决定下一步」这套模型，剩下的高级特性（持久化、人机协同、流式、多智能体）都只是在这张图上做加法。</p>

<GraphAnatomy />

<a class="mp-go" style="display:inline-block;margin-top:18px;color:var(--accent);font-weight:650" href="./langgraph/mental-model.html">从心智模型开始系统学习 →</a>

</section>

<section class="mp-section">

<div class="mp-band">
  <div class="mp-eyebrow coral">Same Engine · 同一台发动机</div>
  <h2 class="mp-h2">LangChain 的高层 Agent，本身就跑在 LangGraph 之上</h2>
  <p class="mp-lead">很多人以为要在两者之间「二选一」。真相是：1.0 之后的 <code>create_agent</code> 就是用 LangGraph 运行时来跑那个「模型 ↔ 工具」循环的。你选的不是框架，而是控制的颗粒度。</p>

  <div class="mp-band-grid">
    <div>
      <div class="mp-band-card">
        <h3>先选 LangChain，当……</h3>
        <p>你要快速上线、需求贴合标准 Agent 循环（问答、调工具、给答复）、想要 provider 无关与开箱即用的中间件。</p>
        <a href="./langchain/create-agent.html">看 LangChain 速通 →</a>
      </div>
      <div class="mp-band-card" style="margin-top:14px">
        <h3>下钻 LangGraph，当……</h3>
        <p>流程有确定性步骤 + 智能步骤混编、要长跑与断点恢复、要人在环路里审批、要精细控制延迟与成本。</p>
        <a href="./langgraph/mental-model.html">看 LangGraph 深入 →</a>
      </div>
    </div>
    <div>
      <div class="mp-band-card">
        <h3>它们怎么协同</h3>
        <p>LangChain 负责「构件」：模型抽象、消息、工具、内容块。LangGraph 负责「装配线」：状态、图、调度、持久化。高层用构件，底层用装配线。</p>
        <a href="./guide/difference.html">看关系全景 →</a>
      </div>
      <div class="mp-band-card" style="margin-top:14px">
        <h3>一个常见误解</h3>
        <p>「用了 LangGraph 就不能用 LangChain」——恰恰相反。生产里最常见的形态，就是 LangGraph 的大图里，嵌着几个 create_agent 的小 Agent 当节点。</p>
        <a href="./langgraph/multi-agent.html">看多智能体组合 →</a>
      </div>
    </div>
  </div>
</div>

</section>

<section class="mp-section">

<div class="mp-eyebrow">Timeline · 为什么是现在</div>

## 从「提示词胶水库」到「durable agent 运行时」

<p class="mp-lead">三年时间，这条技术线从「帮你想提示词」进化成「帮你把长任务稳稳跑完」。搞懂演进脉络，你就知道该把精力压在哪个特性上。</p>

<VersionTimeline />

<a class="mp-go" style="display:inline-block;margin-top:18px;color:var(--accent);font-weight:650" href="./guide/why.html">看「为什么要用 Agent 框架」→</a>

</section>

<section class="mp-section">

<div class="mp-eyebrow">Field notes · 避坑</div>

## 新手最常翻车的 6 件事

<p class="mp-lead">这些坑和「AI 玄不玄学」无关，和工程习惯有关。每一条在后面的章节里都能找到解法。</p>

<div class="mp-grid">
  <div class="mp-card tone-coral"><span class="mp-num">A</span><h3>不加循环上限</h3><p>Agent 自己调工具再调自己，一不小心就是死循环。用 <code>recursion_limit</code> 和明确的终止条件收口。</p><span class="mp-go">终止与上限</span></div>
  <div class="mp-card tone-coral"><span class="mp-num">B</span><h3>节点返回整块覆盖状态</h3><p>忘记用 reducer，把 messages 直接覆盖掉，历史没了。状态更新规则要在 schema 里声明。</p><span class="mp-go">状态与 Reducer</span></div>
  <div class="mp-card tone-coral"><span class="mp-num">C</span><h3>不配 Checkpointer 就谈记忆</h3><p>想持久化却忘了传 checkpointer，interrupt 也恢复不了。持久化是显式装配出来的。</p><span class="mp-go">持久化</span></div>
  <div class="mp-card tone-coral"><span class="mp-num">D</span><h3>把工具描述写得太随意</h3><p>模型全靠工具名和 docstring 决定用不用。描述含糊，工具就永远轮不到出场。</p><span class="mp-go">工具设计</span></div>
  <div class="mp-card tone-coral"><span class="mp-num">E</span><h3>一次只测 happy path</h3><p>超时、工具报错、空结果、并发用户，才是真实世界。图的价值恰恰在这些分支上。</p><span class="mp-go">测试矩阵</span></div>
  <div class="mp-card tone-coral"><span class="mp-num">F</span><h3>上线前不看 trace</h3><p>Agent 说「失败了」，你只有一句报错。接 LangSmith，让每一步决策都能回放。</p><span class="mp-go">可观测</span></div>
</div>

</section>

<section class="mp-section">

<div class="mp-eyebrow">Resources · 官方与关联</div>

## 权威来源在这里，本站只做「翻译成人话」

<p class="mp-lead">本站内容对齐官方 1.0 文档，但框架迭代很快。真正下判断前，请以官方文档和你自己的实测为准——这也是工程纪律。</p>

<div class="mp-friend">
  <a class="mp-friend-card" href="https://docs.langchain.com/" target="_blank" rel="noopener">
    <span>docs.langchain.com</span>
    <strong>LangChain / LangGraph 官方文档</strong>
    <p>1.0 之后 Python 与 JS、LangChain 与 LangGraph 全部统一到这一个站点，含平行示例、概念指南与 API 参考。</p>
    <em>去读官方原文 →</em>
  </a>
  <a class="mp-friend-card" href="https://github.com/yuxinrun/mcp-patterns" target="_blank" rel="noopener">
    <span>github.com/yuxinrun/mcp-patterns</span>
    <strong>姊妹站：MCP Patterns</strong>
    <p>Agent 要调的「工具」怎么标准化接进来？MCP 工程手册。与本手册配套：一个讲 Agent 怎么编排，一个讲能力怎么接入。</p>
    <em>去看 MCP 手册 →</em>
  </a>
</div>

<div class="mp-quote">建议阅读顺序：先在本站把 LangGraph 的心智模型和核心特性吃透，再回到官方文档查你正在用的具体 API，最后用排坑清单做一次上线自检。</div>

</section>

</div>
