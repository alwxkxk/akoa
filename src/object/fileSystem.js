const mysql = require('../mysql.js')
const common = require('../common.js')
const path = require('path')
const config = require('../../config/config.js')
const util = require('util')
const fs = require('fs')

const stat = util.promisify(fs.stat)

exports.userMethod = {
  /**
   * 上传文件
   *
   * @param {String} owner 拥有者
   * @param {Stream} file 文件流
   * @returns {Promise}
   */
  upload (owner, file) {
    const fileName = file.filename
    let uuidName = ''
    let fileSize = 0
    return new Promise((resolve, reject) => {
      const suffix = path.extname(file.filename)
      uuidName = common.uuid() + suffix// uuid生成的文件名
      const saveTo = path.join(config.filePath, uuidName)
      file.pipe(fs.createWriteStream(saveTo))
      file.on('end', () => {
        console.log('upload end')
        return resolve(uuidName)
      })
      file.on('error', (err) => {
        return reject(err)
      })
    })
    .then(uuidName => {
      return stat(path.join(config.filePath, uuidName))
    })
    .then((v) => {
      fileSize = Math.round(v.size / 1024)  // 获取文件大小 KB
      const time = common.now()
      return mysql.insert('file', ['uuid', 'fileName', 'create_time', 'owner', 'size'], [uuidName, fileName, time, owner, fileSize])
    })
    .then(() => {
      return Promise.resolve({uuid: uuidName, size: fileSize, fileName: fileName})
    })
  }
}

exports.administratorMethod = {

}
