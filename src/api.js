
const Router = require('koa-better-router')
const router = Router().loadMethods()
const body = require('koa-better-body')
const _ = require('lodash')
const User = require('./class/User.js')
const common = require('./common.js')
const Joi = require('joi')
const asyncBusboy = require('async-busboy')
const config = require('../config/config.js')
const path = require('path')
const fs = require('fs')
const util = require('util')
const emailer = require('./emailer.js')

let api = Router({ prefix: '/api' })  // 所有API路由都有/api前缀
const setAll = function setAll (ctx, next) {
  ctx.response.type = 'json'// 将所有/api路由设置为json响应
  return next()
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
  console.log(this.cookies.get('token'))
  console.log(this.cookies)
  this.response.type = 'json'  // 这里的this 等效于ctx
  this.response.body = common.httpResponse(0, data)
  yield next
})

// POST /api/user 注册账号
// request body : {name:'',password:''}
router.post('/user', body(), setAll, async function (ctx, next) {
  // 参数检查
  const post = ctx.request.fields

  const schema = Joi.object().keys({
    name: Joi.string().min(3).max(30).required(),
    password: Joi.string().min(3).max(30).required()
  })
  const result = Joi.validate(post, schema, { abortEarly: false })

  if (result.error) {
    const details = { details: _.map(result.error.details, 'message') }
    ctx.response.body = common.httpResponse(1001, details)
  } else {
    await User.register(post.name, post.password)
      .then(() => { ctx.response.body = common.httpResponse(0) })
      .catch((err) => { ctx.response.body = common.httpResponse(1, { detail: err }) })
  }
  return next()
},
function * (next) {
  yield next
})

// POST /api/token  账号登陆成功 创建新的会话 返回token并设置为cookie
// request body : {name:'',password:''}
// response 成功的返回数据 包含用户信息user:{...}
router.post('/token', body(), setAll, async function (ctx, next) {
 // 参数检查
  const data = ctx.request.fields
  const schema = Joi.object().keys({
    name: Joi.string().min(3).max(30).required(),
    password: Joi.string().min(3).max(30).required()
  })
  const result = Joi.validate(data, schema, { abortEarly: false })

  if (result.error) {
   // 取得参数有误的所有messages
    const details = { details: _.map(result.error.details, 'message') }
    ctx.response.body = common.httpResponse(1001, details)
    return next()
  }
   // 账号登陆
  await User.login(data.name, data.password)
    .then((user) => {
      ctx.cookies.set('token', user.token)
      ctx.response.body = common.httpResponse(0, user)
    })
   .catch((err) => {
     ctx.response.body = common.httpResponse(2002, err)
   })

  return next()
}, function * (next) {
  yield next
})

// DELETE /api/token 账号退出登陆 销毁当前会话
// request header or cookie 'token'
router.del('/token', body(), setAll, async function (ctx, next) {
  // 从cookie或header中提取出token
  const token = ctx.request.header.token || ctx.cookies.get('token')
  if (!token) {
    ctx.response.body = common.httpResponse(2003)// token无效
    return next()
  }
  // console.log(ctx.request.header.token, ctx.cookies.get('token'))

  // 从缓存中删除此token
  await User.logout(token)
  .then((v) => {
    ctx.response.body = common.httpResponse(0)
  })
  .catch((err) => {
    // token 无效
    ctx.response.body = common.httpResponse(2003, err)
  })

  return next()
}, function * (next) {
  yield next
})

// DELETE /user 删除账号 暂时只能由管理员操作
// router.del('/user', body(), setAll, function * (next) {
//   // 从header中提取出token  只有管理员与或属账号的token才能进行账号注销
//   const token = this.request.header.token
//   let name = this.request.url.split('/').pop()// 分离并取最后的/:id
//   // TODO:敏感操作，应该弹窗提示 是否确认这样做 或许甚至理当输入密码才能做。
//   this.response.body = common.httpResponse(0)
//   yield next
// })

// GET /api/log  取得用户日志
// request header or cookie 'token'
// response 成功的返回数据 包含日志列表logList:[...]
router.get('/log', body(), setAll, async function (ctx, next) {
  const token = ctx.request.header.token || ctx.cookies.get('token')
  if (!token) {
    ctx.response.body = common.httpResponse(2003)// token无效
    return next()
  }

  await User.getUserLog(token)
  .then(logList => {
    ctx.response.body = common.httpResponse(0, logList)
  })
  .catch(e => {
    ctx.response.body = common.httpResponse(1, e)
  })

  return next()
},
function * (next) {
  yield next
})

// POST /api/sensitiveToken 通过重输密码 取得敏感操作token
// request header or cookie 'token',body:{password:''}
// response 成功的返回数据 包含敏感token sensitiveToken:...
// router.post('/sensitiveToken', body(), setAll, async function (ctx, next) {
//   const token = ctx.request.header.token || ctx.cookies.get('token')
//   if (!token) {
//     ctx.response.body = common.httpResponse(2003)// token无效
//     return next()
//   }
//   const data = ctx.request.fields
//   const schema = Joi.object().keys({
//     password: Joi.string().min(3).max(30).required()
//   })
//   const result = Joi.validate(data, schema, { abortEarly: false })
//   if (result.error) {
//     // 取得参数有误的所有messages
//     const details = { details: _.map(result.error.details, 'message') }
//     ctx.response.body = common.httpResponse(1001, details)
//     return next()
//   }

