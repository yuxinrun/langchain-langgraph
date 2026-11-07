<template>
  <div class="ga">
    <div class="ga-col ga-state">
      <span class="ga-kicker">STATE · 状态</span>
      <strong>共享的数据</strong>
      <p>一个贯穿全图的「公共白板」。每个节点读它、写它，节点之间靠它传话，而不是互相直接调用。</p>
      <code>MessagesState</code>
    </div>
    <div class="ga-link"><span>reads</span></div>
    <div class="ga-col ga-node">
      <span class="ga-kicker">NODE · 节点</span>
      <strong>干活的函数</strong>
      <p>一个普通函数：接收当前 state，返回对 state 的更新。里面可以调模型、查数据库、发请求。</p>
      <code>def call_model(state)</code>
    </div>
    <div class="ga-link ga-link-alt"><span>writes</span></div>
    <div class="ga-col ga-edge">
      <span class="ga-kicker">EDGE · 边</span>
      <strong>谁接下来跑</strong>
      <p>连接节点的箭头。可以是固定边，也可以是「看情况走哪条」的条件边，还能成环形成循环。</p>
      <code>add_conditional_edges</code>
    </div>
    <div class="ga-link"><span>runs</span></div>
    <div class="ga-col ga-runtime">
      <span class="ga-kicker">RUNTIME · 运行时</span>
      <strong>按超步执行</strong>
      <p>引擎一个「超步（super-step）」一个超步地推进图，每步自动存档，支持并行、恢复与打断。</p>
      <code>graph.invoke(...) / stream</code>
    </div>
  </div>
</template>

<style scoped>
.ga {
  display: grid;
  grid-template-columns: 1fr 30px 1fr 30px 1fr 30px 1fr;
  align-items: stretch;
  gap: 0;
  margin: 28px 0;
  padding: 22px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background:
    radial-gradient(ellipse 60% 90% at 0% 0%, var(--accent-soft), transparent 55%),
    var(--panel);
}

.ga-col {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 15px 13px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--panel-2);
}

.ga-kicker {
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}

.ga-col strong {
  font-size: 12.5px;
  font-weight: 720;
  line-height: 1.35;
  letter-spacing: -0.01em;
  color: var(--ink);
}

.ga-col p {
  color: var(--muted);
  font-size: 10.5px;
  line-height: 1.55;
}

.ga-col code {
  margin-top: auto;
  padding: 3px 6px;
  border-radius: 5px;
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 9px;
}

.ga-state {
  border-color: color-mix(in srgb, var(--accent) 45%, var(--line));
}

.ga-node {
  border-color: color-mix(in srgb, var(--blue) 40%, var(--line));
}

.ga-edge {
  border-color: color-mix(in srgb, var(--coral) 40%, var(--line));
}

.ga-runtime {
  border-color: color-mix(in srgb, var(--lime) 45%, var(--line));
}

.ga-link {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ga-link::before {
  content: '';
  width: 100%;
  border-top: 1.5px dashed var(--line-strong);
}

.ga-link::after {
  content: '';
  position: absolute;
  right: 1px;
  width: 5px;
  height: 5px;
  border-top: 1.5px solid var(--line-strong);
  border-right: 1.5px solid var(--line-strong);
  transform: rotate(45deg);
}

.ga-link span {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 2px 5px;
  background: var(--panel);
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 7.5px;
  white-space: nowrap;
}

@media (max-width: 900px) {
  .ga {
    grid-template-columns: 1fr;
    gap: 0;
    padding: 18px;
  }

  .ga-link {
    height: 26px;
  }

  .ga-link::before {
    width: 1.5px;
    height: 100%;
    border-top: 0;
    border-left: 1.5px dashed var(--line-strong);
  }

  .ga-link::after {
    right: auto;
    bottom: 1px;
    transform: rotate(135deg);
  }
}
</style>
