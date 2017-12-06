
const Router = require('koa-better-router')
const router = Router().loadMethods()
const body = require('koa-better-body')
const _ = require('lodash')
const User = require('./class/User.js')
const uti = require('./utilities.js')
const Joi = require('joi')

let api = Router({ prefix: '/api' })  // 所有API路由都有/api前缀

// POST /api/test 测试专用API 返回请求的所有信息
router.post('/test', body(), function * (next) {
  let data = {
    request: this.request || null,
    fields: this.request.fields || null,
    files: this.request.files || null,
    body: this.request.body || null
  }
  // console.log(data)
  // this.cookies.set('cookieTest', 'test')// 测试cookies
  console.log(this.cookies.get('token'))
  console.log(this.cookies)
  this.response.type = 'json'  // 这里的this 等效于ctx
  this.response.body = uti.httpResponse(0, data)
  yield next
})

// POST /api/user 注册账号
router.post('/user', body(), async function (ctx, next) {
  // 参数检查
  let post = ctx.request.fields
  ctx.response.type = 'json'
  const schema = Joi.object().keys({
    name: Joi.string().min(3).max(30).required(),
    password: Joi.string().min(3).max(30).required()
  })
  const result = Joi.validate(post, schema, { abortEarly: false })

  if (result.error) {
    let details = { details: _.map(result.error.details, 'message') }
    ctx.response.body = uti.httpResponse(1001, details)
  } else {
    await User.register(post.name, post.password)
      .then(() => { ctx.response.body = uti.httpResponse(0) })
      .catch((err) => { ctx.response.body = uti.httpResponse(1, { detail: err }) })
  }
  return next()
},
function * (next) {
  yield next
})

// POST /api/session  账号登陆成功 创建新的会话 返回token并设置为cookie
router.post('/session', body(), async function (ctx, next) {
 // 参数检查
  let data = ctx.request.fields
  const schema = Joi.object().keys({
    name: Joi.string().min(3).max(30).required(),
    password: Joi.string().min(3).max(30).required()
  })
  const result = Joi.validate(data, schema, { abortEarly: false })
  ctx.response.type = 'json'

  if (result.error) {
   // 取得参数有误的所有messages
    let details = { details: _.map(result.error.details, 'message') }
    ctx.response.body = uti.httpResponse(1001, details)
    return next()
  }
   // 账号登陆
  await User.login(data.name, data.password)
    .then((user) => {
      ctx.cookies.set('token', user.token)
      ctx.response.body = uti.httpResponse(0, user)
    })
   .catch((err) => {
     ctx.response.body = uti.httpResponse(2002, err)
   })

  return next()
}, function * (next) {
  yield next
})

// DELETE /api/session 账号退出登陆 销毁当前会话
router.del('/session', body(), async function (ctx, next) {
  // 从cookie或header中提取出token
  let token = ctx.request.header.token || ctx.cookies.get('token')
  ctx.response.type = 'json'
  // 从缓存中删除此token
  await User.logout(token)
  .then((v) => {
    ctx.response.body = uti.httpResponse(0)
  })
  .catch((err) => {
    // token 无效
    ctx.response.body = uti.httpResponse(2003, err)
  })

  return next()
}, function * (next) {
  yield next
})

// DELETE /user/:name 删除账号 暂时只能由管理员操作
router.del('/user/:name', body(), function * (next) {
  // 从header中提取出token  只有管理员与或属账号的token才能进行账号注销
  let token = this.request.header.token
  let name = this.request.url.split('/').pop()// 分离并取最后的/:id
  // TODO:敏感操作，应该弹窗提示 是否确认这样做 或许甚至理当输入密码才能做。
  this.response.body = uti.httpResponse(0)
  yield next
})

api.extend(router)
module.exports = api
