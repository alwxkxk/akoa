var assert = require('assert')
let mysql = require('../src/mysql.js')

setTimeout(function () {
  describe('mysql', function () {
    after(function () {
      // 关闭连接池
      setTimeout(function () {
        mysql.end()
      }, 1000)
    })
    describe('CURD', function () {
      it('create,update,read,delete 正常流程测试', async function () {
        let okPacket, read
        // 一开始不应该存在 testName用户
        read = await mysql.read('user', ['name'], ['name', 'testName'])
        assert.deepStrictEqual(read, [])

        okPacket = await mysql.insert('user', ['name', 'password', 'nick_name', 'create_time', 'last_time'], ['testName', 'testPassword', 'testNickname', '2011-04-08 0:00:00', '2011-04-08 0:00:00'])
        assert.equal(okPacket.affectedRows, 1)
        read = await mysql.read('user', ['name', 'password'], ['name', 'testName'])

        // 插入testName用户后再读取一下是否正确，证明create 与 read 都正常
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
      // TODO:describe('不正确语句测试 create', 
      // TODO:describe('不正确语句测试update', 
      // TODO:describe('不正确语句测试read',
      // TODO:describe('不正确语句测试delete', 
    })
  })
  run()
}, 1000)
