const user = require('./user.js')
const redis = require('../redis.js')
const mysql = require('../mysql.js')
const checkPermisssion = require('../../config/permission.js').checkPermisssion
const getGroupId = require('../../config/permission.js').getGroupId
const fileSystem = require('./fileSystem.js').administratorMethod
const administrator = {
  /**
   * 管理员注册
   *
   * @param {String} name
   * @param {String} password
   * @returns
   */
  register (name, password) {
    return user.register(name, password, 'administrator')
  },
  /**
   * 判断此token是否为管理员
   *
   * @param {String} token
   * @returns {Promise} 返回布尔值
   */
  isAdministrator (token) {
    return redis.getGroupIdByToken(token)
    .then(groupId => {
      if (Number(groupId) === getGroupId('administrator')) return Promise.resolve(true)
      else return Promise.resolve(false)
    })
  },
  /**
   * 删除账号
   * @param {String} name 要删除的用户名
   * @returns {Promise}
   */
  deleteUser (token, name) {
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
  },

  /**
   * 获取所有用户列表
   *
   * @param {String} name 要删除的用户名
   * @returns {Promise}
   */
  getUserList (token) {
    return authentication('getUserList', token)// 先检查管理员是否有操作权限
    .then(() => {
      return mysql.read('user', ['name', 'nick_name', 'group_id', 'create_time', 'last_time'])
    })
  },
  /**
   * 获取所有文件列表
   *
   * @param {String} token
   * @returns {Promise}
   */
  getFileList (token) {
    return authentication('getFileList', token)
    .then(() => {
      return fileSystem.fileList()
    })
  },
  /**
   * 删除任意文件
   *
   * @param {String} token
   * @param {String} uuid
   * @returns {Promise}
   */
  deleteFile (token, uuid) {
    return authentication('deleteFile', token)
    .then(() => {
      return fileSystem.deleteFile(uuid)
    })
  },
  /**
   * 下载任意文件
   *
   * @param {String} token
   * @param {String} uuid
   * @returns {Promise}
   */
  downloadFile (token, uuid) {
    return authentication('downloadFile', token)
    .then(() => {
      return fileSystem.download(uuid)
    })
  }

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

module.exports = administrator
