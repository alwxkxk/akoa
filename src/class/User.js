
const mysql = require('../mysql.js')
const uti = require('../utilities.js')
const redis = require('../redis.js')

class User {
  /**
   * 注册用户
   *
   * @static
   * @param {string} name 用户名
   * @param {string} password 已经被前端md5过一次的密码
   * @returns {Promise} 返回Promise对象，resolve '用户注册成功' ,reject '用户名重复'||e.sqlMessage
   * @memberof User
   */
  static register (name, password) {
    // TODO:优化：前端应提供 先检测有无重名的
    // 前端应将password先加盐md5一次再传输到后台
    let time = uti.now()
    // 加盐后再md5一次
    return mysql.insert('user', ['name', 'password', 'nick_name', 'create_time', 'last_time'], [name, uti.akoaMd5(password), name, time, time])
    .then(v => { return Promise.resolve('用户注册成功') })
    .catch(e => {
      if (e.code === 'ER_DUP_ENTRY') return Promise.reject('用户名重复')
      else return Promise.reject(e.sqlMessage)// 其它错误直接传sqlMessage
    })
  }

  /**
   * 用户登陆
   *
   * @static
   * @param {string} name 用户名
   * @param {string} password 已经被前端md5过一次的密码
   * @returns {Promise} 返回Promise对象，resolve {token} ,reject '账号不存在或密码错误'||e
   * @memberof User
   */
  static login (name, password) {
    // TODO:登陆后需要将部分信息赋予实例，所以这个函数可能 不是静态的。
    return mysql.read('user', ['name'], ['name', name, 'password', uti.akoaMd5(password)])
    .then(reads => {
      if (reads.length === 0) return Promise.reject('账号不存在或密码错误')
      return redis.setToken(reads[0].name)// TODO:还要设置有效时间
    })
    .then(values => {
      let token = values[0]
      return Promise.resolve(token)// 将token付出以响应返回token
    })
    .catch(e => {
      return Promise.reject(e)
    })
  }

  // logout
  static logout (sessionId) {
    // 在redit里删除session
    return redis.hgetAsync(sessionId, 'name')
    .then((name) => {
      return redis.deleteToken(name)
    })
  }

  static delete (name, password) {
    // 敏感操作 必须重输密码
    return mysql.read('user', ['name'], ['name', name, 'password', uti.akoaMd5(password)])
    .then(reads => {
      if (reads.length === 0) return Promise.reject('账号不存在或密码错误')
      return mysql.sqlDelete('user', ['name', name])
    })
    .catch(e => {
      return Promise.reject(e)
    })
  }
  // 修改密码
  // 修改昵称
  // 邮箱验证
  // 删除用户
}

module.exports = User
