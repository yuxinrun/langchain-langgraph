<template>
  <div class="rs">
    <div class="rs-layer rs-top">
      <span class="rs-kicker">01 / 高层 API</span>
      <strong>LangChain · create_agent</strong>
      <p>标准 Agent 循环 + Middleware + 结构化输出。一行代码起一个能跑的智能体。</p>
    </div>

    <div class="rs-seam"><span>builds on</span></div>

    <div class="rs-layer rs-mid">
      <span class="rs-kicker">02 / 编排层</span>
      <strong>LangGraph · StateGraph</strong>
      <p>把流程画成图：节点、边、条件路由、循环。要多少控制就给多少控制。</p>
    </div>

    <div class="rs-seam"><span>runs on</span></div>

    <div class="rs-layer rs-bottom">
      <span class="rs-kicker">03 / 运行时</span>
      <strong>LangGraph Runtime</strong>
      <div class="rs-cells">
        <span>持久化 / Checkpoint</span>
        <span>人机协同 Interrupt</span>
        <span>流式 Streaming</span>
        <span>可恢复 / 可观测</span>
      </div>
    </div>

    <p class="rs-note">
      关键事实：<strong>LangChain 的 create_agent 本身就跑在 LangGraph 运行时之上</strong>。
      所以这不是「二选一」，而是「同一台发动机的两个档位」——先用高层档快速起步，需要精细控制时再降到 LangGraph 手动挡。
    </p>
  </div>
</template>

<style scoped>
.rs {
  margin: 28px 0;
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background:
    radial-gradient(ellipse 60% 80% at 100% 0%, var(--blue-soft), transparent 55%),
    var(--panel);
}

.rs-layer {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 16px 18px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--panel-2);
}

.rs-kicker {
  font-family: var(--font-mono);
  font-size: 8.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
}

.rs-layer strong {
  font-size: 14px;
  font-weight: 720;
  letter-spacing: -0.01em;
  color: var(--ink);
}

.rs-layer p {
  color: var(--muted);
  font-size: 11.5px;
  line-height: 1.6;
}

.rs-top {
  border-color: color-mix(in srgb, var(--accent) 42%, var(--line));
  background: linear-gradient(150deg, var(--accent-soft), transparent 70%), var(--panel-2);
}

.rs-mid {
  border-color: color-mix(in srgb, var(--blue) 40%, var(--line));
}

.rs-bottom {
  border-color: color-mix(in srgb, var(--coral) 38%, var(--line));
}

.rs-seam {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 26px;
}

.rs-seam::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 2px;
  bottom: 2px;
  border-left: 1.5px dashed var(--line-strong);
}

.rs-seam::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 1px;
  width: 5px;
  height: 5px;
  margin-left: -2.5px;
  border-right: 1.5px solid var(--line-strong);
  border-bottom: 1.5px solid var(--line-strong);
  transform: rotate(45deg);
}

.rs-seam span {
  position: relative;
  z-index: 1;
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.04em;
}

.rs-cells {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-top: 6px;
}

.rs-cells span {
  padding: 8px 10px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: var(--panel);
  color: var(--ink-2);
  font-family: var(--font-mono);
  font-size: 10px;
}

.rs-note {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line);
  color: var(--muted);
  font-size: 12px;
  line-height: 1.65;
}

.rs-note strong {
  color: var(--accent);
}

@media (max-width: 640px) {
  .rs {
    padding: 18px;
  }

  .rs-cells {
    grid-template-columns: 1fr;
  }
}
</style>
