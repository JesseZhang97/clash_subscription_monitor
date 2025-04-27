const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量
dotenv.config();

module.exports = {
  subscriptionUrl: process.env.SUBSCRIPTION_URL,
  port: process.env.PORT || 3000,
  checkInterval: parseInt(process.env.CHECK_INTERVAL || 3600, 10) * 1000, // 转换为毫秒
  warningThreshold: parseInt(process.env.WARNING_THRESHOLD || 80, 10),
  
  // 邮件配置
  email: {
    enabled: process.env.ENABLE_EMAIL_NOTIFICATION === 'true',
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    to: process.env.EMAIL_TO
  },
  
  // 每日流量配额，单位MB，转换为字节
  dailyQuota: {
    workday: parseInt(process.env.WORKDAY_QUOTA || 500, 10) * 1024 * 1024, // 工作日配额（周一至周四）
    weekend: parseInt(process.env.WEEKEND_QUOTA || 1000, 10) * 1024 * 1024, // 周末配额（周五至周日）
    resetHour: parseInt(process.env.RESET_HOUR || 0, 10) // 每日重置时间（小时）
  }
}; 
