<template>
  <div class="app">
    <!-- 先渲染地图 -->
    <div id="map" class="map"></div>

    <!-- 再渲染面板（靠 z-index 覆盖） -->
    <div v-if="selectedCustomer" class="panel">
      <h2>{{ selectedCustomer.name }} - 智能分析</h2>
      <div ref="chartRef" class="chart"></div>
      <div v-if="recommendation" class="recommend">
        <p>✅ 推荐供应商：<strong>{{ recommendation.name }}</strong></p>
        <p>总成本：¥{{ recommendation.totalCost.toFixed(1) }}/吨</p>
      </div>
    </div>

    <div v-else class="hint">👈 请点击蓝色客户点</div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { suppliers, customers } from './data.js'

const UNIT_FREIGHT = 0.82 // 元/吨·公里

function isValidNumber(val) {
  return typeof val === 'number' && !isNaN(val) && isFinite(val)
}

export default {
  data() {
    return {
      selectedCustomer: null,
      recommendation: null,
      nearbySuppliers: [],
      map: null
    }
  },

  async mounted() {
    await this.waitForAMapReady()
    this.$nextTick(() => {
      setTimeout(() => {
        this.initMap()
      }, 100)
    })
  },

  methods: {
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

      // 添加供应商（绿色）
      suppliers.forEach(s => {
        if (!isValidNumber(s.lat) || !isValidNumber(s.lng)) return
        const marker = new AMap.Marker({
          position: [s.lng, s.lat],
          icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png'
        })
        setTimeout(() => {
          marker.setLabel({ content: s.name.split('（')[0], offset: new AMap.Pixel(0, -10) })
        }, 100)
        this.map.add(marker)
      })

      // 添加客户（蓝色）
      customers.forEach(c => {
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
    },

    handleCustomerClick(customer) {
      this.selectedCustomer = customer
      this.analyzeCustomer(customer)
    },

    analyzeCustomer(customer) {
      const results = []
      suppliers.forEach(s => {
        if (!isValidNumber(s.lat) || !isValidNumber(s.lng)) return
        const dist = this.getDistance(customer.lat, customer.lng, s.lat, s.lng)
        if (dist <= customer.radius) {
          const totalCost = s.price + dist * UNIT_FREIGHT
          results.push({ ...s, distance: dist, totalCost })
        }
      })
      results.sort((a, b) => a.totalCost - b.totalCost)
      this.nearbySuppliers = results
      this.recommendation = results[0] || null
      this.$nextTick(() => {
        this.renderChart(results)
      })
    },

    getDistance(lat1, lng1, lat2, lng2) {
      const p1 = new AMap.LngLat(lng1, lat1)
      const p2 = new AMap.LngLat(lng2, lat2)
      return Math.round(p1.distance(p2)) / 1000 // km
    },

    renderChart(data) {
      const chart = echarts.init(this.$refs.chartRef)
      const option = {
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: data.map(d => d.name.split('（')[0]) },
        yAxis: { type: 'value', name: '成本 (元/吨)' },
        series: [{
          type: 'bar',
          data: data.map(d => ({
            value: d.totalCost,
            itemStyle: { color: d === this.recommendation ? '#52c41a' : '#1890ff' }
          }))
        }]
      }
      chart.setOption(option)
      window.addEventListener('resize', () => chart.resize())
    }
  },

  beforeUnmount() {
    if (this.map) {
      this.map.destroy()
    }
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