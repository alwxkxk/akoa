const redisConfig = require('../config/config.js').redisConfig
let redis = require('redis').createClient(redisConfig)

redis.on('error', function (err) {
  console.log('Error ' + err)
})

redis.on('connect', function (err) {
  if (err) console.log('Error ' + err)
  console.log('redis connect.')
})

redis.on('reconnecting', function (err) {
  if (err) console.log('Error ' + err)
  console.log('redis reconnecting.')
})

redis.on('end', function (err) {
  if (err) console.log('Error ' + err)
  console.log('redis end.')
})

// 结束连接
// redis.quit()
module.exports = redis
