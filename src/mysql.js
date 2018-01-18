const mysql = require('mysql')
const _ = require('lodash')
const mysqlConfig = require('../config/config.js').mysqlConfig
const log = require('./log.js')
var pool = mysql.createPool(mysqlConfig)

// pool.on('acquire', function (connection) {
//   console.log('Connection %d acquired', connection.threadId)
// })
pool.on('connection', function (connection) {
  // console.log('Connection %d built', connection.threadId)
  connection.on('error', function (err) {
    console.log(err) // 'ER_BAD_DB_ERROR'
    log.error(err)
  })
})
// pool.on('enqueue', function () {
//   console.log('Waiting for available connection slot')
// })
// pool.on('release', function (connection) {
//   console.log('Connection %d released', connection.threadId)
// })

/**
 * 执行sql语句，返回Promise对象
 * 注意，此函数没有转义，只允许内部使用，不能接收账号的sql语句以防注入攻击。
 * @param {string} queryString 来自内容的SQL语句
 * @returns {Promise} 返回Promise对象，resolve results,reject err
 */
function query (queryString) {
  return new Promise((resolve, reject) => {
    pool.query(queryString, function (error, results, fields) {
      if (error) return reject(error)
      resolve(results)
    })
  })
}

/**
 * 向某个表插入行
 *
 * @param {string} tableName 表名
 * @param {string|array} column 列表值
 * @param {string|array} value 值
 * @returns {Promise} 返回Promise对象，resolve results,reject err
 */
function insert (tableName, column, value) {
  return new Promise((resolve, reject) => {
    if (!tableName || !column || !value) return reject(new Error('tableName , column and value must not be null'))
    let sqlString = mysql.format('INSERT INTO ?? (??)VALUES (?);', [tableName, column, value])
    // console.log(sqlString)
    pool.query(sqlString, function (error, results, fields) {
      if (error) return reject(error)
      resolve(results)
    })
  })
}

/**
 *删除行
 *
 * @param {string} tableName 表名
 * @param {array} whereList where列表
 * @returns {Promise} 返回Promise对象，resolve results,reject err
 */
function sqlDelete (tableName, whereList) {
  // DELETE FROM 表名称 WHERE 列名称 = 值
  return new Promise((resolve, reject) => {
    if (!tableName || !whereList) return reject(new Error('tableName and whereList must not be null'))
    let sqlString = 'DELETE FROM ?? '
    if (whereList) {
      if (whereList % 2) return reject(new Error('whereList should be even.'))
      else {
        sqlString += 'WHERE ?? = ? ' + _.repeat(['AND ?? = ? '], whereList.length / 2 - 1) + ';'
      }
    }

    sqlString = mysql.format(sqlString, _.concat(tableName, whereList))
    // console.log(sqlString)
    pool.query(sqlString, function (error, results, fields) {
      if (error) return reject(error)
      resolve(results)
    })
  })
}

/**
 * 从表中读取所需值
 *
 * @param {string} tableName 表名
 * @param {array} selectList 想要获取的值
 * @param {array} whereList where列表
 * @returns {Promise} 返回Promise对象，resolve results,reject err
 */
function read (tableName, selectList, whereList) {
  return new Promise((resolve, reject) => {
    if (!tableName || !selectList) return reject(new Error('tableName and selectList must not be null'))
    let sqlString = 'SELECT ?? FROM ??'

    if (whereList) {
      if (whereList.length % 2) { // WHERE 语句要求数组必须有偶数个
        return reject(new Error('whereList should be even.'))
      } else { // 动态生成 WHERE ，AND 语句
        sqlString += 'WHERE ?? = ? ' + _.repeat(['AND ?? = ? '], whereList.length / 2 - 1) + ';'
      }
    }

    sqlString = mysql.format(sqlString, _.concat([selectList, tableName], whereList))
    // console.log(sqlString)
    pool.query(sqlString, function (error, results, fields) {
      if (error) return reject(error)
      else resolve(results)
    })
  })
}

/**
 * 更新表
 *
 * @param {string} tableName 表名
 * @param {array} setList 想要更新的值
 * @param {array} whereList where列表
 * @returns {Promise} 返回Promise对象，resolve results,reject err
 */
function updated (tableName, setList, whereList) {
  return new Promise((resolve, reject) => {
    if (!setList || setList.length % 2) return reject(new Error('setList should be even.'))
    // UPDATE 表名称 SET 列名称 = 新值 WHERE 列名称 = 某值
    let sqlString = 'UPDATE ?? ' + _.repeat('SET ?? = ? ', setList.length / 2)

    if (whereList) {
      if (whereList.length % 2) return reject(new Error('whereList should be even.'))
      else {
        sqlString += 'WHERE ?? = ? ' + _.repeat(['AND ?? = ? '], whereList.length / 2 - 1) + ';'
      }
    }

    sqlString = mysql.format(sqlString, _.concat(tableName, setList, whereList))

    // console.log(sqlString)
    pool.query(sqlString, function (error, results, fields) {
      if (error) return reject(error)
      else resolve(results)
    })
  })
}

/**
 * 结束连接池
 *
 */
function quit () {
  pool.end(function (err) {
    if (err) console.log(err)
  })
}

module.exports = {
  query: query,
  insert: insert,
  read: read,
  quit: quit,
  updated: updated,
  sqlDelete: sqlDelete
}
