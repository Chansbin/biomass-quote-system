# 生物质报价系统 - Railway 部署说明

## 部署准备

1. **注册 Railway 账号**
   - 访问 [Railway.app](https://railway.app) 并使用 GitHub 登录

2. **创建项目**
   - 点击 `+ New Project` → `Deploy from GitHub repo`
   - 选择当前仓库

3. **配置环境变量**
   ```env
   NODE_ENV=production
   PORT=3001
   ```

## 验证部署

1. 部署成功后，Railway 会提供一个公共 URL（如 `https://your-project.up.railway.app`）

2. 访问 URL 确认前端加载
3. **测试数据持久化**
   - 上传 Excel 文件
   - 重启服务（在 Railway 控制台操作）
   - 刷新页面确认数据仍在

## 关键配置说明

- **`volumes` 配置**：
  ```yaml
  volumes:
    - name: data-storage
      mount: /app/data
  ```
  此配置确保 `data/biomass.json` 文件在服务重启后依然保留

- **文件目录结构**：
  ```
  /app
  ├── server/          # 后端代码
  ├── data/            # ← 铁路持久化存储点
  │   └── biomass.json # 供应商/客户数据
  └── ...
  ```

## 常见问题

### 上传 Excel 后数据消失？
✅ 检查 `railway.toml` 是否包含正确的 `volumes` 配置

### 端口冲突？
✅ 确保 `PORT` 环境变量设置为 Railway 分配的端口

### 依赖安装失败？
✅ 确认 `package.json` 位于项目根目录和 `server/` 目录