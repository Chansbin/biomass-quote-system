<template>
  <div class="page">
    <header class="header">
      <QuoteHeader
        v-model:address="address"
        v-model:radiusKm="radiusKm"
        v-model:freightRate="freightRate"
        :loading="searching"
        :disabled="loadingData || excelLoading"
        @search="runSearch"
      />
    </header>

    <main class="content">
      <section class="map-col">
        <QuoteMap
          ref="mapCmp"
          :map-id="'quote-map'"
          :customer="customerPoint"
          :suppliers="candidateSuppliersForMap"
          :active-supplier-id="activeSupplierId"
          @select-supplier="handleSelectSupplier"
        />
      </section>

      <aside class="side-col">
        <FactoryList
          :loading="searching"
          :loading-text="loadingText"
          :items="quoteItems"
          :active-id="activeSupplierId"
          @select="handleSelectSupplier"
          @show-detail="showSupplierDetail"
        />

        <details class="tools" :open="false">
          <summary class="tools-summary">数据工具（Excel 导入 / 导出 / 示例数据）</summary>
          <div class="tools-body">
            <div class="tools-row">
              <input
                type="file"
                accept=".xlsx,.xls"
                class="file-input"
                :disabled="loadingData || excelLoading"
                @change="onExcelFileChange"
              />
            </div>
            <div class="tools-row">
              <button class="tool-btn" @click="exportToExcel" :disabled="loadingData || excelLoading">
                导出当前数据
              </button>
              <button class="tool-btn" @click="resetToSeedData" :disabled="loadingData || excelLoading">
                恢复示例数据
              </button>
            </div>
            <div v-if="excelLoading" class="tools-hint">解析中...</div>
            <div v-if="excelMsg" class="tools-ok">{{ excelMsg }}</div>
            <div v-if="excelError || apiError" class="tools-err">{{ excelError || apiError }}</div>
          </div>
        </details>
      </aside>
    </main>

    <!-- 供应商详情弹窗 -->
    <SupplierDetail
      v-if="detailVisible"
      :visible="detailVisible"
      :supplier="selectedSupplier"
      @close="detailVisible = false"
      @select="handleSelectSupplier"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import QuoteHeader from './components/QuoteHeader.vue'
import QuoteMap from './components/QuoteMap.vue'
import FactoryList from './components/FactoryList.vue'
import SupplierDetail from './components/SupplierDetail.vue'

import { suppliers as seedSuppliers, customers as seedCustomers } from './data.js'
import { fetchCustomers, fetchSuppliers, uploadExcel } from './api.js'
import { parseExcelFile } from './excelParser.js'
import * as XLSX from 'xlsx'

function isValidNumber(val) {
  return typeof val === 'number' && !isNaN(val) && isFinite(val)
}

const suppliersState = ref(
  seedSuppliers.map(s => ({
    ...s,
    lat: Number(s.lat),
    lng: Number(s.lng),
    price: Number(s.price) || 0,
    capacityRemaining: typeof s.capacityRemaining === 'number' ? Number(s.capacityRemaining) : (Number(s.capacity) || 0),
    phone: s.phone ? String(s.phone) : '',
    history: Array.isArray(s.history) ? s.history : []
  }))
)
const customersState = ref(
  seedCustomers.map(c => ({
    ...c,
    lat: Number(c.lat),
    lng: Number(c.lng),
    radius: Number(c.radius) || 0
  }))
)

const loadingData = ref(true)
const apiError = ref('')

const excelLoading = ref(false)
const excelMsg = ref('')
const excelError = ref('')

const address = ref(customersState.value?.[0]?.name || '北京新能源集团')
const radiusKm = ref(customersState.value?.[0]?.radius || 200)
const freightRate = ref(0.45)

const searching = ref(false)
const loadingText = ref('正在解析地址并搜索...')

const customerPoint = ref(null) // {lng,lat,name?}
const activeSupplierId = ref(null)
const quoteItems = ref([]) // [{id,name,price,distanceKm,freightCostPerTon,unitCost,lng,lat}]

const mapCmp = ref(null)

const detailVisible = ref(false)
const selectedSupplier = ref({})

// 导出 Excel
function exportToExcel() {
  try {
    const workbook = XLSX.utils.book_new()

    // 供应商数据
    const suppliersData = suppliersState.value.map(s => ({
      id: s.id,
      name: s.name,
      lat: s.lat,
      lng: s.lng,
      price: s.price,
      capacity: s.capacityRemaining,
      phone: s.phone
    }))
    const suppliersWorksheet = XLSX.utils.json_to_sheet(suppliersData)
    XLSX.utils.book_append_sheet(workbook, suppliersWorksheet, '供应商')

    // 客户数据
    const customersData = customersState.value.map(c => ({
      id: c.id,
      name: c.name,
      lat: c.lat,
      lng: c.lng,
      radius: c.radius
    }))
    const customersWorksheet = XLSX.utils.json_to_sheet(customersData)
    XLSX.utils.book_append_sheet(workbook, customersWorksheet, '客户')

    // 历史记录
    const historyData = []
    for (const s of suppliersState.value) {
      if (s.history && Array.isArray(s.history)) {
        for (const h of s.history) {
          historyData.push({
            supplier_id: s.id,
            year: h.year,
            month: h.month,
            volume: h.volume,
            note: h.note
          })
        }
      }
    }
    if (historyData.length > 0) {
      const historyWorksheet = XLSX.utils.json_to_sheet(historyData)
      XLSX.utils.book_append_sheet(workbook, historyWorksheet, '合作记录')
    }

    XLSX.writeFile(workbook, `biomass-data-${new Date().toISOString().slice(0, 10)}.xlsx`)
    excelMsg.value = '导出成功！'
    setTimeout(() => excelMsg.value = '', 3000)
  } catch (e) {
    excelError.value = '导出失败：' + (e.message || '未知错误')
  }
}

