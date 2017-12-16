const User = require('./User.js')
const redis = require('../redis.js')
class Administrator extends User {
  /**
   * 删除账号
   *
   * @static
   * @param {string} name
   * @returns {Promise}
   * @memberof Administrator
   */
  static deleteUser (token, name) {
    return mysql.read('user', ['name'], ['name', name])
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

module.exports = Administrator
