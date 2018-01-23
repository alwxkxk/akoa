const User = require('./User.js')
const redis = require('../redis.js')
const mysql = require('../mysql.js')
const checkPermisssion = require('../../config/permission.js').checkPermisssion
const getGroupId = require('../../config/permission.js').getGroupId
class Administrator extends User {
  static register (name, password) {
    return User.register(name, password, 'administrator')
  }
  /**
   * 删除账号
   *
   * @static
   * @param {String} name 要删除的用户名
   * @returns {Promise}
   * @memberof Administrator
   */
  static deleteUser (token, name) {
    return authentication('deleteUser', token)// 先检查管理员是否有操作权限
    .then(() => { return mysql.read('user', ['name', 'group_id'], ['name', name]) })
    .then(reads => {
      if (reads.length === 0) return Promise.reject('账号不存在')
      if (reads[0]['group_id'] === getGroupId('administrator')) return Promise.reject('管理员账号不可删除')
      return mysql.sqlDelete('user', ['name', name])
    })
    .catch(e => {
      return Promise.reject(e)
    })
  }

  /**
   * 获取所有用户列表
   *
   * @static
   * @param {String} name 要删除的用户名
   * @returns {Promise}
   * @memberof Administrator
   */
  static getUserList (token) {
    return authentication('getUserList', token)// 先检查管理员是否有操作权限
    .then(() => {
      return mysql.read('user', ['name', 'nick_name', 'group_id', 'create_time', 'last_time'])
    })
  }

  //  权限验证
  // authentication
}

/**
 * 权限验证
 *
 * @param {String} action
 * @param {String} token
 * @returns {Promise}
 */
function authentication (action, token) {
  return redis.getGroupIdByToken(token)
    .then(groupId => {
      if (checkPermisssion(action, groupId)) return Promise.resolve('拥有权限')
      else return Promise.reject('无操作权限')
    })
}

module.exports = Administrator
