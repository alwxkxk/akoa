let router = require('koa-better-router')().loadMethods()
let body = require('koa-better-body')
router.addRoute('GET', '/', (ctx, next) => {
  ctx.body = 'this is /index'
})

router.post('/login',body(),function *(next) {
  console.log(this.request.files)
  console.log(this.request.fields)

  // there's no `.body` when `multipart`,
  // `urlencoded` or `json` request
  console.log(this.request.body)
  this.response.status=200
  this.response.message='alw message??'
  this.response.body={code:200}
  yield next
})


module.exports = router
