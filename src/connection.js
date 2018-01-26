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
  // 给systemStatus room里所有客户端 定时发送 系统状态
  setInterval(() => {
    io.to('systemStatus room').emit('systemStatus', systemSatusJSON)
  }, systemInfoInterval * 1000)

  io.on('connection', function (socket) {
    // 客户端 请求join systemStatus room
    socket.on('join systemStatus room', () => {
      console.log('client join systemStatus room.')
      socket.join('systemStatus room')
    })
    // 客户端 请求leave systemStatus room
    socket.on('leave systemStatus room', () => {
      console.log('client leave systemStatus room.')
      socket.leave('systemStatus room')
    })
    socket.on('message', function (msg) {
      console.log('message:', msg)
    })
  })
}
