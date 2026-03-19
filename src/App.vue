<template>
  <div class="app">
    <div id="map" class="map"></div>

    <div v-if="selectedCustomer" class="panel">
      <h2>{{ selectedCustomer.name }} - 智能报价/调货</h2>

      <div class="form">
        <div class="form-row">
          <label class="label">订单吨数（吨）</label>
          <input type="number" min="0" step="0.1" v-model.number="quoteForm.quantity" class="input" />
        </div>

        <div class="form-row">
          <label class="label">运距估算方式</label>
          <select v-model="quoteForm.distanceMode" class="select">
            <option value="direct">快速估算（直线 + 系数）</option>
            <option value="driving">道路运距（需要更慢的 API）</option>
          </select>
        </div>

        <div class="form-row">
          <label class="label">运价（元/吨·公里）</label>
          <input type="number" min="0" step="0.01" v-model.number="quoteForm.freightRate" class="input" />
        </div>

        <div class="form-row" v-if="quoteForm.distanceMode === 'direct'">
          <label class="label">系数（直线->道路）</label>
          <input type="number" min="0.5" step="0.01" v-model.number="quoteForm.drivingFactor" class="input" />
        </div>

        <div class="form-row">
          <button class="btn" @click="calculateQuote" :disabled="loading">
            {{ loading ? '计算中...' : '计算报价' }}
          </button>
          <button class="btn secondary" @click="resetQuote" :disabled="loading">重置参数</button>
        </div>
      </div>

      <div v-if="recommendation" class="recommend">
        <p>✅ 推荐供应商：<strong>{{ recommendation.supplier.name }}</strong></p>
        <p>单吨成本：¥{{ recommendation.unitCost.toFixed(2) }}</p>
        <p>预计调货总成本：¥{{ dispatchPlan.totalCost.toFixed(2) }}</p>
        <p>调货分配：{{ dispatchPlan.totalQuantity.toFixed(1) }}吨 / 计划{{ quoteForm.quantity.toFixed(1) }}吨</p>
        <p v-if="dispatchPlan.remainingShortage > 0" class="warn">容量不足：还需 {{ dispatchPlan.remainingShortage.toFixed(1) }}吨</p>
        <button class="btn" @click="confirmDispatch" :disabled="dispatchPlan.remainingShortage > 0">确认调货并扣减产能</button>
      </div>

      <div v-if="activeSupplier" class="supplier-card">
        <div class="supplier-card-top">
          <div class="supplier-card-title">供应商信息</div>
          <button class="btn secondary small-btn" @click="activeSupplier = null" :disabled="loading">关闭</button>
        </div>

        <div class="supplier-card-row">
          <span>厂名</span>
          <strong>{{ activeSupplier.name }}</strong>
        </div>
        <div class="supplier-card-row">
          <span>电话</span>
          <span>{{ activeSupplier.phone || '-' }}</span>
        </div>
        <div class="supplier-card-row">
          <span>当前基地价</span>
          <span>¥{{ activeSupplier.price.toFixed(2) }}/吨</span>
        </div>

        <div v-if="activeSupplierQuote" class="supplier-card-block">
          <div class="supplier-card-block-title">对当前客户的测算</div>
          <div class="supplier-card-row">
            <span>单吨成本</span>
            <span>¥{{ activeSupplierQuote.unitCost.toFixed(2) }}</span>
          </div>
          <div class="supplier-card-row">
            <span>运距</span>
            <span>{{ activeSupplierQuote.estimatedDistanceKm.toFixed(1) }} km</span>
          </div>
          <div class="supplier-card-row">
            <span>运费/吨</span>
            <span>¥{{ activeSupplierQuote.freightCostPerTon.toFixed(2) }}</span>
          </div>
        </div>

        <div v-if="activeSupplierAllocation" class="supplier-card-block">
          <div class="supplier-card-block-title">本次调货分配</div>
          <div class="supplier-card-row">
            <span>分配量</span>
            <span>{{ activeSupplierAllocation.amount.toFixed(1) }} 吨</span>
          </div>
          <div class="supplier-card-row">
            <span>小计成本</span>
            <span>¥{{ (activeSupplierAllocation.amount * activeSupplierAllocation.unitCost).toFixed(2) }}</span>
          </div>
        </div>

        <div class="supplier-card-block">
          <div class="supplier-card-block-title">历史合作记录</div>
          <div v-if="activeSupplier.history && activeSupplier.history.length" class="history">
            <div v-for="h in activeSupplier.history" :key="h.id" class="history-item">
              <div class="history-top">
                <span>{{ h.year }} {{ h.month }}</span>
                <span>量：{{ h.volume.toFixed(1) }} 吨</span>
              </div>
              <div class="history-sub">
                {{ h.note }}
              </div>
            </div>
          </div>
          <div v-else class="empty">暂无历史合作记录。</div>
        </div>
      </div>

      <div class="chart-wrap">
        <div ref="chartRef" class="chart"></div>
      </div>

      <h3 class="section-title">候选供应商（按单吨成本排序）</h3>
      <div class="list">
        <div
          v-for="r in quoteResults"
          :key="r.supplier.id"
          class="supplier-row"
          @click="handleSupplierClick(r.supplier)"
        >
          <div class="supplier-left">
            <div class="supplier-name">{{ r.supplier.name }}</div>
            <div class="supplier-meta">可供剩余：<strong>{{ r.supplier.capacityRemaining.toFixed(1) }}</strong> 吨</div>
          </div>

          <div class="supplier-mid">
            <div class="cell">
              基地价：
              <input
                type="number"
                min="0"
                step="0.01"
                v-model.number="r.supplier.price"
                class="input small"
                @change="calculateQuote"
                @click.stop
              />
              元/吨
            </div>
            <div class="cell">运距：{{ r.estimatedDistanceKm.toFixed(1) }} km</div>
            <div class="cell">运费/吨：¥{{ r.freightCostPerTon.toFixed(2) }}</div>
          </div>

          <div class="supplier-right">
            <div class="unit-cost">单吨成本 ¥{{ r.unitCost.toFixed(2) }}</div>
            <div class="badges">
              <span v-if="recommendation && r.supplier.id === recommendation.supplier.id" class="badge ok">推荐</span>
              <span v-if="dispatchPlan && dispatchPlan.allocationBySupplierId.has(r.supplier.id)" class="badge warn2">已分配</span>
            </div>
          </div>
        </div>
        <div v-if="quoteResults.length === 0" class="empty">半径内暂无可用供应商（或坐标无效）。</div>
      </div>

      <h3 class="section-title">调货分配（按最低成本贪心）</h3>
      <div class="alloc">
        <div v-for="a in dispatchPlan.allocations" :key="a.supplierId" class="alloc-row">
          <span class="alloc-name">{{ a.name }}</span>
          <span class="alloc-qty">{{ a.amount.toFixed(1) }}吨</span>
          <span class="alloc-unit">单吨¥{{ a.unitCost.toFixed(2) }}</span>
          <span class="alloc-sub">小计¥{{ (a.unitCost * a.amount).toFixed(2) }}</span>
        </div>
        <div v-if="dispatchPlan.allocations.length === 0" class="empty">还没有可执行的调货分配，请点击“计算报价”。</div>
      </div>

      <h3 class="section-title">调货单历史（本地内存）</h3>
      <div class="orders">
        <div v-if="dispatchOrders.length === 0" class="empty">暂无调货单。</div>
        <div v-for="o in dispatchOrders" :key="o.id" class="order-card">
          <div class="order-top">
            <div><strong>客户：</strong>{{ o.customer.name }}</div>
            <div><strong>数量：</strong>{{ o.quantity.toFixed(1) }}吨</div>
            <div><strong>总成本：</strong>¥{{ o.totalCost.toFixed(2) }}</div>
          </div>
          <div class="order-body">
            <div v-for="a in o.allocations" :key="a.supplierId" class="order-line">
              <span>{{ a.name }}</span>
              <span>{{ a.amount.toFixed(1) }}吨</span>
              <span>单吨¥{{ a.unitCost.toFixed(2) }}</span>
            </div>
          </div>
          <div class="order-foot">时间：{{ formatDate(o.createdAt) }}</div>
        </div>
      </div>
    </div>

    <div v-else class="hint">👈 请点击蓝色客户点</div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { suppliers as seedSuppliers, customers as seedCustomers } from './data.js'

