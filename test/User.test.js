const redis = require('../src/redis.js')
const User = require('../src/class/User.js')
const mysql = require('../src/mysql.js')

const userName = 'testUser'
const userPassword = '123456'

setTimeout(() => {
  describe('User', function () {
    after(function () {
      // api 用到mysql,与redis，必须关闭才会自动结束测试脚本
      redis.quit()
      mysql.quit()
    })
    describe('账号 注册、登陆、注销', function () {
      let token
      it('注册 register', function (done) {
        User.register(userName, userPassword)
          .then((v) => { done() })
          .catch((err) => { done(err) })
      })
      it('登陆 login', function (done) {
        User.login(userName, userPassword)
          .then((v) => {
            token = v.token
            done()
          })
          .catch((err) => { done(err) })
      })
      it('注销 logout', function (done) {
        User.logout(token)
          .then((v) => { done() })
          .catch((err) => { done(err) })
      })
      it('通过mysql命令直接删除测试账号', function (done) {
        mysql.sqlDelete('user', ['name', userName])
        .then(() => { done() })
        .catch(err => { done(err) })
      })
    })
  })
  run()
}, 200)
