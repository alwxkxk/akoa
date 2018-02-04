
const Router = require('koa-better-router')
const router = Router().loadMethods()
const body = require('koa-better-body')
const _ = require('lodash')
const common = require('./common.js')
const Joi = require('joi')
const asyncBusboy = require('async-busboy')
const config = require('../config/config.js')
const path = require('path')
const fs = require('fs')
const util = require('util')
const emailer = require('./emailer.js')
const log = require('./log.js')
const isDebug = require('../config/config.js').isDebug
const redis = require('./redis.js')

const user = require('./object/user.js')
const administrator = require('./object/administrator.js')
let api = Router({ prefix: '/api' })  // 所有API路由都有/api前缀

/**
 * 1.设定默认响应类型为json，
 * 2.提取 token 至 ctx.$token，若token不存在则设置2003错误响应
 *
 * @param {any} ctx
 * @param {any} next
 * @returns
 */
function setAll (ctx, next) {
  ctx.type = 'json'// 将所有/api路由设置为 json 响应
  // 设定自定义变量ctx.$token   从cookie或header中提取出token
  ctx.$token = ctx.header.token || ctx.cookies.get('token')
  if (!ctx.$token) {
    ctx.body = common.httpResponse(2003)// 若token不存在 就默认设置返回 2003错误
  }
  return next()
}

const paramsRequireList = {
  name: Joi.string().required(),
  password: Joi.string().required(),
  newPassword: Joi.string().required(),
  email: Joi.string().email().required(),
  sensitiveToken: Joi.string().required(),
  nickName: Joi.string().required()
}

/**
 * ctx.request.fields通过检验后赋予ctx.$requestBody。
 * 若检验不通过，设置ctx.body为1001错误，及附带错误信息。
 * 注意：
 * 1.必须先经过koa-better-body处理（即先body()）
 * 2.requiredList必须要在paramsRequireList中，否则抛错。所以
 * @param {any} ctx
 * @param {any} next
 * @param {array} requiredList
 */
function checkParams (ctx, requiredList) {
  const requestBody = ctx.request.fields
  if (isDebug) console.log('fields:', requestBody)
  const require = _.pick(paramsRequireList, requiredList)
  if (_.size(require) !== _.size(requiredList)) {
    throw 'requiredList必须在(' + _.keys(paramsRequireList) + '),' + requiredList + '有误'
  }

  const schema = Joi.object().keys(require)
  const result = Joi.validate(requestBody, schema, { abortEarly: false })
  if (result.error) {
    const details = { details: _.map(result.error.details, 'message') }
    ctx.body = common.httpResponse(1001, details)
    const detailsString = JSON.stringify(details)
    log.warn(`${ctx.method} ${ctx.url} - ${detailsString}`)
  } else {
    ctx.$requestBody = requestBody
  }
}

// POST /api/test 测试专用API 返回请求的所有信息
router.post('/test', body(), setAll, function * (next) {
  const data = {
    request: this.request || null,
    fields: this.request.fields || null,
    files: this.request.files || null,
    body: this.request.body || null
  }
  // console.log(data)
  // this.cookies.set('cookieTest', 'test')// 测试cookies
  // console.log(this.cookies.get('token'))
  // console.log(this.cookies)
  this.type = 'json'  // 这里的this 等效于ctx
  this.body = common.httpResponse(0, data)
  yield next
})

// POST /api/user 注册账号
// request body : {name:'',password:''}
router.post('/user', body(), setAll, async function (ctx, next) {
  // 参数检查
  checkParams(ctx, ['name', 'password'])
  if (!ctx.$requestBody) return next()

  await user.register(ctx.$requestBody.name, ctx.$requestBody.password)
  .then(() => { ctx.body = common.httpResponse(0) })
  .catch((err) => { ctx.body = common.httpResponse(1, err) })

  return next()
})

// POST /api/token  账号登陆成功 创建新的会话 返回token并设置为cookie
// request body : {name:'',password:''}
// response 成功的返回数据 包含用户信息user:{...}
router.post('/token', body(), setAll, async function (ctx, next) {
  // 参数检查
  checkParams(ctx, ['name', 'password'])
  if (!ctx.$requestBody) return next()

   // 账号登陆
  await user.login(ctx.$requestBody.name, ctx.$requestBody.password)
    .then((user) => {
      ctx.cookies.set('token', user.token)
      ctx.body = common.httpResponse(0, user)
    })
   .catch((err) => {
     ctx.body = common.httpResponse(2002, err)
   })

  return next()
})

// DELETE /api/token 账号退出登陆 销毁当前会话
// request header or cookie 'token'
router.del('/token', body(), setAll, async function (ctx, next) {
  if (!ctx.$token) return next()

  // 从缓存中删除此token
  await user.logout(ctx.$token)
  .then((v) => {
    ctx.body = common.httpResponse(0)
  })
  .catch((err) => {
    // token 无效
    ctx.body = common.httpResponse(2003, err)
  })
  return next()
})

