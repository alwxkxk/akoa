let Router = require('koa-better-router')
let router = Router().loadMethods()
let body = require('koa-better-body')
let _ = require('lodash')
let User = require('./class/User.js')
let uti = require('./utilities.js')

let api = Router({ prefix: '/api' })  // 所有API路由都有api前缀 

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
router.post('/user', body(), function * (next) {
  // 只提取所需数据
  let body = _.pick(this.request.fields, ['name', 'password'])
  console.log(body)
  this.response.type = 'json'
  this.response.body = uti.httpResponse(0, '注册账号成功')
  yield next
})

// POST /api/session  用户登陆成功 创建新的会话
router.post('/session', body(), function * (next) {
  // 只提取所需数据
  let body = _.pick(this.request.fields, ['name', 'password'])
  // TODO:创建token 保存到缓存 token set cookie ?set header?
  console.log(body)
  this.response.body = uti.httpResponse(0, '用户登陆成功', {token: '12345678abcdefg'})
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
  this.response.body = uti.httpResponse(0, '账号注销成功')
  yield next
})

api.extend(router)
module.exports = api
