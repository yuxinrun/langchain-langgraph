# LangGraph & LangChain 实战手册

> 鱼心快跑，Bug 追不上。

一份写给**普通程序员转型做 Agent 开发**的中文教程站。目标是把 LangChain 与 LangGraph 一次讲透：

- 两者到底是什么关系、有什么区别、各自适合什么业务场景；
- 以 **LangGraph 为重点**（当前生产开发用得最多），从心智模型到落地实战；
- 语言轻松、通俗，图表丰富，代码可复制，学完就能上手。

## 本地开发

```bash
npm install          # 安装依赖（Node 18+，建议 20/22）
npm run dev          # 启动本地预览，默认 http://localhost:5173
```

## 构建与预览

```bash
npm run build        # 产出静态站点到 docs/.vitepress/dist
npm run preview      # 本地预览构建产物
```

## 部署

GitHub Pages 部署见 `.github/workflows/deploy.yml`。子路径部署时通过环境变量 `BASE=/langchain-langgraph/` 注入。

## 目录结构

```
docs/
├── .vitepress/
│   ├── config.mts              # 站点配置：导航 / 侧栏 / 搜索 / 页脚
│   └── theme/
│       ├── style.css           # 品牌设计系统（单一真相源，见 BRAND.md）
│       ├── index.ts            # 主题入口与全局组件注册
│       └── components/         # 图表 Vue 组件
├── guide/                      # 开始 · 心智 · 选型
├── langchain/                  # LangChain 速通
├── langgraph/                  # LangGraph 深入（重点）
├── recipes/                    # 端到端实战
├── debugging/                  # 排坑清单
├── public/                     # 品牌资产
├── index.md                    # 首页
└── about.md                    # 关于本站
```

## 内容来源与时效

本站基于 LangChain / LangGraph **1.0**（2025-10-22 发布）撰写，所有事实与代码尽量对齐 [官方文档 docs.langchain.com](https://docs.langchain.com/)。两个框架迭代很快，示例以官方最新文档与你自己的测试为准。

---

如果这份手册帮你少踩了一个坑，欢迎点个 Star，或者把踩坑经历写成 PR。
