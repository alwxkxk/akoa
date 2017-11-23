const md5 = require('md5')
const moment = require('moment')
const _ = require('lodash')

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
  },

  /**
   * http JSON回复格式
   *
   * @param {number} error_code 失败码 0-正常 非0为错误
   * @param {string} message 携带信息
   * @param {any} data 携带数据
   * @returns {object} 自定义标准的http回复JSON格式
   *
   */
  httpResponse (errorCode, message, data) {
    // {
    //   "error_code": 0,
    //   "data": {
    //     "uid": "1",
    //     "username": "12154545",
    //     "name": "吴系挂",
    //     "groupid": 2 ,
    //     "reg_time": "1436864169",
    //     "last_login_time": "0",
    //   }
    // }
    if (data instanceof Error) data = data.message// JSON.stringify(new Error('test'))会变成{}
    return JSON.stringify({
      error_code: errorCode,
      message: message,
      data: data || {}
    })
  }
}

module.exports = utilities
