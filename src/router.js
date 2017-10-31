let router = require('koa-better-router')().loadMethods()

router.addRoute('GET', '/', (ctx, next) => {
  ctx.body = 'this is /index'
})

router.addRoute('GET', '/login', (ctx, next) => {
  ctx.body = 'this is /login'
})

module.exports = router
