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
  },
  {
    id: 4,
    name: '长江生物质（武汉）',
    lat: 30.5928,
    lng: 114.3055,
    price: 252,
    capacity: 4200,
    phone: '027-8888-0004',
    history: [{ id: 'h7', year: 2025, month: '09', volume: 980, note: '运输成本可控' }]
  },
  {
    id: 5,
    name: '川渝燃料（成都）',
    lat: 30.5728,
    lng: 104.0668,
    price: 248,
    capacity: 5200,
    phone: '028-8888-0005',
    history: [{ id: 'h8', year: 2025, month: '10', volume: 1350, note: '供应稳定，淡旺季齐全' }]
  },
  {
    id: 6,
    name: '西北能科（西安）',
    lat: 34.3416,
    lng: 108.9398,
    price: 260,
    capacity: 3600,
    phone: '029-8888-0006',
    history: [{ id: 'h9', year: 2025, month: '08', volume: 870, note: '响应快，装车效率高' }]
  },
  {
    id: 7,
    name: '华南绿能（广州）',
    lat: 23.1291,
    lng: 113.2644,
    price: 240,
    capacity: 4500,
    phone: '020-8888-0007',
    history: [{ id: 'h10', year: 2025, month: '11', volume: 1010, note: '海运/陆运衔接灵活' }]
  },
  {
    id: 8,
    name: '珠三角能源（深圳）',
    lat: 22.5431,
    lng: 114.0579,
    price: 236,
    capacity: 3800,
    phone: '0755-8888-0008',
    history: [{ id: 'h11', year: 2025, month: '07', volume: 760, note: '综合成本低，准时率高' }]
  },
  {
    id: 9,
    name: '沿海燃料（杭州）',
    lat: 30.2741,
    lng: 120.1551,
    price: 242,
    capacity: 4100,
    phone: '0571-8888-0009',
    history: [{ id: 'h12', year: 2025, month: '12', volume: 950, note: '近江海物流，运距优势明显' }]
  },
  {
    id: 10,
    name: '东北生物质（沈阳）',
    lat: 41.8086,
    lng: 123.4297,
    price: 270,
    capacity: 3300,
    phone: '024-8888-0010',
    history: [{ id: 'h13', year: 2025, month: '09', volume: 720, note: '供给充足，冷链经验丰富' }]
  },
  {
    id: 11,
    name: '东部能源（南京）',
    lat: 32.0603,
    lng: 118.7969,
    price: 255,
    capacity: 3900,
    phone: '025-8888-0011',
    history: [{ id: 'h14', year: 2025, month: '10', volume: 860, note: '交付稳定，服务体系完善' }]
  },
  {
    id: 12,
    name: '西南燃料（昆明）',
    lat: 25.0389,
    lng: 102.7183,
    price: 230,
    capacity: 3400,
    phone: '0871-8888-0012',
    history: [{ id: 'h15', year: 2025, month: '08', volume: 650, note: '基础价低，性价比高' }]
  },
  {
    id: 13,
    name: '粤港澳能源（东莞·麻涌）',
    lat: 23.0500,
    lng: 113.5850,
    price: 235,
    capacity: 5200,
    phone: '0769-8888-0013',
    history: [{ id: 'h16', year: 2025, month: '11', volume: 1120, note: '珠三角快速配送' }]
  },
  {
    id: 14,
    name: '珠江燃料（佛山）',
    lat: 23.0215,
    lng: 113.1214,
    price: 238,
    capacity: 4800,
    phone: '0757-8888-0014',
    history: [{ id: 'h17', year: 2025, month: '10', volume: 980, note: '装车效率高，稳定供货' }]
  },
  {
    id: 15,
    name: '南海生物质（中山）',
    lat: 22.5159,
    lng: 113.3928,
    price: 232,
    capacity: 4100,
    phone: '0760-8888-0015',
    history: [{ id: 'h18', year: 2025, month: '09', volume: 860, note: '综合成本优' }]
  },
  {
    id: 16,
    name: '粤东颗粒（惠州）',
    lat: 23.1115,
    lng: 114.4168,
    price: 234,
    capacity: 3600,
    phone: '0752-8888-0016',
    history: [{ id: 'h19', year: 2025, month: '12', volume: 740, note: '靠近港口，运输灵活' }]
  },
  {
    id: 17,
    name: '潮汕生物质（汕头）',
    lat: 23.3535,
    lng: 116.6820,
    price: 228,
    capacity: 3000,
    phone: '0754-8888-0017',
    history: [{ id: 'h20', year: 2025, month: '08', volume: 620, note: '粤东区域覆盖' }]
  },
  {
    id: 18,
    name: '粤西燃料（湛江）',
    lat: 21.2749,
    lng: 110.3589,
    price: 225,
    capacity: 3200,
    phone: '0759-8888-0018',
    history: [{ id: 'h21', year: 2025, month: '07', volume: 580, note: '基地价低，适合大单' }]
  },
  {
    id: 19,
    name: '岭南绿能（茂名）',
    lat: 21.6633,
    lng: 110.9252,
    price: 227,
    capacity: 2900,
    phone: '0668-8888-0019',
    history: [{ id: 'h22', year: 2025, month: '10', volume: 610, note: '粤西补单快' }]
  },
  {
    id: 20,
    name: '粤北生物质（韶关）',
    lat: 24.8104,
    lng: 113.5972,
    price: 239,
    capacity: 2700,
    phone: '0751-8888-0020',
    history: [{ id: 'h23', year: 2025, month: '09', volume: 540, note: '粤北覆盖，适配山区路况' }]
  }
]

export const customers = [
  { id: 1, name: '北京新能源集团', lat: 39.9123, lng: 116.3987, radius: 300 },
  { id: 2, name: '上海绿色动力',   lat: 31.2304, lng: 121.4737, radius: 200 }
]