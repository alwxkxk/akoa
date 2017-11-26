
var assert = require('assert')
const redis = require('../src/redis.js')
let User = require('../src/class/User.js')
const mysql = require('../src/mysql.js')
setTimeout(() => {
  describe('User', function () {
    after(function () {
      // api 用到mysql,与redis，必须关闭才会自动结束测试脚本
      redis.quit()
      mysql.end()
    })
    describe('用户 注册、登陆、注销、删除账号', function () {
      let token
      it('注册 register', function (done) {
        User.register('testUser', '123456')
          .then((v) => { done() })
          .catch((err) => { done(err) })
      })
      it('登陆 login', function (done) {
        User.login('testUser', '123456')
          .then((v) => {
            token = v
            done()
          })
          .catch((err) => { done(err) })
      })
      it('注销 logout', function (done) {
        User.logout(token)
          .then((v) => { done() })
          .catch((err) => { done(err) })
      })
      it('删除账号 delete', function (done) {
        User.delete('testUser', '123456')
          .then((v) => { done() })
          .catch((err) => { done(err) })
      })
    })
  })
  run()
}, 200)
