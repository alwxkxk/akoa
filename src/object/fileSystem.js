
const mysql = require('../mysql.js')
const common = require('../common.js')
const path = require('path')
const config = require('../../config/config.js')
const util = require('util')
const fs = require('fs')

const stat = util.promisify(fs.stat)
const unlink = util.promisify(fs.unlink)
const readFile = util.promisify(fs.readFile)

const userMethod = {
  /**
   * 上传文件
   *
   * @param {String} owner 拥有者
   * @param {Stream} file 文件流
   * @returns {Promise}
   */
  upload (owner, file) {
    const fileName = file.filename
    const time = common.now()
    let uuid = ''
    let fileSize = 0

    return new Promise((resolve, reject) => {
      const suffix = path.extname(file.filename)
      uuid = common.uuid() + suffix// uuid生成的文件名
      const saveTo = path.join(config.filePath, uuid)
      file.pipe(fs.createWriteStream(saveTo))
      file.on('end', () => {
        console.log('upload end')
        return resolve()
      })
      file.on('error', (err) => {
        return reject(err)
      })
    })
    .then(() => {
      return stat(path.join(config.filePath, uuid))
    })
    .then((v) => {
      fileSize = Math.ceil(v.size / 1024)  // 获取文件大小 KB

      return mysql.insert('file', ['uuid', 'file_name', 'create_time', 'owner', 'size'], [uuid, fileName, time, owner, fileSize])
    })
    .then(() => {
      return Promise.resolve({uuid: uuid, size: fileSize, file_name: fileName, create_time: time, owner: owner})
    })
  },
  /**
   * 获取用户所拥有的文件
   *
   * @param {String} owner 拥有者
   * @returns {Promise}
   */
  fileList (owner) {
    return mysql.read('file', ['uuid', 'file_name', 'create_time', 'size', 'owner'], ['owner', owner])
  },
  /**
   * 删除本地文件及数据库中的信息
   *
   * @param {String} owner 拥有者
   * @param {String}  uuid 文件uuid名
   * @returns {Promise}
   */
  deleteFile (owner, uuid) {
    unlink(path.join(config.filePath, uuid))// 删除本地文件
    .catch(err => { console.log(err) })
    return mysql.sqlDelete('file', ['owner', owner, 'uuid', uuid])
  },
  /**
   * 下载文件
   *
   * @param {String} uuid 文件uuid名
   * @returns {Promise}
   */
  download (owner, uuid) {
    return mysql.read('file', ['uuid'], ['owner', owner, 'uuid', uuid])
    .then(reads => {
      if (reads[0]) return readFile(path.join(config.filePath, uuid))
      else return Promise.reject('文件不存在')
    })
  }
}

const administratorMethod = {
  /**
   * 管理员删除文件
   *
   * @param {String} uuid 文件uuid名
   * @returns {Promise}
   */
  deleteFile (uuid) {
    return unlink(path.join(config.filePath, uuid))// 删除本地文件
    .then(() => {
      return mysql.sqlDelete('file', ['uuid', uuid])
    })
  },
  /**
   *
   * 管理员获取所有的文件列表
   * @returns {Promise}
   */
  fileList () {
    return mysql.read('file', ['uuid', 'file_name', 'create_time', 'size', 'owner'])
  },
  /**
   * 管理员下载文件
   *
   * @param {String} uuid 文件uuid名
   * @returns {Promise}
   */
  download (uuid) {
    return readFile(path.join(config.filePath, uuid))
  }

}

exports.userMethod = userMethod
exports.administratorMethod = administratorMethod
