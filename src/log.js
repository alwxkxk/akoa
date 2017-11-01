
var bunyan = require('bunyan')
let logConfig = require('../config/config.js').logConfig
var log = bunyan.createLogger({
  name: 'myapp',
  streams: [
    {
      type: 'rotating-file',
      period: '1d',
      count: logConfig.logDay,
      level: 'info',
      path: '../log/info.log'
    },
    {
      type: 'rotating-file',
      period: '1d',
      count: logConfig.logDay,
      level: 'warn',
      path: '../log/warn.log'
    },
    {
      type: 'rotating-file',
      period: '1d',
      count: logConfig.logDay,
      level: 'error',
      path: '../log/error.log'
    }
  ]
})
module.exports = log
