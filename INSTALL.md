# 🔧 Railway 部署步骤

## 一、注册和登录

1. 访问 [Railway.app](https://railway.app)
2. 点击右上角 **"Sign in"** → 使用 GitHub 账号登录

## 二、创建新项目

1. 点击 **"+ New Project"** → **"Deploy from GitHub repo"**
2. 找到并选择您的仓库：`Chansbin/biomass-quote-system`
3. 点击 **"Add"**

## 三、配置环境变量

在 Railway 控制台中找到 **Variables**（变量）选项卡，添加：
```env
NODE_ENV=production
PORT=3001
```

## 四、部署并验证

1. 等待 Railway 自动检测并构建（约 2-3 分钟）
2. 构建成功后，点击 **"Settings"** → **"Generate Domain"**（生成域名）
3. 访问生成的域名（格式：`https://xxx.up.railway.app`）
4. 验证功能：
   - ✅ 页面正常加载
   - ✅ 供应商列表正常显示
   - ✅ **上传 Excel 文件**
   - ✅ **重启服务后数据仍在**

## 五、关键验证步骤

### 5.1 数据持久化测试

**重要！** 请按以下步骤验证：

1. 上传一个 Excel 模板（用 `templates/供应商数据模板.xlsx`）
2. 确认数据已导入
3. 在 Railway 控制台点击 **"Restart"** 按钮
4. 刷新网页
5. **数据应该依然存在**（如果消失，说明 `volumes` 配置未生效）

### 5.2 检查持久化卷

1. 在 Railway 控制台找到 **"Storage"** 或 **"Volumes"** 选项
2. 确认有名为 `data-storage` 的卷
3. 确认挂载路径为 `/app/data`

## 六、常见问题

### ❌ 数据每次重启都消失？
- **原因**：未正确配置 `volumes`
- **解决**：确认 `railway.toml` 包含以下内容：
  ```yaml
  volumes:
    - name: data-storage
      mount: /app/data
  ```

### ❌ 端口 3001 无法访问？
- **原因**：环境变量未设置
- **解决**：在 Variables 中添加 `PORT=3001`

### ❌ 依赖安装失败？
- **原因**：`package.json` 位置错误
- **解决**：确认根目录和 `server/` 目录都有 `package.json`

## 七、部署成功标志

✅ 页面正常访问  
✅ 后端 API 正常响应  
✅ **上传的供应商数据永久保存**（重启后仍在）  
✅ 导出 Excel 功能正常

## 八、后续维护

- **更新代码**：直接推送新提交到 GitHub，Railway 会自动重新部署
- **查看日志**：点击 **"Logs"** 选项卡
- **重启服务**：点击 **"Restart"** 按钮
- **停止服务**：点击 **"Pause"** 按钮（会暂停计费）

## 九、费用说明

- **免费额度**：每月 $5 美元
- **超出后**：每月 $5 即可获得完整功能
- **建议**：免费额度足够小规模使用

---

**部署完成后，立即进行数据持久化验证！** 🚀