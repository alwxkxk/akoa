
const redisConfig = require('../config/config.js').redisConfig
const EXPIRE = require('../config/config.js').EXPIRE
const redis = require('redis')
const bluebird = require('bluebird')
const common = require('./common.js')
const md5 = require('md5')

let client = redis.createClient(redisConfig)

bluebird.promisifyAll(redis.RedisClient.prototype)
// 到此，可以使用加Async的后缀实现promise化 client.getAsync('foo').then(function(res) {
bluebird.promisifyAll(redis.Multi.prototype)

client.on('error', function (err) {
  console.log('Error ' + err)
})

client.on('connect', function (err) {
  if (err) console.log('Error ' + err)
  console.log('redis connect.')
})

client.on('reconnecting', function (err) {
  if (err) console.log('Error ' + err)
  console.log('redis reconnecting.')
})

client.on('end', function (err) {
  if (err) console.log('Error ' + err)
  console.log('redis end.')
})

/**
 * 以name创建两条缓存,设置生存时间，分别是name->token,token->user，且会将旧token删除。
 *
 * @param {string} user 账号数据
 * @returns {Promise} 返回Promise对象，resolve values[token,reply,reply],reject err
 */
client.setToken = async function setToken (user) {
  let now = common.now()
  let token = md5(user.name + now)
   // 将 user对象里的键值按序插入数组 [key1,value1,key2,value2...]
  let userArray = []
  for (const prop in user) {
    userArray.push(prop)
    user[prop] ? userArray.push(user[prop]) : userArray.push('')// 将null值手动转换为''以免redis报错
  }

  await client.deleteToken(user.name)// 将旧的token删除
  return Promise.all([
    Promise.resolve(token), // 将token传出去
    client.hsetAsync(token, ...userArray)// 扩展符...
    .then(() => {
      return client.expireAsync(token, EXPIRE)
    }),
    client.setAsync(user.name, token, 'EX', EXPIRE)
  ])
}

/**
 * 以name创建sensitiveToken
 *
 * @param {string} name 账号名
 * @returns {Promise} 返回Promise对象，resolve ${sensitiveToken},reject err
 */
client.setSensitiveToken = function setSensitiveToken (name) {
  let now = common.now()
  let setSensitiveToken = md5(name + now)
  return client.setAsync(setSensitiveToken, name, 'EX', 30 * 60) // 有效时间为30分钟
  .then(reply => { return Promise.resolve(setSensitiveToken) }) // 将setSensitiveToken传出去})
}
/**
 * 删除name及其对应的token两个缓存
 *
 * @param {string} name 账号名
 * @returns {Promise} 返回Promise对象，resolve {redisReply},reject err
 */
client.deleteToken = function deleteToken (name) {
  return client.getAsync(name)
  .then(token => {
    // console.log('will delete',token)
    return token ? client.delAsync(token) : Promise.resolve('token已失效')
  })
  .then(v => { return client.delAsync(name) })
}
/**
 * 检验token是否有效
 *
 * @param {string} token
 * @returns {Promise} 返回Promise对象，resolve 'token有效',reject err||'token无效'
 */
client.tokenValidate = function tokenValidate (token) {
  return client.hexistsAsync(token, 'name')
  .then(reply => {
    // console.log(reply,typeof reply)   //reply是number类型
    return reply === 1 ? Promise.resolve('token有效') : Promise.reject('token无效')
  })
}

/**
 * 通过token取得name
 *
 * @param {string} token
 * @returns {Promise} resolve name
 */
client.getNameByToken = function getNameByToken (token) {
  return client.hgetAsync(token, 'name')
}

/**
 * 通过SensitiveToken取得name
 *
 * @param {string} sensitiveToken
 * @returns {Promise} resolve name
 */
client.getNameBySensitiveToken = function getNameBySensitiveToken (sensitiveToken) {
  return client.getAsync(sensitiveToken)
}

// TODO:初始化，将所有账号名保存到一个列表中
// TODO:提供 redis检测有无账号名重名的API   nameUnique
// 结束连接
// client.quit()
module.exports = client
