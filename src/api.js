let Router = require('koa-better-router')
let router = Router().loadMethods()
let body = require('koa-better-body')
let _ = require('lodash')
let User = require('./class/User.js')
let uti = require('./utilities.js')
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
  console.log(data)
  this.response.type = 'json'  // 这里的this 等效于ctx
  this.response.body = uti.httpResponse(0, '测试专用接口', data)
  yield next
})

// POST /api/user 注册用户
router.post('/user', body(), async function (ctx, next) {
  // 参数检查
  // let ctx = this
  let post = ctx.request.fields
  ctx.response.type = 'json'
  const schema = Joi.object().keys({
    name: Joi.string().min(3).max(30).required(),
    password: Joi.string().min(3).max(30).required()
  })
  const result = Joi.validate(post, schema, {abortEarly: false})

  if (result.error) {
    let details = {details: _.map(result.error.details, 'message')}
    ctx.response.body = uti.httpResponse(1, '注册账号失败', details)
  } else {
    await User.register(post.name, post.password)
    .then(() => { ctx.response.body = uti.httpResponse(0, '注册账号成功') })
    .catch((err) => { ctx.response.body = uti.httpResponse(1, '注册账号失败', {detail: err}) })
  }
  return next()
},
function * (next) {
  yield next
})

// POST /api/session  用户登陆成功 创建新的会话
router.post('/session', body(), function * (next) {
  // 参数检查
  let data = this.request.fields
  const schema = Joi.object().keys({
    name: Joi.string().min(3).max(30).required(),
    password: Joi.string().min(3).max(30).required()
  })
  const result = Joi.validate(data, schema, {abortEarly: false})
  if (result.error) {
    let details = {details: _.map(result.error.details, 'message')}
    this.response.body = uti.httpResponse(1, '用户登陆失败', details)
  } else {
  // TODO:创建token 保存到缓存 客户端自行保存到本地以作登陆凭证，按需设为header
    this.response.body = uti.httpResponse(0, '用户登陆成功', { token: '12345678abcdefg' })
  }
  this.response.type = 'json'
  yield next
})

// DELETE /api/session 用户退出登陆 销毁当前会话
router.del('/session/:sessionId', body(), function * (next) {
  // 分离并取最后的/:sessionId  一般等于token，除非是管理员手动删除 用户的会话
  let sessionId = this.request.url.split('/').pop()
  // 从header中提取出token。只有所属用户或管理员的token才允许删除此会话
  let token = this.request.header.token
  console.log(token, sessionId)
  // 从缓存中删除此token
  this.response.body = uti.httpResponse(0, '用户退出登陆')
  yield next
})

// DELETE /user/:name 账号注销 删除数据
router.del('/user/:name', body(), function * (next) {
  // 从header中提取出token  只有管理员与或属用户的token才能进行账号注销
  let token = this.request.header.token
  let name = this.request.url.split('/').pop()// 分离并取最后的/:id
  // TODO:敏感操作，应该弹窗提示 是否确认这样做 或许甚至理当输入密码才能做。
  this.response.body = uti.httpResponse(0, '账号注销成功')
  yield next
})

api.extend(router)
module.exports = api
