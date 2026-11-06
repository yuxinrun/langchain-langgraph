---
title: 关于本站
description: LangGraph & LangChain 实战手册的定位、为什么而做、内容原则、技术栈与贡献方式。
---

# 关于本站

**LangGraph & LangChain 实战手册** 是一份写给**普通程序员转型做 Agent 开发**的中文工程手册。它不追求把两个框架的每个 API 抄一遍，而是回答一个问题：

> **怎么真正用 LangGraph（和 LangChain）做出一个能上线、能排障、能长期维护的 Agent？**

<BrandMark variant="card" />

## 为什么做这个站

2025 年 10 月，LangChain 与 LangGraph 同时迈入 **1.0**——文档更全了，但也更让人犯迷糊：官方资料偏「参考手册」，教程要么停在 hello world，要么是论文式架构。**中间那段「我是写业务代码的人，该怎么上手、怎么避坑、怎么落地」的台阶，一直是缺的。**

本站就是来补这段台阶的，重点解决：

- LangChain 和 LangGraph 到底什么关系，我到底该用哪个？
- 为什么生产开发里 LangGraph 用得更多？它强在哪？
- 状态、路由、持久化、人机协同、多智能体这些概念，怎么落到能跑的代码？
- 一个真实 Agent 项目该怎么组织目录、怎么接 FastAPI、怎么加可观测、怎么上线？
- 上线前，最容易踩的坑有哪些？

这些问题分散在官方博客、SDK 源码、各家文档和无数踩坑帖里。本站把它们整理成**通俗的讲解 + 能跑的代码 + 照着能查的清单**，并在关键处**注明来源与官方超链接**。

## 内容原则

1. **讲透关系**：先让你彻底搞懂 LangChain 与 LangGraph 的区别与分工，再谈怎么写代码。
2. **LangGraph 为主**：因为当下生产开发更多用 LangGraph，深入章节几乎都围着它转。
3. **代码优先**：能跑的代码比架构图更有说服力；示例力求复制即可运行。
4. **落地导向**：每章都带「实战建议」，并有专门篇章讲项目结构、部署、排坑。
5. **有据可查**：观点与事实尽量附官方文档 / 博客链接，方便你顺藤摸到一手资料。
6. **不端架子**：语言尽量轻松幽默，把概念用人话讲清楚，而不是堆术语。

## 技术栈

- [VitePress](https://vitepress.dev/)：静态站点与本地搜索。
- Markdown + Vue 组件：自绘的图表与交互式流程说明。
- Python 示例：LangChain / LangGraph 1.0，均可本地运行。
- GitHub Pages：静态部署，无后端依赖。

设计语言沿用「鱼心快跑」品牌体系与姊妹站保持一致：暖白 / 深海墨绿的底色，teal / coral 强调色，Manrope + JetBrains Mono 字体，「工程蓝图」式的点阵与连线母题，支持浅色 / 深色模式。

## 延伸阅读与出处

本站事实主要参考以下一手资料（各页内亦就近附链接）：

- LangChain / LangGraph 官方文档：[docs.langchain.com](https://docs.langchain.com/)
- 1.0 发布公告：[LangChain & LangGraph 1.0](https://www.langchain.com/blog/langchain-langgraph-1dot0)
- LangGraph 源码仓库：[github.com/langchain-ai/langgraph](https://github.com/langchain-ai/langgraph)
- 可观测与部署：[LangSmith](https://smith.langchain.com/)

## 贡献

欢迎提交 Issue 与 PR：

- 发现事实错误、API 过时：直接开 Issue，附上版本与复现步骤。
- 新增实战案例：优先「真实场景 + 最小可跑代码 + 避坑提示」的结构。
- 图表组件：在 `docs/.vitepress/theme/components/`，遵循品牌设计系统。

写作约定：

- 代码块标注语言，声称「能跑」的要实际跑过。
- 涉及不确定的 API 签名，以官方文档为准并明确标注，绝不编造。
- 关键事实注明来源与超链接。

## 免责声明

本站内容基于公开资料与本地实测，尽量保证准确，但不构成任何形式的生产环境保证。框架与文档迭代很快，上线前请以官方文档和你自己的测试为准。

## 联系

- GitHub：[yuxinrun/langchain-langgraph](https://github.com/yuxinrun/langchain-langgraph)
- 姊妹站：[MCP Patterns](https://github.com/yuxinrun/mcp-patterns)（能力怎么接进 Agent：协议、传输、鉴权、调试）

---

如果这个站帮你少踩了一个坑、或终于搞懂了 LangChain 和 LangGraph 的区别，欢迎点个 Star，或者把你的踩坑经历写成 PR。
