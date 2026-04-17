FROM node:18-alpine

WORKDIR /app

# 复制前端
COPY . .

# 安装依赖
RUN npm install
RUN cd server && npm install

# 构建前端
RUN npm run build

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["npx", "vercel", "dev", "--port", "3000"]
