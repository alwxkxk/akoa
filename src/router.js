let router = require('koa-better-router')().loadMethods()
let body = require('koa-better-body')
let _ = require('lodash')

router.addRoute('GET', '/', (ctx, next) => {
  ctx.body = 'this is /index'
})

router.post('/login', body(), function * (next) {
  let body = _.pick(this.request.body, ['user', 'password'])
  console.log(body)
  this.response.status = 200
  this.response.body = {code: 200}
  yield next
})

module.exports = router
