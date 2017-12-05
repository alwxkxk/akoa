let config = {
  PORT: 80,
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
    port: 6379
  },
  EXPIRE: 3600 // redis缓存的生存时间 1h,1*60*60
}
module.exports = config
