import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 确保数据目录存在
const dataDir = path.join(__dirname, '../data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'biomass.json')

// 初始化数据
const defaultData = {
  suppliers: [
    { id: '1', name: '华能生物质（河北）', lat: 39.9042, lng: 116.4074, price: 285, capacity: 5000, phone: '0311-8888-0001', capacityRemaining: 5000, history: [] },
    { id: '2', name: '绿源能源（天津）', lat: 39.1230, lng: 117.2010, price: 278, capacity: 3000, phone: '022-8888-0002', capacityRemaining: 3000, history: [] },
    { id: '3', name: '中原燃料（河南）', lat: 34.7466, lng: 113.6254, price: 265, capacity: 4000, phone: '0371-8888-0003', capacityRemaining: 4000, history: [] },
    { id: '4', name: '长江生物质（武汉）', lat: 30.5928, lng: 114.3055, price: 252, capacity: 4200, phone: '027-8888-0004', capacityRemaining: 4200, history: [] },
    { id: '5', name: '川渝燃料（成都）', lat: 30.5728, lng: 104.0668, price: 248, capacity: 5200, phone: '028-8888-0005', capacityRemaining: 5200, history: [] },
    { id: '6', name: '西北能科（西安）', lat: 34.3416, lng: 108.9398, price: 260, capacity: 3600, phone: '029-8888-0006', capacityRemaining: 3600, history: [] },
    { id: '7', name: '华南绿能（广州）', lat: 23.1291, lng: 113.2644, price: 240, capacity: 4500, phone: '020-8888-0007', capacityRemaining: 4500, history: [] },
    { id: '8', name: '珠三角能源（深圳）', lat: 22.5431, lng: 114.0579, price: 236, capacity: 3800, phone: '0755-8888-0008', capacityRemaining: 3800, history: [] },
    { id: '9', name: '沿海燃料（杭州）', lat: 30.2741, lng: 120.1551, price: 242, capacity: 4100, phone: '0571-8888-0009', capacityRemaining: 4100, history: [] },
    { id: '10', name: '东北生物质（沈阳）', lat: 41.8086, lng: 123.4297, price: 270, capacity: 3300, phone: '024-8888-0010', capacityRemaining: 3300, history: [] },
    { id: '11', name: '东部能源（南京）', lat: 32.0603, lng: 118.7969, price: 255, capacity: 3900, phone: '025-8888-0011', capacityRemaining: 3900, history: [] },
    { id: '12', name: '西南燃料（昆明）', lat: 25.0389, lng: 102.7183, price: 230, capacity: 3400, phone: '0871-8888-0012', capacityRemaining: 3400, history: [] },
    { id: '13', name: '粤港澳能源（东莞·麻涌）', lat: 23.0500, lng: 113.5850, price: 235, capacity: 5200, phone: '0769-8888-0013', capacityRemaining: 5200, history: [] },
    { id: '14', name: '珠江燃料（佛山）', lat: 23.0215, lng: 113.1214, price: 238, capacity: 4800, phone: '0757-8888-0014', capacityRemaining: 4800, history: [] },
    { id: '15', name: '南海生物质（中山）', lat: 22.5159, lng: 113.3928, price: 232, capacity: 4100, phone: '0760-8888-0015', capacityRemaining: 4100, history: [] },
    { id: '16', name: '粤东颗粒（惠州）', lat: 23.1115, lng: 114.4168, price: 234, capacity: 3600, phone: '0752-8888-0016', capacityRemaining: 3600, history: [] },
    { id: '17', name: '潮汕生物质（汕头）', lat: 23.3535, lng: 116.6820, price: 228, capacity: 3000, phone: '0754-8888-0017', capacityRemaining: 3000, history: [] },
    { id: '18', name: '粤西燃料（湛江）', lat: 21.2749, lng: 110.3589, price: 225, capacity: 3200, phone: '0759-8888-0018', capacityRemaining: 3200, history: [] },
    { id: '19', name: '岭南绿能（茂名）', lat: 21.6633, lng: 110.9252, price: 227, capacity: 2900, phone: '0668-8888-0019', capacityRemaining: 2900, history: [] },
    { id: '20', name: '粤北生物质（韶关）', lat: 24.8104, lng: 113.5972, price: 239, capacity: 2700, phone: '0751-8888-0020', capacityRemaining: 2700, history: [] }
  ],
  customers: [
    { id: '1', name: '北京新能源集团', lat: 39.9123, lng: 116.3987, radius: 300 },
    { id: '2', name: '上海绿色动力', lat: 31.2304, lng: 121.4737, radius: 200 }
  ],
  dispatchOrders: []
}

// 创建数据库实例
const db = new Low(new JSONFile(dbPath), defaultData)

// 初始化数据库
await db.read()
db.data ||= defaultData
db.data.suppliers ||= defaultData.suppliers
db.data.customers ||= defaultData.customers
db.data.dispatchOrders ||= []
await db.write()

// 供应商操作
export const supplierOps = {
  getAll() {
    return db.data.suppliers
  },

  getById(id) {
    return db.data.suppliers.find(s => s.id === id) || null
  },

  async create(data) {
    db.data.suppliers.push({
      ...data,
      capacityRemaining: data.capacityRemaining || data.capacity || 0,
      history: data.history || []
    })
    await db.write()
    return this.getById(data.id)
  },

  async update(id, data) {
    const index = db.data.suppliers.findIndex(s => s.id === id)
    if (index === -1) return null
    db.data.suppliers[index] = { ...db.data.suppliers[index], ...data, updated_at: new Date().toISOString() }
    await db.write()
    return this.getById(id)
  },

  async delete(id) {
    const index = db.data.suppliers.findIndex(s => s.id === id)
    if (index === -1) return { changes: 0 }
    db.data.suppliers.splice(index, 1)
    await db.write()
    return { changes: 1 }
  },

  async bulkInsert(suppliers) {
    const existingIds = new Set(db.data.suppliers.map(s => s.id))
    let count = 0
    for (const s of suppliers) {
      const item = {
        ...s,
        capacityRemaining: s.capacityRemaining || s.capacity || 0,
        history: s.history || []
      }
      const index = db.data.suppliers.findIndex(x => x.id === s.id)
      if (index === -1) {
        db.data.suppliers.push(item)
      } else {
        db.data.suppliers[index] = { ...db.data.suppliers[index], ...item }
      }
      count++
    }
    await db.write()
    return count
  }
}

// 客户操作
export const customerOps = {
  getAll() {
    return db.data.customers
  },

  getById(id) {
    return db.data.customers.find(c => c.id === id) || null
  },

  async create(data) {
    db.data.customers.push(data)
    await db.write()
    return this.getById(data.id)
  },

  async update(id, data) {
    const index = db.data.customers.findIndex(c => c.id === id)
    if (index === -1) return null
    db.data.customers[index] = { ...db.data.customers[index], ...data, updated_at: new Date().toISOString() }
    await db.write()
    return this.getById(id)
  },

  async delete(id) {
    const index = db.data.customers.findIndex(c => c.id === id)
    if (index === -1) return { changes: 0 }
    db.data.customers.splice(index, 1)
    await db.write()
    return { changes: 1 }
  },

  async bulkInsert(customers) {
    let count = 0
    for (const c of customers) {
      const index = db.data.customers.findIndex(x => x.id === c.id)
      if (index === -1) {
        db.data.customers.push(c)
      } else {
        db.data.customers[index] = { ...db.data.customers[index], ...c }
      }
      count++
    }
    await db.write()
    return count
  }
}

// 调货订单操作
export const dispatchOps = {
  async create(payload) {
    const order = {
      id: Date.now().toString(),
      customerId: payload.customerId,
      customerName: payload.customerName || '',
      quantity: payload.quantity,
      totalCost: payload.totalCost || 0,
      freightRate: payload.freightRate || 0.45,
      status: 'confirmed',
      allocations: payload.allocations || [],
      createdAt: new Date().toISOString()
    }
    db.data.dispatchOrders.push(order)
    await db.write()
    return order.id
  },

  getAll() {
    return db.data.dispatchOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 100)
  }
}

export default db
