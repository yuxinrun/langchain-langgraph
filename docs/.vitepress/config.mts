import { defineConfig } from 'vitepress'

const repo = 'https://github.com/yuxinrun/langchain-langgraph'
const officialDocs = 'https://docs.langchain.com/'
const sisterMcp = 'https://github.com/yuxinrun/mcp-patterns'
const base = process.env.BASE ?? '/'

const zhSidebar = [
  {
    text: '开始',
    collapsed: false,
    items: [
      { text: '为什么需要 Agent 框架', link: '/guide/why' },
      { text: 'LangChain vs LangGraph', link: '/guide/difference' },
      { text: '选型：什么场景用哪个', link: '/guide/which-to-use' }
    ]
  },
  {
    text: 'LangChain 速通',
    collapsed: false,
    items: [
      { text: '核心构件：模型 · 消息 · 工具', link: '/langchain/building-blocks' },
      { text: 'create_agent：跑通第一个 Agent', link: '/langchain/create-agent' },
      { text: 'Middleware 与结构化输出', link: '/langchain/middleware' }
    ]
  },
  {
    text: 'LangGraph 深入',
    collapsed: false,
    items: [
      { text: '心智模型：State · Node · Edge', link: '/langgraph/mental-model' },
      { text: 'StateGraph 上手：第一个图', link: '/langgraph/quickstart' },
      { text: '状态与 Reducer', link: '/langgraph/state-reducer' },
      { text: '路由：条件边 · Command · Send', link: '/langgraph/routing' },
      { text: '持久化与记忆（Checkpointer）', link: '/langgraph/persistence' },
      { text: '人机协同（Human-in-the-loop）', link: '/langgraph/human-in-the-loop' },
      { text: '流式输出（Streaming）', link: '/langgraph/streaming' },
      { text: '多智能体与子图', link: '/langgraph/multi-agent' }
    ]
  },
  {
    text: '实战',
    collapsed: false,
    items: [
      { text: '端到端项目骨架', link: '/recipes/project-structure' },
      { text: 'RAG Agent 实战', link: '/recipes/rag-agent' },
      { text: '带人工审批的工作流', link: '/recipes/approval-workflow' },
      { text: '可观测与部署', link: '/recipes/observability-deploy' }
    ]
  },
  {
    text: '排坑',
    collapsed: false,
    items: [{ text: '常见坑与排查清单', link: '/debugging/pitfalls' }]
  },
  {
    text: '关于',
    collapsed: false,
    items: [{ text: '关于本站', link: '/about' }]
  }
]

const zhNav = [
  { text: '开始', link: '/guide/why', activeMatch: '/guide/' },
  { text: 'LangChain', link: '/langchain/building-blocks', activeMatch: '/langchain/' },
  { text: 'LangGraph', link: '/langgraph/mental-model', activeMatch: '/langgraph/' },
  { text: '实战', link: '/recipes/project-structure', activeMatch: '/recipes/' },
  {
    text: '更多',
    items: [
      { text: '排坑清单', link: '/debugging/pitfalls' },
      { text: '关于本站', link: '/about' },
      { text: '官方文档 ↗', link: officialDocs, target: '_blank', rel: 'noopener' },
      { text: '姊妹站：MCP Patterns ↗', link: sisterMcp, target: '_blank', rel: 'noopener' }
    ]
  }
]

export default defineConfig({
  title: 'LangGraph & LangChain 实战',
  titleTemplate: ':title | LangGraph 实战手册',
  description:
    '写给普通程序员的 LangGraph 与 LangChain 中文实战教程：讲清两者区别与选型，以 LangGraph 为核心，从心智模型、状态、路由、持久化、人机协同到端到端落地。',
  base,
  lang: 'zh-CN',
  appearance: true,
  lastUpdated: true,
  metaChunk: true,
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg` }],
    ['meta', { name: 'theme-color', content: '#f6f4ee', media: '(prefers-color-scheme: light)' }],
    ['meta', { name: 'theme-color', content: '#06100e', media: '(prefers-color-scheme: dark)' }],
    ['meta', { name: 'author', content: '鱼心快跑' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'LangGraph & LangChain 实战手册｜写给转型做 Agent 的普通程序员' }],
    [
      'meta',
      {
        property: 'og:description',
        content:
          '一次讲透 LangChain 与 LangGraph：区别、选型、心智模型、状态与路由、持久化、人机协同、多智能体，以及能直接跑的落地实战。'
      }
    ],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }]
  ],
  markdown: {
    theme: { light: 'github-dark', dark: 'github-dark' },
    lineNumbers: false,
    image: { lazyLoading: true }
  },
  themeConfig: {
    logo: { light: '/logo.svg', dark: '/logo-dark.svg' },
    siteTitle: 'LangGraph 实战',
    nav: zhNav,
    sidebar: zhSidebar,
    outline: { level: [2, 3], label: '本页目录' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    lastUpdated: { text: '最后更新于', formatOptions: { dateStyle: 'short', timeStyle: 'short' } },
    editLink: { pattern: `${repo}/edit/main/docs/:path`, text: '在 GitHub 上编辑此页' },
    socialLinks: [{ icon: 'github', link: repo }],
    footer: {
      message: `<span class="mp-footer-brand"><img src="${base}yuxin-run.png" alt="鱼心快跑" width="546" height="363" /><span>鱼心快跑，Bug 追不上</span></span>`,
      copyright: '© 2026 鱼心快跑 · LangGraph & LangChain 实战手册'
    },
    search: {
      provider: 'local',
      options: {
        detailedView: true,
        translations: {
          button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
          modal: {
            displayDetails: '显示详情',
            resetButtonTitle: '清除查询',
            backButtonTitle: '返回',
            noResultsText: '没有找到结果',
            footer: {
              selectText: '选择',
              selectKeyAriaLabel: '回车',
              navigateText: '切换',
              navigateUpKeyAriaLabel: '上箭头',
              navigateDownKeyAriaLabel: '下箭头',
              closeText: '关闭',
              closeKeyAriaLabel: 'Esc'
            }
          }
        }
      }
    },
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    langMenuLabel: '切换语言',
    notFound: {
      title: '页面不存在',
      quote: '这张图里没有匹配的节点。回到首页，从 START 重新出发。',
      linkText: '返回首页'
    }
  }
})
