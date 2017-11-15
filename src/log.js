
var bunyan = require('bunyan')
let logConfig = require('../config/config.js').logConfig
const path = require('path')
var log = bunyan.createLogger({
  name: 'myapp',
  streams: [
    {
      type: 'rotating-file',
      period: '1d',
      count: logConfig.logDay,
      level: 'info',
      path: path.resolve(__dirname, '../log/info.log')
    },
    {
      type: 'rotating-file',
      period: '1d',
      count: logConfig.logDay,
      level: 'warn',
      path: path.resolve(__dirname, '../log/warn.log')
    },
    {
      type: 'rotating-file',
      period: '1d',
      count: logConfig.logDay,
      level: 'error',
      path: path.resolve(__dirname, '../log/error.log')
    }
  ]
})
module.exports = log
