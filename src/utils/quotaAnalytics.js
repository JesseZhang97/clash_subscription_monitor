const moment = require('moment');
const config = require('../../config/config');
const { formatBytes } = require('./subscription');

// 储存每日使用量记录
let dailyUsageRecord = {
  date: null,
  upload: 0,
  download: 0,
  lastUpload: 0,
  lastDownload: 0,
  resetTimestamp: null
};

/**
 * 检查是否为周末
 * @param {Date} date 日期对象
 * @returns {boolean} 是否为周末
 */
function isWeekend(date) {
  const day = date.getDay();
  // 周五、周六、周日为周末（5, 6, 0）
  return day === 0 || day === 5 || day === 6;
}

/**
 * 检查是否需要重置每日使用量
 * @returns {boolean} 是否需要重置
 */
function shouldResetDailyUsage() {
  const now = new Date();
  const currentDate = now.toDateString();
  
  // 如果日期不同，需要重置
  if (!dailyUsageRecord.date || dailyUsageRecord.date !== currentDate) {
    return true;
  }
  
  // 如果到了重置时间，需要重置
  if (dailyUsageRecord.resetTimestamp && now >= dailyUsageRecord.resetTimestamp) {
    return true;
  }
  
  return false;
}

/**
 * 重置每日使用量统计
 * @param {number} currentUpload 当前上传量
 * @param {number} currentDownload 当前下载量
 */
function resetDailyUsage(currentUpload, currentDownload) {
  const now = new Date();
  const resetHour = config.dailyQuota.resetHour;
  
  // 设置下一个重置时间
  const nextReset = new Date(now);
  nextReset.setDate(nextReset.getDate() + 1);
  nextReset.setHours(resetHour, 0, 0, 0);
  
  dailyUsageRecord = {
    date: now.toDateString(),
    upload: 0,
    download: 0,
    lastUpload: currentUpload,
    lastDownload: currentDownload,
    resetTimestamp: nextReset
  };
  
  console.log(`每日使用量统计已重置，下次重置时间: ${nextReset.toLocaleString()}`);
}

/**
 * 更新每日使用量
 * @param {number} currentUpload 当前上传量
 * @param {number} currentDownload 当前下载量
 * @returns {Object} 更新后的每日使用量
 */
function updateDailyUsage(currentUpload, currentDownload) {
  // 检查是否需要重置
  if (shouldResetDailyUsage()) {
    resetDailyUsage(currentUpload, currentDownload);
    return dailyUsageRecord;
  }
  
  // 如果是第一次记录，初始化但不计算使用量
  if (!dailyUsageRecord.lastUpload || !dailyUsageRecord.lastDownload) {
    dailyUsageRecord.lastUpload = currentUpload;
    dailyUsageRecord.lastDownload = currentDownload;
    return dailyUsageRecord;
  }
  
  // 计算增量
  const uploadDiff = Math.max(0, currentUpload - dailyUsageRecord.lastUpload);
  const downloadDiff = Math.max(0, currentDownload - dailyUsageRecord.lastDownload);
  
  // 更新记录
  dailyUsageRecord.upload += uploadDiff;
  dailyUsageRecord.download += downloadDiff;
  dailyUsageRecord.lastUpload = currentUpload;
  dailyUsageRecord.lastDownload = currentDownload;
  
  return dailyUsageRecord;
}

/**
 * 获取当天流量配额
 * @returns {number} 流量配额（字节）
 */
function getTodayQuota() {
  const today = new Date();
  return isWeekend(today) ? config.dailyQuota.weekend : config.dailyQuota.workday;
}

/**
 * 计算剩余天数
 * @param {number} expireTimestamp 到期时间戳
 * @returns {number} 剩余天数
 */
function calculateRemainingDays(expireTimestamp) {
  if (!expireTimestamp) return 0;
  
  const now = moment();
  const expireDate = moment.unix(expireTimestamp);
  return Math.max(0, expireDate.diff(now, 'days'));
}

/**
 * 分析配额是否足够
 * @param {number} remainingBytes 剩余流量（字节）
 * @param {number} daysUntilExpire 剩余天数
 * @returns {boolean} 配额是否足够
 */
function analyzeQuotaSufficiency(remainingBytes, daysUntilExpire) {
  if (daysUntilExpire <= 0) return true;
  
  // 计算剩余工作日和周末天数
  const now = moment();
  let workdays = 0;
  let weekends = 0;
  
  for (let i = 0; i < daysUntilExpire; i++) {
    const futureDate = moment().add(i, 'days');
    if (isWeekend(futureDate.toDate())) {
      weekends++;
    } else {
      workdays++;
    }
  }
  
  // 计算需要的总流量
  const totalNeeded = (workdays * config.dailyQuota.workday) + (weekends * config.dailyQuota.weekend);
  
  return remainingBytes >= totalNeeded;
}

/**
 * 获取每日流量使用分析
 * @param {Object} subscriptionData 订阅数据
 * @returns {Object} 流量分析数据
 */
function getDailyQuotaAnalytics(subscriptionData) {
  if (!subscriptionData) return null;
  
  // 更新每日使用量
  const dailyUsage = updateDailyUsage(subscriptionData.upload, subscriptionData.download);
  const todayUsed = dailyUsage.upload + dailyUsage.download;
  const todayQuota = getTodayQuota();
  const todayPercentUsed = Math.min(100, Math.round((todayUsed / todayQuota) * 100)) || 0;
  
  // 计算到期前的剩余天数
  const daysUntilExpire = calculateRemainingDays(subscriptionData.expire);
  
  // 剩余流量
  const remaining = Math.max(0, subscriptionData.total - subscriptionData.used);
  
  // 平均每日可用流量
  const dailyAllowance = daysUntilExpire > 0 ? Math.floor(remaining / daysUntilExpire) : 0;
  
  // 分析配额是否足够
  const isQuotaSufficient = analyzeQuotaSufficiency(remaining, daysUntilExpire);
  
  return {
    todayUsed,
    todayUsedFormatted: formatBytes(todayUsed),
    todayQuota,
    todayQuotaFormatted: formatBytes(todayQuota),
    todayPercentUsed,
    isWeekend: isWeekend(new Date()),
    daysUntilExpire,
    remaining,
    remainingFormatted: formatBytes(remaining),
    dailyAllowance,
    dailyAllowanceFormatted: formatBytes(dailyAllowance),
    isQuotaSufficient,
    overQuota: todayUsed > todayQuota
  };
}

module.exports = {
  getDailyQuotaAnalytics,
  isWeekend
}; 
