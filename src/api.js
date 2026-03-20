// 后端接口访问层：由后端返回基础数据，前端负责报价/调货计算

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

function buildUrl(path) {
  if (!path.startsWith('/')) path = `/${path}`
  return `${BASE_URL}${path}`
}

async function getJson(url) {
  const res = await fetch(url, { method: 'GET' })
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`)
  return res.json()
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error(`POST ${url} failed: ${res.status}`)
  // 有的后端可能不返回 body
  try {
    return await res.json()
  } catch (e) {
    return null
  }
}

// 后端约定返回：
// customers: [{id,name,lat,lng,radius}]
// suppliers: [{id,name,lat,lng,price,capacity 或 capacityRemaining, phone?, history?}]
export async function fetchCustomers() {
  return getJson(buildUrl('/api/customers'))
}

export async function fetchSuppliers() {
  return getJson(buildUrl('/api/suppliers'))
}

// 前端计算出的调货结果发给后端落库/扣减
// payload: { customerId, quantity, allocations:[{supplierId,amount}], totalCost, quoteForm? }
export async function createDispatchOrder(payload) {
  return postJson(buildUrl('/api/dispatch-orders'), payload)
}

