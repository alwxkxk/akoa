let db = require('../mysql.js')
let akoaMd5 = require('../utilities.js').akoaMd5
class User {

  //注册
  static register(name,password) {
    //先检测有无重名的

    //加盐后再md5一次（前端会进行第一次加密）
    db.insert('user', ['name', 'password', 'nick_name', 'create_time', 'last_time'], [name,akoaMd5(password), 'alwxkxk', '2011-04-08 0:00:00', '2011-04-08 0:00:00'])
    .then(v => { console.log(v) })
    .catch(e => { console.log(e) })
  }

  //login
  static login(name, password) {
    console.log('  ')
  }

  //logout
}

module.exports = User
