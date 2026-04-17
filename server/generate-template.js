// 脚本用于生成 Excel 示例模板
// 运行：node server/generate-template.js

import XLSX from 'xlsx'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 示例数据
const suppliersData = [
  { id: 1, name: '华能生物质（河北）', lat: 39.9042, lng: 116.4074, price: 285, capacity: 5000, phone: '0311-8888-0001' },
  { id: 2, name: '绿源能源（天津）', lat: 39.1230, lng: 117.2010, price: 278, capacity: 3000, phone: '022-8888-0002' },
  { id: 3, name: '中原燃料（河南）', lat: 34.7466, lng: 113.6254, price: 265, capacity: 4000, phone: '0371-8888-0003' },
  { id: 4, name: '长江生物质（武汉）', lat: 30.5928, lng: 114.3055, price: 252, capacity: 4200, phone: '027-8888-0004' },
  { id: 5, name: '川渝燃料（成都）', lat: 30.5728, lng: 104.0668, price: 248, capacity: 5200, phone: '028-8888-0005' }
]

const customersData = [
  { id: 1, name: '北京新能源集团', lat: 39.9123, lng: 116.3987, radius: 300 },
  { id: 2, name: '上海绿色动力', lat: 31.2304, lng: 121.4737, radius: 200 }
]

const historyData = [
  { supplier_id: 1, year: 2025, month: 8, volume: 1200, note: '稳定供货，价格波动小' },
  { supplier_id: 1, year: 2025, month: 11, volume: 980, note: '按期交付，无违约记录' },
  { supplier_id: 2, year: 2025, month: 7, volume: 760, note: '短期补单能力强' },
  { supplier_id: 3, year: 2025, month: 9, volume: 1100, note: '大单响应快，合作评分高' }
]

// 创建工作簿
const workbook = XLSX.utils.book_new()

// 创建供应商 Sheet
const suppliersWorksheet = XLSX.utils.json_to_sheet(suppliersData, {
  header: ['id', 'name', 'lat', 'lng', 'price', 'capacity', 'phone']
})
XLSX.utils.book_append_sheet(workbook, suppliersWorksheet, '供应商')

// 创建客户 Sheet
const customersWorksheet = XLSX.utils.json_to_sheet(customersData, {
  header: ['id', 'name', 'lat', 'lng', 'radius']
})
XLSX.utils.book_append_sheet(workbook, customersWorksheet, '客户')

// 创建合作记录 Sheet
const historyWorksheet = XLSX.utils.json_to_sheet(historyData, {
  header: ['supplier_id', 'year', 'month', 'volume', 'note']
})
XLSX.utils.book_append_sheet(workbook, historyWorksheet, '合作记录')

// 保存文件
const outputPath = path.join(__dirname, '../templates/供应商数据模板.xlsx')
const templateDir = path.join(__dirname, '../templates')

if (!fs.existsSync(templateDir)) {
  fs.mkdirSync(templateDir, { recursive: true })
}

XLSX.writeFile(workbook, outputPath)
console.log(`✅ Excel 模板已生成：${outputPath}`)
