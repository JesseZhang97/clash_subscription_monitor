const fetch = require('node-fetch');
const config = require('../../config/config');

/**
 * 解析订阅信息头部
 * @param {string} headerValue - subscription-userinfo 头部值
 * @returns {Object} 解析后的订阅信息
 */
function parseSubscriptionHeader(headerValue) {
  if (!headerValue) {
    return null;
  }

  const result = {};
  const parts = headerValue.split(';').map(part => part.trim());
  
  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key && value) {
      result[key.trim()] = parseInt(value.trim(), 10);
    }
  }

  return {
    upload: result.upload || 0,
    download: result.download || 0,
    total: result.total || 0,
    expire: result.expire || 0
  };
}

/**
 * 获取订阅信息
 * @returns {Promise<Object>} 订阅信息
 */
async function getSubscriptionInfo() {
  try {
    const url = config.subscriptionUrl;
    if (!url) {
      throw new Error('订阅URL未配置');
    }

    const response = await fetch(url, {
      method: 'HEAD',
    });

    const subscriptionHeader = response.headers.get('subscription-userinfo');
    if (!subscriptionHeader) {
      throw new Error('未找到订阅信息头部');
    }

    return parseSubscriptionHeader(subscriptionHeader);
  } catch (error) {
    console.error('获取订阅信息失败:', error.message);
    throw error;
  }
}

/**
 * 计算使用百分比
 * @param {Object} info - 订阅信息
 * @returns {Object} 带百分比的订阅信息
 */
function calculateUsage(info) {
  if (!info || !info.total) {
    return { ...info, percentUsed: 0 };
  }

  const used = info.upload + info.download;
  const percentUsed = Math.round((used / info.total) * 100);

  return {
    ...info,
    used,
    percentUsed,
    isWarning: percentUsed >= config.warningThreshold
  };
}

/**
 * 格式化流量单位
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的流量字符串
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + units[i];
}

/**
 * 格式化时间戳
 * @param {number} timestamp - UNIX时间戳
 * @returns {string} 格式化后的日期字符串
 */
function formatTimestamp(timestamp) {
  if (!timestamp) return '未知';
  
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('zh-CN');
}

/**
 * 获取并处理订阅信息
 * @returns {Promise<Object>} 处理后的订阅信息
 */
async function getFormattedSubscriptionInfo() {
  try {
    const info = await getSubscriptionInfo();
    const usageInfo = calculateUsage(info);
    
    return {
      ...usageInfo,
      uploadFormatted: formatBytes(usageInfo.upload),
      downloadFormatted: formatBytes(usageInfo.download),
      usedFormatted: formatBytes(usageInfo.used),
      totalFormatted: formatBytes(usageInfo.total),
      expireDate: formatTimestamp(usageInfo.expire)
    };
  } catch (error) {
    console.error('处理订阅信息失败:', error.message);
    throw error;
  }
}

module.exports = {
  getSubscriptionInfo,
  getFormattedSubscriptionInfo,
  parseSubscriptionHeader,
  calculateUsage,
  formatBytes,
  formatTimestamp
}; 
