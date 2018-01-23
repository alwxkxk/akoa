const assert = require('assert')
let mysql = require('../src/mysql.js')

setTimeout(function () {
  describe('mysql', function () {
    after(function () {
      // 关闭连接池
      setTimeout(function () {
        mysql.quit()
      }, 1000)
    })
    describe('CURD', function () {
      it('create,update,read,delete 正常流程测试', async function () {
        let okPacket, read
        // 一开始不应该存在 testName账号
        read = await mysql.read('user', ['name'], ['name', 'testName'])
        assert.deepStrictEqual(read, [])

        okPacket = await mysql.insert('user', ['name', 'password', 'nick_name', 'create_time', 'last_time'], ['testName', 'testPassword', 'testNickname', '2011-04-08 0:00:00', '2011-04-08 0:00:00'])
        assert.equal(okPacket.affectedRows, 1)
        read = await mysql.read('user', ['name', 'password'], ['name', 'testName'])

        // 插入testName账号后再读取一下是否正确，证明create 与 read 都正常
        assert.equal(read.length, 1)
        assert.equal(read[0].name, 'testName')
        assert.equal(read[0].password, 'testPassword')

        // 测试update正常
        okPacket = await mysql.updated('user', ['name', 'testName2'], ['name', 'testName'])
        assert.equal(okPacket.affectedRows, 1)
        read = await mysql.read('user', ['name'], ['name', 'testName'])
        assert.equal(read.length, 0)
        read = await mysql.read('user', ['name'], ['name', 'testName2'])
        assert.equal(read.length, 1)

        // 测试delete正常
        okPacket = await mysql.sqlDelete('user', ['name', 'testName2'])
        assert.equal(okPacket.affectedRows, 1)
        read = await mysql.read('user', ['name'], ['name', 'testName2'])
        assert.equal(read.length, 0)
      })

      it('非法语句测试 create', async function () {
        // 特别注意，只有MySQL开启了严格模式，才会通过测试
        // insert 不存在的表
        await mysql.insert('talbeUnavailable', 'nothing', 'nothing')
        .then(() => { assert.fail('非法表名，应当被捕抓。') })
        .catch((err) => {
          // console.log(err)
          assert.ok(err)
        })

        // insert 对Data插入错误格式
        await mysql.insert('user', ['name', 'password', 'nick_name', 'create_time', 'last_time'], ['testName', 'testPassword', 'testNickname', 'err', '2011-04-08 0:00:00'])
        .then(() => { assert.fail('非法值，应当被捕抓。') })
        .catch((err) => {
          // console.log(err)
          assert.ok(err)
        })
        // insert 不含必填值
        await mysql.insert('user', 'create_time', '2012-12-12')
        .then(() => { assert.fail('非法值，应当被捕抓。') })
        .catch((err) => {
          // console.log(err)
          assert.ok(err)
        })

        // insert 不足参数
        await mysql.insert('user')
        .then(() => { assert.fail('缺失参数，应当被捕抓。') })
        .catch((err) => {
          // console.log(err)
          assert.ok(err)
        })
      })
    })
    describe('其它测试', function () {
      it('读取所有的name,nickName,email', async function () {
        let read
        read = await mysql.read('user', ['name', 'nick_name', 'email'])
        console.log(read)
      })
    })
  })
  run()
}, 1000)
