let assert = require('assert')
let redis = require('../src/redis.js')

setTimeout(function () {
  describe('redis', function () {
    after(function () {
      // 关闭连接
      setTimeout(function () {
        redis.quit()
      }, 1000)
    })
    describe('redis 简单测试', function () {
      it('SET', function (done) {
        redis.setAsync('test', '123')
        .then((reply) => {
          assert.equal(reply, 'OK')
          done()
        })
        .catch((err) => { done(err) })
      })
    })
  })
  run()
}, 1000)
