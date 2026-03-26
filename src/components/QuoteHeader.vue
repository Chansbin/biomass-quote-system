<template>
  <div class="wrap">
    <div class="title">
      <div class="title-main">生物质颗粒 · 快速报价助手</div>
      <div class="title-sub">输入客户位置 → 自动查找周边颗粒厂 → 估算运费与到货成本</div>
    </div>

    <div class="bar">
      <div class="field">
        <div class="label">客户地址（或定位）</div>
        <input
          class="input"
          v-model="local.address"
          placeholder="例如：东莞市麻涌镇"
          :disabled="disabled"
          @keydown.enter.prevent="onSearch"
        />
      </div>

      <div class="field small">
        <div class="label">搜索半径（公里）</div>
        <select class="select" v-model.number="local.radiusKm" :disabled="disabled">
          <option v-for="n in radiusOptions" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>

      <div class="field small">
        <div class="label">运费单价（元/吨·公里）</div>
        <select class="select" v-model.number="local.freightRate" :disabled="disabled">
          <option v-for="r in freightOptions" :key="r" :value="r">{{ r.toFixed(2) }}</option>
        </select>
      </div>

      <button class="btn" :disabled="disabled || !local.address.trim()" @click="onSearch">
        {{ loading ? '查询中...' : '查询并报价' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'

const props = defineProps({
  address: { type: String, default: '' },
  radiusKm: { type: Number, default: 200 },
  freightRate: { type: Number, default: 0.45 },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['update:address', 'update:radiusKm', 'update:freightRate', 'search'])

const local = reactive({
  address: props.address,
  radiusKm: props.radiusKm,
  freightRate: props.freightRate
})

watch(
  () => props.address,
  (v) => (local.address = v ?? '')
)
watch(
  () => props.radiusKm,
  (v) => (local.radiusKm = Number(v) || 0)
)
watch(
  () => props.freightRate,
  (v) => (local.freightRate = Number(v) || 0)
)

watch(
  () => local.address,
  (v) => emit('update:address', v)
)
watch(
  () => local.radiusKm,
  (v) => emit('update:radiusKm', Number(v) || 0)
)
watch(
  () => local.freightRate,
  (v) => emit('update:freightRate', Number(v) || 0)
)

// 为了测试“远距离工厂”展示：把最大值放大
const radiusOptions = [50, 100, 150, 200, 300, 500, 800, 1000, 1500]
const freightOptions = computed(() => [0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.82])

function onSearch() {
  emit('search')
}
</script>

<style scoped>
.wrap {
  padding: 14px 16px 10px;
}

.title-main {
  font-weight: 900;
  font-size: 20px;
  letter-spacing: 0.2px;
}
.title-sub {
  margin-top: 6px;
  font-size: 13px;
  color: var(--muted);
}

.bar {
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1.4fr 0.6fr 0.8fr auto;
  gap: 12px;
  align-items: end;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--card);
  box-shadow: var(--shadow);
}

.field .label {
  font-size: 12px;
  color: rgba(15, 23, 42, 0.72);
  margin-bottom: 6px;
  font-weight: 700;
}

.input,
.select {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.14);
  outline: none;
  background: white;
}

.input:focus,
.select:focus {
  border-color: rgba(14, 165, 233, 0.55);
  box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.12);
}

.btn {
  height: 42px;
  padding: 0 16px;
  border: 0;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 800;
  background: var(--primary);
  color: white;
  box-shadow: 0 10px 18px rgba(22, 163, 74, 0.22);
}
.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  box-shadow: none;
}

@media (max-width: 980px) {
  .bar {
    grid-template-columns: 1fr;
  }
  .btn {
    width: 100%;
  }
}
</style>

