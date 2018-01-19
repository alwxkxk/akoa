# akoa
这是个人学习的前后端分离项目，avue为前端，akoa为后端，详细的流程设计文档在`doc`目录下。
# 配置
将config.sample.js配置信息补全并改名为config.js才能启动。
# 启动
```bash
cd /var
git clone https://github.com/alwxkxk/akoa
cd akoa
npm install 
#先配置config/config.js
pm2 start /var/akoa/src/app.js --name akoa --max-memory-restart 256M
#查看状态
pm2 imonit
```