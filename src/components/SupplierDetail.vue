<template>
  <div v-if="visible" class="modal-overlay" @click.self="close">
    <div class="modal">
      <div class="modal-header">
        <h3>{{ supplier.name }}</h3>
        <button class="close-btn" @click="close">&times;</button>
      </div>

      <div class="modal-body">
        <div class="info-grid">
          <div class="info-item">
            <span class="label">联系电话</span>
            <span class="value">{{ supplier.phone || '暂无' }}</span>
          </div>
          <div class="info-item">
            <span class="label">基地价格</span>
            <span class="value">¥{{ supplier.price }}/吨</span>
          </div>
          <div class="info-item">
            <span class="label">产能</span>
            <span class="value">{{ supplier.capacityRemaining }} 吨</span>
          </div>
          <div class="info-item">
            <span class="label">经纬度</span>
            <span class="value">{{ supplier.lat }}, {{ supplier.lng }}</span>
          </div>
        </div>

        <div v-if="supplier.history && supplier.history.length > 0" class="history-section">
          <h4>合作记录</h4>
          <div class="history-list">
            <div v-for="h in supplier.history" :key="h.id" class="history-item">
              <div class="history-time">{{ h.year }}年{{ h.month }}月</div>
              <div class="history-volume">{{ h.volume }} 吨</div>
              <div class="history-note">{{ h.note }}</div>
            </div>
          </div>
        </div>

        <div v-else class="no-history">暂无合作记录</div>
      </div>

      <div class="modal-footer">
        <button class="btn-primary" @click="selectSupplier">选择此供应商</button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  visible: { type: Boolean, default: false },
  supplier: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['close', 'select'])

function close() {
  emit('close')
}

function selectSupplier() {
  emit('select', props.supplier.id)
  close()
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: white;
  border-radius: 16px;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.1);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: rgba(15, 23, 42, 0.9);
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: rgba(15, 23, 42, 0.5);
  cursor: pointer;
  line-height: 1;
  padding: 0 4px;
}

.close-btn:hover {
  color: rgba(15, 23, 42, 0.9);
}

.modal-body {
  padding: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item .label {
  font-size: 12px;
  color: rgba(15, 23, 42, 0.5);
  font-weight: 600;
}

.info-item .value {
  font-size: 14px;
  color: rgba(15, 23, 42, 0.9);
  font-weight: 700;
}

.history-section h4 {
  margin: 0 0 12px;
  font-size: 14px;
  color: rgba(15, 23, 42, 0.8);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-item {
  padding: 12px;
  background: rgba(14, 165, 233, 0.05);
  border-radius: 10px;
  border-left: 3px solid rgba(14, 165, 233, 0.5);
}

.history-time {
  font-size: 12px;
  color: rgba(14, 165, 233, 0.9);
  font-weight: 700;
  margin-bottom: 4px;
}

.history-volume {
  font-size: 13px;
  color: rgba(15, 23, 42, 0.8);
  font-weight: 600;
}

.history-note {
  font-size: 12px;
  color: rgba(15, 23, 42, 0.6);
  margin-top: 4px;
}

.no-history {
  text-align: center;
  padding: 20px;
  color: rgba(15, 23, 42, 0.5);
  font-size: 13px;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(15, 23, 42, 0.1);
  display: flex;
  justify-content: flex-end;
}

.btn-primary {
  padding: 10px 24px;
  background: rgba(22, 163, 74, 0.9);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
}

.btn-primary:hover {
  background: rgba(22, 163, 74, 1);
}
</style>
