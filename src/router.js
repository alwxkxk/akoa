let body = require('koa-better-body')
let router = require('koa-better-router')().loadMethods()
let _ = require('lodash')
let common = require('./common.js')

router.addRoute('GET', '/', (ctx, next) => {
  ctx.cookies.set('cookieTest', 'test')
  ctx.body = 'this is /index'
})

module.exports = router
