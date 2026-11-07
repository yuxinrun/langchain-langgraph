<script setup lang="ts">
const tools = ['search', 'sql', 'http']
</script>

<template>
  <div class="hg" aria-hidden="true">
    <div class="hg-halo"></div>

    <div class="hg-head">
      <span class="hg-kicker">LANGGRAPH · STATEGRAPH</span>
      <span class="hg-status"><b></b>running</span>
    </div>

    <div class="hg-canvas">
      <div class="hg-flow">
        <div class="hg-node hg-start">
          <span>START</span>
          <p>{{ '用户消息进来' }}</p>
        </div>

        <div class="hg-wire"><i></i><i></i><i></i></div>

        <div class="hg-node hg-agent">
          <span class="hg-tag">NODE · call_model</span>
          <strong>Agent</strong>
          <div class="hg-chips">
            <span v-for="t in tools" :key="t">{{ t }}</span>
          </div>
        </div>

        <div class="hg-wire hg-wire-cond">
          <i></i><i></i><i></i>
          <em>还有工具调用?</em>
        </div>

        <div class="hg-node hg-tools">
          <span class="hg-tag">NODE · tools</span>
          <strong>执行工具</strong>
        </div>

        <div class="hg-loop">
          <span>↺ 结果回灌给 Agent，继续循环</span>
        </div>

        <div class="hg-wire"><i></i><i></i><i></i></div>

        <div class="hg-node hg-end">
          <span>END</span>
          <p>{{ '最终答复' }}</p>
        </div>
      </div>

      <aside class="hg-state">
        <span class="hg-tag">STATE</span>
        <ul>
          <li>messages</li>
          <li>todos</li>
          <li>context</li>
        </ul>
        <div class="hg-check">
          <b></b>
          <span>每步存 Checkpoint<br />崩了也能接着跑</span>
        </div>
      </aside>
    </div>

    <div class="hg-foot">
      <span>{{ '状态驱动' }}</span>
      <span>{{ '可持久化' }}</span>
      <span>{{ '人机协同' }}</span>
    </div>
  </div>
</template>

<style scoped>
.hg {
  position: relative;
  width: min(100%, 500px);
  margin-inline: auto;
  padding: 24px 22px 18px;
  border: 1px solid var(--line);
  border-radius: 28px;
  background:
    radial-gradient(ellipse 80% 60% at 82% 0%, var(--accent-soft), transparent 60%),
    var(--panel);
  box-shadow: var(--shadow-lg);
  transform: rotate(-1.4deg);
}

.hg::after {
  content: '';
  position: absolute;
  inset: 10px;
  border: 1px dashed var(--line);
  border-radius: 20px;
  pointer-events: none;
}

.hg-halo {
  position: absolute;
  right: -34px;
  top: -30px;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  border: 1px solid var(--line);
  background: radial-gradient(circle, var(--coral-soft), transparent 65%);
  filter: blur(2px);
}

.hg-head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.hg-kicker,
.hg-tag {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
}

.hg-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--accent);
}

.hg-status b {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  animation: hg-blink 2.4s infinite;
}

.hg-canvas {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 118px;
  gap: 14px;
  align-items: stretch;
}

.hg-flow {
  display: flex;
  flex-direction: column;
}

.hg-node {
  border: 1px solid var(--line-strong);
  border-radius: 14px;
  background: var(--panel);
  padding: 11px 14px;
}

.hg-node > span:first-child {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--ink);
}

.hg-node p {
  margin-top: 2px;
  color: var(--muted);
  font-size: 10.5px;
}

.hg-agent {
  border-color: color-mix(in srgb, var(--accent) 48%, var(--line));
  background: linear-gradient(150deg, var(--accent-soft), transparent 72%), var(--panel);
}

.hg-agent strong {
  display: block;
  margin-top: 4px;
  font-size: 15px;
  font-weight: 720;
  letter-spacing: -0.02em;
}

.hg-tools {
  border-color: color-mix(in srgb, var(--coral) 40%, var(--line));
}

.hg-tools strong {
  display: block;
  margin-top: 4px;
  font-size: 13px;
  font-weight: 700;
}

.hg-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 8px;
}

.hg-chips span {
  padding: 3px 8px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--panel-2);
  color: var(--ink-2);
  font-family: var(--font-mono);
  font-size: 9.5px;
}

.hg-wire {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 7px 0;
}

.hg-wire i {
  width: 1.5px;
  height: 5px;
  border-radius: 2px;
  background: var(--line-strong);
}

.hg-wire-cond em {
  margin-top: 2px;
  padding: 2px 8px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--panel-2);
  color: var(--coral);
  font-family: var(--font-mono);
  font-size: 8.5px;
  font-style: normal;
  letter-spacing: 0.03em;
}

.hg-loop {
  display: flex;
  justify-content: flex-end;
  padding: 2px 2px 2px 0;
}

.hg-loop span {
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.02em;
}

.hg-state {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px dashed var(--line-strong);
  border-radius: 14px;
  background: var(--panel-2);
}

.hg-state ul {
  margin: 0;
  padding-left: 1.1em;
}

.hg-state li {
  color: var(--ink-2);
  font-family: var(--font-mono);
  font-size: 10px;
  line-height: 1.7;
}

.hg-check {
  margin-top: auto;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  color: var(--muted);
  font-size: 9px;
  line-height: 1.5;
}

.hg-check b {
  flex-shrink: 0;
  width: 7px;
  height: 7px;
  margin-top: 2px;
  border-radius: 50%;
  background: var(--blue);
  box-shadow: 0 0 0 4px var(--blue-soft);
}

.hg-foot {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed var(--line);
  color: var(--faint);
  font-size: 10px;
}

.hg-foot span::before {
  content: '•';
  margin-right: 5px;
  color: var(--accent);
}

@keyframes hg-blink {
  50% {
    opacity: 0.3;
  }
}

@media (max-width: 960px) {
  .hg {
    transform: none;
    margin-top: 12px;
  }
}

@media (max-width: 480px) {
  .hg {
    padding: 20px 16px 16px;
    border-radius: 20px;
  }

  .hg-canvas {
    grid-template-columns: 1fr;
  }

  .hg-state {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hg-status b {
    animation: none;
  }
}
</style>
