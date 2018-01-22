const md5 = require('md5')
const moment = require('moment')
const _ = require('lodash')
const errorCodeList = require('../config/error-code.js')
const uuidv4 = require('uuid/v4')
const redis = require('./redis.js')
const mysql = require('./mysql.js')
const checkList = require('../config/config.js').checkList
const log = require('./log.js')
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
  },

  /**
   * 异步更新 检测列表
   *
   */
  updateCheckList () {
    const checkListObj = {}
    checkList.forEach((value) => {
      checkListObj[value] = []
    })
    mysql.read('user', checkList)
    .then(reads => { // 将checkList的内容全部保存到checkListObj
      _.forEach(reads, function (object) {
        _.forEach(object, function (value, key) {
          if (value) checkListObj[key].push(value)
        })
      })
      console.log(`异步更新检测列表:`, checkListObj)
      _.forEach(checkListObj, function (value, key) { // 更新到redis
        if (value.length > 0) redis.SADD(key, ...value)
      })
    })
    .catch(err => {
      console.error(err)
      log.error(err)
    })
  },
/**
 * 检查是否重复
 *
 * @param {string} key 要检查的键名如name,nick_name,email
 * @param {string} value 要检查的值
 * @returns {Promise} 当不存在时即不重复 返回resolve
 */
  checkNoRepeat (key, value) {
    if (checkList.indexOf(key) === -1) return Promise.reject('键名错误')
    return redis.sismemberAsync(key, value)
    .then(v => {
      console.log(key, value, v, typeof v)
      if (v === 1) {
        return Promise.reject('该值重复')
      } else return Promise.resolve('通过检测')
    })
  }
}

module.exports = common
