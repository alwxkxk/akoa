const assert = require('assert')
const request = require('supertest')
const Koa = require('koa')
const _ = require('lodash')
const redis = require('../src/redis.js')
const mysql = require('../src/mysql.js')
let api = require('../src/api.js')


const app = new Koa()

app.use(api.middleware())// API路由文件

setTimeout(function () {
  describe('API test', function () {
    after(function () {
      //api 用到mysql,与redis，必须关闭才会自动结束测试脚本
      mysql.end()
      redis.quit()
    })
    describe('测试专用API', function () {
      it('POST /api/test 测试专用API 返回请求的所有信息', function (done) {
        request(app.callback()) // koa2 使用app.callback() 可以在测试完毕后自动退出服务器
        .post('/api/test')
        .send({
          'id': 1,
          'name': 'Mike'
        })
        .set('Content-Type', 'application/json')
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err)
          assert.equal(res.body.data.fields.id, 1)
          assert.equal(res.body.data.fields.name, 'Mike')
          done()
        })
      })
    })

    describe('用户相关API', function () {
      it('POST /api/user 注册用户', function (done) {
        request(app.callback())
        .post('/api/user')
        .send({
          'name': 'abcd',
          'password': '123456abcd'
        })
        .set('Content-Type', 'application/json')
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err)
          assert.equal(res.body.error_code, 0)
          done()
        })
      })
      it('POST /api/session 用户登陆', function (done) {
        request(app.callback())
        .post('/api/session')
        .send({
          'name': 'abcd',
          'password': '123456abcd'
        })
        .set('Content-Type', 'application/json')
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err)
          // console.log(res)
          assert.equal(res.body.error_code, 0)
          assert.ok(res.body.data.token, '响应须包含token')
          assert.ok(_.find(res.header['set-cookie'],
            function (o) { return _.startsWith(o, 'token') }),
            'set-cookie应当包含token')
          done()
        })
      })
    })
  })
  run()
}, 200)
