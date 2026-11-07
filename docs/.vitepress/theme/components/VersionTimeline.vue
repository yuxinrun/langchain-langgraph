<script setup lang="ts">
const milestones = [
  { date: '2022-10', title: 'LangChain 诞生', desc: '把「调 LLM + 拼提示 + 接工具」标准化，一个库引爆整个 LLM 应用生态。' },
  { date: '2023', title: '链式与生态爆发', desc: 'LCEL、海量集成、Chain 范式。快是真快，但复杂控制流开始力不从心。' },
  { date: '2024-01', title: 'LangGraph 发布', desc: '换思路：把 Agent 建模成「带状态的图」，专治循环、持久化与不可靠。' },
  { date: '2024–25', title: '生产验证', desc: 'Uber、LinkedIn、Klarna、JP Morgan 等把它跑在生产，durable agent 成为刚需。' },
  { date: '2025-10', title: '双双 1.0', desc: 'LangChain 1.0 + LangGraph 1.0 同日发布：create_agent 跑在 LangGraph 运行时上，2.0 前不做破坏性变更。' }
]
</script>

<template>
  <div class="vt">
    <div class="vt-track">
      <div
        v-for="(m, i) in milestones"
        :key="m.date"
        class="vt-item"
        :class="{ latest: i === milestones.length - 1 }"
      >
        <span class="vt-date">{{ m.date }}</span>
        <span class="vt-dot"><i></i></span>
        <strong>{{ m.title }}</strong>
        <p>{{ m.desc }}</p>
      </div>
    </div>
    <p class="vt-note">
      时间线聚焦「架构范式」的演进，不是精确的 SDK 版本号发布日。接入前请核对
      <a href="https://docs.langchain.com/" target="_blank" rel="noopener">官方文档</a>与你实际安装的版本。
    </p>
  </div>
</template>

<style scoped>
.vt {
  margin: 28px 0;
  padding: 26px 24px 20px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--panel);
  overflow-x: auto;
}

.vt-track {
  position: relative;
  display: grid;
  grid-template-columns: repeat(5, minmax(150px, 1fr));
  gap: 18px;
  min-width: 820px;
  padding-top: 4px;
}

.vt-track::before {
  content: '';
  position: absolute;
  left: 8px;
  right: 8px;
  top: 37px;
  border-top: 1px dashed var(--line-strong);
}

.vt-item {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding-right: 8px;
}

.vt-date {
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 9.5px;
  letter-spacing: 0.06em;
}

.vt-dot {
  display: flex;
  align-items: center;
  width: 12px;
  height: 12px;
  margin: 4px 0 3px;
  border: 1px solid var(--line-strong);
  border-radius: 50%;
  background: var(--panel);
}

.vt-dot i {
  width: 4px;
  height: 4px;
  margin-inline: auto;
  border-radius: 50%;
  background: var(--faint);
}

.vt-item.latest .vt-dot {
  border-color: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-soft);
}

.vt-item.latest .vt-dot i {
  background: var(--accent);
}

.vt-item strong {
  font-size: 12px;
  font-weight: 720;
  letter-spacing: -0.01em;
  color: var(--ink);
}

.vt-item.latest strong {
  color: var(--accent);
}

.vt-item p {
  color: var(--muted);
  font-size: 10.5px;
  line-height: 1.55;
}

.vt-note {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px dashed var(--line);
  color: var(--faint);
  font-size: 10.5px;
  line-height: 1.5;
}

.vt-note a {
  color: var(--accent);
}

@media (max-width: 760px) {
  .vt {
    padding: 20px 18px 16px;
  }

  .vt-track {
    min-width: 0;
    grid-template-columns: 1fr;
    gap: 0;
  }

  .vt-track::before {
    left: 6px;
    right: auto;
    top: 10px;
    bottom: 10px;
    border-top: 0;
    border-left: 1px dashed var(--line-strong);
  }

  .vt-item {
    display: grid;
    grid-template-columns: 64px 16px 1fr;
    grid-template-rows: auto auto;
    column-gap: 10px;
    padding: 0 0 20px;
  }

  .vt-date {
    grid-column: 1;
    grid-row: 1;
    padding-top: 1px;
    text-align: right;
  }

  .vt-dot {
    grid-column: 2;
    grid-row: 1 / span 2;
    align-self: start;
    margin-top: 1px;
  }

  .vt-item strong {
    grid-column: 3;
    grid-row: 1;
  }

  .vt-item p {
    grid-column: 3;
    grid-row: 2;
  }
}
</style>