// 显示供应商详情
function showSupplierDetail(id) {
  const supplier = suppliersState.value.find(s => s.id === id)
  if (supplier) {
    selectedSupplier.value = supplier
    detailVisible.value = true
  }
}

const candidateSuppliersForMap = computed(() =>
  quoteItems.value.map(it => ({
    id: it.id,
    name: it.name,
    lng: it.lng,
    lat: it.lat
  }))
)

function waitForAMapReady() {
  return new Promise((resolve) => {
    const check = () => {
      try {
        if (window.AMap && typeof AMap.Pixel === 'function') {
          new AMap.Pixel(0, 0)
          resolve()
        } else {
          setTimeout(check, 50)
        }
      } catch (e) {
        setTimeout(check, 100)
      }
    }
    check()
  })
}

async function loadBackendData() {
  loadingData.value = true
  apiError.value = ''
  try {
    const [customers, suppliers] = await Promise.all([fetchCustomers(), fetchSuppliers()])
    const nextCustomers = Array.isArray(customers) ? customers : []
    const nextSuppliers = Array.isArray(suppliers) ? suppliers : []

    customersState.value = nextCustomers.map(c => ({
      ...c,
      lat: Number(c.lat),
      lng: Number(c.lng),
      radius: Number(c.radius) || 0
    }))

    suppliersState.value = nextSuppliers.map(s => ({
      ...s,
      lat: Number(s.lat),
      lng: Number(s.lng),
      price: Number(s.price) || 0,
      capacityRemaining:
        typeof s.capacityRemaining === 'number'
          ? Number(s.capacityRemaining)
          : (Number(s.capacity) || 0),
      phone: s.phone ? String(s.phone) : '',
      history: Array.isArray(s.history) ? s.history : []
    }))
  } catch (e) {
    apiError.value = e?.message ? String(e.message) : 'loadBackendData failed'
    // 保持 seed 数据
  } finally {
    loadingData.value = false
  }
}

function resetToSeedData() {
  suppliersState.value = seedSuppliers.map(s => ({
    ...s,
    lat: Number(s.lat),
    lng: Number(s.lng),
    price: Number(s.price) || 0,
    capacityRemaining: typeof s.capacityRemaining === 'number' ? Number(s.capacityRemaining) : (Number(s.capacity) || 0),
    phone: s.phone ? String(s.phone) : '',
    history: Array.isArray(s.history) ? s.history : []
  }))
  customersState.value = seedCustomers.map(c => ({
    ...c,
    lat: Number(c.lat),
    lng: Number(c.lng),
    radius: Number(c.radius) || 0
  }))
  excelMsg.value = ''
  excelError.value = ''
  apiError.value = ''
  quoteItems.value = []
  activeSupplierId.value = null
  customerPoint.value = null
}

async function onExcelFileChange(e) {
  const file = e && e.target && e.target.files ? e.target.files[0] : null
  if (!file) return
  excelLoading.value = true
  excelMsg.value = ''
  excelError.value = ''
  try {
    const parsed = await parseExcelFile(file)
    const suppliers = Array.isArray(parsed.suppliers) ? parsed.suppliers : []
    const customers = Array.isArray(parsed.customers) ? parsed.customers : []

    suppliersState.value = suppliers.map(s => ({
      ...s,
      lat: Number(s.lat),
      lng: Number(s.lng),
      price: Number(s.price) || 0,
      capacity: Number(s.capacity) || Number(s.capacityRemaining) || 0,
      capacityRemaining: Number(s.capacityRemaining) || Number(s.capacity) || 0,
      history: Array.isArray(s.history) ? s.history : [],
      phone: s.phone ? String(s.phone) : ''
    }))
    customersState.value = customers.map(c => ({
      ...c,
      lat: Number(c.lat),
      lng: Number(c.lng),
      radius: Number(c.radius) || 0
    }))

    if (suppliersState.value.length === 0 || customersState.value.length === 0) {
      throw new Error('Excel 解析成功，但 suppliers/customers 为空，请检查表头与列名')
    }

    excelMsg.value = `导入成功：${suppliersState.value.length} 个工厂，${customersState.value.length} 个客户`
  } catch (err) {
    excelError.value = err && err.message ? String(err.message) : 'Excel 导入失败'
  } finally {
    excelLoading.value = false
    if (e && e.target) e.target.value = ''
  }
}

