const mysql = require('../mysql.js')
const sqlQuery = require('../../config/sql-query.js')
const mysqlConfig = require('../../config/config.js').mysqlConfig
const initConfig = require('../../config/config.js').initConfig
const _ = require('lodash')
const redis = require('../redis.js')

const Administrator = require('../class/Administrator.js')
let errorFlag = false
init()
// 检查redis版本与配置
// 初始化数据库
// initTable()

async function init () {
  try {
    await initDatabase()
    await initTable()
    await insertAdmin()
  } catch (error) {
    console.log('发生错误:', error)
  }
  if (errorFlag) console.log('初始化失败')
  else console.log('初始化成功')
  mysql.quit()
  redis.quit()
}

async function insertAdmin () {
  return Administrator.register(initConfig.adminName, initConfig.adminPassword)
}

/**
 * 初始化数据库，创建表格
 *
 */
async function initTable () {
  const pall = []
  _.forEach(sqlQuery.createTable, function (value, key) {
    const p = new Promise((resolve, reject) => {
      mysql.query(value)
      .then(() => {
        resolve()
        console.log('创建表：' + key + '成功')
      })
      .catch(err => {
        console.log(err)
        errorFlag = true
        reject('创建表：' + key + '失败。')
      })
    })
    pall.push(p)
  })
  return Promise.all(pall)
}

/**
 * 创建数据库
 *
 * @returns
 */
function initDatabase () {
  let mysql = require('mysql')
  let connection = mysql.createConnection(_.pick(mysqlConfig, ['host', 'port', 'user', 'password']))
  return new Promise((resolve, reject) => {
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
      connection.query('CREATE DATABASE ' + mysqlConfig.database + ';', function (error, results, fields) {
        if (error) {
          return reject('创建数据库' + mysqlConfig.database + '失败。')
        }
        console.log('创建' + mysqlConfig.database + '数据库成功')
        return resolve()
      })
    })
  })
  .then(() => {
    connection.end()
  })
  .catch(err => {
    errorFlag = true
    console.log(err)
    connection.end()
    return Promise.reject('创建数据库失败')
  })
}
