const redisConfig = require('../config/config.js').redisConfig
const redis = require('redis')
const bluebird = require('bluebird')

let client = redis.createClient(redisConfig)

bluebird.promisifyAll(redis.RedisClient.prototype)
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

// 结束连接
// client.quit()
module.exports = client
