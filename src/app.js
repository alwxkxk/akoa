const Koa = require('koa')
const router = require('./router.js')
const handleError = require('koa-handle-error')
const log = require('./log.js')
const api = require('./api.js')
const PORT = require('../config/config.js').PORT
const redis = require('./redis.js')
const cors = require('@koa/cors')
const app = new Koa()
const server = require('http').createServer(app.callback())

require('./connection.js').socketioInit(server)// 给socket.io添加业务逻辑

// app.use(handleError((err) => { log.error(err) }))  // 错误处理

app.use(async (ctx, next) => {
  const start = Date.now()
  await next()
  const ms = Date.now() - start
  const message = `${ctx.method} ${ctx.url} - ${ms}ms ${ctx.status}`
  log.info({message: message})
  console.log(message)
})

app.use(cors({credentials: true})) // 允许跨域请求
app.use(router.middleware())// 路由文件
app.use(api.middleware())// API路由文件
redis.updateCheckList()// 初始化redis 检测列表

server.listen(PORT, () => {
  console.log('listening ' + 'http://localhost:' + PORT)
})
