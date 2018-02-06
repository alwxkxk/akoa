const PERMISESSION = {
  'deleteUser': ['administrator'], // 删除账号 - [管理员]
  'getUserList': ['administrator'], // 取得所有用户列表
  'getFileList': ['administrator'], // 允许管理员获取所有文件列表
  'deleteFile': ['administrator'], // 删除任意文件
  'downloadFile': ['administrator'], // 下载任意文件
  'addUser': ['administrator'], // 添加用户
  'findUser': ['administrator'] //获取用户信息
}

let group = {// 权限组id及对应身份
  0: 'user',
  1: 'administrator'
}

// 双向设置 如 : group['0']='user',group['user']=0
for (const prop in group) {
  const value = group[prop]
  group[value] = Number(prop)
}

/**
 * 检测某个权限组id是否有权限执行某操作
 *
 * @param {String} action 需要验证权限的动作
 * @param {Number} groupId 权限组id
 * @returns boolean
 */
function checkPermisssion (action, groupId) {
  const premission = PERMISESSION[action] || []
  if (premission.indexOf(group[groupId]) === -1) return false
  else return true
}

function getGroupId (groupName) {
  return group[groupName]
}

module.exports = {
  checkPermisssion: checkPermisssion,
  getGroupId: getGroupId
}
