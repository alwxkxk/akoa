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
   * 管理员添加用户，新用户的密码与账号一样
   *
   * @param {String} token
   * @param {String} name
   * @returns {Promise}
   */
  addUser (token, name) {
    return authentication('addUser', token)// 先检查管理员是否有操作权限
    .then(() => {
      return user.register(name, name)// 管理员添加的用户，账号与密码相同
    })
  },
/**
 * 管理员获取某个用户详细信息
 *
 * @param {String} token
 * @param {String} name
 * @returns {Promise}
 */
  findUser (token, name) {
    let need = ['name', 'nick_name', 'email', 'group_id', 'avatar', 'create_time', 'last_time']
    return authentication('findUser', token)// 先检操作权限
    .then(() => {
      return mysql.read('user', need, ['name', name])
    })
    .then(reads => {
      if (reads.length === 0) return Promise.reject('用户不存在')
      else return Promise.resolve(reads[0])
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
