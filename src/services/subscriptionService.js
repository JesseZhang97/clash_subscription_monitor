const config = require('../../config/config');
const subscriptionUtils = require('../utils/subscription');
const quotaAnalytics = require('../utils/quotaAnalytics');
const emailUtils = require('../utils/email');

// 存储历史数据
let historyData = [];
// 最新数据
let latestData = null;
// 上次更新时间
let lastUpdate = null;
// 上次警告时间
let lastWarningTime = null;
// 上次每日报告时间
let lastDailyReportTime = null;

/**
 * 更新订阅数据
 */
async function updateSubscriptionData() {
  try {
    const data = await subscriptionUtils.getFormattedSubscriptionInfo();
    latestData = data;
    lastUpdate = new Date();
    
    // 获取每日流量分析数据
    const quotaInfo = quotaAnalytics.getDailyQuotaAnalytics(data);
    
    // 合并数据
    const fullData = {
      ...data,
      quotaInfo
    };
    
    // 保存历史数据（仅保留最近30条）
    historyData.push({
      ...fullData,
      timestamp: lastUpdate
    });
    
    if (historyData.length > 30) {
      historyData.shift();
    }
    
    console.log(`订阅数据更新成功: ${lastUpdate.toLocaleString()}`);
    console.log(`总体使用流量: ${data.usedFormatted} / ${data.totalFormatted} (${data.percentUsed}%)`);
    console.log(`今日使用流量: ${quotaInfo.todayUsedFormatted} / ${quotaInfo.todayQuotaFormatted} (${quotaInfo.todayPercentUsed}%)`);
    
    // 检查是否需要发送警告
    await checkAndSendWarnings(fullData);
    
    return fullData;
  } catch (error) {
    console.error('更新订阅数据失败:', error.message);
    throw error;
  }
}

/**
 * 检查和发送警告
 * @param {Object} data 完整数据
 */
async function checkAndSendWarnings(data) {
  const now = new Date();
  const warningCooldown = 6 * 60 * 60 * 1000; // 6小时冷却时间
  const dailyReportCooldown = 24 * 60 * 60 * 1000; // 24小时冷却时间
  
  // 检查是否需要发送总流量警告
  if (data.percentUsed >= config.warningThreshold) {
    // 如果冷却时间已过或者是首次警告
    if (!lastWarningTime || (now - lastWarningTime) > warningCooldown) {
      console.log(`流量使用已达 ${data.percentUsed}%，发送警告邮件...`);
      const sent = await emailUtils.sendTrafficWarningEmail(data, data.quotaInfo);
      
      if (sent) {
        lastWarningTime = now;
        console.log('流量警告邮件已发送');
      }
    }
  }
  
  // 检查今日流量是否超出配额
  if (data.quotaInfo.overQuota) {
    // 如果冷却时间已过或者是首次警告
    if (!lastWarningTime || (now - lastWarningTime) > warningCooldown) {
      console.log(`今日流量使用已超出配额，已使用 ${data.quotaInfo.todayUsedFormatted}，配额 ${data.quotaInfo.todayQuotaFormatted}，发送警告邮件...`);
      const sent = await emailUtils.sendTrafficWarningEmail(data, data.quotaInfo);
      
      if (sent) {
        lastWarningTime = now;
        console.log('每日流量超额警告邮件已发送');
      }
    }
  }
  
  // 发送每日报告（冷却时间24小时）
  if (!lastDailyReportTime || (now - lastDailyReportTime) > dailyReportCooldown) {
    console.log('发送每日流量报告...');
    const sent = await emailUtils.sendDailyReport(data, data.quotaInfo);
    
    if (sent) {
      lastDailyReportTime = now;
      console.log('每日流量报告已发送');
    }
  }
}

/**
 * 获取最新订阅数据
 */
async function getLatestData() {
  // 如果没有数据或数据太旧，重新获取
  if (!latestData || !lastUpdate || (new Date() - lastUpdate) > config.checkInterval) {
    return await updateSubscriptionData();
  }
  return latestData;
}

/**
 * 获取历史数据
 */
function getHistoryData() {
  return historyData;
}

/**
 * 开始定时检查
 */
function startPeriodicCheck() {
  // 立即执行一次
  updateSubscriptionData().catch(console.error);
  
  // 设置定时任务
  setInterval(() => {
    updateSubscriptionData().catch(console.error);
  }, config.checkInterval);
  
  console.log(`已设置定时检查，间隔: ${config.checkInterval / 1000}秒`);
}

module.exports = {
  updateSubscriptionData,
  getLatestData,
  getHistoryData,
  startPeriodicCheck
}; 
