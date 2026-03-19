// src/data.js
export const suppliers = [
  {
    id: 1,
    name: '华能生物质（河北）',
    lat: 39.9042,
    lng: 116.4074,
    price: 285,
    capacity: 5000,
    phone: '0311-8888-0001',
    history: [
      { id: 'h1', year: 2025, month: '08', volume: 1200, note: '稳定供货，价格波动小' },
      { id: 'h2', year: 2025, month: '11', volume: 980, note: '按期交付，无违约记录' }
    ]
  },
  {
    id: 2,
    name: '绿源能源（天津）',
    lat: 39.1230,
    lng: 117.2010,
    price: 278,
    capacity: 3000,
    phone: '022-8888-0002',
    history: [
      { id: 'h3', year: 2025, month: '07', volume: 760, note: '短期补单能力强' },
      { id: 'h4', year: 2025, month: '10', volume: 640, note: '运距适配好，综合成本低' }
    ]
  },
  {
    id: 3,
    name: '中原燃料（河南）',
    lat: 34.7466,
    lng: 113.6254,
    price: 265,
    capacity: 4000,
    phone: '0371-8888-0003',
    history: [
      { id: 'h5', year: 2025, month: '09', volume: 1100, note: '大单响应快，合作评分高' },
      { id: 'h6', year: 2025, month: '12', volume: 890, note: '交付质量稳定' }
    ]
  }
]

export const customers = [
  { id: 1, name: '北京新能源集团', lat: 39.9123, lng: 116.3987, radius: 300 },
  { id: 2, name: '上海绿色动力',   lat: 31.2304, lng: 121.4737, radius: 200 }
]