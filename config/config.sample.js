let config = {
  mysqlConfig: {
    host: '',
    port: '63759',
    user: '',
    password: '',
    database: '',
    debug: false
  },
  logConfig: {
    logDay: 1 // 日志保存天数
  },
  redisConfig: {
    host: '',
    port: 6379
  },
  tokenExpire: 36000 // 10h,10*60*60
}
module.exports = config
