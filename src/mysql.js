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

insert('user',['name','password','nick_name','create_time','last_time'],['alw','123456','alwxkxk','2011-04-08 0:00:00','2011-04-08 0:00:00'])
.then(v => { console.log(v) })
.catch(e => { console.log(e) })

setTimeout(function () {
  end()
}, 5000)

/**
 * 执行sql语句，返回Promise对象
 * 注意，此函数只接收在sql-query.js已定义的sql语句，不接收用户的sql语句以防注入攻击。
 * @param {string} dbName 数据库名
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
function insert(tableName,column,value) {
  return new Promise((resolve, reject) => {
    let sqlString = mysql.format('INSERT INTO ?? (??)VALUES (?);', [tableName,column, value]);
    console.log(sqlString)
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
