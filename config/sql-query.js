module.exports = {
  createUserTable: 'CREATE TABLE user \
  ( \
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT "用户ID,主键", \
    name varchar(255) NOT NULL UNIQUE COMMENT "用户登陆名,唯一不可重复", \
    password varchar(255) NOT NULL COMMENT "登陆密码 前端一次加密传输，后端再一次加密保存", \
    nick_name varchar(255) NOT NULL UNIQUE  COMMENT "昵称,唯一不可重复,初始与用户登陆名一致",  \
    create_time DATETIME NOT NULL COMMENT "创建时间", \
    last_time DATETIME COMMENT "最后活跃时间", \
    icon_url varchar(255) COMMENT "头像url", \
    email varchar(255) COMMENT "邮箱地址", \
    unionid varchar(255) COMMENT "微信号unionid", \
    group_id TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT "用户组 默认为0 数值越高权限越高" \
  );'

}
