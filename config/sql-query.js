module.exports = {
  createTable: {
    user: `
    CREATE TABLE user ( 
      name varchar(255) NOT NULL PRIMARY KEY COMMENT "账号登陆名,唯一不可重复,主键",
      password varchar(255) NOT NULL COMMENT "登陆密码 前端一次加密传输，后端再一次加密保存",
      nick_name varchar(255) NOT NULL UNIQUE  COMMENT "昵称,唯一不可重复,初始与账号登陆名一致",
      create_time DATETIME NOT NULL COMMENT "创建时间",
      last_time DATETIME COMMENT "最后活跃时间",
      avatar varchar(255) COMMENT "头像图片名需通过其它方式生成url来取得",
      email varchar(255) UNIQUE COMMENT "邮箱地址,唯一不可重复",
      unionid varchar(255) COMMENT "微信号unionid",
      group_id TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT "账号组 默认为0 数值越高权限越高",
      message varchar(255) COMMENT "消息列表,字符串"
    );
    `,
    file: `
    CREATE TABLE file ( 
      uuid varchar(255) NOT NULL PRIMARY KEY COMMENT "文件的uuid,系统会以此作为文件名，主键", 
      file_name varchar(255) NOT NULL COMMENT "用户设置的文件名", 
      create_time DATETIME NOT NULL COMMENT "创建时间", 
      owner varchar(255) COMMENT "文件所属用户 索引:owner_index", 
      size INT UNSIGNED DEFAULT 0 COMMENT "文件大小 KB", 
      INDEX owner_index (owner(4)) 
    );
    `,
    message: `
    CREATE TABLE message (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT "消息ID,主键", 
      title varchar(255) COMMENT "标题",
      content varchar(1024) COMMENT "内容",
      type varchar(255) COMMENT "类型",
      trigger_name varchar(255) COMMENT "触发条件",
      state varchar(255) COMMENT "状态",
      time DATETIME COMMENT "时间",
      sender varchar(255) COMMENT "发送者",
      receiver varchar(255) COMMENT "接收者"
    );
    `
  }
}
