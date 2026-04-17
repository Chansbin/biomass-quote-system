<template>
  <div class="panel">
    <div class="panel-title">符合条件的工厂列表（点击可定位）</div>

    <div v-if="loading" class="state">
      <div class="spinner" />
      <div class="state-text">{{ loadingText }}</div>
    </div>

    <div v-else-if="items.length === 0" class="empty">
      半径内暂无可用工厂（或地址解析失败）。
    </div>

    <div v-else class="list">
      <div
        v-for="it in items"
        :key="it.id"
        class="row"
        :class="{ active: activeId === it.id }"
      >
        <div class="row-main" @click="$emit('select', it.id)">
          <div class="row-top">
            <div class="name">{{ it.name }}</div>
            <div class="cost">¥{{ it.unitCost.toFixed(2) }}/吨</div>
          </div>
          <div class="meta">
            <span>基地价 ¥{{ it.price.toFixed(0) }}</span>
            <span>运距 {{ it.distanceKm.toFixed(1) }} km</span>
            <span>运费/吨 ¥{{ it.freightCostPerTon.toFixed(2) }}</span>
          </div>
        </div>
        <button class="detail-btn" @click="$emit('show-detail', it.id)" title="查看详情">
          详情
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  loading: { type: Boolean, default: false },
  loadingText: { type: String, default: '正在解析地址并搜索...' },
  items: { type: Array, default: () => [] },
  activeId: { type: [String, Number], default: null }
})

defineEmits(['select', 'show-detail'])
</script>

<style scoped>
.panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.panel-title {
  font-weight: 900;
  font-size: 14px;
  color: rgba(15, 23, 42, 0.85);
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--card);
  box-shadow: var(--shadow);
}

.state {
  flex: 1;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--card);
  box-shadow: var(--shadow);
  display: grid;
  place-content: center;
  padding: 24px;
  gap: 10px;
}

.spinner {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 2px solid rgba(15, 23, 42, 0.15);
  border-top-color: rgba(14, 165, 233, 0.8);
  animation: spin 0.9s linear infinite;
  margin: 0 auto;
}
.state-text {
  font-size: 13px;
  color: rgba(15, 23, 42, 0.65);
  font-weight: 700;
}

.empty {
  flex: 1;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--card);
  box-shadow: var(--shadow);
  padding: 16px;
  color: rgba(15, 23, 42, 0.65);
  font-size: 13px;
  display: grid;
  place-content: center;
  text-align: center;
}

.list {
  flex: 1;
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--card);
  box-shadow: var(--shadow);
  padding: 8px;
}

.row {
  width: 100%;
  text-align: left;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: white;
  border-radius: 12px;
  padding: 10px 10px;
  cursor: pointer;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.row:last-child {
  margin-bottom: 0;
}
.row:hover {
  border-color: rgba(14, 165, 233, 0.35);
}
.row.active {
  border-color: rgba(22, 163, 74, 0.55);
  box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.10);
}

.row-main {
  flex: 1;
  min-width: 0;
}

.detail-btn {
  padding: 6px 12px;
  background: rgba(14, 165, 233, 0.1);
  color: rgba(14, 165, 233, 0.9);
  border: 1px solid rgba(14, 165, 233, 0.3);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.detail-btn:hover {
  background: rgba(14, 165, 233, 0.2);
}

.row-top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: baseline;
}
.name {
  font-weight: 900;
  font-size: 13px;
}
.cost {
  font-weight: 900;
  color: rgba(15, 23, 42, 0.9);
  font-size: 13px;
}

.meta {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12px;
  color: rgba(15, 23, 42, 0.62);
  font-weight: 700;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

