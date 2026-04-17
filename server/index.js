import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import * as XLSX from 'xlsx'
import db, { supplierOps, customerOps, dispatchOps } from './database.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const PORT = process.env.PORT || 3001

// 中间件
app.use(cors())
app.use(express.json())

// 创建 uploads 目录
const uploadsDir = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// 创建 data 目录（确保已存在）
const dataDir = path.join(__dirname, '../data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// 配置 multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `excel-${Date.now()}${ext}`)
  }
})

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (ext === '.xlsx' || ext === '.xls') {
      cb(null, true)
    } else {
      cb(new Error('只支持 Excel 文件 (.xlsx, .xls)'))
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
})

// ===== 供应商 API =====

// 获取所有供应商
app.get('/api/suppliers', async (req, res) => {
  try {
    const suppliers = supplierOps.getAll()
    res.json(suppliers)
  } catch (error) {
    console.error('获取供应商失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 获取单个供应商
app.get('/api/suppliers/:id', async (req, res) => {
  try {
    const supplier = supplierOps.getById(req.params.id)
    if (!supplier) {
      return res.status(404).json({ error: '供应商不存在' })
    }
    res.json(supplier)
  } catch (error) {
    console.error('获取供应商失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 创建供应商
app.post('/api/suppliers', async (req, res) => {
  try {
    const supplier = await supplierOps.create(req.body)
    res.status(201).json(supplier)
  } catch (error) {
    console.error('创建供应商失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 更新供应商
app.put('/api/suppliers/:id', async (req, res) => {
  try {
    const supplier = await supplierOps.update(req.params.id, req.body)
    if (!supplier) {
      return res.status(404).json({ error: '供应商不存在' })
    }
    res.json(supplier)
  } catch (error) {
    console.error('更新供应商失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 删除供应商
app.delete('/api/suppliers/:id', async (req, res) => {
  try {
    const result = await supplierOps.delete(req.params.id)
    res.json({ success: true, changes: result.changes })
  } catch (error) {
    console.error('删除供应商失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 批量创建/更新供应商
app.post('/api/suppliers/bulk', async (req, res) => {
  try {
    const { suppliers } = req.body
    if (!Array.isArray(suppliers)) {
      return res.status(400).json({ error: 'suppliers 必须是数组' })
    }
    const count = await supplierOps.bulkInsert(suppliers)
    res.json({ success: true, count })
  } catch (error) {
    console.error('批量操作失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// ===== 客户 API =====

// 获取所有客户
app.get('/api/customers', async (req, res) => {
  try {
    const customers = customerOps.getAll()
    res.json(customers)
  } catch (error) {
    console.error('获取客户失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 获取单个客户
app.get('/api/customers/:id', async (req, res) => {
  try {
    const customer = customerOps.getById(req.params.id)
    if (!customer) {
      return res.status(404).json({ error: '客户不存在' })
    }
    res.json(customer)
  } catch (error) {
    console.error('获取客户失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 创建客户
app.post('/api/customers', async (req, res) => {
  try {
    const customer = await customerOps.create(req.body)
    res.status(201).json(customer)
  } catch (error) {
    console.error('创建客户失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 更新客户
app.put('/api/customers/:id', async (req, res) => {
  try {
    const customer = await customerOps.update(req.params.id, req.body)
    if (!customer) {
      return res.status(404).json({ error: '客户不存在' })
    }
    res.json(customer)
  } catch (error) {
    console.error('更新客户失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 删除客户
app.delete('/api/customers/:id', async (req, res) => {
  try {
    const result = await customerOps.delete(req.params.id)
    res.json({ success: true, changes: result.changes })
  } catch (error) {
    console.error('删除客户失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 批量创建/更新客户
app.post('/api/customers/bulk', async (req, res) => {
  try {
    const { customers } = req.body
    if (!Array.isArray(customers)) {
      return res.status(400).json({ error: 'customers 必须是数组' })
    }
    const count = await customerOps.bulkInsert(customers)
    res.json({ success: true, count })
  } catch (error) {
    console.error('批量操作失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// ===== Excel 上传 API =====

// 辅助函数：标准化表头
function normalizeHeaderKey(key) {
  if (key === null || key === undefined) return ''
  return String(key)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[()（）\[\]【】]/g, '')
    .replace(/[_\-]/g, '')
}

function pickValue(headerMap, keys) {
  for (const k of keys) {
    const nk = normalizeHeaderKey(k)
    if (nk in headerMap) return headerMap[nk]
  }
  return undefined
}

function buildHeaderMap(rowObj) {
  const headerMap = {}
  for (const propKey of Object.keys(rowObj || {})) {
    const nk = normalizeHeaderKey(propKey)
    if (!nk) continue
    headerMap[nk] = rowObj[propKey]
  }
  return headerMap
}

function parseId(v) {
  const raw = v === null || v === undefined ? '' : String(v).trim()
  if (!raw) return ''
  const n = Number(raw)
  return Number.isFinite(n) ? n : raw
}

function toNumber(v) {
  const raw = v === null || v === undefined ? '' : String(v).trim()
  if (raw === '') return NaN
  const n = Number(raw)
  return Number.isFinite(n) ? n : NaN
}

// 上传并解析 Excel
app.post('/api/excel/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的文件' })
    }

    const filePath = req.file.path
    const workbook = XLSX.readFile(filePath)

    // 查找 sheet
    const findSheet = (keywords) => {
      const targets = keywords.map(k => k.toLowerCase().replace(/[\s_\-()（）\[\]【】]/g, ''))
      let best = null
      let bestScore = -1

      for (const sheetName of workbook.SheetNames) {
        const ns = sheetName.toLowerCase().replace(/[\s_\-()（）\[\]【】]/g, '')
        let score = 0
        for (const t of targets) {
          if (!t) continue
          if (ns === t) score += 10
          else if (ns.includes(t)) score += 3
        }
        if (score > bestScore) {
          bestScore = score
          best = workbook.Sheets[sheetName]
        }
      }
      return best
    }

    const suppliersSheet = findSheet(['suppliers', 'supplier', '供应商', '厂家'])
    const customersSheet = findSheet(['customers', 'customer', '客户'])
    const historySheet = findSheet(['supplierhistory', 'history', '合作记录', '历史合作', '供应商历史'])

    const suppliersRows = suppliersSheet ? XLSX.utils.sheet_to_json(suppliersSheet, { defval: '', raw: true }) : []
    const customersRows = customersSheet ? XLSX.utils.sheet_to_json(customersSheet, { defval: '', raw: true }) : []
    const historyRows = historySheet ? XLSX.utils.sheet_to_json(historySheet, { defval: '', raw: true }) : []

    // 处理历史记录
    const supplierHistoryById = new Map()
    for (const row of historyRows) {
      const headerMap = buildHeaderMap(row)
      const supplierId = parseId(pickValue(headerMap, ['supplierid', 'supplier_id', '供应商 id', '厂家 id']))
      if (!supplierId) continue

      const year = toNumber(pickValue(headerMap, ['year', '年份']))
      const month = toNumber(pickValue(headerMap, ['month', '月份']))
      const volume = toNumber(pickValue(headerMap, ['volume', 'vol', '量', '合作量']))
      const note = pickValue(headerMap, ['note', 'remark', '备注']) || ''

      if (!supplierHistoryById.has(supplierId)) supplierHistoryById.set(supplierId, [])
      supplierHistoryById.get(supplierId).push({
        id: `${supplierId}-${year}-${month}`,
        year: Number.isFinite(year) ? year : '',
        month: Number.isFinite(month) ? String(month).padStart(2, '0') : '',
        volume: Number.isFinite(volume) ? volume : 0,
        note: String(note)
      })
    }

    // 解析供应商
    const suppliers = []
    for (const row of suppliersRows) {
      const headerMap = buildHeaderMap(row)
      const id = parseId(pickValue(headerMap, ['id', 'supplierid', '供应商 id']))
      const name = pickValue(headerMap, ['name', 'suppliername', '供应商名称', '厂名'])
      const lat = toNumber(pickValue(headerMap, ['lat', 'latitude', '纬度']))
      const lng = toNumber(pickValue(headerMap, ['lng', 'lon', 'longitude', '经度']))
      const price = toNumber(pickValue(headerMap, ['price', 'baseprice', '基地价', '价格']))
      const capacity = toNumber(pickValue(headerMap, ['capacity', '产能', '总产能']))
      const capacityRemaining = toNumber(pickValue(headerMap, ['capacityremaining', 'remaining', '剩余', '可供']))
      const phone = pickValue(headerMap, ['phone', 'tel', '电话']) || ''

      if (!id || !Number.isFinite(lat) || !Number.isFinite(lng)) continue

      suppliers.push({
        id,
        name: String(name || id),
        lat,
        lng,
        price: Number.isFinite(price) ? price : 0,
        capacity: Number.isFinite(capacity) ? capacity : 0,
        capacityRemaining: Number.isFinite(capacityRemaining) ? capacityRemaining : (Number.isFinite(capacity) ? capacity : 0),
        phone: String(phone),
        history: supplierHistoryById.get(id) || []
      })
    }

    // 解析客户
    const customers = []
    for (const row of customersRows) {
      const headerMap = buildHeaderMap(row)
      const id = parseId(pickValue(headerMap, ['id', 'customerid', '客户 id']))
      const name = pickValue(headerMap, ['name', 'customername', '客户名称'])
      const lat = toNumber(pickValue(headerMap, ['lat', 'latitude', '纬度']))
      const lng = toNumber(pickValue(headerMap, ['lng', 'lon', 'longitude', '经度']))
      const radius = toNumber(pickValue(headerMap, ['radius', 'radiuskm', '服务半径']))

      if (!id || !Number.isFinite(lat) || !Number.isFinite(lng)) continue

      customers.push({
        id,
        name: String(name || id),
        lat,
        lng,
        radius: Number.isFinite(radius) ? radius : 200
      })
    }

    // 保存到数据库
    await supplierOps.bulkInsert(suppliers)
    await customerOps.bulkInsert(customers)

    // 删除临时文件
    fs.unlinkSync(filePath)

    res.json({
      success: true,
      message: `导入成功：${suppliers.length} 个供应商，${customers.length} 个客户`,
      suppliers: suppliers.length,
      customers: customers.length
    })
  } catch (error) {
    console.error('Excel 解析失败:', error)
    // 删除临时文件
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }
    res.status(500).json({ error: error.message })
  }
})

// ===== 调货订单 API =====

app.post('/api/dispatch-orders', async (req, res) => {
  try {
    const orderId = await dispatchOps.create(req.body)
    res.status(201).json({ success: true, orderId })
  } catch (error) {
    console.error('创建订单失败:', error)
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/dispatch-orders', async (req, res) => {
  try {
    const orders = dispatchOps.getAll()
    res.json(orders)
  } catch (error) {
    console.error('获取订单失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// ===== 健康检查 =====
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`)
  console.log(`📊 数据库路径：${path.join(__dirname, '../data/biomass.json')}`)
})

export default app
