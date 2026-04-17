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
  try {
    return await res.json()
  } catch (e) {
    return null
  }
}

async function uploadFile(url, file) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(url, { method: 'POST', body: formData })
  if (!res.ok) throw new Error(`POST ${url} failed: ${res.status}`)
  return res.json()
}

// 后端约定返回：customers: [{id,name,lat,lng,radius}], suppliers: [{id,name,lat,lng,price,capacity}]
export async function fetchCustomers() {
  return getJson(buildUrl('/api/customers'))
}

export async function fetchSuppliers() {
  return getJson(buildUrl('/api/suppliers'))
}

// Excel 上传
export async function uploadExcel(file) {
  return uploadFile(buildUrl('/api/excel/upload'), file)
}

// 创建调货订单
export async function createDispatchOrder(payload) {
  return postJson(buildUrl('/api/dispatch-orders'), payload)
}

// 获取订单列表
export async function fetchDispatchOrders() {
  return getJson(buildUrl('/api/dispatch-orders'))
}

