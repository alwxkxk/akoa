const path = require('path')
const os = require('os')

let config = {
  PORT: 7999, // 程序启动所监听的端口
  serverUrl: 'http://www.example.com:8999', // nginx所配置的地址与端口
  ImagePath: os.platform() === 'win32' ? path.join(__dirname, '../../images') : '/var/www/images',
  ImageType: ['.jpg', '.JPG', '.png'],
  STDOUT: true, // 是否打印出来
  // ------- mysql ------------
  mysqlConfig: {
    host: '',
    port: '63759',
    user: '',
    password: '',
    database: '',
    debug: false
  },
  // ------- log ------------
  logConfig: {
    logDay: 1 // 日志保存天数
  },

  // ------- reids ------------
  redisConfig: {
    host: '',
    port: 6379,
    password: null
  },
  EXPIRE: 3600, // redis缓存的生存时间 1h,1*60*60
  checkList: ['name', 'nick_name', 'email'], // 用于重复检测，同时禁止其它用户以这些用户名注册
    // ------ email ---------
  emailConfig: {
    host: '',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: 'smtp.exmail.qq.com', // generated ethereal user
      pass: ''  // generated ethereal password
    }
  }
}
module.exports = config
