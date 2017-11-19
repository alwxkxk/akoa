const assert = require('assert')
const request = require('supertest')
const Koa = require('koa')
let api = require('../src/api.js')
const handleError = require('koa-handle-error')

const app = new Koa()

app.use(handleError((err) => { log.error(err) }))  // 错误处理
app.use(api.middleware())// API路由文件

setTimeout(function () {
  describe('API test', function () {
    after(function () {

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
        request(app.callback()) // koa2 使用app.callback() 可以在测试完毕后自动退出服务器
        .post('/api/user')
        .send({
          'name': 'abc',
          'password': '123456abc'
        })
        .set('Content-Type', 'application/json')
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err)
          assert.equal(res.body.error_code, 0)
          done()
        })
      })
    })
  })
  run()
}, 1000)
