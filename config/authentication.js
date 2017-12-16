let group = {// 权限组及对应id号
  0: 'user',
  1: 'administrator'
}

// 双向设置 如 : group['0']='user',group['user']=0
for (const prop in group) {
  const value = group[prop]
  group[value] = Number(prop)
}

module.exports = {
  GROUP: group,
  AUTHORITY: {// 某操作-对应所需的权限组列表
    'deleteUser': ['administrator']// 删除账号 - [管理员]
  }
}
