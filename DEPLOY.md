# 生物质报价系统 - 部署指南

## 项目结构

```
biomass-quote-system/
├── server/              # Node.js 后端
│   ├── index.js        # 服务器主文件
│   ├── database.js     # SQLite 数据库配置
│   └── package.json    # 后端依赖
├── src/                # Vue 3 前端
│   ├── App.vue        # 主应用组件
│   ├── api.js         # API 请求层
│   ├── excelParser.js # Excel 解析工具
│   └── components/    # Vue 组件
├── data/               # SQLite 数据库文件（运行时生成）
├── uploads/            # Excel 上传临时目录
└── docker-compose.yml  # Docker 编排配置
```

## 本地开发

### 1. 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install
```

### 2. 启动服务

```bash
# 终端 1：启动后端（端口 3001）
cd server
npm run dev

# 终端 2：启动前端（端口 5173）
npm run dev
```

访问 http://localhost:5173 使用系统

## 云端部署

### 方案一：Docker 部署（推荐）

```bash
# 构建并运行
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 方案二：Railway 部署

1. 在 Railway 官网创建新项目
2. 连接 GitHub 仓库
3. 自动检测 Node.js 并部署

### 方案三：传统服务器部署

```bash
# 1. 安装 Node.js 18+
# 2. 克隆代码
git clone <your-repo>
cd biomass-quote-system

# 3. 安装依赖
npm install
cd server && npm install

# 4. 构建前端
cd ..
npm run build

# 5. 使用 PM2 运行
npm install -g pm2
pm2 start server/index.js --name biomass-quote
pm2 save
pm2 startup
```

## API 接口

### 供应商管理
- `GET /api/suppliers` - 获取所有供应商
- `GET /api/suppliers/:id` - 获取单个供应商
- `POST /api/suppliers` - 创建供应商
- `PUT /api/suppliers/:id` - 更新供应商
- `DELETE /api/suppliers/:id` - 删除供应商
- `POST /api/suppliers/bulk` - 批量导入供应商

### 客户管理
- `GET /api/customers` - 获取所有客户
- `GET /api/customers/:id` - 获取单个客户
- `POST /api/customers` - 创建客户
- `PUT /api/customers/:id` - 更新客户
- `DELETE /api/customers/:id` - 删除客户
- `POST /api/customers/bulk` - 批量导入客户

### Excel 上传
- `POST /api/excel/upload` - 上传并解析 Excel 文件

### 调货订单
- `POST /api/dispatch-orders` - 创建调货订单
- `GET /api/dispatch-orders` - 获取订单列表

## Excel 模板格式

Excel 文件应包含以下 Sheet：

### 供应商表（suppliers）
| id | name | lat | lng | price | capacity | phone |
|----|------|-----|-----|-------|----------|-------|
| 1 | 华能生物质 | 39.9042 | 116.4074 | 285 | 5000 | 0311-8888-0001 |

### 客户表（customers）
| id | name | lat | lng | radius |
|----|------|-----|-----|--------|
| 1 | 北京新能源集团 | 39.9123 | 116.3987 | 300 |

### 合作记录表（history）
| supplier_id | year | month | volume | note |
|-------------|------|-------|--------|------|
| 1 | 2025 | 8 | 1200 | 稳定供货 |

## 数据库

系统使用 SQLite 数据库，数据存储在 `data/biomass.db`

数据库包含以下表：
- `suppliers` - 供应商信息
- `customers` - 客户信息
- `supplier_history` - 供应商合作历史
- `dispatch_orders` - 调货订单
- `dispatch_allocations` - 调货明细

## 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| PORT | 服务器端口 | 3001 |
| NODE_ENV | 运行环境 | development |

## 故障排除

### 后端启动失败
- 检查端口 3001 是否被占用
- 确认 `data` 目录有写权限

### Excel 上传失败
- 检查文件格式是否为 .xlsx 或 .xls
- 确认文件大小不超过 10MB
- 检查 Sheet 名称是否正确

### 地图不显示
- 检查高德地图 API Key 是否有效
- 确认网络连接正常
