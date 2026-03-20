import * as XLSX from 'xlsx'

function normalizeHeaderKey(key) {
  if (key === null || key === undefined) return ''
  return String(key)
    .trim()
    .toLowerCase()
    // 去掉空格与常见分隔符
    .replace(/\s+/g, '')
    .replace(/[()（）\[\]【】]/g, '')
    .replace(/[_\-]/g, '')
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

function pickValueByHeaderMap(headerMap, keys) {
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

function findSheet(workbook, keywordList) {
  const targets = keywordList.map(normalizeHeaderKey)
  const nameToScore = (sheetName) => {
    const ns = normalizeHeaderKey(sheetName)
    let score = 0
    for (const t of targets) {
      if (!t) continue
      if (ns === t) score += 10
      else if (ns.includes(t)) score += 3
    }
    return score
  }

  let best = null
  let bestScore = -1
  for (const sheetName of workbook.SheetNames || []) {
    const score = nameToScore(sheetName)
    if (score > bestScore) {
      bestScore = score
      best = workbook.Sheets[sheetName]
    }
  }
  return best
}

export async function parseExcelFile(file) {
  if (!file) throw new Error('no file')
  const buf = await file.arrayBuffer()
  const workbook = XLSX.read(buf, { type: 'array' })

  // 允许你用中英文/常见命名：我们用关键词匹配 Sheet 名
  const suppliersSheet = findSheet(workbook, ['suppliers', 'supplier', '供应商', '厂家'])
  const customersSheet = findSheet(workbook, ['customers', 'customer', '客户'])
  const historySheet = findSheet(workbook, ['supplierhistory', 'history', '合作记录', '历史合作', '供应商历史'])

  const suppliersRows = suppliersSheet
    ? XLSX.utils.sheet_to_json(suppliersSheet, { defval: '', raw: true })
    : []
  const customersRows = customersSheet
    ? XLSX.utils.sheet_to_json(customersSheet, { defval: '', raw: true })
    : []
  const historyRows = historySheet
    ? XLSX.utils.sheet_to_json(historySheet, { defval: '', raw: true })
    : []

  const supplierHistoryById = new Map()
  for (const row of historyRows) {
    const headerMap = buildHeaderMap(row)
    const supplierIdRaw = pickValueByHeaderMap(headerMap, [
      'supplierid',
      'supplier_id',
      'supplier code',
      '供应商id',
      '厂家id',
      '厂商id'
    ])
    const supplierId = parseId(supplierIdRaw)
    if (!supplierId) continue

    const year = toNumber(pickValueByHeaderMap(headerMap, ['year', '年份']))
    const month = toNumber(pickValueByHeaderMap(headerMap, ['month', '月份']))
    const volume = toNumber(pickValueByHeaderMap(headerMap, ['volume', 'vol', '量', '合作量', '吨']))
    const note = pickValueByHeaderMap(headerMap, ['note', 'remark', '备注', '说明', '合作备注', '内容']) || ''

    if (!supplierHistoryById.has(supplierId)) supplierHistoryById.set(supplierId, [])
    const list = supplierHistoryById.get(supplierId)
    list.push({
      id: `${supplierId}-${year}-${month}-${String(note).slice(0, 8)}`,
      year: Number.isFinite(year) ? year : '',
      month: Number.isFinite(month) ? String(month).padStart(2, '0') : '',
      volume: Number.isFinite(volume) ? volume : 0,
      note: String(note)
    })
  }

  const suppliers = []
  for (const row of suppliersRows) {
    const headerMap = buildHeaderMap(row)
    const id = parseId(
      pickValueByHeaderMap(headerMap, [
        'id',
        'supplierid',
        'supplier_id',
        'suppliercode',
        '供应商id',
        '厂家id',
        '厂商id'
      ])
    )

    const name = pickValueByHeaderMap(headerMap, ['name', 'suppliername', '供应商名称', '厂名', '厂家', '供应商'])
    const lat = toNumber(pickValueByHeaderMap(headerMap, ['lat', 'latitude', '纬度']))
    const lng = toNumber(pickValueByHeaderMap(headerMap, ['lng', 'lon', 'lngitude', 'longitude', '经度']))

    const price = toNumber(pickValueByHeaderMap(headerMap, ['price', 'baseprice', '基地价', '价格', '报价', '出厂价']))

    // capacityRemaining > capacity > capacityRemaining = 0
    const capacityRemaining = toNumber(pickValueByHeaderMap(headerMap, [
      'capacityremaining',
      'remaining',
      '剩余',
      '可供',
      '当前可供',
      '可用'
    ]))
    const capacity = toNumber(pickValueByHeaderMap(headerMap, ['capacity', '产能', '总产能']))

    const phone = pickValueByHeaderMap(headerMap, ['phone', 'tel', '电话', '联系方式', '手机']) || ''

    if (!id) continue
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue

    const rem = Number.isFinite(capacityRemaining) ? capacityRemaining : (Number.isFinite(capacity) ? capacity : 0)
    suppliers.push({
      id,
      name: String(name || id),
      lat,
      lng,
      price: Number.isFinite(price) ? price : 0,
      capacity: Number.isFinite(capacity) ? capacity : rem,
      capacityRemaining: rem,
      phone: String(phone),
      history: supplierHistoryById.get(id) || []
    })
  }

  const customers = []
  for (const row of customersRows) {
    const headerMap = buildHeaderMap(row)
    const id = parseId(
      pickValueByHeaderMap(headerMap, [
        'id',
        'customerid',
        'customer_id',
        'customer code',
        '客户id',
        '客户编号'
      ])
    )

    const name = pickValueByHeaderMap(headerMap, ['name', 'customername', '客户名称', '客户'])
    const lat = toNumber(pickValueByHeaderMap(headerMap, ['lat', 'latitude', '纬度']))
    const lng = toNumber(pickValueByHeaderMap(headerMap, ['lng', 'lon', 'longitude', '经度']))
    const radius = toNumber(pickValueByHeaderMap(headerMap, ['radius', 'radiuskm', '服务半径', '半径', '范围']))

    if (!id) continue
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue

    customers.push({
      id,
      name: String(name || id),
      lat,
      lng,
      radius: Number.isFinite(radius) ? radius : 0
    })
  }

  return { suppliers, customers }
}

