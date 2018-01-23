const Koa = require('koa')
const router = require('./router.js')
const handleError = require('koa-handle-error')
const logger = require('koa-logger')
const log = require('./log.js')
const api = require('./api.js')
const STDOUT = require('../config/config.js').STDOUT
const PORT = require('../config/config.js').PORT

const app = new Koa()
// app.use(handleError((err) => { log.error(err) }))  // 错误处理

app.use(async (ctx, next) => {
  const start = Date.now()
  await next()
  const ms = Date.now() - start
  const message = `${ctx.method} ${ctx.url} - ${ms}ms`
  log.info({message: message})
})

app.use(logger())// koa-logger 方便调试

app.use(router.middleware())// 路由文件
app.use(api.middleware())// API路由文件

app.listen(PORT, () => {
  console.log('listening ' + 'http://localhost:' + PORT)
})
