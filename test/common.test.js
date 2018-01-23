const assert = require('assert')
const common = require('../src/common.js')
const redis = require('../src/redis.js')
const mysql = require('../src/mysql.js')

setTimeout(function () {
  after(function () {
    // 关闭连接池
    setTimeout(function () {
      mysql.quit()
      redis.quit()
    }, 1000)
  })
  describe('common 单元测试', function () {

  })
  run()
}, 1000)
