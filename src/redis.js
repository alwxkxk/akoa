
const redisConfig = require('../config/config.js').redisConfig
const EXPIRE = require('../config/config.js').EXPIRE
const redis = require('redis')
const mysql = require('./mysql.js')
const bluebird = require('bluebird')
const common = require('./common.js')
const md5 = require('md5')
const log = require('./log.js')
let client = redis.createClient(redisConfig)
const checkList = require('../config/config.js').checkList
const _ = require('lodash')

bluebird.promisifyAll(redis.RedisClient.prototype)
// 到此，可以使用加Async的后缀实现promise化 client.getAsync('foo').then(function(res) {
bluebird.promisifyAll(redis.Multi.prototype)

client.on('error', function (err) {
  console.log(err)
  log.error(err)
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
 * @param {String} user 账号数据
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
 * @param {String} name 账号名
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
 * @param {String} name 账号名
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
 * @param {String} token
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
 * @param {String} token
 * @returns {Promise} resolve name
 */
client.getNameByToken = function getNameByToken (token) {
  return client.hgetAsync(token, 'name')
  .then(name => {
    if (name) return Promise.resolve(name)
    else return Promise.reject('token无效')
  })
}

/**
 * 从reids获取用户信息
 *
 * @param {String} token
 * @param {String} key 所需信息的键名
 * @returns
 */
client.getInfoByToken = function getInfoByToken (token, key) {
  return client.hgetAsync(token, key)
  .then(value => {
    if (value) return Promise.resolve(value)
    else return Promise.reject('token无效或查询关键字不存在')
  })
}

/**
 * 通过SensitiveToken取得name
 *
 * @param {String} sensitiveToken
 * @returns {Promise} resolve name
 */
client.getNameBySensitiveToken = function getNameBySensitiveToken (sensitiveToken) {
  return client.getAsync(sensitiveToken)
  .then(name => {
    if (name) return Promise.resolve(name)
    else return Promise.reject('token无效')
  })
}
/**
 * 删除敏感token
 *
 * @param {String} sensitiveToken
 */
client.deleteSensitiveToken = function deleteSensitiveToken (sensitiveToken) {
  client.del(sensitiveToken)
}

/**
 * 通过token获取权限组id
 *
 * @param {String} token
 */
client.getGroupIdByToken = function deleteSensitiveToken (token) {
  return client.hgetAsync(token, 'group_id')
}

/**
 * 检查是否重复
 *
 * @param {String} key 要检查的键名如name,nick_name,email
 * @param {String} value 要检查的值
 * @returns {Promise} 当不存在时即不重复 返回resolve
 */
client.checkNoRepeat = function checkNoRepeat (key, value) {
  if (checkList.indexOf(key) === -1) return Promise.reject('键名错误')
  return client.sismemberAsync(key, value)
  .then(v => {
    console.log(key, value, v, typeof v)
    if (v === 1) {
      return Promise.reject('该值重复')
    } else return Promise.resolve('通过检测')
  })
}

  /**
   * 异步更新 检测列表
   *
   */
client.updateCheckList = function updateCheckList () {
  const checkListObj = {}
  checkList.forEach((value) => {
    checkListObj[value] = []
  })
  mysql.read('user', checkList)
    .then(reads => { // 将checkList的内容全部保存到checkListObj
      _.forEach(reads, function (object) {
        _.forEach(object, function (value, key) {
          if (value) checkListObj[key].push(value)
        })
      })
      console.log(`异步更新检测列表:`, checkListObj)
      _.forEach(checkListObj, function (value, key) { // 更新到redis
        if (value.length > 0) client.SADD(key, ...value)
      })
    })
    .catch(err => {
      console.error(err)
      log.error(err)
    })
}

/**
 * 给检查列表添加新值
 *
 * @param {String} key 健名
 * @param {String} value 值
 */
client.checkListAdd = function checkListAdd (key, value) {
  if (checkList.indexOf(key) === -1) {
    console.error(`${key}不在检查列表`)
    log.error(`${key}不在检查列表`)
  } else {
    client.sadd(key, value)
  }
}

/**
 * 给检查列表删除值
 *
 * @param {String} key 健名
 * @param {String} value 值
 */
client.checkListRemove = function checkListRemove (key, value) {
  if (checkList.indexOf(key) === -1) {
    console.error(`${key}不在检查列表`)
    log.error(`${key}不在检查列表`)
  } else {
    client.srem(key, value)
  }
}
// 结束连接
// client.quit()
module.exports = client
