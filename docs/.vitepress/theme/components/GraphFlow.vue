<script setup lang="ts">
type Step = { n: string; title: string; desc: string; tone?: 'teal' | 'coral' | 'blue' | 'lime' }

defineProps<{
  steps: Step[]
  tags?: string[]
  note?: string
}>()
</script>

<template>
  <div class="gf">
    <div class="gf-flow" :style="{ '--cols': steps.length }">
      <div v-for="(s, i) in steps" :key="s.n" class="gf-step" :class="`tone-${s.tone || 'teal'}`">
        <span class="gf-n">{{ s.n }}</span>
        <strong>{{ s.title }}</strong>
        <p>{{ s.desc }}</p>
        <span v-if="i < steps.length - 1" class="gf-arrow">→</span>
      </div>
    </div>
    <div v-if="tags && tags.length" class="gf-foot">
      <span v-for="t in tags" :key="t">{{ t }}</span>
    </div>
    <p v-if="note" class="gf-note">{{ note }}</p>
  </div>
</template>

<style scoped>
.gf {
  margin: 28px 0;
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background:
    radial-gradient(ellipse 50% 80% at 100% 0%, var(--coral-soft), transparent 60%),
    var(--panel);
}

.gf-flow {
  display: grid;
  grid-template-columns: repeat(var(--cols, 5), minmax(0, 1fr));
  gap: 10px;
}

.gf-step {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 15px 13px 14px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--panel-2);
}

.gf-step.tone-teal {
  border-color: color-mix(in srgb, var(--accent) 38%, var(--line));
}

.gf-step.tone-coral {
  border-color: color-mix(in srgb, var(--coral) 32%, var(--line));
}

.gf-step.tone-blue {
  border-color: color-mix(in srgb, var(--blue) 32%, var(--line));
}

.gf-step.tone-lime {
  border-color: color-mix(in srgb, var(--lime) 42%, var(--line));
}

.gf-n {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.gf-step strong {
  font-size: 11.5px;
  font-weight: 720;
  line-height: 1.3;
  color: var(--ink);
}

.gf-step p {
  color: var(--muted);
  font-size: 10px;
  line-height: 1.5;
}

.gf-arrow {
  position: absolute;
  right: -11px;
  top: 50%;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  margin-top: -9px;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: var(--panel);
  color: var(--faint);
  font-size: 10px;
}

.gf-foot {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line);
}

.gf-foot span {
  padding: 3px 8px;
  border: 1px solid var(--line);
  border-radius: 5px;
  background: var(--panel-2);
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 8.5px;
  letter-spacing: 0.03em;
}

.gf-note {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--line);
  color: var(--muted);
  font-size: 11px;
  line-height: 1.6;
}

@media (max-width: 900px) {
  .gf-flow {
    grid-template-columns: 1fr;
  }

  .gf-arrow {
    right: auto;
    left: 50%;
    top: auto;
    bottom: -14px;
    transform: rotate(90deg);
  }

  .gf-step {
    padding: 14px 16px;
  }
}
</style>
