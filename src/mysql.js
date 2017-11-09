var mysql = require('mysql')
let _ = require('lodash')
let mysqlConfig = require('../config/config.js').mysqlConfig
let sqlQuery = require('../config/sql-query.js')

var pool = mysql.createPool(mysqlConfig)
pool.on('acquire', function (connection) {
  console.log('Connection %d acquired', connection.threadId)
})
pool.on('connection', function (connection) {
  console.log('Connection %d built', connection.threadId)
})
pool.on('enqueue', function () {
  console.log('Waiting for available connection slot')
})
pool.on('release', function (connection) {
  console.log('Connection %d released', connection.threadId)
})

// checkDb('test')
//   .then(v => { console.log('checkdb2:', v) })
//   .catch(e => { console.log('err', e) })
// hasDb('test')
// .then(v=>console.log(v))
// .catch(e=>{console.log(e)})

// insert('user',['name','password','nick_name','create_time','last_time'],['alw','123456','alwxkxk','2011-04-08 0:00:00','2011-04-08 0:00:00'])
// .then(v => { console.log(v) })
// .catch(e => { console.log(e) })
// read('user',['name','id','password'])
// .then(v => { console.log(v) })
// .catch(e => { console.log(e) })

/**
 * 执行sql语句，返回Promise对象
 * 注意，此函数没有转义，只允许内部使用，不能接收用户的sql语句以防注入攻击。
 * @param {string} queryString 来自内容的SQL语句
 * @returns {Promise} 返回Promise对象，resolve results,reject err
 */
function query (queryString) {
  return new Promise((resolve, reject) => {
    pool.query(queryString, function (error, results, fields) {
      if (error) reject(error)
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
    let sqlString = mysql.format('INSERT INTO ?? (??)VALUES (?);', [tableName, column, value])
    // console.log(sqlString)
    pool.query(sqlString, function (error, results, fields) {
      if (error) reject(error)
      resolve(results)
    })
  })
}

/**
 * 从表中读取所需值
 *
 * @param {string} tableName 表名
 * @param {array} selectList 想要获取的值
 * @param {array} whereList 想要获取的值
 * @returns {Promise} 返回Promise对象，resolve results,reject err
 */
function read (tableName, selectList, whereList) {
  return new Promise((resolve, reject) => {
    let sqlString = ''

    if (whereList) {
      if (whereList.length % 2) { // WHERE 语句要求数组必须有偶数个
        reject(new Error('whereList should be even.'))
      } else { // 动态生成 WHERE ，AND 语句
        let str = 'SELECT ?? FROM ?? WHERE ?? = ?'
        str += _.repeat([' AND ?? = ?'], whereList.length / 2 - 1)
        str += ';'
        sqlString = mysql.format(str, _.concat([selectList, tableName], whereList))
      }
    } else {
      sqlString = mysql.format('SELECT ?? FROM ??;', [selectList, tableName])
    }

    // console.log(sqlString)
    pool.query(sqlString, function (error, results, fields) {
      if (error) reject(error)
      resolve(results)
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
  end: end
}
