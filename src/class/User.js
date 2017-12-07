const _ = require('lodash')
const mysql = require('../mysql.js')
const uti = require('../utilities.js')
const redis = require('../redis.js')
const GROUP = require('../../config/authentication.js').GROUP
const bunyan = require('bunyan')
const path = require('path')

class User {
  /**
   * 注册账号
   *
   * @static
   * @param {string} name 账号名
   * @param {string} password 已经被前端md5过一次的密码
   * @returns {Promise} 返回Promise对象，resolve '账号注册成功' ,reject '账号名重复'||e.sqlMessage
   * @memberof User
   */
  static register (name, password) {
    // TODO:优化：前端应提供 先检测有无重名的
    // 前端应将password先加盐md5一次再传输到后台
    let time = uti.now()
    // 加盐后再md5一次
    return mysql.insert('user', ['name', 'password', 'nick_name', 'create_time', 'last_time', 'group_id'], [name, uti.akoaMd5(password), name, time, time, GROUP['user']])
    .then(v => { return Promise.resolve('账号注册成功') })
    .catch(e => {
      if (e.code === 'ER_DUP_ENTRY') return Promise.reject('账号名重复')
      else return Promise.reject(e.sqlMessage)// 其它错误直接传sqlMessage
    })
  }

  /**
   * 账号登陆
   *
   * @static
   * @param {string} name 账号名
   * @param {string} password 已经被前端md5过一次的密码
   * @returns {Promise} 返回Promise对象，resolve {token} ,reject '账号不存在或密码错误'||e
   * @memberof User
   */
  static login (name, password) {
    let user
    let need = ['name', 'nick_name', 'email', 'group_id', 'icon_url']
    return mysql.read('user', need, ['name', name, 'password', uti.akoaMd5(password)])
    .then(reads => {
      if (reads.length === 0) return Promise.reject('账号不存在或密码错误')
      user = _.pick(reads[0], need)
      return redis.setToken(reads[0].name)// TODO:还要设置有效时间
    })
    .then(values => {
      user.token = values[0]
      userLog(name, {time: uti.now(), type: '登陆'})
      return Promise.resolve(user)// 将用户信息传出以便响应返回
    })
    .catch(e => {
      return Promise.reject(e)
    })
  }

  // logout
  static logout (sessionId) {
    // 在redit里删除session
    if (!sessionId) return Promise.reject('token为空值')
    return redis.hgetAsync(sessionId, 'name')
    .then((name) => {
      if (!name) return Promise.reject('token已过期')
      userLog(name, {time: uti.now(), type: '退出登陆'})
      return redis.deleteToken(name)
    })
  }

  // 修改密码
  // 修改昵称
  // 邮箱验证
}

  /**
   * 用户专用 日志记录
   *
   * @param {string} name 用户名
   * @param {any} data 所要记录的数据
   * @param {string} [level='info'] 日志等级 fatal,error,warn,info,debug,trace
   */
function userLog (name, data, level = 'info') {
  if (['fatal', 'error', 'warn', 'info', 'debug', 'trace'].indexOf(level) === -1) {
    throw new Error('level should be one of fatal,error,warn,info,debug,trace.but it is ' + level + '.')
  }
  const log = bunyan.createLogger({
    name: name,
    streams: [{
      path: path.resolve(__dirname, '../../log/user/' + name + '.log')
    }]
  })

  log[level](data)
}

module.exports = User
