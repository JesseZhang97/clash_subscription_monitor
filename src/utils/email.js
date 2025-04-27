const nodemailer = require('nodemailer');
const config = require('../../config/config');

/**
 * 创建邮件传输器
 * @returns {Object} Nodemailer传输器
 */
function createTransporter() {
  if (!config.email.enabled || !config.email.user || !config.email.pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: config.email.service,
    auth: {
      user: config.email.user,
      pass: config.email.pass
    }
  });
}

/**
 * 发送邮件
 * @param {string} subject 邮件主题
 * @param {string} html 邮件HTML内容
 * @returns {Promise<boolean>} 是否发送成功
 */
async function sendEmail(subject, html) {
  try {
    if (!config.email.enabled) {
      console.log('邮件通知已禁用，跳过发送');
      return false;
    }

    if (!config.email.user || !config.email.pass || !config.email.to) {
      console.error('邮件配置不完整，无法发送邮件');
      return false;
    }

    const transporter = createTransporter();
    if (!transporter) {
      return false;
    }

    const mailOptions = {
      from: config.email.user,
      to: config.email.to,
      subject: subject,
      html: html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('邮件发送成功:', info.messageId);
    return true;
  } catch (error) {
    console.error('邮件发送失败:', error.message);
    return false;
  }
}

/**
 * 发送流量预警邮件
 * @param {Object} data 流量数据
 * @param {Object} quotaInfo 配额信息
 * @returns {Promise<boolean>} 是否发送成功
 */
async function sendTrafficWarningEmail(data, quotaInfo) {
  const subject = `[流量预警] 订阅流量使用已达${data.percentUsed}%`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
      <h2 style="color: #e74c3c;">订阅流量使用预警</h2>
      <p>您的订阅流量使用情况如下：</p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <h3 style="margin-top: 0;">总体使用情况</h3>
        <p><strong>已使用流量：</strong> ${data.usedFormatted} / ${data.totalFormatted} (${data.percentUsed}%)</p>
        <p><strong>上传流量：</strong> ${data.uploadFormatted}</p>
        <p><strong>下载流量：</strong> ${data.downloadFormatted}</p>
        <p><strong>到期时间：</strong> ${data.expireDate}</p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <h3 style="margin-top: 0;">今日使用情况</h3>
        <p><strong>今日已使用：</strong> ${quotaInfo.todayUsedFormatted}</p>
        <p><strong>今日配额：</strong> ${quotaInfo.todayQuotaFormatted}</p>
        <p><strong>使用百分比：</strong> ${quotaInfo.todayPercentUsed}%</p>
        <p><strong>日期类型：</strong> ${quotaInfo.isWeekend ? '周末' : '工作日'}</p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <h3 style="margin-top: 0;">剩余天数分析</h3>
        <p><strong>距离到期还有：</strong> ${quotaInfo.daysUntilExpire} 天</p>
        <p><strong>剩余流量：</strong> ${quotaInfo.remainingFormatted}</p>
        <p><strong>平均每日可用：</strong> ${quotaInfo.dailyAllowanceFormatted}</p>
        <p><strong>配额状态：</strong> 
          ${quotaInfo.isQuotaSufficient 
            ? '<span style="color: green;">充足</span>' 
            : '<span style="color: red;">不足，请注意节约使用</span>'}
        </p>
      </div>
      
      <p style="color: ${data.percentUsed > 90 ? '#e74c3c' : '#3498db'};">
        ${data.percentUsed > 90 
          ? '您的总流量使用已接近上限，请注意控制使用。' 
          : '请合理规划您的流量使用。'}
      </p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #7f8c8d; font-size: 12px;">此邮件由系统自动发送，请勿回复。</p>
    </div>
  `;
  
  return await sendEmail(subject, html);
}

/**
 * 发送每日流量报告
 * @param {Object} data 流量数据
 * @param {Object} quotaInfo 配额信息
 * @returns {Promise<boolean>} 是否发送成功
 */
async function sendDailyReport(data, quotaInfo) {
  const subject = `[每日报告] 订阅流量使用情况`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
      <h2 style="color: #3498db;">订阅流量每日报告</h2>
      <p>您的订阅流量使用情况如下：</p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <h3 style="margin-top: 0;">总体使用情况</h3>
        <p><strong>已使用流量：</strong> ${data.usedFormatted} / ${data.totalFormatted} (${data.percentUsed}%)</p>
        <p><strong>上传流量：</strong> ${data.uploadFormatted}</p>
        <p><strong>下载流量：</strong> ${data.downloadFormatted}</p>
        <p><strong>到期时间：</strong> ${data.expireDate}</p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <h3 style="margin-top: 0;">今日使用情况</h3>
        <p><strong>今日已使用：</strong> ${quotaInfo.todayUsedFormatted}</p>
        <p><strong>今日配额：</strong> ${quotaInfo.todayQuotaFormatted}</p>
        <p><strong>使用百分比：</strong> ${quotaInfo.todayPercentUsed}%</p>
        <p><strong>日期类型：</strong> ${quotaInfo.isWeekend ? '周末' : '工作日'}</p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <h3 style="margin-top: 0;">剩余天数分析</h3>
        <p><strong>距离到期还有：</strong> ${quotaInfo.daysUntilExpire} 天</p>
        <p><strong>剩余流量：</strong> ${quotaInfo.remainingFormatted}</p>
        <p><strong>平均每日可用：</strong> ${quotaInfo.dailyAllowanceFormatted}</p>
        <p><strong>配额状态：</strong> 
          ${quotaInfo.isQuotaSufficient 
            ? '<span style="color: green;">充足</span>' 
            : '<span style="color: red;">不足，请注意节约使用</span>'}
        </p>
      </div>
      
      <p>祝您使用愉快！</p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #7f8c8d; font-size: 12px;">此邮件由系统自动发送，请勿回复。</p>
    </div>
  `;
  
  return await sendEmail(subject, html);
}

module.exports = {
  sendEmail,
  sendTrafficWarningEmail,
  sendDailyReport
}; 