function isValidNumber(val) {
  return typeof val === 'number' && !isNaN(val) && isFinite(val)
}

function toFixedSafe(n, d) {
  if (typeof n !== 'number' || !isFinite(n)) return (0).toFixed(d)
  return n.toFixed(d)
}

export default {
  data() {
    const initialSuppliers = seedSuppliers.map(s => ({
      ...s,
      capacityRemaining: typeof s.capacity === 'number' ? s.capacity : 0
    }))

    return {
      selectedCustomer: null,
      map: null,
      supplierMarkers: {},
      activeSupplier: null,
      radiusCircle: null,

      suppliersState: initialSuppliers,

      quoteForm: {
        quantity: 10,
        distanceMode: 'direct', // 'direct' | 'driving'
        freightRate: 0.82,
        drivingFactor: 1.15,
        topNForAccurate: 5
      },
      loading: false,
      _quoteToken: 0,

      quoteResults: [],
      recommendation: null,

      dispatchPlan: {
        allocations: [],
        allocationBySupplierId: new Set(),
        totalQuantity: 0,
        totalCost: 0,
        remainingShortage: 0
      },
      dispatchOrders: [],

      chartInstance: null,
      resizeHandler: null,
      routeDistanceCache: new Map(),
      outsideClickHandler: null
    }
  },

  computed: {
    activeSupplierQuote() {
      if (!this.activeSupplier || !Array.isArray(this.quoteResults) || this.quoteResults.length === 0) return null
      return this.quoteResults.find(r => r.supplier.id === this.activeSupplier.id) || null
    },
    activeSupplierAllocation() {
      if (!this.activeSupplier || !this.dispatchPlan || !Array.isArray(this.dispatchPlan.allocations)) return null
      return this.dispatchPlan.allocations.find(a => a.supplierId === this.activeSupplier.id) || null
    }
  },

  async mounted() {
    await this.waitForAMapReady()
    this.$nextTick(() => {
      setTimeout(() => {
        this.initMap()
      }, 100)
    })

    // ECharts tooltip/axisPointer 弹层：用户点击图表以外则关闭
    this.outsideClickHandler = (e) => {
      try {
        if (!this.chartInstance) return
        const chartEl = this.$refs.chartRef
        // 点击发生在图表容器内：不关闭
        if (chartEl && chartEl.contains(e.target)) return

        // ECharts v6: hideTip 在某些 trigger 下不能完全清理 axisPointer
        // 这里用 showTip(dataIndex:-1) 作为强制回收方案
        setTimeout(() => {
          try {
            const ci = this.chartInstance
            if (!ci) return
            // 先隐藏 tooltip，再通过 showTip(-1) 回收 axisPointer/hover 状态
            ci.dispatchAction({ type: 'hideTip' })
            ci.dispatchAction({ type: 'showTip', seriesIndex: 0, dataIndex: -1 })
            // 兼容性：downplay 一并触发（无效果也不影响）
            ci.dispatchAction({ type: 'downplay', seriesIndex: 0, dataIndex: -1 })

            // 更强制：临时关掉 tooltip（trigger + show），避免 axisPointer 停留
            ci.setOption({ tooltip: { trigger: 'none', show: false } }, false)
            setTimeout(() => {
              try {
                ci.setOption({ tooltip: { trigger: 'axis', show: true } }, false)
              } catch (err3) {}
            }, 30)
          } catch (err2) {}
        }, 0)
      } catch (err) {
        // 忽略：避免影响主流程
      }
    }
    document.addEventListener('click', this.outsideClickHandler, true)
    document.addEventListener('mousedown', this.outsideClickHandler, true)
    document.addEventListener('pointerdown', this.outsideClickHandler, true)
  },

  watch: {
    // 数量变化时：不重新算运距，直接重排分配（更快）
    'quoteForm.quantity': function () {
      this.buildDispatchPlan()
      this.renderChart()
    }
  },

  methods: {
    resetQuote() {
      this.quoteForm.quantity = 10
      this.quoteForm.distanceMode = 'direct'
      this.quoteForm.freightRate = 0.82
      this.quoteForm.drivingFactor = 1.15
      this.quoteForm.topNForAccurate = 5
      this.routeDistanceCache.clear()
      this.calculateQuote()
    },

    formatDate(iso) {
      try {
        const d = new Date(iso)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      } catch (e) {
        return iso
      }
    },

    waitForAMapReady() {
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
    },

    initMap() {
      this.map = new AMap.Map('map', {
        zoom: 5,
        center: [114, 36],
        viewMode: '3D'
      })

      // 添加供应商（默认绿色/蓝色标记）
      this.suppliersState.forEach(s => {
        if (!isValidNumber(s.lat) || !isValidNumber(s.lng)) return
        const marker = new AMap.Marker({
          position: [s.lng, s.lat],
          icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png'
        })
        setTimeout(() => {
          marker.setLabel({
            content: `${s.name.split('（')[0]}`,
            offset: new AMap.Pixel(0, -10)
          })
        }, 100)
        this.map.add(marker)
        this.supplierMarkers[s.id] = marker
        marker.on('click', () => this.handleSupplierClick(s))
      })

      // 添加客户（蓝色）
      seedCustomers.forEach(c => {
        if (!isValidNumber(c.lat) || !isValidNumber(c.lng)) return
        const marker = new AMap.Marker({
          position: [c.lng, c.lat],
          icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_o.png'
        })
        setTimeout(() => {
          marker.setLabel({ content: c.name, offset: new AMap.Pixel(0, -10) })
        }, 100)
        marker.on('click', () => this.handleCustomerClick(c))
        this.map.add(marker)
      })

      this.updateSupplierMarkersLabel()
    },

    handleCustomerClick(customer) {
      this.selectedCustomer = customer
      this.activeSupplier = null
      this.drawRadiusCircle(customer)
      this.calculateQuote()
    },

    handleSupplierClick(supplier) {
      this.activeSupplier = supplier
    },

    drawRadiusCircle(customer) {
      if (!this.map || !customer) return
      if (this.radiusCircle) {
        try {
          this.map.remove(this.radiusCircle)
        } catch (e) {}
        this.radiusCircle = null
      }

      const radiusKm = Number(customer.radius)
      if (!Number.isFinite(radiusKm) || radiusKm <= 0) return

      try {
        this.radiusCircle = new AMap.Circle({
          center: [customer.lng, customer.lat],
          radius: radiusKm * 1000,
          strokeColor: '#1890ff',
          strokeWeight: 2,
          strokeOpacity: 0.9,
          fillColor: '#1890ff',
          fillOpacity: 0.12
        })
        this.map.add(this.radiusCircle)
      } catch (e) {
        // 若 Circle 不可用，则不影响主流程
      }
    },

    calculateQuote() {
      if (!this.selectedCustomer) return
      const token = Date.now()
      this._quoteToken = token
      this.loading = this.quoteForm.distanceMode === 'driving'

      const customer = this.selectedCustomer

      // 先用“直线距离”做快速筛选/初始排序
      const candidates = []
      for (const s of this.suppliersState) {
        if (!isValidNumber(s.lat) || !isValidNumber(s.lng)) continue
        const directKm = this.getDistanceKmDirect(customer.lat, customer.lng, s.lat, s.lng)
        if (directKm > customer.radius) continue

        const estimatedDistanceKm =
          this.quoteForm.distanceMode === 'direct'
            ? directKm * this.quoteForm.drivingFactor
            : directKm * this.quoteForm.drivingFactor

        const freightCostPerTon = estimatedDistanceKm * this.quoteForm.freightRate
        const unitCost = s.price + freightCostPerTon

        candidates.push({
          supplier: s,
          directDistanceKm: directKm,
          estimatedDistanceKm,
          freightCostPerTon,
          unitCost
        })
      }

      candidates.sort((a, b) => a.unitCost - b.unitCost)

      // 道路运距：只对成本前 N 个做真实运距请求（保证“迅速”）
      const maybeRecalc = async () => {
        if (this.quoteForm.distanceMode !== 'driving') return candidates

        const topN = Math.max(1, Number(this.quoteForm.topNForAccurate) || 5)
        const topItems = candidates.slice(0, topN)
        await Promise.all(
          topItems.map(async (item) => {
            const actualKm = await this.getDrivingDistanceKm(customer, item.supplier, item.directDistanceKm)
            if (this._quoteToken !== token) return
            item.estimatedDistanceKm = actualKm
            item.freightCostPerTon = actualKm * this.quoteForm.freightRate
            item.unitCost = item.supplier.price + item.freightCostPerTon
          })
        )

        if (this._quoteToken !== token) return candidates
        candidates.sort((a, b) => a.unitCost - b.unitCost)
        return candidates
      }

      ;(async () => {
        try {
          const results = await maybeRecalc()
          if (this._quoteToken !== token) return
          this.quoteResults = results
          this.recommendation = results[0] || null
          this.buildDispatchPlan()
          this.$nextTick(() => this.renderChart())
        } finally {
          if (this._quoteToken === token) this.loading = false
        }
      })()
    },

    buildDispatchPlan() {
      const q = Number(this.quoteForm.quantity) || 0
      const results = Array.isArray(this.quoteResults) ? this.quoteResults : []

      // 用“当前报价结果”的排序直接做贪心分配
      let remaining = q
      const allocations = []
      const allocationBySupplierId = new Set()

      for (const r of results) {
        if (remaining <= 0) break
        const cap = Number(r.supplier.capacityRemaining) || 0
        if (cap <= 0) continue
        const amount = Math.min(remaining, cap)
        if (amount <= 0) continue

        allocations.push({
          supplierId: r.supplier.id,
          name: r.supplier.name,
          amount,
          unitCost: r.unitCost,
          distanceKm: r.estimatedDistanceKm,
          freightPerTon: r.freightCostPerTon
        })
        allocationBySupplierId.add(r.supplier.id)
        remaining -= amount
      }

      const totalQuantity = q - remaining
      const totalCost = allocations.reduce((sum, a) => sum + a.unitCost * a.amount, 0)

      this.dispatchPlan = {
        allocations,
        allocationBySupplierId,
        totalQuantity,
        totalCost,
        remainingShortage: remaining
      }
    },

    async getDrivingDistanceKm(customer, supplier, directFallbackKm) {
      const cacheKey = `${customer.id}-${supplier.id}-driving`
      if (this.routeDistanceCache.has(cacheKey)) return this.routeDistanceCache.get(cacheKey)

      // 如果 AMap Driving 不可用：直接走“直线+系数”
      if (!window.AMap || typeof AMap.Driving !== 'function') {
        const fallback = directFallbackKm * this.quoteForm.drivingFactor
        this.routeDistanceCache.set(cacheKey, fallback)
        return fallback
      }

      const origin = new AMap.LngLat(customer.lng, customer.lat)
      const destination = new AMap.LngLat(supplier.lng, supplier.lat)

      const fallback = directFallbackKm * this.quoteForm.drivingFactor

      return new Promise((resolve) => {
        let finished = false
        const timeoutMs = 8000
        const timeoutId = setTimeout(() => {
          if (finished) return
          finished = true
          this.routeDistanceCache.set(cacheKey, fallback)
          resolve(fallback)
        }, timeoutMs)

        try {
          const drivingOptions = {
            map: this.map,
            showTraffic: false,
            autoFitView: false
          }
          if (AMap.DrivingPolicy && typeof AMap.DrivingPolicy === 'function') {
            drivingOptions.policy = AMap.DrivingPolicy.LEAST_TIME
          }

          const driving = new AMap.Driving(drivingOptions)
          driving.search(origin, destination, (status, result) => {
            if (finished) return
            finished = true
            clearTimeout(timeoutId)

            if (status === 'complete' && result && Array.isArray(result.routes) && result.routes[0]) {
              const meters = result.routes[0].distance
              const km = meters / 1000
              const safeKm = Number.isFinite(km) ? km : fallback
              this.routeDistanceCache.set(cacheKey, safeKm)
              resolve(safeKm)
            } else {
              this.routeDistanceCache.set(cacheKey, fallback)
              resolve(fallback)
            }
          })
        } catch (e) {
          clearTimeout(timeoutId)
          this.routeDistanceCache.set(cacheKey, fallback)
          resolve(fallback)
        }
      })
    },

    getDistanceKmDirect(lat1, lng1, lat2, lng2) {
      const p1 = new AMap.LngLat(lng1, lat1)
      const p2 = new AMap.LngLat(lng2, lat2)
      return Math.round(p1.distance(p2)) / 1000 // km
    },

    renderChart() {
      if (!this.$refs.chartRef) return
      const results = Array.isArray(this.quoteResults) ? this.quoteResults : []

      if (!this.chartInstance) {
        this.chartInstance = echarts.init(this.$refs.chartRef)
      }

      const allocatedIds = this.dispatchPlan && this.dispatchPlan.allocationBySupplierId
        ? this.dispatchPlan.allocationBySupplierId
        : new Set()

      const categories = results.map(d => d.supplier.name.split('（')[0])
      const seriesData = results.map((d) => {
        const isRec = this.recommendation && this.recommendation.supplier.id === d.supplier.id
        const isAllocated = allocatedIds.has(d.supplier.id)
        let color = '#1890ff'
        if (isRec) color = '#52c41a'
        else if (isAllocated) color = '#faad14'
        return { value: d.unitCost, color }
      })

      const option = {
        tooltip: {
          trigger: 'axis',
          formatter: (items) => {
            const idx = items && items[0] ? items[0].dataIndex : 0
            const r = results[idx]
            if (!r) return ''
            return [
              `供应商：${categories[idx]}`,
              `单吨成本：¥${toFixedSafe(r.unitCost, 2)}`,
              `运距：${toFixedSafe(r.estimatedDistanceKm, 1)} km`,
              `运费/吨：¥${toFixedSafe(r.freightCostPerTon, 2)}`,
              `可供：${toFixedSafe(r.supplier.capacityRemaining, 1)} 吨`
            ].join('<br/>')
          }
        },
        grid: { left: 40, right: 20, top: 20, bottom: 50 },
        xAxis: { type: 'category', data: categories, axisLabel: { interval: 0, rotate: 20 } },
        yAxis: { type: 'value', name: '单吨成本 (元/吨)' },
        series: [
          {
            type: 'bar',
            data: seriesData.map((d) => ({
              value: d.value,
              itemStyle: { color: d.color }
            }))
          }
        ]
      }

      this.chartInstance.setOption(option, true)

      if (!this.resizeHandler) {
        this.resizeHandler = () => this.chartInstance && this.chartInstance.resize()
        window.addEventListener('resize', this.resizeHandler)
      }
    },

    updateSupplierMarkersLabel() {
      for (const s of this.suppliersState) {
        const marker = this.supplierMarkers[s.id]
        if (!marker) continue
        marker.setLabel({
          content: `${s.name.split('（')[0]}（剩余:${toFixedSafe(s.capacityRemaining, 0)}吨）`,
          offset: new AMap.Pixel(0, -10)
        })
      }
    },

    confirmDispatch() {
      if (!this.selectedCustomer) return
      if (!this.dispatchPlan || this.dispatchPlan.remainingShortage > 0) return

      // 扣减产能（模拟“调货”）
      for (const a of this.dispatchPlan.allocations) {
        const s = this.suppliersState.find(x => x.id === a.supplierId)
        if (!s) continue
        s.capacityRemaining = Math.max(0, Number(s.capacityRemaining) - a.amount)
      }

      this.dispatchOrders.unshift({
        id: Date.now(),
        customer: this.selectedCustomer,
        quantity: Number(this.quoteForm.quantity) || 0,
        allocations: this.dispatchPlan.allocations.map(a => ({ ...a })),
        totalCost: this.dispatchPlan.totalCost,
        createdAt: new Date().toISOString()
      })

      this.updateSupplierMarkersLabel()

      // 调货后重新计算（容量会影响可分配供应商）
      this.calculateQuote()
    }
  },

  beforeUnmount() {
    if (this.resizeHandler) window.removeEventListener('resize', this.resizeHandler)
    if (this.chartInstance) {
      this.chartInstance.dispose()
      this.chartInstance = null
    }
    if (this.map) this.map.destroy()
    if (this.outsideClickHandler) document.removeEventListener('click', this.outsideClickHandler, true)
    if (this.outsideClickHandler) document.removeEventListener('mousedown', this.outsideClickHandler, true)
    if (this.outsideClickHandler) document.removeEventListener('pointerdown', this.outsideClickHandler, true)
  }
}
</script>

