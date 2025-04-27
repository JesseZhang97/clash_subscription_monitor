const subscriptionService = require('../services/subscriptionService');

/**
 * 注册订阅相关路由
 * @param {Object} fastify - Fastify实例
 */
async function routes(fastify) {
  // 获取最新订阅信息
  fastify.get('/api/subscription', async (request, reply) => {
    try {
      const data = await subscriptionService.getLatestData();
      return data;
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  // 获取历史订阅信息
  fastify.get('/api/subscription/history', async (request, reply) => {
    try {
      const data = subscriptionService.getHistoryData();
      return data;
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  // 手动更新订阅信息
  fastify.post('/api/subscription/update', async (request, reply) => {
    try {
      const data = await subscriptionService.updateSubscriptionData();
      return data;
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  // 健康检查
  fastify.get('/health', async () => {
    return { status: 'ok' };
  });
}

module.exports = routes; 
