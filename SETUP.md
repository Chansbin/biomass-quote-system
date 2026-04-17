# 📋 完整部署操作清单

请按顺序执行以下步骤：

---

## ✅ 第一步：确认代码已推送 GitHub（已完成）

```bash
# 在终端执行以下命令验证
git status  # 应该是 "Your branch is ahead by X commits"
git log -1   # 显示最新 commit
```

✅ **验证结果**：应该看到最新的 commit hash `5263cf6`

---

## 🎯 第二步：注册 Railway

1. 打开浏览器访问 [https://railway.app](https://railway.app)
2. 点击右上角 **"Sign in"** → 选择 **"Continue with GitHub"**
3. 授权 Railway 访问您的仓库权限
4. 完成注册

---

## 🚀 第三步：部署项目到 Railway

### 方法 A：通过网页界面部署（推荐新手）

1. 登录 Railway 后点击 **"+ New Project"**
2. 选择 **"Deploy from GitHub repo"**
3. 搜索并选择 `biomass-quote-system` 仓库
4. 点击 **"Add"**

### 方法 B：通过 Railway CLI 部署（进阶）

```bash
# 1. 安装 Railway CLI
npm install -g @railway/cli

# 2. 登录
railway login

# 3. 创建项目
cd d:/Demo/biomass-quote-system
railway init --name biomass-quote

# 4. 配置环境变量
railway variables set NODE_ENV=production
railway variables set PORT=3001

# 5. 启用存储卷
railway volumes add data-storage /app/data

# 6. 启动服务
railway up
```

---

## ⚙️ 第四步：配置持久化存储

### 重要检查项：

1. **确认 `railway.toml` 文件存在且正确**

```yaml:title=railway.toml
node_version: 18

build:
  commands:
    - cd server && npm install
    - npm install

start:
  command: node server/index.js

env:
  NODE_ENV: production
  PORT: 3001

volumes:
  - name: data-storage
    mount: /app/data
```

2. **确认数据目录被挂载**

在 Railway 控制台查看：**Settings → Storage** 应该有：
- Volume Name: `data-storage`
- Mount Path: `/app/data`

---

## 🔍 第五步：验证部署

### 5.1 基础功能验证

1. 获取 Railway 提供的域名（格式：`https://xxx.up.railway.app`）
2. 访问域名，确认页面正常加载
3. 尝试输入地址进行搜索，确认地图功能正常

### 5.2 Excel 上传测试

1. 使用模板文件：`templates/供应商数据模板.xlsx`
2. 点击页面上的 Excel 上传按钮
3. 等待提示："导入成功：X 个供应商，Y 个客户"
4. 刷新页面确认新数据出现

### 5.3 **关键验证**：数据持久化测试

这是最重要的测试！

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 上传 Excel 文件 | 显示"导入成功" |
| 2 | 刷新页面 | 新数据仍然可见 |
| 3 | 在 Railway 控制台点击 **Restart** | 服务重启 |
| 4 | 再次刷新页面 | **新数据仍然存在** ✅ |
| 5 | 如果数据消失 | ❌ `volumes` 未生效 |

---

## 🛠 第六步：常见问题解决

### ❌ 问题：页面空白或 502 错误

**解决方法：**
1. 查看 Railway **Logs** 选项卡
2. 确认端口监听日志：`🚀 服务器运行在 http://localhost:3001`
3. 如果是依赖安装失败，请检查 `server/package.json`

### ❌ 问题：Excel 上传后数据消失

**排查步骤：**
1. 确认 `railway.toml` 包含 `volumes` 配置
2. 查看应用日志中的数据库路径是否指向 `/app/data/...`
3. 确认 Railway Storage 已挂载

### ❌ 问题：API 调用超时

**解决方法：**
- Railway 冷启动需要时间，等待 1-2 分钟再试
- 或者在控制台中禁用 **Auto Pause** 功能

---

## 📱 第七步：导出部署报告

部署成功后，您可以：

1. **保存 Railway 域名**到书签
2. 在手机上也保存这个链接
3. 将部署状态告知团队成员

---

## 🔄 第八步：日常维护

### 更新代码
直接推送新的 Git 提交，Railway 会自动重新部署

### 查看日志
```bash
railway logs  # 本地 CLI 方式
# 或在 Railway 控制台查看 Logs 选项卡
```

### 重启服务
在 Railway 控制台点击 **Restart** 按钮

### 暂停服务（省钱）
- 点击 **Pause** 可以暂停计费（仅适合开发阶段）
- 注意：暂停后下次访问会有冷启动延迟

---

## 📊 成功部署的标志

- [ ] 页面可以通过公网访问
- [ ] 地图功能正常工作
- [ ] Excel 上传成功
- [ ] **重启服务后数据不丢失** ← 最关键
- [ ] 导出 Excel 功能可用

---

## 🎉 部署完成后的下一步

如果您已经完成部署并希望进一步优化：

1. **自定义域名**：在 Railway Settings 中绑定自己的域名
2. **添加 HTTPS**：Railway 默认提供 SSL 证书
3. **监控报警**：设置健康检查通知
4. **性能优化**：考虑增加缓存层

---

**有任何问题，请查看：**
- `DEPLOY.md` - 详细部署文档
- `INSTALL.md` - 安装步骤指南
- `RDOC.md` - Railway 专用说明

祝您部署顺利！🚀