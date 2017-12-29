const _ = require('lodash')
const mysql = require('../mysql.js')
const common = require('../common.js')
const redis = require('../redis.js')
const GROUP = require('../../config/authentication.js').GROUP
const bunyan = require('bunyan')
const path = require('path')
const readline = require('readline')
const fs = require('fs')

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
    const time = common.now()
    // 加盐后再md5一次
    return mysql.insert('user', ['name', 'password', 'nick_name', 'create_time', 'last_time', 'group_id'], [name, common.akoaMd5(password), name, time, time, GROUP['user']])
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
    let need = ['name', 'nick_name', 'email', 'group_id', 'avatar']
    return mysql.read('user', need, ['name', name, 'password', common.akoaMd5(password)])
    .then(reads => {
      if (reads.length === 0) return Promise.reject('账号不存在或密码错误')
      user = _.pick(reads[0], need)
      return redis.setToken(user)// TODO:还要设置有效时间
    })
    .then(values => {
      const time = common.now()
      mysql.updated('user', ['last_time', time], ['name', name]) // 更新最后活跃时间
      user.token = values[0]
      userLog(name, {time: common.now(), action: '登陆'})
      return Promise.resolve(user)// 将用户信息传出以便响应返回
    })
    .catch(e => {
      return Promise.reject(e)
    })
  }

  /**
   * 退出登陆，删除token
   *
   * @static
   * @param {string} token 用户凭证
   * @returns {Promise}
   * @memberof User
   */
  static logout (token) {
    // 在redit里删除用户凭证
    return redis.getNameByToken(token)
    .then((name) => {
      if (!name) return Promise.reject('token已过期')
      userLog(name, {time: common.now(), action: '退出登陆'})
      return redis.deleteToken(name)
    })
  }

  /**
   * 取得当前用户的用户日志
   *
   * @static
   * @param {string} token 用户凭证
   * @returns {Promise} logList 数组
   * @memberof User
   */
  static getUserLog (token) {
    return redis.getNameByToken(token)
    .then((name) => {
      if (!name) return Promise.reject('token已过期')
      return new Promise((resolve, reject) => {
        let logList = []
        const rl = readline.createInterface({
          input: fs.createReadStream(path.resolve(__dirname, '../../log/user/' + name + '.log')),
          crlfDelay: Infinity
        })

        rl.on('line', (line) => {
          let obj = JSON.parse(line)
          logList.unshift({time: obj.time, action: obj.action})
        })
        rl.on('close', () => {
          resolve(logList)
        })
      })
    })
  }

  /**
   * 验证当前用户密码，返回sensitiveToken
   *
   * @static
   * @param {string} token 用户凭证
   * @param {string} password 密码
   * @returns {Promise} reject '密码错误'||其它错误 , reject `${sensitiveToken}`
   * @memberof User
   */
  static getSensitiveToken (token, password) {
    return redis.getNameByToken(token)
    .then((name) => {
      return mysql.read('user', ['name'], ['name', name, 'password', common.akoaMd5(password)])
    })
    .then((reads) => {
      let name = reads[0].name // DEBUG
      if (reads.length === 0) return Promise.reject('密码错误')
      else return redis.setSensitiveToken(name)
    })
  }

  /**
   * 修改密码
   *
   * @static
   * @param {string} token 用户凭证
   * @param {string} oldPassword 旧密码
   * @param {string} newPassword 新密码
   * @returns {Promise}
   * @memberof User
   */
  static changePassword (token, oldPassword, newPassword) {
    return redis.getNameByToken(token)
    .then((name) => {
      return mysql.read('user', ['name'], ['name', name, 'password', common.akoaMd5(oldPassword)])
    })
    .then((reads) => {
      if (reads.length === 0) return Promise.reject('密码错误')
      else return Promise.resolve(reads[0].name)
    })
    .then((name) => {
      return mysql.updated('user', ['password', common.akoaMd5(newPassword)], ['name', name])
    })
    .then(v => {
      return Promise.resolve('成功修改密码')
    })
  }

  /**
   * 设备用户邮箱
   *
   * @static
   * @param {string} sensitiveToken 敏感操作token
   * @param {string} email 邮箱地址
   * @returns {Promise}
   * @memberof User
   */
  static setEmail (sensitiveToken, email) {
    return redis.getNameBySensitiveToken(sensitiveToken)
    .then(name => { return mysql.updated('user', ['email', email], ['name', name]) })
    .then(v => {
      redis.deleteSensitiveToken(sensitiveToken)
      return Promise.resolve('修改邮箱成功')
    })
  }
  /**
   * 修改头像
   *
   * @static
   * @param {string} token 用户凭证
   * @param {string} imageName 图片文件名
   * @returns {Promise}
   * @memberof User
   */
  static changeAvatar (token, imageName) {
    return redis.getNameByToken(token)
    .then((name) => {
      return mysql.updated('user', ['avatar', imageName], ['name', name])
    })
    .then(v => {
      return Promise.resolve('成功修改头像')
    })
  }
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
