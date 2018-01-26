const common = require('./common.js')
const systemInfoInterval = 1 // 每一秒更新一次系统信息

// 每隔N秒更新系统状态
let systemSatusJSON = {}
setInterval(() => {
  common.systemSatus()
  .then(status => {
    systemSatusJSON = JSON.stringify(status)
  })
  .catch(err => {
    console.log(err)
  })
}, systemInfoInterval * 1000)

// 引入socket.io
exports.socketioInit = function socketioInit (server) {
  const io = require('socket.io')(server)
  io.on('connection', function (socket) {
    systemStatus(socket)
    socket.on('message', function (msg) {
      console.log('message:', msg)
    })
  })
}

/**
 * 给socket定时发送系统状态 //TODO；改用room来实现
 *
 * @param {any} socket
 */
function systemStatus (socket) {
  setInterval(() => {
    socket.emit('systemStatus', systemSatusJSON)
  }, systemInfoInterval * 1000)
}
