# 🌲 生物质报价匹配系统

一个可视化的供应商 - 客户智能匹配与报价系统。

## ✨ 核心功能

- **快速报价**：输入客户位置，快速获取周边供应商及到货成本排序
- **数据可视化**：地图展示供应商和客户分布
- **Excel 批量导入导出**：支持批量导入/导出数据，降低维护成本
- **成本优化**：自动计算运费和到货成本，辅助调货决策

## 🚀 快速开始

### 本地开发

```bash
# 安装依赖
npm install        # 前端
cd server && npm install   # 后端

# 启动服务
cd server && npm run dev    # 终端 1：后端 (端口 3001)
npm run dev                 # 终端 2：前端 (端口 5173)
```

访问 http://localhost:5173

### 部署到云端

请查看 [SETUP.md](SETUP.md) 了解 Railway 部署步骤

## 📄 Excel 模板格式

参考 `templates/供应商数据模板.xlsx`，包含 3 个 Sheet：
- **suppliers** (供应商)
- **customers** (客户)  
- **history** (合作记录)

## 🛠️ API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/suppliers | 获取所有供应商 |
| POST | /api/excel/upload | 上传并解析 Excel |
| GET | /api/customers | 获取所有客户 |

## 📚 文档

- [部署指南](SETUP.md)
- [详细部署文档](DEPLOY.md)
- [Railway 配置说明](RDOC.md)

---

MIT License
