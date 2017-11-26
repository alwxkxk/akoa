
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
    describe('redis基本语法 简单测试', function () {
      it('SET', function (done) {
        redis.setAsync('test', '123')
        .then((reply) => {
          assert.equal(reply, 'OK')
          done()
        })
        .catch((err) => { done(err) })
      })
      it('DEL', function (done) {
        redis.delAsync('test')
        .then((reply) => {
          assert.equal(reply, 1)
          done()
        })
        .catch((err) => { done(err) })
      })
    })
    describe('自定义函数测试setToken，tokenValidate，deleteToken', function () {
      it('setToken会产生token(两个缓存)，tokenValidate检测token存在与否，deleteToken删除token', async function () {
        let token
        await redis.setToken('setTokenTest')
        .then((replys) => {
          token = replys[0]
          return Promise.resolve(token)
        })
        .then(token => {
          // console.log(token)
          return redis.tokenValidate(token)
        })
        .then(v => {
          // console.log(v)
          return redis.getAsync('setTokenTest')
          .then(v => {
            assert.equal(v, token, 'setTokenTest的值与所设token不同')
          })
        })
        .then(v => {
          return redis.deleteToken('setTokenTest')
        })
        .catch((err) => { assert.fail(err) })
      })
    })
  })
  run()
}, 1000)
