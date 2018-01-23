# akoa
这是个人学习的前后端分离项目，avue为前端，akoa为后端，详细的流程设计文档在`doc`目录下。
建议先部署好avue再部署akoa。

## 部署
### 所需环境
先安装好node8,redis,mysql环境。
### 下载 安装
```bash
cd /var
git clone https://github.com/alwxkxk/akoa
cd akoa
npm install 
```
### 配置
将config.sample.js配置信息补全并改名为config.js才能启动。
- 如果mysql 与redis有设置密码需要在配置文件中额外填写。
- 需要配置邮箱才能发送邮件 ，且修改`serverUrl`到你对应的网址。
### 运行
```bash
#先配置config/config.js
#先手动运行，确认没有问题再使用pm2部署
cd /var/akoa
npm run dev

pm2 start /var/akoa/src/app.js --name akoa --max-memory-restart 256M

#查看日志
pm2 logs

#查看状态
pm2 imonit
```