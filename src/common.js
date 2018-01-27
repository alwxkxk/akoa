const md5 = require('md5')
const moment = require('moment')
const _ = require('lodash')
const errorCodeList = require('../config/error-code.js')
const uuidv4 = require('uuid/v4')
const log = require('./log.js')
const si = require('systeminformation')

const common = {
  /**
   * 加后缀再md5
   *
   * @param {String} string
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
   * @param {Number} error_code 失败码 0-正常 非0为错误
   * @param {any} data 携带数据
   * @returns {Object} 自定义标准的http回复JSON格式
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
   *获取系统状态信息
   *
   * @returns {Promise}
   *
   */
  async systemSatus () {
    const result = {
      mem: {
        totol: 0, // 总内存空间 单位： MB
        used: 0, // 已使用空间 单位： MB
        percentage: 0 // 百分比 单位：%
      },
      currentLoad: 0, // CPU平均负载百分比 单位：%
      fs: []// N个磁盘N个对象 {fs:磁盘名,total:磁盘总空间GB,use:已使用空间百分比}
    }
    await si.mem()
    .then(data => {
      result.mem.totol = Math.round(data.total / 1024 / 1024)
      result.mem.used = Math.round(data.active / 1024 / 1024)
      result.mem.percentage = Math.round(data.active / data.total * 100)
    })
    .catch(error => console.error(error))

    await si.fsSize()
    .then(data => {
      data.forEach(value => {
        const total = Math.round(value.size / 1024 / 1024 / 1024)
        const use = Math.round(value.use)
        result.fs.push({fs: value.fs, total: total, use: use})
        // console.log(`磁盘 ${value.fs} - ${total} GB - 已使用：${use}%`)
      })
    })
    .catch(error => console.error(error))

    await si.currentLoad()
    .then(data => {
      const currentload = Math.round(data.currentload)
      result.currentLoad = currentload
      // console.log(`CPU负载:${currentload}%`)
    })
    .catch(error => console.error(error))
    return result
  }

}

module.exports = common