// GET /api/log  取得用户日志
// request header or cookie 'token'
// response 成功的返回数据 包含日志列表logList:[...]
router.get('/log', body(), setAll, async function (ctx, next) {
  if (!ctx.$token) return next()

  await user.getUserLog(ctx.$token)
  .then(logList => {
    ctx.body = common.httpResponse(0, logList)
  })
  .catch(e => {
    ctx.body = common.httpResponse(1, e)
  })

  return next()
})

// PUT /api/password 修改用户密码
// request header or cookie 'token',body:{password:'',newPassword:''}
router.put('/password', body(), setAll, async function (ctx, next) {
  if (!ctx.$token) return next()

  // 参数检查
  checkParams(ctx, ['password', 'newPassword'])
  if (!ctx.$requestBody) return next()

  await user.changePassword(ctx.$token, ctx.$requestBody.password, ctx.$requestBody.newPassword)
  .then((v) => { ctx.body = common.httpResponse(0) })
  .catch(err => { ctx.body = common.httpResponse(1, err) })
  return next()
})

// DELETE  /api/password/email/:email 忘记密码 删除旧密码，给邮箱发送新的随机密码
router.del('/password/email/:email', setAll, async function (ctx, next) {
  const data = {}
  data.email = ctx.params.email
  const schema = Joi.object().keys({
    email: Joi.string().email().required()
  })
  const result = Joi.validate(data, schema, { abortEarly: false })
  if (result.error) {
    // 取得参数有误的所有messages
    const details = { details: _.map(result.error.details, 'message') }
    ctx.body = common.httpResponse(1001, details)
    return next()
  }

  await user.forgetPassword(data.email)
  .then(v => { ctx.body = common.httpResponse(0) })
  .catch(err => { ctx.body = common.httpResponse(1, err) })
  return next()
})

// post /api/avatar 更改用户头像
// request header or cookie 'token',body: form-data:image file
// response 成功的返回数据 包含图片名称 imageName:...
router.post('/avatar', setAll, async function (ctx, next) {
  if (!ctx.$token) return next()

  const { files } = await asyncBusboy(ctx.req)
  if (files[0]) {
    const image = files[0]
    const suffix = path.extname(image.filename)
    if (config.ImageType.indexOf(suffix) === -1) {
      // 图片格式错误
      ctx.body = common.httpResponse(1003)
      return next()
    }
    const imageName = common.uuid() + suffix
    const saveTo = path.join(config.ImagePath, imageName)
    // 取得文件后缀名 格式检查 用uuid创建新文件
    image.pipe(fs.createWriteStream(saveTo))
    // 返回图片名
    await user.changeAvatar(ctx.$token, imageName)
    .then((v) => {
      ctx.body = common.httpResponse(0, {imageName: imageName})
      return next()
    })
    .catch((err) => {
      ctx.body = common.httpResponse(1, err)
      return next()
    })
  } else {
    ctx.body = common.httpResponse(1003)
    return next()
  }
})

// post /api/file 上传文件
// request header or cookie 'token',body: form-data:file
// response 成功的返回数据 包含文件名称、大小、uuid名
router.post('/file', setAll, async function (ctx, next) {
  if (!ctx.$token) return next()

  const { files } = await asyncBusboy(ctx.req)
  const file = files[0]
  await user.uploadFile(ctx.$token, file)
  .then((v) => { ctx.body = common.httpResponse(0, v) })
  .catch(err => { ctx.body = common.httpResponse(1, err) })
})

// get /api/fileList 获取文件列表
// request header or cookie 'token',
// response 成功的返回数据 包含文件名称、大小、uuid名、创建时间
router.get('/fileList', setAll, async function (ctx, next) {
  if (!ctx.$token) return next()
  // 管理员与普通用户共用接口
  await administrator.isAdministrator(ctx.$token)
  .then(is => {
    if (is) return administrator.getFileList(ctx.$token)
    else return user.fileList(ctx.$token)
  })
  .then((v) => { ctx.body = common.httpResponse(0, v) })
  .catch(err => { ctx.body = common.httpResponse(1, err) })
  return next()
})

// delete /api/file/:uuid 删除文件
// request header or cookie 'token'
router.del('/file/:uuid', setAll, async function (ctx, next) {
  if (!ctx.$token) return next()

  await administrator.isAdministrator(ctx.$token)
  .then(is => {
    if (is) return administrator.deleteFile(ctx.$token, ctx.params.uuid)
    else return user.deleteFile(ctx.$token, ctx.params.uuid)
  })
  .then(() => { ctx.body = common.httpResponse(0) })
  .catch(err => { ctx.body = common.httpResponse(1, err) })
  return next()
})

// GET /api/file/:uuid 下载文件
// response 成功的返回文件
router.get('/file/:uuid', setAll, async function (ctx, next) {
  if (!ctx.$token) return next()
  await administrator.isAdministrator(ctx.$token)
  .then(is => {
    if (is) return administrator.downloadFile(ctx.$token, ctx.params.uuid)
    else return user.downloadFile(ctx.$token, ctx.params.uuid)
  })
  .then(file => {
    ctx.body = file
    ctx.type = 'application/octet-stream'
  })
  .catch(err => { ctx.body = common.httpResponse(1, err) })

  return next()
})

