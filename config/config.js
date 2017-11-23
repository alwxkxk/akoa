let config = {
  mysqlConfig: {
    host: 'gz-cdb-jptqaaf0.sql.tencentcdb.com',
    port: '63759',
    user: 'root',
    password: 'geeku@2017',
    database: 'test',
    debug: false
  },
  logConfig: {
    logDay: 1 // 日志保存天数
  },
  redisConfig: {
    host: '119.29.61.219',
    port: 6379
  }
}
module.exports = config
