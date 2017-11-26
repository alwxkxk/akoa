
const redisConfig = require('../config/config.js').redisConfig
const redis = require('redis')
const bluebird = require('bluebird')
const uti = require('./utilities.js')
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
 * 以name创建两条缓存，分别是name->token,token->user，且会将旧token删除。
 *
 * @param {string} name 账号名
 * @returns {Promise} 返回Promise对象，resolve values[token,reply,reply],reject err
 */
client.setToken = async function setToken (name) {
  let now = uti.now()
  let token = md5(name + now)
  await client.deleteToken(name)// 将旧的token删除

  return Promise.all([
    Promise.resolve(token), // 将token传出去
    client.hsetAsync(token, 'name', name, 'create', now),
    client.setAsync(name, token)
  ])
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
// TODO:初始化，将所有用户名保存到一个列表中
// TODO:提供 redis检测有无用户名重名的API   nameUnique
// TODO:设置缓存时间
// 结束连接
// client.quit()
module.exports = client
