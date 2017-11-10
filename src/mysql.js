var mysql = require('mysql')
let _ = require('lodash')
let mysqlConfig = require('../config/config.js').mysqlConfig
let sqlQuery = require('../config/sql-query.js')

var pool = mysql.createPool(mysqlConfig)
// pool.on('acquire', function (connection) {
//   console.log('Connection %d acquired', connection.threadId)
// })
// pool.on('connection', function (connection) {
//   console.log('Connection %d built', connection.threadId)
// })
// pool.on('enqueue', function () {
//   console.log('Waiting for available connection slot')
// })
// pool.on('release', function (connection) {
//   console.log('Connection %d released', connection.threadId)
// })

/**
 * 执行sql语句，返回Promise对象
 * 注意，此函数没有转义，只允许内部使用，不能接收用户的sql语句以防注入攻击。
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
 * 向某个表插入值
 *
 * @param {string} tableName 表名
 * @param {string|array} column 列表值
 * @param {string|array} value 值
 * @returns {Promise} 返回Promise对象，resolve results,reject err
 */
function insert (tableName, column, value) {
  return new Promise((resolve, reject) => {
    if (!tableName && !column&&!value) return reject(new Error('tableName , column and value must not be null'))
    let sqlString = mysql.format('INSERT INTO ?? (??)VALUES (?);', [tableName, column, value])
    // console.log(sqlString)
    pool.query(sqlString, function (error, results, fields) {
      if (error) return reject(error)
      resolve(results)
    })
  })
}

/**
 *
 *
 * @param {string} tableName 表名
 * @param {array} whereList where列表
 * @returns {Promise} 返回Promise对象，resolve results,reject err
 */
function sqlDelete (tableName, whereList) {
  // DELETE FROM 表名称 WHERE 列名称 = 值
  return new Promise((resolve, reject) => {
    if (!tableName && !whereList) return reject(new Error('tableName and whereList must not be null'))
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
    if (!tableName && !selectList) return reject(new Error('tableName and selectList must not be null'))
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
function end () {
  pool.end(function (err) {
    if (err) console.log(err)
  })
}

/**
 * 初始化数据库，创建表格
 *
 */
async function initTable () {
  let tablesConfig = {
    'user': sqlQuery.createUserTable // 没有user 表就使用createUserTable 创建
  }
  // TODO:检测数据库有没有表，没有就初始化，创建一堆表。
  let sqlString = mysql.format('SELECT * FROM information_schema.tables WHERE table_schema=?;', [mysqlConfig.database])
  // 先取得所有表名
  let tables = _.map(await query(sqlString), function (o) { return o.TABLE_NAME })
  // 对比，取得所缺乏的表
  let lackTable = _.difference(_.keys(tablesConfig), tables)
  // 创建所缺乏的表
  _.forEach(lackTable, function (value) {
    query(tablesConfig[value])
      .then(() => { console.log('create table:', value) })
      .catch(err => { console.log(err) })
  })
}

module.exports = {
  initTable: initTable,
  insert: insert,
  read: read,
  end: end,
  updated: updated,
  sqlDelete: sqlDelete
}
