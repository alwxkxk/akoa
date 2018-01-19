const md5 = require('md5')
const moment = require('moment')
const _ = require('lodash')
const errorCodeList = require('../config/error-code.js')
const uuidv4 = require('uuid/v4')

const common = {
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
   * @param {any} data 携带数据
   * @returns {object} 自定义标准的http回复JSON格式
   *
   */
  httpResponse (errorCode, data) {
    if (data instanceof Error) data = data.message// JSON.stringify(new Error('test'))会变成{}
    return JSON.stringify({
      error_code: errorCode,
      message: errorCodeList['' + errorCode][0] || '未知错误代码',
      data: data || {}
    })
  },

  /**
   * 返回uuid
   *
   * @returns uuid
   */
  uuid () {
    return uuidv4()
  }
}

module.exports = common