<style scoped>
.app {
  width: 100vw;
  height: 100vh;
  display: flex;
  position: relative;
  overflow: hidden;
}

/* 地图区域 */
.map {
  flex: 1;
  height: 100%;
  background: #f0f0f0;
  /* 确保地图不会溢出 */
  position: relative;
  z-index: 1; /* 显式降低层级 */
}

/* 右侧面板 —— 关键修复 */
.panel {
  position: absolute; /* 脱离文档流，避免被挤压 */
  top: 0;
  left: 0;
  bottom: 0;
  width: 30%;
  height: 70%;
  max-width: 500px;
  min-width: 200px;
  padding: 20px;
  background: white;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.15);
  overflow-y: auto;
  border-left: 1px solid #ddd;
  z-index: 1000; /* ⭐⭐⭐ 关键：高于地图 */
}

.chart {
  width: 100%;
  height: 300px;
  margin: 20px 0;
}

.chart-wrap {
  margin-top: 6px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.label {
  min-width: 100px;
  font-size: 14px;
  color: #333;
}

.input {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  outline: none;
}

.input.small {
  max-width: 90px;
}

.select {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  outline: none;
  background: white;
}

.btn {
  padding: 10px 14px;
  background: #1890ff;
  color: white;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  flex: 1;
}

.btn.secondary {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #e8e8e8;
}

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.warn {
  color: #d46b08;
  font-weight: 600;
}

.section-title {
  margin: 18px 0 10px;
  font-size: 16px;
  font-weight: 700;
  color: #111;
}

.list {
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 10px;
  background: #fff;
}

.supplier-row {
  display: flex;
  gap: 12px;
  padding: 10px 8px;
  border-bottom: 1px dashed #eee;
  align-items: center;
}

.supplier-row:last-child {
  border-bottom: 0;
}

.supplier-left {
  flex: 1.2;
}

.supplier-name {
  font-weight: 800;
  font-size: 14px;
  color: #111;
}

.supplier-meta {
  margin-top: 6px;
  font-size: 12px;
  color: #555;
}

.supplier-mid {
  flex: 1.4;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: #444;
}

.supplier-right {
  flex: 0.9;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

.cell {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.unit-cost {
  font-weight: 900;
  color: #0b6bcb;
  font-size: 14px;
  text-align: right;
}

.badges {
  display: flex;
  gap: 8px;
}

.badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.badge.ok {
  background: rgba(82, 196, 26, 0.15);
  border: 1px solid rgba(82, 196, 26, 0.35);
  color: #2f9e44;
}

.badge.warn2 {
  background: rgba(250, 173, 20, 0.15);
  border: 1px solid rgba(250, 173, 20, 0.35);
  color: #ad6b00;
}

.empty {
  padding: 12px 8px;
  color: #777;
  font-size: 13px;
}

.alloc {
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 10px;
  background: #fff;
}

.alloc-row {
  display: flex;
  gap: 10px;
  padding: 10px 6px;
  border-bottom: 1px dashed #eee;
}

.alloc-row:last-child {
  border-bottom: 0;
}

.alloc-name {
  flex: 1.4;
  font-weight: 800;
  font-size: 13px;
}

.alloc-qty {
  width: 90px;
  font-weight: 700;
}

.alloc-unit {
  width: 120px;
  color: #444;
  font-size: 12px;
}

.alloc-sub {
  width: 130px;
  color: #0b6bcb;
  font-weight: 800;
  font-size: 12px;
}

.orders {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.order-card {
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 10px;
  background: #fff;
}

.order-top {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  font-size: 13px;
}

.order-body {
  margin-top: 10px;
}

.order-line {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  padding: 6px 0;
  border-top: 1px dashed #eee;
}

.order-line:first-child {
  border-top: 0;
}

.order-foot {
  margin-top: 10px;
  font-size: 12px;
  color: #666;
}

.supplier-card {
  margin-top: 14px;
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 10px;
  background: #fff;
}

.supplier-card-top {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
}

.supplier-card-title {
  font-size: 14px;
  font-weight: 900;
}

.small-btn {
  flex: 0 0 auto;
  padding: 7px 10px;
  border-radius: 8px;
}

.supplier-card-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 0;
  font-size: 13px;
  color: #333;
}

.supplier-card-block {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed #eee;
}

.supplier-card-block-title {
  font-size: 13px;
  font-weight: 900;
  margin-bottom: 6px;
}

.history {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  padding: 8px;
  border-radius: 8px;
  background: #fafafa;
  border: 1px solid #f1f1f1;
}

.history-top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
  color: #444;
  margin-bottom: 4px;
}

.history-sub {
  font-size: 12px;
  color: #666;
}

.recommend {
  padding: 10px;
  background: #f0fff0;
  border: 1px dashed #4caf50;
  border-radius: 4px;
  margin-top: 20px;
}

.hint {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.95);
  padding: 10px 15px;
  border-radius: 6px;
  font-size: 14px;
  z-index: 1001;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

/* 响应式：小屏时面板从底部弹出 */
@media (max-width: 768px) {
  .panel {
    width: 100%;
    max-width: none;
    min-width: 100%;
    top: auto;
    bottom: 0;
    right: 0;
    left: 0;
    height: 60vh; /* 占屏幕60%高度 */
    border-left: none;
    border-top: 1px solid #ddd;
    z-index: 1000;
  }
}

@media (max-width: 480px) {
  .panel {
    padding: 15px;
    height: 70vh;
  }
  .chart {
    height: 220px;
  }
}
</style>