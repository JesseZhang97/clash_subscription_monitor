const path = require('path');
const fastify = require('fastify')({ logger: true });
const config = require('../config/config');
const subscriptionService = require('./services/subscriptionService');

// 注册插件
async function registerPlugins() {
  // CORS
  await fastify.register(require('@fastify/cors'), {
    origin: true
  });

  // Swagger
  await fastify.register(require('@fastify/swagger'), {
    routePrefix: '/documentation',
    swagger: {
      info: {
        title: '订阅流量监控 API',
        description: '用于监控Clash订阅流量使用情况的API',
        version: '1.0.0'
      },
      externalDocs: {
        url: 'https://github.com/yourusername/clash_subscription_monitor',
        description: 'GitHub仓库'
      },
      host: 'localhost',
      schemes: ['http'],
      consumes: ['application/json'],
      produces: ['application/json']
    },
    exposeRoute: true
  });

  // 静态文件
  await fastify.register(require('@fastify/static'), {
    root: path.join(__dirname, 'public'),
    prefix: '/'
  });
}

// 注册路由
async function registerRoutes() {
  fastify.register(require('./routes/subscription'));
}

// 启动服务器
async function startServer() {
  try {
    // 注册插件
    await registerPlugins();
    
    // 注册路由
    await registerRoutes();
    
    // 设置根路由
    fastify.get('/', async (request, reply) => {
      return reply.sendFile('index.html');
    });
    
    // 启动服务器
    await fastify.listen({ port: config.port, host: '0.0.0.0' });
    fastify.log.info(`服务器正在运行，端口: ${config.port}`);
    
    // 开始定时检查
    subscriptionService.startPeriodicCheck();
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// 启动服务器
startServer(); 
