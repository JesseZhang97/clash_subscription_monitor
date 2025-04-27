# Clash 订阅流量监控

一个简单的 Node.js 应用，用于监控 Clash 订阅的流量使用情况。

## 功能特点

- ✅ 自动获取订阅流量使用情况
- 📊 显示上传、下载和总流量使用百分比
- 📈 保存历史使用记录
- ⏰ 定时检查订阅状态
- 🔔 流量使用超过阈值时提醒
- 📆 工作日/周末流量配额管理
- 📧 邮件通知功能，支持每日报告和预警通知
- 📱 自适应界面设计，支持移动设备查看

## 截图

![流量监控界面](screenshot.png)

## 安装

1. 克隆仓库：

```bash
git clone https://github.com/yourusername/clash_subscription_monitor.git
cd clash_subscription_monitor
```

2. 安装依赖：

```bash
npm install
```

3. 配置环境变量：

复制 `.env.example` 到 `.env` 并填写您的订阅地址：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```
# 订阅URL
SUBSCRIPTION_URL=你的订阅地址

# 服务端口
PORT=3000

# 检查间隔（秒）
CHECK_INTERVAL=3600

# 警告阈值（百分比）
WARNING_THRESHOLD=80

# 邮件通知配置
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_TO=recipient@example.com

# 每日流量配额（MB）
WORKDAY_QUOTA=500
WEEKEND_QUOTA=1000

# 是否启用邮件通知
ENABLE_EMAIL_NOTIFICATION=true

# 每日使用量重置时间（小时，24小时制，默认0点）
RESET_HOUR=0
```

## 使用方法

### 开发环境

```bash
npm run dev
```

### 生产环境

```bash
npm start
```

服务将在 `http://localhost:3000` 启动。

## API 接口

- `GET /api/subscription` - 获取最新订阅信息
- `GET /api/subscription/history` - 获取历史订阅信息
- `POST /api/subscription/update` - 手动更新订阅信息
- `GET /health` - 健康检查

API 文档可在 `http://localhost:3000/documentation` 查看。

## 工作原理

该应用通过发送 HEAD 请求到您的 Clash 订阅地址，从响应头中解析 `subscription-userinfo` 字段获取流量使用情况。

例如，返回头中包含以下信息：

```
subscription-userinfo: upload=9658975262; download=205264394003; total=214748364800; expire=1751299200
```

应用会解析这些值，并计算流量使用百分比。

### 每日流量配额管理

应用允许您设置工作日和周末的不同流量配额。工作日（周一至周四）和周末（周五至周日）可以分别配置不同的流量限制。系统会自动判断当前日期类型，并提供相应的流量配额。

每天指定时间（默认凌晨0点）系统会自动重置每日流量使用统计，确保准确记录每天的流量消耗。

### 邮件通知系统

应用集成了邮件通知功能，可以在以下情况下发送邮件：

1. 总流量使用超过阈值（可配置）
2. 每日流量使用超过当日配额
3. 每日流量使用报告

您需要配置邮件发送服务（支持Gmail等）才能使用此功能。

## 贡献

欢迎提交 Issues 和 Pull Requests。

## 许可证

MIT 