// post /api/email 用户申请 修改邮箱
// request header or cookie 'token',body: {password:'',email:''}
router.post('/email', body(), setAll, async function (ctx, next) {
  if (!ctx.$token) return next()

  // 参数检查
  checkParams(ctx, ['password', 'email'])
  if (!ctx.$requestBody) return next()

  await user.getSensitiveToken(ctx.$token, ctx.$requestBody.password)
  .then(sensitiveToken => {
    emailer.userSetEmail(ctx.$requestBody.email, sensitiveToken)
    ctx.body = common.httpResponse(0)
  })
  .catch(err => { ctx.body = common.httpResponse(1, err) })
  return next()
})

// GET /sensitiveToken/:sensitiveToken/email/:email 点击url 修改用户邮箱地址
router.get('/sensitiveToken/:sensitiveToken/email/:email', setAll, async function (ctx, next) {
  const data = {}
  data.sensitiveToken = ctx.params.sensitiveToken
  data.email = ctx.params.email
  const schema = Joi.object().keys({
    sensitiveToken: Joi.string().required(),
    email: Joi.string().email().required()
  })
  const result = Joi.validate(data, schema, { abortEarly: false })
  if (result.error) {
    // 取得参数有误的所有messages
    const details = { details: _.map(result.error.details, 'message') }
    ctx.body = common.httpResponse(1001, details)
    return next()
  }
  await user.setEmail(data.sensitiveToken, data.email)
  .then(v => {
    ctx.body = '修改邮件成功'
  })
  .catch(err => { ctx.body = '修改邮件失败：' + err })
  ctx.type = 'html'
  return next()
})

// put /api/nickName 修改用户昵称
// request header or cookie 'token',body: {nickName:''}
router.put('/nickName', body(), setAll, async function (ctx, next) {
  if (!ctx.$token) return next()

  // 参数检查
  checkParams(ctx, ['nickName'])
  if (!ctx.$requestBody) return next()

  await user.changeNickName(ctx.$token, ctx.$requestBody.nickName)
  .then(v => { ctx.body = common.httpResponse(0) })
  .catch(err => { ctx.body = common.httpResponse(1, err) })
  return next()
})

// ------------------- 管理员相关的API----------------------------
// GET /api/userList 管理员获取用户列表
// request header or cookie 'token'
router.get('/userList', body(), setAll, async function (ctx, next) {
  if (!ctx.$token) return next()

  await administrator.getUserList(ctx.$token)
  .then(userList => {
    ctx.body = common.httpResponse(0, userList)
  })
  .catch(err => { ctx.body = common.httpResponse(1, err) })
  return next()
})

// DELETE /api/user/:name 删除账号 暂时只能由管理员操作
// request header or cookie 'token'
router.del('/user/:name', body(), setAll, async function (ctx, next) {
  if (!ctx.$token) return next()
  const name = ctx.params.name
  await administrator.deleteUser(ctx.$token, name)
  .then(() => { ctx.body = common.httpResponse(0) })
  .catch(err => { ctx.body = common.httpResponse(1, err) })
  return next()
})

// ------------------- 非用户直接相关的API----------------------------
// POST /api/image 上传一张图片
// request body: form-data:image file
// response 成功的返回数据 包含图片名称 imageName:...
router.post('/image', setAll, async function (ctx, next) {
  // 特别地 不要koa-better-body来解析，否则busboy无法正常解析
  const { files } = await asyncBusboy(ctx.req)
  if (files[0]) {
    const image = files[0]
    const suffix = path.extname(image.filename)
    if (config.ImageType.indexOf(suffix) === -1) {
      // 图片格式错误
      ctx.body = common.httpResponse(1003)
      return next()
    }
    const imageName = common.uuid() + suffix
    const saveTo = path.join(config.ImagePath, imageName)
    // 取得文件后缀名 格式检查 用uuid创建新文件
    image.pipe(fs.createWriteStream(saveTo))
    // 返回图片路径
    ctx.body = common.httpResponse(0, {imageName: imageName})
    return next()
  } else {
    ctx.body = common.httpResponse(1003)
    return next()
  }
})

// GET /api/image/:imageName 取得一张图片
// NOTE: 一般使用nginx直接指向images文件目录并开启缓存 效果更好。
// response 成功的返回数据 包含图片
router.get('/image/:imageName', setAll, async function (ctx, next) {
  const imageName = ctx.params.imageName
  // console.log(ctx.params.imageName)
  const readFile = util.promisify(fs.readFile)
  const image = await readFile(path.join(config.ImagePath, imageName))
  ctx.body = image
  ctx.type = 'image/' + path.extname(imageName).substr(1)
  return next()
})

router.get('/checkNoRepeat/:key/:value', async function (ctx, next) {
  await redis.checkNoRepeat(ctx.params.key, ctx.params.value)
  .then(v => {
    // console.log(v)
    ctx.body = common.httpResponse(0, '通过检测')
  })
  .catch(err => { ctx.body = common.httpResponse(1, err) })
  ctx.type = 'json'
  return next()
})

api.extend(router)
module.exports = api
