<script setup lang="ts">
type Series = 'lc' | 'lg'
type Row = { label: string; hint: string; scores: Record<Series, number> }

const series: { id: Series; label: string }[] = [
  { id: 'lc', label: 'LangChain' },
  { id: 'lg', label: 'LangGraph' }
]

const rows: Row[] = [
  { label: '上手 / 起步速度', hint: '从 0 到第一个能跑的 Agent', scores: { lc: 5, lg: 3 } },
  { label: '标准 Agent 循环', hint: '模型 → 工具 → 回复 的默认范式', scores: { lc: 5, lg: 4 } },
  { label: '细粒度控制力', hint: '自定义节点、分支、循环、并行', scores: { lc: 3, lg: 5 } },
  { label: '复杂 / 混合工作流', hint: '确定性步骤 + 智能步骤混编', scores: { lc: 2, lg: 5 } },
  { label: '长任务与可靠性', hint: '持久化、断点恢复、多日审批', scores: { lc: 4, lg: 5 } },
  { label: '人机协同（HITL）', hint: '审批、编辑、打断后继续', scores: { lc: 4, lg: 5 } }
]
</script>

<template>
  <figure class="fb">
    <div class="fb-head">
      <div class="fb-legend">
        <span v-for="s in series" :key="s.id" :class="`fb-${s.id}`">
          <i></i>{{ s.label }}
        </span>
      </div>
      <figcaption>工程体感评分 · 5 = 更顺手</figcaption>
    </div>

    <div class="fb-rows">
      <div v-for="row in rows" :key="row.label" class="fb-row">
        <div class="fb-label">
          <strong>{{ row.label }}</strong>
          <span>{{ row.hint }}</span>
        </div>
        <div class="fb-bars">
          <div v-for="s in series" :key="s.id" class="fb-line">
            <span class="fb-name">{{ s.label }}</span>
            <div class="fb-track">
              <i :class="`fb-${s.id}`" :style="{ width: `${(row.scores[s.id] / 5) * 100}%` }"></i>
            </div>
            <b>{{ row.scores[s.id] }}</b>
          </div>
        </div>
      </div>
    </div>

    <p class="fb-note">
      评分是「工程取舍」不是「谁更强」。两者不是竞品：LangChain 负责「快速起步」，LangGraph 负责「精细掌控」。
      而且 LangChain 的高层 Agent 本就跑在 LangGraph 上，需要时可以从前者无缝下钻到后者。
    </p>
  </figure>
</template>

<style scoped>
.fb {
  margin: 26px 0;
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--panel);
}

.fb-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 16px;
  border-bottom: 1px dashed var(--line);
}

.fb-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.fb-legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ink-2);
  font-family: var(--font-mono);
  font-size: 9.5px;
  letter-spacing: 0.03em;
}

.fb-legend i {
  width: 18px;
  height: 4px;
  border-radius: 2px;
}

.fb-legend .fb-lc i,
.fb-lc {
  background: var(--accent);
}

.fb-legend .fb-lg i,
.fb-lg {
  background: var(--coral);
}

.fb figcaption {
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 8.5px;
  letter-spacing: 0.05em;
}

.fb-rows {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 20px 0 4px;
}

.fb-row {
  display: grid;
  grid-template-columns: 190px 1fr;
  gap: 24px;
  align-items: center;
}

.fb-label strong {
  display: block;
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--ink);
}

.fb-label span {
  display: block;
  margin-top: 2px;
  color: var(--muted);
  font-size: 10px;
  line-height: 1.45;
}

.fb-bars {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.fb-line {
  display: grid;
  grid-template-columns: 82px 1fr 18px;
  gap: 10px;
  align-items: center;
}

.fb-name {
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 8.5px;
  white-space: nowrap;
}

.fb-track {
  height: 7px;
  border-radius: 999px;
  background: var(--panel-3);
  overflow: hidden;
}

.fb-track i {
  display: block;
  height: 100%;
  border-radius: 999px;
  opacity: 0.9;
}

.fb-line b {
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 500;
}

.fb-note {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed var(--line);
  color: var(--muted);
  font-size: 11.5px;
  line-height: 1.6;
}

@media (max-width: 760px) {
  .fb {
    padding: 18px;
  }

  .fb-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .fb-line {
    grid-template-columns: 76px 1fr 16px;
  }
}
</style>
