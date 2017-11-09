let md5 = require('md5')
let moment = require('moment')

let utilities = {
  /**
   * 加后缀再md5
   *
   * @param {string} string
   * @returns 加后缀再md5的值
   */
  akoaMd5 (string) {
    // 给每个字符串都加上akoa后缀再进行md5加密
    return md5(string + 'akoa')
  },

  /**
   * 取得当前时间字符串 'YYYY-MM-DD H:mm:ss'
   * 
   * @returns 当前时间 格式：'YYYY-MM-DD H:mm:ss'
   */
  now () {
    return moment().format('YYYY-MM-DD H:mm:ss')
  }
}

module.exports = utilities