function geocodeAddress(addr) {
  return new Promise((resolve, reject) => {
    if (!window.AMap || typeof AMap.Geocoder !== 'function') {
      reject(new Error('AMap.Geocoder 不可用（请检查高德脚本是否加载）'))
      return
    }
    const geocoder = new AMap.Geocoder({ city: '全国' })
    geocoder.getLocation(String(addr || ''), (status, result) => {
      if (status === 'complete' && result && result.geocodes && result.geocodes[0]) {
        const loc = result.geocodes[0].location
        resolve({ lng: Number(loc.lng), lat: Number(loc.lat) })
      } else {
        reject(new Error('地址解析失败'))
      }
    })
  })
}

function distanceKm(lng1, lat1, lng2, lat2) {
  const p1 = new AMap.LngLat(lng1, lat1)
  const p2 = new AMap.LngLat(lng2, lat2)
  return Math.round(p1.distance(p2)) / 1000
}

async function runSearch() {
  searching.value = true
  apiError.value = ''
  loadingText.value = '正在解析地址并搜索...'
  activeSupplierId.value = null
  quoteItems.value = []

  try {
    await waitForAMapReady()
    let point = null
    try {
      point = await geocodeAddress(address.value)
    } catch (e) {
      // fallback：用第一个客户点（保证至少能跑通流程）
      const c0 = customersState.value && customersState.value[0]
      if (c0 && isValidNumber(c0.lng) && isValidNumber(c0.lat)) {
        point = { lng: Number(c0.lng), lat: Number(c0.lat) }
      } else {
        throw e
      }
    }

    customerPoint.value = { ...point, name: address.value }
    if (mapCmp.value && typeof mapCmp.value.setRadiusCircle === 'function') {
      mapCmp.value.setRadiusCircle(radiusKm.value)
    }

    loadingText.value = '正在计算周边工厂报价...'

    const results = []
    for (const s of suppliersState.value) {
      if (!s) continue
      if (!isValidNumber(Number(s.lng)) || !isValidNumber(Number(s.lat))) continue
      const d = distanceKm(point.lng, point.lat, Number(s.lng), Number(s.lat))
      if (!isFinite(d) || d > Number(radiusKm.value || 0)) continue
      const freightCostPerTon = d * Number(freightRate.value || 0)
      const unitCost = Number(s.price || 0) + freightCostPerTon
      results.push({
        id: s.id,
        name: String(s.name || s.id),
        price: Number(s.price || 0),
        distanceKm: d,
        freightCostPerTon,
        unitCost,
        lng: Number(s.lng),
        lat: Number(s.lat)
      })
    }
    results.sort((a, b) => a.unitCost - b.unitCost)
    quoteItems.value = results
    if (results[0]) activeSupplierId.value = results[0].id
  } catch (e) {
    apiError.value = e?.message ? String(e.message) : '查询失败'
  } finally {
    searching.value = false
  }
}

function handleSelectSupplier(id) {
  activeSupplierId.value = id
  if (mapCmp.value && typeof mapCmp.value.panToSupplier === 'function') {
    mapCmp.value.panToSupplier(id)
  }
}

onMounted(async () => {
  await waitForAMapReady()
  await loadBackendData()
  // 初始用 seed/后端第一客户做默认半径
  const c0 = customersState.value && customersState.value[0]
  if (c0 && isValidNumber(c0.radius)) radiusKm.value = Number(c0.radius) || radiusKm.value
  // 默认先跑一次
  runSearch()
})
</script>

<style scoped>
.page {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
}

.header {
  border-radius: 14px;
  background: transparent;
}

.content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 12px;
  min-height: 0;
}

.map-col,
.side-col {
  min-height: 0;
}

.side-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tools {
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--card);
  box-shadow: var(--shadow);
  overflow: hidden;
}
.tools-summary {
  cursor: pointer;
  padding: 10px 12px;
  font-weight: 900;
  font-size: 13px;
  color: rgba(15, 23, 42, 0.75);
  user-select: none;
}
.tools-body {
  padding: 10px 12px 12px;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
}
.tools-row {
  display: flex;
  gap: 10px;
  align-items: center;
}
.file-input {
  flex: 1;
  font-size: 13px;
}
.tool-btn {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.14);
  background: white;
  font-weight: 800;
  cursor: pointer;
}
.tool-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
.tools-hint {
  margin-top: 8px;
  font-size: 12px;
  color: rgba(15, 23, 42, 0.6);
  font-weight: 700;
}
.tools-ok {
  margin-top: 8px;
  font-size: 12px;
  color: #16a34a;
  font-weight: 900;
}
.tools-err {
  margin-top: 8px;
  font-size: 12px;
  color: #dc2626;
  font-weight: 900;
}

@media (max-width: 980px) {
  .content {
    grid-template-columns: 1fr;
  }
  .side-col {
    height: 48vh;
  }
}
</style>