const User = require('./User.js')
const redis = require('../redis.js')
const checkPermisssion = require('../../config/permission.js')
class Administrator extends User {
  static register (name, password) {
    return User.register(name, password, 'administrator')
  }
  /**
   * 删除账号
   *
   * @static
   * @param {string} name 要删除的用户名
   * @returns {Promise}
   * @memberof Administrator
   */
  static deleteUser (token, name) {
    return authentication('deleteUser', token)// 先检查管理员是否有操作权限
    .then(() => { return mysql.read('user', ['name'], ['name', name]) })
    .then(reads => {
      if (reads.length === 0) return Promise.reject('账号不存在')
      return mysql.sqlDelete('user', ['name', name])
    })
    .catch(e => {
      return Promise.reject(e)
    })
  }

  //  权限验证
  // authentication
}

/**
 * 权限验证
 *
 * @param {string} action
 * @param {string} token
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
