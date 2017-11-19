let body = require('koa-better-body')
let router = require('koa-better-router')().loadMethods()
let _ = require('lodash')
let User = require('./class/User.js')
let uti = require('./utilities.js')


router.addRoute('GET', '/', (ctx, next) => {
  ctx.body = 'this is /index'
})


module.exports = router
