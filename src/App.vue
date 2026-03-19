<template>
  <div id="app" style="display: flex; height: 100vh">
    <div id="map" style="flex: 1; min-width: 60%"></div>
    <div id="panel" style="width: 40%; padding: 20px; background: #f9f9f9; overflow-y: auto">
      <h3>报价分析面板</h3>
      <div v-if="selectedCustomer">
        <p><strong>客户：</strong>{{ selectedCustomer.name }}</p>
        <p><strong>搜索半径：</strong>{{ selectedCustomer.radius }} km</p>
        <div id="chart" style="width: 100%; height: 300px; margin-top: 20px"></div>
        <div v-if="recommendation" style="margin-top: 20px; padding: 10px; background: #e6f7ff">
          <h4>💡 推荐方案</h4>
          <p>供应商：<strong>{{ recommendation.name }}</strong></p>
          <p>出厂价：¥{{ recommendation.price }}/吨</p>
          <p>运距：{{ recommendation.distance.toFixed(1) }} km</p>
          <p>运费：¥{{ (recommendation.distance * unitFreight).toFixed(1) }}/吨</p>
          <p><strong>总成本：¥{{ recommendation.totalCost.toFixed(1) }}/吨</strong></p>
          <button @click="generateQuote" style="margin-top: 10px; padding: 5px 10px">生成报价建议</button>
        </div>
      </div>
      <div v-else>
        <p>请点击地图上的<strong>蓝色客户点</strong>开始分析</p>
      </div>
    </div>
  </div>
</template>

<script>
import { suppliers, customers } from './data.js'

const UNIT_FREIGHT = 0.8 // 元/公里/吨
let map = null
let chart = null

export default {
  data() {
    return {
      selectedCustomer: null,
      recommendation: null,
      unitFreight: UNIT_FREIGHT,
      nearbySuppliers: []
    }
  },
  mounted() {
    this.initMap()
  },
  methods: {
    initMap() {
      map = new AMap.Map('map', {
        zoom: 10,
        center: [116.4074, 39.9042]
      })

      // 添加供应商（绿色）
      suppliers.forEach(s => {
        const marker = new AMap.Marker({
          position: [s.lng, s.lat],
          title: s.name,
          icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png' // 绿色默认图标
        })
        marker.setLabel({ content: s.name, direction: 'top' })
        map.add(marker)
      })

      // 添加客户（蓝色）
      customers.forEach(c => {
        const marker = new AMap.Marker({
          position: [c.lng, c.lat],
          title: c.name,
          icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_o.png' // 蓝色图标
        })
        marker.setLabel({ content: c.name, direction: 'top' })
        marker.on('click', () => this.analyzeCustomer(c))
        map.add(marker)
      })
    },

    getDistance(lat1, lng1, lat2, lng2) {
      const p1 = new AMap.LngLat(lng1, lat1)
      const p2 = new AMap.LngLat(lng2, lat2)
      return Math.round(p1.distance(p2)) / 1000 // 返回公里
    },

    analyzeCustomer(customer) {
      this.selectedCustomer = customer
      const results = []

      suppliers.forEach(s => {
        const dist = this.getDistance(customer.lat, customer.lng, s.lat, s.lng)
        if (dist <= customer.radius) {
          const totalCost = s.price + dist * this.unitFreight
          results.push({ ...s, distance: dist, totalCost })
        }
      })

      // 按总成本升序
      results.sort((a, b) => a.totalCost - b.totalCost)
      this.nearbySuppliers = results
      this.recommendation = results[0] || null

      this.renderChart(results)
    },

    renderChart(data) {
      if (!data.length) return
      if (!chart) {
        chart = echarts.init(document.getElementById('chart'))
      }

      const option = {
        tooltip: {},
        xAxis: { type: 'category', data: data.map(d => d.name) },
        yAxis: { type: 'value', name: '总成本 (元/吨)' },
        series: [{
          type: 'bar',
          data: data.map(d => ({
            value: d.totalCost,
            itemStyle: { color: d === this.recommendation ? '#52c41a' : '#1890ff' }
          }))
        }]
      }
      chart.setOption(option)
    },

    generateQuote() {
      if (!this.recommendation) return
      const quote = `
【客户】${this.selectedCustomer.name}
【推荐供应商】${this.recommendation.name}
【建议报价】¥${this.recommendation.totalCost.toFixed(1)}/吨（含运费）
【备注】距离 ${this.recommendation.distance.toFixed(1)}km，出厂价 ¥${this.recommendation.price}/吨
`
      alert('报价建议已生成（控制台也可查看）')
      console.log(quote)
      // TODO: 可扩展为下载 PDF 或复制到剪贴板
    }
  }
}
</script>