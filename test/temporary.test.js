let assert = require('assert')
const _ = require('lodash')
const mysqlConfig = require('../config/config.js').mysqlConfig
let mysql = require('mysql')
let connection = mysql.createConnection(_.pick(mysqlConfig, ['host', 'port', 'user', 'password']))

setTimeout(function () {
  describe('mysql', function () {
    after(function () {
    })
    describe('临时测试', function () {
      new Promise((resolve, reject) => {
        connection.connect(function (err) {
          if (err) {
            console.error('error connecting: ' + err.stack)
            errorFlag = true
            return reject('连接数据库失败。')
          }
          resolve()
          console.log('连接数据库成功')
        })
      })
      .then(() => {
        return new Promise((resolve, reject) => {
          connection.query('SHOW databases', function (error, results, fields) {
            if (error) return reject(error)
            console.log(results)
            const dbFlag = _.find(results, function (o) {
              if (o.Database === mysqlConfig.database) {
                return true
              } else { return false }
            })
            if (dbFlag) {
              console.log('数据库已存在')
            } else {
              console.log('数据库不存，需要创建')
            }
          })
        })
      })
    })
  })
  run()
}, 1000)