//   await User.comfirmPassword(token, data.password)
//   .then(sensitiveToken => { ctx.response.body = common.httpResponse(0, {sensitiveToken: sensitiveToken}) })
//   .catch(err => { ctx.response.body = common.httpResponse(1, err) })
//   return next()
// },
// function * (next) {
//   yield next
// })

// PUT /api/password 修改用户密码
// request header or cookie 'token',body:{password:'',newPassword:''}
router.put('/password', body(), setAll, async function (ctx, next) {
  const token = ctx.request.header.token || ctx.cookies.get('token')
  if (!token) {
    ctx.response.body = common.httpResponse(2003)// token无效
    return next()
  }
  const data = ctx.request.fields
  const schema = Joi.object().keys({
    password: Joi.string().min(3).max(30).required(),
    newPassword: Joi.string().min(3).max(30).required()
  })
  const result = Joi.validate(data, schema, { abortEarly: false })
  if (result.error) {
    // 取得参数有误的所有messages
    const details = { details: _.map(result.error.details, 'message') }
    ctx.response.body = common.httpResponse(1001, details)
    return next()
  }

  await User.changePassword(token, data.password, data.newPassword)
  .then((v) => { ctx.response.body = common.httpResponse(0) })
  .catch(err => { ctx.response.body = common.httpResponse(1, err) })
  return next()
},
function * (next) {
  yield next
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
    ctx.response.body = common.httpResponse(1001, details)
    return next()
  }

  await User.forgetPassword(data.email)
  .then(v => { ctx.response.body = common.httpResponse(0) })
  .catch(err => { ctx.response.body = common.httpResponse(1, err) })
  return next()
}, function * (next) {
  yield next
})

// post /api/avatar 更改用户头像
// request header or cookie 'token',body: form-data:image file
// response 成功的返回数据 包含图片名称 imageName:...
router.post('/avatar', setAll, async function (ctx, next) {
  const token = ctx.request.header.token || ctx.cookies.get('token')
  if (!token) {
    ctx.response.body = common.httpResponse(2003)// token无效
    return next()
  }
  const { files } = await asyncBusboy(ctx.req)
  if (files[0]) {
    const image = files[0]
    const suffix = path.extname(image.filename)
    if (config.ImageType.indexOf(suffix) === -1) {
      // 图片格式错误
      ctx.response.body = common.httpResponse(1003)
      return next()
    }
    const imageName = common.uuid() + suffix
    const saveTo = path.join(config.ImagePath, imageName)
    // 取得文件后缀名 格式检查 用uuid创建新文件
    image.pipe(fs.createWriteStream(saveTo))
    // 返回图片名
    await User.changeAvatar(token, imageName)
    .then((v) => {
      ctx.response.body = common.httpResponse(0, {imageName: imageName})
      return next()
    })
    .catch((err) => {
      ctx.response.body = common.httpResponse(1, err)
      return next()
    })
  } else {
    ctx.response.body = common.httpResponse(1003)
    return next()
  }
}, function * (next) {
  yield next
})

// post /api/email 用户申请 修改邮箱
// request header or cookie 'token',body: {password:'',email:''}
router.post('/email', body(), setAll, async function (ctx, next) {
  const token = ctx.request.header.token || ctx.cookies.get('token')
  if (!token) {
    ctx.response.body = common.httpResponse(2003)// token无效
    return next()
  }
  const data = ctx.request.fields
  const schema = Joi.object().keys({
    password: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required()
  })
  const result = Joi.validate(data, schema, { abortEarly: false })
  if (result.error) {
    // 取得参数有误的所有messages
    const details = { details: _.map(result.error.details, 'message') }
    ctx.response.body = common.httpResponse(1001, details)
    return next()
  }

  await User.getSensitiveToken(token, data.password)
  .then(sensitiveToken => {
    emailer.userSetEmail(data.email, sensitiveToken)
    ctx.response.body = common.httpResponse(0)
  })
  .catch(err => { ctx.response.body = common.httpResponse(1, err) })
  return next()
}, function * (next) {
  yield next
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
    ctx.response.body = common.httpResponse(1001, details)
    return next()
  }
  await User.setEmail(data.sensitiveToken, data.email)
  .then(v => {
    ctx.response.body = '修改邮件成功'
  })
  .catch(err => { ctx.response.body = '修改邮件失败：' + err })
  ctx.response.type = 'html'
  return next()
}, function * (next) {
  yield next
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
      ctx.response.body = common.httpResponse(1003)
      return next()
    }
    const imageName = common.uuid() + suffix
    const saveTo = path.join(config.ImagePath, imageName)
    // 取得文件后缀名 格式检查 用uuid创建新文件
    image.pipe(fs.createWriteStream(saveTo))
    // 返回图片路径
    ctx.response.body = common.httpResponse(0, {imageName: imageName})
    return next()
  } else {
    ctx.response.body = common.httpResponse(1003)
    return next()
  }
}, function * (next) {
  yield next
})

// GET /api/image/:imageName 取得一张图片
// NOTE: 一般使用nginx直接指向images文件目录并开启缓存 效果更好。
// response 成功的返回数据 包含图片
router.get('/image/:imageName', setAll, async function (ctx, next) {
  const imageName = ctx.params.imageName
  // console.log(ctx.params.imageName)
  const readFile = util.promisify(fs.readFile)
  const image = await readFile(path.join(config.ImagePath, imageName))
  ctx.response.body = image
  ctx.response.type = 'image/' + path.extname(imageName).substr(1)
  return next()
}, function * (next) {
  yield next
})

api.extend(router)
module.exports = api
