import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
// 全局引入 ECharts
import * as echarts from 'echarts'
window.echarts = echarts

createApp(App).mount('#app')