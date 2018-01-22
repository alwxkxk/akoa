const PERMISESSION = {
  'deleteUser': ['administrator'], // 删除账号 - [管理员]
  'getUserList': ['administrator']
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
 * @param {string} action 需要验证权限的动作
 * @param {number} groupId 权限组id
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
