const Koa = require('koa')
const router = require('./router.js')
const handleError = require('koa-handle-error')
const logger = require('koa-logger')
const log = require('./log.js')
const app = new Koa()

app.use(handleError((err) => { log.error(err) }))  // 错误处理
app.use(logger())// 访问日志记录
app.use(router.middleware())// 路由文件

app.listen(3000, () => {
  console.log('listening ' + 'http://localhost:3000')
})
